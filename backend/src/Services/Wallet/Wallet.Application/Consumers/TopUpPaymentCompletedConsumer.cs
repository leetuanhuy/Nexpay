using BuildingBlocks.Events;
using MassTransit;
using Microsoft.Extensions.Logging;
using Wallet.Domain.Exceptions;
using Wallet.Domain.Repositories;

namespace Wallet.Application.Consumers;

public class TopUpPaymentCompletedConsumer : IConsumer<TopUpPaymentCompletedIntegrationEvent>
{
    private readonly IWalletRepository _walletRepository;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<TopUpPaymentCompletedConsumer> _logger;

    public TopUpPaymentCompletedConsumer(
        IWalletRepository walletRepository,
        IPublishEndpoint publishEndpoint,
        ILogger<TopUpPaymentCompletedConsumer> logger)
    {
        _walletRepository = walletRepository;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<TopUpPaymentCompletedIntegrationEvent> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "[TOPUP SETTLEMENT] Crediting wallet for User {UserId}. Amount: {Amount:N0} {Currency}. OrderCode: {OrderCode}, Method: {Method}",
            message.UserId,
            message.Amount,
            message.Currency,
            message.OrderCode,
            message.PaymentMethod
        );

        try
        {
            // Execute atomic credit via Banking Stored Procedure sp_CreditWallet
            var transaction = await _walletRepository.CreditViaProcedureAsync(
                userId: message.UserId,
                amount: message.Amount,
                description: $"Top-up via {message.PaymentMethod} ({message.OrderCode})",
                referenceId: message.OrderCode,
                referenceType: "Topup",
                cancellationToken: context.CancellationToken
            );

            _logger.LogInformation(
                "[TOPUP SUCCESS] Wallet {WalletId} credited. New balance: {BalanceAfter:N0} VND. TxId: {TxId}",
                transaction.WalletId,
                transaction.BalanceAfter,
                transaction.Id
            );

            // Publish WalletCreditedIntegrationEvent to trigger real-time SignalR notifications & balance sync
            await _publishEndpoint.Publish(new WalletCreditedIntegrationEvent(
                EventId: Guid.NewGuid(),
                OccurredOnUtc: DateTime.UtcNow,
                UserId: message.UserId,
                WalletId: transaction.WalletId,
                Amount: transaction.Amount,
                BalanceBefore: transaction.BalanceBefore,
                BalanceAfter: transaction.BalanceAfter,
                ReferenceId: message.OrderCode,
                Description: transaction.Description
            ), context.CancellationToken);
        }
        catch (WalletDomainException ex)
        {
            _logger.LogError(
                ex,
                "[TOPUP FAILED] Domain exception while crediting wallet for Order {OrderCode}: {Error}",
                message.OrderCode,
                ex.Message
            );
            throw; // Let MassTransit retry or move to dead-letter queue
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "[TOPUP ERROR] Unexpected error crediting wallet for Order {OrderCode}: {Error}",
                message.OrderCode,
                ex.Message
            );
            throw;
        }
    }
}

