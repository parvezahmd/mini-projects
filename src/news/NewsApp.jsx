import { useState, useEffect } from 'react'
import NewsCard from './NewsCard'
import './NewsApp.css'

const ARTICLE_CACHE_TTL = 60 * 60 * 1000 // 1 hour

function loadArticleCache(category) {
  try {
    const raw = localStorage.getItem(`guardian_articles_${category}`)
    if (!raw) return null
    const { articles, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > ARTICLE_CACHE_TTL) return null
    return articles
  } catch {
    return null
  }
}

function saveArticleCache(category, articles) {
  try {
    localStorage.setItem(
      `guardian_articles_${category}`,
      JSON.stringify({ articles, timestamp: Date.now() })
    )
  } catch {}
}

function loadSummaryCache(url) {
  try {
    return localStorage.getItem(`guardian_summary_${btoa(url)}`) || null
  } catch {
    return null
  }
}

function saveSummaryCache(url, summary) {
  try {
    localStorage.setItem(`guardian_summary_${btoa(url)}`, summary)
  } catch {}
}

const CATEGORIES = [
  { id: 'technology', label: 'Technology', icon: '💻', section: 'technology' },
  { id: 'sports', label: 'Sports', icon: '⚽', section: 'sport' },
  { id: 'business', label: 'Business', icon: '📈', section: 'business' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', section: 'culture' },
  { id: 'health', label: 'Health', icon: '❤️', section: 'lifeandstyle' },
  { id: 'science', label: 'Science', icon: '🔬', section: 'science' },
  { id: 'top', label: 'Top Stories', icon: '🌐', section: '' },
  { id: 'world', label: 'World', icon: '🗺️', section: 'world' },
]


function normalizeArticle(raw) {
  return {
    title: raw.webTitle,
    url: raw.webUrl,
    urlToImage: raw.fields?.thumbnail || null,
    source: { name: 'The Guardian' },
    author: raw.fields?.byline || null,
    publishedAt: raw.webPublicationDate || new Date().toISOString(),
    description: raw.fields?.trailText || '',
    content: raw.fields?.bodyText || '',
  }
}

async function fetchSummaryForArticle(article) {
  const { url, title, description, content } = article
  const fallback = [title, description, content].filter(Boolean).join('\n\n')
  try {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, fallback }),
    })
    const data = await res.json()
    return data.summary || description || null
  } catch {
    return description || null
  }
}

export default function NewsApp() {
  const [activeCategory, setActiveCategory] = useState('technology')
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [summaries, setSummaries] = useState({})
  const [menuOpen, setMenuOpen] = useState(false)

  const activeLabel = CATEGORIES.find((c) => c.id === activeCategory)

  useEffect(() => {
    loadNews(activeCategory)
  }, [activeCategory])

  async function loadNews(category) {
    const cachedArticles = loadArticleCache(category)
    if (cachedArticles) {
      setArticles(cachedArticles)
      setSummaries(Object.fromEntries(
        cachedArticles.map((a) => [a.url, loadSummaryCache(a.url)]).filter(([, s]) => s)
      ))
      setError(null)
      return
    }

    const apiKey = import.meta.env.VITE_GUARDIAN_API_KEY
    if (!apiKey) {
      setError('Missing API key. Add VITE_GUARDIAN_API_KEY to your .env file from open-platform.theguardian.com')
      setArticles([])
      return
    }

    const cat = CATEGORIES.find((c) => c.id === category)
    const sectionParam = cat?.section ? `&section=${cat.section}` : ''

    setLoading(true)
    setError(null)
    setSummaries({})
    try {
      const res = await fetch(
        `https://content.guardianapis.com/search?api-key=${apiKey}${sectionParam}&show-fields=thumbnail,byline,trailText,bodyText&page-size=5&order-by=newest`
      )
      const data = await res.json()
      if (data.response?.status !== 'ok') throw new Error('Failed to fetch news')

      const filtered = (data.response?.results || [])
        .filter((a) => a.webTitle && a.webUrl)
        .slice(0, 5)
        .map(normalizeArticle)

      setArticles(filtered)
      setSummaries(Object.fromEntries(
        filtered.map((a) => [a.url, loadSummaryCache(a.url)]).filter(([, s]) => s)
      ))
      setLoading(false)
      saveArticleCache(category, filtered)
    } catch (err) {
      setError(err.message || 'Failed to fetch news. Please try again.')
      setArticles([])
      setLoading(false)
    }
  }

  async function handleRequestSummary(article) {
    setSummaries(prev => ({ ...prev, [article.url]: 'loading' }))
    const summary = await fetchSummaryForArticle(article)
    if (summary) saveSummaryCache(article.url, summary)
    setSummaries(prev => ({ ...prev, [article.url]: summary }))
  }

  return (
    <div className="news-app">
      <nav className="news-categories-nav">
        {/* Mobile: hamburger + active label */}
        <button className="news-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open categories">
          <span />
          <span />
          <span />
        </button>
        <span className="news-nav-active-label">
          {activeLabel?.icon} {activeLabel?.label}
        </span>

        {/* Desktop: horizontal scrollable categories */}
        <div className="news-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`news-category-btn${activeCategory === cat.id ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className="news-category-icon">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Sidebar overlay */}
      <div
        className={`news-sidebar-overlay${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Sidebar drawer */}
      <div className={`news-sidebar${menuOpen ? ' open' : ''}`}>
        <div className="news-sidebar-header">
          <span className="news-sidebar-title">Categories</span>
          <button className="news-sidebar-close" onClick={() => setMenuOpen(false)}>✕</button>
        </div>
        <div className="news-sidebar-list">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`news-category-btn${activeCategory === cat.id ? ' active' : ''}`}
              onClick={() => { setActiveCategory(cat.id); setMenuOpen(false) }}
            >
              <span className="news-category-icon">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="news-content">
        {loading && (
          <div className="news-loading">
            <div className="news-spinner" />
            <span>Loading news...</span>
          </div>
        )}

        {!loading && error && (
          <div className="news-error">
            <span className="news-error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="news-empty">No articles found for this category.</div>
        )}

        {!loading && !error && articles.length > 0 && (
          <div className="news-grid">
            {articles.map((article, i) => (
              <NewsCard
                key={i}
                article={article}
                summary={summaries[article.url]}
                onRequestSummary={handleRequestSummary}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
