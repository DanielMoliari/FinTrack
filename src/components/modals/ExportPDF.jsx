import { useState, useMemo } from 'react'
import Modal from '../ui/Modal'
import useFinanceStore from '../../store/useFinanceStore'
import styles from './Modal.module.scss'

const today = new Date()
const toIso = (d) => d.toISOString().split('T')[0]

// Default: last 3 full months
const defaultEnd = toIso(new Date(today.getFullYear(), today.getMonth(), 0))
const defaultStart = toIso(new Date(today.getFullYear(), today.getMonth() - 3, 1))

const parseTransactionDate = (str) => {
  if (!str) return null
  // "dd/MM/yyyy - HH:mm:ss" or "dd/MM/yyyy"
  const parts = str.split(' - ')
  const [d, m, y] = parts[0].split('/')
  if (!d || !m || !y) return null
  return new Date(Number(y), Number(m) - 1, Number(d))
}

const ExportPDF = ({ open, onClose }) => {
  const { transactions, rendimentos, settings } = useFinanceStore()

  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate]     = useState(defaultEnd)
  const [lang, setLang]           = useState('pt')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const preview = useMemo(() => {
    if (!startDate || !endDate) return { count: 0, months: 0 }
    const start = new Date(startDate + 'T00:00:00')
    const end   = new Date(endDate   + 'T23:59:59')
    const filtered = transactions.filter(t => {
      const d = parseTransactionDate(t.data_hora)
      return d && d >= start && d <= end
    })
    const monthSet = new Set(filtered.map(t => {
      const d = parseTransactionDate(t.data_hora)
      return d ? `${d.getFullYear()}-${d.getMonth()}` : null
    }).filter(Boolean))
    return { count: filtered.length, months: monthSet.size }
  }, [transactions, startDate, endDate])

  const handleGenerate = async () => {
    if (!startDate || !endDate) { setError(lang === 'pt' ? 'Selecione o período' : 'Select a period'); return }
    if (startDate > endDate) { setError(lang === 'pt' ? 'Data início deve ser antes da data fim' : 'Start date must be before end date'); return }
    setError('')
    setLoading(true)
    try {
      // Dynamic import — jsPDF (~1 MB) só carrega quando o usuário gera o PDF
      const { generatePDF } = await import('../../utils/generatePDF')
      await generatePDF({
        transactions,
        rendimentos,
        lang,
        startDate,
        endDate,
        userName: settings.userName || '',
      })
      onClose()
    } catch (e) {
      setError(e.message || 'Erro ao gerar PDF')
    } finally {
      setLoading(false)
    }
  }

  const hasData = preview.count > 0

  return (
    <Modal open={open} onClose={onClose} title={lang === 'pt' ? 'Exportar PDF' : 'Export PDF'}>

      {/* Language toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {['pt', 'en'].map(l => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: lang === l ? '#1d9e75' : '#131320',
              color: lang === l ? '#fff' : '#888890',
              border: lang === l ? 'none' : '0.5px solid #1e1e30',
              transition: 'all 0.15s',
            }}
          >
            {l === 'pt' ? '🇧🇷 Português' : '🇺🇸 English'}
          </button>
        ))}
      </div>

      {/* Date range */}
      <p className={styles.fieldLabel}>{lang === 'pt' ? 'Data início' : 'Start date'}</p>
      <input
        className={styles.input}
        type="date"
        value={startDate}
        onChange={e => setStartDate(e.target.value)}
      />

      <p className={styles.fieldLabel}>{lang === 'pt' ? 'Data fim' : 'End date'}</p>
      <input
        className={styles.input}
        type="date"
        value={endDate}
        onChange={e => setEndDate(e.target.value)}
      />

      {/* Preview card */}
      <div style={{
        background: '#0f0f1a', border: `0.5px solid ${hasData ? '#1d9e75' : '#1e1e30'}`,
        borderRadius: 10, padding: '12px 16px', marginBottom: 16,
      }}>
        <p style={{ fontSize: 11, color: '#888890', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {lang === 'pt' ? 'Prévia do relatório' : 'Report preview'}
        </p>
        {hasData ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#c0c0cc' }}>
                {lang === 'pt' ? 'Transações' : 'Transactions'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e0e0e8' }}>{preview.count}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#c0c0cc' }}>
                {lang === 'pt' ? 'Meses cobertos' : 'Months covered'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e0e0e8' }}>{preview.months}</span>
            </div>
          </>
        ) : (
          <p style={{ fontSize: 13, color: '#3a3a52', textAlign: 'center', padding: '4px 0' }}>
            {lang === 'pt' ? 'Nenhuma transação no período selecionado' : 'No transactions in selected period'}
          </p>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button
        className={styles.saveBtn}
        onClick={handleGenerate}
        disabled={loading || !hasData}
        type="button"
      >
        {loading
          ? (lang === 'pt' ? 'Gerando…' : 'Generating…')
          : (lang === 'pt' ? 'Gerar PDF' : 'Generate PDF')}
      </button>

    </Modal>
  )
}

export default ExportPDF
