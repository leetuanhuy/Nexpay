using BuildingBlocks.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Payment.API.Data;

namespace Payment.API.Consumers;

public class OrderPaymentFailedConsumer : IConsumer<OrderPaymentFailedIntegrationEvent>
{
    private readonly PaymentDbContext _context;
    private readonly ILogger<OrderPaymentFailedConsumer> _logger;

    public OrderPaymentFailedConsumer(PaymentDbContext context, ILogger<OrderPaymentFailedConsumer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderPaymentFailedIntegrationEvent> context)
    {
        var message = context.Message;

        _logger.LogWarning(
            "Saga Finalizing: Payment failed for Order {OrderCode}. Reason: {Reason}. Updating status to FAILED...",
            message.OrderCode,
            message.Reason
        );

        var order = await _context.PaymentOrders
            .Include(o => o.Attempts)
            .FirstOrDefaultAsync(o => o.Id == message.OrderId, context.CancellationToken);

        if (order == null)
        {
            _logger.LogError("Payment order {OrderId} not found in database.", message.OrderId);
            return;
        }

        order.MarkAsFailed(message.Reason);
        await _context.SaveChangesAsync(context.CancellationToken);

        _logger.LogWarning("Order {OrderCode} marked as FAILED with reason: {Reason}.", message.OrderCode, message.Reason);
    }
}

