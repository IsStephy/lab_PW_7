import { useState } from 'react'
import { GRID_SIZES, CARD_STYLES } from '../utils/cardData'

export default function GameSettings({ deck, onStart, onBack }) {
  const [gridSize, setGridSize] = useState(GRID_SIZES[0])
  const [cardStyle, setCardStyle] = useState(CARD_STYLES[0])

  return (
    <div className="game-settings">
      <div className="settings-card">
        <h2>Game Settings</h2>
        <p className="settings-deck-name">Deck: <strong>{deck.name}</strong></p>

        <div className="settings-section">
          <label>Difficulty (Grid Size)</label>
          <div className="options-row">
            {GRID_SIZES.map(size => (
              <button
                key={size.id}
                className={`option-btn ${gridSize.id === size.id ? 'selected' : ''}`}
                onClick={() => setGridSize(size)}
              >
                <span className="option-icon">{size.icon}</span>
                <span className="option-label">{size.label}</span>
                <span className="option-sub">{size.cols}×{size.cols}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <label>Card Style</label>
          <div className="options-row">
            {CARD_STYLES.map(style => (
              <button
                key={style.id}
                className={`option-btn ${cardStyle.id === style.id ? 'selected' : ''}`}
                onClick={() => setCardStyle(style)}
              >
                <span className="option-icon">{style.preview}</span>
                <span className="option-label">{style.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn-secondary" onClick={onBack}>Back</button>
          <button className="btn-primary btn-lg" onClick={() => onStart(gridSize, cardStyle)}>
            Start Game!
          </button>
        </div>
      </div>
    </div>
  )
}
