using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetroRacer.Data;
using RetroRacer.Models;

namespace RetroRacer.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaderboardController : ControllerBase
{
    private readonly GameDbContext _context;
    private const int MaxLeaderboardSize = 100;

    public LeaderboardController(GameDbContext context)
    {
        _context = context;
    }

    // GET: api/leaderboard
    [HttpGet]
    public async Task<ActionResult<IEnumerable<LeaderboardEntryDto>>> GetLeaderboard(
        [FromQuery] string? mode = null,
        [FromQuery] int limit = 10)
    {
        limit = Math.Min(limit, MaxLeaderboardSize);

        var query = _context.LeaderboardEntries.AsQueryable();

        if (!string.IsNullOrEmpty(mode))
        {
            query = query.Where(e => e.GameMode == mode);
        }

        var entries = await query
            .OrderByDescending(e => e.Score)
            .Take(limit)
            .Select(e => new LeaderboardEntryDto
            {
                Initials = e.Initials,
                Score = e.Score,
                GameMode = e.GameMode,
                CreatedAt = e.CreatedAt
            })
            .ToListAsync();

        return Ok(entries);
    }

    // POST: api/leaderboard
    [HttpPost]
    public async Task<ActionResult<LeaderboardEntryDto>> PostScore([FromBody] SubmitScoreRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Initials) || request.Initials.Length > 3)
        {
            return BadRequest("Initials must be 1-3 characters");
        }

        if (request.Score < 0)
        {
            return BadRequest("Score must be positive");
        }

        var entry = new LeaderboardEntry
        {
            Initials = request.Initials.ToUpper(),
            Score = request.Score,
            GameMode = request.GameMode ?? "classic",
            CreatedAt = DateTime.UtcNow
        };

        _context.LeaderboardEntries.Add(entry);
        await _context.SaveChangesAsync();

        // Return the rank of the new score
        var rank = await _context.LeaderboardEntries
            .Where(e => e.GameMode == entry.GameMode)
            .CountAsync(e => e.Score > entry.Score) + 1;

        return Ok(new SubmitScoreResponse
        {
            Success = true,
            Rank = rank,
            Entry = new LeaderboardEntryDto
            {
                Initials = entry.Initials,
                Score = entry.Score,
                GameMode = entry.GameMode,
                CreatedAt = entry.CreatedAt
            }
        });
    }

    // GET: api/leaderboard/rank/{score}
    [HttpGet("rank/{score}")]
    public async Task<ActionResult<RankResponse>> GetRank(int score, [FromQuery] string? mode = "classic")
    {
        var rank = await _context.LeaderboardEntries
            .Where(e => e.GameMode == mode)
            .CountAsync(e => e.Score > score) + 1;

        var totalEntries = await _context.LeaderboardEntries
            .Where(e => e.GameMode == mode)
            .CountAsync();

        return Ok(new RankResponse
        {
            Rank = rank,
            TotalEntries = totalEntries,
            IsTopTen = rank <= 10
        });
    }
}

// DTOs
public class LeaderboardEntryDto
{
    public string Initials { get; set; } = string.Empty;
    public int Score { get; set; }
    public string? GameMode { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SubmitScoreRequest
{
    public string Initials { get; set; } = string.Empty;
    public int Score { get; set; }
    public string? GameMode { get; set; }
}

public class SubmitScoreResponse
{
    public bool Success { get; set; }
    public int Rank { get; set; }
    public LeaderboardEntryDto Entry { get; set; } = null!;
}

public class RankResponse
{
    public int Rank { get; set; }
    public int TotalEntries { get; set; }
    public bool IsTopTen { get; set; }
}
