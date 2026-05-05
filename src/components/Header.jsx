export default function Header({ theme, onToggleTheme, onHome, currentView, onMultiplayer, onReplays, onChangelog }) {
  return (
    <header className="header">
      <div className="header-left">
        {currentView !== 'decks' && (
          <button className="btn-icon" onClick={onHome} title="Back to decks">←</button>
        )}
        <h1 className="header-title">🧠 Memory Game</h1>
      </div>
      <div className="header-right">
        {currentView === 'decks' && (
          <>
            <button className="btn-header-nav" onClick={onChangelog} title="Dev changelog">📋 Changelog</button>
            <button className="btn-header-nav" onClick={onReplays} title="Saved replays">🎬 Replays</button>
            <button className="btn-multiplayer" onClick={onMultiplayer} title="Multiplayer">👥 Multiplayer</button>
          </>
        )}
        <button className="btn-icon theme-toggle" onClick={onToggleTheme} title="Toggle theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  )
}
