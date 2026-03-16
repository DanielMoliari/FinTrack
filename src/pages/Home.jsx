import { useState, useMemo } from 'react'
import useFinanceStore from '../store/useFinanceStore'
import { useTransactions } from '../hooks/useTransactions'
import { useWallets } from '../hooks/useWallets'
import { formatCurrency, getGreeting, parseDate, getMonthName } from '../utils/formatters'
import Card from '../components/ui/Card'
import TransactionItem from '../components/ui/TransactionItem'
import MiniLineChart from '../components/charts/MiniLineChart'
import AddTransaction from '../components/modals/AddTransaction'
import Transfer from '../components/modals/Transfer'
import AddBet from '../components/modals/AddBet'
import AddYield from '../components/modals/AddYield'
import styles from './Home.module.scss'

const now = new Date()

const QuickAction = ({ icon, label, onClick, color = '#378add' }) => (
  <button className={styles.quickBtn} onClick={onClick} type="button">
    <div className={styles.quickCircle} style={{ background: `${color}18`, borderColor: `${color}30` }}>
      {icon}
    </div>
    <span>{label}</span>
  </button>
)

const Home = () => {
  const { settings, transactions, loading } = useFinanceStore()
  const { summary } = useTransactions({ mes: now.getMonth() + 1, ano: now.getFullYear() })
  const { totalPatrimony } = useWallets()

  const [modal, setModal] = useState(null)

  // Mini chart: balance per last 6 months
  const chartData = useMemo(() => {
    const result = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mes = d.getMonth() + 1
      const ano = d.getFullYear()
      const monthTx = transactions.filter(t => {
        const td = parseDate(t.data_hora)
        return td.getMonth() + 1 === mes && td.getFullYear() === ano
      })
      const inc  = monthTx.filter(t => t.tipo_fluxo === 'entrada').reduce((s, t) => s + parseFloat(t.valor || 0), 0)
      const exp  = monthTx.filter(t => t.tipo_fluxo === 'saida').reduce((s, t) => s + parseFloat(t.valor || 0), 0)
      result.push({ label: getMonthName(d.getMonth()), value: inc - exp })
    }
    return result
  }, [transactions])

  const recentExpenses = useMemo(() =>
    transactions
      .filter(t => t.tipo_fluxo === 'saida')
      .sort((a, b) => parseDate(b.data_hora) - parseDate(a.data_hora))
      .slice(0, 5),
    [transactions]
  )

  const balance = summary.income - summary.expense

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <p className={styles.greeting}>{getGreeting()},</p>
        <p className={styles.name}>{settings.userName}</p>
      </div>

      {/* Balance card */}
      <Card className={styles.balanceCard}>
        <p className={styles.balanceLabel}>Saldo disponível</p>
        <p className={styles.balanceValue}>{formatCurrency(balance)}</p>
        <div className={styles.balanceChange} style={{ color: summary.income > 0 ? '#1d9e75' : '#888890' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 9V3M3 5.5l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{formatCurrency(summary.income)} de receita este mês</span>
        </div>
        <div className={styles.miniChart}>
          <MiniLineChart data={chartData} color="#378add" height={52} />
        </div>
      </Card>

      {/* Quick actions */}
      <div className={styles.quickActions}>
        <QuickAction
          label="Adicionar"
          color="#378add"
          onClick={() => setModal('add')}
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
        />
        <QuickAction
          label="Transferir"
          color="#7f77dd"
          onClick={() => setModal('transfer')}
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 8h12M13 5l3 3-3 3M16 12H4M7 15l-3-3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        />
        <QuickAction
          label="Aposta"
          color="#ef9f27"
          onClick={() => setModal('bet')}
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.3"/><circle cx="7" cy="7" r="1" fill="currentColor"/><circle cx="13" cy="13" r="1" fill="currentColor"/><circle cx="13" cy="7" r="1" fill="currentColor"/><circle cx="7" cy="13" r="1" fill="currentColor"/></svg>}
        />
        <QuickAction
          label="Rendimento"
          color="#1d9e75"
          onClick={() => setModal('yield')}
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 14l4-5 3 2 5-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 4h3v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        />
      </div>

      {/* Recent transactions */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTitle}>Últimos gastos</p>
          <a href="/transacoes" className={styles.sectionLink}>Ver todos</a>
        </div>
        <Card>
          {loading && <p style={{ color: '#888890', fontSize: 12, textAlign: 'center', padding: 16 }}>Carregando...</p>}
          {!loading && recentExpenses.length === 0 && (
            <p style={{ color: '#888890', fontSize: 12, textAlign: 'center', padding: 16 }}>Nenhuma transação ainda</p>
          )}
          {recentExpenses.map(tx => (
            <TransactionItem key={tx.id} transaction={tx} />
          ))}
        </Card>
      </div>

      {/* Modals */}
      <AddTransaction open={modal === 'add'} onClose={() => setModal(null)} />
      <Transfer open={modal === 'transfer'} onClose={() => setModal(null)} />
      <AddBet open={modal === 'bet'} onClose={() => setModal(null)} />
      <AddYield open={modal === 'yield'} onClose={() => setModal(null)} />
    </div>
  )
}

export default Home
