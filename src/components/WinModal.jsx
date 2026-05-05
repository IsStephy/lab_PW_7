import { useState } from 'react'

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
}

export default function WinModal({ moves, time, gridSize, deck, onRestart, onBack, onSaveReplay }) {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    onSaveReplay()
    setSaved(true)
  }

  return (
    <div className="modal-overlay">
      <div className="modal win-modal">
        <div className="win-emoji">🎉</div>
        <h2>You Won!</h2>
        <p className="win-deck">{deck.name} — {gridSize.label}</p>
        <div className="win-stats">
          <div className="win-stat">
            <span className="win-stat-label">Moves</span>
            <span className="win-stat-value">{moves}</span>
          </div>
          <div className="win-stat">
            <span className="win-stat-label">Time</span>
            <span className="win-stat-value">{fmt(time)}</span>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onBack}>Back to Decks</button>
          {saved
            ? <span className="replay-saved-badge">✓ Replay saved</span>
            : <button className="btn-secondary" onClick={handleSave}>💾 Save Replay</button>
          }
          <button className="btn-primary" onClick={onRestart}>Play Again</button>
        </div>
      </div>
    </div>
  )
}
