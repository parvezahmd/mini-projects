import IconGitHub from './icons/IconGitHub'
import IconLinkedIn from './icons/IconLinkedIn'
import IconEmail from './icons/IconEmail'
import './Footer.css'

const LINKS = [
  { label: 'GitHub',   href: 'https://github.com/parvezahmd/mini-projects',     icon: <IconGitHub /> },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/parvezahmeduic',       icon: <IconLinkedIn /> },
  { label: 'Email',    href: 'mailto:parvez.ahmed.iiit@gmail.com',               icon: <IconEmail /> },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-links">
        {LINKS.map(({ label, href, icon }) => (
          <a
            key={label}
            href={href}
            className="footer-link"
            target={href.startsWith('mailto') ? undefined : '_blank'}
            rel={href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
            aria-label={label}
          >
            {icon}
          </a>
        ))}
      </div>
      <p className="footer-copy">
        © {new Date().getFullYear()} Parvez Ahmed · Built with React
      </p>
    </footer>
  )
}
