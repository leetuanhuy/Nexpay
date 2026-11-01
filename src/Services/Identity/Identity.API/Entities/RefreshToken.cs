namespace Identity.API.Entities;

public class RefreshToken
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string Token { get; private set; } = null!;
    public DateTime ExpiresAtUtc { get; private set; }
    public bool IsRevoked { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public string? ReplacedByToken { get; private set; }

    public User? User { get; private set; }

    private RefreshToken() { }

    public static RefreshToken Create(Guid userId, string token, DateTime expiresAtUtc)
    {
        return new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = token,
            ExpiresAtUtc = expiresAtUtc,
            IsRevoked = false,
            CreatedAtUtc = DateTime.UtcNow
        };
    }

    public void Revoke(string? replacedByToken = null)
    {
        IsRevoked = true;
        ReplacedByToken = replacedByToken;
    }

    public bool IsActive => !IsRevoked && DateTime.UtcNow < ExpiresAtUtc;
}
