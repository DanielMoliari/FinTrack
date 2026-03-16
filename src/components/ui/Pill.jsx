import styles from './Pill.module.scss'

const Pill = ({ children, active, onClick }) => (
  <button
    className={`${styles.pill} ${active ? styles.active : ''}`}
    onClick={onClick}
    type="button"
  >
    {children}
  </button>
)

export default Pill
