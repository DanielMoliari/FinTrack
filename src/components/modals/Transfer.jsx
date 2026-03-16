import { useState } from 'react'
import Modal from '../ui/Modal'
import { transfer } from '../../api/sheets'
import useFinanceStore from '../../store/useFinanceStore'
import styles from './Modal.module.scss'

const Transfer = ({ open, onClose }) => {
  const loadAll = useFinanceStore(s => s.loadAll)
  const wallets = useFinanceStore(s => s.wallets).filter(w => w.ativo)

  const [de, setDe] = useState('')
  const [para, setPara] = useState('')
  const [valor, setValor] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const reset = () => { setDe(''); setPara(''); setValor(''); setError('') }
  const handleClose = () => { reset(); onClose() }

  const handleConfirm = async () => {
    if (!de || !para) { setError('Selecione as carteiras'); return }
    if (de === para) { setError('Origem e destino não podem ser iguais'); return }
    if (!valor || parseFloat(valor) <= 0) { setError('Informe um valor válido'); return }
    setSaving(true)
    try {
      await transfer({ de, para, valor: parseFloat(valor) })
      await loadAll()
      handleClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Transferir">
      <p className={styles.fieldLabel}>De</p>
      <select className={styles.select} value={de} onChange={e => setDe(e.target.value)}>
        <option value="">Selecione a origem...</option>
        {wallets.map(w => <option key={w.id} value={w.id}>{w.nome || w.id}</option>)}
      </select>

      <p className={styles.fieldLabel}>Para</p>
      <select className={styles.select} value={para} onChange={e => setPara(e.target.value)}>
        <option value="">Selecione o destino...</option>
        {wallets.filter(w => w.id !== de).map(w => <option key={w.id} value={w.id}>{w.nome || w.id}</option>)}
      </select>

      <div className={styles.valueInput}>
        <span className={styles.currency}>R$</span>
        <input
          type="number"
          placeholder="0,00"
          value={valor}
          onChange={e => setValor(e.target.value)}
          inputMode="decimal"
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.saveBtnWrap}>
        <button className={styles.saveBtn} onClick={handleConfirm} disabled={saving} type="button">
          {saving ? 'Transferindo...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  )
}

export default Transfer
