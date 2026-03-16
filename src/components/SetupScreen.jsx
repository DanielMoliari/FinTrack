import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useFinanceStore from '../store/useFinanceStore'

const Field = ({ label, hint, value, onChange, placeholder, type = 'text' }) => (
  <div style={{ marginBottom: 16 }}>
    <p style={{ fontSize: 11, fontWeight: 600, color: '#888890', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
      {label}
    </p>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', boxSizing: 'border-box',
        background: '#0a0a14', border: '0.5px solid #1e1e30',
        borderRadius: 10, padding: '11px 14px',
        fontSize: 13, color: '#e0e0e8',
        outline: 'none',
      }}
    />
    {hint && <p style={{ fontSize: 11, color: '#3a3a52', marginTop: 5, lineHeight: 1.4 }}>{hint}</p>}
  </div>
)

const SetupScreen = () => {
  const { updateSettings, loadAll } = useFinanceStore()
  const navigate = useNavigate()

  const [name,    setName]    = useState('')
  const [apiUrl,  setApiUrl]  = useState('')
  const [token,   setToken]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleStart = async () => {
    if (!name.trim())   { setError('Informe seu nome para continuar.'); return }
    if (!apiUrl.trim()) { setError('Informe a URL da API (Google Apps Script).'); return }
    if (!token.trim())  { setError('Informe o token de acesso.'); return }

    setError('')
    setLoading(true)
    try {
      updateSettings({ userName: name.trim(), apiUrl: apiUrl.trim(), apiToken: token.trim() })
      await loadAll()
      navigate('/')
    } catch {
      setError('Não foi possível conectar à API. Verifique a URL e o token.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#08080f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
    }}>

      {/* Logo */}
      <div style={{
        width: 60, height: 60, borderRadius: 16,
        background: '#0f1a14',
        border: '1px solid #1d9e7533',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <polyline points="4,22 10,14 16,18 22,8 28,10" stroke="#1d9e75" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="26,10 28,10 28,12" stroke="#1d9e75" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <p style={{ fontSize: 26, fontWeight: 800, color: '#e0e0e8', letterSpacing: '-0.5px', marginBottom: 4 }}>
        FinTrack
      </p>
      <p style={{ fontSize: 13, color: '#3a3a52', marginBottom: 32 }}>
        Configure sua conta para começar
      </p>

      {/* Formulário */}
      <div style={{
        background: '#0f0f1a',
        border: '0.5px solid #1e1e30',
        borderRadius: 18,
        padding: '24px 20px',
        width: '100%',
        maxWidth: 360,
        marginBottom: 16,
      }}>

        <Field
          label="Seu nome"
          placeholder="Como quer ser chamado?"
          value={name}
          onChange={setName}
        />

        <Field
          label="URL da API"
          placeholder="https://script.google.com/macros/s/…"
          hint="Cole a URL gerada ao implantar o Code.gs no Google Apps Script."
          value={apiUrl}
          onChange={setApiUrl}
        />

        <Field
          label="Token de acesso"
          placeholder="Mesmo valor de API_TOKEN no Code.gs"
          hint="Defina um token secreto no Code.gs e cole o mesmo aqui."
          value={token}
          onChange={setToken}
          type="password"
        />

        {error && (
          <p style={{ fontSize: 12, color: '#d85a30', marginBottom: 12, lineHeight: 1.4 }}>{error}</p>
        )}

        <button
          type="button"
          onClick={handleStart}
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? '#1d9e7580' : '#1d9e75',
            color: '#fff',
            fontSize: 14, fontWeight: 700,
            padding: '13px 0',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.15s',
          }}
        >
          {loading ? 'Conectando…' : (
            <>
              Começar
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </button>
      </div>

      <p style={{ fontSize: 11, color: '#2a2a40', textAlign: 'center', maxWidth: 300, lineHeight: 1.5 }}>
        Seus dados ficam na sua própria planilha do Google. O FinTrack não armazena nada em servidores externos.
      </p>
    </div>
  )
}

export default SetupScreen
