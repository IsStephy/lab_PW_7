import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import CardTile from './CardTile'

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
}

// Pairs up consecutive flips from the move log
function buildMovePairs(moveLog) {
  const pairs = []
  for (let i = 0; i + 1 < moveLog.length; i += 2) {
    pairs.push([moveLog[i], moveLog[i + 1]])
  }
  return pairs
}

function useReplayPlayer(replay, speed) {
  const movePairs = useMemo(() => buildMovePairs(replay.moveLog), [replay])
  const cardMap = useMemo(() => {
    const m = {}
    replay.initialCards.forEach(c => { m[c.id] = c })
    return m
  }, [replay])

  const [pairIdx, setPairIdx] = useState(-1)
  const [flippedIds, setFlippedIds] = useState([])
  const [matchedPairIds, setMatchedPairIds] = useState(new Set())
  // phase: 'ready' | 'flipA' | 'flipB' | 'done'
  const [phase, setPhase] = useState('ready')
  const [isPlaying, setIsPlaying] = useState(false)

  // Derived progress values — computed from state so they're always fresh
  const currentMove = Math.max(0, pairIdx + 1)
  const totalMoves = movePairs.length

  useEffect(() => {
    if (!isPlaying || phase === 'done') return

    if (phase === 'ready') {
      const nextIdx = pairIdx + 1
      if (nextIdx >= movePairs.length) { setPhase('done'); setIsPlaying(false); return }

      // Inter-move delay: use real timing capped at 2s
      let delay = 600
      if (nextIdx > 0) {
        const gap = movePairs[nextIdx][0].t - movePairs[nextIdx - 1][1].t
        delay = Math.min(2000, Math.max(300, gap))
      }

      const t = setTimeout(() => {
        setPairIdx(nextIdx)
        setFlippedIds([movePairs[nextIdx][0].cardId])
        setPhase('flipA')
      }, delay / speed)
      return () => clearTimeout(t)
    }

    if (phase === 'flipA') {
      const pair = movePairs[pairIdx]
      const intraDelay = Math.min(1500, Math.max(300, pair[1].t - pair[0].t))
      const t = setTimeout(() => {
        setFlippedIds([pair[0].cardId, pair[1].cardId])
        setPhase('flipB')
      }, intraDelay / speed)
      return () => clearTimeout(t)
    }

    if (phase === 'flipB') {
      const pair = movePairs[pairIdx]
      const cA = cardMap[pair[0].cardId]
      const cB = cardMap[pair[1].cardId]
      const isMatch = cA.pairId === cB.pairId
      const holdDelay = isMatch ? 400 : 900
      const t = setTimeout(() => {
        if (isMatch) setMatchedPairIds(prev => new Set([...prev, cA.pairId]))
        setFlippedIds([])
        setPhase('ready')
      }, holdDelay / speed)
      return () => clearTimeout(t)
    }
  }, [isPlaying, phase, pairIdx, movePairs, cardMap, speed])

  const play = useCallback(() => setIsPlaying(true), [])
  const pause = useCallback(() => setIsPlaying(false), [])

  const reset = useCallback(() => {
    setPairIdx(-1)
    setFlippedIds([])
    setMatchedPairIds(new Set())
    setPhase('ready')
    setIsPlaying(false)
  }, [])

  return { flippedIds, matchedPairIds, phase, isPlaying, play, pause, reset, currentMove, totalMoves }
}

export default function ReplayViewer({ replay, onBack }) {
  const [speed, setSpeed] = useState(1)
  const { flippedIds, matchedPairIds, phase, isPlaying, play, pause, reset, currentMove, totalMoves } = useReplayPlayer(replay, speed)
  const isDone = phase === 'done'

  // Apply card style from the saved replay
  useEffect(() => {
    document.documentElement.setAttribute('data-card-style', replay.cardStyle)
    return () => document.documentElement.removeAttribute('data-card-style')
  }, [replay.cardStyle])

  const handleSpeedChange = (s) => {
    setSpeed(s)
  }

  return (
    <div className="replay-viewer">
      <div className="replay-viewer-header">
        <div className="replay-viewer-title">
          <span className="replay-viewer-deck">{replay.deckName}</span>
          <span className="replay-viewer-meta">{replay.gridSize.label} · {replay.moves} moves · {fmt(replay.time)}</span>
        </div>
        <div className="replay-progress-text">
          {isDone ? '✓ Complete' : `Move ${currentMove} / ${totalMoves}`}
        </div>
      </div>

      <div className="replay-controls">
        {isDone ? (
          <button className="btn-secondary" onClick={reset}>↺ Replay</button>
        ) : isPlaying ? (
          <button className="btn-primary btn-sm" onClick={pause}>⏸ Pause</button>
        ) : (
          <button className="btn-primary btn-sm" onClick={play}>▶ Play</button>
        )}
        {!isDone && <button className="btn-secondary btn-sm" onClick={reset}>↺ Reset</button>}
        <div className="speed-btns">
          {[1, 2, 4].map(s => (
            <button
              key={s}
              className={`speed-btn${speed === s ? ' active' : ''}`}
              onClick={() => handleSpeedChange(s)}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      <div className="cards-grid" style={{ '--grid-cols': replay.gridSize.cols }}>
        {replay.initialCards.map(card => (
          <CardTile
            key={card.id}
            card={card}
            isFlipped={flippedIds.includes(card.id) || matchedPairIds.has(card.pairId)}
            isMatched={matchedPairIds.has(card.pairId)}
            onClick={() => {}}
            disabled
          />
        ))}
      </div>

      {isDone && (
        <div className="replay-done-banner">
          🎉 That was the full game — {replay.moves} moves in {fmt(replay.time)}
        </div>
      )}
    </div>
  )
}
