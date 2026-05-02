import Link from "next/link";

const benefits = [
  ["📊", "Visão clara em segundos", "Veja para onde seu dinheiro vai, com gráficos e categorias simples de entender."],
  ["🎯", "Metas alcançáveis", "Crie objetivos de economia e acompanhe avanço por mês."],
  ["⚡", "Registro rápido", "Adicione receitas e despesas sem fricção."],
  ["🔒", "Base segura", "Estrutura pronta para evoluir com autenticação, Supabase e políticas de acesso."],
  ["📱", "Pensado para mobile", "Interface compacta, direta e próxima da experiência do app."],
  ["🤖", "Insights inteligentes", "Espaço preparado para alertas e análises futuras."],
];

const features = [
  {
    tag: "Controle",
    title: "Receitas, gastos e saldo em uma visão só.",
    text: "Organize o mês com cards objetivos, transações recentes e leitura rápida do saldo.",
    items: ["Resumo mensal", "Categorias de gasto", "Histórico por data"],
  },
  {
    tag: "Metas",
    title: "Progresso financeiro visível.",
    text: "Acompanhe objetivos como viagem, reserva ou compra planejada com percentual e valor atual.",
    items: ["Valor-alvo", "Depósitos", "Progresso percentual"],
  },
  {
    tag: "Produto",
    title: "Landing conectada ao app real.",
    text: "Esta página foi feita para coexistir com o app Next.js atual, sem quebrar autenticação ou Supabase.",
    items: ["Rota isolada /landing", "Sem HTML solto", "Compatível com TypeScript"],
  },
];

const plans = [
  ["Starter", "R$0", "Para começar", ["Controle básico", "Categorias", "Resumo mensal"]],
  ["Pro", "R$19", "Mais completo", ["Metas", "Relatórios", "Insights", "Histórico avançado"]],
  ["Premium", "R$39", "Para uso intenso", ["Tudo do Pro", "Exportação", "Prioridade", "Recursos futuros de IA"]],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/landing" className="flex items-center gap-3 text-white" aria-label="FinTrack landing">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500 font-bold">$</span>
            <span className="font-sora text-xl font-bold">FinTrack</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-white/65 md:flex">
            <a href="#beneficios" className="hover:text-white">Benefícios</a>
            <a href="#funcionalidades" className="hover:text-white">Funcionalidades</a>
            <a href="#precos" className="hover:text-white">Preços</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </div>

          <Link
            href="/"
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600"
          >
            Abrir app
          </Link>
        </nav>
      </header>

      <section className="relative overflow-hidden bg-slate-950 px-5 py-24 text-white lg:px-8 lg:py-32">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,.08)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Controle financeiro inteligente
            </div>
            <h1 className="font-sora text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Pare de perder dinheiro sem <span className="text-emerald-400">saber por quê.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/60">
              O FinTrack organiza receitas, despesas e metas em uma experiência simples, visual e preparada para evoluir com automações inteligentes.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/" className="rounded-2xl bg-emerald-500 px-7 py-4 text-center font-semibold text-white shadow-xl shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-600">
                Começar agora
              </Link>
              <a href="#demo" className="rounded-2xl border border-white/15 bg-white/10 px-7 py-4 text-center font-semibold text-white transition hover:bg-white/15">
                Ver demonstração
              </a>
            </div>
            <div className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-8">
              <Stat value="R$0" label="para testar" />
              <Stat value="3" label="áreas principais" />
              <Stat value="100%" label="Next.js" />
            </div>
          </div>

          <div id="demo" className="mx-auto w-full max-w-sm rounded-[2.5rem] bg-slate-900 p-3 shadow-2xl shadow-black/50 ring-1 ring-white/10">
            <div className="overflow-hidden rounded-[2rem] bg-slate-50">
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-700 p-6 text-white">
                <p className="text-xs text-white/50">Bom dia, João</p>
                <h2 className="font-sora text-lg font-bold">Resumo do mês</h2>
                <div className="mt-5 rounded-2xl bg-white/10 p-5 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-wider text-white/45">Saldo atual</p>
                  <p className="mt-1 font-sora text-3xl font-extrabold">R$ 3.840,00</p>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <span className="text-emerald-200">↑ R$ 6,5k</span>
                    <span className="text-red-200">↓ R$ 2,6k</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3 p-5">
                <Transaction emoji="🍔" title="iFood" type="Alimentação" amount="-R$47,90" negative />
                <Transaction emoji="💰" title="Salário" type="Receita" amount="+R$6.500" />
                <Transaction emoji="🚗" title="Combustível" type="Transporte" amount="-R$120,00" negative />
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-700">
                  <strong className="text-emerald-700">Insight:</strong> gastos sob controle neste mês.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="beneficios" className="bg-slate-50 px-5 py-24 lg:px-8">
        <SectionHeader eyebrow="Por que usar" title="Clareza antes do fim do mês." text="Boa gestão começa com visibilidade. A landing mostra o valor do app antes do cadastro." />
        <div className="mx-auto mt-14 grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map(([emoji, title, text]) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl">
              <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-2xl">{emoji}</div>
              <h3 className="font-sora text-lg font-bold text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="funcionalidades" className="px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader align="left" eyebrow="Funcionalidades" title="Tudo que importa. Nada de ruído." text="Estrutura pensada para encaixar no teu app atual sem trocar stack." />
          <div className="mt-14 space-y-8">
            {features.map((feature, index) => (
              <article key={feature.title} className="grid gap-8 rounded-3xl border border-slate-200 p-8 lg:grid-cols-[.9fr_1.1fr] lg:p-10">
                <div className="rounded-2xl bg-slate-950 p-8 text-white">
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">{feature.tag}</span>
                  <div className="mt-10 flex h-40 items-end gap-3">
                    {[50, 72, 42, 86, 64, 35].map((height, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-2">
                        <div className="w-full rounded-t-xl bg-emerald-500" style={{ height: `${height}%` }} />
                        <span className="text-[10px] text-white/35">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">0{index + 1}</p>
                  <h3 className="mt-3 font-sora text-3xl font-extrabold tracking-tight text-slate-950">{feature.title}</h3>
                  <p className="mt-4 text-base leading-8 text-slate-500">{feature.text}</p>
                  <ul className="mt-7 space-y-3">
                    {feature.items.map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-50 text-emerald-600">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="precos" className="bg-slate-50 px-5 py-24 lg:px-8">
        <SectionHeader eyebrow="Planos" title="Modelo simples para validar." text="Preços podem ser ligados depois a Stripe, Mercado Pago ou outro checkout." />
        <div className="mx-auto mt-14 grid max-w-6xl gap-6 lg:grid-cols-3">
          {plans.map(([name, price, period, items], index) => (
            <article key={name as string} className={`rounded-3xl border p-8 ${index === 1 ? "border-emerald-500 bg-slate-950 text-white shadow-2xl" : "border-slate-200 bg-white text-slate-950"}`}>
              {index === 1 && <p className="mb-4 inline-flex rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">Popular</p>}
              <h3 className="font-sora text-lg font-bold">{name}</h3>
              <p className="mt-5 font-sora text-5xl font-extrabold">{price}<span className="text-base font-medium opacity-50">/mês</span></p>
              <p className={`mt-2 text-sm ${index === 1 ? "text-white/50" : "text-slate-500"}`}>{period}</p>
              <ul className="mt-8 space-y-3 text-sm">
                {(items as string[]).map((item) => <li key={item}>✓ {item}</li>)}
              </ul>
              <Link href="/" className={`mt-8 block rounded-2xl px-5 py-3 text-center font-semibold ${index === 1 ? "bg-emerald-500 text-white hover:bg-emerald-600" : "border border-slate-200 hover:border-emerald-500 hover:text-emerald-600"}`}>
                Começar
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="px-5 py-24 lg:px-8">
        <SectionHeader eyebrow="FAQ" title="Perguntas diretas." text="Respostas curtas para reduzir fricção antes do cadastro." />
        <div className="mx-auto mt-12 max-w-3xl divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white">
          <Faq q="Essa landing substitui meu app atual?" a="Não. Ela fica em /landing e mantém o app existente em /." />
          <Faq q="Usa a mesma linguagem do repositório?" a="Sim. Next.js, React, TypeScript e Tailwind, seguindo package.json do projeto." />
          <Faq q="Precisa de GSAP?" a="Não. A versão usa CSS/Tailwind e evita dependência extra." />
          <Faq q="O CTA abre o app?" a="Sim. Os botões principais apontam para /." />
        </div>
      </section>

      <section className="bg-slate-950 px-5 py-24 text-center text-white lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-sora text-4xl font-extrabold tracking-tight sm:text-5xl">Pronto para organizar o mês?</h2>
          <p className="mt-5 text-lg leading-8 text-white/55">Acesse o app atual ou use esta landing como página pública de entrada.</p>
          <Link href="/" className="mt-10 inline-flex rounded-2xl bg-emerald-500 px-8 py-4 font-semibold text-white shadow-xl shadow-emerald-500/25 hover:bg-emerald-600">
            Abrir FinTrack
          </Link>
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-sora text-2xl font-extrabold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/40">{label}</p>
    </div>
  );
}

function Transaction({ emoji, title, type, amount, negative = false }: { emoji: string; title: string; type: string; amount: string; negative?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-xl">{emoji}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-400">{type}</p>
      </div>
      <p className={`font-sora text-sm font-bold ${negative ? "text-red-500" : "text-emerald-500"}`}>{amount}</p>
    </div>
  );
}

function SectionHeader({ eyebrow, title, text, align = "center" }: { eyebrow: string; title: string; text: string; align?: "center" | "left" }) {
  return (
    <div className={`mx-auto max-w-3xl ${align === "center" ? "text-center" : "text-left"}`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">{eyebrow}</p>
      <h2 className="mt-4 font-sora text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">{title}</h2>
      <p className="mt-5 text-base leading-8 text-slate-500">{text}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group p-6 open:bg-slate-50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-sora font-bold text-slate-950">
        {q}
        <span className="text-emerald-600 transition group-open:rotate-45">+</span>
      </summary>
      <p className="mt-4 text-sm leading-7 text-slate-500">{a}</p>
    </details>
  );
}
