import { useState, useMemo } from 'react'
import Modal from '../ui/Modal'
import { addTransaction } from '../../api/sheets'
import { generateId, formatCurrency } from '../../utils/formatters'
import useFinanceStore from '../../store/useFinanceStore'
import styles from './Modal.module.scss'

const AddBet = ({ open, onClose }) => {
  const loadAll = useFinanceStore(s => s.loadAll)
  const transactions = useFinanceStore(s => s.transactions)

  const [tipo, setTipo] = useState('ganho')
  const [valor, setValor] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Running bet balance
  const betBalance = useMemo(() => {
    const bets = transactions.filter(t => t.categoria === 'Apostas e jogos')
    return bets.reduce((sum, t) => {
      const v = parseFloat(t.valor) || 0
      return t.subcategoria === 'Ganho' ? sum + v : sum - v
    }, 0)
  }, [transactions])

  const handleClose = () => { setTipo('ganho'); setValor(''); setError(''); onClose() }

  const handleSave = async () => {
    if (!valor || parseFloat(valor) <= 0) { setError('Informe um valor válido'); return }
    setSaving(true)
    try {
      await addTransaction({
        id: generateId('bet'),
        valor: parseFloat(valor),
        tipo_fluxo: tipo === 'ganho' ? 'entrada' : 'saida',
        categoria: 'Apostas e jogos',
        subcategoria: tipo === 'ganho' ? 'Ganho' : 'Perda',
        descricao: tipo === 'ganho' ? 'Ganho em aposta' : 'Perda em aposta',
        metodo_pagamento: 'pix',
        carteira_id: 'geral'
      })
      await loadAll()
      handleClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const previewBalance = betBalance + (tipo === 'ganho' ? 1 : -1) * (parseFloat(valor) || 0)

  return (
    <Modal open={open} onClose={handleClose} title="Registrar aposta">
      <div className={styles.betToggle}>
        <button className={tipo === 'ganho' ? styles.betGain : ''} onClick={() => setTipo('ganho')} type="button">Ganho</button>
        <button className={tipo === 'perda' ? styles.betLoss : ''} onClick={() => setTipo('perda')} type="button">Perda</button>
      </div>

      <div className={styles.valueInput}>
        <span className={styles.currency}>R$</span>
        <input
          type="number"
          placeholder="0,00"
          value={valor}
          onChange={e => setValor(e.target.value)}
          inputMode="decimal"
          autoFocus
        />
      </div>

      <div className={styles.balanceDisplay} style={{ color: previewBalance >= 0 ? '#1d9e75' : '#d85a30' }}>
        {previewBalance >= 0 ? '+' : ''}{formatCurrency(previewBalance)}
      </div>
      <p style={{ textAlign: 'center', fontSize: 11, color: '#888890', marginBottom: 20 }}>Saldo corrido de apostas</p>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.saveBtn} onClick={handleSave} disabled={saving} type="button">
        {saving ? 'Registrando...' : 'Registrar'}
      </button>
    </Modal>
  )
}

export default AddBet
