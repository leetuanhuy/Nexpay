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
