namespace BuildingBlocks.Events;

public record OrderCreatedIntegrationEvent(
    Guid EventId,
    DateTime OccurredOnUtc,
    Guid OrderId,
    string OrderCode,
    Guid UserId,
    decimal Amount,
    string Currency,
    string? Description
) : IIntegrationEvent;

public record OrderPaymentSucceededIntegrationEvent(
    Guid EventId,
    DateTime OccurredOnUtc,
    Guid OrderId,
    string OrderCode,
    Guid UserId,
    decimal Amount,
    Guid TransactionId
) : IIntegrationEvent;

public record OrderPaymentFailedIntegrationEvent(
    Guid EventId,
    DateTime OccurredOnUtc,
    Guid OrderId,
    string OrderCode,
    Guid UserId,
    decimal Amount,
    string Reason
) : IIntegrationEvent;
