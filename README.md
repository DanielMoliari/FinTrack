<div align="center">

<img src="public/icons/money.svg" width="80" alt="FinTrack logo" />

# FinTrack

**PWA de finanças pessoais — mobile-first, funciona offline, Google Sheets como banco de dados.**

[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Zustand](https://img.shields.io/badge/Zustand-4-ff6b00?style=flat-square)](https://zustand-demo.pmnd.rs)
[![PWA](https://img.shields.io/badge/PWA-ready-5a0fc8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps)
[![Google Apps Script](https://img.shields.io/badge/Backend-Google%20Apps%20Script-4285f4?style=flat-square&logo=google&logoColor=white)](https://developers.google.com/apps-script)

</div>

---

## Visão geral

O FinTrack é um rastreador de finanças pessoais de custo zero que roda inteiramente na sua própria infraestrutura — sem servidor, sem assinatura, sem que seus dados saiam do seu controle. A interface é uma React PWA instalável em qualquer celular; o backend é um Google Apps Script que lê e escreve diretamente em uma planilha do Google que é sua.

---

## Funcionalidades

| Tela             | O que faz                                                                                                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Início**       | Resumo do mês — receitas, gastos, saldo; FAB de lançamento rápido com 5 tipos de transação; sparkline por categoria                                                                                               |
| **Transações**   | Lista completa com seletor de mês e filtro por categoria; aba **Fixos** para despesas recorrentes com toggle ativo/inativo e alertas de vencimento                                                                |
| **Patrimônio**   | Patrimônio líquido consolidado de todas as carteiras; card expansível do C6Bank (CDB + Conta Corrente); portfólio crypto com preços ao vivo via CoinGecko; projeção CDI 12 meses; gráfico de evolução patrimonial |
| **Relatórios**   | Gráfico de barras mensal (receitas vs gastos); gráfico de rosca por categoria; filtrável por período e categoria; score de saúde financeira                                                                       |
| **Exportar PDF** | Relatório PDF bilíngue (PT/EN) completo com capa, tabelas de transações por mês, página de resumo, gráfico de barras, pizza e evolução patrimonial                                                                |
| **Perfil**       | Nome, URL e token da API editáveis; score de saúde financeira; backup no Drive; migração de dados                                                                                                                 |
| **PWA**          | Instalável no iOS e Android; fila offline para requisições com falha; service worker com cache stale-while-revalidate                                                                                             |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                React PWA  (Vite)                    │
│                                                     │
│  Telas: Home · Transactions · Patrimony             │
│         Reports · Profile                           │
│                                                     │
│  Estado: Zustand (useFinanceStore)                  │
│  Gráficos: Recharts + Canvas customizado (PDF)      │
│  PDF: jsPDF + jspdf-autotable                       │
└──────────────────────┬──────────────────────────────┘
                       │  fetch (sem CORS preflight)
                       │  GET  → query params
                       │  POST → Content-Type: text/plain
                       ▼
┌─────────────────────────────────────────────────────┐
│          Google Apps Script  (Code.gs)              │
│                                                     │
│  doGet  → retorna todas as abas como JSON           │
│  doPost → roteia ações:                             │
│    add_transaction · add_fixed · toggle_fixed       │
│    add_rendimento  · add_meta  · add_crypto         │
│    update_wallet   · transfer  · backup_drive       │
│    migrate         · init                           │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              Google Planilhas                       │
│                                                     │
│  Abas: Transacoes · FIXOS · Carteiras               │
│        Rendimentos · Metas · Crypto                 │
└─────────────────────────────────────────────────────┘
```

---

## Como começar

### 1. Configurar o backend no Google Planilhas

1. Crie uma nova planilha no Google Sheets
2. Abra **Extensões → Apps Script**
3. Cole o conteúdo de `Code.gs` e salve
4. Execute `initSheets()` uma vez para criar todas as abas e preencher as carteiras iniciais
5. Clique em **Implantar → Nova implantação**
   - Tipo: **App da Web**
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
6. Copie a URL gerada

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env`:

```env
VITE_API_URL=https://script.google.com/macros/s/<seu-deployment-id>/exec
VITE_API_TOKEN=seu_token_secreto   # deve bater com API_TOKEN no Code.gs
VITE_CDI_RATE=0.105                # taxa CDI anual para projeções
VITE_APP_NAME=FinTrack
VITE_APP_VERSION=v2.0
VITE_COINGECKO_URL=https://api.coingecko.com/api/v3
```

> **Importante:** atualize também o `API_TOKEN` no `Code.gs` para bater com o `VITE_API_TOKEN`.

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

### 4. Build para produção

```bash
npm run build
npm run preview
```

Faça o deploy da pasta `dist/` em qualquer host estático (Netlify, Vercel, GitHub Pages, Cloudflare Pages, etc.).

---

## Estrutura do projeto

```
fintrack/
├── public/
│   └── icons/             # Ícones SVG do app (manifesto PWA)
├── src/
│   ├── api/
│   │   ├── sheets.js      # fetchData + postAction (cliente do Apps Script)
│   │   └── coingecko.js   # Preços de crypto ao vivo
│   ├── components/
│   │   ├── charts/        # LineChart, BarChart, DonutChart, MiniLineChart
│   │   ├── modals/        # AddTransaction, AddFixed, AddCrypto, AddYield,
│   │   │                  # AddBet, Transfer, ExportPDF
│   │   └── ui/            # Card, Modal, Pill, TransactionItem, BottomNav
│   ├── hooks/
│   │   ├── useTransactions.js
│   │   ├── useWallets.js
│   │   └── useOfflineQueue.js
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Transactions.jsx
│   │   ├── Patrimony.jsx
│   │   ├── Reports.jsx
│   │   └── Profile.jsx
│   ├── store/
│   │   └── useFinanceStore.js   # Store global Zustand
│   └── utils/
│       ├── generatePDF.js       # Gerador de relatório jsPDF
│       ├── categories.js        # Definição de categorias e subcategorias
│       ├── formatters.js        # Helpers de moeda, data e percentual
│       └── scoreCalculator.js   # Cálculo do score de saúde financeira
├── Code.gs                      # Backend Apps Script (cole no editor)
├── .env                         # Segredos locais — nunca commitar (gitignored)
├── .env.example                 # Template seguro — pode commitar
└── vite.config.js
```

---

## Variáveis de ambiente

| Variável             | Obrigatória | Descrição                                                             |
| -------------------- | ----------- | --------------------------------------------------------------------- |
| `VITE_API_URL`       | ✅          | URL de implantação do Google Apps Script                              |
| `VITE_API_TOKEN`     | ✅          | Token secreto compartilhado (bate com `API_TOKEN` no `Code.gs`)       |
| `VITE_CDI_RATE`      | —           | Taxa CDI anual para projeções (padrão `0.105`)                        |
| `VITE_COINGECKO_URL` | —           | URL base da API CoinGecko (padrão `https://api.coingecko.com/api/v3`) |
| `VITE_APP_NAME`      | —           | Nome exibido no app (padrão `FinTrack`)                               |
| `VITE_APP_VERSION`   | —           | Versão exibida nos relatórios PDF (padrão `v2.0`)                     |

---

## Tipos de carteira

| Tipo     | Descrição                                                          |
| -------- | ------------------------------------------------------------------ |
| `cdi`    | Investimentos com rendimento CDI — aparece na projeção de 12 meses |
| `fisico` | Dinheiro físico — saldo atualizado manualmente                     |
| `crypto` | Criptomoedas — rastreadas separadamente com preços ao vivo         |

O **C6Bank** é uma carteira especial com dois sub-saldos (`cdb` e `conta_corrente`) gerenciados via card expansível na tela de Patrimônio.

---

## Triggers automáticos (opcional)

Execute `setupTriggers()` uma vez no editor do Apps Script para ativar:

| Trigger                        | Quando                  | O que faz                                                |
| ------------------------------ | ----------------------- | -------------------------------------------------------- |
| `processRecurringTransactions` | Dia 1 de cada mês, 08h  | Lança todas as despesas fixas ativas como transações     |
| `createMonthlyBackup`          | Dia 1 de cada mês, 07h  | Copia a planilha para `Meu Drive/FinTrack Backups/`      |
| `sendWeeklyReport`             | Toda segunda-feira, 08h | Envia um resumo semanal por e-mail para o dono do script |

---

## Stack tecnológica

| Camada                  | Tecnologia                     |
| ----------------------- | ------------------------------ |
| Framework UI            | React 18                       |
| Build                   | Vite 6                         |
| Gerenciamento de estado | Zustand 4                      |
| Roteamento              | React Router 6                 |
| Gráficos                | Recharts 2                     |
| Geração de PDF          | jsPDF 4 + jspdf-autotable 5    |
| Estilos                 | SCSS Modules                   |
| PWA                     | vite-plugin-pwa + Workbox      |
| Backend                 | Google Apps Script             |
| Banco de dados          | Google Sheets                  |
| Preços de crypto        | CoinGecko API (plano gratuito) |

---

## Segurança

- O token da API é um segredo compartilhado entre o frontend e o Apps Script — mantenha fora de repositórios públicos
- Todos os valores sensíveis ficam no `.env`, que está no `.gitignore`
- O Apps Script é publicado como "Executar como: Eu" — roda sob a sua conta Google e tem acesso ao seu Drive
- Não há camada de autenticação de usuário; o token é o único controle de acesso — não compartilhe a URL de implantação publicamente

---

<br />

<div align="center">

---

### 🇺🇸 English version below

---

</div>

<br />

---

<div align="center">

<img src="public/icons/money.svg" width="80" alt="FinTrack logo" />

# FinTrack

**Personal finance PWA — mobile-first, offline-capable, Google Sheets as database.**

</div>

---

## Overview

FinTrack is a zero-cost personal finance tracker that runs entirely on your own infrastructure — no server, no subscription, no data leaving your control. The UI is a React PWA installable on any phone; the backend is a Google Apps Script web app that reads and writes directly to a Google Spreadsheet you own.

---

## Features

| Area             | What it does                                                                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**    | Month summary — income, expenses, balance; quick-add FAB with 5 transaction types; mini sparkline per category                                                                            |
| **Transactions** | Full transaction list with month picker and category filter; **Fixos** tab for recurring expenses with toggle active/inactive and due-date alerts                                         |
| **Patrimony**    | Consolidated net worth across all wallets; C6Bank expandable card (CDB + Conta Corrente); crypto portfolio with live CoinGecko prices; 12-month CDI projection; patrimony evolution chart |
| **Reports**      | Monthly bar chart (income vs expenses); donut chart by category; filterable by month range and category; financial health score                                                           |
| **Export PDF**   | Full bilingual (PT/EN) PDF report with cover page, per-month transaction tables, summary page, bar chart, pie chart, and patrimony evolution                                              |
| **Profile**      | Editable name, API URL and token; financial health score; Drive backup; data migration                                                                                                    |
| **PWA**          | Installable on iOS and Android; offline queue for failed requests; service worker with stale-while-revalidate caching                                                                     |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                React PWA  (Vite)                    │
│                                                     │
│  Pages: Home · Transactions · Patrimony             │
│         Reports · Profile                           │
│                                                     │
│  State: Zustand (useFinanceStore)                   │
│  Charts: Recharts + custom Canvas (PDF only)        │
│  PDF: jsPDF + jspdf-autotable                       │
└──────────────────────┬──────────────────────────────┘
                       │  fetch (no CORS preflight)
                       │  GET  → query params
                       │  POST → Content-Type: text/plain
                       ▼
┌─────────────────────────────────────────────────────┐
│          Google Apps Script  (Code.gs)              │
│                                                     │
│  doGet  → returns all sheets as JSON                │
│  doPost → routes actions:                           │
│    add_transaction · add_fixed · toggle_fixed       │
│    add_rendimento  · add_meta  · add_crypto         │
│    update_wallet   · transfer  · backup_drive       │
│    migrate         · init                           │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              Google Spreadsheet                     │
│                                                     │
│  Tabs: Transacoes · FIXOS · Carteiras               │
│        Rendimentos · Metas · Crypto                 │
└─────────────────────────────────────────────────────┘
```

---

## Getting Started

### 1. Set up the Google Spreadsheet backend

1. Create a new Google Spreadsheet
2. Open **Extensions → Apps Script**
3. Paste the contents of `Code.gs` and save
4. Run `initSheets()` once to create all tabs and seed the initial wallet rows
5. Click **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the deployment URL

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=https://script.google.com/macros/s/<your-deployment-id>/exec
VITE_API_TOKEN=your_secret_token   # must match API_TOKEN in Code.gs
VITE_CDI_RATE=0.105                # annual CDI rate for projections
VITE_APP_NAME=FinTrack
VITE_APP_VERSION=v2.0
VITE_COINGECKO_URL=https://api.coingecko.com/api/v3
```

> **Important:** also update `API_TOKEN` in `Code.gs` to match `VITE_API_TOKEN`.

### 3. Install and run

```bash
npm install
npm run dev
```

### 4. Build for production

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages, etc.).

---

## Project Structure

```
fintrack/
├── public/
│   └── icons/             # SVG app icons (PWA manifest)
├── src/
│   ├── api/
│   │   ├── sheets.js      # fetchData + postAction (Google Apps Script client)
│   │   └── coingecko.js   # Live crypto prices
│   ├── components/
│   │   ├── charts/        # LineChart, BarChart, DonutChart, MiniLineChart
│   │   ├── modals/        # AddTransaction, AddFixed, AddCrypto, AddYield,
│   │   │                  # AddBet, Transfer, ExportPDF
│   │   └── ui/            # Card, Modal, Pill, TransactionItem, BottomNav
│   ├── hooks/
│   │   ├── useTransactions.js
│   │   ├── useWallets.js
│   │   └── useOfflineQueue.js
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Transactions.jsx
│   │   ├── Patrimony.jsx
│   │   ├── Reports.jsx
│   │   └── Profile.jsx
│   ├── store/
│   │   └── useFinanceStore.js   # Zustand global store
│   └── utils/
│       ├── generatePDF.js       # jsPDF report generator
│       ├── categories.js        # Category/subcategory definitions
│       ├── formatters.js        # Currency, date, percent helpers
│       └── scoreCalculator.js   # Financial health score
├── Code.gs                      # Google Apps Script backend (paste into Apps Script)
├── .env                         # Local secrets — never commit (gitignored)
├── .env.example                 # Safe template — commit this
└── vite.config.js
```

---

## Environment Variables

| Variable             | Required | Description                                                         |
| -------------------- | -------- | ------------------------------------------------------------------- |
| `VITE_API_URL`       | ✅       | Google Apps Script deployment URL                                   |
| `VITE_API_TOKEN`     | ✅       | Shared secret token (matches `API_TOKEN` in `Code.gs`)              |
| `VITE_CDI_RATE`      | —        | Annual CDI rate for projections (default `0.105`)                   |
| `VITE_COINGECKO_URL` | —        | CoinGecko API base URL (default `https://api.coingecko.com/api/v3`) |
| `VITE_APP_NAME`      | —        | App display name (default `FinTrack`)                               |
| `VITE_APP_VERSION`   | —        | Version shown in PDF reports (default `v2.0`)                       |

---

## Wallet Types

| Type     | Description                                                         |
| -------- | ------------------------------------------------------------------- |
| `cdi`    | Investments tracked with CDI yield — appears in 12-month projection |
| `fisico` | Physical cash — balance updated manually                            |
| `crypto` | Crypto holdings — tracked separately with live prices               |

**C6Bank** is a special wallet with two sub-balances (`cdb` and `conta_corrente`) managed via an expandable card in the Patrimony screen.

---

## Automatic Triggers (optional)

Run `setupTriggers()` once in the Apps Script editor to enable:

| Trigger                        | When                      | What                                                   |
| ------------------------------ | ------------------------- | ------------------------------------------------------ |
| `processRecurringTransactions` | 1st of every month, 08:00 | Posts all active fixed expenses as transactions        |
| `createMonthlyBackup`          | 1st of every month, 07:00 | Copies the spreadsheet to `My Drive/FinTrack Backups/` |
| `sendWeeklyReport`             | Every Monday, 08:00       | Sends a weekly summary email to the script owner       |

---

## Tech Stack

| Layer            | Technology                  |
| ---------------- | --------------------------- |
| UI framework     | React 18                    |
| Build tool       | Vite 6                      |
| State management | Zustand 4                   |
| Routing          | React Router 6              |
| Charts           | Recharts 2                  |
| PDF generation   | jsPDF 4 + jspdf-autotable 5 |
| Styles           | SCSS Modules                |
| PWA              | vite-plugin-pwa + Workbox   |
| Backend          | Google Apps Script          |
| Database         | Google Sheets               |
| Crypto prices    | CoinGecko API (free tier)   |

---

## Security Notes

- The API token is a shared secret between the frontend and Apps Script — keep it out of public repos
- All sensitive values live in `.env` which is gitignored
- The Apps Script is deployed as "Execute as: Me" — it runs under your Google account and has access to your Drive
- There is no user authentication layer; the token is the only access control — do not share the deployment URL publicly

---

<div align="center">

Feito com React + Google Sheets · sem servidor, sem assinatura, sem complicação

</div>
