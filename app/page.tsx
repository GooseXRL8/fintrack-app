'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, Transaction, Category, SavingsGoal } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

type Screen = 'login' | 'dashboard' | 'expenses' | 'budget' | 'profile'
type ActiveMonth = string // "2025-04"

function fmt(n: number) {
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtShort(n: number) {
  if (n >= 1000) return 'R$' + (n / 1000).toFixed(1).replace('.', ',') + 'k'
  return 'R$' + n.toLocaleString('pt-BR', { minimumFractionDigits: 0 })
}

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

// ---- Swipeable Transaction Row ----
function SwipeableTransactionRow({
  t,
  onDelete,
  onRename,
}: {
  t: Transaction
  onDelete: (id: string) => void
  onRename: (id: string, currentTitle: string) => void
}) {
  const SWIPE_THRESHOLD = 80
  const startXRef = useRef<number | null>(null)
  const currentXRef = useRef(0)
  const [offset, setOffset] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const handlePointerDown = (e: React.PointerEvent) => {
    startXRef.current = e.clientX
    currentXRef.current = offset
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startXRef.current === null) return
    const delta = e.clientX - startXRef.current
    const base = revealed ? -SWIPE_THRESHOLD : 0
    const newOffset = Math.min(0, Math.max(-SWIPE_THRESHOLD * 1.1, base + delta))
    setOffset(newOffset)
  }

  const handlePointerUp = () => {
    if (startXRef.current === null) return
    startXRef.current = null
    if (offset < -SWIPE_THRESHOLD / 2) {
      setOffset(-SWIPE_THRESHOLD)
      setRevealed(true)
    } else {
      setOffset(0)
      setRevealed(false)
    }
  }

  const close = () => { setOffset(0); setRevealed(false) }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid #f9fafb' }}>
      {/* Action buttons behind */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        display: 'flex', alignItems: 'stretch', width: SWIPE_THRESHOLD,
      }}>
        <button
          onClick={() => { close(); onRename(t.id, t.title) }}
          style={{
            flex: 1, border: 'none', background: '#6b7280',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="Renomear"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          onClick={() => { close(); onDelete(t.id) }}
          style={{
            flex: 1, border: 'none', background: '#ef4444',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="Apagar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </button>
      </div>

      {/* Swipeable row */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          transform: `translateX(${offset}px)`,
          transition: startXRef.current === null ? 'transform 0.25s ease' : 'none',
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 24px', background: 'white', touchAction: 'pan-y',
          userSelect: 'none', cursor: 'grab',
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: t.type === 'income' ? '#f0fdf4' : '#fef9c3',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0, pointerEvents: 'none',
        }}>
          {t.categories?.emoji || (t.type === 'income' ? '💰' : '💸')}
        </div>
        <div style={{ flex: 1, minWidth: 0, pointerEvents: 'none' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
            {t.categories?.name || (t.type === 'income' ? 'Receita' : 'Outro')} • {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </div>
        </div>
        <div className="font-sora" style={{ fontSize: 15, fontWeight: 700, color: t.type === 'income' ? '#22c55e' : '#ef4444', flexShrink: 0, pointerEvents: 'none' }}>
          {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(false)
  const [authMode, setAuthMode] = useState<'login'|'signup'>('login')
  const [email, setEmail] = useState('demo@fintrack.app')
  const [password, setPassword] = useState('fintrack123')
  const [fullName, setFullName] = useState('')
  const [authError, setAuthError] = useState('')
  const [toast, setToast] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'expense'|'income'|'goal'|'salary'|'rename'>('expense')
  const [activeMonth, setActiveMonth] = useState<ActiveMonth>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  })
  const [addTitle, setAddTitle] = useState('')
  const [addAmount, setAddAmount] = useState('')
  const [addCategory, setAddCategory] = useState('')
  const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0])
  const [salaryInput, setSalaryInput] = useState('')
  const [extraInput, setExtraInput] = useState('')
  // rename state
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const loadData = useCallback(async (uid: string) => {
    const [profRes, txRes, catRes, goalRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('transactions').select('*, categories(name,emoji,color)').eq('user_id', uid).order('date', { ascending: false }).limit(100),
      supabase.from('categories').select('*').or(`user_id.eq.${uid},is_default.eq.true`).order('name'),
      supabase.from('savings_goals').select('*').eq('user_id', uid).order('created_at'),
    ])
    if (profRes.data) setProfile(profRes.data)
    if (txRes.data) setTransactions(txRes.data)
    if (catRes.data) setCategories(catRes.data)
    if (goalRes.data) setGoals(goalRes.data)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadData(session.user.id)
        setScreen('dashboard')
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadData(session.user.id)
        setScreen('dashboard')
      }
    })
    return () => subscription.unsubscribe()
  }, [loadData])

  const monthTxns = transactions.filter(t => t.date.startsWith(activeMonth))
  const monthIncome = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = monthIncome - monthExpense

  const catSpend: Record<string, number> = {}
  monthTxns.filter(t => t.type === 'expense').forEach(t => {
    if (t.category_id) catSpend[t.category_id] = (catSpend[t.category_id] || 0) + t.amount
  })
  const maxSpend = Math.max(...Object.values(catSpend), 1)

  async function handleAuth() {
    setAuthError(''); setLoading(true)
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          if (error.message.includes('Invalid login')) setAuthError('E-mail ou senha incorretos.')
          else setAuthError(error.message)
        }
      } else {
        if (!fullName.trim()) { setAuthError('Digite seu nome completo.'); setLoading(false); return }
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
        if (error) setAuthError(error.message)
        else showToast('Conta criada! Verifique seu e-mail.')
      }
    } finally { setLoading(false) }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setScreen('login'); setProfile(null); setTransactions([]); setCategories([]); setGoals([])
  }

  async function handleAddTransaction() {
    if (!user || !addTitle || !addAmount) return
    setLoading(true)
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id, title: addTitle, amount: parseFloat(addAmount),
      type: modalType === 'expense' ? 'expense' : 'income',
      category_id: addCategory || null, date: addDate,
    })
    if (!error) {
      await loadData(user.id)
      setShowModal(false); setAddTitle(''); setAddAmount(''); setAddCategory('')
      showToast(`✓ ${modalType === 'expense' ? 'Gasto' : 'Receita'} registrado!`)
    }
    setLoading(false)
  }

  async function handleAddGoal() {
    if (!user || !addTitle || !addAmount) return
    setLoading(true)
    const { error } = await supabase.from('savings_goals').insert({
      user_id: user.id, name: addTitle, emoji: '🎯',
      target_amount: parseFloat(addAmount), current_amount: 0,
    })
    if (!error) { await loadData(user.id); setShowModal(false); setAddTitle(''); setAddAmount(''); showToast('✓ Meta criada!') }
    setLoading(false)
  }

  async function handleUpdateSalary() {
    if (!user) return; setLoading(true)
    const { error } = await supabase.from('profiles').update({
      salary: parseFloat(salaryInput) || 0,
      extra_income: parseFloat(extraInput) || 0,
      updated_at: new Date().toISOString()
    }).eq('id', user.id)
    if (!error) { await loadData(user.id); setShowModal(false); showToast('✓ Salário atualizado!') }
    setLoading(false)
  }

  async function handleDeleteTransaction(id: string) {
    if (!user) return
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id))
      showToast('🗑 Transação removida!')
    }
  }

  function handleOpenRename(id: string, currentTitle: string) {
    setRenameId(id)
    setRenameValue(currentTitle)
    setModalType('rename')
    setShowModal(true)
  }

  async function handleRenameTransaction() {
    if (!user || !renameId || !renameValue.trim()) return
    setLoading(true)
    const { error } = await supabase.from('transactions').update({ title: renameValue.trim() }).eq('id', renameId)
    if (!error) {
      await loadData(user.id)
      setShowModal(false); setRenameId(null); setRenameValue('')
      showToast('✏️ Descrição atualizada!')
    }
    setLoading(false)
  }

  const openModal = (type: typeof modalType) => {
    setModalType(type); setShowModal(true)
    setAddTitle(''); setAddAmount(''); setAddCategory('')
    setAddDate(new Date().toISOString().split('T')[0])
    if (type === 'salary') { setSalaryInput(String(profile?.salary || '')); setExtraInput(String(profile?.extra_income || '')) }
  }

  const txnGroups: Record<string, Transaction[]> = {}
  monthTxns.forEach(t => {
    if (!txnGroups[t.date]) txnGroups[t.date] = []
    txnGroups[t.date].push(t)
  })

  const catIncome = categories.filter(c => ['Salário','Freelance'].includes(c.name))
  const catExpense = categories.filter(c => !['Salário','Freelance'].includes(c.name))

  return (
    <div className="flex justify-center items-start min-h-screen py-8">
      <div className="phone-shell">

        {/* ===== LOGIN ===== */}
        {screen === 'login' && (
          <div className="flex flex-col h-full" style={{background:'linear-gradient(160deg,#0f172a 0%,#1e3a5f 50%,#064e3b 100%)'}}>
            <div style={{padding:'60px 32px 0',flex:1,display:'flex',flexDirection:'column'}}>
              <div style={{width:56,height:56,background:'#10b981',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:32}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
              </div>
              <div className="font-sora" style={{fontSize:32,fontWeight:700,color:'white',lineHeight:1.1,marginBottom:8}}>Controle<br/>Financeiro</div>
              <div style={{fontSize:15,color:'rgba(255,255,255,0.55)',marginBottom:48}}>Sua vida financeira, organizada.</div>
            </div>
            <div style={{background:'white',borderRadius:'28px 28px 0 0',padding:'32px 28px 40px'}}>
              <div style={{display:'flex',marginBottom:28,background:'#f3f4f6',borderRadius:12,padding:4}}>
                {(['login','signup'] as const).map(m => (
                  <button key={m} onClick={() => { setAuthMode(m); setAuthError('') }}
                    style={{flex:1,height:38,border:'none',borderRadius:9,fontSize:14,fontWeight:authMode===m?600:500,
                      color:authMode===m?'#111827':'#6b7280',
                      background:authMode===m?'white':'transparent',cursor:'pointer',
                      boxShadow:authMode===m?'0 2px 8px rgba(0,0,0,0.1)':'none'}}>
                    {m === 'login' ? 'Entrar' : 'Cadastrar'}
                  </button>
                ))}
              </div>
              {authMode === 'signup' && (
                <>
                  <div style={{fontSize:12,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Nome completo</div>
                  <input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Carlos Mendes"
                    style={{width:'100%',height:52,borderRadius:14,border:'1.5px solid #e5e7eb',padding:'0 16px',fontSize:15,color:'#1f2937',background:'#f9fafb',marginBottom:20,outline:'none'}}/>
                </>
              )}
              <div style={{fontSize:12,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>E-mail</div>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"
                style={{width:'100%',height:52,borderRadius:14,border:'1.5px solid #e5e7eb',padding:'0 16px',fontSize:15,color:'#1f2937',background:'#f9fafb',marginBottom:20,outline:'none'}}/>
              <div style={{fontSize:12,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Senha</div>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
                style={{width:'100%',height:52,borderRadius:14,border:'1.5px solid #e5e7eb',padding:'0 16px',fontSize:15,color:'#1f2937',background:'#f9fafb',marginBottom:20,outline:'none'}}/>
              {authError && <div style={{color:'#ef4444',fontSize:13,marginBottom:12,textAlign:'center'}}>{authError}</div>}
              <button onClick={handleAuth} disabled={loading}
                style={{width:'100%',height:54,background:'linear-gradient(135deg,#10b981,#059669)',border:'none',borderRadius:16,color:'white',fontSize:16,fontWeight:600,cursor:'pointer',opacity:loading?0.7:1}}>
                {loading ? 'Aguarde...' : authMode === 'login' ? 'Entrar na conta' : 'Criar conta grátis'}
              </button>
              {authMode === 'login' && (
                <div style={{textAlign:'center',marginTop:16,fontSize:13,color:'#9ca3af'}}>
                  Demo: <span style={{color:'#10b981',fontWeight:600,cursor:'pointer'}} onClick={()=>{setEmail('demo@fintrack.app');setPassword('fintrack123')}}>usar dados de exemplo →</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== MAIN APP ===== */}
        {screen !== 'login' && (
          <>
            {/* DASHBOARD */}
            {screen === 'dashboard' && (
              <div className="flex flex-col h-full">
                <div style={{background:'linear-gradient(160deg,#0f172a,#1e3a5f 60%,#065f46)',padding:'54px 24px 28px',flexShrink:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
                    <div>
                      <div style={{fontSize:13,color:'rgba(255,255,255,0.6)',marginBottom:2}}>Bom dia, 👋</div>
                      <div className="font-sora" style={{fontSize:20,fontWeight:700,color:'white'}}>{profile?.full_name || 'Usuário'}</div>
                    </div>
                    <div onClick={() => setScreen('profile')} style={{width:44,height:44,borderRadius:'50%',background:'#10b981',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Sora,sans-serif',fontSize:16,fontWeight:700,color:'white',border:'2px solid rgba(255,255,255,0.3)',cursor:'pointer'}}>
                      {(profile?.full_name || 'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                  </div>
                  <div style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:20,padding:20}}>
                    <div style={{fontSize:12,color:'rgba(255,255,255,0.6)',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>Saldo do mês</div>
                    <div className="font-sora" style={{fontSize:34,fontWeight:700,color:'white',marginBottom:16}}>{fmt(balance)}</div>
                    <div style={{display:'flex',gap:12}}>
                      <div style={{flex:1}}><div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginBottom:2}}>↑ Receitas</div><div className="font-sora" style={{fontSize:15,fontWeight:600,color:'#86efac'}}>{fmtShort(monthIncome)}</div></div>
                      <div style={{flex:1}}><div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginBottom:2}}>↓ Despesas</div><div className="font-sora" style={{fontSize:15,fontWeight:600,color:'#fca5a5'}}>{fmtShort(monthExpense)}</div></div>
                      <div style={{flex:1}}><div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginBottom:2}}>Economias</div><div className="font-sora" style={{fontSize:15,fontWeight:600,color:'#93c5fd'}}>{fmtShort((profile?.salary||0)+(profile?.extra_income||0))}</div></div>
                    </div>
                    {monthIncome > 0 && (
                      <div style={{height:4,background:'rgba(255,255,255,0.1)',borderRadius:4,marginTop:12,overflow:'hidden'}}>
                        <div style={{height:'100%',borderRadius:4,background:'#10b981',width:`${Math.min(100,(monthExpense/monthIncome)*100)}%`}}/>
                      </div>
                    )}
                  </div>
                </div>
                <div className="scroll-content">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 24px 8px'}}>
                    <div className="font-sora" style={{fontSize:16,fontWeight:700,color:'#1f2937'}}>Ações rápidas</div>
                  </div>
                  <div style={{display:'flex',gap:12,padding:'0 24px 4px'}}>
                    {[
                      {label:'Add gasto',bg:'#f0fdf4',stroke:'#22c55e',icon:'M12 8v8M8 12h8',action:()=>openModal('expense'),circle:true},
                      {label:'Add receita',bg:'#eff6ff',stroke:'#3b82f6',icon:'M12 8v8M8 12h8',action:()=>openModal('income'),circle:true},
                      {label:'Ver mês',bg:'#fffbeb',stroke:'#f59e0b',icon:'M3 4h18v4H3zM3 10h18v4H3zM3 17h18v4H3z',action:()=>setScreen('expenses'),circle:false},
                      {label:'Perfil',bg:'#fdf4ff',stroke:'#a855f7',icon:'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',action:()=>setScreen('profile'),circle:false},
                    ].map((qa,i) => (
                      <div key={i} onClick={qa.action} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:8,cursor:'pointer'}}>
                        <div style={{width:52,height:52,borderRadius:16,background:qa.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={qa.stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            {qa.circle && <circle cx="12" cy="12" r="10"/>}
                            <path d={qa.icon}/>
                          </svg>
                        </div>
                        <div style={{fontSize:11,fontWeight:600,color:'#4b5563',textAlign:'center'}}>{qa.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{padding:'16px 24px 4px'}}>
                    <div style={{background:'linear-gradient(135deg,#f0fdf4,#e0f2fe)',border:'1.5px solid #bbf7d0',borderRadius:20,padding:18}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#059669',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6,display:'flex',alignItems:'center',gap:6}}>
                        <span className="ai-dot" style={{width:7,height:7,borderRadius:'50%',background:'#10b981',display:'inline-block'}}/>IA Financeira
                      </div>
                      <div style={{fontSize:14,color:'#374151',lineHeight:1.5}}>
                        {monthExpense > monthIncome*0.7
                          ? <>Atenção! Você já gastou <strong>{Math.round((monthExpense/Math.max(monthIncome,1))*100)}%</strong> da sua renda este mês. Considere revisar seus orçamentos.</>
                          : <>Ótimo controle! Você está gastando <strong>{Math.round((monthExpense/Math.max(monthIncome,1))*100)}%</strong> da sua renda. Continue assim!</>}
                      </div>
                      <div style={{marginTop:12,display:'flex',gap:8}}>
                        <button onClick={()=>setScreen('budget')} style={{padding:'8px 16px',borderRadius:20,border:'none',background:'#10b981',color:'white',fontSize:12,fontWeight:700,cursor:'pointer'}}>Ver orçamentos</button>
                        <button onClick={()=>setScreen('expenses')} style={{padding:'8px 16px',borderRadius:20,border:'1.5px solid #e5e7eb',background:'white',color:'#4b5563',fontSize:12,fontWeight:600,cursor:'pointer'}}>Ver gastos</button>
                      </div>
                    </div>
                  </div>

                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 24px 12px'}}>
                    <div className="font-sora" style={{fontSize:16,fontWeight:700,color:'#1f2937'}}>Últimas transações</div>
                    <div onClick={()=>setScreen('expenses')} style={{fontSize:13,fontWeight:600,color:'#10b981',cursor:'pointer'}}>Ver todas</div>
                  </div>
                  {transactions.slice(0,6).map(t => (
                    <div key={t.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 24px',borderBottom:'1px solid #f9fafb'}}>
                      <div style={{width:44,height:44,borderRadius:14,background:t.type==='income'?'#f0fdf4':'#fef9c3',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                        {t.categories?.emoji || (t.type==='income'?'💰':'💸')}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:600,color:'#1f2937',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                        <div style={{fontSize:12,color:'#9ca3af',marginTop:2}}>{t.categories?.name || (t.type==='income'?'Receita':'Outro')} • {new Date(t.date+'T00:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</div>
                      </div>
                      <div className="font-sora" style={{fontSize:15,fontWeight:700,color:t.type==='income'?'#22c55e':'#ef4444',flexShrink:0}}>
                        {t.type==='income'?'+':'-'}{fmt(t.amount)}
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div style={{textAlign:'center',padding:'32px 24px',color:'#9ca3af',fontSize:14}}>
                      Nenhuma transação ainda.<br/>
                      <span style={{color:'#10b981',cursor:'pointer',fontWeight:600}} onClick={()=>openModal('expense')}>Adicionar primeiro gasto →</span>
                    </div>
                  )}
                  <div style={{height:8}}/>
                </div>
                <BottomNav screen={screen} setScreen={setScreen}/>
              </div>
            )}

            {/* EXPENSES */}
            {screen === 'expenses' && (
              <div className="flex flex-col h-full">
                <div style={{background:'white',padding:'60px 24px 20px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
                  <div className="font-sora" style={{fontSize:22,fontWeight:700,color:'#111827',marginBottom:16}}>Gastos mensais</div>
                  <div style={{display:'flex',gap:8,overflowX:'auto',scrollbarWidth:'none',paddingBottom:4}}>
                    {MONTHS.map((m,i) => {
                      const now = new Date()
                      const my = `${now.getFullYear()}-${String(i+1).padStart(2,'0')}`
                      const isFuture = i > now.getMonth()
                      return (
                        <button key={m} onClick={()=>!isFuture&&setActiveMonth(my)}
                          style={{padding:'8px 16px',borderRadius:20,fontSize:13,fontWeight:600,whiteSpace:'nowrap',cursor:isFuture?'default':'pointer',border:'1.5px solid',
                            borderColor:activeMonth===my?'#111827':'#e5e7eb',
                            background:activeMonth===my?'#111827':'white',
                            color:activeMonth===my?'white':isFuture?'#d1d5db':'#6b7280',opacity:isFuture?0.4:1}}>
                          {m}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="scroll-content">
                  {/* Summary */}
                  <div style={{padding:'16px 24px'}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                      {[{label:'Receitas',val:monthIncome,color:'#16a34a',bg:'#f0fdf4'},{label:'Gastos',val:monthExpense,color:'#dc2626',bg:'#fef2f2'},{label:'Sobra',val:balance,color:balance>=0?'#1d4ed8':'#dc2626',bg:'#eff6ff'}].map(s=>(
                        <div key={s.label} style={{background:s.bg,borderRadius:14,padding:14,textAlign:'center'}}>
                          <div style={{fontSize:11,color:s.color,fontWeight:600,marginBottom:4}}>{s.label}</div>
                          <div className="font-sora" style={{fontSize:14,fontWeight:700,color:s.color}}>{fmtShort(s.val)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Bar chart */}
                  {Object.keys(catSpend).length > 0 && (
                    <>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 24px 12px'}}>
                        <div className="font-sora" style={{fontSize:16,fontWeight:700,color:'#1f2937'}}>Por categoria</div>
                      </div>
                      <div style={{padding:'0 24px 8px'}}>
                        {Object.entries(catSpend).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([catId, amount]) => {
                          const cat = categories.find(c=>c.id===catId)
                          return (
                            <div key={catId} style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                              <div style={{fontSize:12,color:'#6b7280',fontWeight:500,width:72,textAlign:'right',flexShrink:0}}>{cat?.emoji} {cat?.name?.slice(0,7)}</div>
                              <div style={{flex:1,height:28,background:'#f3f4f6',borderRadius:8,overflow:'hidden'}}>
                                <div style={{height:'100%',borderRadius:8,background:cat?.color||'#10b981',width:`${(amount/maxSpend)*100}%`,display:'flex',alignItems:'center',paddingLeft:10,minWidth:60}}>
                                  <span style={{fontSize:11,fontWeight:700,color:'white'}}>{fmtShort(amount)}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                  {/* Add buttons */}
                  <div style={{display:'flex',gap:10,padding:'8px 24px 8px'}}>
                    <button onClick={()=>openModal('expense')} style={{flex:1,height:44,borderRadius:14,border:'1.5px solid #e5e7eb',background:'white',color:'#374151',fontSize:14,fontWeight:600,cursor:'pointer'}}>+ Gasto</button>
                    <button onClick={()=>openModal('income')} style={{flex:1,height:44,borderRadius:14,border:'1.5px solid #10b981',background:'#f0fdf4',color:'#059669',fontSize:14,fontWeight:600,cursor:'pointer'}}>+ Receita</button>
                  </div>

                  {/* Swipe hint */}
                  {monthTxns.length > 0 && (
                    <div style={{padding:'4px 24px 8px',display:'flex',alignItems:'center',gap:6}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                      <span style={{fontSize:11,color:'#9ca3af'}}>Arraste para revelar ações</span>
                    </div>
                  )}

                  {/* Grouped swipeable transactions */}
                  {Object.keys(txnGroups).sort((a,b)=>b.localeCompare(a)).map(date => (
                    <div key={date}>
                      <div style={{padding:'12px 24px 6px',fontSize:13,fontWeight:600,color:'#6b7280',background:'#f9fafb'}}>
                        {new Date(date+'T00:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})}
                      </div>
                      {txnGroups[date].map(t => (
                        <SwipeableTransactionRow
                          key={t.id}
                          t={t}
                          onDelete={handleDeleteTransaction}
                          onRename={handleOpenRename}
                        />
                      ))}
                    </div>
                  ))}
                  {monthTxns.length === 0 && (
                    <div style={{textAlign:'center',padding:'48px 24px',color:'#9ca3af',fontSize:14}}>Nenhuma transação neste mês.</div>
                  )}
                  <div style={{height:8}}/>
                </div>
                <BottomNav screen={screen} setScreen={setScreen}/>
              </div>
            )}

            {/* BUDGET */}
            {screen === 'budget' && (
              <div className="flex flex-col h-full">
                <div style={{background:'white',padding:'60px 24px 20px',borderBottom:'1px solid #f3f4f6',flexShrink:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <div className="font-sora" style={{fontSize:22,fontWeight:700,color:'#111827'}}>Orçamentos</div>
                    <div style={{fontSize:13,color:'#9ca3af'}}>{MONTHS[new Date().getMonth()]} {new Date().getFullYear()}</div>
                  </div>
                  <div style={{background:'#f0fdf4',borderRadius:14,padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontSize:12,color:'#16a34a',fontWeight:600,marginBottom:2}}>{monthExpense <= monthIncome ? 'Dentro do orçamento ✓' : 'Acima do orçamento ⚠'}</div>
                      <div style={{fontSize:13,color:'#4b5563'}}>Sobra: {fmt(balance)}</div>
                    </div>
                    <div style={{fontSize:28}}>{monthExpense <= monthIncome ? '🎯' : '⚠️'}</div>
                  </div>
                </div>
                <div className="scroll-content">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 24px 12px'}}>
                    <div className="font-sora" style={{fontSize:16,fontWeight:700,color:'#1f2937'}}>Metas de economia</div>
                    <div onClick={()=>openModal('goal')} style={{fontSize:13,fontWeight:600,color:'#10b981',cursor:'pointer'}}>+ Nova</div>
                  </div>
                  {goals.length === 0 && (
                    <div style={{margin:'0 24px 16px',background:'white',border:'1.5px solid #e5e7eb',borderRadius:20,padding:20,textAlign:'center',color:'#9ca3af',fontSize:14}}>
                      <div style={{fontSize:32,marginBottom:8}}>🎯</div>
                      Nenhuma meta ainda. <span style={{color:'#10b981',cursor:'pointer',fontWeight:600}} onClick={()=>openModal('goal')}>Criar meta →</span>
                    </div>
                  )}
                  {goals.map(g => {
                    const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
                    return (
                      <div key={g.id} style={{margin:'0 24px 14px',background:'white',border:'1.5px solid #e5e7eb',borderRadius:20,padding:18}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                          <div>
                            <div style={{fontSize:15,fontWeight:700,color:'#1f2937'}}>{g.emoji} {g.name}</div>
                            <div style={{fontSize:12,color:'#9ca3af',marginTop:2}}>{fmt(g.current_amount)} / {fmt(g.target_amount)}</div>
                          </div>
                          <div className="font-sora" style={{fontSize:18,fontWeight:700,color:'#10b981'}}>{pct}%</div>
                        </div>
                        <div style={{height:10,background:'#f3f4f6',borderRadius:5,overflow:'hidden',marginBottom:8}}>
                          <div style={{height:'100%',borderRadius:5,background:'linear-gradient(90deg,#10b981,#6ee7b7)',width:`${pct}%`}}/>
                        </div>
                        <div style={{display:'justify-content'}}>
                          <div style={{fontSize:12,color:'#9ca3af'}}>Faltam {fmt(g.target_amount - g.current_amount)}</div>
                          {g.deadline && <div style={{fontSize:12,color:'#9ca3af'}}>{new Date(g.deadline+'T00:00:00').toLocaleDateString('pt-BR',{month:'short',year:'numeric'})}</div>}
                        </div>
                      </div>
                    )
                  })}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 24px 12px'}}>
                    <div className="font-sora" style={{fontSize:16,fontWeight:700,color:'#1f2937'}}>Gastos por categoria</div>
                  </div>
                  {catExpense.map(cat => {
                    const spent = catSpend[cat.id] || 0
                    const limit = cat.budget_limit || 0
                    const pct = limit > 0 ? Math.min(100, (spent/limit)*100) : 0
                    const over = limit > 0 && spent > limit
                    return (
                      <div key={cat.id} style={{margin:'0 24px 14px',background:'white',border:'1.5px solid #e5e7eb',borderRadius:20,padding:20}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <span style={{fontSize:20}}>{cat.emoji}</span>
                            <div>
                              <div style={{fontSize:14,fontWeight:600,color:'#1f2937'}}>{cat.name}</div>
                              <div style={{fontSize:12,color:'#9ca3af'}}>{fmt(spent)}{limit>0?` de ${fmt(limit)}`:''}</div>
                            </div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div className="font-sora" style={{fontSize:16,fontWeight:700,color:over?'#ef4444':'#1f2937'}}>{fmt(spent)}</div>
                            {limit > 0 && <div style={{fontSize:12,color:'#9ca3af'}}>limite {fmt(limit)}</div>}
                          </div>
                        </div>
                        {limit > 0 && (
                          <>
                            <div style={{height:8,background:'#f3f4f6',borderRadius:4,overflow:'hidden'}}>
                              <div style={{height:'100%',borderRadius:4,background:over?'#ef4444':cat.color,width:`${pct}%`}}/>
                            </div>
                            {over && <div style={{fontSize:11,color:'#ef4444',fontWeight:600,marginTop:8}}>⚠ Limite ultrapassado em {fmt(spent-limit)}</div>}
                          </>
                        )}
                        {limit === 0 && spent === 0 && <div style={{fontSize:12,color:'#d1d5db'}}>Sem gastos este mês</div>}
                      </div>
                    )
                  })}
                  <div style={{height:8}}/>
                </div>
                <BottomNav screen={screen} setScreen={setScreen}/>
              </div>
            )}

            {/* PROFILE */}
            {screen === 'profile' && (
              <div className="flex flex-col h-full">
                <div style={{background:'linear-gradient(160deg,#0f172a,#1e3a5f 60%,#065f46)',padding:'54px 24px 32px',flexShrink:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24}}>
                    <div style={{width:72,height:72,borderRadius:'50%',background:'#10b981',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Sora,sans-serif',fontSize:28,fontWeight:700,color:'white',border:'3px solid rgba(255,255,255,0.25)'}}>
                      {(profile?.full_name || 'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{color:'white'}}>
                      <div className="font-sora" style={{fontSize:22,fontWeight:700,marginBottom:2}}>{profile?.full_name || 'Usuário'}</div>
                      <div style={{fontSize:13,color:'rgba(255,255,255,0.6)'}}>{user?.email}</div>
                      <div style={{marginTop:6}}><span style={{background:'#bbf7d0',color:'#16a34a',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700}}>✓ Conta ativa</span></div>
                    </div>
                  </div>
                  <div style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:20,padding:20}}>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.55)',marginBottom:12,fontWeight:600,letterSpacing:'0.05em',textTransform:'uppercase'}}>Resumo financeiro</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
                      {[{label:'Salário base',val:profile?.salary||0},{label:'Renda extra',val:profile?.extra_income||0},{label:'Total/mês',val:(profile?.salary||0)+(profile?.extra_income||0)}].map(s=>(
                        <div key={s.label}>
                          <div style={{fontSize:11,color:'rgba(255,255,255,0.55)',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>{s.label}</div>
                          <div className="font-sora" style={{fontSize:15,fontWeight:700,color:'white'}}>{fmtShort(s.val)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="scroll-content">
                  <div style={{padding:'20px 24px 0'}}>
                    {[
                      {icon:'💰',bg:'#f0fdf4',label:'Configurar salário e renda',action:()=>openModal('salary')},
                      {icon:'🎯',bg:'#eff6ff',label:'Metas financeiras',action:()=>setScreen('budget')},
                      {icon:'📊',bg:'#fffbeb',label:'Extrato completo',action:()=>setScreen('expenses')},
                    ].map(item => (
                      <div key={item.label} onClick={item.action} style={{display:'flex',alignItems:'center',gap:14,padding:'16px 0',borderBottom:'1px solid #f3f4f6',cursor:'pointer'}}>
                        <div style={{width:40,height:40,borderRadius:12,background:item.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{item.icon}</div>
                        <div style={{fontSize:15,fontWeight:500,color:'#1f2937',flex:1}}>{item.label}</div>
                        <div style={{color:'#d1d5db',fontSize:18}}>›</div>
                      </div>
                    ))}
                  </div>
                  <div style={{padding:'20px 24px 0'}}>
                    <div className="font-sora" style={{fontSize:16,fontWeight:700,color:'#1f2937',marginBottom:12}}>Histórico mensal</div>
                    <div style={{background:'white',border:'1.5px solid #e5e7eb',borderRadius:20,padding:16}}>
                      <table style={{width:'100%',fontSize:13,borderCollapse:'collapse'}}>
                        <thead><tr style={{color:'#9ca3af',fontWeight:600,fontSize:11,textTransform:'uppercase',letterSpacing:'0.05em'}}>
                          <td style={{paddingBottom:10}}>Mês</td><td style={{textAlign:'right',paddingBottom:10}}>Receita</td><td style={{textAlign:'right',paddingBottom:10}}>Gasto</td><td style={{textAlign:'right',paddingBottom:10}}>Sobra</td>
                        </tr></thead>
                        <tbody>
                          {MONTHS.slice(0, new Date().getMonth()+1).reverse().slice(0,4).map((m,i) => {
                            const mi = new Date().getMonth() - i
                            const key = `${new Date().getFullYear()}-${String(mi+1).padStart(2,'0')}`
                            const mTx = transactions.filter(t=>t.date.startsWith(key))
                            const inc = mTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)
                            const exp = mTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)
                            const isActive = key === activeMonth
                            return (
                              <tr key={key} style={{borderTop:'1px solid #f3f4f6'}} onClick={()=>{setActiveMonth(key);setScreen('expenses')}}>
                                <td style={{padding:'10px 0',fontWeight:isActive?700:400,color:isActive?'#10b981':'#4b5563',cursor:'pointer'}}>{m}</td>
                                <td style={{textAlign:'right',color:'#22c55e'}}>{inc>0?fmtShort(inc):'-'}</td>
                                <td style={{textAlign:'right',color:'#ef4444'}}>{exp>0?fmtShort(exp):'-'}</td>
                                <td style={{textAlign:'right',fontWeight:600}}>{inc-exp!==0?fmtShort(inc-exp):'-'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div style={{padding:'20px 24px'}}>
                    <button onClick={handleSignOut} style={{width:'100%',height:48,borderRadius:14,border:'1.5px solid #e5e7eb',background:'white',color:'#6b7280',fontSize:15,fontWeight:600,cursor:'pointer'}}>Sair da conta</button>
                  </div>
                  <div style={{height:8}}/>
                </div>
                <BottomNav screen={screen} setScreen={setScreen}/>
              </div>
            )}

            {/* MODAL */}
            {showModal && (
              <div onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}} style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'flex-end'}}>
                <div style={{background:'white',width:'100%',borderRadius:'28px 28px 0 0',padding:'0 24px 40px',maxHeight:'85%',overflowY:'auto'}}>
                  <div style={{width:40,height:4,background:'#e5e7eb',borderRadius:4,margin:'16px auto 24px'}}/>
                  <div className="font-sora" style={{fontSize:20,fontWeight:700,color:'#111827',marginBottom:24}}>
                    {modalType==='expense'?'Registrar gasto':modalType==='income'?'Registrar receita':modalType==='goal'?'Nova meta':modalType==='rename'?'Renomear transação':'Atualizar salário'}
                  </div>

                  {modalType === 'rename' ? (
                    <>
                      <div style={{fontSize:12,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Nova descrição</div>
                      <input
                        value={renameValue}
                        onChange={e=>setRenameValue(e.target.value)}
                        placeholder="Ex: Almoço no restaurante"
                        autoFocus
                        style={{width:'100%',height:52,borderRadius:14,border:'1.5px solid #e5e7eb',padding:'0 16px',fontSize:15,color:'#1f2937',background:'#f9fafb',marginBottom:24,outline:'none'}}
                      />
                      <button onClick={handleRenameTransaction} disabled={loading||!renameValue.trim()}
                        style={{width:'100%',height:54,background:'linear-gradient(135deg,#6b7280,#4b5563)',border:'none',borderRadius:16,color:'white',fontSize:16,fontWeight:600,cursor:'pointer',opacity:(!renameValue.trim())?0.5:1}}>
                        {loading?'Salvando...':'Salvar nome'}
                      </button>
                      <button onClick={()=>setShowModal(false)} style={{width:'100%',height:44,border:'none',background:'none',color:'#6b7280',fontSize:14,fontWeight:500,cursor:'pointer',marginTop:8}}>Cancelar</button>
                    </>
                  ) : modalType === 'salary' ? (
                    <>
                      <div style={{fontSize:12,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Salário base (R$)</div>
                      <input type="number" value={salaryInput} onChange={e=>setSalaryInput(e.target.value)} placeholder="6500"
                        style={{width:'100%',height:52,borderRadius:14,border:'1.5px solid #e5e7eb',padding:'0 16px',fontSize:15,color:'#1f2937',background:'#f9fafb',marginBottom:20,outline:'none'}}/>
                      <div style={{fontSize:12,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Renda extra mensal (R$)</div>
                      <input type="number" value={extraInput} onChange={e=>setExtraInput(e.target.value)} placeholder="0"
                        style={{width:'100%',height:52,borderRadius:14,border:'1.5px solid #e5e7eb',padding:'0 16px',fontSize:15,color:'#1f2937',background:'#f9fafb',marginBottom:24,outline:'none'}}/>
                      <button onClick={handleUpdateSalary} disabled={loading} style={{width:'100%',height:54,background:'linear-gradient(135deg,#10b981,#059669)',border:'none',borderRadius:16,color:'white',fontSize:16,fontWeight:600,cursor:'pointer'}}>Salvar</button>
                    </>
                  ) : modalType === 'goal' ? (
                    <>
                      <div style={{fontSize:12,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Nome da meta</div>
                      <input value={addTitle} onChange={e=>setAddTitle(e.target.value)} placeholder="Ex: Viagem para Europa"
                        style={{width:'100%',height:52,borderRadius:14,border:'1.5px solid #e5e7eb',padding:'0 16px',fontSize:15,color:'#1f2937',background:'#f9fafb',marginBottom:20,outline:'none'}}/>
                      <div style={{fontSize:12,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Valor alvo (R$)</div>
                      <input type="number" value={addAmount} onChange={e=>setAddAmount(e.target.value)} placeholder="5000"
                        style={{width:'100%',height:52,borderRadius:14,border:'1.5px solid #e5e7eb',padding:'0 16px',fontSize:15,color:'#1f2937',background:'#f9fafb',marginBottom:24,outline:'none'}}/>
                      <button onClick={handleAddGoal} disabled={loading} style={{width:'100%',height:54,background:'linear-gradient(135deg,#10b981,#059669)',border:'none',borderRadius:16,color:'white',fontSize:16,fontWeight:600,cursor:'pointer'}}>Criar meta</button>
                    </>
                  ) : (
                    <>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
                        {(modalType==='income'?catIncome:catExpense).map(cat => (
                          <div key={cat.id} onClick={()=>setAddCategory(cat.id)}
                            style={{padding:'10px 6px',borderRadius:14,textAlign:'center',cursor:'pointer',border:`2px solid ${addCategory===cat.id?'#10b981':'transparent'}`,background:addCategory===cat.id?'#f0fdf4':'#f9fafb'}}>
                            <span style={{fontSize:22,display:'block',marginBottom:4}}>{cat.emoji}</span>
                            <span style={{fontSize:10,fontWeight:600,color:'#4b5563'}}>{cat.name.slice(0,8)}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{textAlign:'center',margin:'20px 0'}}>
                        <span style={{fontFamily:'Sora,sans-serif',fontSize:32,fontWeight:700,color:'#9ca3af'}}>R$</span>
                        <input type="number" value={addAmount} onChange={e=>setAddAmount(e.target.value)} placeholder="0,00" inputMode="decimal"
                          style={{fontFamily:'Sora,sans-serif',fontSize:48,fontWeight:700,color:'#111827',border:'none',outline:'none',width:200,textAlign:'center',background:'transparent'}}/>
                      </div>
                      <div style={{marginBottom:16}}>
                        <div style={{fontSize:12,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Descrição</div>
                        <input value={addTitle} onChange={e=>setAddTitle(e.target.value)} placeholder={modalType==='expense'?'Ex: Almoço no restaurante':'Ex: Salário março'}
                          style={{width:'100%',height:52,borderRadius:14,border:'1.5px solid #e5e7eb',padding:'0 16px',fontSize:15,color:'#1f2937',background:'#f9fafb',outline:'none'}}/>
                      </div>
                      <div style={{marginBottom:24}}>
                        <div style={{fontSize:12,fontWeight:600,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Data</div>
                        <input type="date" value={addDate} onChange={e=>setAddDate(e.target.value)}
                          style={{width:'100%',height:52,borderRadius:14,border:'1.5px solid #e5e7eb',padding:'0 16px',fontSize:15,color:'#1f2937',background:'#f9fafb',outline:'none'}}/>
                      </div>
                      <button onClick={handleAddTransaction} disabled={loading||!addTitle||!addAmount}
                        style={{width:'100%',height:54,background:'linear-gradient(135deg,#10b981,#059669)',border:'none',borderRadius:16,color:'white',fontSize:16,fontWeight:600,cursor:'pointer',opacity:(!addTitle||!addAmount)?0.5:1}}>
                        {loading?'Salvando...':`Salvar ${modalType==='expense'?'gasto':'receita'}`}
                      </button>
                      <button onClick={()=>setShowModal(false)} style={{width:'100%',height:44,border:'none',background:'none',color:'#6b7280',fontSize:14,fontWeight:500,cursor:'pointer',marginTop:8}}>Cancelar</button>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* TOAST */}
        {toast && (
          <div style={{position:'absolute',bottom:100,left:'50%',transform:'translateX(-50%)',background:'#1f2937',color:'white',padding:'12px 20px',borderRadius:20,fontSize:14,fontWeight:600,zIndex:200,whiteSpace:'nowrap'}}>
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}

function BottomNav({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) {
  const items: { id: Screen; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Início', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
    { id: 'expenses', label: 'Gastos', icon: 'M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z' },
    { id: 'budget', label: 'Orçamento', icon: 'M12 2a10 10 0 100 20A10 10 0 0012 2zM12 6v6l4 2' },
    { id: 'profile', label: 'Perfil', icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z' },
  ]
  return (
    <div style={{display:'flex',background:'white',borderTop:'1px solid #f3f4f6',padding:'10px 8px 24px',flexShrink:0}}>
      {items.map(item => (
        <div key={item.id} onClick={()=>setScreen(item.id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,cursor:'pointer',padding:'6px 0',borderRadius:12}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={screen===item.id?'#10b981':'#d1d5db'} stroke="none">
            <path d={item.icon}/>
          </svg>
          <span style={{fontSize:10,fontWeight:screen===item.id?700:500,color:screen===item.id?'#10b981':'#9ca3af'}}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
