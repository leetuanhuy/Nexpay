using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Wallet.Domain.Entities;
using Wallet.Domain.Exceptions;
using Wallet.Domain.Repositories;
using Wallet.Infrastructure.Persistence;
using WalletEntity = Wallet.Domain.Entities.Wallet;

namespace Wallet.Infrastructure.Repositories;

public class WalletRepository : IWalletRepository
{
    private readonly WalletDbContext _context;

    public WalletRepository(WalletDbContext context)
    {
        _context = context;
    }

    public async Task<WalletEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Wallets
            .Include(w => w.Transactions)
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
    }

    public async Task<WalletEntity?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Wallets
            .FirstOrDefaultAsync(w => w.UserId == userId, cancellationToken);
    }

    public async Task<bool> ExistsByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Wallets
            .AnyAsync(w => w.UserId == userId, cancellationToken);
    }

    public async Task AddAsync(WalletEntity wallet, CancellationToken cancellationToken = default)
    {
        await _context.Wallets.AddAsync(wallet, cancellationToken);
    }

    public async Task<IReadOnlyList<WalletTransaction>> GetTransactionsByWalletIdAsync(
        Guid walletId,
        int limit = 50,
        CancellationToken cancellationToken = default)
    {
        return await _context.WalletTransactions
            .Where(t => t.WalletId == walletId)
            .OrderByDescending(t => t.CreatedAtUtc)
            .Take(limit)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Executes credit transaction via Stored Procedure sp_CreditWallet with Pessimistic Lock (UPDLOCK, ROWLOCK)
    /// </summary>
    public async Task<WalletTransaction> CreditViaProcedureAsync(
        Guid userId,
        decimal amount,
        string description,
        string? referenceId = null,
        string? referenceType = "Topup",
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _context.WalletTransactions
                .FromSqlInterpolated($"EXEC sp_CreditWallet @UserId={userId}, @Amount={amount}, @ReferenceId={referenceId}, @ReferenceType={referenceType}, @Description={description}")
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            return result.FirstOrDefault() ?? throw new WalletDomainException("Credit stored procedure executed but failed to return a transaction record.");
        }
        catch (SqlException ex)
        {
            throw new WalletDomainException(ex.Message);
        }
    }

    /// <summary>
    /// Executes debit transaction via Stored Procedure sp_DebitWallet with Pessimistic Lock (UPDLOCK, ROWLOCK)
    /// </summary>
    public async Task<WalletTransaction> DebitViaProcedureAsync(
        Guid userId,
        decimal amount,
        string description,
        string? referenceId = null,
        string? referenceType = "Payment",
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _context.WalletTransactions
                .FromSqlInterpolated($"EXEC sp_DebitWallet @UserId={userId}, @Amount={amount}, @ReferenceId={referenceId}, @ReferenceType={referenceType}, @Description={description}")
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            return result.FirstOrDefault() ?? throw new WalletDomainException("Debit stored procedure executed but failed to return a transaction record.");
        }
        catch (SqlException ex)
        {
            throw new WalletDomainException(ex.Message);
        }
    }

    /// <summary>
    /// Executes atomic P2P transfer between two wallets via sp_TransferWallet with monotonic row locks
    /// </summary>
    public async Task<WalletTransferResult> TransferViaProcedureAsync(
        Guid senderUserId,
        Guid receiverUserId,
        decimal amount,
        string description,
        string? referenceId = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _context.Database
                .SqlQuery<WalletTransferResult>($"EXEC sp_TransferWallet @SenderUserId={senderUserId}, @ReceiverUserId={receiverUserId}, @Amount={amount}, @Description={description}, @ReferenceId={referenceId}")
                .ToListAsync(cancellationToken);

            return result.FirstOrDefault() ?? throw new WalletDomainException("Transfer stored procedure executed but failed to return a result record.");
        }
        catch (SqlException ex)
        {
            throw new WalletDomainException(ex.Message);
        }
    }
}
