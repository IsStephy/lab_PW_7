export const CARD_THEMES = {
  animals: {
    label: 'Animals', icon: '🐾',
    emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐙','🦋','🦄','🐬','🦅','🐘','🦒','🦓','🐊','🐢','🦎','🐠','🐡','🦈','🐧','🦉','🦚','🦜'],
  },
  food: {
    label: 'Food', icon: '🍕',
    emojis: ['🍕','🍔','🍟','🌮','🍜','🍣','🍩','🎂','🍦','🍇','🍓','🍊','🍋','🍎','🍑','🥑','🌽','🥕','🧁','🍫','🍬','🍭','🥐','🥞','🧇','🥗','🍱','🥟','🧆','🍲','🥘','🍛'],
  },
  nature: {
    label: 'Nature', icon: '🌿',
    emojis: ['🌸','🌺','🌻','🌹','🌷','🍀','🌿','🌊','🌙','⭐','🌈','🌋','🏔️','🌅','🌄','🌠','❄️','🍁','🍂','🌾','🌵','🎋','🌍','☀️','⛅','🌤️','🌦️','🌧️','⛈️','🌩️','🌪️','🌫️'],
  },
  sports: {
    label: 'Sports', icon: '⚽',
    emojis: ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸','🥊','🎯','🏹','🎳','🏋️','⛷️','🏂','🏊','🚴','🤾','🏇','🧗','🥋','⛳','🎿','🛷','🏄','🤽','🚵','🤿','🧘','🤼'],
  },
}

export const GRID_SIZES = [
  { id: 'easy',   label: 'Easy',   icon: '😊', cols: 4, pairs: 8  },
  { id: 'medium', label: 'Medium', icon: '😤', cols: 6, pairs: 18 },
  { id: 'hard',   label: 'Hard',   icon: '😰', cols: 8, pairs: 32 },
]

export const CARD_STYLES = [
  { id: 'classic', label: 'Classic', preview: '🃏' },
  { id: 'neon',    label: 'Neon',    preview: '💡' },
  { id: 'wooden',  label: 'Wooden',  preview: '🪵' },
  { id: 'ocean',   label: 'Ocean',   preview: '🌊' },
]

export function generateCards(cardTheme, pairs) {
  const emojis = CARD_THEMES[cardTheme].emojis.slice(0, pairs)
  const cards = emojis.flatMap((emoji, i) => [
    { id: `${i}-a`, pairId: String(i), emoji },
    { id: `${i}-b`, pairId: String(i), emoji },
  ])
  return shuffle(cards)
}

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
