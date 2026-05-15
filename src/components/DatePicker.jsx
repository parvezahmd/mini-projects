import { useState, useRef, useEffect } from 'react'
import './DatePicker.css'

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']
const YEAR_PAGE = 12

function parseDate(value) {
  if (!value) return null
  const d = new Date(value + 'T00:00:00')
  return isNaN(d.getTime()) ? null : d
}

function toStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function buildCells(viewYear, viewMonth) {
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const total = daysInMonth(viewYear, viewMonth)
  const prevTotal = daysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1)
  const cells = []
  for (let i = firstDay - 1; i >= 0; i--) {
    const month = viewMonth === 0 ? 11 : viewMonth - 1
    const year  = viewMonth === 0 ? viewYear - 1 : viewYear
    cells.push({ day: prevTotal - i, month, year, current: false })
  }
  for (let d = 1; d <= total; d++) {
    cells.push({ day: d, month: viewMonth, year: viewYear, current: true })
  }
  while (cells.length < 42) {
    const d     = cells.length - firstDay - total + 1
    const month = viewMonth === 11 ? 0 : viewMonth + 1
    const year  = viewMonth === 11 ? viewYear + 1 : viewYear
    cells.push({ day: d, month, year, current: false })
  }
  return cells
}

export default function DatePicker({ id, name, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('day')
  const ref  = useRef(null)
  const today = new Date()

  const selected = parseDate(value)
  const [viewYear,  setViewYear]  = useState(selected?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected?.getMonth()    ?? today.getMonth())
  const [yearStart, setYearStart] = useState(() => {
    const y = selected?.getFullYear() ?? today.getFullYear()
    return Math.floor(y / YEAR_PAGE) * YEAR_PAGE
  })

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function toggleOpen() {
    setView('day')
    setOpen(v => !v)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function selectDay(cell) {
    onChange(toStr(cell.year, cell.month, cell.day))
    if (!cell.current) { setViewYear(cell.year); setViewMonth(cell.month) }
    setOpen(false)
  }

  function selectMonth(i) {
    setViewMonth(i)
    setView('day')
  }

  function selectYear(y) {
    setViewYear(y)
    setView('month')
  }

  function enterYearView() {
    setYearStart(Math.floor(viewYear / YEAR_PAGE) * YEAR_PAGE)
    setView('year')
  }

  function selectToday() {
    onChange(toStr(today.getFullYear(), today.getMonth(), today.getDate()))
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    setView('day')
    setOpen(false)
  }

  function isToday(cell) {
    return cell.day === today.getDate() &&
           cell.month === today.getMonth() &&
           cell.year === today.getFullYear()
  }
  function isSelected(cell) {
    if (!selected) return false
    return cell.day === selected.getDate() &&
           cell.month === selected.getMonth() &&
           cell.year === selected.getFullYear()
  }

  const display = selected
    ? selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const cells = buildCells(viewYear, viewMonth)
  const years = Array.from({ length: YEAR_PAGE }, (_, i) => yearStart + i)

  const headerConfig = {
    day:   { label: `${MONTHS[viewMonth]} ${viewYear}`, onLabel: () => setView('month'), onPrev: prevMonth,                         onNext: nextMonth },
    month: { label: `${viewYear}`,                      onLabel: enterYearView,          onPrev: () => setViewYear(y => y - 1),     onNext: () => setViewYear(y => y + 1) },
    year:  { label: `${yearStart} – ${yearStart + YEAR_PAGE - 1}`, onLabel: null,        onPrev: () => setYearStart(s => s - YEAR_PAGE), onNext: () => setYearStart(s => s + YEAR_PAGE) },
  }
  const { label, onLabel, onPrev, onNext } = headerConfig[view]

  return (
    <div className="dtp" ref={ref}>
      <button
        type="button"
        id={id}
        name={name}
        className={`dtp-trigger${open ? ' open' : ''}`}
        onClick={toggleOpen}
      >
        <span className={display ? 'dtp-val' : 'dtp-placeholder'}>
          {display ?? 'MM / DD / YYYY'}
        </span>
        <svg className="dtp-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1.5" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M1.5 6H12.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M4.5 1V4M9.5 1V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div className="dtp-dropdown">
          <div className="dtp-header">
            <button className="dtp-nav" onClick={onPrev} aria-label="Previous">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M7.5 2.5L4 6L7.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className={`dtp-month-label${onLabel ? ' dtp-month-label--nav' : ''}`}
              onClick={onLabel ?? undefined}
              disabled={!onLabel}
              type="button"
            >
              {label}
              {onLabel && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2.5 3.5L5 6.5L7.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <button className="dtp-nav" onClick={onNext} aria-label="Next">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {view === 'day' && (
            <div className="dtp-grid">
              {DAYS.map(d => <span key={d} className="dtp-day-label">{d}</span>)}
              {cells.map((cell, i) => (
                <button
                  key={i}
                  className={[
                    'dtp-day',
                    !cell.current    && 'dtp-day--other',
                    isToday(cell)    && 'dtp-day--today',
                    isSelected(cell) && 'dtp-day--sel',
                  ].filter(Boolean).join(' ')}
                  onClick={() => selectDay(cell)}
                >
                  {cell.day}
                </button>
              ))}
            </div>
          )}

          {view === 'month' && (
            <div className="dtp-sel-grid">
              {MONTHS_SHORT.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  className={[
                    'dtp-sel-item',
                    i === viewMonth && 'dtp-sel-item--sel',
                    i === today.getMonth() && viewYear === today.getFullYear() && 'dtp-sel-item--today',
                  ].filter(Boolean).join(' ')}
                  onClick={() => selectMonth(i)}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {view === 'year' && (
            <div className="dtp-sel-grid">
              {years.map(y => (
                <button
                  key={y}
                  type="button"
                  className={[
                    'dtp-sel-item',
                    y === viewYear && 'dtp-sel-item--sel',
                    y === today.getFullYear() && 'dtp-sel-item--today',
                  ].filter(Boolean).join(' ')}
                  onClick={() => selectYear(y)}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
          <div className="dtp-footer">
            <button type="button" className="dtp-today-btn" onClick={selectToday}>
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
