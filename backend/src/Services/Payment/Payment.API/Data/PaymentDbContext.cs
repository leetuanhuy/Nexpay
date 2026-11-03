using Microsoft.EntityFrameworkCore;
using Payment.API.Entities;

namespace Payment.API.Data;

public class PaymentDbContext : DbContext
{
    public PaymentDbContext(DbContextOptions<PaymentDbContext> options) : base(options)
    {
    }

    public DbSet<PaymentOrder> PaymentOrders => Set<PaymentOrder>();
    public DbSet<PaymentAttempt> PaymentAttempts => Set<PaymentAttempt>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<PaymentOrder>(builder =>
        {
            builder.ToTable("PaymentOrders");
            builder.HasKey(o => o.Id);
            builder.Property(o => o.Id).ValueGeneratedNever();

            builder.Property(o => o.OrderCode).HasMaxLength(50).IsRequired();
            builder.HasIndex(o => o.OrderCode).IsUnique();

            builder.Property(o => o.UserId).IsRequired();
            builder.HasIndex(o => o.UserId);

            builder.Property(o => o.Amount).HasPrecision(18, 4).IsRequired();
            builder.Property(o => o.Currency).HasMaxLength(3).IsRequired();
            builder.Property(o => o.Status).HasMaxLength(50).IsRequired();
            builder.Property(o => o.OrderType).HasMaxLength(50).IsRequired();
            builder.Property(o => o.PaymentMethod).HasMaxLength(50).IsRequired();
            builder.Property(o => o.ExternalTransactionId).HasMaxLength(100);
            builder.Property(o => o.QrCodeUrl).HasMaxLength(1000);
            builder.Property(o => o.CheckoutUrl).HasMaxLength(1000);
            builder.Property(o => o.ExpiresAtUtc);
            builder.Property(o => o.Description).HasMaxLength(500);
            builder.Property(o => o.FailureReason).HasMaxLength(500);
            builder.Property(o => o.CreatedAtUtc).IsRequired();
            builder.Property(o => o.UpdatedAtUtc);

            builder.HasMany(o => o.Attempts)
                   .WithOne(a => a.PaymentOrder)
                   .HasForeignKey(a => a.PaymentOrderId)
                   .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PaymentAttempt>(builder =>
        {
            builder.ToTable("PaymentAttempts");
            builder.HasKey(a => a.Id);
            builder.Property(a => a.Id).ValueGeneratedNever();

            builder.Property(a => a.Method).HasMaxLength(50).IsRequired();
            builder.Property(a => a.Status).HasMaxLength(50).IsRequired();
            builder.Property(a => a.ExternalTransactionId).HasMaxLength(100);
            builder.Property(a => a.RawResponse);
            builder.Property(a => a.CreatedAtUtc).IsRequired();

            builder.HasIndex(a => a.PaymentOrderId);
        });
    }
}
