import { useState, useEffect, useCallback } from 'react'
import {
  WORD_LENGTH, MAX_GUESSES, STATE,
  evaluateGuess, buildKeyboardState,
} from './wordleLogic'
import { getRandomWord, isValidWord } from './words'
import { recordResult } from './stats'
import WordleGrid from './WordleGrid'
import WordleKeyboard from './WordleKeyboard'
import StatsModal from './StatsModal'
import IconBarChart from '../../components/icons/IconBarChart'
import './WordleGame.css'

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
]

const STORAGE_KEY = 'wordle-state'

function initState() {
  return {
    target: getRandomWord(),
    guesses: [],
    currentInput: '',
    gameOver: false,
    won: false,
    message: '',
    statsRecorded: false,
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return { ...initState(), ...JSON.parse(saved) }
  } catch {}
  return initState()
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, message: '' }))
  } catch {}
}

export default function WordleGame() {
  const [state, setState] = useState(loadState)
  const [showStats, setShowStats] = useState(false)
  const [pressedKey, setPressedKey] = useState(null)

  const submitGuess = useCallback(() => {
    setState(prev => {
      if (prev.gameOver) return prev
      const input = prev.currentInput.toUpperCase()

      if (input.length < WORD_LENGTH) {
        return { ...prev, message: 'Not enough letters' }
      }
      if (!isValidWord(input)) {
        return { ...prev, message: 'Not in word list' }
      }

      const evaluated = evaluateGuess(input, prev.target)
      const newGuesses = [...prev.guesses, evaluated]
      const won = evaluated.every(t => t.state === STATE.CORRECT)
      const gameOver = won || newGuesses.length >= MAX_GUESSES

      return {
        ...prev,
        guesses: newGuesses,
        currentInput: '',
        gameOver,
        won,
        statsRecorded: false,
        message: won
          ? ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'][newGuesses.length - 1]
          : gameOver
            ? prev.target
            : '',
      }
    })
  }, [])

  const handleKey = useCallback((key) => {
    setState(prev => {
      if (prev.gameOver) return prev
      if (key === 'ENTER') return prev
      if (key === '⌫' || key === 'BACKSPACE') {
        return { ...prev, currentInput: prev.currentInput.slice(0, -1), message: '' }
      }
      if (/^[A-Z]$/.test(key) && prev.currentInput.length < WORD_LENGTH) {
        return { ...prev, currentInput: prev.currentInput + key, message: '' }
      }
      return prev
    })
  }, [])

  // Physical keyboard
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return
      const key = e.key
      if (key === 'Enter') {
        e.preventDefault()
        setPressedKey('ENTER')
        submitGuess()
      } else if (key === 'Backspace' || key === 'Delete') {
        e.preventDefault()
        setPressedKey('⌫')
        handleKey('⌫')
      } else if (/^[a-zA-Z]$/.test(key)) {
        e.preventDefault()
        setPressedKey(key.toUpperCase())
        handleKey(key.toUpperCase())
      }
    }
    const onKeyUp = () => setPressedKey(null)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [handleKey, submitGuess])

  // Record stats once when game ends
  useEffect(() => {
    if (state.gameOver && !state.statsRecorded) {
      recordResult(state.won, state.guesses.length)
      setState(prev => ({ ...prev, statsRecorded: true }))
      // Auto-show stats modal after result message has been seen
      const t = setTimeout(() => setShowStats(true), 2000)
      return () => clearTimeout(t)
    }
  }, [state.gameOver, state.statsRecorded, state.won, state.guesses.length])

  // Persist state to localStorage on every change
  useEffect(() => {
    saveState(state)
  }, [state])

  // Auto-clear non-permanent messages
  useEffect(() => {
    if (state.message && !state.gameOver) {
      const t = setTimeout(() => setState(prev => ({ ...prev, message: '' })), 1500)
      return () => clearTimeout(t)
    }
  }, [state.message, state.gameOver])

  const keyboardState = buildKeyboardState(state.guesses)

  const onVirtualKey = (key) => {
    if (key === 'ENTER') submitGuess()
    else handleKey(key)
  }

  return (
    <div className="wordle-game">
      <div className="wordle-top-bar">
        <div className="wordle-message-bar">
          {state.message && (
            <div className={`wordle-message ${state.gameOver ? (state.won ? 'won' : 'lost') : ''}`}>
              {state.message}
            </div>
          )}
        </div>
        <button className="stats-btn" onClick={() => setShowStats(true)} aria-label="View statistics">
          <IconBarChart />
        </button>
      </div>

      <WordleGrid
        guesses={state.guesses}
        currentInput={state.currentInput}
        maxGuesses={MAX_GUESSES}
        wordLength={WORD_LENGTH}
      />

      <WordleKeyboard
        rows={KEYBOARD_ROWS}
        keyboardState={keyboardState}
        onKey={onVirtualKey}
        pressedKey={pressedKey}
      />

      {state.gameOver && (
        <div className="wordle-actions">
          <button className="new-game-btn" onClick={() => {
            localStorage.removeItem(STORAGE_KEY)
            setState(initState())
          }}>
            New Game
          </button>
        </div>
      )}

      {showStats && (
        <StatsModal
          onClose={() => setShowStats(false)}
          lastGuessCount={state.guesses.length}
          won={state.won}
        />
      )}
    </div>
  )
}
