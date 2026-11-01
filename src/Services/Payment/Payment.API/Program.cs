using System.Text;
using BuildingBlocks.Middleware;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Payment.API.Consumers;
using Payment.API.Data;

var builder = WebApplication.CreateBuilder(args);

// Add Controllers and Health Checks
builder.Services.AddControllers();
builder.Services.AddHealthChecks();
builder.Services.AddEndpointsApiExplorer();

// Configure Swagger with JWT Bearer Support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Nexpay - Payment Service API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Database
var connectionString = builder.Configuration.GetConnectionString("PaymentDb")
    ?? throw new InvalidOperationException("Connection string 'PaymentDb' not found.");

builder.Services.AddDbContext<PaymentDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

// JWT Authentication Configuration
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
});

builder.Services.AddAuthorization();

// MassTransit RabbitMQ
builder.Services.AddMassTransit(x =>
{
    // Register Saga Finalization Consumers
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

        cfg.ConfigureEndpoints(context);
    });
});

var app = builder.Build();

app.UseCorrelationId();

// Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Nexpay Payment API v1");
    });
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
