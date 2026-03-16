import { useMemo } from 'react'
import useFinanceStore from '../store/useFinanceStore'
import { parseDate } from '../utils/formatters'

export const useWallets = () => {
  const { wallets, rendimentos, cryptoPrices, crypto } = useFinanceStore()

  const walletsWithBalance = useMemo(() => {
    return wallets
      .filter(w => w.ativo && w.id !== 'geral')
      .map(w => {
        // For c6bank: balance = CDB (the invested portion that counts as patrimony)
        // For others: balance = saldo_inicial set manually by the user
        const balance = w.id === 'c6bank'
          ? parseFloat(w.cdb) || 0
          : parseFloat(w.saldo_inicial) || 0

        // Last rendimento (for CDI display)
        const wRend = rendimentos
          .filter(r => r.carteira_id === w.id)
          .sort((a, b) => {
            if (parseInt(b.ano) !== parseInt(a.ano)) return parseInt(b.ano) - parseInt(a.ano)
            return parseInt(b.mes) - parseInt(a.mes)
          })
        const lastRend = wRend[0]

        return {
          ...w,
          balance,
          lastRendimento: lastRend ? parseFloat(lastRend.valor_rendido) : 0
        }
      })
  }, [wallets, rendimentos])

  const totalPatrimony = useMemo(() => {
    let total = walletsWithBalance.reduce((s, w) => {
      if (w.tipo === 'crypto') return s // crypto handled separately
      return s + w.balance
    }, 0)

    // Add crypto
    const activeCrypto = crypto.filter(c => c.ativo)
    activeCrypto.forEach(c => {
      const id = c.simbolo.toLowerCase()
      const price = cryptoPrices[id]?.brl ?? parseFloat(c.preco_entrada) ?? 0
      total += price * parseFloat(c.quantidade || 0)
    })

    return total
  }, [walletsWithBalance, crypto, cryptoPrices])

  return { wallets: walletsWithBalance, totalPatrimony }
}

export default useWallets
