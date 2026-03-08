import { STATE } from './wordleLogic'
import './WordleGrid.css'

function Tile({ letter, state, revealed }) {
  return (
    <div
      className={`tile ${state} ${revealed ? 'revealed' : ''} ${letter && state === STATE.EMPTY ? 'filled' : ''}`}
      data-state={state}
    >
      {letter}
    </div>
  )
}

function Row({ tiles, wordLength }) {
  return (
    <div className="wordle-row">
      {tiles.map((tile, i) => (
        <Tile key={i} {...tile} />
      ))}
    </div>
  )
}

export default function WordleGrid({ guesses, currentInput, maxGuesses, wordLength }) {
  const rows = []

  // Completed guess rows
  for (let i = 0; i < guesses.length; i++) {
    const tiles = guesses[i].map(({ letter, state }) => ({
      letter,
      state,
      revealed: true,
    }))
    rows.push(<Row key={i} tiles={tiles} wordLength={wordLength} />)
  }

  // Current input row
  if (guesses.length < maxGuesses) {
    const tiles = Array(wordLength).fill(null).map((_, i) => ({
      letter: currentInput[i] || '',
      state: STATE.EMPTY,
      revealed: false,
    }))
    rows.push(<Row key="current" tiles={tiles} wordLength={wordLength} />)
  }

  // Empty remaining rows
  const remaining = maxGuesses - guesses.length - (guesses.length < maxGuesses ? 1 : 0)
  for (let i = 0; i < remaining; i++) {
    const tiles = Array(wordLength).fill(null).map(() => ({
      letter: '',
      state: STATE.EMPTY,
      revealed: false,
    }))
    rows.push(<Row key={`empty-${i}`} tiles={tiles} wordLength={wordLength} />)
  }

  return <div className="wordle-grid">{rows}</div>
}
