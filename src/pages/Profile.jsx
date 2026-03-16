import { useState } from 'react'
import useFinanceStore from '../store/useFinanceStore'
import { useTransactions } from '../hooks/useTransactions'
import { calculateScore, getScoreLabel, getScoreColor } from '../utils/scoreCalculator'
import { postAction } from '../api/sheets'
import Card from '../components/ui/Card'
import ExportPDF from '../components/modals/ExportPDF'
import styles from './Profile.module.scss'

const now = new Date()

const Profile = () => {
  const { settings, updateSettings, fixed, transactions, wallets } = useFinanceStore()
  const { summary } = useTransactions({ mes: now.getMonth() + 1, ano: now.getFullYear() })
  const [editing, setEditing] = useState(null)
  const [tempVal, setTempVal] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [toast, setToast] = useState(null)
  const [exportOpen, setExportOpen] = useState(false)

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const handleBackupDrive = async () => {
    setActionLoading('backup')
    try {
      await postAction('backup_drive', { ts: Date.now() })
      showToast('Backup realizado com sucesso!')
    } catch (e) {
      showToast(`Erro no backup: ${e.message}`, false)
    } finally {
      setActionLoading(null)
    }
  }

  const handleMigrateData = async () => {
    if (!window.confirm('Migrar dados antigos para o formato atual? Essa ação não pode ser desfeita.')) return
    setActionLoading('migrate')
    try {
      await postAction('migrate', {})
      showToast('Migração concluída com sucesso!')
    } catch (e) {
      showToast(`Erro na migração: ${e.message}`, false)
    } finally {
      setActionLoading(null)
    }
  }

  const fixedTotal = fixed
    .filter(f => f.ativo && f.tipo_fluxo === 'saida')
    .reduce((s, f) => s + parseFloat(f.valor || 0), 0)

  const score = calculateScore({
    receita: summary.income,
    gasto: summary.expense,
    gastoFixo: fixedTotal,
    patrimonioAtual: 0,
    patrimonioAnterior: 0
  })
  const scoreLabel = getScoreLabel(score)
  const scoreColor = getScoreColor(score)

  const startEdit = (key) => {
    setEditing(key)
    setTempVal(settings[key] || '')
  }

  const saveEdit = () => {
    if (!editing) return
    updateSettings({ [editing]: tempVal })
    setEditing(null)
  }

  const initial = (settings.userName || 'U')[0].toUpperCase()

  return (
    <div className={styles.page}>
      <div className="page-header">
        <h1>Perfil</h1>
      </div>

      {/* Avatar */}
      <div className={styles.avatarSection}>
        <div className={styles.avatar}>{initial}</div>
        <p className={styles.userName}>{settings.userName}</p>
        <p className={styles.location}>Brasil</p>
      </div>

      {/* Score card */}
      <div className={styles.section}>
        <Card className={styles.scoreCard}>
          <p className={styles.scoreTitle}>Score de saúde financeira</p>
          <p className={styles.scoreBig} style={{ color: scoreColor }}>{score}</p>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${score}%`, background: scoreColor }} />
          </div>
          <p className={styles.scoreLabel} style={{ color: scoreColor }}>{scoreLabel}</p>
        </Card>
      </div>

      {/* Settings */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Configurações</p>
        <Card>
          <SettingRow
            label="Nome"
            value={settings.userName}
            editing={editing === 'userName'}
            tempVal={editing === 'userName' ? tempVal : ''}
            onEdit={() => startEdit('userName')}
            onSave={saveEdit}
            onChange={setTempVal}
          />
          <SettingRow
            label="URL da API"
            value={settings.apiUrl}
            editing={editing === 'apiUrl'}
            tempVal={editing === 'apiUrl' ? tempVal : ''}
            onEdit={() => startEdit('apiUrl')}
            onSave={saveEdit}
            onChange={setTempVal}
            truncate
          />
          <SettingRow
            label="Token"
            value={settings.apiToken}
            editing={editing === 'apiToken'}
            tempVal={editing === 'apiToken' ? tempVal : ''}
            onEdit={() => startEdit('apiToken')}
            onSave={saveEdit}
            onChange={setTempVal}
          />
          <div className={styles.settingRow} style={{ borderBottom: 'none' }}>
            <span className={styles.settingLabel}>Lembrete mensal</span>
            <button
              type="button"
              className={`${styles.switch} ${settings.monthlyReminder ? styles.switchOn : ''}`}
              onClick={() => updateSettings({ monthlyReminder: !settings.monthlyReminder })}
            />
          </div>
        </Card>
      </div>

      {/* Data section */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Dados</p>
        <Card>
          <button className={styles.actionRow} type="button" onClick={() => setExportOpen(true)} disabled={actionLoading !== null}>
            <span>Exportar PDF</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v8M3 7l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className={styles.actionRow} type="button" onClick={handleBackupDrive} disabled={actionLoading !== null}>
            <span>{actionLoading === 'backup' ? 'Fazendo backup…' : 'Backup no Drive'}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v8M3 7l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className={styles.actionRow} style={{ borderBottom: 'none' }} type="button" onClick={handleMigrateData} disabled={actionLoading !== null}>
            <span>{actionLoading === 'migrate' ? 'Migrando…' : 'Migrar dados antigos'}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 12V4M3 7l4-4 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </Card>
      </div>

      <ExportPDF open={exportOpen} onClose={() => setExportOpen(false)} />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: toast.ok ? '#1d9e75' : '#d85a30',
          color: '#fff', fontSize: 13, fontWeight: 500,
          padding: '10px 20px', borderRadius: 10, zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)', maxWidth: 'calc(100vw - 32px)',
          textAlign: 'center'
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

const SettingRow = ({ label, value, editing, tempVal, onEdit, onSave, onChange, truncate }) => (
  <div className={styles.settingRow}>
    <span className={styles.settingLabel}>{label}</span>
    {editing ? (
      <div className={styles.editRow}>
        <input
          className={styles.settingInput}
          value={tempVal}
          onChange={e => onChange(e.target.value)}
          autoFocus
          onKeyDown={e => e.key === 'Enter' && onSave()}
        />
        <button className={styles.saveBtn} onClick={onSave} type="button">OK</button>
      </div>
    ) : (
      <button className={styles.settingValue} onClick={onEdit} type="button">
        <span style={truncate ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 } : {}}>
          {value || '—'}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 1.5L1.5 9l-1 2.5 2.5-1L10.5 3l-1.5-1.5z" stroke="currentColor" strokeWidth="1"/></svg>
      </button>
    )}
  </div>
)

export default Profile
