import { useMemo } from 'react'
import useFinanceStore from '../store/useFinanceStore'
import { parseDate } from '../utils/formatters'

export const useTransactions = (filters = {}) => {
  const { transactions, loading } = useFinanceStore()

  const filtered = useMemo(() => {
    let list = [...transactions]

    if (filters.mes !== undefined && filters.ano !== undefined) {
      list = list.filter(tx => {
        const d = parseDate(tx.data_hora)
        return d.getMonth() + 1 === filters.mes && d.getFullYear() === filters.ano
      })
    } else if (filters.ano !== undefined) {
      list = list.filter(tx => {
        const d = parseDate(tx.data_hora)
        return d.getFullYear() === filters.ano
      })
    }

    if (filters.carteira) {
      list = list.filter(tx => tx.carteira_id === filters.carteira)
    }

    if (filters.tipo_fluxo) {
      list = list.filter(tx => tx.tipo_fluxo === filters.tipo_fluxo)
    }

    // Sort descending
    list.sort((a, b) => parseDate(b.data_hora) - parseDate(a.data_hora))

    return list
  }, [transactions, filters.mes, filters.ano, filters.carteira, filters.tipo_fluxo])

  const summary = useMemo(() => {
    const income  = filtered.filter(t => t.tipo_fluxo === 'entrada').reduce((s, t) => s + parseFloat(t.valor || 0), 0)
    const expense = filtered.filter(t => t.tipo_fluxo === 'saida').reduce((s, t) => s + parseFloat(t.valor || 0), 0)
    return { income, expense, balance: income - expense }
  }, [filtered])

  return { transactions: filtered, summary, loading }
}

export default useTransactions
