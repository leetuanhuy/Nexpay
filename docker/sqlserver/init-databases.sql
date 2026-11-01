-- =========================================================================
-- Nexpay Microservices Database Initialization Script
-- Databases:
--   1. Nexpay_IdentityDb (User Authentication & Token Management)
--   2. Nexpay_WalletDb   (User Balance & Financial Ledger)
--   3. Nexpay_PaymentDb  (Payment Order & Transaction Processing)
-- =========================================================================

-- 1. TẠO CÁC DATABASE ĐỘC LẬP
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Nexpay_IdentityDb')
    CREATE DATABASE Nexpay_IdentityDb;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Nexpay_WalletDb')
    CREATE DATABASE Nexpay_WalletDb;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Nexpay_PaymentDb')
    CREATE DATABASE Nexpay_PaymentDb;
GO

-- =========================================================================
-- 2. SCHEMA: Nexpay_IdentityDb
-- =========================================================================
USE Nexpay_IdentityDb;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
    CREATE TABLE Users (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Email NVARCHAR(256) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(500) NOT NULL,
        FullName NVARCHAR(150) NOT NULL,
        PhoneNumber NVARCHAR(20) NULL,
        Role NVARCHAR(50) NOT NULL DEFAULT 'User',
        Status NVARCHAR(50) NOT NULL DEFAULT 'Active', -- Active, Suspended, Inactive
        CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAtUtc DATETIME2 NULL
    );
END
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RefreshTokens' AND xtype='U')
BEGIN
    CREATE TABLE RefreshTokens (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        UserId UNIQUEIDENTIFIER NOT NULL,
        Token NVARCHAR(500) NOT NULL,
        ExpiresAtUtc DATETIME2 NOT NULL,
        IsRevoked BIT NOT NULL DEFAULT 0,
        CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        ReplacedByToken NVARCHAR(500) NULL,
        CONSTRAINT FK_RefreshTokens_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_RefreshTokens_UserId ON RefreshTokens(UserId);
END
GO

-- =========================================================================
-- 3. SCHEMA: Nexpay_WalletDb
-- =========================================================================
USE Nexpay_WalletDb;
GO

-- Bảng Ví: Sử dụng RowVersion (timestamp) để chống Race Condition khi trừ tiền đồng thời
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Wallets' AND xtype='U')
BEGIN
    CREATE TABLE Wallets (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        UserId UNIQUEIDENTIFIER NOT NULL UNIQUE,
        Balance DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
        Currency NVARCHAR(3) NOT NULL DEFAULT 'VND',
        Status NVARCHAR(50) NOT NULL DEFAULT 'Active', -- Active, Locked, Frozen
        RowVersion ROWVERSION NOT NULL, -- Dùng cho Optimistic Concurrency Control
        CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAtUtc DATETIME2 NULL,
        CONSTRAINT CK_Wallets_Balance CHECK (Balance >= 0) -- Không bao giờ để âm số dư ở cấp DB
    );
    CREATE INDEX IX_Wallets_UserId ON Wallets(UserId);
END
GO

-- Bảng Sổ cái (Ledger): Ghi nhận toàn bộ biến động tiền tệ (Audit Trail)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='WalletTransactions' AND xtype='U')
BEGIN
    CREATE TABLE WalletTransactions (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        WalletId UNIQUEIDENTIFIER NOT NULL,
        Amount DECIMAL(18, 4) NOT NULL,
        Type NVARCHAR(20) NOT NULL, -- Credit (+), Debit (-)
        BalanceBefore DECIMAL(18, 4) NOT NULL,
        BalanceAfter DECIMAL(18, 4) NOT NULL,
        ReferenceId NVARCHAR(100) NULL, -- ID của PaymentOrder hoặc DepositOrder bên ngoài
        ReferenceType NVARCHAR(50) NULL, -- 'PaymentOrder', 'Topup', 'Transfer'
        Description NVARCHAR(500) NULL,
        CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_WalletTransactions_Wallets FOREIGN KEY (WalletId) REFERENCES Wallets(Id)
    );
    CREATE INDEX IX_WalletTransactions_WalletId ON WalletTransactions(WalletId);
    CREATE INDEX IX_WalletTransactions_ReferenceId ON WalletTransactions(ReferenceId);
END
GO

-- Bảng Transactional Outbox: Đảm bảo Atomicity giữa ghi DB và publish Event lên RabbitMQ
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OutboxMessages' AND xtype='U')
BEGIN
    CREATE TABLE OutboxMessages (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Type NVARCHAR(255) NOT NULL, -- Tên class Event (vd: WalletDebitedEvent)
        Content NVARCHAR(MAX) NOT NULL, -- JSON payload của Event
        OccurredOnUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        ProcessedOnUtc DATETIME2 NULL,
        Error NVARCHAR(MAX) NULL
    );
    CREATE INDEX IX_OutboxMessages_ProcessedOnUtc ON OutboxMessages(ProcessedOnUtc);
END
GO

-- Bảng Idempotent Requests: Tránh duplicate processing khi Client retry request
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='IdempotencyRequests' AND xtype='U')
BEGIN
    CREATE TABLE IdempotencyRequests (
        [Key] NVARCHAR(100) PRIMARY KEY, -- Idempotency-Key từ HTTP Header
        ResponseContent NVARCHAR(MAX) NULL,
        StatusCode INT NOT NULL,
        CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- =========================================================================
-- STORED PROCEDURES (Banking Grade - Pessimistic Locking & Atomic Ledger)
-- =========================================================================

-- 1. CREDIT WALLET
CREATE OR ALTER PROCEDURE sp_CreditWallet
    @UserId UNIQUEIDENTIFIER,
    @Amount DECIMAL(18, 4),
    @ReferenceId NVARCHAR(100) = NULL,
    @ReferenceType NVARCHAR(50) = 'Topup',
    @Description NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;
        DECLARE @WalletId UNIQUEIDENTIFIER;
        DECLARE @CurrentBalance DECIMAL(18, 4);
        DECLARE @Status NVARCHAR(50);

        -- PESSIMISTIC LOCK: Lock the wallet row exclusively (UPDLOCK, ROWLOCK)
        SELECT @WalletId = Id, @CurrentBalance = Balance, @Status = Status
        FROM Wallets WITH (UPDLOCK, ROWLOCK)
        WHERE UserId = @UserId;

        IF (@WalletId IS NULL)
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50001, 'Wallet not found for the specified user.', 1;
        END

        IF (@Status <> 'Active')
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50003, 'Wallet is not active.', 1;
        END

        IF (@Amount <= 0)
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50004, 'Credit amount must be greater than zero.', 1;
        END

        -- Add balance
        DECLARE @NewBalance DECIMAL(18, 4) = @CurrentBalance + @Amount;
        UPDATE Wallets
        SET Balance = @NewBalance,
            UpdatedAtUtc = SYSUTCDATETIME()
        WHERE Id = @WalletId;

        -- Record ledger transaction
        DECLARE @TransactionId UNIQUEIDENTIFIER = NEWID();
        DECLARE @Now DATETIME2 = SYSUTCDATETIME();

        INSERT INTO WalletTransactions (
            Id, WalletId, Amount, Type,
            BalanceBefore, BalanceAfter,
            ReferenceId, ReferenceType, Description, CreatedAtUtc
        )
        VALUES (
            @TransactionId, @WalletId, @Amount, 'Credit',
            @CurrentBalance, @NewBalance,
            @ReferenceId, @ReferenceType, @Description, @Now
        );

    COMMIT TRANSACTION;

    -- Return transaction record
    SELECT
        Id = @TransactionId,
        WalletId = @WalletId,
        Amount = @Amount,
        Type = 'Credit',
        BalanceBefore = @CurrentBalance,
        BalanceAfter = @NewBalance,
        ReferenceId = @ReferenceId,
        ReferenceType = @ReferenceType,
        Description = @Description,
        CreatedAtUtc = @Now;
END;
GO

-- 2. DEBIT WALLET
CREATE OR ALTER PROCEDURE sp_DebitWallet
    @UserId UNIQUEIDENTIFIER,
    @Amount DECIMAL(18, 4),
    @ReferenceId NVARCHAR(100) = NULL,
    @ReferenceType NVARCHAR(50) = 'Payment',
    @Description NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;
        DECLARE @WalletId UNIQUEIDENTIFIER;
        DECLARE @CurrentBalance DECIMAL(18, 4);
        DECLARE @Status NVARCHAR(50);

        -- PESSIMISTIC LOCK: Lock the wallet row exclusively
        SELECT @WalletId = Id, @CurrentBalance = Balance, @Status = Status
        FROM Wallets WITH (UPDLOCK, ROWLOCK)
        WHERE UserId = @UserId;

        IF (@WalletId IS NULL)
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50001, 'Wallet not found for the specified user.', 1;
        END

        IF (@Status <> 'Active')
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50003, 'Wallet is not active.', 1;
        END

        IF (@Amount <= 0)
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50004, 'Debit amount must be greater than zero.', 1;
        END

        IF (@CurrentBalance < @Amount)
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50002, 'Insufficient wallet balance for this transaction.', 1;
        END

        -- Deduct balance
        DECLARE @NewBalance DECIMAL(18, 4) = @CurrentBalance - @Amount;
        UPDATE Wallets
        SET Balance = @NewBalance,
            UpdatedAtUtc = SYSUTCDATETIME()
        WHERE Id = @WalletId;

        -- Record ledger transaction
        DECLARE @TransactionId UNIQUEIDENTIFIER = NEWID();
        DECLARE @Now DATETIME2 = SYSUTCDATETIME();

        INSERT INTO WalletTransactions (
            Id, WalletId, Amount, Type,
            BalanceBefore, BalanceAfter,
            ReferenceId, ReferenceType, Description, CreatedAtUtc
        )
        VALUES (
            @TransactionId, @WalletId, @Amount, 'Debit',
            @CurrentBalance, @NewBalance,
            @ReferenceId, @ReferenceType, @Description, @Now
        );

    COMMIT TRANSACTION;

    -- Return transaction record
    SELECT
        Id = @TransactionId,
        WalletId = @WalletId,
        Amount = @Amount,
        Type = 'Debit',
        BalanceBefore = @CurrentBalance,
        BalanceAfter = @NewBalance,
        ReferenceId = @ReferenceId,
        ReferenceType = @ReferenceType,
        Description = @Description,
        CreatedAtUtc = @Now;
END;
GO

-- =========================================================================
-- 4. SCHEMA: Nexpay_PaymentDb
-- =========================================================================
USE Nexpay_PaymentDb;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PaymentOrders' AND xtype='U')
BEGIN
    CREATE TABLE PaymentOrders (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        OrderCode NVARCHAR(50) NOT NULL UNIQUE,
        UserId UNIQUEIDENTIFIER NOT NULL,
        Amount DECIMAL(18, 4) NOT NULL,
        Currency NVARCHAR(3) NOT NULL DEFAULT 'VND',
        Status NVARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, Processing, Completed, Failed, Cancelled
        Description NVARCHAR(500) NULL,
        FailureReason NVARCHAR(500) NULL,
        CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAtUtc DATETIME2 NULL
    );
    CREATE INDEX IX_PaymentOrders_UserId ON PaymentOrders(UserId);
    CREATE INDEX IX_PaymentOrders_OrderCode ON PaymentOrders(OrderCode);
END
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PaymentAttempts' AND xtype='U')
BEGIN
    CREATE TABLE PaymentAttempts (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PaymentOrderId UNIQUEIDENTIFIER NOT NULL,
        Method NVARCHAR(50) NOT NULL, -- 'InternalWallet', 'MockBankGateway'
        Status NVARCHAR(50) NOT NULL, -- 'Initiated', 'Success', 'Failed'
        ExternalTransactionId NVARCHAR(100) NULL,
        RawResponse NVARCHAR(MAX) NULL,
        CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_PaymentAttempts_PaymentOrders FOREIGN KEY (PaymentOrderId) REFERENCES PaymentOrders(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_PaymentAttempts_PaymentOrderId ON PaymentAttempts(PaymentOrderId);
END
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OutboxMessages' AND xtype='U')
BEGIN
    CREATE TABLE OutboxMessages (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Type NVARCHAR(255) NOT NULL,
        Content NVARCHAR(MAX) NOT NULL,
        OccurredOnUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        ProcessedOnUtc DATETIME2 NULL,
        Error NVARCHAR(MAX) NULL
    );
    CREATE INDEX IX_OutboxMessages_ProcessedOnUtc ON OutboxMessages(ProcessedOnUtc);
END
GO

