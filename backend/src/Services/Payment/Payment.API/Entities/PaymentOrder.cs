namespace Payment.API.Entities;

public class PaymentOrder
{
    public Guid Id { get; private set; }
    public string OrderCode { get; private set; } = null!;
    public Guid UserId { get; private set; }
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = "VND";
    public string Status { get; private set; } = "Pending"; // "Pending", "Completed", "Failed"
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
            Description = description,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public PaymentAttempt MarkAsCompleted(string? transactionId = null)
    {
        Status = "Completed";
        UpdatedAtUtc = DateTime.UtcNow;

        var attempt = PaymentAttempt.Create(
            paymentOrderId: Id,
            method: "InternalWallet",
            status: "Success",
            externalTransactionId: transactionId
        );
        _attempts.Add(attempt);
        return attempt;
    }

    public PaymentAttempt MarkAsFailed(string reason)
    {
        Status = "Failed";
        FailureReason = reason;
        UpdatedAtUtc = DateTime.UtcNow;

        var attempt = PaymentAttempt.Create(
            paymentOrderId: Id,
            method: "InternalWallet",
            status: "Failed",
            rawResponse: reason
        );
        _attempts.Add(attempt);
        return attempt;
    }
}
