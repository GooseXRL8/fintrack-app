'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [tokenError, setTokenError] = useState(false)

  useEffect(() => {
    // O Supabase detecta o token via hash (#access_token=...) automaticamente
    // O onAuthStateChange captura o evento PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionReady(true)
      } else if (event === 'SIGNED_IN' && session) {
        // Caso o token já tenha sido processado
        setSessionReady(true)
      }
    })

    // Verifica se já tem sessão ativa (token já processado)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })

    // Timeout: se após 3s não houver sessão, o link é inválido
    const timeout = setTimeout(() => {
      setSessionReady(prev => {
        if (!prev) setTokenError(true)
        return prev
      })
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleReset() {
    setError('')
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError('Erro ao atualizar senha. Tente novamente.')
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/'), 2500)
    }
  }

  return (
    <div className="flex justify-center items-start min-h-screen py-8" style={{ background: '#e5e7eb' }}>
      <div className="phone-shell">
        <div
          className="flex flex-col h-full"
          style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e3a5f 50%,#064e3b 100%)' }}
        >
          {/* Header */}
          <div style={{ padding: '60px 32px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              width: 56, height: 56, background: '#10b981', borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
              </svg>
            </div>
            <div className="font-sora" style={{ fontSize: 32, fontWeight: 700, color: 'white', lineHeight: 1.1, marginBottom: 8 }}>
              Nova<br/>Senha
            </div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)' }}>
              Crie uma senha segura para sua conta.
            </div>
          </div>

          {/* Card */}
          <div style={{ background: 'white', borderRadius: '28px 28px 0 0', padding: '32px 28px 40px' }}>

            {/* Token inválido */}
            {tokenError && (
              <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                <div style={{
                  width: 64, height: 64, background: '#fef2f2', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div className="font-sora" style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Link inválido</div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 28 }}>
                  Este link expirou ou já foi usado.<br/>Solicite um novo link de redefinição.
                </div>
                <button
                  onClick={() => router.push('/')}
                  style={{
                    width: '100%', height: 54, background: 'linear-gradient(135deg,#10b981,#059669)',
                    border: 'none', borderRadius: 16, color: 'white', fontSize: 16, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Voltar ao login
                </button>
              </div>
            )}

            {/* Carregando token */}
            {!tokenError && !sessionReady && !success && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{
                  width: 48, height: 48, border: '3px solid #e5e7eb',
                  borderTopColor: '#10b981', borderRadius: '50%',
                  margin: '0 auto 16px', animation: 'spin 0.8s linear infinite',
                }}/>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ fontSize: 14, color: '#6b7280' }}>Validando link...</div>
              </div>
            )}

            {/* Sucesso */}
            {success && (
              <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                <div style={{
                  width: 64, height: 64, background: '#f0fdf4', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <div className="font-sora" style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 10 }}>Senha alterada!</div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                  Sua senha foi atualizada com sucesso.<br/>Redirecionando para o login...
                </div>
              </div>
            )}

            {/* Formulário */}
            {sessionReady && !success && !tokenError && (
              <>
                <div className="font-sora" style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                  Redefinir senha
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 28, lineHeight: 1.5 }}>
                  Digite sua nova senha abaixo.
                </div>

                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Nova senha
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  style={{
                    width: '100%', height: 52, borderRadius: 14,
                    border: '1.5px solid #e5e7eb', padding: '0 16px',
                    fontSize: 15, color: '#1f2937', background: '#f9fafb',
                    marginBottom: 20, outline: 'none',
                  }}
                />

                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Confirmar nova senha
                </div>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
                  style={{
                    width: '100%', height: 52, borderRadius: 14,
                    border: '1.5px solid #e5e7eb', padding: '0 16px',
                    fontSize: 15, color: '#1f2937', background: '#f9fafb',
                    marginBottom: 24, outline: 'none',
                  }}
                />

                {error && (
                  <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
                    {error}
                  </div>
                )}

                <button
                  onClick={handleReset}
                  disabled={loading || !password || !confirm}
                  style={{
                    width: '100%', height: 54,
                    background: 'linear-gradient(135deg,#10b981,#059669)',
                    border: 'none', borderRadius: 16, color: 'white',
                    fontSize: 16, fontWeight: 600, cursor: 'pointer',
                    opacity: (!password || !confirm || loading) ? 0.5 : 1,
                  }}
                >
                  {loading ? 'Salvando...' : 'Salvar nova senha'}
                </button>

                <button
                  onClick={() => router.push('/')}
                  style={{
                    width: '100%', height: 44, border: 'none', background: 'none',
                    color: '#6b7280', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 8,
                  }}
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
