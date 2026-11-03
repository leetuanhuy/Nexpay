using System.Security.Claims;
using System.Text.Json;
using BuildingBlocks.Events;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Payment.API.Data;
using Payment.API.DTOs;
using Payment.API.Entities;
using Payment.API.Services;

namespace Payment.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly PaymentDbContext _context;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly IVietQrService _vietQrService;
    private readonly IWebhookSecurityService _webhookSecurity;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(
        PaymentDbContext context,
        IPublishEndpoint publishEndpoint,
        IVietQrService vietQrService,
        IWebhookSecurityService webhookSecurity,
        ILogger<PaymentsController> logger)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
        _vietQrService = vietQrService;
        _webhookSecurity = webhookSecurity;
        _logger = logger;
    }

    private Guid CurrentUserId
    {
        get
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (Guid.TryParse(claim, out var userId))
                return userId;

            throw new UnauthorizedAccessException("User identifier claim is missing or invalid in JWT token.");
        }
    }

    /// <summary>
    /// Initiates a Top-Up order and generates a real VietQR Napas 247 code
    /// </summary>
    [HttpPost("topup")]
    public async Task<IActionResult> CreateTopUpOrder([FromBody] TopUpOrderRequest request, CancellationToken ct)
    {
        if (request.Amount <= 0)
        {
            return BadRequest(new { error = "Top-up amount must be greater than zero." });
        }

        if (request.Amount < 10000)
        {
            return BadRequest(new { error = "Minimum top-up amount is 10,000 VND." });
        }

        var order = PaymentOrder.CreateTopUp(
            userId: CurrentUserId,
            amount: request.Amount,
            paymentMethod: string.IsNullOrWhiteSpace(request.PaymentMethod) ? "VietQR" : request.PaymentMethod,
            description: request.Description
        );

        // Generate dynamic VietQR
        var qrInfo = _vietQrService.GenerateTopUpQr(order.OrderCode, order.Amount);

        // Update QR URL in order entity
        typeof(PaymentOrder).GetProperty(nameof(PaymentOrder.QrCodeUrl))?
            .SetValue(order, qrInfo.QrImageUrl);

        await _context.PaymentOrders.AddAsync(order, ct);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation(
            "[TOPUP INITIATED] Order {OrderCode} created for user {UserId}. Amount: {Amount:N0} VND. VietQR generated.",
            order.OrderCode, order.UserId, order.Amount
        );

        var response = new TopUpOrderResponse(
            OrderId: order.Id,
            OrderCode: order.OrderCode,
            Amount: order.Amount,
            Currency: order.Currency,
            Status: order.Status,
            PaymentMethod: order.PaymentMethod,
            QrCodeUrl: qrInfo.QrImageUrl,
            BankAccount: new TopUpBankAccountDto(
                BankName: qrInfo.BankName,
                BankBin: qrInfo.BankBin,
                AccountNumber: qrInfo.AccountNumber,
                AccountName: qrInfo.AccountName,
                TransferContent: qrInfo.TransferContent
            ),
            ExpiresAtUtc: order.ExpiresAtUtc ?? DateTime.UtcNow.AddMinutes(15)
        );

        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>
    /// Receives IPN Webhook from payment gateway (PayOS / VietQR / Bank partner) with HMAC-SHA256 signature
    /// </summary>
    [AllowAnonymous]
    [HttpPost("webhook")]
    public async Task<IActionResult> ProcessWebhook([FromBody] WebhookRequest request, CancellationToken ct)
    {
        _logger.LogInformation("[WEBHOOK RECEIVED] Incoming payment notification. Code: {Code}, Desc: {Desc}", request.Code, request.Desc);

        if (request.Data == null || !request.Data.Any())
        {
            return BadRequest(new { error = "Webhook data payload is required." });
        }

        // 1. Verify HMAC-SHA256 signature
        var isValidSignature = _webhookSecurity.VerifySignature(request.Data, request.Signature);
        if (!isValidSignature)
        {
            _logger.LogWarning("[WEBHOOK SECURITY ALERT] Signature verification failed! Provided signature: {Signature}", request.Signature);
            return BadRequest(new { error = "Invalid HMAC-SHA256 webhook signature. Verification rejected." });
        }

        // 2. Extract order code
        if (!request.Data.TryGetValue("orderCode", out var rawOrderCode) || rawOrderCode == null)
        {
            return BadRequest(new { error = "orderCode field missing in webhook data." });
        }

        var orderCode = rawOrderCode switch
        {
            JsonElement je when je.ValueKind == JsonValueKind.String => je.GetString(),
            JsonElement je when je.ValueKind == JsonValueKind.Number => je.GetRawText(),
            _ => rawOrderCode.ToString()
        };

        if (string.IsNullOrWhiteSpace(orderCode))
        {
            return BadRequest(new { error = "orderCode cannot be empty." });
        }

        // 3. Find order in DB
        var order = await _context.PaymentOrders
            .Include(o => o.Attempts)
            .FirstOrDefaultAsync(o => o.OrderCode == orderCode, ct);

        if (order == null)
        {
            _logger.LogWarning("[WEBHOOK] OrderCode {OrderCode} not found in system.", orderCode);
            return NotFound(new { error = $"Order '{orderCode}' not found." });
        }

        // 4. Idempotency Check: if already completed, return 200 OK immediately
        if (order.Status == "Completed")
        {
            _logger.LogInformation("[WEBHOOK IDEMPOTENT] Order {OrderCode} is already completed. Skipping settlement.", orderCode);
            return Ok(new { code = "00", message = "Order already completed." });
        }

        // 5. Extract optional external transaction id
        string? externalTxId = null;
        if (request.Data.TryGetValue("reference", out var rawRef) && rawRef != null)
        {
            externalTxId = rawRef.ToString();
        }

        // 6. Complete Order
        order.MarkAsCompleted(externalTxId, order.PaymentMethod);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation(
            "[WEBHOOK SUCCESS] Order {OrderCode} marked as Completed. Publishing TopUpPaymentCompletedIntegrationEvent to RabbitMQ...",
            order.OrderCode
        );

        // 7. Publish Event to RabbitMQ for Wallet Service atomic credit
        await _publishEndpoint.Publish(new TopUpPaymentCompletedIntegrationEvent(
            EventId: Guid.NewGuid(),
            OccurredOnUtc: DateTime.UtcNow,
            OrderId: order.Id,
            OrderCode: order.OrderCode,
            UserId: order.UserId,
            Amount: order.Amount,
            Currency: order.Currency,
            PaymentMethod: order.PaymentMethod,
            ExternalTransactionId: externalTxId
        ), ct);

        return Ok(new { code = "00", message = "Payment successfully processed and settled." });
    }

    /// <summary>
    /// Simulates a successful bank transfer webhook for Development & Testing (HMAC-SHA256 signed)
    /// </summary>
    [HttpPost("webhook/simulate")]
    public async Task<IActionResult> SimulateWebhook([FromBody] SimulateWebhookRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.OrderCode))
        {
            return BadRequest(new { error = "orderCode is required." });
        }

        var order = await _context.PaymentOrders
            .FirstOrDefaultAsync(o => o.OrderCode == request.OrderCode, ct);

        if (order == null)
        {
            return NotFound(new { error = $"Order '{request.OrderCode}' not found." });
        }

        if (order.UserId != CurrentUserId)
        {
            return Forbid();
        }

        if (order.Status == "Completed")
        {
            return Ok(new { message = "Order is already completed.", orderCode = order.OrderCode });
        }

        var txId = request.TransactionId ?? $"MB{DateTime.UtcNow:yyyyMMddHHmmss}{Random.Shared.Next(100, 999)}";

        // Build genuine PayOS/VietQR data payload
        var data = new Dictionary<string, object?>
        {
            ["orderCode"] = order.OrderCode,
            ["amount"] = (long)order.Amount,
            ["description"] = $"Thanh toan don {order.OrderCode}",
            ["accountNumber"] = "0388888888",
            ["reference"] = txId,
            ["transactionDateTime"] = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss")
        };

        // Compute authentic HMAC-SHA256 signature
        var signature = _webhookSecurity.ComputeSignature(data);

        // Process directly through webhook pipeline
        var webhookPayload = new WebhookRequest("00", "Simulated Bank Transfer Success", data, signature);
        return await ProcessWebhook(webhookPayload, ct);
    }

    /// <summary>
    /// Quick status check for an order
    /// </summary>
    [HttpGet("status/{orderCode}")]
    public async Task<IActionResult> GetOrderStatus(string orderCode, CancellationToken ct)
    {
        var order = await _context.PaymentOrders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.OrderCode == orderCode, ct);

        if (order == null)
            return NotFound(new { error = $"Order '{orderCode}' not found." });

        if (order.UserId != CurrentUserId)
            return Forbid();

        return Ok(new
        {
            orderCode = order.OrderCode,
            status = order.Status,
            amount = order.Amount,
            updatedAtUtc = order.UpdatedAtUtc
        });
    }

    /// <summary>
    /// Initiates a checkout transaction and starts the distributed payment Saga
    /// </summary>
    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request, CancellationToken ct)
    {
        if (request.Amount <= 0)
        {
            return BadRequest(new { error = "Payment amount must be greater than zero." });
        }

        var order = PaymentOrder.Create(
            userId: CurrentUserId,
            amount: request.Amount,
            description: request.Description ?? "Payment order checkout",
            currency: string.IsNullOrWhiteSpace(request.Currency) ? "VND" : request.Currency.ToUpperInvariant()
        );

        await _context.PaymentOrders.AddAsync(order, ct);
        await _context.SaveChangesAsync(ct);

        // Kick off the distributed Saga by publishing OrderCreatedIntegrationEvent
        await _publishEndpoint.Publish(new OrderCreatedIntegrationEvent(
            EventId: Guid.NewGuid(),
            OccurredOnUtc: DateTime.UtcNow,
            OrderId: order.Id,
            OrderCode: order.OrderCode,
            UserId: order.UserId,
            Amount: order.Amount,
            Currency: order.Currency,
            Description: order.Description
        ), ct);

        var dto = MapToDto(order);
        return CreatedAtAction(nameof(GetOrderById), new { orderId = order.Id }, dto);
    }

    /// <summary>
    /// Gets order details and current Saga payment status
    /// </summary>
    [HttpGet("{orderId:guid}")]
    public async Task<IActionResult> GetOrderById(Guid orderId, CancellationToken ct)
    {
        var order = await _context.PaymentOrders
            .Include(o => o.Attempts)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

        if (order == null)
            return NotFound(new { error = $"Order with id '{orderId}' was not found." });

        if (order.UserId != CurrentUserId)
            return Forbid();

        return Ok(MapToDto(order));
    }

    /// <summary>
    /// Retrieves order history for current authenticated user
    /// </summary>
    [HttpGet("my-orders")]
    public async Task<IActionResult> GetMyOrders([FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var orders = await _context.PaymentOrders
            .Include(o => o.Attempts)
            .Where(o => o.UserId == CurrentUserId)
            .OrderByDescending(o => o.CreatedAtUtc)
            .Take(limit)
            .ToListAsync(ct);

        var dtoList = orders.Select(MapToDto).ToList();
        return Ok(dtoList);
    }

    private static PaymentOrderDto MapToDto(PaymentOrder order)
    {
        return new PaymentOrderDto(
            order.Id,
            order.OrderCode,
            order.UserId,
            order.Amount,
            order.Currency,
            order.Status,
            order.OrderType,
            order.PaymentMethod,
            order.ExternalTransactionId,
            order.QrCodeUrl,
            order.CheckoutUrl,
            order.ExpiresAtUtc,
            order.Description,
            order.FailureReason,
            order.CreatedAtUtc,
            order.UpdatedAtUtc,
            order.Attempts.Select(a => new PaymentAttemptDto(
                a.Id,
                a.Method,
                a.Status,
                a.ExternalTransactionId,
                a.RawResponse,
                a.CreatedAtUtc
            )).ToList()
        );
    }
}
