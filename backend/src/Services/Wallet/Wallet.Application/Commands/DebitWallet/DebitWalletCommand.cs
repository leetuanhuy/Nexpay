using BuildingBlocks.Common;
using BuildingBlocks.CQRS;
using BuildingBlocks.Events;
using MassTransit;
using Wallet.Application.DTOs;
using Wallet.Domain.Repositories;
using Wallet.Domain.Exceptions;

namespace Wallet.Application.Commands.DebitWallet;

public record DebitWalletCommand(
    Guid UserId,
    decimal Amount,
    string Description,
    string? ReferenceId = null
) : ICommand<WalletTransactionDto>;

public class DebitWalletCommandHandler : ICommandHandler<DebitWalletCommand, WalletTransactionDto>
{
    private readonly IWalletRepository _walletRepository;
    private readonly IPublishEndpoint _publishEndpoint;

    public DebitWalletCommandHandler(IWalletRepository walletRepository, IPublishEndpoint publishEndpoint)
    {
        _walletRepository = walletRepository;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<Result<WalletTransactionDto>> Handle(DebitWalletCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var transaction = await _walletRepository.DebitViaProcedureAsync(
                userId: request.UserId,
                amount: request.Amount,
                description: request.Description,
                referenceId: request.ReferenceId,
                referenceType: "Payment",
                cancellationToken: cancellationToken
            );

            // Publish Integration Event to RabbitMQ
            await _publishEndpoint.Publish(new WalletDebitedIntegrationEvent(
                EventId: Guid.NewGuid(),
                OccurredOnUtc: DateTime.UtcNow,
                UserId: request.UserId,
                WalletId: transaction.WalletId,
                Amount: transaction.Amount,
                BalanceBefore: transaction.BalanceBefore,
                BalanceAfter: transaction.BalanceAfter,
                ReferenceId: transaction.ReferenceId,
                Description: transaction.Description
            ), cancellationToken);

            var dto = new WalletTransactionDto(
                transaction.Id,
                transaction.WalletId,
                transaction.Amount,
                transaction.Type,
                transaction.BalanceBefore,
                transaction.BalanceAfter,
                transaction.ReferenceId,
                transaction.ReferenceType,
                transaction.Description,
                transaction.CreatedAtUtc
            );

            return Result.Success(dto);
        }
        catch (WalletDomainException ex)
        {
            return Result.Failure<WalletTransactionDto>(ex.Message);
        }
    }
}
