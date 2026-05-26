import { useState, useEffect, useRef } from 'react'
import MobileNavMenu from '../components/MobileNavMenu'
import './WeatherApp.css'

const TABS = [
  { id: 'current',    label: 'Current', icon: '🌡️' },
  { id: 'forecast10', label: '10-Day',  icon: '📅' },
  { id: 'forecast16', label: '16-Day',  icon: '📆' },
]

const FORECAST_VIEWS = [
  { id: 'list',     label: 'List'     },
  { id: 'grid',     label: 'Grid'     },
  { id: 'timeline', label: 'Timeline' },
]

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


export default function WeatherApp() {
  const [tab,            setTab]            = useState('current')
  const [forecastView,   setForecastView]   = useState('list')
  const [unit,           setUnit]           = useState('C')
  const [query,          setQuery]          = useState('')
  const [suggestions,    setSuggestions]    = useState([])
  const [location,       setLocation]       = useState(null)
  const [weather,        setWeather]        = useState(null)
  const [loading,        setLoading]        = useState(false)
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

async function fetchForecast(lat, lon, reverseGeocode = false) {
    setLoading(true); setError(null); setWeather(null)
    try {
      const [weatherRes, geoRes] = await Promise.all([
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,precipitation` +
          `&hourly=temperature_2m,weather_code,precipitation_probability` +
          `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max` +
          `&past_hours=24&forecast_days=16&timezone=auto&wind_speed_unit=kmh`
        ),
        reverseGeocode
          ? fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
          : Promise.resolve(null),
      ])
      const d = await weatherRes.json()
      setWeather(d)
      if (reverseGeocode && geoRes) {
        const geo = await geoRes.json()
        const addr = geo.address || {}
        const city = addr.city || addr.town || addr.village || addr.county || d.timezone.split('/').pop().replace(/_/g, ' ')
        setLocation(prev => prev ? { ...prev, name: city } : prev)
      }
    } catch { setError('Failed to fetch weather data. Please try again.') }
    finally   { setLoading(false) }
  }

function selectLocation(loc) {
    setLocation(loc)
    setQuery(''); setSuggestions([])
    setTab('current')
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
        <button
          className="weather-location-name"
          onClick={() => { setLocation(null); setWeather(null) }}
          title="Click to change location"
        >
          📍 {displayName}
        </button>
        <div className="weather-unit-toggle">
          <button className={unit === 'C' ? 'active' : ''} onClick={() => setUnit('C')}>°C</button>
          <button className={unit === 'F' ? 'active' : ''} onClick={() => setUnit('F')}>°F</button>
        </div>
      </div>

      <MobileNavMenu items={TABS} active={tab} onSelect={setTab} title="Weather" desktopLayout="scroll" />

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

        {!loading && !error && weather && tab === 'current'    && <CurrentView  weather={weather} unit={unit} />}
        {!loading && !error && weather && tab === 'forecast10' && <ForecastView weather={weather} unit={unit} limit={10} view={forecastView} onViewChange={setForecastView} />}
        {!loading && !error && weather && tab === 'forecast16' && <ForecastView weather={weather} unit={unit} limit={16} view={forecastView} onViewChange={setForecastView} />}
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
      {weather.hourly && <TodayHourly weather={weather} unit={unit} />}
    </div>
  )
}

function TodayHourly({ weather, unit }) {
  const { hourly, current } = weather
  const currentPrefix = current.time.slice(0, 13)
  let startIdx = hourly.time.findIndex(t => t.slice(0, 13) >= currentPrefix)
  if (startIdx < 0) startIdx = 0

  const hours = Array.from({ length: 24 }, (_, k) => startIdx + k)
    .filter(i => i < hourly.time.length && hourly.temperature_2m[i] != null)
    .map(i => ({
      time: hourly.time[i],
      temp: hourly.temperature_2m[i],
      hr:   parseInt(hourly.time[i].slice(11, 13), 10),
    }))

  if (hours.length < 2) return null

  const VW = 600
  const PAD = { t: 26, b: 20, l: 8, r: 8 }
  const CW  = VW - PAD.l - PAD.r
  const CH  = 58
  const VH  = PAD.t + CH + PAD.b

  const temps = hours.map(h => h.temp)
  const minT  = Math.min(...temps) - 1
  const maxT  = Math.max(...temps) + 1
  const range = maxT - minT || 1

  const toX = i => PAD.l + (i / (hours.length - 1)) * CW
  const toY = t => PAD.t + (1 - (t - minT) / range) * CH

  const pts  = hours.map((h, i) => ({ x: toX(i), y: toY(h.temp) }))
  const line = catmullRom(pts)
  const area = `${line} L ${toX(hours.length - 1)} ${VH} L ${toX(0)} ${VH} Z`

  // Label every 3 hours + last point
  const labelAt = new Set([...Array.from({ length: 8 }, (_, k) => k * 3), hours.length - 1])

  return (
    <div className="hourly-section">
      <p className="hourly-title">Next 24 Hours</p>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        width="100%"
        className="hourly-chart"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#fb923c" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#fb923c" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#hGrad)" />
        <path d={line} fill="none" stroke="#fb923c" strokeWidth="2.5" strokeLinecap="round" />
        {hours.map((h, i) => {
          if (!labelAt.has(i)) return null
          const x = toX(i)
          const y = toY(h.temp)
          const lbl = h.hr === 0 ? '12am' : h.hr === 12 ? '12pm' : h.hr < 12 ? `${h.hr}am` : `${h.hr - 12}pm`
          return (
            <g key={i}>
              <text x={x} y={y - 7}    textAnchor="middle" fontSize="11" fill="#fb923c" fontVariantNumeric="tabular-nums">
                {cvt(h.temp, unit)}°
              </text>
              <text x={x} y={VH - 4}   textAnchor="middle" fontSize="10" fill="var(--color-text-tertiary)">
                {lbl}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ForecastView({ weather, unit, limit, view, onViewChange }) {
  const { daily, hourly } = weather
  const allDays = limit ? daily.time.slice(0, limit) : daily.time
  const days = allDays.filter((_, i) =>
    daily.temperature_2m_max[i] != null && daily.temperature_2m_min[i] != null
  )
  return (
    <div>
      <div className="forecast-view-switcher">
        {FORECAST_VIEWS.map(v => (
          <button
            key={v.id}
            className={`forecast-view-btn${view === v.id ? ' active' : ''}`}
            onClick={() => onViewChange(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
      {view === 'list'     && <ForecastList     days={days} daily={daily} unit={unit} />}
      {view === 'grid'     && <ForecastGrid     days={days} daily={daily} unit={unit} />}
      {view === 'timeline' && <ForecastTimeline days={days} daily={daily} hourly={hourly} unit={unit} />}
    </div>
  )
}

function ForecastList({ days, daily, unit }) {
  const allTemps = days.flatMap((_, i) => [
    cvt(daily.temperature_2m_min[i], unit),
    cvt(daily.temperature_2m_max[i], unit),
  ])
  const globalMin = Math.min(...allTemps)
  const globalMax = Math.max(...allTemps)
  const range = globalMax - globalMin || 1

  return (
    <div className="weather-forecast">
      {days.map((date, i) => {
        const { icon, label } = weatherInfo(daily.weather_code[i])
        const lo = cvt(daily.temperature_2m_min[i], unit)
        const hi = cvt(daily.temperature_2m_max[i], unit)
        const left  = ((lo - globalMin) / range) * 100
        const width = Math.max(((hi - lo) / range) * 100, 2)
        return (
          <div className="forecast-row" key={date}>
            <span className="forecast-day">{fmtDay(date, i)}</span>
            <span className="forecast-icon">{icon}</span>
            <span className="forecast-label">{label}</span>
            <span className="fbar-lo">{lo}°</span>
            <div className="fbar-track">
              <div className="fbar-fill" style={{ left: `${left}%`, width: `${width}%` }} />
            </div>
            <span className="fbar-hi">{hi}{degUnit(unit)}</span>
            {daily.precipitation_sum[i] > 0
              ? <span className="fbar-rain">💧 {daily.precipitation_sum[i]}mm</span>
              : <span className="fbar-rain" />
            }
          </div>
        )
      })}
    </div>
  )
}

function ForecastGrid({ days, daily, unit }) {
  return (
    <div className="forecast-grid">
      {days.map((date, i) => {
        const { icon, label } = weatherInfo(daily.weather_code[i])
        return (
          <div className="forecast-card" key={date}>
            <span className="fcard-day">{fmtDay(date, i)}</span>
            <span className="fcard-icon">{icon}</span>
            <span className="fcard-label">{label}</span>
            <span className="fcard-hi">{cvt(daily.temperature_2m_max[i], unit)}{degUnit(unit)}</span>
            <span className="fcard-lo">{cvt(daily.temperature_2m_min[i], unit)}°</span>
            {daily.precipitation_sum[i] > 0 && (
              <span className="fcard-rain">💧 {daily.precipitation_sum[i]}mm</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

const CARD_W = 78
const CARD_GAP = 10

function catmullRom(pts) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)},${cp2x.toFixed(1)} ${cp2y.toFixed(1)},${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

function ForecastTimeline({ days, daily, hourly, unit }) {
  const [selectedDay, setSelectedDay] = useState(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef(null)
  const svgRef  = useRef(null)
  const animRef = useRef(null)
  const vbRef   = useRef(null)   // tracks live animated viewBox { x, w }

  const n      = days.length
  const totalW = n * CARD_W + (n - 1) * CARD_GAP
  const PAD_TOP = 26, PAD_BOT = 4, CHART_H = 72
  const VH     = CHART_H + PAD_TOP + PAD_BOT

  // Reset when number of days changes (switching 10↔16 day tabs)
  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    vbRef.current = { x: 0, w: totalW }
    setSelectedDay(null)
    if (svgRef.current) svgRef.current.setAttribute('viewBox', `0 0 ${totalW} ${VH}`)
  }, [n])

  // Cleanup on unmount
  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current) }, [])

  // Measure visible container width so the zoomed curve fills it (not totalW)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([e]) => setContainerWidth(Math.floor(e.contentRect.width)))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const toX = hi => {
    const d = Math.floor(hi / 24), h = hi % 24
    return d * (CARD_W + CARD_GAP) + (h / 24) * CARD_W
  }

  const daySet   = new Set(days)
  const filtered = hourly
    ? hourly.time.reduce((acc, t, i) => {
        if (daySet.has(t.slice(0, 10)) && hourly.temperature_2m[i] != null)
          acc.push({ dayIdx: days.indexOf(t.slice(0, 10)), hour: parseInt(t.slice(11, 13), 10), temp: hourly.temperature_2m[i] })
        return acc
      }, [])
    : []

  const temps = filtered.map(p => p.temp)
  const minT  = temps.length ? Math.min(...temps) - 1 : 0
  const maxT  = temps.length ? Math.max(...temps) + 1 : 10
  const range = maxT - minT || 1
  const toY   = t => PAD_TOP + (1 - (t - minT) / range) * CHART_H

  const pts      = filtered.map(p => ({ x: toX(p.dayIdx * 24 + p.hour), y: toY(p.temp) }))
  const linePath = pts.length > 1 ? catmullRom(pts) : ''
  const areaPath = linePath
    ? `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${VH} L ${pts[0].x.toFixed(1)} ${VH} Z`
    : ''

  const peakByDay = days.map((_, d) => {
    const dp = filtered.filter(p => p.dayIdx === d)
    return dp.length ? dp.reduce((b, p) => p.temp > b.temp ? p : b) : null
  })

  function animateTo(toX, toW, dur = 420) {
    if (!vbRef.current) vbRef.current = { x: 0, w: totalW }
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const from  = { ...vbRef.current }
    const start = performance.now()
    const ease  = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2

    function frame(now) {
      const t = Math.min((now - start) / dur, 1)
      const e = ease(t)
      const x = from.x + (toX - from.x) * e
      const w = from.w + (toW - from.w) * e
      vbRef.current = { x, w }
      svgRef.current?.setAttribute('viewBox', `${x.toFixed(2)} 0 ${w.toFixed(2)} ${VH}`)
      if (t < 1) animRef.current = requestAnimationFrame(frame)
    }
    animRef.current = requestAnimationFrame(frame)
  }

  function handleCardClick(d) {
    if (!vbRef.current) vbRef.current = { x: 0, w: totalW }
    if (selectedDay === d) {
      setSelectedDay(null)
      animateTo(0, totalW)
    } else {
      setSelectedDay(d)
      const pad = CARD_GAP / 2
      animateTo(d * (CARD_W + CARD_GAP) - pad, CARD_W + pad * 2)
    }
  }

  // When zoomed, fill visible container width; otherwise fill full scrollable width
  const chartW = selectedDay !== null && containerWidth > 0 ? containerWidth : totalW
  const stickyStyle = selectedDay !== null ? { position: 'sticky', left: 0, width: chartW } : {}

  return (
    <div className="forecast-timeline" ref={containerRef}>
      <div className="ftimeline-inner" style={{ width: totalW }}>
        <div className="ftimeline-chart-wrap" style={stickyStyle}>
          <svg ref={svgRef} width={chartW} height={VH} viewBox={`0 0 ${totalW} ${VH}`} preserveAspectRatio="none" className="ftimeline-chart">
            <defs>
              <linearGradient id="ftGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#fb923c" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#fb923c" stopOpacity="0.04" />
              </linearGradient>
            </defs>
            {areaPath && <path d={areaPath} fill="url(#ftGrad)" />}
            {linePath && <path d={linePath} fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" />}
            {selectedDay === null && peakByDay.map((p, d) => {
              if (!p) return null
              return (
                <text key={d} x={toX(p.dayIdx * 24 + p.hour)} y={toY(p.temp) - 7}
                  textAnchor="middle" className="ftimeline-label ftimeline-label-hi">
                  {cvt(p.temp, unit)}°
                </text>
              )
            })}
          </svg>
          {selectedDay !== null && (() => {
            const LABEL_HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 23]
            const dayDate = days[selectedDay]
            const pad  = CARD_GAP / 2
            const dayW = CARD_W + pad * 2

            const labels = LABEL_HOURS.map(h => {
              const idx = hourly?.time.findIndex(
                t => t.slice(0, 10) === dayDate && parseInt(t.slice(11, 13)) === h
              )
              if (idx == null || idx < 0 || hourly.temperature_2m[idx] == null) return null
              const temp = hourly.temperature_2m[idx]
              const lbl  = h === 0 ? '12am' : h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`
              const xPct = ((h / 24) * CARD_W + pad) / dayW * 100
              const y    = toY(temp)
              return { h, temp, lbl, xPct, y }
            }).filter(Boolean)

            return (
              <div key={selectedDay}>
                {/* Temp labels — position: absolute anchors to ftimeline-chart-wrap top */}
                <div className="ftimeline-zoom-overlay">
                  {labels.map(({ h, temp, xPct, y }) => (
                    <span key={h} className="ftimeline-zoom-temp" style={{ left: `${xPct}%`, top: y - 14 }}>
                      {cvt(temp, unit)}°
                    </span>
                  ))}
                </div>
                {/* Time labels below the SVG */}
                <div className="ftimeline-time-overlay">
                  {labels.map(({ h, lbl, xPct }) => (
                    <span key={h} className="ftimeline-zoom-time" style={{ left: `${xPct}%` }}>
                      {lbl}
                    </span>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
        <div className="ftimeline-cards">
          {days.map((date, i) => {
            const { icon } = weatherInfo(daily.weather_code[i])
            const cls = `ftimeline-card${selectedDay === i ? ' selected' : ''}`
            return (
              <div className={cls} key={date} onClick={() => handleCardClick(i)}>
                <span className="ftimeline-day">{fmtDay(date, i)}</span>
                <span className="ftimeline-icon">{icon}</span>
                <span className="ftimeline-range">
                  <span style={{ color: '#fb923c' }}>{cvt(daily.temperature_2m_max[i], unit)}°</span>
                  <span style={{ color: 'var(--color-text-muted)' }}> / </span>
                  <span style={{ color: '#38bdf8' }}>{cvt(daily.temperature_2m_min[i], unit)}°</span>
                </span>
                {daily.precipitation_sum[i] > 0 && <span className="ftimeline-rain">💧</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

