const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

let _token = null
let _tokenExpiry = 0
let _role = 'ADMIN'

export function setApiRole(role) {
  if (role === _role) return
  _role = role
  _token = null
  _tokenExpiry = 0
}

export function getApiRole() {
  return _role
}

async function getToken() {
  // Refresh 5 s before expiry (token lives 60 s)
  if (_token && Date.now() < _tokenExpiry - 5000) return _token
  const res = await fetch(`${API_BASE}/token?role=${_role}`)
  if (!res.ok) throw new Error('Failed to fetch auth token')
  const data = await res.json()
  _token = data.access_token
  _tokenExpiry = Date.now() + data.expires_in * 1000
  return _token
}

async function apiFetch(path, options = {}) {
  const token = await getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (res.status === 204) return null
  const body = await res.json()
  if (!res.ok) throw new Error(body.detail || `HTTP ${res.status}`)
  return body
}

// ── Decks ──────────────────────────────────────────────────────────────────

export async function apiGetDecks(skip = 0, limit = 100) {
  return apiFetch(`/decks?skip=${skip}&limit=${limit}`)
}

export async function apiCreateDeck(deck) {
  return apiFetch('/decks', { method: 'POST', body: JSON.stringify(deck) })
}

export async function apiUpdateDeck(id, updates) {
  return apiFetch(`/decks/${id}`, { method: 'PUT', body: JSON.stringify(updates) })
}

export async function apiDeleteDeck(id) {
  return apiFetch(`/decks/${id}`, { method: 'DELETE' })
}

// ── Replays ────────────────────────────────────────────────────────────────

export async function apiGetReplays(skip = 0, limit = 30) {
  return apiFetch(`/replays?skip=${skip}&limit=${limit}`)
}

export async function apiSaveReplay(replay) {
  return apiFetch('/replays', { method: 'POST', body: JSON.stringify(replay) })
}

export async function apiDeleteReplay(id) {
  return apiFetch(`/replays/${id}`, { method: 'DELETE' })
}
