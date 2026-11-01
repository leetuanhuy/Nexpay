namespace BuildingBlocks.Events;

public record UserRegisteredIntegrationEvent(
    Guid EventId,
    DateTime OccurredOnUtc,
    Guid UserId,
    string Email,
    string FullName
) : IIntegrationEvent;
