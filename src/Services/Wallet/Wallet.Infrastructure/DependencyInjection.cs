using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Wallet.Domain.Repositories;
using Wallet.Infrastructure.Persistence;
using Wallet.Infrastructure.Repositories;

namespace Wallet.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddWalletInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("WalletDb")
            ?? throw new InvalidOperationException("Connection string 'WalletDb' not found.");

        services.AddDbContext<WalletDbContext>(options =>
        {
            options.UseSqlServer(connectionString);
        });

        services.AddScoped<IWalletRepository, WalletRepository>();

        return services;
    }
}

