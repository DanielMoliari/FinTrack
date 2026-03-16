import { useState, useMemo } from 'react'
import Modal from '../ui/Modal'
import { addRendimento } from '../../api/sheets'
import { formatCurrency } from '../../utils/formatters'
import useFinanceStore from '../../store/useFinanceStore'
import styles from './Modal.module.scss'

const AddYield = ({ open, onClose }) => {
  const loadAll = useFinanceStore(s => s.loadAll)
  const wallets = useFinanceStore(s => s.wallets).filter(w => w.ativo && w.tipo !== 'crypto')

  const now = new Date()
  const [carteira, setCarteira] = useState('')
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())
  const [valorRendido, setValorRendido] = useState('')
  const [saldoFinal, setSaldoFinal] = useState('')
  const [cdi, setCdi] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    setCarteira(''); setValorRendido(''); setSaldoFinal(''); setCdi(''); setError(''); onClose()
  }

  const handleSave = async () => {
    if (!carteira) { setError('Selecione uma carteira'); return }
    if (!valorRendido || parseFloat(valorRendido.replace(',', '.')) <= 0) { setError('Informe o valor rendido'); return }
    setSaving(true)
    try {
      await addRendimento({
        carteira_id: carteira,
        mes,
        ano,
        valor_rendido: parseFloat(valorRendido.replace(',', '.')),
        saldo_final: parseFloat(saldoFinal.replace(',', '.')) || 0,
        cdi_vigente: parseFloat(cdi.replace(',', '.')) || 0
      })
      await loadAll()
      handleClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  return (
    <Modal open={open} onClose={handleClose} title="Registrar rendimento">
      <p className={styles.fieldLabel}>Carteira</p>
      <select className={styles.select} value={carteira} onChange={e => setCarteira(e.target.value)}>
        <option value="">Selecione...</option>
        {wallets.map(w => <option key={w.id} value={w.id}>{w.nome || w.id}</option>)}
      </select>

      <p className={styles.fieldLabel}>Mês / Ano de referência</p>
      <div className={styles.row} style={{ marginBottom: 16 }}>
        <select className={styles.select} value={mes} onChange={e => setMes(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input className={styles.input} type="number" value={ano} onChange={e => setAno(Number(e.target.value))} style={{ width: 80 }} />
      </div>

      <p className={styles.fieldLabel}>Valor rendido</p>
      <div className={styles.valueInput} style={{ marginBottom: 16 }}>
        <span className={styles.currency}>R$</span>
        <input type="text" inputMode="decimal" placeholder="0,00" value={valorRendido} onChange={e => setValorRendido(e.target.value.replace(/[^0-9,]/g, ''))} />
      </div>

      <p className={styles.fieldLabel}>Saldo final (opcional)</p>
      <input className={styles.input} type="text" inputMode="decimal" placeholder="0,00" value={saldoFinal} onChange={e => setSaldoFinal(e.target.value.replace(/[^0-9,]/g, ''))} />

      <p className={styles.fieldLabel}>CDI vigente % a.a. (opcional)</p>
      <input className={styles.input} type="text" inputMode="decimal" placeholder="10,5" value={cdi} onChange={e => setCdi(e.target.value.replace(/[^0-9,]/g, ''))} />

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.saveBtnWrap}>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving} type="button">
          {saving ? 'Salvando...' : 'Salvar rendimento'}
        </button>
      </div>
    </Modal>
  )
}

export default AddYield
