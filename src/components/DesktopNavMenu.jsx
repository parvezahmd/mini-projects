import './DesktopNavMenu.css'

export default function DesktopNavMenu({ items, active, onSelect, layout = 'scroll', className = '' }) {
  return (
    <nav className={`dnm-nav${className ? ` ${className}` : ''}`}>
      <div className={`dnm-items${layout === 'wrap' ? ' dnm-items--wrap' : ''}`}>
        {items.map(item => (
          <button
            key={item.id}
            className={`dnm-item${active === item.id ? ' active' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <span className="dnm-item-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
