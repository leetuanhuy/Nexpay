using System.Text;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Notification.Service.Consumers;
using Notification.Service.Hubs;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Add Health Checks
builder.Services.AddHealthChecks();

// Configure Serilog with Console & Seq Sink
var seqUrl = builder.Configuration["Seq:ServerUrl"] ?? "http://localhost:5341";
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Service", "NotificationService")
    .WriteTo.Console()
    .WriteTo.Seq(seqUrl)
    .CreateLogger();

builder.Host.UseSerilog();

// Add CORS for SignalR WebSockets and SPA
builder.Services.AddCors(options =>
{
    options.AddPolicy("SignalRCorsPolicy", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure JWT Authentication with Query String Token Extraction for SignalR
var jwtSecret = builder.Configuration["JwtSettings:Secret"]
    ?? "Nexpay_Super_Secret_Key_For_JWT_Signing_2026_AtLeast32Bytes!";
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "Nexpay.Identity";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? "Nexpay.Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/notifications"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// Add SignalR Core
builder.Services.AddSignalR();

// Configure MassTransit with RabbitMQ
builder.Services.AddMassTransit(x =>
{
    // Register Notification Consumers
    x.AddConsumer<WalletDebitedConsumer>();
    x.AddConsumer<WalletCreditedConsumer>();
    x.AddConsumer<OrderPaymentSucceededConsumer>();
    x.AddConsumer<OrderPaymentFailedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitConfig = builder.Configuration.GetSection("RabbitMQ");
        var host = rabbitConfig["Host"] ?? "localhost";
        var port = ushort.TryParse(rabbitConfig["Port"], out var p) ? p : (ushort)5672;
        var username = rabbitConfig["Username"] ?? "guest";
        var password = rabbitConfig["Password"] ?? "guest";

        cfg.Host(host, port, "/", h =>
        {
            h.Username(username);
            h.Password(password);
        });

        // Automatically creates and binds durable queues for registered consumers
        cfg.ConfigureEndpoints(context);
    });
});

var app = builder.Build();

app.UseCors("SignalRCorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapGet("/", () => "Notification Microservice is running with SignalR Real-Time Hub...");

// Map SignalR Hub Endpoint
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();
