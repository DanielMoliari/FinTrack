import { useState } from 'react'
import Modal from '../ui/Modal'
import { addFixed } from '../../api/sheets'
import { generateId } from '../../utils/formatters'
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, getCategorySubcategories } from '../../utils/categories'
import useFinanceStore from '../../store/useFinanceStore'
import styles from './Modal.module.scss'

const AddFixed = ({ open, onClose }) => {
  const loadAll = useFinanceStore(s => s.loadAll)
  const wallets = useFinanceStore(s => s.wallets).filter(w => w.ativo)

  const [nome,       setNome]       = useState('')
  const [valor,      setValor]      = useState('')
  const [categoria,  setCategoria]  = useState('')
  const [subcateg,   setSubcateg]   = useState('')
  const [diaVenc,    setDiaVenc]    = useState('1')
  const [metodo,     setMetodo]     = useState('cartao_credito')
  const [carteira,   setCarteira]   = useState('geral')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  const subs = categoria ? getCategorySubcategories(categoria) : []

  const reset = () => {
    setNome(''); setValor(''); setCategoria(''); setSubcateg('')
    setDiaVenc('1'); setMetodo('cartao_credito'); setCarteira('geral'); setError('')
  }

  const handleClose = () => { reset(); onClose() }

  const handleSave = async () => {
    if (!nome.trim())                          { setError('Informe o nome'); return }
    if (!valor || parseFloat(valor) <= 0)      { setError('Informe um valor válido'); return }
    if (!categoria)                            { setError('Selecione uma categoria'); return }
    setSaving(true)
    try {
      await addFixed({
        id:                generateId('fix'),
        nome:              nome.trim(),
        valor:             parseFloat(valor),
        categoria,
        subcategoria:      subcateg,
        dia_vencimento:    parseInt(diaVenc),
        metodo_pagamento:  metodo,
        carteira_id:       carteira,
        ativo:             true,
      })
      await loadAll()
      handleClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Novo fixo / assinatura">

      {/* Nome */}
      <p className={styles.fieldLabel}>Nome</p>
      <input
        className={styles.input}
        placeholder="Ex: Netflix, Aluguel, Academia…"
        value={nome}
        onChange={e => setNome(e.target.value)}
      />

      {/* Valor */}
      <p className={styles.fieldLabel}>Valor mensal (R$)</p>
      <div className={styles.valueInput} style={{ marginBottom: 16 }}>
        <span className={styles.currency}>R$</span>
        <input
          type="number"
          placeholder="0,00"
          value={valor}
          onChange={e => setValor(e.target.value)}
          inputMode="decimal"
        />
      </div>

      {/* Categoria */}
      <p className={styles.fieldLabel}>Categoria</p>
      <div className={styles.catGrid}>
        {EXPENSE_CATEGORIES.map(cat => (
          <button
            key={cat.name}
            type="button"
            className={`${styles.catBtn} ${categoria === cat.name ? styles.catActive : ''}`}
            style={categoria === cat.name ? { borderColor: cat.color, color: cat.color } : {}}
            onClick={() => { setCategoria(cat.name); setSubcateg('') }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Subcategoria */}
      {subs.length > 0 && (
        <>
          <p className={styles.fieldLabel}>Subcategoria</p>
          <select className={styles.select} value={subcateg} onChange={e => setSubcateg(e.target.value)}>
            <option value="">Selecione...</option>
            {subs.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </>
      )}

      {/* Dia de vencimento + Método lado a lado */}
      <div className={styles.row} style={{ marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <p className={styles.fieldLabel}>Dia vencimento</p>
          <select className={styles.select} value={diaVenc} onChange={e => setDiaVenc(e.target.value)} style={{ marginBottom: 0 }}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>Dia {d}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <p className={styles.fieldLabel}>Método</p>
          <select className={styles.select} value={metodo} onChange={e => setMetodo(e.target.value)} style={{ marginBottom: 0 }}>
            {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* Carteira */}
      <p className={styles.fieldLabel}>Carteira</p>
      <select className={styles.select} value={carteira} onChange={e => setCarteira(e.target.value)}>
        {wallets.map(w => <option key={w.id} value={w.id}>{w.nome || w.id}</option>)}
      </select>

      {error && <p className={styles.error}>{error}</p>}

      <button
        className={styles.saveBtn}
        onClick={handleSave}
        disabled={saving}
        type="button"
      >
        {saving ? 'Salvando…' : 'Adicionar fixo'}
      </button>
    </Modal>
  )
}

export default AddFixed
