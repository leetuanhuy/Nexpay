using BuildingBlocks.Common;
using BuildingBlocks.CQRS;
using Wallet.Application.DTOs;
using Wallet.Domain.Repositories;

namespace Wallet.Application.Queries.GetWalletByUserId;

public record GetWalletByUserIdQuery(Guid UserId) : IQuery<WalletDto>;

public class GetWalletByUserIdQueryHandler : IQueryHandler<GetWalletByUserIdQuery, WalletDto>
{
    private readonly IWalletRepository _walletRepository;

    public GetWalletByUserIdQueryHandler(IWalletRepository walletRepository)
    {
        _walletRepository = walletRepository;
    }

    public async Task<Result<WalletDto>> Handle(GetWalletByUserIdQuery request, CancellationToken cancellationToken)
    {
        var wallet = await _walletRepository.GetByUserIdAsync(request.UserId, cancellationToken);
        if (wallet == null)
        {
            return Result.Failure<WalletDto>($"Wallet not found for user {request.UserId}.");
        }

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
