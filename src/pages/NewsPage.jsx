import { Link } from 'react-router-dom'
import NewsApp from '../news/NewsApp'
import './NewsPage.css'

export default function NewsPage() {
  return (
    <div className="news-page">
      <header className="news-page-header">
        <Link to="/" className="back-link" aria-label="Home">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
            <polyline points="9 21 9 12 15 12 15 21" />
          </svg>
        </Link>
        <h1>Global News</h1>
        <div style={{ width: 60 }} />
      </header>
      <NewsApp />
    </div>
  )
}
