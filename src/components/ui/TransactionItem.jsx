import { getCategoryColor, CATEGORY_ICONS } from '../../utils/categories'
import { formatCurrency, parseDate, formatDateDisplay } from '../../utils/formatters'
import styles from './TransactionItem.module.scss'

const TransactionItem = ({ transaction, showDate = true }) => {
  const { valor, tipo_fluxo, categoria, subcategoria, descricao, data_hora } = transaction
  const color = getCategoryColor(categoria)
  const icon = CATEGORY_ICONS[categoria] ?? '•'
  const isIncome = tipo_fluxo === 'entrada'
  const date = parseDate(data_hora)

  return (
    <div className={styles.item}>
      <div className={styles.icon} style={{ backgroundColor: `${color}22`, color }}>
        <span>{icon}</span>
      </div>
      <div className={styles.info}>
        <p className={styles.name}>{descricao || categoria}</p>
        <p className={styles.meta}>
          {subcategoria || categoria}
          {showDate && <> · {formatDateDisplay(date)}</>}
        </p>
      </div>
      <span className={`${styles.value} ${isIncome ? styles.income : ''}`}>
        {isIncome ? '+' : ''}{formatCurrency(valor)}
      </span>
    </div>
  )
}

export default TransactionItem
