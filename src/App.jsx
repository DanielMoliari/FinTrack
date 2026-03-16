import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import useFinanceStore from './store/useFinanceStore'
import BottomNav from './components/BottomNav'
import SetupScreen from './components/SetupScreen'
import Home from './pages/Home'
import Transactions from './pages/Transactions'
import Reports from './pages/Reports'
import Patrimony from './pages/Patrimony'
import Profile from './pages/Profile'

const isConfigured = () => Boolean(localStorage.getItem('fintrack_settings'))

const App = () => {
  const { loadAll, loadSettings } = useFinanceStore()
  const location = useLocation()

  useEffect(() => {
    loadSettings()
    if (isConfigured()) loadAll()
  }, [])

  // Não configurado: mostra setup em todas as rotas exceto /perfil
  if (!isConfigured() && location.pathname !== '/perfil') {
    return <SetupScreen />
  }

  return (
    <div className="app-layout">
      <main className="page-content">
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/transacoes"  element={<Transactions />} />
          <Route path="/relatorios"  element={<Reports />} />
          <Route path="/patrimonio"  element={<Patrimony />} />
          <Route path="/perfil"      element={<Profile />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

export default App
