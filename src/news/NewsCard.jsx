import { useState, useRef, useEffect } from 'react'
import './NewsCard.css'

export default function NewsCard({ article, summary, onRequestSummary }) {
  const { title, urlToImage, url, source, publishedAt, author } = article
  const cardRef = useRef(null)
  const collapsedHeight = useRef(null)
  const transitionListener = useRef(null)
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)
  function isDesktop() { return window.innerWidth >= 1024 }

  useEffect(() => {
    function handleResize() {
      if (!isDesktop() && cardRef.current) {
        cardRef.current.style.height = ''
        collapsedHeight.current = null
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Check if summary is actually clamped whenever it loads or changes
  useEffect(() => {
    setSummaryExpanded(false)
    const desc = getDesc()
    if (!desc) return
    setIsClamped(desc.scrollHeight > desc.clientHeight)
  }, [summary])

  // After React re-renders with expanded class, animate card to full height
  useEffect(() => {
    const card = cardRef.current
    if (!card || !summaryExpanded) return
    card.style.height = card.scrollHeight + 'px'
  }, [summaryExpanded])

  function getDesc() {
    return cardRef.current?.querySelector('.news-card-desc')
  }

  function handleMouseEnter() {
    if (!isDesktop()) return
    const card = cardRef.current
    if (transitionListener.current) {
      card.removeEventListener('transitionend', transitionListener.current)
      transitionListener.current = null
    }
    if (collapsedHeight.current === null) {
      collapsedHeight.current = card.offsetHeight
      card.style.height = collapsedHeight.current + 'px'
      card.offsetHeight // force reflow
    }
    getDesc()?.classList.add('expanded')
    card.style.height = card.scrollHeight + 'px'
  }

  function handleMouseLeave() {
    if (!isDesktop()) return
    const card = cardRef.current
    if (collapsedHeight.current === null) return
    card.style.height = collapsedHeight.current + 'px'

    function onEnd(e) {
      if (e.propertyName === 'height') {
        getDesc()?.classList.remove('expanded')
        card.removeEventListener('transitionend', onEnd)
        transitionListener.current = null
      }
    }
    transitionListener.current = onEnd
    card.addEventListener('transitionend', onEnd)
  }

  function handleToggle() {
    const card = cardRef.current
    if (!summaryExpanded) {
      if (transitionListener.current) {
        card.removeEventListener('transitionend', transitionListener.current)
        transitionListener.current = null
      }
      if (collapsedHeight.current === null) {
        collapsedHeight.current = card.offsetHeight
        card.style.height = collapsedHeight.current + 'px'
        card.offsetHeight // force reflow
      }
      // setSummaryExpanded triggers re-render adding expanded class,
      // then useEffect sets height to scrollHeight to start animation
      setSummaryExpanded(true)
    } else {
      if (collapsedHeight.current === null) return
      card.style.height = collapsedHeight.current + 'px'

      function onEnd(e) {
        if (e.propertyName === 'height') {
          setSummaryExpanded(false)
          card.removeEventListener('transitionend', onEnd)
          transitionListener.current = null
        }
      }
      transitionListener.current = onEnd
      card.addEventListener('transitionend', onEnd)
    }
  }

  const date = new Date(publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const isLoading = summary === 'loading'

  return (
    <article
      className="news-card"
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {urlToImage && (
        <div className="news-card-image">
          <img
            src={urlToImage}
            alt=""
            onError={(e) => (e.target.parentElement.style.display = 'none')}
          />
        </div>
      )}
      <div className="news-card-body">
        <div className="news-card-meta">
          {source?.name && <span className="news-card-source">{source.name}</span>}
          <span className="news-card-date">{date}</span>
          {author && <span className="news-card-author">By {author}</span>}
        </div>

        <a href={url} target="_blank" rel="noopener noreferrer" className="news-card-title-link">
          <h3 className="news-card-title">{title}</h3>
        </a>

        {isLoading ? (
          <div className="news-card-skeleton">
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        ) : summary ? (
          <>
            <p className={`news-card-desc${summaryExpanded ? ' expanded' : ''}`}>{summary}</p>
            {isClamped && (
              <button className="news-card-toggle" onClick={handleToggle}>
                {summaryExpanded ? 'Show less ↑' : 'Show more ↓'}
              </button>
            )}
          </>
        ) : (
          <button className="news-card-summarize" onClick={() => onRequestSummary(article)}>
            ✦ Get AI Summary
          </button>
        )}

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="news-card-link"
        >
          Read full article →
        </a>
      </div>
    </article>
  )
}
