import { useState } from 'react'
import { loadReplays, deleteReplay } from '../utils/storage'
import { CARD_THEMES } from '../utils/cardData'

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ReplaysScreen({ onBack, onWatch }) {
  const [replays, setReplays] = useState(() => loadReplays())

  const handleDelete = (id) => {
    deleteReplay(id)
    setReplays(r => r.filter(r => r.id !== id))
  }

  if (replays.length === 0) {
    return (
      <div className="replays-screen">
        <div className="replays-header">
          <h2>🎬 Saved Replays</h2>
          <p className="replays-subtitle">Finish a game and click "Save Replay" to store it here</p>
        </div>
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎬</div>
          <p>No replays saved yet.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>Win a game and hit <strong>Save Replay</strong> in the win screen.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="replays-screen">
      <div className="replays-header">
        <h2>🎬 Saved Replays</h2>
        <p className="replays-subtitle">{replays.length} replay{replays.length !== 1 ? 's' : ''} saved</p>
      </div>
      <div className="replays-list">
        {replays.map(replay => {
          const themeIcon = CARD_THEMES[replay.deckTheme]?.icon ?? '🃏'
          return (
            <div key={replay.id} className="replay-card">
              <div className="replay-card-icon">{themeIcon}</div>
              <div className="replay-card-info">
                <div className="replay-card-title">{replay.deckName}</div>
                <div className="replay-card-meta">
                  {replay.gridSize.label} · {replay.moves} moves · {fmt(replay.time)}
                </div>
                <div className="replay-card-date">{fmtDate(replay.playedAt)}</div>
              </div>
              <div className="replay-card-actions">
                <button className="btn-primary btn-sm" onClick={() => onWatch(replay)}>▶ Watch</button>
                <button className="btn-danger" onClick={() => handleDelete(replay.id)} title="Delete">✕</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
