namespace Payment.API.Entities;

public class PaymentOrder
{
    public Guid Id { get; private set; }
    public string OrderCode { get; private set; } = null!;
    public Guid UserId { get; private set; }
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = "VND";
    public string Status { get; private set; } = "Pending"; // "Pending", "Completed", "Failed", "Cancelled"
    public string OrderType { get; private set; } = "Checkout"; // "Checkout", "TopUp"
    public string PaymentMethod { get; private set; } = "InternalWallet"; // "InternalWallet", "VietQR", "PayOS"
    public string? ExternalTransactionId { get; private set; }
    public string? QrCodeUrl { get; private set; }
    public string? CheckoutUrl { get; private set; }
    public DateTime? ExpiresAtUtc { get; private set; }
    public string? Description { get; private set; }
    public string? FailureReason { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? UpdatedAtUtc { get; private set; }

    private readonly List<PaymentAttempt> _attempts = new();
    public IReadOnlyCollection<PaymentAttempt> Attempts => _attempts.AsReadOnly();

    private PaymentOrder() { }

    public static PaymentOrder Create(Guid userId, decimal amount, string? description, string currency = "VND")
    {
        var randomSuffix = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
        var code = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{randomSuffix}";

        return new PaymentOrder
        {
            Id = Guid.NewGuid(),
            OrderCode = code,
            UserId = userId,
            Amount = amount,
            Currency = currency,
            Status = "Pending",
            OrderType = "Checkout",
            PaymentMethod = "InternalWallet",
            Description = description,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public static PaymentOrder CreateTopUp(
        Guid userId,
        decimal amount,
        string paymentMethod = "VietQR",
        string? qrCodeUrl = null,
        string? checkoutUrl = null,
        string? description = null,
        int expiresInMinutes = 15,
        string currency = "VND")
    {
        var randomSuffix = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
        var code = $"TOPUP-{DateTime.UtcNow:yyMMdd}-{randomSuffix}";

        return new PaymentOrder
        {
            Id = Guid.NewGuid(),
            OrderCode = code,
            UserId = userId,
            Amount = amount,
            Currency = currency,
            Status = "Pending",
            OrderType = "TopUp",
            PaymentMethod = paymentMethod,
            QrCodeUrl = qrCodeUrl,
            CheckoutUrl = checkoutUrl,
            Description = description ?? $"Nexpay Wallet Top-Up ({code})",
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(expiresInMinutes),
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public PaymentAttempt MarkAsCompleted(string? transactionId = null, string? method = null)
    {
        Status = "Completed";
        UpdatedAtUtc = DateTime.UtcNow;
        ExternalTransactionId = transactionId ?? ExternalTransactionId;

        var attempt = PaymentAttempt.Create(
            paymentOrderId: Id,
            method: method ?? PaymentMethod,
            status: "Success",
            externalTransactionId: transactionId
        );
        _attempts.Add(attempt);
        return attempt;
    }

    public PaymentAttempt MarkAsFailed(string reason, string? method = null)
    {
        Status = "Failed";
        FailureReason = reason;
        UpdatedAtUtc = DateTime.UtcNow;

        var attempt = PaymentAttempt.Create(
            paymentOrderId: Id,
            method: method ?? PaymentMethod,
            status: "Failed",
            rawResponse: reason
        );
        _attempts.Add(attempt);
        return attempt;
    }
}
