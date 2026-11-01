using BuildingBlocks.Events;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Notification.Service.Consumers;

public class WalletDebitedConsumer : IConsumer<WalletDebitedIntegrationEvent>
{
    private readonly ILogger<WalletDebitedConsumer> _logger;

    public WalletDebitedConsumer(ILogger<WalletDebitedConsumer> logger)
    {
        _logger = logger;
    }

    public Task Consume(ConsumeContext<WalletDebitedIntegrationEvent> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "[EMAIL DISPATCHED] User {UserId}: Your wallet was debited by {Amount:N0} VND. Remaining balance: {BalanceAfter:N0} VND. Reference: {ReferenceId}. Description: {Description}",
            message.UserId,
            message.Amount,
            message.BalanceAfter,
            message.ReferenceId ?? "N/A",
            message.Description ?? "No description"
        );

        return Task.CompletedTask;
    }
}
