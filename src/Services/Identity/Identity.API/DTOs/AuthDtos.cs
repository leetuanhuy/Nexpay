namespace Identity.API.DTOs;

public record RegisterRequest(
    string Email,
    string Password,
    string FullName,
    string? PhoneNumber = null
);

public record LoginRequest(
    string Email,
    string Password
);

public record RefreshTokenRequest(
    string RefreshToken
);

public record UserDto(
    Guid Id,
    string Email,
    string FullName,
    string Role,
    string Status
);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresInSeconds,
    UserDto User
);
