export const WORD_LENGTH = 5
export const MAX_GUESSES = 6

// Tile states
export const STATE = {
  EMPTY: 'empty',
  ACTIVE: 'active',
  CORRECT: 'correct',   // green - right letter, right position
  PRESENT: 'present',   // yellow - right letter, wrong position
  ABSENT: 'absent',     // gray - letter not in word
}

/**
 * Evaluates a guess against the target word.
 * Returns an array of { letter, state } objects.
 */
export function evaluateGuess(guess, target) {
  const result = Array(WORD_LENGTH).fill(null).map((_, i) => ({
    letter: guess[i],
    state: STATE.ABSENT,
  }))

  const targetLetters = target.split('')
  const guessLetters = guess.split('')

  // First pass: mark correct positions
  const usedTarget = Array(WORD_LENGTH).fill(false)
  const usedGuess = Array(WORD_LENGTH).fill(false)

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i].state = STATE.CORRECT
      usedTarget[i] = true
      usedGuess[i] = true
    }
  }

  // Second pass: mark present letters
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (usedGuess[i]) continue
    for (let j = 0; j < WORD_LENGTH; j++) {
      if (!usedTarget[j] && guessLetters[i] === targetLetters[j]) {
        result[i].state = STATE.PRESENT
        usedTarget[j] = true
        break
      }
    }
  }

  return result
}

/**
 * Builds keyboard letter state map from all evaluated rows.
 * Best state wins: correct > present > absent.
 */
export function buildKeyboardState(evaluatedRows) {
  const priority = { [STATE.CORRECT]: 3, [STATE.PRESENT]: 2, [STATE.ABSENT]: 1 }
  const map = {}
  for (const row of evaluatedRows) {
    for (const { letter, state } of row) {
      const current = map[letter]
      if (!current || priority[state] > priority[current]) {
        map[letter] = state
      }
    }
  }
  return map
}
