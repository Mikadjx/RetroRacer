using Microsoft.EntityFrameworkCore;
using RetroRacer.Models;

namespace RetroRacer.Data;

public class GameDbContext : DbContext
{
    public GameDbContext(DbContextOptions<GameDbContext> options) : base(options)
    {
    }

    public DbSet<LeaderboardEntry> LeaderboardEntries { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LeaderboardEntry>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Initials).HasMaxLength(3).IsRequired();
            entity.Property(e => e.Score).IsRequired();
            entity.Property(e => e.GameMode).HasMaxLength(20);
            entity.HasIndex(e => e.Score).IsDescending();
            entity.HasIndex(e => new { e.GameMode, e.Score }).IsDescending();
        });
    }
}
