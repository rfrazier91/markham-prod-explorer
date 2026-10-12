import React, { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

// ─── Design tokens ────────────────────────────────────────────────────────────
const NAVY   = '#1a3a5c'
const GOLD   = '#c8820a'
const WHITE  = '#ffffff'
const LGRAY  = '#f8f9fa'
const BORDER = '#dee2e6'
const MUTED  = '#6c757d'
const DARK   = '#212529'

const OIL_COLOR   = '#2ca02c'
const WATER_COLOR = '#1f77b4'
const GAS_COLOR   = '#e377c2'
const PRESS_COLOR = '#ff7f0e'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}
function fmtNum(n, dec = 1) {
  if (n == null || n === '') return '—'
  const v = parseFloat(n)
  return isNaN(v) ? '—' : v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
function dateRange(months) {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - months)
  return {
    start: start.toISOString().slice(0, 10),
    end:   end.toISOString().slice(0, 10),
  }
}
function toISO(d) { return d ? new Date(d).toISOString().slice(0, 10) : '' }

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app:    { minHeight: '100vh', background: WHITE, color: DARK, fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14 },

  // Login
  loginWrap: { minHeight: '100vh', background: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginCard: { background: LGRAY, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 40, width: 340, textAlign: 'center' },
  logoBox:   { width: 52, height: 52, background: NAVY, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: WHITE, marginBottom: 16, letterSpacing: 1 },
  loginTitle:{ fontSize: 15, fontWeight: 700, letterSpacing: '0.15em', color: DARK, textTransform: 'uppercase', marginBottom: 6 },
  loginSub:  { fontSize: 12, color: MUTED, marginBottom: 20 },
  pwInput:   { width: '100%', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '10px 12px', fontSize: 14, outline: 'none', background: WHITE, boxSizing: 'border-box', marginBottom: 12 },
  signInBtn: { width: '100%', background: GOLD, color: WHITE, border: 'none', borderRadius: 6, padding: '11px', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em' },
  errMsg:    { color: '#dc3545', fontSize: 12, marginBottom: 10 },

  // Header
  header:    { background: NAVY, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 },
  headerLeft:{ display: 'flex', alignItems: 'center', gap: 12 },
  rBox:      { width: 32, height: 32, background: GOLD, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: WHITE },
  fieldName: { color: WHITE, fontWeight: 700, fontSize: 16, letterSpacing: '0.12em', textTransform: 'uppercase' },
  tabsRight: { display: 'flex', gap: 4, alignItems: 'flex-end', height: '100%' },
  tabBtn:    (active) => ({
    padding: '0 18px', height: 56, border: 'none', background: 'none',
    color: WHITE, fontWeight: 600, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
    cursor: 'pointer', borderBottom: `3px solid ${active ? GOLD : 'transparent'}`,
    opacity: active ? 1 : 0.7,
  }),

  // Controls bar
  controls:  { background: WHITE, borderBottom: `1px solid ${BORDER}`, padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' },
  ctrlLabel: { fontSize: 10, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 },
  ctrlGroup: { display: 'flex', flexDirection: 'column' },
  select:    { border: `1px solid ${BORDER}`, borderRadius: 5, padding: '5px 10px', fontSize: 13, background: WHITE, cursor: 'pointer', outline: 'none' },
  granBtn:   (active) => ({
    padding: '5px 14px', border: `1px solid ${active ? GOLD : BORDER}`, borderRadius: 5,
    background: active ? GOLD : WHITE, color: active ? WHITE : DARK,
    fontWeight: 600, fontSize: 12, cursor: 'pointer', letterSpacing: '0.04em',
  }),
  divider:   { width: 1, height: 32, background: BORDER },

  // Content
  content:   { padding: '20px 24px' },

  // Chart cards
  chartCard: { background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '16px 20px', marginBottom: 20 },
  cardHead:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em' },
  xlsxBtn:   { fontSize: 11, color: GOLD, background: 'none', border: `1px solid ${GOLD}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontWeight: 600 },
  legend:    { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  pill:      (active, color) => ({
    padding: '3px 12px', borderRadius: 20, border: `1px solid ${color}`,
    background: active ? color : WHITE, color: active ? WHITE : color,
    fontSize: 11, fontWeight: 600, cursor: 'pointer',
  }),

  // Y-axis controls
  axisCtrl:  { display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 11, color: MUTED },
  axisInput: { width: 70, border: `1px solid ${BORDER}`, borderRadius: 4, padding: '3px 6px', fontSize: 11 },
  axisSelect:{ border: `1px solid ${BORDER}`, borderRadius: 4, padding: '3px 6px', fontSize: 11 },

  // Table
  tableWrap: { background: LGRAY, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden', overflowX: 'auto', marginTop: 20 },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:        { background: LGRAY, color: MUTED, padding: '9px 12px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${BORDER}`, fontWeight: 600, whiteSpace: 'nowrap' },
  thR:       { background: LGRAY, color: MUTED, padding: '9px 12px', textAlign: 'right', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${BORDER}`, fontWeight: 600, whiteSpace: 'nowrap' },
  td:        { padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, color: DARK },
  tdR:       { padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, color: DARK, textAlign: 'right' },
  tdDate:    { padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, color: GOLD, fontWeight: 600 },
  battBadge: (b) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 3, fontSize: 11, fontWeight: 700,
    background: b === 'F' ? '#d4edda' : '#cce5ff',
    color:      b === 'F' ? '#155724' : '#004085',
  }),
  noData:    { textAlign: 'center', color: MUTED, padding: 40 },
  loading:   { textAlign: 'center', color: MUTED, padding: 40 },

  // Well test controls
  wellCtrl:  { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  wellLabel: { fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' },
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: DARK }}>{fmtDate(label)}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {fmtNum(p.value, 1)}
        </div>
      ))}
    </div>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────
function Login({ onAuth }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const correct = import.meta.env.VITE_APP_PASSWORD
  function submit(e) {
    e.preventDefault()
    if (pw === correct) { onAuth(); setErr('') }
    else setErr('Incorrect password.')
  }
  return (
    <div style={S.loginWrap}>
      <div style={S.loginCard}>
        <div style={S.logoBox}>R</div>
        <div style={S.loginTitle}>Markham–NBC Field</div>
        <div style={S.loginSub}>Enter password to continue</div>
        {err && <div style={S.errMsg}>{err}</div>}
        <form onSubmit={submit}>
          <input style={S.pwInput} type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" autoFocus />
          <button style={S.signInBtn} type="submit">SIGN IN</button>
        </form>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(false)
  const [tab, setTab]       = useState('production')
  const [range, setRange]   = useState('1')        // months
  const [gran, setGran]     = useState('daily')
  const [battery, setBattery] = useState('all')
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  // Legend toggles
  const [showOil, setShowOil]   = useState(true)
  const [showGas, setShowGas]   = useState(true)
  const [showWater, setShowWater] = useState(true)
  const [showPress, setShowPress] = useState(true)
  const [showSWD, setShowSWD]   = useState(true)

  // Axis controls
  const [oilScale, setOilScale]   = useState('linear')
  const [gasScale, setGasScale]   = useState('linear')
  const [waterScale, setWaterScale] = useState('linear')
  const [pressScale, setPressScale] = useState('linear')
  const [oilMin, setOilMin] = useState(''); const [oilMax, setOilMax] = useState('')
  const [gasMin, setGasMin] = useState(''); const [gasMax, setGasMax] = useState('')
  const [waterMin, setWaterMin] = useState(''); const [waterMax, setWaterMax] = useState('')
  const [pressMin, setPressMin] = useState(''); const [pressMax, setPressMax] = useState('')

  // Well test state
  const [selectedWell, setSelectedWell] = useState('all')
  const [showWellOil, setShowWellOil]   = useState(true)
  const [showWellWater, setShowWellWater] = useState(true)
  const [showWellGas, setShowWellGas]   = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { start, end } = dateRange(parseInt(range, 10))
      const res = await fetch(`/api/data?start=${start}&end=${end}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [range])

  useEffect(() => { if (authed) fetchData() }, [authed, fetchData])

  if (!authed) return <Login onAuth={() => setAuthed(true)} />

  // ── Process production data ──────────────────────────────────────────────
  const prod = data?.production || []

  // Filter by battery
  const filtered = battery === 'all' ? prod : prod.filter(r => {
    const b = (r.tank_battery || '').toUpperCase()
    return battery === 'f' ? b === 'F' : b === 'L'
  })

  // Aggregate by date (sum across batteries for "all")
  const byDate = {}
  filtered.forEach(r => {
    const k = toISO(r.report_date)
    if (!byDate[k]) byDate[k] = { date: k, oil: 0, water: 0, gas: 0, field_psi: null, swd_psi: null, count: 0 }
    byDate[k].oil   += parseFloat(r.oil_produced_bbls)   || 0
    byDate[k].water += parseFloat(r.water_produced_bbls) || 0
    byDate[k].gas   += parseFloat(r.gas_sales_mcf)       || 0
    if (r.field_psi != null && byDate[k].field_psi === null) byDate[k].field_psi = parseFloat(r.field_psi)
    if (r.swd_discharge_psi != null && byDate[k].swd_psi === null) byDate[k].swd_psi = parseFloat(r.swd_discharge_psi)
    byDate[k].count++
  })
  let chartRows = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))

  // Monthly avg
  if (gran === 'monthly') {
    const mo = {}
    chartRows.forEach(r => {
      const k = r.date.slice(0, 7)
      if (!mo[k]) mo[k] = { date: k + '-01', oil: 0, water: 0, gas: 0, fp: [], sp: [], n: 0 }
      mo[k].oil   += r.oil; mo[k].water += r.water; mo[k].gas += r.gas; mo[k].n++
      if (r.field_psi != null) mo[k].fp.push(r.field_psi)
      if (r.swd_psi   != null) mo[k].sp.push(r.swd_psi)
    })
    chartRows = Object.values(mo).sort((a, b) => a.date.localeCompare(b.date)).map(m => ({
      date: m.date,
      oil:  m.n ? m.oil / m.n : null,
      water:m.n ? m.water / m.n : null,
      gas:  m.n ? m.gas / m.n : null,
      field_psi: m.fp.length ? m.fp.reduce((a, b) => a + b, 0) / m.fp.length : null,
      swd_psi:   m.sp.length ? m.sp.reduce((a, b) => a + b, 0) / m.sp.length : null,
    }))
  }

  // ── Well tests data ──────────────────────────────────────────────────────
  const wellTests = data?.wellTests || []
  const wellNames = ['all', ...Array.from(new Set(wellTests.map(r => r.well_name))).sort()]
  const filteredWells = selectedWell === 'all' ? wellTests : wellTests.filter(r => r.well_name === selectedWell)
  const wellChartData = [...filteredWells].reverse().map(r => ({
    date:  toISO(r.test_date),
    oil:   parseFloat(r.oil_bbls)    || null,
    water: parseFloat(r.water_bbls)  || null,
    gas:   parseFloat(r.net_gas_mcf) || null,
  }))

  // ── Table rows (raw, all batteries) ─────────────────────────────────────
  const tableRows = [...prod].sort((a, b) => toISO(b.report_date).localeCompare(toISO(a.report_date)))

  const yDom = (scale, minV, maxV, data, keys) => {
    if (scale === 'log') return ['auto', 'auto']
    const mn = minV !== '' ? parseFloat(minV) : undefined
    const mx = maxV !== '' ? parseFloat(maxV) : undefined
    return [mn ?? 'auto', mx ?? 'auto']
  }

  return (
    <div style={S.app}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.rBox}>R</div>
          <div style={S.fieldName}>Markham–NBC Production</div>
        </div>
        <div style={S.tabsRight}>
          <button style={S.tabBtn(tab === 'production')} onClick={() => setTab('production')}>Production</button>
          <button style={S.tabBtn(tab === 'welltests')}  onClick={() => setTab('welltests')}>Well Tests</button>
        </div>
      </div>

      {/* Controls */}
      <div style={S.controls}>
        <div style={S.ctrlGroup}>
          <div style={S.ctrlLabel}>Range</div>
          <select style={S.select} value={range} onChange={e => setRange(e.target.value)}>
            <option value="1">1 Month</option>
            <option value="3">3 Months</option>
            <option value="6">6 Months</option>
            <option value="12">1 Year</option>
            <option value="24">2 Years</option>
          </select>
        </div>
        <div style={S.divider} />
        <div style={S.ctrlGroup}>
          <div style={S.ctrlLabel}>Granularity</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={S.granBtn(gran === 'daily')}   onClick={() => setGran('daily')}>Daily</button>
            <button style={S.granBtn(gran === 'monthly')} onClick={() => setGran('monthly')}>Monthly Avg</button>
          </div>
        </div>
        <div style={S.divider} />
        <div style={S.ctrlGroup}>
          <div style={S.ctrlLabel}>Battery</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['all','All'],['f','F Battery'],['l','L Battery']].map(([v, label]) => (
              <button key={v} style={S.granBtn(battery === v)} onClick={() => setBattery(v)}>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button style={{ ...S.xlsxBtn, fontSize: 12, padding: '5px 14px' }} onClick={fetchData}>↻ Refresh</button>
        </div>
      </div>

      {/* Content */}
      <div style={S.content}>
        {loading && <div style={S.loading}>Loading…</div>}
        {error   && <div style={{ ...S.loading, color: '#dc3545' }}>Error: {error}</div>}

        {!loading && !error && tab === 'production' && (
          <>
            {/* Combined chart */}
            <div style={S.chartCard}>
              <div style={S.cardHead}>
                <div style={S.cardTitle}>Production — Combined{battery !== 'all' ? ` (${battery.toUpperCase()} Battery)` : ''}</div>
                <button style={S.xlsxBtn}>↓ XLSX</button>
              </div>
              <div style={S.legend}>
                <button style={S.pill(showOil,   OIL_COLOR)}   onClick={() => setShowOil(!showOil)}>Oil (BBL)</button>
                <button style={S.pill(showGas,   GAS_COLOR)}   onClick={() => setShowGas(!showGas)}>Gas Sales (MCF)</button>
                <button style={S.pill(showWater, WATER_COLOR)} onClick={() => setShowWater(!showWater)}>Water (BBL)</button>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartRows} margin={{ top: 4, right: 40, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="date" tickFormatter={d => {
                    const dt = new Date(d); return `${dt.toLocaleString('en',{month:'short',timeZone:'UTC'})} ${dt.getUTCFullYear().toString().slice(2)}`
                  }} tick={{ fontSize: 11, fill: MUTED }} />
                  <YAxis yAxisId="left"  scale={oilScale}   domain={yDom(oilScale,oilMin,oilMax)}   tick={{ fontSize: 11, fill: MUTED }} />
                  <YAxis yAxisId="right" scale={gasScale}   domain={yDom(gasScale,gasMin,gasMax)}   orientation="right" tick={{ fontSize: 11, fill: MUTED }} />
                  <Tooltip content={<ChartTooltip />} />
                  {showOil   && <Line yAxisId="left"  type="monotone" dataKey="oil"   stroke={OIL_COLOR}   dot={false} strokeWidth={2} name="Oil (BBL)" />}
                  {showGas   && <Line yAxisId="right" type="monotone" dataKey="gas"   stroke={GAS_COLOR}   dot={false} strokeWidth={2} name="Gas (MCF)" />}
                  {showWater && <Line yAxisId="left"  type="monotone" dataKey="water" stroke={WATER_COLOR} dot={false} strokeWidth={2} name="Water (BBL)" />}
                </LineChart>
              </ResponsiveContainer>
              <div style={S.axisCtrl}>
                <span>Left axis:</span>
                <select style={S.axisSelect} value={oilScale} onChange={e => setOilScale(e.target.value)}>
                  <option value="linear">Linear</option><option value="log">Log</option>
                </select>
                <input style={S.axisInput} placeholder="Min" value={oilMin} onChange={e => setOilMin(e.target.value)} />
                <input style={S.axisInput} placeholder="Max" value={oilMax} onChange={e => setOilMax(e.target.value)} />
                <span style={{ marginLeft: 12 }}>Right axis:</span>
                <select style={S.axisSelect} value={gasScale} onChange={e => setGasScale(e.target.value)}>
                  <option value="linear">Linear</option><option value="log">Log</option>
                </select>
                <input style={S.axisInput} placeholder="Min" value={gasMin} onChange={e => setGasMin(e.target.value)} />
                <input style={S.axisInput} placeholder="Max" value={gasMax} onChange={e => setGasMax(e.target.value)} />
              </div>
            </div>

            {/* Pressure chart */}
            <div style={S.chartCard}>
              <div style={S.cardHead}>
                <div style={S.cardTitle}>Field Pressure &amp; SWD Discharge</div>
                <button style={S.xlsxBtn}>↓ XLSX</button>
              </div>
              <div style={S.legend}>
                <button style={S.pill(showPress, PRESS_COLOR)} onClick={() => setShowPress(!showPress)}>Field P (psi)</button>
                <button style={S.pill(showSWD,   '#9467bd')}   onClick={() => setShowSWD(!showSWD)}>SWD Discharge (psi)</button>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartRows} margin={{ top: 4, right: 40, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="date" tickFormatter={d => {
                    const dt = new Date(d); return `${dt.toLocaleString('en',{month:'short',timeZone:'UTC'})} ${dt.getUTCFullYear().toString().slice(2)}`
                  }} tick={{ fontSize: 11, fill: MUTED }} />
                  <YAxis scale={pressScale} domain={yDom(pressScale,pressMin,pressMax)} tick={{ fontSize: 11, fill: MUTED }} />
                  <Tooltip content={<ChartTooltip />} />
                  {showPress && <Line type="monotone" dataKey="field_psi" stroke={PRESS_COLOR} dot={false} strokeWidth={2} name="Field P (psi)" />}
                  {showSWD   && <Line type="monotone" dataKey="swd_psi"   stroke="#9467bd"     dot={false} strokeWidth={2} name="SWD P (psi)" />}
                </LineChart>
              </ResponsiveContainer>
              <div style={S.axisCtrl}>
                <span>Scale:</span>
                <select style={S.axisSelect} value={pressScale} onChange={e => setPressScale(e.target.value)}>
                  <option value="linear">Linear</option><option value="log">Log</option>
                </select>
                <input style={S.axisInput} placeholder="Min" value={pressMin} onChange={e => setPressMin(e.target.value)} />
                <input style={S.axisInput} placeholder="Max" value={pressMax} onChange={e => setPressMax(e.target.value)} />
              </div>
            </div>

            {/* Production table */}
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Date</th>
                    <th style={S.th}>Battery</th>
                    <th style={S.thR}>Oil (BBL)</th>
                    <th style={S.thR}>Gas Sales (MCF)</th>
                    <th style={S.thR}>Water (BBL)</th>
                    <th style={S.thR}>Field P (psi)</th>
                    <th style={S.thR}>SWD P (psi)</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length === 0 ? (
                    <tr><td colSpan={7} style={S.noData}>No data</td></tr>
                  ) : tableRows.map((r, i) => {
                    const b = (r.tank_battery || '').toUpperCase()
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? WHITE : LGRAY }}>
                        <td style={S.tdDate}>{fmtDate(r.report_date)}</td>
                        <td style={S.td}><span style={S.battBadge(b)}>{b || '—'}</span></td>
                        <td style={S.tdR}>{fmtNum(r.oil_produced_bbls)}</td>
                        <td style={S.tdR}>{fmtNum(r.gas_sales_mcf)}</td>
                        <td style={S.tdR}>{fmtNum(r.water_produced_bbls)}</td>
                        <td style={S.tdR}>{fmtNum(r.field_psi, 0)}</td>
                        <td style={S.tdR}>{fmtNum(r.swd_discharge_psi, 0)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && !error && tab === 'welltests' && (
          <>
            {/* Well selector */}
            <div style={S.wellCtrl}>
              <span style={S.wellLabel}>Well</span>
              <select style={{ ...S.select, minWidth: 220 }} value={selectedWell} onChange={e => setSelectedWell(e.target.value)}>
                <option value="all">— All Wells —</option>
                {wellNames.filter(w => w !== 'all').map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            {/* Well test chart */}
            <div style={S.chartCard}>
              <div style={S.cardHead}>
                <div style={S.cardTitle}>Well Test Results{selectedWell !== 'all' ? ` — ${selectedWell}` : ''}</div>
                <button style={S.xlsxBtn}>↓ XLSX</button>
              </div>
              <div style={S.legend}>
                <button style={S.pill(showWellOil,   OIL_COLOR)}   onClick={() => setShowWellOil(!showWellOil)}>Oil (BOPD)</button>
                <button style={S.pill(showWellWater, WATER_COLOR)} onClick={() => setShowWellWater(!showWellWater)}>Water (BWPD)</button>
                <button style={S.pill(showWellGas,   GAS_COLOR)}   onClick={() => setShowWellGas(!showWellGas)}>Net Gas (MCF)</button>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={wellChartData} margin={{ top: 4, right: 40, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="date" tickFormatter={d => {
                    const dt = new Date(d); return `${dt.toLocaleString('en',{month:'short',timeZone:'UTC'})} ${dt.getUTCFullYear().toString().slice(2)}`
                  }} tick={{ fontSize: 11, fill: MUTED }} />
                  <YAxis tick={{ fontSize: 11, fill: MUTED }} />
                  <Tooltip content={<ChartTooltip />} />
                  {showWellOil   && <Line type="monotone" dataKey="oil"   stroke={OIL_COLOR}   dot={{ r: 3 }} strokeWidth={2} name="Oil (BOPD)" />}
                  {showWellWater && <Line type="monotone" dataKey="water" stroke={WATER_COLOR} dot={{ r: 3 }} strokeWidth={2} name="Water (BWPD)" />}
                  {showWellGas   && <Line type="monotone" dataKey="gas"   stroke={GAS_COLOR}   dot={{ r: 3 }} strokeWidth={2} name="Net Gas (MCF)" />}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Well tests table */}
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Date</th>
                    <th style={S.th}>Well Name</th>
                    <th style={S.thR}>Oil (BOPD)</th>
                    <th style={S.thR}>Water (BWPD)</th>
                    <th style={S.thR}>Gas In (MCF)</th>
                    <th style={S.thR}>Gas Out (MCF)</th>
                    <th style={S.thR}>Net Gas (MCF)</th>
                    <th style={S.thR}>TP (psi)</th>
                    <th style={S.thR}>CP (psi)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWells.length === 0 ? (
                    <tr><td colSpan={9} style={S.noData}>No well tests in range</td></tr>
                  ) : filteredWells.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? WHITE : LGRAY }}>
                      <td style={S.tdDate}>{fmtDate(r.test_date)}</td>
                      <td style={S.td}>{r.well_name}</td>
                      <td style={S.tdR}>{fmtNum(r.oil_bbls)}</td>
                      <td style={S.tdR}>{fmtNum(r.water_bbls)}</td>
                      <td style={S.tdR}>{fmtNum(r.gas_in_mcf)}</td>
                      <td style={S.tdR}>{fmtNum(r.gas_out_mcf)}</td>
                      <td style={S.tdR}>{fmtNum(r.net_gas_mcf)}</td>
                      <td style={S.tdR}>{fmtNum(r.tubing_psi, 0)}</td>
                      <td style={S.tdR}>{fmtNum(r.casing_psi, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
