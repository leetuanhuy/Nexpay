FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/Services/Wallet/Wallet.API/Wallet.API.csproj", "src/Services/Wallet/Wallet.API/"]
COPY ["src/Services/Wallet/Wallet.Infrastructure/Wallet.Infrastructure.csproj", "src/Services/Wallet/Wallet.Infrastructure/"]
COPY ["src/Services/Wallet/Wallet.Application/Wallet.Application.csproj", "src/Services/Wallet/Wallet.Application/"]
COPY ["src/Services/Wallet/Wallet.Domain/Wallet.Domain.csproj", "src/Services/Wallet/Wallet.Domain/"]
COPY ["src/BuildingBlocks/BuildingBlocks/BuildingBlocks.csproj", "src/BuildingBlocks/BuildingBlocks/"]
RUN dotnet restore "src/Services/Wallet/Wallet.API/Wallet.API.csproj"
COPY . .
WORKDIR "/src/src/Services/Wallet/Wallet.API"
RUN dotnet build "Wallet.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Wallet.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Wallet.API.dll"]

