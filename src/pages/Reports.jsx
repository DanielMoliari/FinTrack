import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, BarChart as ReBarChart,
  Bar, XAxis, YAxis, Tooltip as RTooltip, Cell,
} from 'recharts'
import useFinanceStore from '../store/useFinanceStore'
import {
  parseDate, getMonthName, getMonthFullName,
  formatCurrency, formatDate,
} from '../utils/formatters'
import { getCategoryColor, CATEGORIES } from '../utils/categories'
import { calculateScore, getScoreLabel, getScoreColor } from '../utils/scoreCalculator'
import Card from '../components/ui/Card'
import Pill from '../components/ui/Pill'
import BarChart from '../components/charts/BarChart'
import DonutChart from '../components/charts/DonutChart'
import { DualLineChart } from '../components/charts/LineChart'
import LineChart from '../components/charts/LineChart'
import styles from './Reports.module.scss'

// ─── constants ───────────────────────────────────────────────
const now = new Date()

const MONTH_FULL = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]
const WEEKDAYS_ORDERED = [
  { key: 1, label: 'Seg' }, { key: 2, label: 'Ter' },
  { key: 3, label: 'Qua' }, { key: 4, label: 'Qui' },
  { key: 5, label: 'Sex' }, { key: 6, label: 'Sáb' },
  { key: 0, label: 'Dom' },
]

const prevMonthDate = now.getMonth() === 0
  ? new Date(now.getFullYear() - 1, 11, 1)
  : new Date(now.getFullYear(), now.getMonth() - 1, 1)

const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`

// ─── preferences ─────────────────────────────────────────────
const DEFAULT_PREFS = {
  monthlyBar: true, byCategory: true, dualLine: true, bets: true,
  topCats: true, score: true, weekdayBar: true,
  categoryEvol: true, comparative: true, dailyStats: true,
}
const PREF_LABELS = {
  monthlyBar:   'Gastos por mês',
  byCategory:   'Por categoria',
  dualLine:     'Receita vs Gastos',
  bets:         'Apostas — saldo corrido',
  topCats:      'Top categorias',
  score:        'Score de saúde financeira',
  weekdayBar:   'Gastos por dia da semana',
  categoryEvol: 'Evolução por categoria',
  comparative:  'Comparativo mês a mês',
  dailyStats:   'Média diária e dias sem gasto',
}
const loadPrefs = () => {
  try {
    const s = localStorage.getItem('fintrack_report_prefs')
    return s ? { ...DEFAULT_PREFS, ...JSON.parse(s) } : DEFAULT_PREFS
  } catch { return DEFAULT_PREFS }
}
const savePrefs = (p) => localStorage.setItem('fintrack_report_prefs', JSON.stringify(p))

// ─── mini tooltip (shared by inline charts) ──────────────────
const MiniTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1e1e30', border: '0.5px solid #2a2a45', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#e0e0e8' }}>
      <p style={{ color: '#888890', marginBottom: 2 }}>{label}</p>
      <p>{formatCurrency(payload[0]?.value ?? 0)}</p>
    </div>
  )
}

// ─── component ───────────────────────────────────────────────
const Reports = () => {
  const { transactions, fixed } = useFinanceStore()

  // — filter state —
  const [filter,      setFilter]      = useState('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd,   setCustomEnd]   = useState('')

  // — prefs —
  const [prefs,     setPrefs]     = useState(loadPrefs)
  const [prefOpen,  setPrefOpen]  = useState(false)

  const togglePref = (key) => {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    savePrefs(next)
  }

  // — evolution category selector —
  const expCats = Object.keys(CATEGORIES).filter(k => CATEGORIES[k].flow === 'saida')
  const [selectedCat, setSelectedCat] = useState(expCats[0])

  // — comparative month pickers —
  const [compM1, setCompM1] = useState(prevMonthStr)
  const [compM2, setCompM2] = useState(thisMonthStr)

  // ── date range from filter ──────────────────────────────────
  const dateRange = useMemo(() => {
    const end = new Date(); end.setHours(23, 59, 59, 999)
    if (filter === '7d') {
      const start = new Date(); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0)
      return { start, end }
    }
    if (filter === 'month') {
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end }
    }
    if (filter === 'prevmonth') {
      const s = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1)
      const e = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0, 23, 59, 59, 999)
      return { start: s, end: e }
    }
    if (filter === 'year') {
      return { start: new Date(now.getFullYear(), 0, 1), end }
    }
    if (filter === 'custom' && customStart && customEnd) {
      const s = new Date(customStart); s.setHours(0, 0, 0, 0)
      const e = new Date(customEnd);   e.setHours(23, 59, 59, 999)
      return { start: s, end: e }
    }
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end }
  }, [filter, customStart, customEnd])

  // ── period label ────────────────────────────────────────────
  const periodLabel = useMemo(() => {
    if (filter === '7d')       return 'últimos 7 dias'
    if (filter === 'month')    return MONTH_FULL[now.getMonth()]
    if (filter === 'prevmonth')return MONTH_FULL[prevMonthDate.getMonth()]
    if (filter === 'year')     return String(now.getFullYear())
    if (filter === 'custom' && customStart && customEnd)
      return `${formatDate(new Date(customStart))} a ${formatDate(new Date(customEnd))}`
    return ''
  }, [filter, customStart, customEnd])

  // ── filtered transactions ───────────────────────────────────
  const filtered = useMemo(() =>
    transactions.filter(t => {
      const d = parseDate(t.data_hora)
      return d >= dateRange.start && d <= dateRange.end
    }),
  [transactions, dateRange])

  const expenses    = filtered.filter(t => t.tipo_fluxo === 'saida')
  const income      = filtered.filter(t => t.tipo_fluxo === 'entrada')
  const totalExpense = expenses.reduce((s, t) => s + parseFloat(t.valor || 0), 0)
  const totalIncome  = income.reduce((s, t) => s + parseFloat(t.valor || 0), 0)

  // ── fixed 6-month window (trend charts) ─────────────────────
  const monthlyBars = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const m = d.getMonth() + 1; const y = d.getFullYear()
    const val = transactions
      .filter(t => { const td = parseDate(t.data_hora); return td.getMonth() + 1 === m && td.getFullYear() === y && t.tipo_fluxo === 'saida' })
      .reduce((s, t) => s + parseFloat(t.valor || 0), 0)
    return { label: getMonthName(d.getMonth()), value: val }
  }), [transactions])

  const dualData = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const m = d.getMonth() + 1; const y = d.getFullYear()
    const mtx = transactions.filter(t => { const td = parseDate(t.data_hora); return td.getMonth() + 1 === m && td.getFullYear() === y })
    return {
      label:   getMonthName(d.getMonth()),
      receita: mtx.filter(t => t.tipo_fluxo === 'entrada').reduce((s, t) => s + parseFloat(t.valor || 0), 0),
      gasto:   mtx.filter(t => t.tipo_fluxo === 'saida').reduce((s, t)   => s + parseFloat(t.valor || 0), 0),
    }
  }), [transactions])

  // ── period-filtered computations ────────────────────────────
  const categoryData = useMemo(() => {
    const map = {}
    expenses.forEach(t => { map[t.categoria] = (map[t.categoria] || 0) + parseFloat(t.valor || 0) })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([name, value]) => ({ name, value, color: getCategoryColor(name) }))
  }, [expenses])

  const betTx      = filtered.filter(t => t.categoria === 'Apostas e jogos')
  const betTotal   = betTx.reduce((s, t) => t.subcategoria === 'Ganho' ? s + parseFloat(t.valor || 0) : s - parseFloat(t.valor || 0), 0)
  const betGains   = betTx.filter(t => t.subcategoria === 'Ganho').length
  const betPct     = betTx.length > 0 ? Math.round(betGains / betTx.length * 100) : 0

  const topCats = useMemo(() => {
    const map = {}
    expenses.forEach(t => { map[t.categoria] = (map[t.categoria] || 0) + parseFloat(t.valor || 0) })
    const max = Math.max(...Object.values(map), 1)
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([name, value]) => ({ name, value, pct: value / max, color: getCategoryColor(name) }))
  }, [expenses])

  const fixedTotal = fixed.filter(f => f.ativo && f.tipo_fluxo === 'saida').reduce((s, f) => s + parseFloat(f.valor || 0), 0)
  const score = calculateScore({ receita: totalIncome, gasto: totalExpense, gastoFixo: fixedTotal, patrimonioAtual: 0, patrimonioAnterior: 0 })
  const scoreLabel = getScoreLabel(score)
  const scoreColor = getScoreColor(score)

  // ── weekday chart ────────────────────────────────────────────
  const weekdayData = useMemo(() => {
    const map = [0, 0, 0, 0, 0, 0, 0]
    expenses.forEach(t => { map[parseDate(t.data_hora).getDay()] += parseFloat(t.valor || 0) })
    return WEEKDAYS_ORDERED.map(({ key, label }) => ({ label, value: map[key] }))
  }, [expenses])

  // ── category evolution (last 6 months, for selected category) ─
  const catEvolData = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const m = d.getMonth() + 1; const y = d.getFullYear()
    const val = transactions
      .filter(t => { const td = parseDate(t.data_hora); return td.getMonth() + 1 === m && td.getFullYear() === y && t.tipo_fluxo === 'saida' && t.categoria === selectedCat })
      .reduce((s, t) => s + parseFloat(t.valor || 0), 0)
    return { label: getMonthName(d.getMonth()), value: val }
  }), [transactions, selectedCat])

  // ── comparative month-to-month ───────────────────────────────
  const parseMonthStr = (s) => { const [y, m] = s.split('-').map(Number); return { y, m } }
  const compLabel1 = (() => { const { y, m } = parseMonthStr(compM1); return `${getMonthName(m - 1)}/${y}` })()
  const compLabel2 = (() => { const { y, m } = parseMonthStr(compM2); return `${getMonthName(m - 1)}/${y}` })()

  const comparativeData = useMemo(() => {
    const { y: y1, m: m1 } = parseMonthStr(compM1)
    const { y: y2, m: m2 } = parseMonthStr(compM2)
    const getTotal = (y, m, cat) => transactions
      .filter(t => { const td = parseDate(t.data_hora); return td.getFullYear() === y && td.getMonth() + 1 === m && t.tipo_fluxo === 'saida' && t.categoria === cat })
      .reduce((s, t) => s + parseFloat(t.valor || 0), 0)
    return expCats
      .map(cat => ({ label: cat.length > 7 ? cat.slice(0, 7) : cat, fullLabel: cat, mes1: getTotal(y1, m1, cat), mes2: getTotal(y2, m2, cat) }))
      .filter(d => d.mes1 > 0 || d.mes2 > 0)
      .sort((a, b) => (b.mes1 + b.mes2) - (a.mes1 + a.mes2))
      .slice(0, 6)
  }, [transactions, compM1, compM2])

  const compTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: '#1e1e30', border: '0.5px solid #2a2a45', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#e0e0e8' }}>
        <p style={{ color: '#888890', marginBottom: 4 }}>{comparativeData.find(d => d.label === label)?.fullLabel || label}</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.fill }}>{p.name}: {formatCurrency(p.value)}</p>)}
      </div>
    )
  }

  // ── daily stats ──────────────────────────────────────────────
  const dailyStats = useMemo(() => {
    const dayMap = {}
    expenses.forEach(t => {
      const key = formatDate(parseDate(t.data_hora))
      dayMap[key] = (dayMap[key] || 0) + parseFloat(t.valor || 0)
    })
    const days = Object.entries(dayMap)
    if (!days.length) return { avg: 0, maxDay: '—', maxVal: 0, zeroDays: 0 }
    const totalDays = Math.max(1, Math.round((dateRange.end - dateRange.start) / 86400000) + 1)
    const [maxDay, maxVal] = days.reduce((best, d) => d[1] > best[1] ? d : best, ['', 0])
    return { avg: totalExpense / totalDays, maxDay, maxVal, zeroDays: Math.max(0, totalDays - days.length) }
  }, [expenses, totalExpense, dateRange])

  // ── filter pills labels ─────────────────────────────────────
  const FILTER_OPTIONS = [
    { id: '7d',       label: '7 dias' },
    { id: 'month',    label: MONTH_FULL[now.getMonth()] },
    { id: 'prevmonth',label: MONTH_FULL[prevMonthDate.getMonth()] },
    { id: 'year',     label: String(now.getFullYear()) },
    { id: 'custom',   label: 'Personalizado' },
  ]

  // ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={`page-header ${styles.headerRow}`}>
        <h1>Relatórios</h1>
        <button type="button" className={styles.gearBtn} onClick={() => setPrefOpen(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/>
            <line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/>
            <line x1="14" y1="2" x2="14" y2="6"/>
            <line x1="8" y1="10" x2="8" y2="14"/>
            <line x1="16" y1="18" x2="16" y2="22"/>
          </svg>
        </button>
      </div>

      {/* Filter pills */}
      <div className={styles.pillsRow}>
        {FILTER_OPTIONS.map(f => (
          <Pill key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Pill>
        ))}
      </div>

      {/* Custom date inputs */}
      {filter === 'custom' && (
        <div className={styles.customDates}>
          <div className={styles.dateField}>
            <label className={styles.dateLabel}>De</label>
            <input type="date" className={styles.dateInput} value={customStart} onChange={e => setCustomStart(e.target.value)} />
          </div>
          <div className={styles.dateField}>
            <label className={styles.dateLabel}>Até</label>
            <input type="date" className={styles.dateInput} value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
          </div>
        </div>
      )}

      {/* Cards */}
      <div className={styles.sections}>

        {/* 1. Gastos por mês */}
        {prefs.monthlyBar && (
          <Card>
            <p className={styles.cardTitle}>Gastos por mês <span className={styles.cardSub}>últimos 6 meses</span></p>
            <BarChart data={monthlyBars} height={130} />
            <div className={styles.chartMeta}>
              <span>Média: {formatCurrency(monthlyBars.reduce((s, d) => s + d.value, 0) / monthlyBars.length)}</span>
              <span style={{ color: '#378add' }}>Atual: {formatCurrency(monthlyBars[5]?.value)}</span>
            </div>
          </Card>
        )}

        {/* 2. Por categoria */}
        {prefs.byCategory && (
          <Card>
            <p className={styles.cardTitle}>Por categoria <span className={styles.cardSub}>{periodLabel}</span></p>
            {categoryData.length > 0
              ? <DonutChart data={categoryData} height={160} />
              : <p className={styles.empty}>Sem gastos no período</p>}
          </Card>
        )}

        {/* 3. Receita vs Gastos */}
        {prefs.dualLine && (
          <Card>
            <p className={styles.cardTitle}>Receita vs Gastos <span className={styles.cardSub}>últimos 6 meses</span></p>
            <DualLineChart data={dualData} height={150} />
          </Card>
        )}

        {/* 4. Apostas */}
        {prefs.bets && (
          <Card>
            <p className={styles.cardTitle}>Apostas — saldo corrido <span className={styles.cardSub}>{periodLabel}</span></p>
            <p className={styles.bigValue} style={{ color: betTotal >= 0 ? '#1d9e75' : '#d85a30' }}>
              {betTotal >= 0 ? '+' : ''}{formatCurrency(betTotal)}
            </p>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${betPct}%`, background: '#1d9e75' }} />
            </div>
            <p className={styles.chartMeta2}>{betPct}% de ganhos · {betTx.length} registros no período</p>
          </Card>
        )}

        {/* 5. Top categorias */}
        {prefs.topCats && (
          <Card>
            <p className={styles.cardTitle}>Top categorias <span className={styles.cardSub}>{periodLabel}</span></p>
            <div className={styles.topCats}>
              {topCats.map(c => (
                <div key={c.name} className={styles.topCatRow}>
                  <span className={styles.topCatName}>{c.name}</span>
                  <div className={styles.topCatBar}><div className={styles.topCatFill} style={{ width: `${c.pct * 100}%`, background: c.color }} /></div>
                  <span className={styles.topCatValue}>{formatCurrency(c.value)}</span>
                </div>
              ))}
              {topCats.length === 0 && <p className={styles.empty}>Sem dados</p>}
            </div>
          </Card>
        )}

        {/* 6. Score */}
        {prefs.score && (
          <Card>
            <p className={styles.cardTitle}>Score de saúde financeira <span className={styles.cardSub}>{periodLabel}</span></p>
            <p className={styles.bigValue} style={{ color: scoreColor }}>{score}</p>
            <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${score}%`, background: scoreColor }} /></div>
            <p className={styles.scoreLabel} style={{ color: scoreColor }}>{scoreLabel}</p>
          </Card>
        )}

        {/* 7. Gastos por dia da semana */}
        {prefs.weekdayBar && (
          <Card>
            <p className={styles.cardTitle}>Gastos por dia da semana <span className={styles.cardSub}>{periodLabel}</span></p>
            <ResponsiveContainer width="100%" height={180}>
              <ReBarChart data={weekdayData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 4 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#888890' }} axisLine={false} tickLine={false} width={32} />
                <RTooltip content={<MiniTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {weekdayData.map((d, i) => {
                    const maxVal = Math.max(...weekdayData.map(x => x.value), 1)
                    return <Cell key={i} fill={d.value === maxVal && maxVal > 0 ? '#378add' : '#1e1e35'} />
                  })}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* 8. Evolução por categoria */}
        {prefs.categoryEvol && (
          <Card>
            <div className={styles.cardTitleRow}>
              <p className={styles.cardTitle} style={{ marginBottom: 0 }}>Evolução por categoria <span className={styles.cardSub}>6 meses</span></p>
              <select
                className={styles.catSelect}
                value={selectedCat}
                onChange={e => setSelectedCat(e.target.value)}
              >
                {expCats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginTop: 12 }}>
              <LineChart data={catEvolData} color={getCategoryColor(selectedCat)} height={130} />
            </div>
            <div className={styles.chartMeta}>
              <span>Média: {formatCurrency(catEvolData.reduce((s, d) => s + d.value, 0) / catEvolData.length)}</span>
              <span style={{ color: getCategoryColor(selectedCat) }}>Atual: {formatCurrency(catEvolData[5]?.value)}</span>
            </div>
          </Card>
        )}

        {/* 9. Comparativo mês a mês */}
        {prefs.comparative && (
          <Card>
            <p className={styles.cardTitle}>Comparativo mês a mês</p>
            <div className={styles.monthPickers}>
              <div className={styles.monthPickerItem}>
                <span className={styles.monthDot} style={{ background: '#378add' }} />
                <input type="month" className={styles.monthInput} value={compM1} onChange={e => setCompM1(e.target.value)} />
              </div>
              <div className={styles.monthPickerItem}>
                <span className={styles.monthDot} style={{ background: '#7f77dd' }} />
                <input type="month" className={styles.monthInput} value={compM2} onChange={e => setCompM2(e.target.value)} />
              </div>
            </div>
            {comparativeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <ReBarChart data={comparativeData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap="25%">
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#888890' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <RTooltip content={compTooltip} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="mes1" name={compLabel1} fill="#378add" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="mes2" name={compLabel2} fill="#7f77dd" radius={[3, 3, 0, 0]} />
                </ReBarChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.empty}>Sem dados para comparar</p>
            )}
          </Card>
        )}

        {/* 10. Média diária e dias sem gasto */}
        {prefs.dailyStats && (
          <Card>
            <p className={styles.cardTitle}>Média diária e dias sem gasto <span className={styles.cardSub}>{periodLabel}</span></p>
            <div className={styles.statGrid}>
              <div className={styles.statCell}>
                <p className={styles.statValue}>{formatCurrency(dailyStats.avg)}</p>
                <p className={styles.statLabel}>média por dia</p>
              </div>
              <div className={styles.statCell}>
                <p className={styles.statValue} style={{ color: '#d85a30' }}>{formatCurrency(dailyStats.maxVal)}</p>
                <p className={styles.statLabel}>dia mais caro</p>
                <p className={styles.statSub}>{dailyStats.maxDay}</p>
              </div>
              <div className={styles.statCell}>
                <p className={styles.statValue} style={{ color: '#1d9e75' }}>{dailyStats.zeroDays}</p>
                <p className={styles.statLabel}>dias sem gasto</p>
              </div>
            </div>
          </Card>
        )}

      </div>

      {/* Preferences modal */}
      {prefOpen && (
        <div className={styles.prefOverlay} onClick={() => setPrefOpen(false)}>
          <div className={styles.prefSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.prefHandle} />
            <div className={styles.prefHeader}>
              <p className={styles.prefTitle}>Seções visíveis</p>
              <button type="button" className={styles.prefClose} onClick={() => setPrefOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            {Object.keys(DEFAULT_PREFS).map(key => (
              <div key={key} className={styles.prefRow}>
                <span className={styles.prefLabel}>{PREF_LABELS[key]}</span>
                <button
                  type="button"
                  className={`${styles.prefSwitch} ${prefs[key] ? styles.prefSwitchOn : ''}`}
                  onClick={() => togglePref(key)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

export default Reports
