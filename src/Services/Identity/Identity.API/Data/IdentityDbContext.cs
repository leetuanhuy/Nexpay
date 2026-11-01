using Identity.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace Identity.API.Data;

public class IdentityDbContext : DbContext
{
    public IdentityDbContext(DbContextOptions<IdentityDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(builder =>
        {
            builder.ToTable("Users");
            builder.HasKey(u => u.Id);

            builder.Property(u => u.Email).HasMaxLength(256).IsRequired();
            builder.HasIndex(u => u.Email).IsUnique();

            builder.Property(u => u.PasswordHash).HasMaxLength(500).IsRequired();
            builder.Property(u => u.FullName).HasMaxLength(150).IsRequired();
            builder.Property(u => u.PhoneNumber).HasMaxLength(20);
            builder.Property(u => u.Role).HasMaxLength(50).IsRequired();
            builder.Property(u => u.Status).HasMaxLength(50).IsRequired();
            builder.Property(u => u.CreatedAtUtc).IsRequired();
            builder.Property(u => u.UpdatedAtUtc);

            builder.HasMany(u => u.RefreshTokens)
                   .WithOne(r => r.User)
                   .HasForeignKey(r => r.UserId)
                   .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RefreshToken>(builder =>
        {
            builder.ToTable("RefreshTokens");
            builder.HasKey(r => r.Id);

            builder.Property(r => r.Token).HasMaxLength(500).IsRequired();
            builder.Property(r => r.ExpiresAtUtc).IsRequired();
            builder.Property(r => r.IsRevoked).IsRequired();
            builder.Property(r => r.CreatedAtUtc).IsRequired();
            builder.Property(r => r.ReplacedByToken).HasMaxLength(500);

            builder.HasIndex(r => r.UserId);
            builder.HasIndex(r => r.Token);
        });
    }
}
