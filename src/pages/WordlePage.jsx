import PageHeader from '../components/PageHeader'
import WordleGame from '../games/wordle/WordleGame'
import './WordlePage.css'

export default function WordlePage() {
  return (
    <div className="wordle-page">
      <PageHeader title="Wordle" className="wordle-page-header" />
      <WordleGame />
    </div>
  )
}
