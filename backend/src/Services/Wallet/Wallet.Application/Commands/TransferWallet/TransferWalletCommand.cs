using BuildingBlocks.Common;
using BuildingBlocks.CQRS;
using BuildingBlocks.Events;
using MassTransit;
using Wallet.Application.DTOs;
using Wallet.Domain.Repositories;
using Wallet.Domain.Exceptions;

namespace Wallet.Application.Commands.TransferWallet;

public record TransferWalletCommand(
    Guid SenderUserId,
    Guid ReceiverUserId,
    decimal Amount,
    string Description,
    string? ReferenceId = null
) : ICommand<WalletTransferDto>;

public record WalletTransferDto(
    Guid SenderTransactionId,
    Guid ReceiverTransactionId,
    Guid SenderWalletId,
    Guid ReceiverWalletId,
    decimal Amount,
    decimal SenderBalanceBefore,
    decimal SenderBalanceAfter,
    decimal ReceiverBalanceBefore,
    decimal ReceiverBalanceAfter,
    DateTime CreatedAtUtc
);

public class TransferWalletCommandHandler : ICommandHandler<TransferWalletCommand, WalletTransferDto>
{
    private readonly IWalletRepository _walletRepository;
    private readonly IPublishEndpoint _publishEndpoint;

    public TransferWalletCommandHandler(
        IWalletRepository walletRepository,
        IPublishEndpoint publishEndpoint)
    {
        _walletRepository = walletRepository;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<Result<WalletTransferDto>> Handle(TransferWalletCommand request, CancellationToken cancellationToken)
    {
        if (request.SenderUserId == request.ReceiverUserId)
        {
            return Result.Failure<WalletTransferDto>("Cannot transfer money to your own wallet.");
        }

        if (request.Amount <= 0)
        {
            return Result.Failure<WalletTransferDto>("Transfer amount must be greater than zero.");
        }

        try
        {
            var result = await _walletRepository.TransferViaProcedureAsync(
                senderUserId: request.SenderUserId,
                receiverUserId: request.ReceiverUserId,
                amount: request.Amount,
                description: request.Description,
                referenceId: request.ReferenceId,
                cancellationToken: cancellationToken
            );

            // Publish Integration Event to RabbitMQ for real-time notification push to both users
            await _publishEndpoint.Publish(new WalletTransferredIntegrationEvent(
                EventId: Guid.NewGuid(),
                OccurredOnUtc: result.CreatedAtUtc,
                SenderUserId: request.SenderUserId,
                ReceiverUserId: request.ReceiverUserId,
                SenderWalletId: result.SenderWalletId,
                ReceiverWalletId: result.ReceiverWalletId,
                SenderTransactionId: result.SenderTransactionId,
                ReceiverTransactionId: result.ReceiverTransactionId,
                Amount: result.Amount,
                SenderBalanceBefore: result.SenderBalanceBefore,
                SenderBalanceAfter: result.SenderBalanceAfter,
                ReceiverBalanceBefore: result.ReceiverBalanceBefore,
                ReceiverBalanceAfter: result.ReceiverBalanceAfter,
                ReferenceId: request.ReferenceId,
                Description: request.Description
            ), cancellationToken);

            var dto = new WalletTransferDto(
                result.SenderTransactionId,
                result.ReceiverTransactionId,
                result.SenderWalletId,
                result.ReceiverWalletId,
                result.Amount,
                result.SenderBalanceBefore,
                result.SenderBalanceAfter,
                result.ReceiverBalanceBefore,
                result.ReceiverBalanceAfter,
                result.CreatedAtUtc
            );

            return Result.Success(dto);
        }
        catch (WalletDomainException ex)
        {
            return Result.Failure<WalletTransferDto>(ex.Message);
        }
    }
}

