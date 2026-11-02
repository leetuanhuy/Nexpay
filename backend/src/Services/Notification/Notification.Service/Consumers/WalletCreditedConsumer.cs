using BuildingBlocks.Events;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using Notification.Service.Hubs;
using Notification.Service.Models;

namespace Notification.Service.Consumers;

public class WalletCreditedConsumer : IConsumer<WalletCreditedIntegrationEvent>
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<WalletCreditedConsumer> _logger;

    public WalletCreditedConsumer(
        IHubContext<NotificationHub> hubContext,
        ILogger<WalletCreditedConsumer> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<WalletCreditedIntegrationEvent> context)
    {
        var message = context.Message;
        var userGroup = $"user-{message.UserId}";

        _logger.LogInformation(
            "[WALLET CREDITED] User {UserId}: +{Amount:N0} VND. New balance: {BalanceAfter:N0} VND. Reference: {ReferenceId}",
            message.UserId,
            message.Amount,
            message.BalanceAfter,
            message.ReferenceId ?? "N/A"
        );

        var payload = new NotificationPayload(
            Id: Guid.NewGuid().ToString("N"),
            Type: "WalletCredited",
            Title: "Deposit Successful",
            Message: $"+{message.Amount:N0} VND has been credited to your wallet.",
            Amount: message.Amount,
            BalanceAfter: message.BalanceAfter,
            Reference: message.ReferenceId,
            Timestamp: DateTime.UtcNow
        );

        // Push real-time notification to user group
        await _hubContext.Clients.Group(userGroup).SendAsync("ReceiveNotification", payload, context.CancellationToken);

        // Push balance update event for instant wallet card refresh without polling
        await _hubContext.Clients.Group(userGroup).SendAsync("BalanceUpdated", new
        {
            amount = message.Amount,
            balance = message.BalanceAfter,
            type = "Credit"
        }, context.CancellationToken);
    }
}
