# FinTrack — Controle Financeiro

App mobile de organização financeira com Supabase + Next.js.

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz com:

```
NEXT_PUBLIC_SUPABASE_URL=https://sglpzbkvzocchkatnzqb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnbHB6Ymt2em9jY2hrYXRuenFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTMyMTIsImV4cCI6MjA5MTMyOTIxMn0.9zMgGvwUf9_ZOgFLrV3J7y_7mF4f8gQgBzFOw7tWWZs
```

## Deploy no Vercel (2 minutos)

```bash
npm install
npx vercel login
npx vercel --prod
```

Ou acesse vercel.com/new e faça upload desta pasta.

## Rodando localmente

```bash
npm install
npm run dev
# Acesse http://localhost:3000
```
