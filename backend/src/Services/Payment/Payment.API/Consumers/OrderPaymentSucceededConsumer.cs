using BuildingBlocks.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Payment.API.Data;

namespace Payment.API.Consumers;

public class OrderPaymentSucceededConsumer : IConsumer<OrderPaymentSucceededIntegrationEvent>
{
    private readonly PaymentDbContext _context;
    private readonly ILogger<OrderPaymentSucceededConsumer> _logger;

    public OrderPaymentSucceededConsumer(PaymentDbContext context, ILogger<OrderPaymentSucceededConsumer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderPaymentSucceededIntegrationEvent> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "Saga Finalizing: Payment succeeded for Order {OrderCode}. Updating status to COMPLETED...",
            message.OrderCode
        );

        var order = await _context.PaymentOrders
            .Include(o => o.Attempts)
            .FirstOrDefaultAsync(o => o.Id == message.OrderId, context.CancellationToken);

        if (order == null)
        {
            _logger.LogError("Payment order {OrderId} not found in database.", message.OrderId);
            return;
        }

        order.MarkAsCompleted(message.TransactionId.ToString());
        await _context.SaveChangesAsync(context.CancellationToken);

        _logger.LogInformation("Order {OrderCode} marked as COMPLETED successfully.", message.OrderCode);
    }
}

