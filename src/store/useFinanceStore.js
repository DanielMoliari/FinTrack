import { create } from 'zustand'
import { fetchData } from '../api/sheets'
import { fetchPrices } from '../api/coingecko'

const useFinanceStore = create((set, get) => ({
  // Raw data
  transactions: [],
  fixed: [],
  wallets: [],
  rendimentos: [],
  metas: [],
  crypto: [],
  cryptoPrices: {},

  // UI state
  loading: false,
  error: null,
  lastFetched: null,

  // Settings (persisted in localStorage — initial values from .env)
  settings: {
    apiUrl:          import.meta.env.VITE_API_URL   || '',
    apiToken:        import.meta.env.VITE_API_TOKEN || '',
    userName:        '',
    monthlyReminder: false,
  },

  // Load all data
  loadAll: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const data = await fetchData(params)
      const newState = {
        transactions: data.transactions || [],
        fixed: data.fixed || [],
        wallets: data.wallets || [],
        rendimentos: data.rendimentos || [],
        metas: data.metas || [],
        crypto: data.crypto || [],
        loading: false,
        lastFetched: Date.now()
      }
      set(newState)

      // Fetch crypto prices if we have crypto
      const activeCrypto = (data.crypto || []).filter(c => c.ativo)
      if (activeCrypto.length > 0) {
        const ids = [...new Set(activeCrypto.map(c => c.simbolo.toLowerCase()))]
        try {
          const prices = await fetchPrices(ids)
          set({ cryptoPrices: prices })
        } catch {
          // Non-critical
        }
      }
    } catch (err) {
      set({ loading: false, error: err.message })
    }
  },

  // Optimistic transaction add
  addTransactionLocal: (tx) => {
    set(state => ({ transactions: [tx, ...state.transactions] }))
  },

  // Settings update
  updateSettings: (partial) => {
    set(state => ({
      settings: { ...state.settings, ...partial }
    }))
    // Persist to localStorage
    const current = get().settings
    localStorage.setItem('fintrack_settings', JSON.stringify({ ...current, ...partial }))
  },

  // Load settings from localStorage
  loadSettings: () => {
    try {
      const stored = localStorage.getItem('fintrack_settings')
      if (stored) {
        set(state => ({ settings: { ...state.settings, ...JSON.parse(stored) } }))
      }
    } catch {
      // ignore
    }
  }
}))

export default useFinanceStore
