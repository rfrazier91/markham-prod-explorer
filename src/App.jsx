import React, { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

// ─── Constants ────────────────────────────────────────────────────────────────
const BG = '#0a0a0a'
const SURFACE = '#111827'
const BORDER = '#1f2937'
const ACCENT = '#1f6feb'
const TEXT = '#f9fafb'
const MUTED = '#6b7280'

const CHART_COLORS = {
  oil: '#22c55e',
  gas: '#ef4444',
  water: '#3b82f6',
  pressure: '#f97316',
  battF: '#22c55e',
  battL: '#86efac',
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  app: { minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', system-ui, sans-serif" },
  header: {
    background: SURFACE, borderBottom: `1px solid ${BORDER}`,
    padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16
  },
  logo: { width: 32, height: 32, background: ACCENT, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: 700, color: TEXT },
  headerSub: { fontSize: 12, color: MUTED },
  controls: { padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderBottom: `1px solid ${BORDER}` },
  presetBtn: (active) => ({
    padding: '6px 14px', borderRadius: 6, border: `1px solid ${active ? ACCENT : BORDER}`,
    background: active ? ACCENT : 'transparent', color: active ? '#fff' : MUTED,
    cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s'
  }),
  batteryPill: (active, color) => ({
    padding: '5px 16px', borderRadius: 20, border: `1px solid ${active ? color : BORDER}`,
    background: active ? color + '25' : 'transparent', color: active ? color : MUTED,
    cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s'
  }),
  dateInput: {
    background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT,
    padding: '6px 10px', borderRadius: 6, fontSize: 13
  },
  tabs: { display: 'flex', borderBottom: `1px solid ${BORDER}`, padding: '0 24px' },
  tab: (active) => ({
    padding: '12px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 500,
    color: active ? TEXT : MUTED,
    borderBottom: `2px solid ${active ? ACCENT : 'transparent'}`,
    background: 'none', border: 'none', borderBottomWidth: 2,
    borderBottomStyle: 'solid', borderBottomColor: active ? ACCENT : 'transparent',
  }),
  content: { padding: '24px' },
  batteryBar: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 },
  chartGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 },
  chartCard: { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '20px 16px 16px 16px' },
  chartTitle: { fontSize: 13, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { background: '#161b22', color: MUTED, padding: '10px 12px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${BORDER}`, fontWeight: 600, whiteSpace: 'nowrap' },
  td: { padding: '9px 12px', borderBottom: `1px solid ${BORDER}`, color: TEXT },
  tdMono: { padding: '9px 12px', borderBottom: `1px solid ${BORDER}`, color: TEXT, fontFamily: 'monospace', fontSize: 12 },
  tableWrap: { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden', overflowX: 'auto' },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 14 },
  logBtn: (active) => ({
    padding: '6px 12px', borderRadius: 6, border: `1px solid ${active ? '#a855f7' : BORDER}`,
    background: active ? '#a855f720' : 'transparent', color: active ? '#a855f7' : MUTED,
    cursor: 'pointer', fontSize: 12, fontWeight: 500
  }),
  searchInput: {
    background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT,
    padding: '8px 12px', borderRadius: 6, fontSize: 13, width: 280, outline: 'none'
  },
  loginWrap: { minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginCard: { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 40, width: 340 },
  input: {
    width: '100%', background: '#161b22', border: `1px solid ${BORDER}`, color: TEXT,
    padding: '10px 14px', borderRadius: 7, fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 14
  },
  loginBtn: { width: '100%', background: ACCENT, color: '#fff', border: 'none', padding: '11px', borderRadius: 7, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  error: { color: '#ef4444', fontSize: 13, marginBottom: 10 },
  battBadge: (batt) => ({
    display: 'inline-block', padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700,
    background: batt === 'F' ? '#22c55e20' : '#3b82f620',
    color: batt === 'F' ? '#22c55e' : '#3b82f6',
  }),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

function fmtNum(n, dec = 1) {
  if (n === null || n === undefined || n === '') return '—'
  const v = parseFloat(n)
  if (isNaN(v)) return '—'
  return v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function chartDate(d) {
  const dt = new Date(d)
  return `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`
}

function getPresetDates(preset) {
  const end = new Date()
  const start = new Date()
  const map = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }
  start.setDate(start.getDate() - (map[preset] || 30))
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1c2333', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: MUTED, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {fmtNum(p.value)} {unit || ''}
        </div>
      ))}
    </div>
  )
}

// ─── PasswordGate ─────────────────────────────────────────────────────────────
function PasswordGate({ onAuth }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const correct = import.meta.env.VITE_APP_PASSWORD || '4Remor@'
    if (pw === correct) {
      sessionStorage.setItem('authed', '1')
      onAuth()
    } else {
      setErr('Incorrect password.')
      setPw('')
    }
  }

  return (
    <div style={styles.loginWrap}>
      <div style={styles.loginCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ ...styles.logo, width: 40, height: 40, fontSize: 16 }}>R</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT }}>Markham-NBC</div>
            <div style={{ fontSize: 12, color: MUTED }}>Production Explorer · Remora Management</div>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          {err && <div style={styles.error}>{err}</div>}
          <input type="password" placeholder="Password" value={pw}
            onChange={e => setPw(e.target.value)} style={styles.input} autoFocus />
          <button type="submit" style={styles.loginBtn}>Sign In</button>
        </form>
      </div>
    </div>
  )
}

// ─── Chart Card ───────────────────────────────────────────────────────────────
function ChartCard({ title, data, lines, unit, logScale }) {
  const hasData = data && data.length > 0 && lines.some(l => data.some(d => d[l.key] != null))
  return (
    <div style={styles.chartCard}>
      <div style={styles.chartTitle}>{title}</div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
            <XAxis dataKey="dateLabel" tick={{ fill: MUTED, fontSize: 11 }} tickLine={false} axisLine={{ stroke: BORDER }} interval="preserveStartEnd" />
            <YAxis
              scale={logScale ? 'log' : 'auto'}
              domain={logScale ? ['auto', 'auto'] : [0, 'auto']}
              tick={{ fill: MUTED, fontSize: 11 }} tickLine={false} axisLine={false} width={52}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: MUTED }} />}
            {lines.map(l => (
              <Line key={l.key} type="monotone" dataKey={l.key} name={l.name}
                stroke={l.color} strokeWidth={2} dot={false}
                activeDot={{ r: 4, fill: l.color }}
                strokeDasharray={l.dash || undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontSize: 13 }}>
          No data in range
        </div>
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(sessionStorage.getItem('authed') === '1')
  const [tab, setTab] = useState('production')
  const [preset, setPreset] = useState('1M')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [logScale, setLogScale] = useState(false)
  const [battery, setBattery] = useState('All')
  const [production, setProduction] = useState([])
  const [wellTests, setWellTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [wellSearch, setWellSearch] = useState('')
  const [sortCol, setSortCol] = useState('test_date')
  const [sortDir, setSortDir] = useState('desc')

  const getDateRange = useCallback(() => {
    if (preset === 'Custom' && customStart && customEnd) {
      return { start: customStart, end: customEnd }
    }
    return getPresetDates(preset)
  }, [preset, customStart, customEnd])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const { start, end } = getDateRange()
      const params = new URLSearchParams({ start, end })
      const res = await fetch(`/api/data?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setProduction(json.production || [])
      setWellTests(json.wellTests || [])
    } catch (e) {
      setFetchError(e.message)
    } finally {
      setLoading(false)
    }
  }, [getDateRange])

  useEffect(() => { if (authed) fetchData() }, [authed, fetchData])

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />

  // Group production by date, aggregate by battery selection
  const dateMap = {}
  for (const r of production) {
    const d = r.report_date
    if (!dateMap[d]) dateMap[d] = { date: d, F: null, L: null }
    if (r.tank_battery === 'F') dateMap[d].F = r
    if (r.tank_battery === 'L') dateMap[d].L = r
  }

  const chartData = Object.values(dateMap)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(({ date, F, L }) => {
      const row = { dateLabel: chartDate(date), fullDate: fmtDate(date) }
      if (battery === 'All') {
        row.oil = (parseFloat(F?.oil_produced_bbls || 0) + parseFloat(L?.oil_produced_bbls || 0)) || null
        row.water = (parseFloat(F?.water_produced_bbls || 0) + parseFloat(L?.water_produced_bbls || 0)) || null
        row.gas = F?.gas_sales_mcf ? parseFloat(F.gas_sales_mcf) : null
        row.pressure = F?.field_psi ? parseFloat(F.field_psi) : (L?.field_psi ? parseFloat(L.field_psi) : null)
        row.oilF = F?.oil_produced_bbls ? parseFloat(F.oil_produced_bbls) : null
        row.oilL = L?.oil_produced_bbls ? parseFloat(L.oil_produced_bbls) : null
      } else if (battery === 'F') {
        row.oil = F?.oil_produced_bbls ? parseFloat(F.oil_produced_bbls) : null
        row.water = F?.water_produced_bbls ? parseFloat(F.water_produced_bbls) : null
        row.gas = F?.gas_sales_mcf ? parseFloat(F.gas_sales_mcf) : null
        row.pressure = F?.field_psi ? parseFloat(F.field_psi) : null
      } else {
        row.oil = L?.oil_produced_bbls ? parseFloat(L.oil_produced_bbls) : null
        row.water = L?.water_produced_bbls ? parseFloat(L.water_produced_bbls) : null
        row.gas = null
        row.pressure = L?.field_psi ? parseFloat(L.field_psi) : null
      }
      return row
    })

  // Chart line definitions
  const oilLines = battery === 'All'
    ? [
        { key: 'oilF', name: 'F Battery', color: CHART_COLORS.battF },
        { key: 'oilL', name: 'L Battery', color: CHART_COLORS.battL, dash: '5 3' },
      ]
    : [{ key: 'oil', name: `Oil (${battery})`, color: CHART_COLORS.oil }]

  const waterLines = [{ key: 'water', name: battery === 'All' ? 'Total Water' : `Water (${battery})`, color: CHART_COLORS.water }]
  const gasLines = [{ key: 'gas', name: 'Gas Sales', color: CHART_COLORS.gas }]
  const pressureLines = [{ key: 'pressure', name: 'Field PSI', color: CHART_COLORS.pressure }]

  // Filter/sort well tests
  const filteredTests = wellTests
    .filter(r => !wellSearch || r.well_name?.toLowerCase().includes(wellSearch.toLowerCase()))
    .sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol]
      if (sortCol === 'test_date') { av = new Date(av); bv = new Date(bv) }
      else { av = parseFloat(av) || 0; bv = parseFloat(bv) || 0 }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  function SortIndicator({ col }) {
    if (sortCol !== col) return <span style={{ color: BORDER }}> ↕</span>
    return <span style={{ color: ACCENT }}>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
  }

  // Flat production rows for historical table
  const histRows = [...production].sort((a, b) =>
    new Date(b.report_date) - new Date(a.report_date) || (a.tank_battery > b.tank_battery ? 1 : -1)
  ).filter(r => battery === 'All' || r.tank_battery === battery)

  const presets = ['1M', '3M', '6M', '1Y', 'Custom']
  const battOpts = [
    { key: 'All', color: TEXT },
    { key: 'F', color: CHART_COLORS.battF },
    { key: 'L', color: '#3b82f6' },
  ]

  return (
    <div style={styles.app}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>R</div>
        <div>
          <div style={styles.headerTitle}>Markham-NBC Production Explorer</div>
          <div style={styles.headerSub}>Remora Management LLC · Live Production Data</div>
        </div>
        {loading && (
          <div style={{ marginLeft: 'auto', color: MUTED, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT }} />
            Loading…
          </div>
        )}
        {fetchError && <div style={{ marginLeft: 'auto', color: '#ef4444', fontSize: 12 }}>Error: {fetchError}</div>}
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>DATE RANGE</span>
        {presets.map(p => (
          <button key={p} style={styles.presetBtn(preset === p)}
            onClick={() => {
              setPreset(p)
              setShowCustom(p === 'Custom')
              if (p !== 'Custom') setTimeout(fetchData, 0)
            }}>
            {p}
          </button>
        ))}
        {showCustom && (
          <>
            <input type="date" style={styles.dateInput} value={customStart} onChange={e => setCustomStart(e.target.value)} />
            <span style={{ color: MUTED }}>to</span>
            <input type="date" style={styles.dateInput} value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            <button style={styles.presetBtn(false)} onClick={fetchData}>Apply</button>
          </>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: MUTED }}>Scale:</span>
          <button style={{ ...styles.logBtn(false), ...(!logScale ? { borderColor: ACCENT, color: ACCENT } : {}) }} onClick={() => setLogScale(false)}>Linear</button>
          <button style={styles.logBtn(logScale)} onClick={() => setLogScale(true)}>Log</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {['production', 'wellTests'].map(t => (
          <button key={t} style={styles.tab(tab === t)} onClick={() => setTab(t)}>
            {t === 'production' ? 'Production' : 'Well Tests'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {tab === 'production' && (
          <>
            {/* Battery filter */}
            <div style={styles.batteryBar}>
              <span style={{ fontSize: 12, color: MUTED, fontWeight: 600, marginRight: 4 }}>BATTERY:</span>
              {battOpts.map(({ key, color }) => (
                <button key={key} style={styles.batteryPill(battery === key, color)} onClick={() => setBattery(key)}>
                  {key === 'All' ? 'All' : `${key} Battery`}
                </button>
              ))}
              {battery !== 'All' && (
                <span style={{ marginLeft: 8, fontSize: 12, color: MUTED }}>
                  {battery === 'F' ? 'F Battery includes gas sales' : 'L Battery — no gas sales'}
                </span>
              )}
            </div>

            {/* 2x2 Chart Grid */}
            <div style={styles.chartGrid}>
              <ChartCard title="Oil Production" data={chartData} lines={oilLines}
                unit="BBL" logScale={logScale} />
              <ChartCard title="Gas Sales (F Battery)" data={chartData} lines={gasLines}
                unit="MCF" logScale={logScale} />
              <ChartCard title="Water Production" data={chartData} lines={waterLines}
                unit="BBL" logScale={logScale} />
              <ChartCard title="Field Pressure" data={chartData} lines={pressureLines}
                unit="psi" logScale={logScale} />
            </div>

            {/* Historical Table */}
            <div style={{ ...styles.sectionTitle, marginBottom: 12 }}>Historical Production</div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Battery</th>
                    <th style={styles.th}>Oil (BBL)</th>
                    <th style={styles.th}>Gas Sales (MCF)</th>
                    <th style={styles.th}>Water (BBL)</th>
                    <th style={styles.th}>Field P (psi)</th>
                    <th style={styles.th}>SWD P (psi)</th>
                  </tr>
                </thead>
                <tbody>
                  {histRows.length === 0 && (
                    <tr><td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: MUTED, padding: '40px 0' }}>No records in range</td></tr>
                  )}
                  {histRows.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : '#0d1117' }}>
                      <td style={styles.td}>{fmtDate(r.report_date)}</td>
                      <td style={styles.td}><span style={styles.battBadge(r.tank_battery)}>{r.tank_battery}</span></td>
                      <td style={styles.tdMono}>{fmtNum(r.oil_produced_bbls)}</td>
                      <td style={styles.tdMono}>{r.tank_battery === 'F' ? fmtNum(r.gas_sales_mcf) : '—'}</td>
                      <td style={styles.tdMono}>{fmtNum(r.water_produced_bbls)}</td>
                      <td style={styles.tdMono}>{fmtNum(r.field_psi, 0)}</td>
                      <td style={styles.tdMono}>{fmtNum(r.swd_discharge_psi, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'wellTests' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={styles.sectionTitle}>Well Tests</div>
              <input type="text" placeholder="Search by well name…" value={wellSearch}
                onChange={e => setWellSearch(e.target.value)} style={styles.searchInput} />
              <span style={{ color: MUTED, fontSize: 12, marginLeft: 'auto' }}>
                {filteredTests.length} record{filteredTests.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('test_date')}>
                      Date <SortIndicator col="test_date" />
                    </th>
                    <th style={styles.th}>Battery</th>
                    <th style={styles.th}>Well</th>
                    <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('oil_bbls')}>
                      Oil (BOPD) <SortIndicator col="oil_bbls" />
                    </th>
                    <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('water_bbls')}>
                      Water (BWPD) <SortIndicator col="water_bbls" />
                    </th>
                    <th style={styles.th}>Gas In</th>
                    <th style={styles.th}>Gas Out</th>
                    <th style={styles.th}>Net Gas</th>
                    <th style={styles.th}>TP (psi)</th>
                    <th style={styles.th}>CP (psi)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTests.length === 0 && (
                    <tr><td colSpan={10} style={{ ...styles.td, textAlign: 'center', color: MUTED, padding: '40px 0' }}>
                      {wellSearch ? 'No wells match search' : 'No well tests in range'}
                    </td></tr>
                  )}
                  {filteredTests.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : '#0d1117' }}>
                      <td style={styles.td}>{fmtDate(r.test_date)}</td>
                      <td style={styles.td}>
                        {r.test_facility
                          ? <span style={{ ...styles.battBadge(r.test_facility), background: '#1f6feb20', color: '#60a5fa' }}>{r.test_facility}</span>
                          : '—'}
                      </td>
                      <td style={{ ...styles.td, fontWeight: 500, color: CHART_COLORS.oil }}>{r.well_name}</td>
                      <td style={styles.tdMono}>{fmtNum(r.oil_bbls)}</td>
                      <td style={styles.tdMono}>{fmtNum(r.water_bbls)}</td>
                      <td style={styles.tdMono}>{fmtNum(r.gas_in_mcf)}</td>
                      <td style={styles.tdMono}>{fmtNum(r.gas_out_mcf)}</td>
                      <td style={styles.tdMono}>{fmtNum(r.net_gas_mcf)}</td>
                      <td style={styles.tdMono}>{fmtNum(r.tubing_psi, 0)}</td>
                      <td style={styles.tdMono}>{fmtNum(r.casing_psi, 0)}</td>
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
