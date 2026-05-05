import { useEffect } from 'react'
import { useGame } from '../hooks/useGame'
import CardTile from './CardTile'
import WinModal from './WinModal'

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
}

export default function GameBoard({ deck, gridSize, cardStyle, onBack, onWin, onSaveReplay }) {
  const { cards, flippedIds, matchedPairIds, moves, time, gameStatus, isChecking, flipCard, resetGame, getReplayData } = useGame(deck, gridSize)

  useEffect(() => {
    document.documentElement.setAttribute('data-card-style', cardStyle.id)
    return () => document.documentElement.removeAttribute('data-card-style')
  }, [cardStyle.id])

  const handleWinBack = () => {
    onWin({ moves, time, gridId: gridSize.id })
    onBack()
  }

  const handleSaveReplay = () => {
    const { initialCards, moveLog } = getReplayData()
    onSaveReplay({
      id: Date.now().toString(),
      deckName: deck.name,
      deckTheme: deck.cardTheme,
      gridSize,
      cardStyle: cardStyle.id,
      moves,
      time,
      playedAt: Date.now(),
      initialCards,
      moveLog,
    })
  }

  return (
    <div className="game-board">
      <div className="game-stats">
        <div className="stat">
          <span className="stat-label">Moves</span>
          <span className="stat-value">{moves}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Time</span>
          <span className="stat-value">{fmt(time)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Pairs</span>
          <span className="stat-value">{matchedPairIds.size}/{gridSize.pairs}</span>
        </div>
        <button className="btn-secondary btn-sm" onClick={resetGame}>↺ Restart</button>
      </div>

      <div className="cards-grid" style={{ '--grid-cols': gridSize.cols }}>
        {cards.map(card => (
          <CardTile
            key={card.id}
            card={card}
            isFlipped={flippedIds.includes(card.id) || matchedPairIds.has(card.pairId)}
            isMatched={matchedPairIds.has(card.pairId)}
            onClick={() => flipCard(card.id)}
            disabled={isChecking || matchedPairIds.has(card.pairId)}
          />
        ))}
      </div>

      {gameStatus === 'won' && (
        <WinModal
          moves={moves}
          time={time}
          gridSize={gridSize}
          deck={deck}
          onRestart={resetGame}
          onBack={handleWinBack}
          onSaveReplay={handleSaveReplay}
        />
      )}
    </div>
  )
}
