using BuildingBlocks.Common;
using BuildingBlocks.CQRS;
using Wallet.Application.DTOs;
using Wallet.Domain.Repositories;
using DomainWallet = Wallet.Domain.Entities.Wallet;

namespace Wallet.Application.Commands.CreateWallet;

public record CreateWalletCommand(Guid UserId, string Currency = "VND") : ICommand<WalletDto>;

public class CreateWalletCommandHandler : ICommandHandler<CreateWalletCommand, WalletDto>
{
    private readonly IWalletRepository _walletRepository;

    public CreateWalletCommandHandler(IWalletRepository walletRepository)
    {
        _walletRepository = walletRepository;
    }

    public async Task<Result<WalletDto>> Handle(CreateWalletCommand request, CancellationToken cancellationToken)
    {
        if (await _walletRepository.ExistsByUserIdAsync(request.UserId, cancellationToken))
        {
            return Result.Failure<WalletDto>($"Wallet already exists for user {request.UserId}.");
        }

        var wallet = DomainWallet.Create(request.UserId, request.Currency);
        await _walletRepository.AddAsync(wallet, cancellationToken);
        await _walletRepository.SaveChangesAsync(cancellationToken);

        var dto = new WalletDto(
            wallet.Id,
            wallet.UserId,
            wallet.Balance,
            wallet.Currency,
            wallet.Status,
            wallet.CreatedAtUtc,
            wallet.UpdatedAtUtc
        );

        return Result.Success(dto);
    }
}
