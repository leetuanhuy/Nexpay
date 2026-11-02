namespace Wallet.Domain.Entities;

public record WalletTransferResult(
    Guid SenderTransactionId,
    Guid ReceiverTransactionId,
    Guid SenderWalletId,
    Guid ReceiverWalletId,
    decimal Amount,
    decimal SenderBalanceBefore,
    decimal SenderBalanceAfter,
    decimal ReceiverBalanceBefore,
    decimal ReceiverBalanceAfter,
    DateTime CreatedAtUtc
);

