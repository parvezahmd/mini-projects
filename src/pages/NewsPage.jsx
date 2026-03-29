import { Link } from 'react-router-dom'
import NewsApp from '../news/NewsApp'
import './NewsPage.css'

export default function NewsPage() {
  return (
    <div className="news-page">
      <header className="news-page-header">
        <Link to="/" className="back-link">← Home</Link>
        <h1>Global News</h1>
        <div style={{ width: 60 }} />
      </header>
      <NewsApp />
    </div>
  )
}
