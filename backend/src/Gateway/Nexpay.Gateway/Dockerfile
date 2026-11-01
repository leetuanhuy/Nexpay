FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src
COPY ["Directory.Build.props", "./"]
COPY ["src/Gateway/Nexpay.Gateway/Nexpay.Gateway.csproj", "src/Gateway/Nexpay.Gateway/"]
COPY ["src/BuildingBlocks/BuildingBlocks/BuildingBlocks.csproj", "src/BuildingBlocks/BuildingBlocks/"]
RUN dotnet restore "src/Gateway/Nexpay.Gateway/Nexpay.Gateway.csproj"
COPY . .
WORKDIR "/src/src/Gateway/Nexpay.Gateway"
RUN dotnet build "Nexpay.Gateway.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Nexpay.Gateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Nexpay.Gateway.dll"]
