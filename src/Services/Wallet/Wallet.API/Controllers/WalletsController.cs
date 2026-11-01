using MediatR;
using Microsoft.AspNetCore.Mvc;
using Wallet.Application.Commands.CreateWallet;
using Wallet.Application.Commands.CreditWallet;
using Wallet.Application.Commands.DebitWallet;
using Wallet.Application.Queries.GetTransactions;
using Wallet.Application.Queries.GetWalletByUserId;

namespace Wallet.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WalletsController : ControllerBase
{
    private readonly ISender _sender;

    public WalletsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>
    /// Creates a new wallet for a user
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateWallet([FromBody] CreateWalletRequest request, CancellationToken ct)
    {
        var command = new CreateWalletCommand(request.UserId, request.Currency ?? "VND");
        var result = await _sender.Send(command, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetWalletByUserId), new { userId = result.Value!.UserId }, result.Value);
    }

    /// <summary>
    /// Retrieves wallet details and current balance by UserId
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
    /// Credits money to the wallet via Banking Stored Procedure
    /// </summary>
    [HttpPost("credit")]
    public async Task<IActionResult> CreditWallet([FromBody] CreditWalletRequest request, CancellationToken ct)
    {
        var command = new CreditWalletCommand(
            request.UserId,
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
    /// Debits money from the wallet via Banking Stored Procedure (Pessimistic Lock & Atomic Ledger)
    /// </summary>
    [HttpPost("debit")]
    public async Task<IActionResult> DebitWallet([FromBody] DebitWalletRequest request, CancellationToken ct)
    {
        var command = new DebitWalletCommand(
            request.UserId,
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
    /// Retrieves transaction audit ledger by UserId
    /// </summary>
    [HttpGet("{userId:guid}/transactions")]
    public async Task<IActionResult> GetTransactions(Guid userId, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var query = new GetTransactionsQuery(userId, limit);
        var result = await _sender.Send(query, ct);

        if (result.IsFailure)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }
}

public record CreateWalletRequest(Guid UserId, string? Currency);
public record CreditWalletRequest(Guid UserId, decimal Amount, string? Description, string? ReferenceId);
public record DebitWalletRequest(Guid UserId, decimal Amount, string? Description, string? ReferenceId);
