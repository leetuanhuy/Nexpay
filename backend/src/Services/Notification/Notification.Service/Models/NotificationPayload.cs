namespace Notification.Service.Models;

public record NotificationPayload(
    string Id,
    string Type,
    string Title,
    string Message,
    decimal? Amount,
    decimal? BalanceAfter,
    string? Reference,
    DateTime Timestamp,
    bool IsRead = false
);

