import { Link } from 'react-router-dom'
import WordleGame from '../games/wordle/WordleGame'
import './WordlePage.css'

export default function WordlePage() {
  return (
    <div className="wordle-page">
      <header className="wordle-page-header">
        <Link to="/" className="back-link">← Home</Link>
        <h1>Wordle</h1>
        <div style={{ width: 60 }} />
      </header>
      <WordleGame />
    </div>
  )
}
