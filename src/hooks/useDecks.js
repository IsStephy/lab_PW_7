import { useState, useCallback, useEffect } from 'react'
import { loadDecks, saveDecks } from '../utils/storage'
import { apiGetDecks, apiCreateDeck, apiUpdateDeck, apiDeleteDeck } from '../utils/api'

export function useDecks() {
  const [decks, setDecks] = useState([])

  // Load from API on mount; fall back to localStorage if backend is unreachable
  useEffect(() => {
    apiGetDecks()
      .then(data => setDecks(data.items))
      .catch(() => setDecks(loadDecks()))
  }, [])

  const addDeck = useCallback((name, cardTheme) => {
    const deck = {
      id: Date.now().toString(),
      name,
      cardTheme,
      favorite: false,
      createdAt: Date.now(),
      bestScores: {},
    }
    setDecks(prev => [...prev, deck])
    apiCreateDeck(deck).catch(() =>
      setDecks(prev => { saveDecks(prev); return prev })
    )
  }, [])

  const deleteDeck = useCallback((id) => {
    setDecks(prev => {
      const next = prev.filter(d => d.id !== id)
      apiDeleteDeck(id).catch(() => saveDecks(next))
      return next
    })
  }, [])

  const toggleFavorite = useCallback((id) => {
    setDecks(prev => {
      const deck = prev.find(d => d.id === id)
      if (!deck) return prev
      const updates = { favorite: !deck.favorite }
      const next = prev.map(d => d.id === id ? { ...d, ...updates } : d)
      apiUpdateDeck(id, updates).catch(() => saveDecks(next))
      return next
    })
  }, [])

  const updateBestScore = useCallback((id, gridId, score) => {
    setDecks(prev => {
      const deck = prev.find(d => d.id === id)
      if (!deck) return prev
      const cur = deck.bestScores[gridId]
      const better = !cur || score.moves < cur.moves || (score.moves === cur.moves && score.time < cur.time)
      if (!better) return prev
      const bestScores = { ...deck.bestScores, [gridId]: score }
      const next = prev.map(d => d.id === id ? { ...d, bestScores } : d)
      apiUpdateDeck(id, { bestScores }).catch(() => saveDecks(next))
      return next
    })
  }, [])

  return { decks, addDeck, deleteDeck, toggleFavorite, updateBestScore }
}
