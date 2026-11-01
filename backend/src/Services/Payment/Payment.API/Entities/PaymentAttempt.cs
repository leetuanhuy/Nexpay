namespace Payment.API.Entities;

public class PaymentAttempt
{
    public Guid Id { get; private set; }
    public Guid PaymentOrderId { get; private set; }
    public string Method { get; private set; } = "InternalWallet";
    public string Status { get; private set; } = "Initiated";
    public string? ExternalTransactionId { get; private set; }
    public string? RawResponse { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public PaymentOrder? PaymentOrder { get; private set; }

    public PaymentAttempt() { }

    public static PaymentAttempt Create(
        Guid paymentOrderId,
        string method,
        string status,
        string? externalTransactionId = null,
        string? rawResponse = null)
    {
        return new PaymentAttempt
        {
            Id = Guid.NewGuid(),
            PaymentOrderId = paymentOrderId,
            Method = method,
            Status = status,
            ExternalTransactionId = externalTransactionId,
            RawResponse = rawResponse,
            CreatedAtUtc = DateTime.UtcNow
        };
    }
}
