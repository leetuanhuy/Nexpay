using BuildingBlocks.Events;
using MassTransit;
using Microsoft.AspNetCore.SignalR;
using Notification.Service.Hubs;
using Notification.Service.Models;

namespace Notification.Service.Consumers;

public class WalletTransferredConsumer : IConsumer<WalletTransferredIntegrationEvent>
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<WalletTransferredConsumer> _logger;

    public WalletTransferredConsumer(
        IHubContext<NotificationHub> hubContext,
        ILogger<WalletTransferredConsumer> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<WalletTransferredIntegrationEvent> context)
    {
        var message = context.Message;
        var senderGroup = $"user-{message.SenderUserId}";
        var receiverGroup = $"user-{message.ReceiverUserId}";

        _logger.LogInformation(
            "[WALLET P2P TRANSFERRED] From User {SenderUserId} to User {ReceiverUserId}: {Amount:N0} VND. Desc: {Description}",
            message.SenderUserId,
            message.ReceiverUserId,
            message.Amount,
            message.Description ?? "N/A"
        );

        // 1. Notify Sender (Debit & Balance drop)
        var senderPayload = new NotificationPayload(
            Id: Guid.NewGuid().ToString("N"),
            Type: "WalletDebited",
            Title: "Transfer Sent",
            Message: $"-{message.Amount:N0} VND transferred. {message.Description ?? ""}".Trim(),
            Amount: -message.Amount,
            BalanceAfter: message.SenderBalanceAfter,
            Reference: message.ReferenceId,
            Timestamp: DateTime.UtcNow
        );

        await _hubContext.Clients.Group(senderGroup).SendAsync("ReceiveNotification", senderPayload, context.CancellationToken);
        await _hubContext.Clients.Group(senderGroup).SendAsync("BalanceUpdated", new
        {
            amount = -message.Amount,
            balance = message.SenderBalanceAfter,
            type = "Debit"
        }, context.CancellationToken);

        // 2. Notify Receiver (Credit & Balance increase)
        var receiverPayload = new NotificationPayload(
            Id: Guid.NewGuid().ToString("N"),
            Type: "WalletCredited",
            Title: "Money Received",
            Message: $"+{message.Amount:N0} VND received. {message.Description ?? ""}".Trim(),
            Amount: message.Amount,
            BalanceAfter: message.ReceiverBalanceAfter,
            Reference: message.ReferenceId,
            Timestamp: DateTime.UtcNow
        );

        await _hubContext.Clients.Group(receiverGroup).SendAsync("ReceiveNotification", receiverPayload, context.CancellationToken);
        await _hubContext.Clients.Group(receiverGroup).SendAsync("BalanceUpdated", new
        {
            amount = message.Amount,
            balance = message.ReceiverBalanceAfter,
            type = "Credit"
        }, context.CancellationToken);
    }
}
