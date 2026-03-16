import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { addCrypto } from '../../api/sheets'
import { fetchPrices, searchCoins } from '../../api/coingecko'
import { generateId, formatCurrency } from '../../utils/formatters'
import useFinanceStore from '../../store/useFinanceStore'
import styles from './Modal.module.scss'

const POPULAR = [
  { id: 'bitcoin',       name: 'Bitcoin',   symbol: 'BTC',  color: '#F7931A' },
  { id: 'ethereum',      name: 'Ethereum',  symbol: 'ETH',  color: '#627EEA' },
  { id: 'tether',        name: 'Tether',    symbol: 'USDT', color: '#26A17B' },
  { id: 'binancecoin',   name: 'BNB',       symbol: 'BNB',  color: '#F3BA2F' },
  { id: 'solana',        name: 'Solana',    symbol: 'SOL',  color: '#9945FF' },
  { id: 'usd-coin',      name: 'USDC',      symbol: 'USDC', color: '#2775CA' },
  { id: 'ripple',        name: 'XRP',       symbol: 'XRP',  color: '#346AA9' },
  { id: 'dogecoin',      name: 'Dogecoin',  symbol: 'DOGE', color: '#C2A633' },
  { id: 'cardano',       name: 'Cardano',   symbol: 'ADA',  color: '#0033AD' },
  { id: 'avalanche-2',   name: 'Avalanche', symbol: 'AVAX', color: '#E84142' },
  { id: 'chainlink',     name: 'Chainlink', symbol: 'LINK', color: '#2A5ADA' },
  { id: 'matic-network', name: 'Polygon',   symbol: 'POL',  color: '#8247E5' },
]

const toApiDate = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const AddCrypto = ({ open, onClose }) => {
  const loadAll = useFinanceStore(s => s.loadAll)

  // Crypto selecionada (popular ou resultado de busca)
  const [selected,     setSelected]     = useState(null)

  // Busca livre
  const [searchQuery,  setSearchQuery]  = useState('')
  const [suggestions,  setSuggestions]  = useState([])
  const [searching,    setSearching]    = useState(false)

  // Campos do formulário
  const [quantidade,   setQuantidade]   = useState('')
  const [preco,        setPreco]        = useState('')
  const [dataCompra,   setDataCompra]   = useState(new Date().toISOString().split('T')[0])

  // Preço ao vivo
  const [livePrice,    setLivePrice]    = useState(null)
  const [loadingPrice, setLoadingPrice] = useState(false)

  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  // Debounce do campo de busca → chama /search
  useEffect(() => {
    setSuggestions([])
    if (!searchQuery.trim() || selected) return
    setSearching(true)
    const t = setTimeout(() => {
      searchCoins(searchQuery.trim())
        .then(results => setSuggestions(results))
        .catch(() => setSuggestions([]))
        .finally(() => setSearching(false))
    }, 600)
    return () => { clearTimeout(t); setSearching(false) }
  }, [searchQuery, selected])

  // Busca preço ao vivo quando uma crypto é selecionada
  useEffect(() => {
    if (!selected?.id) { setLivePrice(null); return }
    let cancelled = false
    setLoadingPrice(true)
    fetchPrices([selected.id])
      .then(prices => {
        if (cancelled) return
        const p = prices[selected.id]?.brl ?? null
        setLivePrice(p)
        if (p) setPreco(p.toFixed(2))
      })
      .catch(() => { if (!cancelled) setLivePrice(null) })
      .finally(() => { if (!cancelled) setLoadingPrice(false) })
    return () => { cancelled = true }
  }, [selected?.id])

  const handlePickPopular = (c) => {
    setSelected(c)
    setSearchQuery('')
    setSuggestions([])
    setPreco('')
  }

  const handlePickSuggestion = (coin) => {
    setSelected({ id: coin.id, name: coin.name, symbol: coin.symbol, color: '#378add' })
    setSearchQuery('')
    setSuggestions([])
    setPreco('')
  }

  const reset = () => {
    setSelected(null); setSearchQuery(''); setSuggestions([])
    setQuantidade(''); setPreco(''); setLivePrice(null); setError('')
    setDataCompra(new Date().toISOString().split('T')[0])
  }

  const handleClose = () => { reset(); onClose() }

  const handleSave = async () => {
    if (!selected?.id)                          { setError('Selecione uma crypto'); return }
    if (!quantidade || parseFloat(quantidade) <= 0) { setError('Informe a quantidade'); return }
    if (!preco       || parseFloat(preco) <= 0)     { setError('Informe o preço de entrada'); return }
    setSaving(true)
    try {
      await addCrypto({
        id:            generateId('crypto'),
        simbolo:       selected.id,
        nome:          selected.name,
        quantidade:    parseFloat(quantidade),
        preco_entrada: parseFloat(preco),
        data_compra:   toApiDate(dataCompra),
        ativo:         true,
      })
      await loadAll()
      handleClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredPopular = POPULAR.filter(c =>
    !searchQuery ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalInvestido = quantidade && preco
    ? parseFloat(quantidade) * parseFloat(preco) : null

  const lucro = livePrice && quantidade && preco
    ? (livePrice - parseFloat(preco)) * parseFloat(quantidade) : null

  return (
    <Modal open={open} onClose={handleClose} title="Adicionar crypto">

      {/* Campo de busca */}
      <div style={{ position: 'relative', marginBottom: suggestions.length ? 4 : 20 }}>
        <input
          className={styles.input}
          style={{ marginBottom: 0, paddingRight: searching ? 36 : 12 }}
          placeholder="Buscar: polkadot, litecoin, pepe…"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setSelected(null); setLivePrice(null) }}
        />
        {searching && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#888890' }}>…</span>
        )}
      </div>

      {/* Sugestões da busca */}
      {suggestions.length > 0 && (
        <div style={{ background: '#0f0f1a', border: '0.5px solid #1e1e30', borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
          {suggestions.map((coin, i) => (
            <button
              key={coin.id}
              type="button"
              onClick={() => handlePickSuggestion(coin)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', textAlign: 'left',
                borderBottom: i < suggestions.length - 1 ? '0.5px solid #1e1e30' : 'none',
              }}
            >
              {coin.thumb
                ? <img src={coin.thumb} alt={coin.symbol} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                : <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1e1e30' }} />
              }
              <span style={{ fontSize: 13, color: '#e0e0e8', fontWeight: 500 }}>{coin.name}</span>
              <span style={{ fontSize: 11, color: '#888890', marginLeft: 2 }}>{coin.symbol?.toUpperCase()}</span>
              {coin.market_cap_rank && (
                <span style={{ fontSize: 10, color: '#3a3a52', marginLeft: 'auto' }}>#{coin.market_cap_rank}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Grade de populares */}
      {!selected && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 20 }}>
          {filteredPopular.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => handlePickPopular(c)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, padding: '8px 4px', borderRadius: 10,
                background: '#131320', border: '0.5px solid #1e1e30',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: c.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 700, color: '#fff',
              }}>
                {c.symbol.slice(0, 4)}
              </div>
              <span style={{ fontSize: 10, color: '#e0e0e8', fontWeight: 600 }}>{c.symbol}</span>
              <span style={{ fontSize: 9, color: '#888890' }}>{c.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Crypto selecionada + preço ao vivo */}
      {selected && (
        <div style={{
          background: '#0f0f1a', border: '0.5px solid #1e1e30',
          borderRadius: 10, padding: '10px 14px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: '#e0e0e8', fontWeight: 600 }}>
              {selected.name}
              <span style={{ fontSize: 11, color: '#888890', fontWeight: 400, marginLeft: 6 }}>
                {selected.symbol?.toUpperCase()}
              </span>
            </p>
            <p style={{ fontSize: 11, color: '#3a3a52', marginTop: 2 }}>preço atual via CoinGecko</p>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: livePrice ? '#e0e0e8' : '#888890' }}>
            {loadingPrice ? '…' : livePrice ? formatCurrency(livePrice) : '—'}
          </p>
          <button
            type="button"
            onClick={() => { setSelected(null); setLivePrice(null); setPreco('') }}
            style={{ color: '#3a3a52', fontSize: 14, padding: '2px 4px' }}
          >✕</button>
        </div>
      )}

      {/* Quantidade + Preço lado a lado */}
      <div className={styles.row} style={{ marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <p className={styles.fieldLabel}>Quantidade</p>
          <input
            className={styles.input}
            style={{ marginBottom: 0 }}
            type="number"
            inputMode="decimal"
            placeholder="0.00000001"
            step="0.00000001"
            value={quantidade}
            onChange={e => setQuantidade(e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <p className={styles.fieldLabel}>Preço entrada (R$)</p>
          <input
            className={styles.input}
            style={{ marginBottom: 0 }}
            type="number"
            inputMode="decimal"
            placeholder="0,00"
            value={preco}
            onChange={e => setPreco(e.target.value)}
          />
        </div>
      </div>

      {/* Data */}
      <p className={styles.fieldLabel}>Data da compra</p>
      <input
        className={styles.input}
        type="date"
        value={dataCompra}
        onChange={e => setDataCompra(e.target.value)}
      />

      {/* Resumo */}
      {totalInvestido !== null && (
        <div style={{
          background: '#0f0f1a', border: '0.5px solid #1e1e30',
          borderRadius: 10, padding: '10px 14px', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: lucro !== null ? 6 : 0 }}>
            <span style={{ fontSize: 12, color: '#888890' }}>Total investido</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#e0e0e8' }}>{formatCurrency(totalInvestido)}</span>
          </div>
          {lucro !== null && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#888890' }}>Valor atual</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: lucro >= 0 ? '#1d9e75' : '#d85a30' }}>
                {formatCurrency(livePrice * parseFloat(quantidade))}
                {' '}
                <span style={{ fontSize: 10 }}>({lucro >= 0 ? '+' : ''}{formatCurrency(lucro)})</span>
              </span>
            </div>
          )}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.saveBtnWrap}>
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving || !selected}
          type="button"
          style={{ background: '#378add' }}
        >
          {saving ? 'Salvando…' : 'Adicionar crypto'}
        </button>
      </div>
    </Modal>
  )
}

export default AddCrypto
