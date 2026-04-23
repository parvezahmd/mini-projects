import { useState, useRef, useEffect } from 'react'
import './NewsCard.css'

export default function NewsCard({ article, summary, onRequestSummary }) {
  const { title, urlToImage, url, publishedAt, author, source } = article
  const cardRef = useRef(null)
  const collapsedHeight = useRef(null)
  const transitionListener = useRef(null)
  const heightBeforeSummary = useRef(null)
  const isHovered = useRef(false)
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

  useEffect(() => {
    setSummaryExpanded(false)
    const card = cardRef.current
    if (!card) return

    if (summary === 'loading') {
      heightBeforeSummary.current = card.offsetHeight
      return
    }

    if (summary) {
      // Measure clamped height now — desc is in DOM and clamped (summaryExpanded = false)
      const desc = getDesc()
      if (desc) setIsClamped(desc.scrollHeight > desc.clientHeight)

      if (transitionListener.current) {
        card.removeEventListener('transitionend', transitionListener.current)
        transitionListener.current = null
      }

      if (heightBeforeSummary.current && isDesktop() && isHovered.current) {
        // User is still hovering — animate from pre-summary height to expanded
        const fromHeight = heightBeforeSummary.current
        heightBeforeSummary.current = null

        card.style.transition = 'none'
        card.style.height = 'auto'
        const clampedHeight = card.scrollHeight

        card.style.height = fromHeight + 'px'
        card.offsetHeight // force reflow
        card.style.transition = 'height 1s ease-in-out'

        desc?.classList.add('expanded')
        collapsedHeight.current = clampedHeight // mouseLeave collapses to this
        card.style.height = card.scrollHeight + 'px'

        function onEnd(e) {
          if (e.propertyName === 'height') {
            card.removeEventListener('transitionend', onEnd)
            transitionListener.current = null
          }
        }
        transitionListener.current = onEnd
        card.addEventListener('transitionend', onEnd)
      } else {
        // Not hovering — release explicit height so CSS grid can equalize row heights
        card.style.height = ''
        card.style.transition = ''
        collapsedHeight.current = null
        heightBeforeSummary.current = null
      }
      return
    }

    // No summary — reset
    card.style.height = ''
    card.style.transition = ''
    collapsedHeight.current = null
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
    isHovered.current = true
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
    card.style.transition = 'height 1s ease-in-out'
    getDesc()?.classList.add('expanded')
    card.style.height = card.scrollHeight + 'px'
  }

  function handleMouseLeave() {
    isHovered.current = false
    if (!isDesktop()) return
    const card = cardRef.current
    if (collapsedHeight.current === null) return

    // No desc means no expansion happened — reset immediately
    if (!getDesc()) {
      card.style.height = ''
      card.style.transition = ''
      collapsedHeight.current = null
      return
    }

    // Cancel any pending transitionend listener before adding a new one
    if (transitionListener.current) {
      card.removeEventListener('transitionend', transitionListener.current)
      transitionListener.current = null
    }

    const currentHeight = card.offsetHeight

    // Peek: temporarily release our height lock and expanded class so the grid
    // tells us exactly what collapsed height it wants for this card right now.
    // This avoids using a stale captured height (which could be inflated by a
    // neighbouring card that was expanded when we first hovered).
    card.style.transition = 'none'
    card.style.height = ''
    getDesc().classList.remove('expanded')
    const targetHeight = card.offsetHeight
    getDesc().classList.add('expanded')
    card.style.height = currentHeight + 'px'
    card.offsetHeight // force reflow so the browser commits currentHeight before animation
    card.style.transition = 'height 1s ease-in-out'

    card.style.height = targetHeight + 'px'

    if (currentHeight <= targetHeight) {
      // Hover was too brief to expand — clean up immediately
      getDesc().classList.remove('expanded')
      card.style.height = ''
      card.style.transition = ''
      collapsedHeight.current = null
      return
    }

    function onEnd(e) {
      if (e.propertyName === 'height') {
        getDesc()?.classList.remove('expanded')
        card.removeEventListener('transitionend', onEnd)
        transitionListener.current = null
        card.style.height = ''
        card.style.transition = ''
        collapsedHeight.current = null
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
      card.style.transition = 'height 1s ease-in-out'
      // setSummaryExpanded triggers re-render adding expanded class,
      // then useEffect sets height to scrollHeight to start animation
      setSummaryExpanded(true)
    } else {
      if (collapsedHeight.current === null) return
      card.style.transition = 'height 1s ease-in-out'
      card.style.height = collapsedHeight.current + 'px'

      function onEnd(e) {
        if (e.propertyName === 'height') {
          setSummaryExpanded(false)
          card.removeEventListener('transitionend', onEnd)
          transitionListener.current = null
          card.style.height = ''
          card.style.transition = ''
          collapsedHeight.current = null
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
          <span className="news-card-source">{author || source?.name}</span>
          <span className="news-card-date">{date}</span>
        </div>

        <a href={url} target="_blank" rel="noopener noreferrer" className="news-card-title-link">
          <h3 className="news-card-title">{title}</h3>
        </a>

        <div className="news-card-summary-area">
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
        </div>

        {summary && summary !== 'loading' && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-card-link"
          >
            Read full article →
          </a>
        )}
      </div>
    </article>
  )
}
