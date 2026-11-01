namespace Wallet.Application.DTOs;

public record WalletDto(
    Guid Id,
    Guid UserId,
    decimal Balance,
    string Currency,
    string Status,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc
);

public record WalletTransactionDto(
    Guid Id,
    Guid WalletId,
    decimal Amount,
    string Type,
    decimal BalanceBefore,
    decimal BalanceAfter,
    string? ReferenceId,
    string? ReferenceType,
    string? Description,
    DateTime CreatedAtUtc
);

