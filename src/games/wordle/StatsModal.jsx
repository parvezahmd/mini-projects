import { useEffect } from 'react'
import { loadStats } from './stats'
import './StatsModal.css'

function StatBox({ value, label }) {
  return (
    <div className="stat-box">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

export default function StatsModal({ onClose, lastGuessCount, won }) {
  const stats = loadStats()
  const winPct = stats.gamesPlayed === 0
    ? 0
    : Math.round((stats.gamesWon / stats.gamesPlayed) * 100)

  const maxDist = Math.max(...Object.values(stats.guessDistribution), 1)

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <h2 className="modal-title">Statistics</h2>

        <div className="stats-row">
          <StatBox value={stats.gamesPlayed} label="Played" />
          <StatBox value={winPct} label="Win %" />
          <StatBox value={stats.currentStreak} label="Current Streak" />
          <StatBox value={stats.maxStreak} label="Max Streak" />
        </div>

        <h3 className="dist-title">Guess Distribution</h3>

        {stats.gamesWon === 0 ? (
          <p className="no-data">No wins yet — keep playing!</p>
        ) : (
          <div className="dist-chart">
            {[1, 2, 3, 4, 5, 6].map((n) => {
              const count = stats.guessDistribution[n] || 0
              const pct = Math.max(Math.round((count / maxDist) * 100), count > 0 ? 8 : 0)
              const highlight = won && lastGuessCount === n
              return (
                <div key={n} className="dist-row">
                  <span className="dist-label">{n}</span>
                  <div className="dist-bar-wrap">
                    <div
                      className={`dist-bar ${highlight ? 'highlight' : ''}`}
                      style={{ width: `${pct}%` }}
                    >
                      {count > 0 && <span className="dist-count">{count}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
