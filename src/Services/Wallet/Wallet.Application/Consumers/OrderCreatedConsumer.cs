using BuildingBlocks.Events;
using MassTransit;
using Microsoft.Extensions.Logging;
using Wallet.Domain.Exceptions;
using Wallet.Domain.Repositories;

namespace Wallet.Application.Consumers;

public class OrderCreatedConsumer : IConsumer<OrderCreatedIntegrationEvent>
{
    private readonly IWalletRepository _walletRepository;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<OrderCreatedConsumer> _logger;

    public OrderCreatedConsumer(
        IWalletRepository walletRepository,
        IPublishEndpoint publishEndpoint,
        ILogger<OrderCreatedConsumer> logger)
    {
        _walletRepository = walletRepository;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderCreatedIntegrationEvent> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "Processing Saga payment for Order {OrderCode}, Amount: {Amount:N0} {Currency}, User: {UserId}",
            message.OrderCode,
            message.Amount,
            message.Currency,
            message.UserId
        );

        try
        {
            // Execute debit via Banking Stored Procedure with Pessimistic Lock
            var transaction = await _walletRepository.DebitViaProcedureAsync(
                userId: message.UserId,
                amount: message.Amount,
                description: $"Payment for order {message.OrderCode}",
                referenceId: message.OrderCode,
                referenceType: "PaymentOrder",
                cancellationToken: context.CancellationToken
            );

            _logger.LogInformation(
                "Saga Step Succeeded: Wallet debited for Order {OrderCode}. Transaction: {TransactionId}",
                message.OrderCode,
                transaction.Id
            );

            // Publish success event back to Saga
            await _publishEndpoint.Publish(new OrderPaymentSucceededIntegrationEvent(
                EventId: Guid.NewGuid(),
                OccurredOnUtc: DateTime.UtcNow,
                OrderId: message.OrderId,
                OrderCode: message.OrderCode,
                UserId: message.UserId,
                Amount: message.Amount,
                TransactionId: transaction.Id
            ), context.CancellationToken);
        }
        catch (WalletDomainException ex)
        {
            _logger.LogWarning(
                "Saga Step Failed: Insufficient funds or error for Order {OrderCode}: {Reason}",
                message.OrderCode,
                ex.Message
            );

            // Publish failure event back to Saga (kích hoạt bù trừ / đánh dấu thất bại)
            await _publishEndpoint.Publish(new OrderPaymentFailedIntegrationEvent(
                EventId: Guid.NewGuid(),
                OccurredOnUtc: DateTime.UtcNow,
                OrderId: message.OrderId,
                OrderCode: message.OrderCode,
                UserId: message.UserId,
                Amount: message.Amount,
                Reason: ex.Message
            ), context.CancellationToken);
        }
    }
}
