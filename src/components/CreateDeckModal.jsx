import { useState } from 'react'
import { CARD_THEMES } from '../utils/cardData'

export default function CreateDeckModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('animals')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreate(name.trim(), selectedTheme)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Create New Deck</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Deck Name</label>
            <input
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Awesome Deck"
              autoFocus
              maxLength={30}
            />
          </div>
          <div className="form-group">
            <label>Card Theme</label>
            <div className="theme-options">
              {Object.entries(CARD_THEMES).map(([id, t]) => (
                <button
                  key={id}
                  type="button"
                  className={`theme-option ${selectedTheme === id ? 'selected' : ''}`}
                  onClick={() => setSelectedTheme(id)}
                >
                  <span className="theme-icon">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>Create</button>
          </div>
        </form>
      </div>
    </div>
  )
}
