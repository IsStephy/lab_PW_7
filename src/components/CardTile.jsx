export default function CardTile({ card, isFlipped, isMatched, onClick, disabled }) {
  return (
    <div
      className={`card-tile${isFlipped ? ' flipped' : ''}${isMatched ? ' matched' : ''}${disabled ? ' disabled' : ''}`}
      onClick={!disabled && !isFlipped && !isMatched ? onClick : undefined}
    >
      <div className="card-inner">
        <div className="card-face card-back">
          <span className="card-back-icon">?</span>
        </div>
        <div className="card-face card-front">
          <span className="card-emoji">{card.emoji}</span>
        </div>
      </div>
    </div>
  )
}
