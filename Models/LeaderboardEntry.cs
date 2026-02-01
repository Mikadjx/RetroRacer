namespace RetroRacer.Models;

public class LeaderboardEntry
{
    public int Id { get; set; }
    public string Initials { get; set; } = string.Empty;
    public int Score { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? GameMode { get; set; } // "classic" or "arcade"
}
