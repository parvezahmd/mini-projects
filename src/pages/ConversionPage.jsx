import { useState, useEffect } from 'react'
import './ConversionPage.css'
import Select from '../components/Select'
import TimePicker from '../components/TimePicker'
import DatePicker from '../components/DatePicker'

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

const CURRENCIES = [
  { id: 'USD', symbol: '$',   name: 'US Dollar'    },
  { id: 'INR', symbol: '₹',   name: 'Indian Rupee' },
  { id: 'GBP', symbol: '£',   name: 'British Pound'},
  { id: 'EUR', symbol: '€',   name: 'Euro'         },
  { id: 'AED', symbol: 'AED', name: 'UAE Dirham'   },
]

function CurrencyConverter() {
  const [rates, setRates] = useState(null)
  const [rateDate, setRateDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fromCcy, setFromCcy] = useState('USD')
  const [toCcy, setToCcy] = useState('INR')
  const [fromVal, setFromVal] = useState('')
  const [toVal, setToVal] = useState('')

  useEffect(() => {
    fetch('/api/exchange-rate')
      .then(r => r.json())
      .then(data => {
        setRates({ USD: 1, ...data.rates })
        setRateDate(data.date)
        setLoading(false)
      })
      .catch(() => {
        setError('Could not fetch live rate')
        setLoading(false)
      })
  }, [])

  function crossRate(from, to) {
    return rates[to] / rates[from]
  }

  function selectFrom(id) {
    const newTo = id === toCcy ? fromCcy : toCcy
    setFromCcy(id)
    if (id === toCcy) setToCcy(newTo)
    const n = parseFloat(fromVal)
    if (fromVal !== '' && !isNaN(n)) {
      setToVal(String(round(n * crossRate(id, newTo), 4)))
    }
  }

  function selectTo(id) {
    const newFrom = id === fromCcy ? toCcy : fromCcy
    setToCcy(id)
    if (id === fromCcy) setFromCcy(newFrom)
    const n = parseFloat(fromVal)
    if (fromVal !== '' && !isNaN(n)) {
      setToVal(String(round(n * crossRate(newFrom, id), 4)))
    }
  }

  function onFrom(raw) {
    setFromVal(raw)
    const n = parseFloat(raw)
    setToVal(!raw || isNaN(n) ? '' : String(round(n * crossRate(fromCcy, toCcy), 4)))
  }

  function onTo(raw) {
    setToVal(raw)
    const n = parseFloat(raw)
    setFromVal(!raw || isNaN(n) ? '' : String(round(n * crossRate(toCcy, fromCcy), 4)))
  }

  function swap() {
    setFromCcy(toCcy)
    setToCcy(fromCcy)
    setFromVal(toVal)
    const n = parseFloat(toVal)
    setToVal(!toVal || isNaN(n) ? '' : String(round(n * crossRate(toCcy, fromCcy), 4)))
  }

  if (loading) return <div className="conv-status">Fetching live rates…</div>
  if (error)   return <div className="conv-status conv-error">{error}</div>

  const fromData = CURRENCIES.find(c => c.id === fromCcy)
  const toData   = CURRENCIES.find(c => c.id === toCcy)
  const rate     = crossRate(fromCcy, toCcy)

  const ccyOptions = CURRENCIES.map(c => ({ value: c.id, label: `${c.symbol} ${c.id}`, sublabel: c.name }))

  return (
    <div>
      <div className="conv-pair">
        <div className="conv-field">
          <input id="from-amount" name="from-amount" type="number" value={fromVal} onChange={e => onFrom(e.target.value)} placeholder="0" />
          <Select id="from-currency" name="from-currency" value={fromCcy} options={ccyOptions} onChange={selectFrom} />
        </div>
        <button type="button" className="conv-swap" onClick={swap} aria-label="Swap currencies">⇅</button>
        <div className="conv-field">
          <input id="to-amount" name="to-amount" type="number" value={toVal} onChange={e => onTo(e.target.value)} placeholder="0" />
          <Select id="to-currency" name="to-currency" value={toCcy} options={ccyOptions} onChange={selectTo} />
        </div>
      </div>
      <p className="conv-meta">1 {fromCcy} = {toData.symbol}{rate.toFixed(4)} {toCcy} · as of {rateDate}</p>
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

  const tzOptions = TZ_ZONES.map(z => ({ value: z.id, label: z.label, sublabel: z.name }))
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
          <DatePicker id="tz-date" name="tz-date" value={date} onChange={setDate} />
          <TimePicker id="tz-time" name="tz-time" value={time} onChange={setTime} />
          <Select id="src-zone" name="src-zone" value={srcZone} options={tzOptions} onChange={setSrcZone} />
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
  currency:    { title: 'Currency Exchange',  desc: 'Live rates via Frankfurter',                 Component: CurrencyConverter },
  temperature: { title: '°C ↔ °F',         desc: 'Celsius and Fahrenheit',                  Component: () => <PairConverter fromLabel="°C  Celsius" toLabel="°F  Fahrenheit" toFn={c => c * 9 / 5 + 32} fromFn={f => (f - 32) * 5 / 9} decimals={2} /> },
  distance:    { title: 'Miles ↔ KM',      desc: 'Miles and Kilometers',                    Component: () => <PairConverter fromLabel="mi  Miles"   toLabel="km  Kilometers" toFn={mi => mi * 1.60934}  fromFn={km => km / 1.60934}  decimals={3} /> },
  weight:      { title: 'lbs ↔ kg',        desc: 'Pounds and Kilograms',                    Component: () => <PairConverter fromLabel="lbs  Pounds" toLabel="kg  Kilograms"  toFn={lb => lb * 0.453592} fromFn={kg => kg / 0.453592} decimals={3} /> },
  height:      { title: 'ft / in ↔ cm',   desc: 'Feet, inches and centimeters',             Component: HeightConverter },
  time:        { title: 'IST ↔ ET / PT',  desc: 'India, Eastern, and Pacific time zones',   Component: TimeZonePanel },
}

export default function ConversionPage() {
  const [active, setActive] = useState('currency')
  const [menuOpen, setMenuOpen] = useState(false)
  const { title, desc, Component } = PANELS[active]
  const activeTab = TABS.find(t => t.id === active)

  return (
    <div className="conversion-page">
      <nav className="conv-tabs-nav">
        {/* Mobile: hamburger + active label */}
        <button className="conv-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open categories">
          <span />
          <span />
          <span />
        </button>
        <span className="conv-nav-active-label">
          {activeTab?.icon} {activeTab?.label}
        </span>

        {/* Desktop: horizontal tabs */}
        <div className="conv-tabs">
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
        </div>
      </nav>

      {/* Sidebar overlay */}
      <div
        className={`conv-sidebar-overlay${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Sidebar drawer */}
      <div className={`conv-sidebar${menuOpen ? ' open' : ''}`}>
        <div className="conv-sidebar-header">
          <span className="conv-sidebar-title">Conversions</span>
          <button className="conv-sidebar-close" onClick={() => setMenuOpen(false)}>✕</button>
        </div>
        <div className="conv-sidebar-list">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`conv-tab${active === tab.id ? ' active' : ''}`}
              onClick={() => { setActive(tab.id); setMenuOpen(false) }}
            >
              <span className="conv-tab-icon">{tab.icon}</span>
              <span className="conv-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

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
