import { NavLink } from 'react-router-dom'
import styles from './BottomNav.module.scss'

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Início',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 7.5L9 2l7 5.5V16a.5.5 0 01-.5.5H12v-4H6v4H2.5A.5.5 0 012 16V7.5z"
          stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    to: '/transacoes',
    label: 'Transações',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 5h12M3 9h9M3 13h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    to: '/relatorios',
    label: 'Relatórios',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <polyline points="2,14 6,9 10,11 16,4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="2" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    to: '/patrimonio',
    label: 'Patrimônio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="10" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="7.5" y="7" width="3" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="13" y="3" width="3" height="13" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    )
  },
  {
    to: '/perfil',
    label: 'Perfil',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    )
  }
]

const BottomNav = () => (
  <nav className={styles.nav}>
    {NAV_ITEMS.map(({ to, label, icon }) => (
      <NavLink
        key={to}
        to={to}
        end={to === '/'}
        className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
      >
        <span className={styles.icon}>{icon}</span>
        <span className={styles.label}>{label}</span>
      </NavLink>
    ))}
  </nav>
)

export default BottomNav
