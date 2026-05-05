const ENTRIES = [
  {
    version: 'v1.6',
    date: '2026-05-05',
    icon: '🎬',
    title: 'Game Replays & Changelog',
    items: [
      'Every game is recorded move-by-move with real timing',
      'Save replays from the Win screen and rewatch them anytime',
      'Replay viewer with Play / Pause, Reset, and 1×/2×/4× speed',
      'Changelog screen (this page!) accessible from the header',
    ],
  },
  {
    version: 'v1.5',
    date: '2026-04-29',
    icon: '⚙️',
    title: 'CI/CD & GitHub Pages',
    items: [
      'Deployed to GitHub Pages with correct Vite base path',
      'GitHub Actions workflow with concurrent-run cancellation',
      'Node 20 deprecation warnings silenced in CI',
    ],
  },
  {
    version: 'v1.4',
    date: '2026-04-21',
    icon: '👥',
    title: 'Real-Time P2P Multiplayer',
    items: [
      'Live multiplayer via PeerJS (WebRTC peer-to-peer, no server needed)',
      'Host creates a room and shares a 6-character code',
      'Guest joins with the code; both see the same board',
      'Turn-based play with live scoreboard and win detection',
    ],
  },
  {
    version: 'v1.3',
    date: '2026-04-21',
    icon: '🧭',
    title: 'Single-Player Navigation & Multiplayer Entry',
    items: [
      'Full deck → settings → game → win flow',
      'Lobby screen entry point for multiplayer',
      'Header back-navigation between all views',
    ],
  },
  {
    version: 'v1.2',
    date: '2026-04-21',
    icon: '🏆',
    title: 'Best Scores & Themes',
    items: [
      'Best score tracking per deck per grid size (moves + time)',
      'Score badges displayed on each deck card',
      'Light / dark theme toggle with localStorage persistence',
    ],
  },
  {
    version: 'v1.1',
    date: '2026-04-21',
    icon: '🎨',
    title: 'Card Styles & Game Settings',
    items: [
      '4 card back styles: Classic, Neon, Wooden, Ocean',
      'Grid size selector: Easy (4×4), Medium (6×6), Hard (8×8)',
      'Custom deck creation with emoji theme picker',
      'Favorite deck toggling and filter tabs',
    ],
  },
  {
    version: 'v1.0',
    date: '2026-04-21',
    icon: '🧠',
    title: 'Initial Release',
    items: [
      'Core memory game: shuffle, flip, match, win detection',
      '3 built-in card themes: Animals, Food, Nature',
      'Move counter and elapsed timer',
      'Smooth 3-D card-flip animation',
    ],
  },
]

export default function ChangelogScreen({ onBack }) {
  return (
    <div className="changelog-screen">
      <div className="changelog-header">
        <h2>Development Changelog</h2>
        <p className="changelog-subtitle">A history of every feature shipped in Memory Game</p>
      </div>
      <div className="changelog-timeline">
        {ENTRIES.map((entry, i) => (
          <div key={entry.version} className="changelog-entry">
            <div className="changelog-spine">
              <div className="changelog-dot">{entry.icon}</div>
              {i < ENTRIES.length - 1 && <div className="changelog-line" />}
            </div>
            <div className="changelog-card">
              <div className="changelog-card-header">
                <span className="changelog-version">{entry.version}</span>
                <span className="changelog-title">{entry.title}</span>
                <span className="changelog-date">{entry.date}</span>
              </div>
              <ul className="changelog-items">
                {entry.items.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
