import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import WordlePage from './pages/WordlePage'
import NewsPage from './pages/NewsPage'
import ConversionPage from './pages/ConversionPage'
import WeatherPage from './pages/WeatherPage'
import Header from './components/Header'
import Footer from './components/Footer'
import './App.css'

const PAGE_CONFIG = {
  '/wordle':  { title: 'Wordle',      className: 'wordle-page-header' },
  '/news':    { title: 'Global News', className: 'news-page-header' },
  '/convert': { title: 'Conversions', className: 'convert-page-header' },
  '/weather': { title: 'Weather',     className: 'weather-page-header' },
}

function App() {
  const location = useLocation()
  const pageConfig = PAGE_CONFIG[location.pathname]

  return (
    <div className="app-layout">
      {pageConfig && <Header title={pageConfig.title} className={pageConfig.className} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/wordle" element={<WordlePage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/convert" element={<ConversionPage />} />
        <Route path="/weather" element={<WeatherPage />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App
