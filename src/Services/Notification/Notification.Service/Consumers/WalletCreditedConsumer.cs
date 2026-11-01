using BuildingBlocks.Events;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Notification.Service.Consumers;

public class WalletCreditedConsumer : IConsumer<WalletCreditedIntegrationEvent>
{
    private readonly ILogger<WalletCreditedConsumer> _logger;

    public WalletCreditedConsumer(ILogger<WalletCreditedConsumer> logger)
    {
        _logger = logger;
    }

    public Task Consume(ConsumeContext<WalletCreditedIntegrationEvent> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "[EMAIL DISPATCHED] User {UserId}: Your wallet was credited by {Amount:N0} VND. New balance: {BalanceAfter:N0} VND. Reference: {ReferenceId}. Description: {Description}",
            message.UserId,
            message.Amount,
            message.BalanceAfter,
            message.ReferenceId ?? "N/A",
            message.Description ?? "No description"
        );

        return Task.CompletedTask;
    }
}

