namespace Wallet.Domain.Entities;

public class WalletTransaction
{
    public Guid Id { get; private set; }
    public Guid WalletId { get; private set; }
    public decimal Amount { get; private set; }
    public string Type { get; private set; } = null!; // "Credit" hoặc "Debit"
    public decimal BalanceBefore { get; private set; }
    public decimal BalanceAfter { get; private set; }
    public string? ReferenceId { get; private set; }
    public string? ReferenceType { get; private set; }
    public string? Description { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    // Navigation property for EF Core
    public Wallet? Wallet { get; private set; }

    // Private constructor for EF Core
    private WalletTransaction() { }

    public static WalletTransaction Create(
        Guid walletId,
        decimal amount,
        string type,
        decimal balanceBefore,
        decimal balanceAfter,
        string? referenceId = null,
        string? referenceType = null,
        string? description = null)
    {
        return new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = walletId,
            Amount = amount,
            Type = type,
            BalanceBefore = balanceBefore,
            BalanceAfter = balanceAfter,
            ReferenceId = referenceId,
            ReferenceType = referenceType,
            Description = description,
            CreatedAtUtc = DateTime.UtcNow
        };
    }
}

