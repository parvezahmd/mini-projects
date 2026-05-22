import { useState, useEffect, useRef } from 'react'
import DesktopNavMenu from '../components/DesktopNavMenu'
import './WeatherApp.css'

const TABS = [
  { id: 'current',  label: 'Current',  icon: '🌡️' },
  { id: 'forecast', label: '10-Day',   icon: '📅' },
  { id: 'monthly',  label: 'Monthly',  icon: '📆' },
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function weatherInfo(code) {
  if (code === 0) return { icon: '☀️',  label: 'Clear sky' }
  if (code === 1) return { icon: '🌤️', label: 'Mainly clear' }
  if (code === 2) return { icon: '⛅', label: 'Partly cloudy' }
  if (code === 3) return { icon: '☁️',  label: 'Overcast' }
  if (code <= 48) return { icon: '🌫️', label: 'Foggy' }
  if (code <= 57) return { icon: '🌦️', label: 'Drizzle' }
  if (code <= 67) return { icon: '🌧️', label: 'Rain' }
  if (code <= 77) return { icon: '❄️',  label: 'Snow' }
  if (code <= 82) return { icon: '🌧️', label: 'Showers' }
  if (code <= 86) return { icon: '🌨️', label: 'Snow showers' }
  if (code >= 95) return { icon: '⛈️', label: 'Thunderstorm' }
  return { icon: '🌡️', label: 'Unknown' }
}

function cvt(celsius, unit) {
  return unit === 'F' ? Math.round(celsius * 9 / 5 + 32) : Math.round(celsius)
}
function degUnit(unit) { return unit === 'F' ? '°F' : '°C' }

function fmtDay(dateStr, i) {
  if (i === 0) return 'Today'
  if (i === 1) return 'Tomorrow'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function aggregateMonthly(data) {
  const buckets = Array.from({ length: 12 }, () => ({ hi: [], lo: [], rain: [] }))
  data.daily.time.forEach((d, i) => {
    const m = new Date(d + 'T12:00:00').getMonth()
    if (data.daily.temperature_2m_max[i] != null) buckets[m].hi.push(data.daily.temperature_2m_max[i])
    if (data.daily.temperature_2m_min[i] != null) buckets[m].lo.push(data.daily.temperature_2m_min[i])
    if (data.daily.precipitation_sum[i]   != null) buckets[m].rain.push(data.daily.precipitation_sum[i])
  })
  return buckets.map((b, i) => ({
    name:       MONTHS[i],
    avgHigh:    b.hi.length   ? b.hi.reduce((a, v) => a + v) / b.hi.length   : null,
    avgLow:     b.lo.length   ? b.lo.reduce((a, v) => a + v) / b.lo.length   : null,
    totalPrecip: b.rain.length ? Math.round(b.rain.reduce((a, v) => a + v))   : null,
  }))
}

export default function WeatherApp() {
  const [tab,            setTab]            = useState('current')
  const [unit,           setUnit]           = useState('C')
  const [query,          setQuery]          = useState('')
  const [suggestions,    setSuggestions]    = useState([])
  const [location,       setLocation]       = useState(null)
  const [weather,        setWeather]        = useState(null)
  const [monthly,        setMonthly]        = useState(null)
  const [loading,        setLoading]        = useState(false)
  const [monthlyLoading, setMonthlyLoading] = useState(false)
  const [error,          setError]          = useState(null)
  const [geoError,       setGeoError]       = useState(null)
  const searchRef = useRef(null)

  // Geocoding autocomplete with debounce
  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`
        )
        const d = await r.json()
        setSuggestions(d.results || [])
      } catch { setSuggestions([]) }
    }, 350)
    return () => clearTimeout(t)
  }, [query])

  // Dismiss suggestions on outside click
  useEffect(() => {
    const fn = e => { if (searchRef.current && !searchRef.current.contains(e.target)) setSuggestions([]) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Fetch forecast whenever location changes
  useEffect(() => {
    if (!location) return
    fetchForecast(location.latitude, location.longitude, location.name === 'My Location')
  }, [location])

  // Fetch monthly on first visit to that tab
  useEffect(() => {
    if (tab !== 'monthly' || !location || monthly || monthlyLoading) return
    fetchMonthly(location.latitude, location.longitude)
  }, [tab, location])

  async function fetchForecast(lat, lon, resolveNameFromTz = false) {
    setLoading(true); setError(null); setWeather(null)
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,precipitation` +
        `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max` +
        `&forecast_days=10&timezone=auto&wind_speed_unit=kmh`
      const r = await fetch(url)
      const d = await r.json()
      setWeather(d)
      // Derive city name from timezone when using device location
      if (resolveNameFromTz && d.timezone) {
        const city = d.timezone.split('/').pop().replace(/_/g, ' ')
        setLocation(prev => prev ? { ...prev, name: city } : prev)
      }
    } catch { setError('Failed to fetch weather data. Please try again.') }
    finally   { setLoading(false) }
  }

  async function fetchMonthly(lat, lon) {
    setMonthlyLoading(true)
    try {
      const year = new Date().getFullYear() - 1
      const url =
        `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
        `&start_date=${year}-01-01&end_date=${year}-12-31` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
      const r = await fetch(url)
      const d = await r.json()
      setMonthly(aggregateMonthly(d))
    } catch { /* silently skip */ }
    finally   { setMonthlyLoading(false) }
  }

  function selectLocation(loc) {
    setLocation(loc)
    setQuery(''); setSuggestions([])
    setMonthly(null); setTab('current')
  }

  function handleGeolocate() {
    setGeoError(null)
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        selectLocation({ latitude, longitude, name: 'My Location', country: '' })
      },
      () => setGeoError('Could not access your location. Please search for a city instead.')
    )
  }

  // ── Setup screen (no location yet) ───────────────────────────────────────
  if (!location) {
    return (
      <div className="weather-app">
        <div className="weather-setup">
          <div className="weather-setup-icon">⛅</div>
          <h2 className="weather-setup-title">Check the Weather</h2>
          <p className="weather-setup-sub">Search for a city to get started</p>

          <div className="weather-search-wrap" ref={searchRef}>
            <div className="weather-search-field">
              <span className="weather-search-icon">🔍</span>
              <input
                className="weather-search-input"
                type="text"
                placeholder="Search city…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            {suggestions.length > 0 && (
              <div className="weather-suggestions">
                {suggestions.map(s => (
                  <button key={s.id} className="weather-suggestion-item" onClick={() => selectLocation(s)}>
                    <span className="suggestion-name">{s.name}</span>
                    <span className="suggestion-meta">{[s.admin1, s.country].filter(Boolean).join(', ')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="weather-geo-btn" onClick={handleGeolocate}>📍 Use my location</button>
          {geoError && <p className="weather-geo-error">{geoError}</p>}
        </div>
      </div>
    )
  }

  // ── Main weather view ─────────────────────────────────────────────────────
  const displayName = [location.name, location.country].filter(Boolean).join(', ')

  return (
    <div className="weather-app">
      <div className="weather-location-bar">
        <span className="weather-location-name">📍 {displayName}</span>
        <div className="weather-bar-actions">
          <div className="weather-unit-toggle">
            <button className={unit === 'C' ? 'active' : ''} onClick={() => setUnit('C')}>°C</button>
            <button className={unit === 'F' ? 'active' : ''} onClick={() => setUnit('F')}>°F</button>
          </div>
          <button
            className="weather-change-btn"
            onClick={() => { setLocation(null); setWeather(null); setMonthly(null) }}
          >
            Change
          </button>
        </div>
      </div>

      <DesktopNavMenu items={TABS} active={tab} onSelect={setTab} className="weather-dnm" />

      <div className="weather-content">
        {loading && (
          <div className="weather-status">
            <div className="weather-spinner" />
            <span>Fetching weather…</span>
          </div>
        )}

        {!loading && error && (
          <div className="weather-status weather-status-error">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && weather && tab === 'current'  && <CurrentView  weather={weather} unit={unit} />}
        {!loading && !error && weather && tab === 'forecast' && <ForecastView weather={weather} unit={unit} />}
        {tab === 'monthly' && <MonthlyView monthly={monthly} loading={monthlyLoading} unit={unit} />}
      </div>
    </div>
  )
}

// ── Sub-views ─────────────────────────────────────────────────────────────────

function CurrentView({ weather, unit }) {
  const c = weather.current
  const { icon, label } = weatherInfo(c.weather_code)
  return (
    <div className="weather-current">
      <div className="weather-main">
        <span className="weather-icon-xl">{icon}</span>
        <span className="weather-temp-xl">{cvt(c.temperature_2m, unit)}{degUnit(unit)}</span>
      </div>
      <p className="weather-condition">{label}</p>
      <div className="weather-stats">
        <div className="weather-stat">
          <span className="stat-label">Feels like</span>
          <span className="stat-value">{cvt(c.apparent_temperature, unit)}{degUnit(unit)}</span>
        </div>
        <div className="weather-stat">
          <span className="stat-label">Humidity</span>
          <span className="stat-value">{c.relative_humidity_2m}%</span>
        </div>
        <div className="weather-stat">
          <span className="stat-label">Wind</span>
          <span className="stat-value">{Math.round(c.wind_speed_10m)} km/h</span>
        </div>
        <div className="weather-stat">
          <span className="stat-label">Precipitation</span>
          <span className="stat-value">{c.precipitation} mm</span>
        </div>
      </div>
    </div>
  )
}

function ForecastView({ weather, unit }) {
  const { daily } = weather
  return (
    <div className="weather-forecast">
      {daily.time.map((date, i) => {
        const { icon, label } = weatherInfo(daily.weather_code[i])
        return (
          <div className="forecast-row" key={date}>
            <span className="forecast-day">{fmtDay(date, i)}</span>
            <span className="forecast-icon">{icon}</span>
            <span className="forecast-label">{label}</span>
            <span className="forecast-range">
              <span className="forecast-lo">{cvt(daily.temperature_2m_min[i], unit)}°</span>
              <span className="forecast-dash"> – </span>
              <span className="forecast-hi">{cvt(daily.temperature_2m_max[i], unit)}{degUnit(unit)}</span>
            </span>
            {daily.precipitation_sum[i] > 0 && (
              <span className="forecast-rain">💧 {daily.precipitation_sum[i]}mm</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MonthlyView({ monthly, loading, unit }) {
  if (loading) return (
    <div className="weather-status">
      <div className="weather-spinner" />
      <span>Loading climate data…</span>
    </div>
  )
  if (!monthly) return null
  return (
    <div className="weather-monthly">
      <p className="monthly-note">Monthly climate averages · {new Date().getFullYear() - 1} historical data</p>
      {monthly.map(m => (
        <div className="monthly-row" key={m.name}>
          <span className="monthly-name">{m.name}</span>
          <span className="monthly-range">
            <span className="monthly-lo">{m.avgLow  != null ? `${cvt(m.avgLow,  unit)}°` : '–'}</span>
            <span> – </span>
            <span className="monthly-hi">{m.avgHigh != null ? `${cvt(m.avgHigh, unit)}${degUnit(unit)}` : '–'}</span>
          </span>
          <span className="monthly-rain">💧 {m.totalPrecip != null ? `${m.totalPrecip}mm` : '–'}</span>
        </div>
      ))}
    </div>
  )
}
