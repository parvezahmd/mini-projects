import { Link } from 'react-router-dom'
import IconHome from './icons/IconHome'
import './Header.css'

export default function Header({ title, className = '' }) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <Link to="/" className="back-link" aria-label="Home">
        <IconHome />
      </Link>
      <h1>{title}</h1>
      <div className="page-header-spacer" />
    </header>
  )
}
