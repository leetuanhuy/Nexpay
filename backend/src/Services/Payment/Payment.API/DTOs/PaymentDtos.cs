namespace Payment.API.DTOs;

public record CheckoutRequest(
    decimal Amount,
    string? Description = null,
    string Currency = "VND"
);

public record TopUpOrderRequest(
    decimal Amount,
    string PaymentMethod = "VietQR",
    string? Description = null
);

public record TopUpBankAccountDto(
    string BankName,
    string BankBin,
    string AccountNumber,
    string AccountName,
    string TransferContent
);

public record TopUpOrderResponse(
    Guid OrderId,
    string OrderCode,
    decimal Amount,
    string Currency,
    string Status,
    string PaymentMethod,
    string QrCodeUrl,
    TopUpBankAccountDto BankAccount,
    DateTime ExpiresAtUtc
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
    string OrderType,
    string PaymentMethod,
    string? ExternalTransactionId,
    string? QrCodeUrl,
    string? CheckoutUrl,
    DateTime? ExpiresAtUtc,
    string? Description,
    string? FailureReason,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    IReadOnlyCollection<PaymentAttemptDto> Attempts
);

public record WebhookRequest(
    string Code,
    string Desc,
    Dictionary<string, object?> Data,
    string Signature
);

public record SimulateWebhookRequest(
    string OrderCode,
    string? TransactionId = null
);
