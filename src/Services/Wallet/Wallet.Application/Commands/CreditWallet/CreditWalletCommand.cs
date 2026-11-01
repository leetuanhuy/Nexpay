using BuildingBlocks.Common;
using BuildingBlocks.CQRS;
using Wallet.Application.DTOs;
using Wallet.Domain.Repositories;
using Wallet.Domain.Exceptions;

namespace Wallet.Application.Commands.CreditWallet;

public record CreditWalletCommand(
    Guid UserId,
    decimal Amount,
    string Description,
    string? ReferenceId = null
) : ICommand<WalletTransactionDto>;

public class CreditWalletCommandHandler : ICommandHandler<CreditWalletCommand, WalletTransactionDto>
{
    private readonly IWalletRepository _walletRepository;

    public CreditWalletCommandHandler(IWalletRepository walletRepository)
    {
        _walletRepository = walletRepository;
    }

    public async Task<Result<WalletTransactionDto>> Handle(CreditWalletCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var transaction = await _walletRepository.CreditViaProcedureAsync(
                userId: request.UserId,
                amount: request.Amount,
                description: request.Description,
                referenceId: request.ReferenceId,
                referenceType: "Topup",
                cancellationToken: cancellationToken
            );

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
