'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CheckCircle, TrendingUp, PieChart, Smartphone, ChevronDown, Lock, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile, Transaction, Category, SavingsGoal } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

gsap.registerPlugin(ScrollTrigger);

// --- TIPAGENS ---
type Screen = 'landing' | 'login' | 'dashboard' | 'expenses' | 'budget' | 'profile';
type ActiveMonth = string;

// --- FUNÇÕES AUXILIARES ---
const fmt = (n: number) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = (n: number) => n >= 1000 ? 'R$' + (n / 1000).toFixed(1).replace('.', ',') + 'k' : 'R$' + n.toLocaleString('pt-BR', { minimumFractionDigits: 0 });
const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// --- COMPONENTES REUTILIZÁVEIS ---
const FormInput = ({ label, ...props }: any) => (
  <div style={{ marginBottom: props.style?.marginBottom || 20 }}>
    {label && <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>}
    <input style={{ width: '100%', height: 52, borderRadius: 14, border: '1.5px solid #e5e7eb', padding: '0 16px', fontSize: 15, color: '#1f2937', background: '#f9fafb', outline: 'none', ...props.style }} {...props} />
  </div>
);

const PrimaryButton = ({ children, disabled, onClick, variant = 'primary', ...props }: any) => (
  <button onClick={onClick} disabled={disabled} style={{ width: '100%', height: 54, background: variant === 'primary' ? 'linear-gradient(135deg,#10b981,#059669)' : 'white', border: variant === 'primary' ? 'none' : '1.5px solid #e5e7eb', borderRadius: 16, color: variant === 'primary' ? 'white' : '#6b7280', fontSize: 16, fontWeight: 600, cursor: 'pointer', opacity: disabled ? 0.6 : 1, ...props.style }}>
    {children}
  </button>
);

const BenefitCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="mb-4 bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center">{icon}</div>
    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{desc}</p>
  </div>
);

const TestimonialCard = ({ text, author }: { text: string, author: string }) => (
  <div className="bg-slate-800 p-8 rounded-2xl">
    <div className="flex text-emerald-400 mb-4">{[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}</div>
    <p className="text-slate-300 italic mb-6">"{text}"</p>
    <p className="font-bold text-white">{author}</p>
  </div>
);

const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div onClick={() => setIsOpen(!isOpen)} className="border border-slate-200 rounded-xl p-5 bg-white cursor-pointer hover:border-emerald-300 transition-colors">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-slate-800">{question}</h4>
        <ChevronDown size={20} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && <p className="mt-3 text-slate-600 animate-fade-in">{answer}</p>}
    </div>
  );
};

const BottomNav = ({ screen, setScreen }: { screen: Screen; setScreen: (s: Screen) => void }) => {
  const items = [
    { id: 'dashboard', label: 'Início', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
    { id: 'expenses', label: 'Gastos', icon: 'M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z' },
    { id: 'budget', label: 'Orçamento', icon: 'M12 2a10 10 0 100 20A10 10 0 0012 2zM12 6v6l4 2' },
    { id: 'profile', label: 'Perfil', icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z' },
  ];
  return (
    <div style={{ display: 'flex', background: 'white', borderTop: '1px solid #f3f4f6', padding: '10px 8px 24px', flexShrink: 0 }}>
      {items.map(item => (
        <div key={item.id} onClick={() => setScreen(item.id as Screen)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '6px 0', borderRadius: 12 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={screen === item.id ? '#10b981' : '#d1d5db'} stroke="none"><path d={item.icon} /></svg>
          <span style={{ fontSize: 10, fontWeight: screen === item.id ? 700 : 500, color: screen === item.id ? '#10b981' : '#9ca3af' }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

function SwipeableTransactionRow({ t, onDelete, onRename }: { t: Transaction, onDelete: (id: string) => void, onRename: (id: string, currentTitle: string) => void }) {
  const SWIPE_THRESHOLD = 80;
  const startXRef = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => { startXRef.current = e.clientX; };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (startXRef.current === null) return;
    const delta = e.clientX - startXRef.current;
    setOffset(Math.min(0, Math.max(-SWIPE_THRESHOLD * 1.1, (revealed ? -SWIPE_THRESHOLD : 0) + delta)));
  };
  const handlePointerUp = () => {
    if (startXRef.current === null) return;
    startXRef.current = null;
    if (offset < -SWIPE_THRESHOLD / 2) { setOffset(-SWIPE_THRESHOLD); setRevealed(true); }
    else { setOffset(0); setRevealed(false); }
  };
  const close = () => { setOffset(0); setRevealed(false); };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid #f9fafb' }}>
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, display: 'flex', width: SWIPE_THRESHOLD }}>
        <button onClick={() => { close(); onRename(t.id, t.title); }} style={{ flex: 1, border: 'none', background: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button onClick={() => { close(); onDelete(t.id); }} style={{ flex: 1, border: 'none', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button>
      </div>
      <div onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} style={{ transform: `translateX(${offset}px)`, transition: startXRef.current === null ? 'transform 0.25s ease' : 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', background: 'white', touchAction: 'pan-y', userSelect: 'none', cursor: 'grab' }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: t.type === 'income' ? '#f0fdf4' : '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, pointerEvents: 'none' }}>{t.categories?.emoji || (t.type === 'income' ? '💰' : '💸')}</div>
        <div style={{ flex: 1, minWidth: 0, pointerEvents: 'none' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{t.categories?.name || (t.type === 'income' ? 'Receita' : 'Outro')} • {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</div>
        </div>
        <div className="font-sora" style={{ fontSize: 15, fontWeight: 700, color: t.type === 'income' ? '#22c55e' : '#ef4444', flexShrink: 0, pointerEvents: 'none' }}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</div>
      </div>
    </div>
  );
}

// --- TELA DE LANDING PAGE ---
function LandingScreen({ onStart }: { onStart: () => void }) {
  const mainRef = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.from('.hero-elem', { y: 30, opacity: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' });
    gsap.utils.toArray<HTMLElement>('.scroll-section').forEach(section => {
      gsap.from(section, { scrollTrigger: { trigger: section, start: 'top 80%' }, y: 40, opacity: 0, duration: 0.8, ease: 'power2.out' });
    });
    gsap.to('.dashboard-chart-bar', { height: (i, t) => t.dataset.height, duration: 1.5, delay: 0.5, stagger: 0.1, ease: 'elastic.out(1, 0.7)' });
  }, { scope: mainRef });

  return (
    <div ref={mainRef} className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200 overflow-y-auto">
      <header className="relative bg-slate-900 text-white overflow-hidden pb-20 pt-32 px-6">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h1 className="hero-elem text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            O controle do seu dinheiro, <span className="text-emerald-400">finalmente em suas mãos.</span>
          </h1>
          <p className="hero-elem text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto">Pare de adivinhar para onde seu salário vai. Economize mais e tenha uma visão clara do seu futuro.</p>
          <div className="hero-elem flex flex-col sm:flex-row justify-center items-center gap-4">
            <button onClick={onStart} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 px-8 rounded-full text-lg transition-transform hover:scale-105 active:scale-95 w-full sm:w-auto">Entrar ou Cadastrar</button>
            <p className="text-sm text-slate-400 mt-2 sm:mt-0 sm:ml-4">Disponível para iOS e Android</p>
          </div>
        </div>
      </header>
      
      <section className="scroll-section -mt-16 relative z-20 max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 md:p-10 flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Balanço Mensal</h3>
            <p className="text-4xl font-bold text-slate-900 mb-6">R$ 4.250,00</p>
            <div className="flex items-end gap-2 h-32 border-b border-slate-100 pb-2">
              {['40%', '60%', '30%', '80%', '50%', '100%'].map((h, i) => (
                <div key={i} className="flex-1 bg-emerald-100 rounded-t-md relative group">
                  <div className="dashboard-chart-bar absolute bottom-0 w-full bg-emerald-500 rounded-t-md h-0" data-height={h}></div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-4">
             <h3 className="text-lg font-semibold text-slate-800 mb-2">Últimas Transações</h3>
             {[ { name: 'Mercado', val: '- R$ 450,00', color: 'text-red-500' }, { name: 'Salário', val: '+ R$ 5.000,00', color: 'text-emerald-500' } ].map((tx, i) => (
               <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                 <span className="font-medium text-slate-700">{tx.name}</span><span className={`font-bold ${tx.color}`}>{tx.val}</span>
               </div>
             ))}
          </div>
        </div>
      </section>

      <section className="scroll-section py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-16">Por que escolher nosso app?</h2>
        <div className="grid md:grid-cols-3 gap-10">
          <BenefitCard icon={<PieChart className="text-emerald-500" size={32} />} title="Visão Clara" desc="Entenda seus hábitos de consumo com gráficos simples." />
          <BenefitCard icon={<TrendingUp className="text-emerald-500" size={32} />} title="Economia Real" desc="Defina metas de gastos e receba alertas." />
          <BenefitCard icon={<Smartphone className="text-emerald-500" size={32} />} title="Tudo em um só lugar" desc="Chega de planilhas complexas e desorganizadas." />
        </div>
      </section>

      <section className="scroll-section bg-emerald-50 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Lock className="mx-auto text-emerald-600 mb-4" size={48} />
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Segurança a nível bancário</h2>
          <p className="text-slate-600 text-lg">Seus dados são criptografados e nós não vendemos suas informações.</p>
        </div>
      </section>

      <section className="scroll-section py-24 px-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">Dúvidas Frequentes</h2>
        <div className="space-y-4">
          <FaqItem question="Preciso pagar para usar?" answer="Não! Oferecemos uma versão gratuita robusta." />
          <FaqItem question="Meus dados estão seguros?" answer="Sim. Utilizamos criptografia de ponta." />
        </div>
      </section>

      <section className="scroll-section bg-emerald-500 py-20 px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">Pronto para transformar sua vida financeira?</h2>
        <button onClick={onStart} className="bg-slate-900 text-white font-bold py-4 px-10 rounded-full text-lg transition-transform hover:scale-105 shadow-lg">Começar gratuitamente</button>
      </section>
    </div>
  );
}

// --- APLICAÇÃO PRINCIPAL ---
export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Estados de Autenticação
  const [authMode, setAuthMode] = useState<'login'|'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState('');
  const [resetMode, setResetMode] = useState(false);
  
  // Estados UI & Modais
  const [toast, setToast] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'expense'|'income'|'goal'|'salary'|'rename'|'goalDeposit'>('expense');
  const [activeMonth, setActiveMonth] = useState<ActiveMonth>(() => `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`);
  
  // Estados de Formulários Modais
  const [formValues, setFormValues] = useState({ title: '', amount: '', category: '', date: new Date().toISOString().split('T')[0], salary: '', extra: '', deposit: '', renameId: '' });
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadData = useCallback(async (uid: string) => {
    const [profRes, txRes, catRes, goalRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('transactions').select('*, categories(name,emoji,color)').eq('user_id', uid).order('date', { ascending: false }).limit(100),
      supabase.from('categories').select('*').or(`user_id.eq.${uid},is_default.eq.true`).order('name'),
      supabase.from('savings_goals').select('*').eq('user_id', uid).order('created_at'),
    ]);
    if (profRes.data) setProfile(profRes.data);
    if (txRes.data) setTransactions(txRes.data);
    if (goalRes.data) setGoals(goalRes.data);
    if (catRes.data) {
      const byName = new Map<string, Category>();
      catRes.data.forEach(c => { const ex = byName.get(c.name); if (!ex || (!c.is_default && ex.is_default)) byName.set(c.name, c); });
      setCategories(Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); loadData(session.user.id); setScreen('dashboard'); }
      setIsInitializing(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setResetMode(true);
      setUser(session?.user ?? null);
      if (session?.user && !resetMode) { loadData(session.user.id); setScreen('dashboard'); }
    });
    return () => subscription.unsubscribe();
  }, [loadData, resetMode]);

  const handleAuth = async () => {
    setAuthError(''); setLoading(true);
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setAuthError(error.message.includes('Invalid') ? 'Credenciais incorretas.' : error.message);
      } else {
        if (!fullName.trim()) return setAuthError('Digite seu nome.');
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
        if (error) setAuthError(error.message); else showToast('Conta criada com sucesso!');
      }
    } finally { setLoading(false); }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); setScreen('landing'); setProfile(null); setTransactions([]); setGoals([]); };

  // Cálculos Mensais
  const monthTxns = transactions.filter(t => t.date.startsWith(activeMonth));
  const monthIncome = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = monthIncome - monthExpense;
  const catSpend: Record<string, number> = {};
  monthTxns.filter(t => t.type === 'expense').forEach(t => { if (t.category_id) catSpend[t.category_id] = (catSpend[t.category_id] || 0) + t.amount; });
  const maxSpend = Math.max(...Object.values(catSpend), 1);
  const txnGroups: Record<string, Transaction[]> = {};
  monthTxns.forEach(t => { if (!txnGroups[t.date]) txnGroups[t.date] = []; txnGroups[t.date].push(t); });

  const openModal = (type: typeof modalType, extra?: any) => {
    setModalType(type); setShowModal(true);
    setFormValues({ title: '', amount: '', category: '', date: new Date().toISOString().split('T')[0], salary: String(profile?.salary || ''), extra: String(profile?.extra_income || ''), deposit: '', renameId: extra?.id || '' });
    if(type === 'rename') setFormValues(prev => ({...prev, title: extra?.title}));
    if(type === 'goalDeposit') setSelectedGoal(extra);
  };

  const executeAction = async (actionFn: () => Promise<{error: any}>, successMsg: string) => {
    setLoading(true);
    const { error } = await actionFn();
    if (!error && user) { await loadData(user.id); setShowModal(false); showToast(successMsg); }
    setLoading(false);
  };

  if (isInitializing) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Carregando...</div>;
  if (screen === 'landing') return <LandingScreen onStart={() => setScreen('login')} />;

  return (
    // Wrapper: padding só em sm+; fundo branco em mobile (sem fundo cinza visível)
    <div className="flex justify-center items-start min-h-screen sm:py-8 sm:bg-gray-100 bg-white">
      {/* phone-shell: dimensões e bordas controladas pelo CSS (globals.css) */}
      <div className="phone-shell relative bg-white overflow-hidden">
        
        {/* TELA DE LOGIN */}
        {screen === 'login' && (
          <div className="flex flex-col h-full bg-slate-900">
            <div className="p-8 pt-16 flex-1 flex flex-col justify-center text-white">
               <h1 className="text-3xl font-bold mb-2">FinTrack</h1>
               <p className="text-slate-400 mb-8">Sua vida financeira, organizada.</p>
               <div className="bg-white rounded-t-3xl p-6 absolute bottom-0 left-0 right-0">
                 <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                   {['login', 'signup'].map(m => (
                     <button key={m} onClick={() => { setAuthMode(m as any); setAuthError(''); }} className={`flex-1 py-2 text-sm font-semibold rounded-lg ${authMode === m ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                       {m === 'login' ? 'Entrar' : 'Cadastrar'}
                     </button>
                   ))}
                 </div>
                 {authMode === 'signup' && <FormInput label="Nome Completo" value={fullName} onChange={setFullName} placeholder="Seu nome" />}
                 <FormInput label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" />
                 <FormInput label="Senha" type="password" value={password} onChange={setPassword} placeholder="••••••••" style={{marginBottom: 8}} />
                 {authError && <div className="text-red-500 text-sm mb-4 text-center">{authError}</div>}
                 <PrimaryButton onClick={handleAuth} disabled={loading} className="mt-4">{loading ? 'Aguarde...' : authMode === 'login' ? 'Acessar Conta' : 'Criar Conta'}</PrimaryButton>
               </div>
            </div>
          </div>
        )}

        {/* TELAS AUTENTICADAS */}
        {screen !== 'login' && (
           <div className="flex flex-col h-full bg-slate-50">
             {/* Header Global Condicional */}
             {screen === 'dashboard' && (
               <div className="bg-slate-900 p-6 pt-12 text-white shrink-0">
                 <h2 className="text-sm text-slate-400">Bom dia,</h2>
                 <h1 className="text-2xl font-bold mb-4">{profile?.full_name || 'Usuário'}</h1>
                 <div className="bg-white/10 p-5 rounded-2xl border border-white/10">
                   <p className="text-xs text-slate-300 uppercase">Saldo do Mês</p>
                   <p className="text-3xl font-bold mb-3">{fmt(balance)}</p>
                   <div className="flex gap-4 text-sm">
                     <div><span className="text-slate-400">Receitas</span> <br/><span className="text-emerald-400 font-semibold">{fmtShort(monthIncome)}</span></div>
                     <div><span className="text-slate-400">Gastos</span> <br/><span className="text-red-400 font-semibold">{fmtShort(monthExpense)}</span></div>
                   </div>
                 </div>
               </div>
             )}

             {/* Conteúdo Dinâmico com Scroll */}
             <div className="flex-1 overflow-y-auto pb-20">
               {screen === 'dashboard' && (
                 <div className="p-6">
                   <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-800">Ações Rápidas</h3></div>
                   <div className="flex gap-3 mb-8">
                     <button onClick={() => openModal('expense')} className="flex-1 bg-red-50 py-3 rounded-xl text-red-600 font-semibold text-sm border border-red-100">- Gasto</button>
                     <button onClick={() => openModal('income')} className="flex-1 bg-emerald-50 py-3 rounded-xl text-emerald-600 font-semibold text-sm border border-emerald-100">+ Receita</button>
                   </div>
                   <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-800">Últimas Transações</h3><button onClick={() => setScreen('expenses')} className="text-emerald-500 text-sm font-semibold">Ver todas</button></div>
                   {transactions.slice(0, 5).map(t => (
                      <div key={t.id} className="flex justify-between items-center p-3 mb-2 bg-white rounded-xl shadow-sm">
                        <div><p className="font-semibold text-gray-800">{t.title}</p><p className="text-xs text-gray-500">{t.categories?.name || 'Outro'}</p></div>
                        <p className={`font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</p>
                      </div>
                   ))}
                 </div>
               )}

               {screen === 'expenses' && (
                 <div>
                    <div className="bg-white p-6 pb-2 border-b">
                      <h2 className="text-xl font-bold mb-4">Gastos ({MONTHS[new Date().getMonth()]})</h2>
                      <div className="flex gap-3 overflow-x-auto pb-4">
                         {Object.entries(catSpend).map(([id, amt]) => <div key={id} className="min-w-24 bg-gray-50 p-3 rounded-xl"><p className="text-xs text-gray-500">{categories.find(c=>c.id===id)?.name}</p><p className="font-bold text-sm">{fmtShort(amt)}</p></div>)}
                      </div>
                    </div>
                    {Object.keys(txnGroups).map(date => (
                      <div key={date} className="mb-4">
                        <p className="px-6 py-2 text-xs font-bold text-gray-500 bg-gray-100">{new Date(date+'T00').toLocaleDateString()}</p>
                        {txnGroups[date].map(t => <SwipeableTransactionRow key={t.id} t={t} onDelete={(id) => executeAction(() => supabase.from('transactions').delete().eq('id', id), 'Removido!')} onRename={(id, title) => openModal('rename', {id, title})} />)}
                      </div>
                    ))}
                 </div>
               )}

               {screen === 'profile' && (
                 <div className="p-6 pt-12">
                   <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">{(profile?.full_name||'U')[0]}</div>
                   <h2 className="text-center text-xl font-bold mb-8">{profile?.full_name}</h2>
                   <PrimaryButton variant="secondary" onClick={() => openModal('salary')} className="mb-4">Atualizar Salário</PrimaryButton>
                   <PrimaryButton variant="secondary" onClick={handleSignOut}>Sair da Conta</PrimaryButton>
                 </div>
               )}
             </div>

             {/* Navegação e Modais */}
             <div className="absolute bottom-0 w-full"><BottomNav screen={screen} setScreen={setScreen} /></div>

             {showModal && (
               <div className="absolute inset-0 bg-black/50 z-50 flex items-end">
                 <div className="bg-white w-full rounded-t-3xl p-6 pb-12 max-h-[85%] overflow-y-auto">
                   <h2 className="text-xl font-bold mb-6">{modalType === 'expense' ? 'Novo Gasto' : modalType === 'income' ? 'Nova Receita' : 'Atualizar'}</h2>
                   
                   {(modalType === 'expense' || modalType === 'income') && (
                     <>
                       <div className="text-center mb-6 text-4xl font-bold text-gray-900">R$ <input type="number" value={formValues.amount} onChange={e=>setFormValues({...formValues, amount: e.target.value})} className="w-32 bg-transparent outline-none" placeholder="0,00" /></div>
                       <FormInput label="Descrição" value={formValues.title} onChange={(v:string)=>setFormValues({...formValues, title: v})} placeholder="Ex: Almoço" />
                       <PrimaryButton onClick={() => executeAction(() => supabase.from('transactions').insert({ user_id: user?.id, title: formValues.title, amount: parseFloat(formValues.amount), type: modalType, date: formValues.date }), 'Salvo com sucesso!')} disabled={!formValues.title || !formValues.amount}>Salvar</PrimaryButton>
                     </>
                   )}

                   <button onClick={() => setShowModal(false)} className="w-full mt-4 text-gray-500 font-semibold py-3">Cancelar</button>
                 </div>
               </div>
             )}

             {toast && <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg z-[100]">{toast}</div>}
           </div>
        )}
      </div>
    </div>
  );
}
