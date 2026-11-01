using BuildingBlocks.Common;
using BuildingBlocks.CQRS;
using Wallet.Application.DTOs;
using Wallet.Domain.Repositories;

namespace Wallet.Application.Queries.GetTransactions;

public record GetTransactionsQuery(Guid UserId, int Limit = 50) : IQuery<IReadOnlyList<WalletTransactionDto>>;

public class GetTransactionsQueryHandler : IQueryHandler<GetTransactionsQuery, IReadOnlyList<WalletTransactionDto>>
{
    private readonly IWalletRepository _walletRepository;

    public GetTransactionsQueryHandler(IWalletRepository walletRepository)
    {
        _walletRepository = walletRepository;
    }

    public async Task<Result<IReadOnlyList<WalletTransactionDto>>> Handle(GetTransactionsQuery request, CancellationToken cancellationToken)
    {
        var wallet = await _walletRepository.GetByUserIdAsync(request.UserId, cancellationToken);
        if (wallet == null)
        {
            return Result.Failure<IReadOnlyList<WalletTransactionDto>>($"Wallet not found for user {request.UserId}.");
        }

        var transactions = await _walletRepository.GetTransactionsByWalletIdAsync(wallet.Id, request.Limit, cancellationToken);

        var dtoList = transactions.Select(t => new WalletTransactionDto(
            t.Id,
            t.WalletId,
            t.Amount,
            t.Type,
            t.BalanceBefore,
            t.BalanceAfter,
            t.ReferenceId,
            t.ReferenceType,
            t.Description,
            t.CreatedAtUtc
        )).ToList();

        return Result.Success<IReadOnlyList<WalletTransactionDto>>(dtoList);
    }
}
