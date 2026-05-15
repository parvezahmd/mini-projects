import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import './TimePicker.css'

function parse(value) {
  if (!value) return { h: null, m: null, period: 'AM' }
  const [hStr, mStr] = value.split(':')
  const h24 = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  const period = h24 >= 12 ? 'PM' : 'AM'
  const h = h24 % 12 || 12
  return { h, m, period }
}

function toStr(h, m, period) {
  const hSafe = h ?? 12
  const mSafe = m ?? 0
  let h24 = hSafe % 12
  if (period === 'PM') h24 += 12
  return `${String(h24).padStart(2, '0')}:${String(mSafe).padStart(2, '0')}`
}

function scrollToSelected(ref, value) {
  const container = ref.current
  if (!container) return
  const item = container.querySelector(`[data-v="${value}"]`)
  if (item) {
    container.scrollTop = item.offsetTop - container.clientHeight / 2 + item.clientHeight / 2
  }
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

export default function TimePicker({ id, name, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const hourRef = useRef(null)
  const minRef = useRef(null)

  const { h, m, period } = parse(value)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useLayoutEffect(() => {
    if (!open) return
    scrollToSelected(hourRef, h ?? 12)
    scrollToSelected(minRef, m ?? 0)
  }, [open])

  function selectH(newH) { onChange(toStr(newH, m, period)) }
  function selectM(newM) { onChange(toStr(h, newM, period)) }
  function selectPeriod(p) { onChange(toStr(h, m, p)) }

  const display = h !== null
    ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
    : null

  return (
    <div className="tp" ref={ref}>
      <button
        type="button"
        id={id}
        name={name}
        className={`tp-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(v => !v)}
      >
        <span className={display ? 'tp-val' : 'tp-placeholder'}>
          {display ?? '--:-- --'}
        </span>
        <svg className="tp-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M7 4.5V7L8.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="tp-dropdown">
          <div className="tp-cols">
            <div className="tp-col" ref={hourRef}>
              <div className="tp-col-label">HR</div>
              {HOURS.map(hv => (
                <button
                  key={hv}
                  data-v={hv}
                  className={`tp-item${hv === h ? ' sel' : ''}`}
                  onClick={() => selectH(hv)}
                >
                  {String(hv).padStart(2, '0')}
                </button>
              ))}
            </div>

            <div className="tp-sep">:</div>

            <div className="tp-col" ref={minRef}>
              <div className="tp-col-label">MIN</div>
              {MINUTES.map(mv => (
                <button
                  key={mv}
                  data-v={mv}
                  className={`tp-item${mv === m ? ' sel' : ''}`}
                  onClick={() => selectM(mv)}
                >
                  {String(mv).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>

          <div className="tp-period">
            {['AM', 'PM'].map(p => (
              <button
                key={p}
                className={`tp-period-btn${p === period ? ' sel' : ''}`}
                onClick={() => selectPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
