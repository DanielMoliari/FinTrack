import { useState, useMemo } from 'react'
import useFinanceStore from '../store/useFinanceStore'
import { useTransactions } from '../hooks/useTransactions'
import { formatCurrency, parseDate, groupByDate } from '../utils/formatters'
import { getCategoryColor } from '../utils/categories'
import { toggleFixed } from '../api/sheets'
import Card from '../components/ui/Card'
import Pill from '../components/ui/Pill'
import TransactionItem from '../components/ui/TransactionItem'
import AddTransaction from '../components/modals/AddTransaction'
import AddFixed from '../components/modals/AddFixed'
import styles from './Transactions.module.scss'

const now = new Date()
const THIS_MONTH  = { mes: now.getMonth() + 1, ano: now.getFullYear() }
const PREV_MONTH  = now.getMonth() === 0
  ? { mes: 12, ano: now.getFullYear() - 1 }
  : { mes: now.getMonth(), ano: now.getFullYear() }
const THIS_YEAR   = { ano: now.getFullYear() }

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const FILTERS = [
  { id: 'month',     label: 'Este mês' },
  { id: 'week',      label: 'Semana' },
  { id: 'prevmonth', label: `${MONTH_NAMES[PREV_MONTH.mes - 1]}` },
  { id: 'year',      label: `${now.getFullYear()}` },
]

// Days until next occurrence of a given day-of-month
const daysUntil = (dia) => {
  const today = now.getDate()
  if (dia >= today) return dia - today
  // Next month
  const next = new Date(now.getFullYear(), now.getMonth() + 1, dia)
  return Math.round((next - now) / 86400000)
}

const PAYMENT_LABEL = { pix: 'PIX', cartao_credito: 'Crédito', cartao_debito: 'Débito', dinheiro: 'Dinheiro', transferencia: 'TED/DOC' }

const Transactions = () => {
  const { fixed, loadAll } = useFinanceStore()
  const [tab,     setTab]     = useState('transactions') // 'transactions' | 'fixos'
  const [filter,  setFilter]  = useState('month')
  const [addOpen, setAddOpen] = useState(false)
  const [fixOpen, setFixOpen] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const filterParams = useMemo(() => {
    if (filter === 'month')     return THIS_MONTH
    if (filter === 'prevmonth') return PREV_MONTH
    if (filter === 'year')      return THIS_YEAR
    return {}
  }, [filter])

  const { transactions, summary } = useTransactions(filterParams)

  const filtered = useMemo(() => {
    if (filter !== 'week') return transactions
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return transactions.filter(t => parseDate(t.data_hora) >= weekAgo)
  }, [transactions, filter])

  const displaySummary = useMemo(() => {
    if (filter !== 'week') return summary
    const income  = filtered.filter(t => t.tipo_fluxo === 'entrada').reduce((s, t) => s + parseFloat(t.valor || 0), 0)
    const expense = filtered.filter(t => t.tipo_fluxo === 'saida').reduce((s, t) => s + parseFloat(t.valor || 0), 0)
    return { income, expense, balance: income - expense }
  }, [filtered, filter, summary])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  // ── Fixos logic ──
  const activeFixed   = fixed.filter(f => f.ativo)
  const inactiveFixed = fixed.filter(f => !f.ativo)
  const totalMensal   = activeFixed.reduce((s, f) => s + parseFloat(f.valor || 0), 0)

  const upcoming = activeFixed
    .map(f => ({ ...f, daysLeft: daysUntil(parseInt(f.dia_vencimento)) }))
    .filter(f => f.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  const fixedByCategory = useMemo(() => {
    const map = {}
    ;[...activeFixed, ...inactiveFixed].forEach(f => {
      const cat = f.categoria || 'Outros'
      if (!map[cat]) map[cat] = []
      map[cat].push(f)
    })
    return Object.entries(map).sort((a, b) => {
      const sa = a[1].filter(x => x.ativo).reduce((s, x) => s + parseFloat(x.valor || 0), 0)
      const sb = b[1].filter(x => x.ativo).reduce((s, x) => s + parseFloat(x.valor || 0), 0)
      return sb - sa
    })
  }, [fixed])

  const handleToggle = async (f) => {
    setTogglingId(f.id)
    try {
      await toggleFixed({ id: f.id, ativo: !f.ativo })
      await loadAll()
    } catch (e) {
      alert(e.message)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className="page-header">
        <h1>Transações</h1>
      </div>

      {/* Tab pills */}
      <div className={styles.tabRow}>
        <button
          type="button"
          className={`${styles.tabBtn} ${tab === 'transactions' ? styles.tabActive : ''}`}
          onClick={() => setTab('transactions')}
        >Transações</button>
        <button
          type="button"
          className={`${styles.tabBtn} ${tab === 'fixos' ? styles.tabActive : ''}`}
          onClick={() => setTab('fixos')}
        >Fixos</button>
      </div>

      {/* ── TRANSACTIONS TAB ── */}
      {tab === 'transactions' && (
        <>
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Gastos</span>
              <span className={styles.summaryValue} style={{ color: '#d85a30' }}>{formatCurrency(displaySummary.expense)}</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Receitas</span>
              <span className={styles.summaryValue} style={{ color: '#1d9e75' }}>{formatCurrency(displaySummary.income)}</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Saldo</span>
              <span className={styles.summaryValue} style={{ color: displaySummary.balance >= 0 ? '#e0e0e8' : '#d85a30' }}>
                {formatCurrency(displaySummary.balance)}
              </span>
            </div>
          </div>

          <div className={styles.pillsRow}>
            {FILTERS.map(f => (
              <Pill key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Pill>
            ))}
          </div>

          <div className={styles.list}>
            {grouped.length === 0 && (
              <p style={{ color: '#888890', fontSize: 12, textAlign: 'center', padding: 32 }}>
                Nenhuma transação neste período
              </p>
            )}
            {grouped.map(([date, txs]) => (
              <div key={date} className={styles.group}>
                <p className={styles.dateLabel}>{date}</p>
                <Card>
                  {txs.map(tx => (
                    <TransactionItem key={tx.id} transaction={tx} showDate={false} />
                  ))}
                </Card>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── FIXOS TAB ── */}
      {tab === 'fixos' && (
        <div className={styles.list}>

          {/* Summary card */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 11, color: '#888890', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500, marginBottom: 4 }}>Total mensal</p>
                <p style={{ fontSize: 24, fontWeight: 500, color: '#d85a30', letterSpacing: '-0.8px', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(totalMensal)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 22, fontWeight: 500, color: '#e0e0e8' }}>{activeFixed.length}</p>
                <p style={{ fontSize: 11, color: '#888890' }}>fixos ativos</p>
              </div>
            </div>
          </Card>

          {/* Próximos vencimentos */}
          {upcoming.length > 0 && (
            <div>
              <p className={styles.dateLabel} style={{ marginBottom: 6 }}>Vencendo em breve</p>
              <Card>
                {upcoming.map((f, i) => (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 0',
                    borderBottom: i < upcoming.length - 1 ? '0.5px solid #1a1a2a' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 3, height: 32, borderRadius: 2, background: getCategoryColor(f.categoria), flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#e0e0e8' }}>{f.nome}</p>
                        <p style={{ fontSize: 11, color: '#888890', marginTop: 1 }}>dia {f.dia_vencimento}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#e0e0e8', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(parseFloat(f.valor))}</p>
                      <p style={{ fontSize: 10, color: f.daysLeft === 0 ? '#d85a30' : f.daysLeft <= 3 ? '#ef9f27' : '#888890', marginTop: 1 }}>
                        {f.daysLeft === 0 ? 'hoje' : `em ${f.daysLeft}d`}
                      </p>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* List by category */}
          {fixedByCategory.length === 0 && (
            <p style={{ color: '#888890', fontSize: 12, textAlign: 'center', padding: 32 }}>
              Nenhum fixo cadastrado
            </p>
          )}
          {fixedByCategory.map(([cat, items]) => (
            <div key={cat}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <p className={styles.dateLabel}>{cat}</p>
                <p style={{ fontSize: 11, color: getCategoryColor(cat), fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(items.filter(x => x.ativo).reduce((s, x) => s + parseFloat(x.valor || 0), 0))}/mês
                </p>
              </div>
              <Card>
                {items.map((f, i) => (
                  <div key={f.id} className={styles.fixedRow} style={{ borderBottom: i < items.length - 1 ? '0.5px solid #1a1a2a' : 'none', opacity: f.ativo ? 1 : 0.45 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 3, height: 36, borderRadius: 2, background: getCategoryColor(f.categoria), flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <p className={styles.fixedName}>{f.nome}</p>
                        <p className={styles.fixedMeta}>
                          dia {f.dia_vencimento} · {PAYMENT_LABEL[f.metodo_pagamento] || f.metodo_pagamento}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <p className={styles.fixedValue}>{formatCurrency(parseFloat(f.valor))}</p>
                      <button
                        type="button"
                        onClick={() => handleToggle(f)}
                        disabled={togglingId === f.id}
                        className={`${styles.toggleSwitch} ${f.ativo ? styles.toggleOn : ''}`}
                      />
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        className={styles.fab}
        onClick={() => tab === 'fixos' ? setFixOpen(true) : setAddOpen(true)}
        type="button"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 4v14M4 11h14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      <AddTransaction open={addOpen} onClose={() => setAddOpen(false)} />
      <AddFixed open={fixOpen} onClose={() => setFixOpen(false)} />
    </div>
  )
}

export default Transactions
