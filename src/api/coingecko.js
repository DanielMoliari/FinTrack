const BASE = import.meta.env.VITE_COINGECKO_URL || 'https://api.coingecko.com/api/v3'

/**
 * Search coins by name or symbol
 * @param {string} query
 * @returns {Array} top coins with { id, name, symbol, thumb, market_cap_rank }
 */
export const searchCoins = async (query) => {
  if (!query) return []
  const res = await fetch(`${BASE}/search?query=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('CoinGecko search error')
  const data = await res.json()
  return (data.coins || []).slice(0, 6)
}

/**
 * Fetch current BRL prices for given CoinGecko IDs
 * @param {string[]} ids - e.g. ['bitcoin', 'ethereum']
 * @returns {Object} { bitcoin: { brl: 520000 }, ... }
 */
export const fetchPrices = async (ids) => {
  if (!ids || ids.length === 0) return {}
  const idsStr = ids.join(',')
  const url = `${BASE}/simple/price?ids=${idsStr}&vs_currencies=brl&include_24hr_change=true`
  const res = await fetch(url)
  if (!res.ok) throw new Error('CoinGecko error')
  return res.json()
}

/**
 * Given crypto portfolio and prices, compute total BRL value
 */
export const computeCryptoTotal = (cryptoList, prices) => {
  return cryptoList
    .filter(c => c.ativo)
    .reduce((sum, c) => {
      const id = c.simbolo.toLowerCase()
      const price = prices[id]?.brl ?? c.preco_entrada
      return sum + price * parseFloat(c.quantidade)
    }, 0)
}
