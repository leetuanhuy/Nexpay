using BuildingBlocks.Events;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using Notification.Service.Hubs;
using Notification.Service.Models;

namespace Notification.Service.Consumers;

public class WalletDebitedConsumer : IConsumer<WalletDebitedIntegrationEvent>
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<WalletDebitedConsumer> _logger;

    public WalletDebitedConsumer(
        IHubContext<NotificationHub> hubContext,
        ILogger<WalletDebitedConsumer> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<WalletDebitedIntegrationEvent> context)
    {
        var message = context.Message;
        var userGroup = $"user-{message.UserId}";

        _logger.LogInformation(
            "[WALLET DEBITED] User {UserId}: -{Amount:N0} VND. Remaining balance: {BalanceAfter:N0} VND. Reference: {ReferenceId}",
            message.UserId,
            message.Amount,
            message.BalanceAfter,
            message.ReferenceId ?? "N/A"
        );

        var payload = new NotificationPayload(
            Id: Guid.NewGuid().ToString("N"),
            Type: "WalletDebited",
            Title: "Payment Debited",
            Message: $"-{message.Amount:N0} VND debited for {message.Description ?? "transaction"}.",
            Amount: -message.Amount,
            BalanceAfter: message.BalanceAfter,
            Reference: message.ReferenceId,
            Timestamp: DateTime.UtcNow
        );

        // Push real-time notification
        await _hubContext.Clients.Group(userGroup).SendAsync("ReceiveNotification", payload, context.CancellationToken);
        await _hubContext.Clients.User(message.UserId.ToString()).SendAsync("ReceiveNotification", payload, context.CancellationToken);

        // Push balance update event
        await _hubContext.Clients.Group(userGroup).SendAsync("BalanceUpdated", new
        {
            amount = -message.Amount,
            balance = message.BalanceAfter,
            type = "Debit"
        }, context.CancellationToken);
    }
}
