using System.Threading.RateLimiting;
using BuildingBlocks.Middleware;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// 1. CORS Configuration (Allows Frontend apps to communicate seamlessly)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 2. Rate Limiting Configuration (Protects against DoS & Password brute-forcing)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Strict policy for Auth endpoints (20 requests per minute)
    options.AddPolicy("auth-policy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 2
            }));

    // General policy for other services (100 requests per minute)
    options.AddPolicy("general-policy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 5
            }));
});

// 3. YARP Reverse Proxy & Health Checks
builder.Services.AddHealthChecks();
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.UseCorrelationId();
app.UseCors("AllowAll");
app.UseRateLimiter();
app.MapHealthChecks("/health");

// Health Check & Gateway Status
app.MapGet("/", () => Results.Ok(new
{
    service = "Nexpay API Gateway",
    status = "Healthy",
    timestamp = DateTime.UtcNow,
    routes = new[]
    {
        "/api/auth/* -> Identity Service (Port 5248)",
        "/api/wallets/* -> Wallet Service (Port 5249)",
        "/api/payments/* -> Payment Service (Port 5251)"
    }
}));

app.MapReverseProxy();

app.Run();
