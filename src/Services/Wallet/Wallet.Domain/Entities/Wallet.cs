using Wallet.Domain.Exceptions;

namespace Wallet.Domain.Entities;

public class Wallet
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public decimal Balance { get; private set; }
    public string Currency { get; private set; } = "VND";
    public string Status { get; private set; } = "Active"; // "Active", "Locked", "Frozen"
    
    // Concurrency Token (Maps to RowVersion column in SQL Server for Optimistic Concurrency Control)
    public byte[] RowVersion { get; private set; } = null!;
    
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? UpdatedAtUtc { get; private set; }

    // Navigation property
    private readonly List<WalletTransaction> _transactions = new();
    public IReadOnlyCollection<WalletTransaction> Transactions => _transactions.AsReadOnly();

    private Wallet() { }

    public static Wallet Create(Guid userId, string currency = "VND")
    {
        return new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Balance = 0m,
            Currency = string.IsNullOrWhiteSpace(currency) ? "VND" : currency.ToUpperInvariant(),
            Status = "Active",
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Credits money to the wallet
    /// </summary>
    public WalletTransaction Credit(decimal amount, string description, string? referenceId = null, string? referenceType = "Topup")
    {
        if (Status != "Active")
            throw new WalletDomainException($"Wallet status is {Status}. Transactions are not permitted.");

        if (amount <= 0)
            throw new WalletDomainException("Credit amount must be greater than zero.");

        var balanceBefore = Balance;
        Balance += amount;
        var balanceAfter = Balance;
        UpdatedAtUtc = DateTime.UtcNow;

        var transaction = WalletTransaction.Create(
            walletId: Id,
            amount: amount,
            type: "Credit",
            balanceBefore: balanceBefore,
            balanceAfter: balanceAfter,
            referenceId: referenceId,
            referenceType: referenceType,
            description: description
        );

        _transactions.Add(transaction);
        return transaction;
    }

    /// <summary>
    /// Debits money from the wallet after verifying sufficient balance
    /// </summary>
    public WalletTransaction Debit(decimal amount, string description, string? referenceId = null, string? referenceType = "Payment")
    {
        if (Status != "Active")
            throw new WalletDomainException($"Wallet status is {Status}. Transactions are not permitted.");

        if (amount <= 0)
            throw new WalletDomainException("Debit amount must be greater than zero.");

        if (Balance < amount)
            throw new WalletDomainException($"Insufficient funds. Current balance: {Balance} {Currency}, required: {amount} {Currency}.");

        var balanceBefore = Balance;
        Balance -= amount;
        var balanceAfter = Balance;
        UpdatedAtUtc = DateTime.UtcNow;

        var transaction = WalletTransaction.Create(
            walletId: Id,
            amount: amount,
            type: "Debit",
            balanceBefore: balanceBefore,
            balanceAfter: balanceAfter,
            referenceId: referenceId,
            referenceType: referenceType,
            description: description
        );

        _transactions.Add(transaction);
        return transaction;
    }
}
