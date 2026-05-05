import { useState, useRef, useCallback, useEffect } from 'react'
import Peer from 'peerjs'
import { generateCards } from '../utils/cardData'

function makeCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase()
}

// Pure function — host computes new state on every flip
function applyFlip(gs, cardId, playerId) {
  if (gs.phase !== 'playing') return null
  if (gs.currentTurnId !== playerId) return null
  if (gs.flippedIds.length >= 2) return null
  if (gs.flippedIds.includes(cardId)) return null
  const card = gs.cards.find(c => c.id === cardId)
  if (!card || card.pairId in gs.matchedPairIds) return null

  const flipped = [...gs.flippedIds, cardId]
  if (flipped.length < 2) return { ...gs, flippedIds: flipped }

  const c1 = gs.cards.find(c => c.id === flipped[0])
  const c2 = gs.cards.find(c => c.id === flipped[1])

  if (c1.pairId === c2.pairId) {
    const matchedPairIds = { ...gs.matchedPairIds, [c1.pairId]: playerId }
    const scores = { ...gs.scores, [playerId]: (gs.scores[playerId] || 0) + 1 }
    const done = Object.keys(matchedPairIds).length === gs.cards.length / 2
    // Match: same player keeps their turn
    return { ...gs, flippedIds: [], matchedPairIds, scores, phase: done ? 'finished' : 'playing', pendingReset: false }
  }

  // No match: next player after reset delay
  const idx = gs.playerOrder.indexOf(gs.currentTurnId)
  const nextTurnId = gs.playerOrder[(idx + 1) % gs.playerOrder.length]
  return { ...gs, flippedIds: flipped, pendingReset: true, pendingNextTurn: nextTurnId }
}

export function useLobby() {
  const [phase, setPhase] = useState('idle') // idle | waiting | playing | finished
  const [lobbyCode, setLobbyCode] = useState('')
  const [role, setRole] = useState(null)     // 'host' | 'guest'
  const [myId, setMyId] = useState('')
  const [myName, setMyName] = useState('')
  const [players, setPlayers] = useState([])
  const [config, setConfig] = useState(null)
  const [gameState, setGameState] = useState(null)
  const [error, setError] = useState('')

  // Refs for use inside PeerJS event handlers (always current, no stale closure)
  const peerRef = useRef(null)
  const connsRef = useRef(new Map())  // host: peerId → DataConnection
  const hostConnRef = useRef(null)    // guest: connection to host
  const myIdRef = useRef('')
  const roleRef = useRef(null)
  const playersRef = useRef([])
  const gameStateRef = useRef(null)
  const resetTimerRef = useRef(null)

  const setPs = useCallback((ps) => { playersRef.current = ps; setPlayers(ps) }, [])
  const setGs = useCallback((gs) => { gameStateRef.current = gs; setGameState(gs) }, [])

  const broadcast = useCallback((msg) => {
    connsRef.current.forEach(conn => { if (conn.open) conn.send(msg) })
  }, [])

  // HOST: after a no-match flip, reset cards and advance turn after delay
  const scheduleReset = useCallback((gs) => {
    clearTimeout(resetTimerRef.current)
    resetTimerRef.current = setTimeout(() => {
      const updated = { ...gs, flippedIds: [], pendingReset: false, currentTurnId: gs.pendingNextTurn }
      setGs(updated)
      broadcast({ type: 'state', state: updated })
    }, 900)
  }, [broadcast, setGs])

  // HOST: apply flip and broadcast result
  const processFlip = useCallback((cardId, playerId) => {
    const gs = gameStateRef.current
    if (!gs) return
    const updated = applyFlip(gs, cardId, playerId)
    if (!updated) return
    setGs(updated)
    broadcast({ type: 'state', state: updated })
    if (updated.pendingReset) scheduleReset(updated)
    if (updated.phase === 'finished') setPhase('finished')
  }, [broadcast, setGs, scheduleReset])

  // HOST: receive from a guest
  const hostReceiveRef = useRef(null)
  hostReceiveRef.current = (senderId, msg) => {
    if (msg.type === 'join_request') {
      const cur = playersRef.current
      if (cur.find(p => p.id === senderId)) return
      const updated = [...cur, { id: senderId, name: msg.name }]
      setPs(updated)
      broadcast({ type: 'players_update', players: updated })
      connsRef.current.get(senderId)?.send({ type: 'joined', players: updated })
    }
    if (msg.type === 'flip_card') {
      processFlip(msg.cardId, senderId)
    }
  }

  // GUEST: receive from host
  const guestReceiveRef = useRef(null)
  guestReceiveRef.current = (msg) => {
    if (msg.type === 'joined' || msg.type === 'players_update') {
      setPs(msg.players)
    }
    if (msg.type === 'player_left') {
      setPs(playersRef.current.filter(p => p.id !== msg.id))
    }
    if (msg.type === 'game_start') {
      setConfig(msg.config)
      setGs(msg.state)
      setPhase('playing')
    }
    if (msg.type === 'state') {
      setGs(msg.state)
      if (msg.state.phase === 'finished') setPhase('finished')
    }
  }

  // ── CREATE LOBBY ──────────────────────────────────────────
  const createLobby = useCallback((name) => {
    if (peerRef.current) return
    setError('')
    setMyName(name)

    const tryCreate = (attempt = 0) => {
      const code = makeCode()
      const peer = new Peer(code)
      peerRef.current = peer

      peer.on('open', (id) => {
        myIdRef.current = id
        roleRef.current = 'host'
        setMyId(id)
        setRole('host')
        setLobbyCode(id)
        setPs([{ id, name, isHost: true }])
        setPhase('waiting')
      })

      peer.on('connection', (conn) => {
        conn.on('open', () => {
          connsRef.current.set(conn.peer, conn)
          conn.on('data', (msg) => hostReceiveRef.current(conn.peer, msg))
          conn.on('close', () => {
            connsRef.current.delete(conn.peer)
            const updated = playersRef.current.filter(p => p.id !== conn.peer)
            setPs(updated)
            broadcast({ type: 'players_update', players: updated })
          })
        })
      })

      peer.on('error', (err) => {
        if (err.type === 'unavailable-id' && attempt < 5) {
          peer.destroy(); peerRef.current = null; tryCreate(attempt + 1)
        } else {
          setError(`Connection error: ${err.message}`)
          peer.destroy(); peerRef.current = null; setPhase('idle')
        }
      })
    }
    tryCreate()
  }, [broadcast, setPs])

  // ── JOIN LOBBY ────────────────────────────────────────────
  const joinLobby = useCallback((name, code) => {
    if (peerRef.current) return
    setError('')
    setMyName(name)
    roleRef.current = 'guest'
    setRole('guest')

    const peer = new Peer()
    peerRef.current = peer

    peer.on('open', (id) => {
      myIdRef.current = id
      setMyId(id)

      const conn = peer.connect(code.toUpperCase().trim())
      hostConnRef.current = conn

      const timeout = setTimeout(() => {
        setError('Could not connect. Check the code and try again.')
        peer.destroy(); peerRef.current = null; setPhase('idle')
      }, 8000)

      conn.on('open', () => {
        clearTimeout(timeout)
        conn.send({ type: 'join_request', name })
        setLobbyCode(code.toUpperCase().trim())
        setPhase('waiting')
      })

      conn.on('data', (msg) => guestReceiveRef.current(msg))
      conn.on('close', () => { setError('Disconnected from host.'); setPhase('idle') })
    })

    peer.on('error', (err) => {
      setError(err.type === 'peer-unavailable' ? 'Lobby not found.' : `Error: ${err.message}`)
      peer.destroy(); peerRef.current = null; setPhase('idle')
    })
  }, [])

  // ── START GAME (host only) ────────────────────────────────
  const startGame = useCallback((gameConfig) => {
    const allPlayers = playersRef.current
    const playerOrder = allPlayers.map(p => p.id)
    const initialState = {
      cards: generateCards(gameConfig.deck.cardTheme, gameConfig.gridSize.pairs),
      flippedIds: [],
      matchedPairIds: {},
      scores: Object.fromEntries(playerOrder.map(id => [id, 0])),
      currentTurnId: playerOrder[0],
      playerOrder,
      phase: 'playing',
      pendingReset: false,
      pendingNextTurn: null,
    }
    setConfig(gameConfig)
    setGs(initialState)
    setPhase('playing')
    broadcast({ type: 'game_start', config: gameConfig, state: initialState })
  }, [broadcast, setGs])

  // ── FLIP CARD ─────────────────────────────────────────────
  const flipCard = useCallback((cardId) => {
    if (roleRef.current === 'host') {
      processFlip(cardId, myIdRef.current)
    } else {
      hostConnRef.current?.send({ type: 'flip_card', cardId })
    }
  }, [processFlip])

  // ── LEAVE ─────────────────────────────────────────────────
  const leaveLobby = useCallback(() => {
    clearTimeout(resetTimerRef.current)
    connsRef.current.forEach(c => c.close())
    connsRef.current.clear()
    hostConnRef.current?.close()
    hostConnRef.current = null
    peerRef.current?.destroy()
    peerRef.current = null
    myIdRef.current = ''
    roleRef.current = null
    playersRef.current = []
    gameStateRef.current = null
    setPhase('idle'); setLobbyCode(''); setRole(null); setMyId('')
    setMyName(''); setPs([]); setConfig(null); setGs(null); setError('')
  }, [setPs, setGs])

  // Cleanup on unmount
  useEffect(() => () => {
    clearTimeout(resetTimerRef.current)
    peerRef.current?.destroy()
  }, [])

  return {
    phase, lobbyCode, role, myId, myName, players, config, gameState, error,
    createLobby, joinLobby, startGame, flipCard, leaveLobby,
  }
}
