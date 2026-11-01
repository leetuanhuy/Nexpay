using System.Security.Claims;
using BuildingBlocks.Events;
using Identity.API.Data;
using Identity.API.DTOs;
using Identity.API.Services;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserEntity = Identity.API.Entities.User;
using RefreshTokenEntity = Identity.API.Entities.RefreshToken;

namespace Identity.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IdentityDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly IConfiguration _configuration;

    public AuthController(
        IdentityDbContext context,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        IPublishEndpoint publishEndpoint,
        IConfiguration configuration)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _publishEndpoint = publishEndpoint;
        _configuration = configuration;
    }

    /// <summary>
    /// Registers a new user and publishes UserRegisteredIntegrationEvent to RabbitMQ
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        if (await _context.Users.AnyAsync(u => u.Email == normalizedEmail, ct))
        {
            return BadRequest(new { error = $"Email '{request.Email}' is already registered." });
        }

        var passwordHash = _passwordHasher.HashPassword(request.Password);
        var user = UserEntity.Create(normalizedEmail, passwordHash, request.FullName, request.PhoneNumber);

        await _context.Users.AddAsync(user, ct);

        // Generate initial tokens
        var accessToken = _tokenService.GenerateAccessToken(user);
        var rawRefreshToken = _tokenService.GenerateRefreshToken();
        var expiryDays = int.TryParse(_configuration["JwtSettings:RefreshTokenExpiryDays"], out var d) ? d : 7;
        var refreshToken = RefreshTokenEntity.Create(user.Id, rawRefreshToken, DateTime.UtcNow.AddDays(expiryDays));

        await _context.RefreshTokens.AddAsync(refreshToken, ct);
        await _context.SaveChangesAsync(ct);

        // Event-Driven: Publish event to RabbitMQ so Wallet Service can automatically provision a wallet
        await _publishEndpoint.Publish(new UserRegisteredIntegrationEvent(
            EventId: Guid.NewGuid(),
            OccurredOnUtc: DateTime.UtcNow,
            UserId: user.Id,
            Email: user.Email,
            FullName: user.FullName
        ), ct);

        var expiryMinutes = int.TryParse(_configuration["JwtSettings:ExpiryMinutes"], out var m) ? m : 60;
        var response = new AuthResponse(
            AccessToken: accessToken,
            RefreshToken: rawRefreshToken,
            ExpiresInSeconds: expiryMinutes * 60,
            User: new UserDto(user.Id, user.Email, user.FullName, user.Role, user.Status)
        );

        return CreatedAtAction(nameof(GetProfile), null, response);
    }

    /// <summary>
    /// Authenticates a user and returns JWT and Refresh tokens
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, ct);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { error = "Invalid email or password." });
        }

        if (user.Status != "Active")
        {
            return Unauthorized(new { error = $"User account is {user.Status}." });
        }

        var accessToken = _tokenService.GenerateAccessToken(user);
        var rawRefreshToken = _tokenService.GenerateRefreshToken();
        var expiryDays = int.TryParse(_configuration["JwtSettings:RefreshTokenExpiryDays"], out var d) ? d : 7;
        var refreshToken = RefreshTokenEntity.Create(user.Id, rawRefreshToken, DateTime.UtcNow.AddDays(expiryDays));

        await _context.RefreshTokens.AddAsync(refreshToken, ct);
        await _context.SaveChangesAsync(ct);

        var expiryMinutes = int.TryParse(_configuration["JwtSettings:ExpiryMinutes"], out var m) ? m : 60;
        var response = new AuthResponse(
            AccessToken: accessToken,
            RefreshToken: rawRefreshToken,
            ExpiresInSeconds: expiryMinutes * 60,
            User: new UserDto(user.Id, user.Email, user.FullName, user.Role, user.Status)
        );

        return Ok(response);
    }

    /// <summary>
    /// Rotates refresh token and generates a new access token
    /// </summary>
    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        var existingToken = await _context.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == request.RefreshToken, ct);

        if (existingToken == null || !existingToken.IsActive)
        {
            return Unauthorized(new { error = "Invalid or expired refresh token." });
        }

        var user = existingToken.User!;
        var newAccessToken = _tokenService.GenerateAccessToken(user);
        var newRawRefreshToken = _tokenService.GenerateRefreshToken();
        var expiryDays = int.TryParse(_configuration["JwtSettings:RefreshTokenExpiryDays"], out var d) ? d : 7;

        // Revoke old token and create new one
        existingToken.Revoke(newRawRefreshToken);
        var newRefreshToken = RefreshTokenEntity.Create(user.Id, newRawRefreshToken, DateTime.UtcNow.AddDays(expiryDays));

        await _context.RefreshTokens.AddAsync(newRefreshToken, ct);
        await _context.SaveChangesAsync(ct);

        var expiryMinutes = int.TryParse(_configuration["JwtSettings:ExpiryMinutes"], out var m) ? m : 60;
        var response = new AuthResponse(
            AccessToken: newAccessToken,
            RefreshToken: newRawRefreshToken,
            ExpiresInSeconds: expiryMinutes * 60,
            User: new UserDto(user.Id, user.Email, user.FullName, user.Role, user.Status)
        );

        return Ok(response);
    }

    /// <summary>
    /// Retrieves current user profile from JWT claims
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { error = "User identity claim not found in token." });
        }

        var user = await _context.Users.FindAsync(new object[] { userId }, ct);
        if (user == null)
        {
            return NotFound(new { error = "User profile not found." });
        }

        return Ok(new UserDto(user.Id, user.Email, user.FullName, user.Role, user.Status));
    }
}
