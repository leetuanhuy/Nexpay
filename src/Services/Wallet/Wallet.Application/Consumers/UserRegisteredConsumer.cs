using BuildingBlocks.Events;
using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using Wallet.Application.Commands.CreateWallet;

namespace Wallet.Application.Consumers;

public class UserRegisteredConsumer : IConsumer<UserRegisteredIntegrationEvent>
{
    private readonly ISender _sender;
    private readonly ILogger<UserRegisteredConsumer> _logger;

    public UserRegisteredConsumer(ISender sender, ILogger<UserRegisteredConsumer> logger)
    {
        _sender = sender;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<UserRegisteredIntegrationEvent> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "New user registered: {UserId} ({Email}). Automatically provisioning wallet...",
            message.UserId,
            message.Email
        );

        var result = await _sender.Send(new CreateWalletCommand(message.UserId, "VND"));

        if (result.IsSuccess)
        {
            _logger.LogInformation("Wallet successfully provisioned for user {UserId}.", message.UserId);
        }
        else
        {
            _logger.LogWarning("Wallet provisioning skipped or failed for user {UserId}: {Error}", message.UserId, result.Error);
        }
    }
}
