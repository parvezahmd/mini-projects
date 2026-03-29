import { Link } from 'react-router-dom'
import './Home.css'

const projects = [
  {
    id: 'wordle',
    title: 'Wordle',
    description: 'Guess the hidden 5-letter word in 6 tries. Letters turn green, yellow, or gray to guide you.',
    path: '/wordle',
    icon: '🟩',
    color: '#538d4e',
  },
  {
    id: 'news',
    title: 'Global News',
    description: 'Top 5 headlines across Tech, Sports, Business, Entertainment, Health, and Science.',
    path: '/news',
    icon: '📰',
    color: '#2563eb',
  },
]

export default function Home() {
  return (
    <div className="home">
      <header className="home-header">
        <h1>Mini Projects</h1>
        <p>A collection of fun little web apps</p>
      </header>
      <main className="project-grid">
        {projects.map((project) => (
          <Link key={project.id} to={project.path} className="project-card">
            <div className="project-card-icon" style={{ backgroundColor: project.color }}>
              {project.icon}
            </div>
            <div className="project-card-body">
              <h2>{project.title}</h2>
              <p>{project.description}</p>
            </div>
            <span className="project-card-arrow">→</span>
          </Link>
        ))}
      </main>
    </div>
  )
}
