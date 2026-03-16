import { useMemo, useState } from 'react'
import useFinanceStore from '../store/useFinanceStore'
import { useWallets } from '../hooks/useWallets'
import { formatCurrency, getMonthName, formatPercent } from '../utils/formatters'
import { updateWallet } from '../api/sheets'
import Card from '../components/ui/Card'
import LineChart from '../components/charts/LineChart'
import AddCrypto from '../components/modals/AddCrypto'
import styles from './Patrimony.module.scss'

const now = new Date()
const CDI_RATE = parseFloat(import.meta.env.VITE_CDI_RATE) || 0.105

const PencilIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M9 1.5L1.5 9l-1 2.5 2.5-1L10.5 3l-1.5-1.5z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const Patrimony = () => {
  const { rendimentos, crypto, cryptoPrices, loadAll, wallets: rawWallets } = useFinanceStore()
  const { wallets, totalPatrimony } = useWallets()

  const [editingWallet, setEditingWallet] = useState(null)
  const [walletVal,     setWalletVal]     = useState('')
  const [savingWallet,  setSavingWallet]  = useState(false)
  const [addCryptoOpen, setAddCryptoOpen] = useState(false)

  // C6Bank
  const [c6Open,    setC6Open]    = useState(false)
  const [c6editing, setC6editing] = useState(null) // 'cdb' | 'conta_corrente'
  const [c6val,     setC6val]     = useState('')
  const [savingC6,  setSavingC6]  = useState(false)

  // Read c6 values directly from Sheets data
  const c6raw = rawWallets.find(w => w.id === 'c6bank')
  const c6cdb = parseFloat(c6raw?.cdb)            || 0
  const c6cc  = parseFloat(c6raw?.conta_corrente) || 0

  const c6wallet = wallets.find(w => w.id === 'c6bank')

  const startEditWallet = (w) => {
    setEditingWallet(w.id)
    setWalletVal(w.balance > 0 ? w.balance.toFixed(2) : '')
  }

  const handleSaveWallet = async (walletId) => {
    const val = parseFloat(walletVal)
    if (isNaN(val)) return
    setSavingWallet(true)
    try {
      await updateWallet({ id: walletId, saldo_inicial: val })
      setEditingWallet(null)
      await loadAll()
    } catch (e) {
      alert(`Erro ao salvar: ${e.message}`)
    } finally {
      setSavingWallet(false)
    }
  }

  const startEditC6 = (field, currentVal) => {
    setC6editing(field)
    setC6val(currentVal > 0 ? String(currentVal) : '')
  }

  const handleSaveC6 = async (field) => {
    const val = parseFloat(c6val)
    if (isNaN(val) || val < 0) return
    setSavingC6(true)
    setC6editing(null)
    try {
      await updateWallet({ id: 'c6bank', [field]: val })
      await loadAll()
    } catch (e) {
      alert(`Erro ao salvar: ${e.message}`)
    } finally {
      setSavingC6(false)
    }
  }

  // Monthly patrimony evolution
  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const m = d.getMonth() + 1
      const y = d.getFullYear()
      const rend = rendimentos.filter(r => {
        if (parseInt(r.ano) < y) return true
        return parseInt(r.ano) === y && parseInt(r.mes) <= m
      })
      return { label: getMonthName(d.getMonth()), value: rend.reduce((s, r) => s + parseFloat(r.saldo_final || 0), 0) }
    })
  }, [rendimentos])

  const hasChartData = chartData.filter(p => p.value > 0).length >= 2

  // Include C6Bank CDB in CDI projection
  const c6cdbEntry = c6cdb > 0 && c6wallet
    ? { id: 'c6bank-cdb', nome: `${c6wallet.nome || 'C6Bank'} — CDB`, balance: c6cdb, cdi_percentual: parseFloat(c6wallet.cdi_percentual) || 100, cor: c6wallet.cor || '#1d9e75' }
    : null
  const cdiWallets = [
    ...wallets.filter(w => w.tipo === 'cdi'),
    ...(c6cdbEntry ? [c6cdbEntry] : []),
  ]
  const nonC6Wallets = wallets.filter(w => w.tipo !== 'crypto' && w.id !== 'c6bank')
  const activeCrypto = crypto.filter(c => c.ativo)

  const renderC6Row = (label, field, value, hint) => {
    const isEditing = c6editing === field
    return (
      <div className={styles.c6Row}>
        <div>
          <p className={styles.c6Label}>{label}</p>
          {hint && <p className={styles.c6Hint}>{hint}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isEditing ? (
            <>
              <input
                type="number"
                inputMode="decimal"
                value={c6val}
                onChange={e => setC6val(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveC6(field) }}
                style={{ width: 100, background: '#131320', border: '0.5px solid #1e1e30', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#e0e0e8', textAlign: 'right' }}
                autoFocus
                placeholder="0,00"
              />
              <button onClick={() => handleSaveC6(field)} disabled={savingC6} style={{ background: '#1d9e75', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }} type="button">
                {savingC6 ? '…' : 'OK'}
              </button>
              <button onClick={() => setC6editing(null)} style={{ color: '#888890', fontSize: 12 }} type="button">✕</button>
            </>
          ) : (
            <>
              <p className={styles.c6Value}>{formatCurrency(value)}</p>
              <button onClick={() => startEditC6(field, value)} style={{ color: '#3a3a52', padding: '4px' }} type="button">
                <PencilIcon />
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className="page-header">
        <h1>Patrimônio</h1>
      </div>

      {/* Total */}
      <div className={styles.total}>
        <p className={styles.totalLabel}>Total consolidado</p>
        <p className={styles.totalValue}>{formatCurrency(totalPatrimony)}</p>
      </div>

      {/* Evolution chart — only when there is real history */}
      {hasChartData ? (
        <div className={styles.chartWrap}>
          <LineChart data={chartData} color="#1d9e75" height={130} />
        </div>
      ) : (
        <div className={styles.chartEmpty}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3a3a52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <p>Registre rendimentos mensais para ver sua evolução patrimonial aqui.</p>
          <p style={{ color: '#3a3a52' }}>Use o botão <strong>Rendimento</strong> na tela inicial.</p>
        </div>
      )}

      {/* Wallet cards */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Carteiras</p>
        <div className={styles.walletList}>

          {/* Regular wallets */}
          {nonC6Wallets.map(w => (
            <Card key={w.id} className={styles.walletCard}>
              <div className={styles.walletBar} style={{ background: w.cor || '#888780' }} />
              <div className={styles.walletInfo}>
                <div>
                  <p className={styles.walletName}>{w.nome || w.id}</p>
                  <p className={styles.walletType}>
                    {w.tipo === 'cdi' ? `CDI ${w.cdi_percentual}%` : 'Dinheiro físico'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {editingWallet === w.id ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={walletVal}
                        onChange={e => setWalletVal(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveWallet(w.id)}
                        style={{ width: 100, background: '#131320', border: '0.5px solid #1e1e30', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#e0e0e8', textAlign: 'right' }}
                        autoFocus
                        placeholder="0,00"
                      />
                      <button onClick={() => handleSaveWallet(w.id)} disabled={savingWallet} style={{ background: '#1d9e75', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }} type="button">
                        {savingWallet ? '…' : 'OK'}
                      </button>
                      <button onClick={() => setEditingWallet(null)} style={{ color: '#888890', fontSize: 12, padding: '4px 2px' }} type="button">✕</button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'right' }}>
                      <p className={styles.walletBalance}>{formatCurrency(w.balance)}</p>
                      {w.lastRendimento > 0 && (
                        <p className={styles.walletRend} style={{ color: '#1d9e75' }}>+{formatCurrency(w.lastRendimento)} mês</p>
                      )}
                    </div>
                  )}
                  {editingWallet !== w.id && (
                    <button onClick={() => startEditWallet(w)} title="Editar saldo" type="button" style={{ color: '#3a3a52', padding: '4px', flexShrink: 0 }}>
                      <PencilIcon />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {/* C6Bank expandable */}
          {c6wallet && (
            <Card className={`${styles.walletCard} ${styles.walletCardC6} ${c6Open ? styles.walletCardExpanded : ''}`}>
              <button type="button" className={styles.c6Header} onClick={() => setC6Open(v => !v)}>
                <div className={styles.walletBar} style={{ background: c6wallet.cor || '#1d9e75', alignSelf: 'stretch' }} />
                <div style={{ flex: 1 }}>
                  <p className={styles.walletName}>{c6wallet.nome || 'C6Bank'}</p>
                  <p className={styles.walletType}>CDB · Conta Corrente</p>
                </div>
                <p className={styles.walletBalance}>{formatCurrency(c6cdb + c6cc)}</p>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                  style={{ color: '#3a3a52', transform: c6Open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginLeft: 4 }}>
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {c6Open && (
                <div className={styles.c6Expanded}>
                  {renderC6Row('CDB Liquidez Diária', 'cdb', c6cdb, 'entra no Total Consolidado')}
                  {renderC6Row('Conta Corrente', 'conta_corrente', c6cc, 'dinheiro em trânsito')}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Crypto section */}
      <div className={styles.section}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p className={styles.sectionTitle} style={{ marginBottom: 0 }}>Crypto</p>
          <button
            type="button"
            onClick={() => setAddCryptoOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#131320', border: '0.5px solid #1e1e30', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#378add', fontWeight: 600 }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Adicionar
          </button>
        </div>
        {activeCrypto.length > 0 && (
          <Card>
            {activeCrypto.map(c => {
              const id = c.simbolo.toLowerCase()
              const currentPrice = cryptoPrices[id]?.brl ?? parseFloat(c.preco_entrada) ?? 0
              const currentValue = currentPrice * parseFloat(c.quantidade || 0)
              const entryValue   = parseFloat(c.preco_entrada || 0) * parseFloat(c.quantidade || 0)
              const change       = entryValue > 0 ? ((currentValue - entryValue) / entryValue) * 100 : 0
              return (
                <div key={c.id} className={styles.cryptoRow}>
                  <div>
                    <p className={styles.cryptoName}>{c.nome}</p>
                    <p className={styles.cryptoSub}>{c.simbolo.toUpperCase()} · {parseFloat(c.quantidade).toFixed(6)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className={styles.cryptoValue}>{formatCurrency(currentValue)}</p>
                    <p className={styles.cryptoChange} style={{ color: change >= 0 ? '#1d9e75' : '#d85a30' }}>{formatPercent(change)}</p>
                  </div>
                </div>
              )
            })}
          </Card>
        )}
        {activeCrypto.length === 0 && (
          <p style={{ fontSize: 12, color: '#3a3a52', textAlign: 'center', padding: '16px 0' }}>Nenhuma crypto cadastrada</p>
        )}
      </div>

      <AddCrypto open={addCryptoOpen} onClose={() => setAddCryptoOpen(false)} />

      {/* CDI Projection */}
      {cdiWallets.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Projeção CDI — 12 meses</p>
          <Card>
            {cdiWallets.map(w => {
              const monthlyRate = CDI_RATE / 12 * (parseFloat(w.cdi_percentual || 100) / 100)
              const gain = w.balance * Math.pow(1 + monthlyRate, 12) - w.balance
              return (
                <div key={w.id} className={styles.projRow}>
                  <div className={styles.projDot} style={{ background: w.cor || '#888780' }} />
                  <span className={styles.projName}>{w.nome || w.id}</span>
                  <span className={styles.projValue} style={{ color: '#1d9e75' }}>+{formatCurrency(gain)} em 12m</span>
                </div>
              )
            })}
          </Card>
        </div>
      )}
    </div>
  )
}

export default Patrimony
