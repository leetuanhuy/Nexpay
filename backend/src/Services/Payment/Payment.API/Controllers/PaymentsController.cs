using System.Security.Claims;
using BuildingBlocks.Events;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payment.API.Data;
using Payment.API.DTOs;
using Payment.API.Entities;

namespace Payment.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly PaymentDbContext _context;
    private readonly IPublishEndpoint _publishEndpoint;

    public PaymentsController(PaymentDbContext context, IPublishEndpoint publishEndpoint)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
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
    /// Initiates a checkout transaction and starts the distributed payment Saga
    /// </summary>
    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request, CancellationToken ct)
    {
        if (request.Amount <= 0)
        {
            return BadRequest(new { error = "Payment amount must be greater than zero." });
        }

        var order = PaymentOrder.Create(
            userId: CurrentUserId,
            amount: request.Amount,
            description: request.Description ?? "Payment order checkout",
            currency: string.IsNullOrWhiteSpace(request.Currency) ? "VND" : request.Currency.ToUpperInvariant()
        );

        await _context.PaymentOrders.AddAsync(order, ct);
        await _context.SaveChangesAsync(ct);

        // Kick off the distributed Saga by publishing OrderCreatedIntegrationEvent
        await _publishEndpoint.Publish(new OrderCreatedIntegrationEvent(
            EventId: Guid.NewGuid(),
            OccurredOnUtc: DateTime.UtcNow,
            OrderId: order.Id,
            OrderCode: order.OrderCode,
            UserId: order.UserId,
            Amount: order.Amount,
            Currency: order.Currency,
            Description: order.Description
        ), ct);

        var dto = MapToDto(order);
        return CreatedAtAction(nameof(GetOrderById), new { orderId = order.Id }, dto);
    }

    /// <summary>
    /// Gets order details and current Saga payment status
    /// </summary>
    [HttpGet("{orderId:guid}")]
    public async Task<IActionResult> GetOrderById(Guid orderId, CancellationToken ct)
    {
        var order = await _context.PaymentOrders
            .Include(o => o.Attempts)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

        if (order == null)
            return NotFound(new { error = $"Order with id '{orderId}' was not found." });

        if (order.UserId != CurrentUserId)
            return Forbid();

        return Ok(MapToDto(order));
    }

    /// <summary>
    /// Retrieves order history for current authenticated user
    /// </summary>
    [HttpGet("my-orders")]
    public async Task<IActionResult> GetMyOrders([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var orders = await _context.PaymentOrders
            .Include(o => o.Attempts)
            .Where(o => o.UserId == CurrentUserId)
            .OrderByDescending(o => o.CreatedAtUtc)
            .Take(limit)
            .ToListAsync(ct);

        var dtoList = orders.Select(MapToDto).ToList();
        return Ok(dtoList);
    }

    private static PaymentOrderDto MapToDto(PaymentOrder order)
    {
        return new PaymentOrderDto(
            order.Id,
            order.OrderCode,
            order.UserId,
            order.Amount,
            order.Currency,
            order.Status,
            order.Description,
            order.FailureReason,
            order.CreatedAtUtc,
            order.UpdatedAtUtc,
            order.Attempts.Select(a => new PaymentAttemptDto(
                a.Id,
                a.Method,
                a.Status,
                a.ExternalTransactionId,
                a.RawResponse,
                a.CreatedAtUtc
            )).ToList()
        );
    }
}

