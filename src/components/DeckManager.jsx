import { useState } from 'react'
import { CARD_THEMES } from '../utils/cardData'
import CreateDeckModal from './CreateDeckModal'

export default function DeckManager({ decks, onPlay, onDelete, onToggleFavorite, onAddDeck }) {
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'favorites' ? decks.filter(d => d.favorite) : decks

  return (
    <div className="deck-manager">
      <div className="deck-manager-toolbar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({decks.length})
          </button>
          <button
            className={`filter-tab ${filter === 'favorites' ? 'active' : ''}`}
            onClick={() => setFilter('favorites')}
          >
            ⭐ Favorites ({decks.filter(d => d.favorite).length})
          </button>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ New Deck</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>{filter === 'favorites' ? 'No favorite decks yet.' : 'No decks yet. Create one!'}</p>
        </div>
      ) : (
        <div className="deck-grid">
          {filtered.map(deck => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onPlay={() => onPlay(deck)}
              onDelete={() => onDelete(deck.id)}
              onToggleFavorite={() => onToggleFavorite(deck.id)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateDeckModal
          onClose={() => setShowCreate(false)}
          onCreate={(name, theme) => { onAddDeck(name, theme); setShowCreate(false) }}
        />
      )}
    </div>
  )
}

function DeckCard({ deck, onPlay, onDelete, onToggleFavorite }) {
  const themeInfo = CARD_THEMES[deck.cardTheme]
  return (
    <div className="deck-card">
      <div className="deck-card-icon">{themeInfo.icon}</div>
      <div className="deck-card-info">
        <h3>{deck.name}</h3>
        <p className="deck-theme-label">{themeInfo.label}</p>
        {Object.keys(deck.bestScores).length > 0 && (
          <div className="deck-best-scores">
            {Object.entries(deck.bestScores).map(([grid, s]) => (
              <span key={grid} className="best-score-badge">{grid}: {s.moves} moves</span>
            ))}
          </div>
        )}
      </div>
      <div className="deck-card-actions">
        <button
          className={`btn-icon ${deck.favorite ? 'active-fav' : ''}`}
          onClick={onToggleFavorite}
          title={deck.favorite ? 'Unfavorite' : 'Favorite'}
        >
          {deck.favorite ? '⭐' : '☆'}
        </button>
        <button className="btn-primary btn-sm" onClick={onPlay}>Play</button>
        <button className="btn-danger btn-sm" onClick={onDelete} title="Delete">🗑</button>
      </div>
    </div>
  )
}
