import { useEffect } from 'react'
import CardTile from './CardTile'

export default function MultiplayerBoard({ gameState, players, config, myId, onFlipCard, onBack }) {
  useEffect(() => {
    if (config?.cardStyle) document.documentElement.setAttribute('data-card-style', config.cardStyle.id)
    return () => document.documentElement.removeAttribute('data-card-style')
  }, [config?.cardStyle])

  if (!gameState) return <div className="lobby-loading">Starting game…</div>

  const { cards, flippedIds, matchedPairIds, scores, currentTurnId, phase, pendingReset } = gameState

  if (phase === 'finished') {
    return <WinScreen players={players} scores={scores} onBack={onBack} />
  }

  const isMyTurn = currentTurnId === myId
  const currentPlayer = players.find(p => p.id === currentTurnId)

  return (
    <div className="mp-board">
      {/* Scoreboard */}
      <div className="mp-scoreboard">
        {players.map(p => (
          <div
            key={p.id}
            className={`mp-player-card${p.id === currentTurnId ? ' active-turn' : ''}${p.id === myId ? ' is-me' : ''}`}
          >
            <span className="mp-avatar">{p.name[0].toUpperCase()}</span>
            <div className="mp-player-info">
              <span className="mp-player-name">{p.name}{p.id === myId ? ' (you)' : ''}</span>
              <span className="mp-player-score">{scores?.[p.id] ?? 0} pairs</span>
            </div>
            {p.id === currentTurnId && <span className="mp-turn-dot" />}
          </div>
        ))}
      </div>

      {/* Turn banner */}
      <div className={`turn-banner ${isMyTurn ? 'your-turn' : ''}`}>
        {isMyTurn ? '🎯 Your turn — pick a card!' : `⏳ Waiting for ${currentPlayer?.name}…`}
      </div>

      {/* Card grid */}
      <div className="cards-grid" style={{ '--grid-cols': config?.gridSize?.cols ?? 4 }}>
        {cards?.map(card => (
          <CardTile
            key={card.id}
            card={card}
            isFlipped={flippedIds?.includes(card.id) || card.pairId in (matchedPairIds ?? {})}
            isMatched={card.pairId in (matchedPairIds ?? {})}
            onClick={() => onFlipCard(card.id)}
            disabled={!isMyTurn || pendingReset || card.pairId in (matchedPairIds ?? {})}
          />
        ))}
      </div>
    </div>
  )
}

function WinScreen({ players, scores, onBack }) {
  const ranked = [...players].sort((a, b) => (scores?.[b.id] ?? 0) - (scores?.[a.id] ?? 0))
  const winner = ranked[0]
  const isTie = ranked.length > 1 && (scores?.[ranked[0].id] ?? 0) === (scores?.[ranked[1].id] ?? 0)

  return (
    <div className="mp-win">
      <div className="win-emoji">{isTie ? '🤝' : '🏆'}</div>
      <h2>{isTie ? "It's a tie!" : `${winner?.name} wins!`}</h2>
      <div className="mp-rankings">
        {ranked.map((p, i) => (
          <div key={p.id} className={`mp-rank-row rank-${i}`}>
            <span className="rank-pos">{['🥇','🥈','🥉'][i] ?? `${i+1}.`}</span>
            <span className="rank-name">{p.name}</span>
            <span className="rank-score">{scores?.[p.id] ?? 0} pairs</span>
          </div>
        ))}
      </div>
      <button className="btn-primary btn-lg" onClick={onBack}>Back to Menu</button>
    </div>
  )
}
