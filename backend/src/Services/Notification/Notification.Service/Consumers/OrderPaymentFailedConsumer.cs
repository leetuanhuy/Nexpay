using BuildingBlocks.Events;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using Notification.Service.Hubs;
using Notification.Service.Models;

namespace Notification.Service.Consumers;

public class OrderPaymentFailedConsumer : IConsumer<OrderPaymentFailedIntegrationEvent>
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<OrderPaymentFailedConsumer> _logger;

    public OrderPaymentFailedConsumer(
        IHubContext<NotificationHub> hubContext,
        ILogger<OrderPaymentFailedConsumer> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderPaymentFailedIntegrationEvent> context)
    {
        var message = context.Message;
        var userGroup = $"user-{message.UserId}";

        _logger.LogWarning(
            "[ORDER FAILED] User {UserId}: Order {OrderCode}, Amount: {Amount:N0} VND. Reason: {Reason}",
            message.UserId,
            message.OrderCode,
            message.Amount,
            message.Reason
        );

        var payload = new NotificationPayload(
            Id: Guid.NewGuid().ToString("N"),
            Type: "OrderFailed",
            Title: "Order Payment Failed",
            Message: $"Order #{message.OrderCode} was cancelled: {message.Reason}. Balance restored.",
            Amount: message.Amount,
            BalanceAfter: null,
            Reference: message.OrderCode,
            Timestamp: DateTime.UtcNow
        );

        // Push real-time notification
        await _hubContext.Clients.Group(userGroup).SendAsync("ReceiveNotification", payload, context.CancellationToken);

        // Push direct order status failure event
        await _hubContext.Clients.Group(userGroup).SendAsync("OrderFailed", new
        {
            orderId = message.OrderId,
            orderCode = message.OrderCode,
            reason = message.Reason
        }, context.CancellationToken);
    }
}

