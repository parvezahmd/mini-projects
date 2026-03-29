import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import WordlePage from './pages/WordlePage'
import NewsPage from './pages/NewsPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/wordle" element={<WordlePage />} />
      <Route path="/news" element={<NewsPage />} />
    </Routes>
  )
}

export default App
