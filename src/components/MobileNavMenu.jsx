import { useState } from 'react'
import './MobileNavMenu.css'

export default function MobileNavMenu({ items, active, onSelect, title, desktopLayout = 'scroll' }) {
  const [open, setOpen] = useState(false)
  const activeItem = items.find(i => i.id === active)

  function select(id) {
    onSelect(id)
    setOpen(false)
  }

  return (
    <>
      <nav className="mnm-nav">
        <button className="mnm-hamburger" onClick={() => setOpen(true)} aria-label="Open menu">
          <span /><span /><span />
        </button>
        <span className="mnm-active-label">
          {activeItem?.icon} {activeItem?.label}
        </span>
        <div className={`mnm-items${desktopLayout === 'wrap' ? ' mnm-items--wrap' : ''}`}>
          {items.map(item => (
            <button
              key={item.id}
              className={`mnm-item${active === item.id ? ' active' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <span className="mnm-item-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div className={`mnm-overlay${open ? ' open' : ''}`} onClick={() => setOpen(false)} />

      <div className={`mnm-sidebar${open ? ' open' : ''}`}>
        <div className="mnm-sidebar-header">
          <span className="mnm-sidebar-title">{title}</span>
          <button className="mnm-sidebar-close" onClick={() => setOpen(false)}>✕</button>
        </div>
        <div className="mnm-sidebar-list">
          {items.map(item => (
            <button
              key={item.id}
              className={`mnm-item${active === item.id ? ' active' : ''}`}
              onClick={() => select(item.id)}
            >
              <span className="mnm-item-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
