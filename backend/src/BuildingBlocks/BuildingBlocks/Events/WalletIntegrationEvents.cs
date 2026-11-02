namespace BuildingBlocks.Events;

public record WalletDebitedIntegrationEvent(
    Guid EventId,
    DateTime OccurredOnUtc,
    Guid UserId,
    Guid WalletId,
    decimal Amount,
    decimal BalanceBefore,
    decimal BalanceAfter,
    string? ReferenceId,
    string? Description
) : IIntegrationEvent;

public record WalletCreditedIntegrationEvent(
    Guid EventId,
    DateTime OccurredOnUtc,
    Guid UserId,
    Guid WalletId,
    decimal Amount,
    decimal BalanceBefore,
    decimal BalanceAfter,
    string? ReferenceId,
    string? Description
) : IIntegrationEvent;

public record WalletTransferredIntegrationEvent(
    Guid EventId,
    DateTime OccurredOnUtc,
    Guid SenderUserId,
    Guid ReceiverUserId,
    Guid SenderWalletId,
    Guid ReceiverWalletId,
    Guid SenderTransactionId,
    Guid ReceiverTransactionId,
    decimal Amount,
    decimal SenderBalanceBefore,
    decimal SenderBalanceAfter,
    decimal ReceiverBalanceBefore,
    decimal ReceiverBalanceAfter,
    string? ReferenceId,
    string? Description
) : IIntegrationEvent;
