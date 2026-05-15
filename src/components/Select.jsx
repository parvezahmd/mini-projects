import { useState, useRef, useEffect } from 'react'
import './Select.css'

export default function Select({ id, name, value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const selected = options.find(o => o.value === value)

  function handleSelect(val) {
    setOpen(false)
    onChange(val)
  }

  return (
    <div className="sel" ref={ref}>
      <button
        type="button"
        id={id}
        name={name}
        className={`sel-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="sel-trigger-text">
          <span className="sel-label">{selected.label}</span>
          {selected.sublabel && <span className="sel-sublabel">— {selected.sublabel}</span>}
        </span>
        <svg className="sel-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <ul className="sel-dropdown" role="listbox">
          {options.map(o => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`sel-option${o.value === value ? ' selected' : ''}`}
              onClick={() => handleSelect(o.value)}
            >
              <span className="sel-label">{o.label}</span>
              {o.sublabel && <span className="sel-opt-sublabel">— {o.sublabel}</span>}
              {o.value === value && (
                <svg className="sel-check" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
