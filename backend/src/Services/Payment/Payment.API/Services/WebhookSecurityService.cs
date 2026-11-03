using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Payment.API.Services;

public interface IWebhookSecurityService
{
    string ComputeSignature(IDictionary<string, object?> data);
    bool VerifySignature(IDictionary<string, object?> data, string providedSignature);
    string SecretKey { get; }
}

public class WebhookSecurityService : IWebhookSecurityService
{
    private readonly string _secretKey;

    public string SecretKey => _secretKey;

    public WebhookSecurityService(IConfiguration configuration)
    {
        _secretKey = configuration["PaymentSettings:WebhookChecksumKey"] 
            ?? "nexpay_super_secret_webhook_checksum_key_2026";
    }

    public string ComputeSignature(IDictionary<string, object?> data)
    {
        // Standard FinTech/PayOS signature algorithm:
        // 1. Sort dictionary keys alphabetically
        // 2. Build query string: key1=val1&key2=val2...
        // 3. HMAC-SHA256 hash using secretKey
        var sortedPairs = data
            .Where(kvp => kvp.Value != null && !string.Equals(kvp.Key, "signature", StringComparison.OrdinalIgnoreCase))
            .OrderBy(kvp => kvp.Key, StringComparer.Ordinal)
            .Select(kvp =>
            {
                var valStr = kvp.Value switch
                {
                    JsonElement je when je.ValueKind == JsonValueKind.String => je.GetString(),
                    JsonElement je when je.ValueKind == JsonValueKind.Number => je.GetRawText(),
                    JsonElement je when je.ValueKind == JsonValueKind.True => "true",
                    JsonElement je when je.ValueKind == JsonValueKind.False => "false",
                    _ => kvp.Value?.ToString()
                };
                return $"{kvp.Key}={valStr}";
            });

        var rawSignString = string.Join("&", sortedPairs);

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_secretKey));
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(rawSignString));
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    public bool VerifySignature(IDictionary<string, object?> data, string providedSignature)
    {
        if (string.IsNullOrWhiteSpace(providedSignature))
            return false;

        var computed = ComputeSignature(data);

        var computedBytes = Encoding.UTF8.GetBytes(computed);
        var providedBytes = Encoding.UTF8.GetBytes(providedSignature.Trim().ToLowerInvariant());

        if (computedBytes.Length != providedBytes.Length)
            return false;

        return CryptographicOperations.FixedTimeEquals(computedBytes, providedBytes);
    }
}

