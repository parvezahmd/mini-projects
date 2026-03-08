const STATS_KEY = 'wordle-stats'

function defaultStats() {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
  }
}

export function loadStats() {
  try {
    const saved = localStorage.getItem(STATS_KEY)
    if (saved) return { ...defaultStats(), ...JSON.parse(saved) }
  } catch {}
  return defaultStats()
}

export function recordResult(won, guessCount) {
  const stats = loadStats()
  stats.gamesPlayed += 1
  if (won) {
    stats.gamesWon += 1
    stats.currentStreak += 1
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak)
    stats.guessDistribution[guessCount] = (stats.guessDistribution[guessCount] || 0) + 1
  } else {
    stats.currentStreak = 0
  }
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
  } catch {}
  return stats
}
