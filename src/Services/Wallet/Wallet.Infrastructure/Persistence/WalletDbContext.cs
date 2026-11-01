using Microsoft.EntityFrameworkCore;
using Wallet.Domain.Entities;
using DomainWallet = Wallet.Domain.Entities.Wallet;

namespace Wallet.Infrastructure.Persistence;

public class WalletDbContext : DbContext
{
    public WalletDbContext(DbContextOptions<WalletDbContext> options) : base(options)
    {
    }

    public DbSet<DomainWallet> Wallets => Set<DomainWallet>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Cấu hình bảng Wallets
        modelBuilder.Entity<DomainWallet>(builder =>
        {
            builder.ToTable("Wallets");
            builder.HasKey(w => w.Id);

            builder.Property(w => w.UserId).IsRequired();
            builder.HasIndex(w => w.UserId).IsUnique();

            builder.Property(w => w.Balance)
                   .HasPrecision(18, 4)
                   .IsRequired();

            builder.Property(w => w.Currency)
                   .HasMaxLength(3)
                   .IsRequired();

            builder.Property(w => w.Status)
                   .HasMaxLength(50)
                   .IsRequired();

            // Cấu hình RowVersion cho Optimistic Concurrency Control
            builder.Property(w => w.RowVersion)
                   .IsRowVersion()
                   .IsRequired();

            builder.Property(w => w.CreatedAtUtc).IsRequired();
            builder.Property(w => w.UpdatedAtUtc);

            builder.HasMany(w => w.Transactions)
                   .WithOne(t => t.Wallet)
                   .HasForeignKey(t => t.WalletId)
                   .OnDelete(DeleteBehavior.Restrict);
        });

        // Cấu hình bảng WalletTransactions (Sổ cái)
        modelBuilder.Entity<WalletTransaction>(builder =>
        {
            builder.ToTable("WalletTransactions");
            builder.HasKey(t => t.Id);

            builder.Property(t => t.Amount).HasPrecision(18, 4).IsRequired();
            builder.Property(t => t.Type).HasMaxLength(20).IsRequired();
            builder.Property(t => t.BalanceBefore).HasPrecision(18, 4).IsRequired();
            builder.Property(t => t.BalanceAfter).HasPrecision(18, 4).IsRequired();
            builder.Property(t => t.ReferenceId).HasMaxLength(100);
            builder.Property(t => t.ReferenceType).HasMaxLength(50);
            builder.Property(t => t.Description).HasMaxLength(500);
            builder.Property(t => t.CreatedAtUtc).IsRequired();

            builder.HasIndex(t => t.WalletId);
            builder.HasIndex(t => t.ReferenceId);
        });
    }
}

