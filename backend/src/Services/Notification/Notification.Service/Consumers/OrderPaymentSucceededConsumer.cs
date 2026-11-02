using BuildingBlocks.Events;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using Notification.Service.Hubs;
using Notification.Service.Models;

namespace Notification.Service.Consumers;

public class OrderPaymentSucceededConsumer : IConsumer<OrderPaymentSucceededIntegrationEvent>
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<OrderPaymentSucceededConsumer> _logger;

    public OrderPaymentSucceededConsumer(
        IHubContext<NotificationHub> hubContext,
        ILogger<OrderPaymentSucceededConsumer> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderPaymentSucceededIntegrationEvent> context)
    {
        var message = context.Message;
        var userGroup = $"user-{message.UserId}";

        _logger.LogInformation(
            "[ORDER COMPLETED] User {UserId}: Order {OrderCode}, Amount: {Amount:N0} VND. Transaction: {TransactionId}",
            message.UserId,
            message.OrderCode,
            message.Amount,
            message.TransactionId
        );

        var payload = new NotificationPayload(
            Id: Guid.NewGuid().ToString("N"),
            Type: "OrderCompleted",
            Title: "Order Paid Successfully",
            Message: $"Order #{message.OrderCode} ({message.Amount:N0} VND) has been processed via Saga Choreography.",
            Amount: message.Amount,
            BalanceAfter: null,
            Reference: message.OrderCode,
            Timestamp: DateTime.UtcNow
        );

        // Push real-time notification
        await _hubContext.Clients.Group(userGroup).SendAsync("ReceiveNotification", payload, context.CancellationToken);
        await _hubContext.Clients.User(message.UserId.ToString()).SendAsync("ReceiveNotification", payload, context.CancellationToken);

        // Push direct order status completion event
        await _hubContext.Clients.Group(userGroup).SendAsync("OrderCompleted", new
        {
            orderId = message.OrderId,
            orderCode = message.OrderCode,
            amount = message.Amount,
            transactionId = message.TransactionId
        }, context.CancellationToken);
    }
}
