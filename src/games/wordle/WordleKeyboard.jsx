import './WordleKeyboard.css'

export default function WordleKeyboard({ rows, keyboardState, onKey, pressedKey }) {
  return (
    <div className="wordle-keyboard">
      {rows.map((row, ri) => (
        <div key={ri} className="keyboard-row">
          {row.map((key) => {
            const state = keyboardState[key] || 'unused'
            const isWide = key === 'ENTER' || key === '⌫'
            const isPressed = pressedKey === key
            return (
              <button
                key={key}
                className={`key ${state} ${isWide ? 'wide' : ''} ${isPressed ? 'pressed' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); onKey(key) }}
                tabIndex={-1}
                aria-label={key === '⌫' ? 'Backspace' : key}
              >
                {key}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
