using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace Notification.Service.Hubs;

public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();

        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
            _logger.LogInformation("SignalR Client connected: User {UserId}, ConnectionId {ConnectionId}", userId, Context.ConnectionId);
        }
        else
        {
            _logger.LogInformation("SignalR Anonymous Client connected: ConnectionId {ConnectionId}", Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        _logger.LogInformation("SignalR Client disconnected: User {UserId}, ConnectionId {ConnectionId}", userId ?? "Anonymous", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Explicitly registers client connection to a specific user group
    /// </summary>
    public async Task RegisterUser(string userId)
    {
        if (!string.IsNullOrWhiteSpace(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
            _logger.LogInformation("SignalR Connection {ConnectionId} registered to group user-{UserId}", Context.ConnectionId, userId);
        }
    }

    private string? GetUserId()
    {
        return Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? Context.User?.FindFirst("sub")?.Value
            ?? Context.UserIdentifier;
    }
}
