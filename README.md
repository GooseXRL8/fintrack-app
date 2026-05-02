# FinTrack Landing Page

Landing page estática refatorada para estrutura mais limpa, acessível e pronta para GitHub Pages/Vercel/Netlify.

## Estrutura

```txt
.
├── index.html
├── robots.txt
├── sitemap.xml
├── site.webmanifest
└── assets
    ├── css
    │   └── main.css
    └── js
        └── main.js
```

## Melhorias aplicadas

- CSS e JS separados do HTML.
- Scripts carregados com `defer`.
- Menu mobile sem `onclick` inline.
- FAQ sem JS inline, com `aria-expanded`, `aria-controls` e `aria-hidden`.
- Skip link para acessibilidade.
- Estados de foco com `:focus-visible`.
- Suporte a `prefers-reduced-motion`.
- Meta tags SEO e Open Graph.
- Links principais corrigidos para `#lead-form` ou rotas reais.
- Formulário de lead/cadastro adicionado.
- Classe `menu-open` para travar scroll do menu mobile.

## Onde colocar no GitHub

Coloque todos os arquivos na raiz do repositório, mantendo as pastas exatamente assim:

```txt
seu-repositorio/
├── index.html
├── robots.txt
├── sitemap.xml
├── site.webmanifest
└── assets/
    ├── css/main.css
    └── js/main.js
```

## Rodar localmente

Abra `index.html` no navegador ou use servidor local:

```bash
python -m http.server 5500
```

Depois acesse:

```txt
http://localhost:5500
```

## Publicar no GitHub Pages

1. Suba os arquivos para a branch principal.
2. Vá em **Settings > Pages**.
3. Em **Build and deployment**, selecione:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
4. Salve.

## Ajustes obrigatórios antes de produção

- Trocar `https://seu-dominio.com/` no `index.html`, `robots.txt` e `sitemap.xml` pelo domínio real.
- Trocar `/cadastro` no formulário pelo endpoint real do backend.
- Revisar claims de segurança antes de anunciar AES-256, TLS 1.3, RLS, LGPD ou IA em produção.
- Criar páginas reais para `/termos.html`, `/privacidade.html`, `/lgpd.html`, etc.
