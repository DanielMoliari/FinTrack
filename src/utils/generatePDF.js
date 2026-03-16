import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { calculateScore } from './scoreCalculator'

// ─── Colors ────────────────────────────────────────────────────────────────
const C = {
  accent: [29, 158, 117],
  red:    [216, 90, 48],
  black:  [30, 30, 30],
  gray:   [110, 110, 110],
  lgray:  [246, 246, 246],
  mgray:  [215, 215, 215],
  white:  [255, 255, 255],
}

// ─── i18n ──────────────────────────────────────────────────────────────────
const APP_NAME    = import.meta.env.VITE_APP_NAME    || 'FinTrack'
const APP_VERSION = import.meta.env.VITE_APP_VERSION || ''

const I18N = {
  pt: {
    appName: APP_NAME, version: APP_VERSION,
    title: 'Relatório Financeiro', period: 'Período',
    generated: 'Gerado em', income: 'Receitas', expenses: 'Gastos', balance: 'Saldo',
    topCats: 'Top categorias', date: 'Data', description: 'Descrição',
    category: 'Categoria', wallet: 'Carteira', value: 'Valor',
    summary: 'Resumo do Período', monthlyEvolution: 'Evolução Mensal',
    month: 'Mês', accumulated: 'Acumulado', highlights: 'Destaques',
    highestExpMonth: 'Mês com maior gasto', lowestExpMonth: 'Mês com menor gasto',
    topCategory: 'Categoria que mais pesou', avgMonthlyExp: 'Média mensal de gastos',
    avgMonthlyInc: 'Média mensal de receitas', betResult: 'Resultado total em apostas',
    avgScore: 'Score de saude medio', expVsInc: 'Receitas vs Gastos - evolucao mensal',
    catBreakdown: 'Distribuição de gastos por categoria',
    patrimony: 'Evolução Patrimonial', rendimento: 'Rendimento', finalBalance: 'Saldo Final',
    noTx: 'Nenhuma transação neste período', page: 'Página', of: 'de',
    transactions: 'transações',
  },
  en: {
    appName: APP_NAME, version: APP_VERSION,
    title: 'Financial Report', period: 'Period',
    generated: 'Generated on', income: 'Income', expenses: 'Expenses', balance: 'Balance',
    topCats: 'Top categories', date: 'Date', description: 'Description',
    category: 'Category', wallet: 'Wallet', value: 'Value',
    summary: 'Period Summary', monthlyEvolution: 'Monthly Evolution',
    month: 'Month', accumulated: 'Accumulated', highlights: 'Highlights',
    highestExpMonth: 'Highest spending month', lowestExpMonth: 'Lowest spending month',
    topCategory: 'Top spending category', avgMonthlyExp: 'Avg monthly expenses',
    avgMonthlyInc: 'Avg monthly income', betResult: 'Total betting result',
    avgScore: 'Avg health score', expVsInc: 'Income vs Expenses - monthly',
    catBreakdown: 'Expense breakdown by category',
    patrimony: 'Patrimony Evolution', rendimento: 'Return', finalBalance: 'Final Balance',
    noTx: 'No transactions in this period', page: 'Page', of: 'of',
    transactions: 'transactions',
  },
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const parseTransactionDate = (str) => {
  if (!str) return null
  const parts = str.split(' - ')[0].split('/')
  if (parts.length < 3) return null
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
}

const fmtBRL = (val, locale) =>
  (parseFloat(val) || 0).toLocaleString(locale, { style: 'currency', currency: 'BRL' })

// ASCII-safe currency for jsPDF (avoids Unicode minus, middot, etc.)
const _fmtAbs = (value) => {
  const abs = Math.abs(parseFloat(value) || 0)
  const [intPart, decPart] = abs.toFixed(2).split('.')
  return 'R$ ' + intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + decPart
}

const pdfCurrency       = (value)            => _fmtAbs(value)
const pdfCurrencySigned = (value, isExpense) => (isExpense ? '-' : '+') + _fmtAbs(value)

const monthLabel = (year, month, locale) => {
  const str = new Date(year, month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const shortMonthLabel = (year, month, locale) =>
  new Date(year, month, 1).toLocaleDateString(locale, { month: 'short' })

// ─── Canvas charts ─────────────────────────────────────────────────────────
const drawBarChart = (label_income, label_expenses, data) => {
  const W = 800, H = 400
  const scale = 3
  const canvas = document.createElement('canvas')
  canvas.width = W * scale; canvas.height = H * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, W, H)

  const PAD = { top: 20, right: 20, bottom: 54, left: 58 }
  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense])) * 1.15 || 1
  const groupW = cW / data.length
  const bw = Math.min(groupW * 0.32, 22)

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = PAD.top + (i / 4) * cH
    ctx.strokeStyle = '#e8e8e8'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke()

    const val = maxVal * (1 - i / 4)
    ctx.fillStyle = '#999'
    ctx.font = '11px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(val >= 1000 ? `${(val/1000).toFixed(1)}k` : val.toFixed(0), PAD.left - 4, y + 4)
  }

  // Bars
  data.forEach((d, i) => {
    const gx = PAD.left + i * groupW + groupW / 2 - bw - 2

    const ih = (d.income / maxVal) * cH
    ctx.fillStyle = '#1d9e75'
    ctx.fillRect(gx, PAD.top + cH - ih, bw, ih)

    const eh = (d.expense / maxVal) * cH
    ctx.fillStyle = '#d85a30'
    ctx.fillRect(gx + bw + 3, PAD.top + cH - eh, bw, eh)

    ctx.fillStyle = '#666'
    ctx.font = '11px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(d.label, gx + bw + 1.5, PAD.top + cH + 14)
  })

  // Axis line
  ctx.strokeStyle = '#ccc'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PAD.left, PAD.top); ctx.lineTo(PAD.left, PAD.top + cH + 2); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(PAD.left, PAD.top + cH); ctx.lineTo(W - PAD.right, PAD.top + cH); ctx.stroke()

  // Legend
  const ly = H - 18
  ctx.fillStyle = '#1d9e75'; ctx.fillRect(PAD.left, ly, 13, 10)
  ctx.fillStyle = '#444'; ctx.font = '12px Arial'; ctx.textAlign = 'left'
  ctx.fillText(label_income, PAD.left + 17, ly + 9)
  ctx.fillStyle = '#d85a30'; ctx.fillRect(PAD.left + 110, ly, 13, 10)
  ctx.fillStyle = '#444'; ctx.fillText(label_expenses, PAD.left + 127, ly + 9)

  return canvas.toDataURL('image/png', 1.0)
}

const CHART_COLORS = ['#1d9e75','#378add','#d85a30','#7f77dd','#ef9f27','#d4537e','#5dcaa5','#888780','#c2a633','#e84142']

const drawPieChart = (catData) => {
  const SIZE = 600
  const LEG_W = 600
  const scale = 3
  const canvas = document.createElement('canvas')
  canvas.width = (SIZE + LEG_W) * scale; canvas.height = SIZE * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, SIZE + LEG_W, SIZE)

  const CX = SIZE / 2, CY = SIZE / 2, R = SIZE / 2 - 14
  const total = catData.reduce((s, c) => s + c.value, 0)
  if (!total) return canvas.toDataURL('image/png')

  let angle = -Math.PI / 2
  catData.forEach((c, i) => {
    const slice = (c.value / total) * Math.PI * 2
    ctx.beginPath(); ctx.moveTo(CX, CY)
    ctx.arc(CX, CY, R, angle, angle + slice)
    ctx.closePath()
    ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length]
    ctx.fill()
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()
    angle += slice
  })

  // Center donut hole
  ctx.beginPath(); ctx.arc(CX, CY, R * 0.48, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'; ctx.fill()

  // Legend
  catData.slice(0, 8).forEach((c, i) => {
    const ly = 18 + i * 24
    ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length]
    ctx.fillRect(SIZE + 8, ly, 14, 14)
    const pct = ((c.value / total) * 100).toFixed(1)
    ctx.fillStyle = '#333'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'left'
    ctx.fillText(c.name, SIZE + 26, ly + 10)
    ctx.fillStyle = '#888'; ctx.font = '10px Arial'
    ctx.fillText(`${pct}%`, SIZE + 26, ly + 21)
  })

  return canvas.toDataURL('image/png', 1.0)
}

// ─── Main export ───────────────────────────────────────────────────────────
export const generatePDF = ({
  transactions = [],
  rendimentos  = [],
  lang         = 'pt',
  startDate,
  endDate,
  userName     = '',
}) => {
  const t      = I18N[lang]
  const locale = lang === 'pt' ? 'pt-BR' : 'en-US'
  const today  = new Date()
  const doc    = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  const W = 210, H = 297
  const ML = 14, MR = 14, MT = 18, FOOTER_H = 14
  const CW = W - ML - MR
  const CONTENT_BOTTOM = H - FOOTER_H - 4

  const fmtC = (v) => pdfCurrency(v)
  const todayStr = today.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
  const generatedStr = `${t.generated}: ${todayStr}`

  // ── Parse date strings to Date objects ──────────────────────────────────
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const startDateObj = new Date(sy, sm - 1, sd, 0, 0, 0)
  const endDateObj   = new Date(ey, em - 1, ed, 23, 59, 59)

  // ── Filter transactions by date range ───────────────────────────────────
  const filteredTx = transactions.filter(tx => {
    const d = parseTransactionDate(tx.data_hora)
    return d && d >= startDateObj && d <= endDateObj
  })

  // ── Build months array ──────────────────────────────────────────────────
  const months = []
  let cur = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1)
  const endMonth = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), 1)
  while (cur <= endMonth) {
    months.push({ year: cur.getFullYear(), month: cur.getMonth() })
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
  }

  // ── Monthly stats ───────────────────────────────────────────────────────
  const monthlyStats = months.map(({ year, month }) => {
    const txs = filteredTx.filter(tx => {
      const d = parseTransactionDate(tx.data_hora)
      return d && d.getFullYear() === year && d.getMonth() === month
    })
    const income  = txs.filter(x => x.tipo_fluxo === 'entrada').reduce((s, x) => s + parseFloat(x.valor || 0), 0)
    const expense = txs.filter(x => x.tipo_fluxo === 'saida').reduce((s, x) => s + parseFloat(x.valor || 0), 0)
    return {
      year, month, txs, income, expense, balance: income - expense,
      label: monthLabel(year, month, locale),
      shortLabel: shortMonthLabel(year, month, locale),
    }
  })

  const totalIncome  = monthlyStats.reduce((s, m) => s + m.income, 0)
  const totalExpense = monthlyStats.reduce((s, m) => s + m.expense, 0)
  const totalBalance = totalIncome - totalExpense

  const periodStr = months.length === 1
    ? monthLabel(months[0].year, months[0].month, locale)
    : `${monthLabel(months[0].year, months[0].month, locale)} - ${monthLabel(months[months.length - 1].year, months[months.length - 1].month, locale)}`

  // ── Footer helper (applied after all pages are built) ───────────────────
  const applyFooters = () => {
    const total = doc.internal.getNumberOfPages()
    for (let p = 1; p <= total; p++) {
      doc.setPage(p)
      doc.setDrawColor(...C.mgray)
      doc.setLineWidth(0.4)
      doc.line(ML, H - FOOTER_H, W - MR, H - FOOTER_H)
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.gray)
      doc.text(`${t.appName} - ${generatedStr}`, ML, H - FOOTER_H + 5)
      doc.text(`${t.page} ${p} ${t.of} ${total}`, W - MR, H - FOOTER_H + 5, { align: 'right' })
    }
  }

  // ── Section heading helper ──────────────────────────────────────────────
  const sectionHeading = (title, y) => {
    doc.setFillColor(...C.accent)
    doc.rect(ML, y, CW, 8, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.white)
    doc.text(title, ML + 3, y + 5.5)
    return y + 12
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PAGE 1 — COVER
  // ─────────────────────────────────────────────────────────────────────────
  // Top accent bar
  doc.setFillColor(...C.accent)
  doc.rect(0, 0, W, 5, 'F')

  // FinTrack wordmark
  doc.setFontSize(34)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.accent)
  doc.text('FinTrack', ML, 28)

  // Underline
  doc.setDrawColor(...C.accent)
  doc.setLineWidth(1)
  doc.line(ML, 31, ML + 44, 31)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text(t.version, ML, 37)

  // Report title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.black)
  doc.text(t.title, ML, 52)

  // Period + generated
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.gray)
  doc.text(`${t.period}: ${periodStr}`, ML, 62)
  doc.setFontSize(9)
  doc.text(generatedStr, ML, 70)
  if (userName) {
    doc.setFontSize(10)
    doc.setTextColor(...C.black)
    doc.text(userName, ML, 79)
  }

  // Overview box
  const BOX_Y = 92
  doc.setFillColor(250, 252, 250)
  doc.setDrawColor(...C.mgray)
  doc.setLineWidth(0.4)
  doc.roundedRect(ML, BOX_Y, CW, 48, 3, 3, 'FD')

  // 3 stat columns
  const sw = CW / 3
  const covStats = [
    { label: t.income,   val: totalIncome,  color: C.accent },
    { label: t.expenses, val: totalExpense, color: C.red },
    { label: t.balance,  val: totalBalance, color: totalBalance >= 0 ? C.accent : C.red },
  ]
  covStats.forEach((s, i) => {
    const cx = ML + i * sw + sw / 2
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray)
    doc.text(s.label, cx, BOX_Y + 11, { align: 'center' })
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(...s.color)
    doc.text(fmtC(s.val), cx, BOX_Y + 23, { align: 'center' })
  })

  // Dividers between stats
  doc.setDrawColor(...C.mgray); doc.setLineWidth(0.3)
  doc.line(ML + sw, BOX_Y + 6, ML + sw, BOX_Y + 30)
  doc.line(ML + 2 * sw, BOX_Y + 6, ML + 2 * sw, BOX_Y + 30)

  // Sub-line: tx count + months
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray)
  doc.text(`${filteredTx.length} ${t.transactions} | ${months.length} ${lang === 'pt' ? 'meses' : 'months'}`, ML + CW / 2, BOX_Y + 40, { align: 'center' })

  // Decorative dashes pattern
  doc.setDrawColor(...C.accent); doc.setLineWidth(0.5)
  for (let i = 0; i < 6; i++) {
    doc.line(ML + i * 12, 155, ML + i * 12 + 7, 155)
  }

  // Monthly preview list on cover
  let previewY = 162
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.black)
  doc.text(lang === 'pt' ? 'CONTEÚDO' : 'CONTENTS', ML, previewY)
  previewY += 5
  monthlyStats.forEach((m, i) => {
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray)
    doc.text(`${i + 1 + 1}.  ${m.label}  -  ${m.txs.length} ${t.transactions}`, ML + 3, previewY)
    previewY += 5
    if (previewY > 240) return
  })
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray)
  doc.text(`${months.length + 2}.  ${t.summary}`, ML + 3, previewY)

  // Bottom accent bar
  doc.setFillColor(...C.accent)
  doc.rect(0, H - 5, W, 5, 'F')

  // ─────────────────────────────────────────────────────────────────────────
  // MONTHLY SECTIONS
  // ─────────────────────────────────────────────────────────────────────────
  monthlyStats.forEach(({ year, month, label, txs, income, expense, balance }) => {
    doc.addPage()
    let y = 8

    // Month header bar
    doc.setFillColor(...C.accent)
    doc.rect(0, 0, W, 16, 'F')
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white)
    doc.text(label, ML, 11)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal')
    doc.text(`${txs.length} ${t.transactions}`, W - MR, 11, { align: 'right' })
    y = 22

    // 3-column mini summary
    const mSw = CW / 3
    const mStats = [
      { label: t.income,   val: income,  color: C.accent },
      { label: t.expenses, val: expense, color: C.red },
      { label: t.balance,  val: balance, color: balance >= 0 ? C.accent : C.red },
    ]
    mStats.forEach((s, i) => {
      const cx = ML + i * mSw + mSw / 2
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray)
      doc.text(s.label, cx, y + 4, { align: 'center' })
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...s.color)
      doc.text(fmtC(s.val), cx, y + 11, { align: 'center' })
    })
    y += 17

    // Divider
    doc.setDrawColor(...C.mgray); doc.setLineWidth(0.3)
    doc.line(ML, y, W - MR, y)
    y += 5

    // Top 3 categories
    const catMap = {}
    txs.filter(x => x.tipo_fluxo === 'saida').forEach(x => {
      const cat = x.categoria || '-'
      catMap[cat] = (catMap[cat] || 0) + parseFloat(x.valor || 0)
    })
    const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 3)

    if (topCats.length > 0) {
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.black)
      doc.text(t.topCats, ML, y); y += 4

      topCats.forEach(([cat, val]) => {
        const pct = expense > 0 ? ((val / expense) * 100).toFixed(1) : '0'
        const barW = expense > 0 ? (val / expense) * (CW - 80) : 0

        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray)
        doc.text(cat, ML + 2, y)

        // Progress bar
        doc.setFillColor(...C.lgray)
        doc.rect(ML + 44, y - 3.5, CW - 100, 4, 'F')
        doc.setFillColor(...C.accent)
        doc.rect(ML + 44, y - 3.5, barW, 4, 'F')

        doc.setFontSize(7.5); doc.setTextColor(...C.red)
        doc.text(`${fmtC(val)} (${pct}%)`, W - MR, y, { align: 'right' })
        y += 5.5
      })
      y += 2
    }

    // Transaction table
    if (txs.length === 0) {
      doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(...C.gray)
      doc.text(t.noTx, ML, y + 6)
      return
    }

    const sortedTxs = [...txs].sort((a, b) => {
      const da = parseTransactionDate(a.data_hora)
      const db = parseTransactionDate(b.data_hora)
      return da && db ? da - db : 0
    })

    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR, bottom: FOOTER_H + 4 },
      head: [[t.date, t.description, t.category, t.wallet, t.value]],
      body: sortedTxs.map(tx => {
        const d = parseTransactionDate(tx.data_hora)
        const isIncome = tx.tipo_fluxo === 'entrada'
        return [
          d ? `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}` : '-',
          (tx.descricao || tx.categoria || '-').substring(0, 42),
          (tx.categoria || '-').substring(0, 22),
          (tx.carteira_id || '-'),
          {
            content: pdfCurrencySigned(tx.valor, !isIncome),
            styles: { textColor: isIncome ? C.accent : C.red, fontStyle: 'bold' }
          }
        ]
      }),
      headStyles: {
        fillColor: C.accent, textColor: C.white,
        fontSize: 7.5, fontStyle: 'bold', cellPadding: 2.5
      },
      bodyStyles: { fontSize: 7, cellPadding: 2 },
      alternateRowStyles: { fillColor: C.lgray },
      columnStyles: {
        0: { cellWidth: 14 },
        1: { cellWidth: 58 },
        2: { cellWidth: 34 },
        3: { cellWidth: 28 },
        4: { cellWidth: 36, halign: 'right' },
      },
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY PAGE
  // ─────────────────────────────────────────────────────────────────────────
  doc.addPage()
  let y = 8

  // Header
  doc.setFillColor(...C.accent)
  doc.rect(0, 0, W, 16, 'F')
  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.white)
  doc.text(t.summary, ML, 11)
  y = 22

  // Monthly evolution table
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.black)
  doc.text(t.monthlyEvolution, ML, y); y += 3

  let accumulated = 0
  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: MR, bottom: FOOTER_H + 4 },
    head: [[t.month, t.income, t.expenses, t.balance, t.accumulated]],
    body: monthlyStats.map(m => {
      accumulated += m.balance
      return [
        m.label,
        { content: fmtC(m.income),  styles: { textColor: C.accent } },
        { content: fmtC(m.expense), styles: { textColor: C.red } },
        { content: fmtC(m.balance), styles: { textColor: m.balance >= 0 ? C.accent : C.red } },
        { content: fmtC(accumulated), styles: { textColor: accumulated >= 0 ? C.accent : C.red } },
      ]
    }),
    headStyles: { fillColor: C.accent, textColor: C.white, fontSize: 7.5, fontStyle: 'bold', cellPadding: 2.5 },
    bodyStyles: { fontSize: 7.5, cellPadding: 2 },
    alternateRowStyles: { fillColor: C.lgray },
    columnStyles: {
      0: { cellWidth: 46 },
      1: { cellWidth: 34, halign: 'right' },
      2: { cellWidth: 34, halign: 'right' },
      3: { cellWidth: 34, halign: 'right' },
      4: { cellWidth: 34, halign: 'right' },
    },
  })
  y = doc.lastAutoTable.finalY + 8

  // ── Highlights ──────────────────────────────────────────────────────────
  const allCatMap = {}
  filteredTx.filter(x => x.tipo_fluxo === 'saida').forEach(x => {
    const cat = x.categoria || '—'
    allCatMap[cat] = (allCatMap[cat] || 0) + parseFloat(x.valor || 0)
  })
  const topCatPeriod    = Object.entries(allCatMap).sort((a, b) => b[1] - a[1])[0]
  const highestExpMonth = [...monthlyStats].sort((a, b) => b.expense - a.expense)[0]
  const lowestExpMonth  = monthlyStats.filter(m => m.expense > 0).sort((a, b) => a.expense - b.expense)[0]
  const avgExp = monthlyStats.length ? totalExpense / monthlyStats.length : 0
  const avgInc = monthlyStats.length ? totalIncome  / monthlyStats.length : 0

  const betTxs   = filteredTx.filter(x => x.categoria === 'Apostas e jogos')
  const betIn    = betTxs.filter(x => x.tipo_fluxo === 'entrada').reduce((s, x) => s + parseFloat(x.valor || 0), 0)
  const betOut   = betTxs.filter(x => x.tipo_fluxo === 'saida').reduce((s, x) => s + parseFloat(x.valor || 0), 0)
  const betResult = betIn - betOut

  const avgScoreVal = monthlyStats.length
    ? Math.round(monthlyStats.reduce((s, m) =>
        s + calculateScore({ receita: m.income, gasto: m.expense, gastoFixo: 0, patrimonioAtual: 0, patrimonioAnterior: 0 })
      , 0) / monthlyStats.length)
    : 0

  const highlights = [
    { label: t.highestExpMonth, val: highestExpMonth ? `${highestExpMonth.label} (${fmtC(highestExpMonth.expense)})` : '-' },
    { label: t.lowestExpMonth,  val: lowestExpMonth  ? `${lowestExpMonth.label} (${fmtC(lowestExpMonth.expense)})` : '-' },
    { label: t.topCategory,     val: topCatPeriod    ? `${topCatPeriod[0]} (${fmtC(topCatPeriod[1])})` : '-' },
    { label: t.avgMonthlyExp,   val: fmtC(avgExp) },
    { label: t.avgMonthlyInc,   val: fmtC(avgInc) },
    { label: t.betResult,       val: `${betResult >= 0 ? '+' : ''}${fmtC(betResult)}` },
    { label: t.avgScore,        val: `${avgScoreVal}/100` },
  ]

  if (y > CONTENT_BOTTOM - 60) { doc.addPage(); y = MT }

  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.black)
  doc.text(t.highlights, ML, y); y += 5

  const hColW = (CW - 4) / 2
  const rows = Math.ceil(highlights.length / 2)
  if (y + rows * 15 > CONTENT_BOTTOM) { doc.addPage(); y = MT }

  highlights.forEach((h, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const hx = ML + col * (hColW + 4)
    const hy = y + row * 15

    doc.setFillColor(249, 251, 249)
    doc.setDrawColor(...C.mgray); doc.setLineWidth(0.3)
    doc.roundedRect(hx, hy, hColW, 12, 2, 2, 'FD')

    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gray)
    doc.text(h.label, hx + 3, hy + 4.5)
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.black)
    doc.text(h.val, hx + 3, hy + 10)
  })
  y += rows * 15 + 8

  // ── Bar chart ────────────────────────────────────────────────────────────
  if (monthlyStats.length >= 2) {
    if (y > CONTENT_BOTTOM - 60) { doc.addPage(); y = MT }

    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.black)
    doc.text(t.expVsInc, ML, y); y += 3

    const barImg = drawBarChart(
      t.income, t.expenses,
      monthlyStats.map(m => ({ label: m.shortLabel, income: m.income, expense: m.expense }))
    )
    const chartH = 54
    doc.addImage(barImg, 'PNG', ML, y, CW, chartH)
    y += chartH + 8
  }

  // ── Pie chart ────────────────────────────────────────────────────────────
  const allCatArr = Object.entries(allCatMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }))

  if (allCatArr.length >= 2) {
    if (y > CONTENT_BOTTOM - 60) { doc.addPage(); y = MT }

    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.black)
    doc.text(t.catBreakdown, ML, y); y += 3

    const pieImg = drawPieChart(allCatArr)
    const pieH = 56
    doc.addImage(pieImg, 'PNG', ML, y, CW, pieH)
    y += pieH + 8
  }

  // ── Patrimony evolution (rendimentos) ─────────────────────────────────────
  const periodRend = rendimentos.filter(r =>
    months.some(m => parseInt(r.mes) - 1 === m.month && parseInt(r.ano) === m.year)
  ).sort((a, b) => {
    if (parseInt(a.ano) !== parseInt(b.ano)) return parseInt(a.ano) - parseInt(b.ano)
    return parseInt(a.mes) - parseInt(b.mes)
  })

  if (periodRend.length >= 2) {
    if (y > CONTENT_BOTTOM - 50) { doc.addPage(); y = MT }

    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.black)
    doc.text(t.patrimony, ML, y); y += 3

    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR, bottom: FOOTER_H + 4 },
      head: [[t.month, t.rendimento, t.finalBalance]],
      body: periodRend.map(r => [
        monthLabel(parseInt(r.ano), parseInt(r.mes) - 1, locale),
        { content: `+${fmtC(r.valor_rendido)}`, styles: { textColor: C.accent } },
        { content: fmtC(r.saldo_final),          styles: { textColor: C.accent } },
      ]),
      headStyles: { fillColor: C.accent, textColor: C.white, fontSize: 7.5, fontStyle: 'bold', cellPadding: 2.5 },
      bodyStyles: { fontSize: 7.5, cellPadding: 2 },
      alternateRowStyles: { fillColor: C.lgray },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 55, halign: 'right' },
        2: { cellWidth: 55, halign: 'right' },
      },
    })
  }

  // ── Apply footers to all pages ────────────────────────────────────────────
  applyFooters()

  // ── Save ──────────────────────────────────────────────────────────────────
  const fileName = `FinTrack_${lang === 'pt' ? 'Relatorio' : 'Report'}_${today.toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}
