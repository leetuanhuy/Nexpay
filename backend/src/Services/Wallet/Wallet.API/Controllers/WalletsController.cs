using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Wallet.Application.Commands.CreateWallet;
using Wallet.Application.Commands.CreditWallet;
using Wallet.Application.Commands.DebitWallet;
using Wallet.Application.Commands.TransferWallet;
using Wallet.Application.Queries.GetTransactions;
using Wallet.Application.Queries.GetWalletByUserId;

namespace Wallet.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WalletsController : ControllerBase
{
    private readonly ISender _sender;

    public WalletsController(ISender sender)
    {
        _sender = sender;
    }

    private Guid CurrentUserId
    {
        get
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (Guid.TryParse(claim, out var userId))
                return userId;

            throw new UnauthorizedAccessException("User identifier claim is missing or invalid in JWT token.");
        }
    }

    /// <summary>
    /// Gets current authenticated user's wallet and balance
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyWallet(CancellationToken ct)
    {
        var query = new GetWalletByUserIdQuery(CurrentUserId);
        var result = await _sender.Send(query, ct);

        if (result.IsFailure)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets wallet details by UserId (Admin or Service lookup)
    /// </summary>
    [HttpGet("{userId:guid}")]
    public async Task<IActionResult> GetWalletByUserId(Guid userId, CancellationToken ct)
    {
        var query = new GetWalletByUserIdQuery(userId);
        var result = await _sender.Send(query, ct);

        if (result.IsFailure)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Explicitly creates a wallet for a user
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateWallet([FromBody] CreateWalletRequest request, CancellationToken ct)
    {
        var targetUserId = request.UserId ?? CurrentUserId;
        var command = new CreateWalletCommand(targetUserId, request.Currency ?? "VND");
        var result = await _sender.Send(command, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetWalletByUserId), new { userId = result.Value!.UserId }, result.Value);
    }

    /// <summary>
    /// Credits money to authenticated user's wallet via Banking Stored Procedure
    /// </summary>
    [HttpPost("credit")]
    public async Task<IActionResult> CreditWallet([FromBody] CreditWalletRequest request, CancellationToken ct)
    {
        var command = new CreditWalletCommand(
            CurrentUserId,
            request.Amount,
            request.Description ?? "Wallet topup",
            request.ReferenceId
        );

        var result = await _sender.Send(command, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Debits money from authenticated user's wallet via Banking Stored Procedure
    /// </summary>
    [HttpPost("debit")]
    public async Task<IActionResult> DebitWallet([FromBody] DebitWalletRequest request, CancellationToken ct)
    {
        var command = new DebitWalletCommand(
            CurrentUserId,
            request.Amount,
            request.Description ?? "Payment transaction",
            request.ReferenceId
        );

        var result = await _sender.Send(command, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Transfers money atomically to another user's wallet via sp_TransferWallet with deadlock prevention
    /// </summary>
    [HttpPost("transfer")]
    public async Task<IActionResult> TransferWallet([FromBody] TransferWalletRequest request, CancellationToken ct)
    {
        var command = new TransferWalletCommand(
            CurrentUserId,
            request.ReceiverUserId,
            request.Amount,
            request.Description ?? "P2P Wallet Transfer",
            request.ReferenceId
        );

        var result = await _sender.Send(command, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Retrieves transaction audit ledger for authenticated user
    /// </summary>
    [HttpGet("transactions")]
    public async Task<IActionResult> GetMyTransactions([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var query = new GetTransactionsQuery(CurrentUserId, limit);
        var result = await _sender.Send(query, ct);

        if (result.IsFailure)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }
}

public record CreateWalletRequest(Guid? UserId, string? Currency);
public record CreditWalletRequest(decimal Amount, string? Description, string? ReferenceId);
public record DebitWalletRequest(decimal Amount, string? Description, string? ReferenceId);
public record TransferWalletRequest(Guid ReceiverUserId, decimal Amount, string? Description, string? ReferenceId);
