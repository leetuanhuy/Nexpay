using MassTransit;
using Notification.Service.Consumers;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

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

// Configure MassTransit with RabbitMQ
builder.Services.AddMassTransit(x =>
{
    // Register Consumers
    x.AddConsumer<WalletDebitedConsumer>();
    x.AddConsumer<WalletCreditedConsumer>();

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

        // Automatically creates and binds queues for registered consumers
        cfg.ConfigureEndpoints(context);
    });
});

var app = builder.Build();

app.MapGet("/", () => "Notification Microservice is running and actively consuming RabbitMQ messages...");

app.Run();
