import { useState, useEffect } from 'react'
import { loadSettings, saveSettings, saveReplay } from './utils/storage'
import { apiSaveReplay } from './utils/api'
import { useDecks } from './hooks/useDecks'
import Header from './components/Header'
import DeckManager from './components/DeckManager'
import GameSettings from './components/GameSettings'
import GameBoard from './components/GameBoard'
import LobbyScreen from './components/LobbyScreen'
import ReplaysScreen from './components/ReplaysScreen'
import ReplayViewer from './components/ReplayViewer'
import ChangelogScreen from './components/ChangelogScreen'

export default function App() {
  const [view, setView] = useState('decks') // decks | settings | game | lobby | replays | replay-view | changelog
  const [selectedDeck, setSelectedDeck] = useState(null)
  const [gameConfig, setGameConfig] = useState(null)
  const [activeReplay, setActiveReplay] = useState(null)
  const [theme, setTheme] = useState(() => loadSettings().theme || 'light')
  const { decks, addDeck, deleteDeck, toggleFavorite, updateBestScore } = useDecks()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    saveSettings({ theme })
  }, [theme])

  const handlePlay = (deck) => { setSelectedDeck(deck); setView('settings') }
  const handleStartGame = (gridSize, cardStyle) => { setGameConfig({ gridSize, cardStyle }); setView('game') }
  const handleWin = ({ moves, time, gridId }) => updateBestScore(selectedDeck.id, gridId, { moves, time })
  const handleBack = () => { setView('decks'); setSelectedDeck(null); setGameConfig(null) }

  const handleSaveReplay = (replay) => {
    apiSaveReplay(replay).catch(() => saveReplay(replay))
  }

  const handleWatchReplay = (replay) => { setActiveReplay(replay); setView('replay-view') }

  return (
    <div className="app">
      <Header
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
        onHome={handleBack}
        currentView={view}
        onMultiplayer={() => setView('lobby')}
        onReplays={() => setView('replays')}
        onChangelog={() => setView('changelog')}
      />
      <main className="main-content">
        {view === 'decks' && (
          <DeckManager decks={decks} onPlay={handlePlay} onDelete={deleteDeck}
            onToggleFavorite={toggleFavorite} onAddDeck={addDeck} />
        )}
        {view === 'settings' && selectedDeck && (
          <GameSettings deck={selectedDeck} onStart={handleStartGame} onBack={() => setView('decks')} />
        )}
        {view === 'game' && selectedDeck && gameConfig && (
          <GameBoard deck={selectedDeck} gridSize={gameConfig.gridSize} cardStyle={gameConfig.cardStyle}
            onBack={handleBack} onWin={handleWin} onSaveReplay={handleSaveReplay} />
        )}
        {view === 'lobby' && (
          <LobbyScreen decks={decks} onBack={() => setView('decks')} />
        )}
        {view === 'replays' && (
          <ReplaysScreen onBack={() => setView('decks')} onWatch={handleWatchReplay} />
        )}
        {view === 'replay-view' && activeReplay && (
          <ReplayViewer replay={activeReplay} onBack={() => setView('replays')} />
        )}
        {view === 'changelog' && (
          <ChangelogScreen onBack={() => setView('decks')} />
        )}
      </main>
    </div>
  )
}
