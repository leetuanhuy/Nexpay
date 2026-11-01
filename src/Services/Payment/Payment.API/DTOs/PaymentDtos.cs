namespace Payment.API.DTOs;

public record CheckoutRequest(
    decimal Amount,
    string? Description = null,
    string Currency = "VND"
);

public record PaymentAttemptDto(
    Guid Id,
    string Method,
    string Status,
    string? ExternalTransactionId,
    string? RawResponse,
    DateTime CreatedAtUtc
);

public record PaymentOrderDto(
    Guid Id,
    string OrderCode,
    Guid UserId,
    decimal Amount,
    string Currency,
    string Status,
    string? Description,
    string? FailureReason,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    IReadOnlyCollection<PaymentAttemptDto> Attempts
);
