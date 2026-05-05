import { useState } from 'react'
import { useLobby } from '../hooks/useLobby'
import { GRID_SIZES, CARD_STYLES } from '../utils/cardData'
import MultiplayerBoard from './MultiplayerBoard'

export default function LobbyScreen({ decks, onBack }) {
  const lobby = useLobby()
  const { phase, lobbyCode, role, myId, players, config, gameState, error, leaveLobby } = lobby

  const handleBack = () => { leaveLobby(); onBack() }

  if (phase === 'playing' || phase === 'finished') {
    return (
      <MultiplayerBoard
        gameState={gameState}
        players={players}
        config={config}
        myId={myId}
        onFlipCard={lobby.flipCard}
        onBack={handleBack}
      />
    )
  }

  return (
    <div className="lobby-wrap">
      {error && <div className="lobby-error">{error}</div>}

      {phase === 'idle' && (
        <LobbyIdle
          onCreateLobby={lobby.createLobby}
          onJoinLobby={lobby.joinLobby}
          onBack={onBack}
        />
      )}

      {phase === 'creating' && <div className="lobby-loading">Connecting…</div>}

      {phase === 'waiting' && role === 'host' && (
        <HostWaiting
          lobbyCode={lobbyCode}
          players={players}
          decks={decks}
          onStartGame={lobby.startGame}
          onBack={handleBack}
        />
      )}

      {phase === 'waiting' && role === 'guest' && (
        <GuestWaiting
          lobbyCode={lobbyCode}
          players={players}
          onBack={handleBack}
        />
      )}
    </div>
  )
}

// ── Idle: choose create or join ───────────────────────────────
function LobbyIdle({ onCreateLobby, onJoinLobby, onBack }) {
  const [mode, setMode] = useState(null) // null | 'create' | 'join'
  const [name, setName] = useState('')
  const [code, setCode] = useState('')

  const handleCreate = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreateLobby(name.trim())
  }

  const handleJoin = (e) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return
    onJoinLobby(name.trim(), code.trim())
  }

  return (
    <div className="lobby-idle">
      <h2>Multiplayer</h2>
      <p className="lobby-subtitle">Play with friends in real-time — turn-based card matching.</p>

      {!mode && (
        <div className="lobby-mode-btns">
          <button className="lobby-mode-btn" onClick={() => setMode('create')}>
            <span className="lm-icon">🏠</span>
            <span className="lm-label">Create Lobby</span>
            <span className="lm-sub">Host a game and share the code</span>
          </button>
          <button className="lobby-mode-btn" onClick={() => setMode('join')}>
            <span className="lm-icon">🚪</span>
            <span className="lm-label">Join Lobby</span>
            <span className="lm-sub">Enter a code to join a friend</span>
          </button>
        </div>
      )}

      {mode === 'create' && (
        <form className="lobby-form" onSubmit={handleCreate}>
          <h3>Create Lobby</h3>
          <div className="form-group">
            <label>Your Name</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)}
              placeholder="Enter your name" autoFocus maxLength={20} />
          </div>
          <div className="lobby-form-actions">
            <button type="button" className="btn-secondary" onClick={() => setMode(null)}>Back</button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>Create Lobby</button>
          </div>
        </form>
      )}

      {mode === 'join' && (
        <form className="lobby-form" onSubmit={handleJoin}>
          <h3>Join Lobby</h3>
          <div className="form-group">
            <label>Your Name</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)}
              placeholder="Enter your name" autoFocus maxLength={20} />
          </div>
          <div className="form-group">
            <label>Lobby Code</label>
            <input className="form-input code-input" value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="ABC12" maxLength={10} />
          </div>
          <div className="lobby-form-actions">
            <button type="button" className="btn-secondary" onClick={() => setMode(null)}>Back</button>
            <button type="submit" className="btn-primary" disabled={!name.trim() || !code.trim()}>Join</button>
          </div>
        </form>
      )}

      {!mode && (
        <button className="btn-secondary" style={{ marginTop: 16 }} onClick={onBack}>← Back</button>
      )}
    </div>
  )
}

// ── Host waiting room ─────────────────────────────────────────
function HostWaiting({ lobbyCode, players, decks, onStartGame, onBack }) {
  const [selectedDeck, setSelectedDeck] = useState(decks[0] ?? null)
  const [gridSize, setGridSize] = useState(GRID_SIZES[0])
  const [cardStyle, setCardStyle] = useState(CARD_STYLES[0])
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(lobbyCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const canStart = players.length >= 2 && selectedDeck

  return (
    <div className="lobby-waiting">
      {/* Code display */}
      <div className="lobby-code-box">
        <p className="code-label">Share this code with friends</p>
        <div className="code-display">
          <span className="code-value">{lobbyCode}</span>
          <button className="btn-icon copy-btn" onClick={copy} title="Copy code">
            {copied ? '✅' : '📋'}
          </button>
        </div>
      </div>

      <div className="lobby-columns">
        {/* Players list */}
        <div className="lobby-section">
          <h3>Players ({players.length})</h3>
          <div className="lobby-players">
            {players.map(p => (
              <div key={p.id} className="lobby-player-row">
                <span className="lobby-avatar">{p.name[0].toUpperCase()}</span>
                <span>{p.name}</span>
                {p.isHost && <span className="host-badge">HOST</span>}
              </div>
            ))}
            {players.length < 2 && (
              <p className="waiting-hint">Waiting for at least one more player…</p>
            )}
          </div>
        </div>

        {/* Game config */}
        <div className="lobby-section">
          <h3>Settings</h3>

          <div className="form-group">
            <label>Deck</label>
            <select className="form-select" value={selectedDeck?.id ?? ''}
              onChange={e => setSelectedDeck(decks.find(d => d.id === e.target.value))}>
              {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Grid Size</label>
            <div className="options-row">
              {GRID_SIZES.map(s => (
                <button key={s.id} type="button"
                  className={`option-btn ${gridSize.id === s.id ? 'selected' : ''}`}
                  onClick={() => setGridSize(s)}>
                  <span className="option-icon">{s.icon}</span>
                  <span className="option-label">{s.label}</span>
                  <span className="option-sub">{s.cols}×{s.cols}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Card Style</label>
            <div className="options-row">
              {CARD_STYLES.map(s => (
                <button key={s.id} type="button"
                  className={`option-btn ${cardStyle.id === s.id ? 'selected' : ''}`}
                  onClick={() => setCardStyle(s)}>
                  <span className="option-icon">{s.preview}</span>
                  <span className="option-label">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="lobby-actions">
        <button className="btn-secondary" onClick={onBack}>Leave</button>
        <button className="btn-primary btn-lg" disabled={!canStart}
          onClick={() => onStartGame({ deck: selectedDeck, gridSize, cardStyle })}>
          {canStart ? 'Start Game!' : `Need ${2 - players.length} more player${2 - players.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}

// ── Guest waiting room ────────────────────────────────────────
function GuestWaiting({ lobbyCode, players, onBack }) {
  return (
    <div className="lobby-waiting">
      <div className="lobby-code-box">
        <p className="code-label">Connected to lobby</p>
        <div className="code-display">
          <span className="code-value">{lobbyCode}</span>
        </div>
      </div>

      <div className="lobby-section" style={{ maxWidth: 400 }}>
        <h3>Players ({players.length})</h3>
        <div className="lobby-players">
          {players.map(p => (
            <div key={p.id} className="lobby-player-row">
              <span className="lobby-avatar">{p.name[0].toUpperCase()}</span>
              <span>{p.name}</span>
              {p.isHost && <span className="host-badge">HOST</span>}
            </div>
          ))}
        </div>
        <p className="waiting-hint" style={{ marginTop: 16 }}>⏳ Waiting for the host to start the game…</p>
      </div>

      <button className="btn-secondary" style={{ marginTop: 16 }} onClick={onBack}>Leave</button>
    </div>
  )
}
