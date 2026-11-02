using Wallet.Domain.Entities;
using WalletEntity = Wallet.Domain.Entities.Wallet;

namespace Wallet.Domain.Repositories;

public interface IWalletRepository
{
    Task<WalletEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<WalletEntity?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> ExistsByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddAsync(WalletEntity wallet, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<WalletTransaction>> GetTransactionsByWalletIdAsync(Guid walletId, int limit = 50, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);

    // Stored Procedure methods (Banking style - Pessimistic Lock & Atomic Ledger)
    Task<WalletTransaction> CreditViaProcedureAsync(
        Guid userId,
        decimal amount,
        string description,
        string? referenceId = null,
        string? referenceType = "Topup",
        CancellationToken cancellationToken = default);

    Task<WalletTransaction> DebitViaProcedureAsync(
        Guid userId,
        decimal amount,
        string description,
        string? referenceId = null,
        string? referenceType = "Payment",
        CancellationToken cancellationToken = default);

    Task<WalletTransferResult> TransferViaProcedureAsync(
        Guid senderUserId,
        Guid receiverUserId,
        decimal amount,
        string description,
        string? referenceId = null,
        CancellationToken cancellationToken = default);
}
