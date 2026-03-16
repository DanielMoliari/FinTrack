import styles from './Card.module.scss'

const Card = ({ children, className = '', onClick, style }) => (
  <div
    className={`${styles.card} ${className}`}
    onClick={onClick}
    style={style}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
  >
    {children}
  </div>
)

export default Card
