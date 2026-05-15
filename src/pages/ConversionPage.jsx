import { useState, useEffect } from 'react'
import './ConversionPage.css'

const TABS = [
  { id: 'currency',    label: 'Currency',    icon: '💱' },
  { id: 'temperature', label: 'Temperature', icon: '🌡️' },
  { id: 'distance',    label: 'Distance',    icon: '📏' },
  { id: 'weight',      label: 'Weight',      icon: '⚖️' },
  { id: 'height',      label: 'Height',      icon: '📐' },
  { id: 'time',        label: 'Time Zone',   icon: '🕐' },
]

function round(n, d = 4) {
  return Math.round(n * 10 ** d) / 10 ** d
}

function PairConverter({ fromLabel, toLabel, toFn, fromFn, decimals = 4 }) {
  const [fromVal, setFromVal] = useState('')
  const [toVal, setToVal] = useState('')

  function onFrom(raw) {
    setFromVal(raw)
    const n = parseFloat(raw)
    setToVal(!raw || isNaN(n) ? '' : String(round(toFn(n), decimals)))
  }

  function onTo(raw) {
    setToVal(raw)
    const n = parseFloat(raw)
    setFromVal(!raw || isNaN(n) ? '' : String(round(fromFn(n), decimals)))
  }

  return (
    <div className="conv-pair">
      <div className="conv-field">
        <input type="number" value={fromVal} onChange={e => onFrom(e.target.value)} placeholder="0" />
        <span className="conv-unit">{fromLabel}</span>
      </div>
      <div className="conv-divider">⇅</div>
      <div className="conv-field">
        <input type="number" value={toVal} onChange={e => onTo(e.target.value)} placeholder="0" />
        <span className="conv-unit">{toLabel}</span>
      </div>
    </div>
  )
}

function HeightConverter() {
  const [ft, setFt] = useState('')
  const [inch, setInch] = useState('')
  const [cm, setCm] = useState('')

  function calcCm(newFt, newIn) {
    const f = parseFloat(newFt) || 0
    const i = parseFloat(newIn) || 0
    if (!newFt && !newIn) { setCm(''); return }
    setCm(String(round((f * 12 + i) * 2.54, 2)))
  }

  function onFt(raw) { setFt(raw); calcCm(raw, inch) }
  function onIn(raw) { setInch(raw); calcCm(ft, raw) }

  function onCm(raw) {
    setCm(raw)
    const n = parseFloat(raw)
    if (!raw || isNaN(n)) { setFt(''); setInch(''); return }
    const totalIn = n / 2.54
    setFt(String(Math.floor(totalIn / 12)))
    setInch(String(round(totalIn % 12, 2)))
  }

  return (
    <div className="conv-pair">
      <div className="conv-field height-compound">
        <input type="number" value={ft} onChange={e => onFt(e.target.value)} placeholder="0" min="0" />
        <span className="conv-unit">ft</span>
        <input type="number" value={inch} onChange={e => onIn(e.target.value)} placeholder="0" min="0" />
        <span className="conv-unit">in</span>
      </div>
      <div className="conv-divider">⇅</div>
      <div className="conv-field">
        <input type="number" value={cm} onChange={e => onCm(e.target.value)} placeholder="0" />
        <span className="conv-unit">cm</span>
      </div>
    </div>
  )
}

function CurrencyConverter() {
  const [rate, setRate] = useState(null)
  const [rateDate, setRateDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usd, setUsd] = useState('')
  const [inr, setInr] = useState('')

  useEffect(() => {
    fetch('/api/exchange-rate')
      .then(r => r.json())
      .then(data => {
        setRate(data.rates.INR)
        setRateDate(data.date)
        setLoading(false)
      })
      .catch(() => {
        setError('Could not fetch live rate')
        setLoading(false)
      })
  }, [])

  function onUsd(raw) {
    setUsd(raw)
    const n = parseFloat(raw)
    setInr(!raw || isNaN(n) ? '' : String(round(n * rate, 2)))
  }

  function onInr(raw) {
    setInr(raw)
    const n = parseFloat(raw)
    setUsd(!raw || isNaN(n) ? '' : String(round(n / rate, 4)))
  }

  if (loading) return <div className="conv-status">Fetching live rate…</div>
  if (error)   return <div className="conv-status conv-error">{error}</div>

  return (
    <div>
      <div className="conv-pair">
        <div className="conv-field">
          <input type="number" value={usd} onChange={e => onUsd(e.target.value)} placeholder="0" />
          <span className="conv-unit">USD $</span>
        </div>
        <div className="conv-divider">⇅</div>
        <div className="conv-field">
          <input type="number" value={inr} onChange={e => onInr(e.target.value)} placeholder="0" />
          <span className="conv-unit">INR ₹</span>
        </div>
      </div>
      <p className="conv-meta">1 USD = ₹{rate.toFixed(2)} · as of {rateDate}</p>
    </div>
  )
}

const TZ_ZONES = [
  { id: 'Asia/Kolkata',         label: 'IST', name: 'India Standard Time' },
  { id: 'America/New_York',     label: 'ET',  name: 'Eastern Time (US)' },
  { id: 'America/Los_Angeles',  label: 'PT',  name: 'Pacific Time (US)' },
]

function getUTCForZoneTime(dateStr, timeStr, zone) {
  const asUtc = new Date(`${dateStr}T${timeStr}:00Z`)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  }).formatToParts(asUtc)
  const get = type => parts.find(p => p.type === type)?.value ?? '00'
  const h = get('hour') === '24' ? '00' : get('hour').padStart(2, '0')
  const zoneDisplayedAsUtc = new Date(`${get('year')}-${get('month')}-${get('day')}T${h}:${get('minute')}:00Z`)
  const offsetMs = asUtc.getTime() - zoneDisplayedAsUtc.getTime()
  return new Date(asUtc.getTime() + offsetMs)
}

function TimeZonePanel() {
  const [now, setNow] = useState(new Date())
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState('')
  const [srcZone, setSrcZone] = useState('Asia/Kolkata')

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  function fmtLive(zone) {
    return now.toLocaleTimeString('en-US', {
      timeZone: zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    })
  }

  function fmtConverted(utcDate, zone) {
    return utcDate.toLocaleString('en-US', {
      timeZone: zone, weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    })
  }

  const utcResult = date && time ? getUTCForZoneTime(date, time, srcZone) : null

  return (
    <div className="tz-panel">
      <div className="tz-section">
        <h3 className="tz-section-title">Current Time</h3>
        {TZ_ZONES.map(z => (
          <div key={z.id} className="tz-row">
            <span className="tz-badge">{z.label}</span>
            <span className="tz-time">{fmtLive(z.id)}</span>
            <span className="tz-name">{z.name}</span>
          </div>
        ))}
      </div>

      <div className="tz-section">
        <h3 className="tz-section-title">Convert a Time</h3>
        <div className="tz-inputs">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          <input type="time" value={time} onChange={e => setTime(e.target.value)} />
          <select value={srcZone} onChange={e => setSrcZone(e.target.value)}>
            {TZ_ZONES.map(z => (
              <option key={z.id} value={z.id}>{z.label} — {z.name}</option>
            ))}
          </select>
        </div>
        {utcResult && (
          <div className="tz-results">
            {TZ_ZONES.filter(z => z.id !== srcZone).map(z => (
              <div key={z.id} className="tz-row">
                <span className="tz-badge">{z.label}</span>
                <span className="tz-time">{fmtConverted(utcResult, z.id)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const PANELS = {
  currency:    { title: 'USD ↔ INR',       desc: 'Live exchange rate via Frankfurter',      Component: CurrencyConverter },
  temperature: { title: '°C ↔ °F',         desc: 'Celsius and Fahrenheit',                  Component: () => <PairConverter fromLabel="°C  Celsius" toLabel="°F  Fahrenheit" toFn={c => c * 9 / 5 + 32} fromFn={f => (f - 32) * 5 / 9} decimals={2} /> },
  distance:    { title: 'Miles ↔ KM',      desc: 'Miles and Kilometers',                    Component: () => <PairConverter fromLabel="mi  Miles"   toLabel="km  Kilometers" toFn={mi => mi * 1.60934}  fromFn={km => km / 1.60934}  decimals={3} /> },
  weight:      { title: 'lbs ↔ kg',        desc: 'Pounds and Kilograms',                    Component: () => <PairConverter fromLabel="lbs  Pounds" toLabel="kg  Kilograms"  toFn={lb => lb * 0.453592} fromFn={kg => kg / 0.453592} decimals={3} /> },
  height:      { title: 'ft / in ↔ cm',   desc: 'Feet, inches and centimeters',             Component: HeightConverter },
  time:        { title: 'IST ↔ ET / PT',  desc: 'India, Eastern, and Pacific time zones',   Component: TimeZonePanel },
}

export default function ConversionPage() {
  const [active, setActive] = useState('currency')
  const { title, desc, Component } = PANELS[active]

  return (
    <div className="conversion-page">
      <nav className="conv-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`conv-tab${active === tab.id ? ' active' : ''}`}
            onClick={() => setActive(tab.id)}
          >
            <span className="conv-tab-icon">{tab.icon}</span>
            <span className="conv-tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="conv-panel">
        <div className="conv-panel-header">
          <h2>{title}</h2>
          <p>{desc}</p>
        </div>
        <Component />
      </div>
    </div>
  )
}
