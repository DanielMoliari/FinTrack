# FinTrack — Spec completo do projeto

## Visão geral

App de finanças pessoais PWA (Progressive Web App) com estilo visual inspirado no Revolut dark mode.
Backend: Google Apps Script publicado como Web App, usando Google Sheets como banco de dados.
Frontend: React + Vite, SCSS modules, Recharts para gráficos, Workbox para PWA.

URL da API: https://script.google.com/macros/s/AKfycbwAViJnGeXuDlEf0aaIzu427gvLG9JGn420w7HWS5LYg9zyAB4Olw2G9nmvxlpnTKtN4Q/exec
(usar header `X-API-Token: fintrack2026` em todas as requisições)

---

## Design system

### Estilo visual
Revolut dark mode — fundo quase preto profundo, cards com bordas finíssimas, tipografia grande
nos valores monetários, hierarquia de cor clara, bottom navigation com 5 abas.

### Paleta de cores
```
--color-bg-deep:      #08080f   /* fundo principal */
--color-bg-surface:   #0f0f1a   /* cards e modais */
--color-bg-elevated:  #131320   /* botões e inputs */
--color-border:       #1e1e30   /* bordas sutis */
--color-border-hover: #2a2a3e   /* bordas hover */

--color-accent-blue:  #378add   /* ações primárias, links */
--color-positive:     #1d9e75   /* entradas, ganhos, positivo */
--color-negative:     #d85a30   /* saídas, gastos */
--color-warning:      #ef9f27   /* alertas, aposta, dinheiro físico */
--color-purple:       #7f77dd   /* carteira 99Pay */

--color-text-primary:   #e0e0e8  /* texto principal */
--color-text-secondary: #888890  /* texto secundário */
--color-text-muted:     #3a3a52  /* metadados, labels */
--color-text-disabled:  #2a2a45  /* desabilitado */
```

### Tipografia
- Fonte: system-ui, -apple-system, sans-serif (sem Google Fonts — carrega mais rápido)
- Saldo principal: 36-38px, font-weight 500, letter-spacing -1.5px
- Títulos de tela: 15px, font-weight 500
- Títulos de seção: 13px, font-weight 500
- Itens de lista: 13px, font-weight 400
- Metadados/labels: 11px, color muted, uppercase, letter-spacing 0.5px
- Valores monetários grandes: sempre letter-spacing negativo (-0.5px a -1.5px)

### Componentes base

**Cards:**
- background: var(--color-bg-surface)
- border: 0.5px solid var(--color-border)
- border-radius: 14px
- padding: 12-14px

**Bottom navigation (5 abas):**
- background: #0a0a14
- border-top: 0.5px solid #131320
- padding: 9px 0 15px (extra embaixo para safe area)
- ícones SVG 18x18px, stroke apenas (fill: none)
- label: 8.5px
- ativo: stroke e label #ffffff
- inativo: stroke e label #2a2a45

**Inputs:**
- background: var(--color-bg-elevated)
- border: 0.5px solid var(--color-border)
- border-radius: 8px
- font-size: 15-20px para valor monetário

**Pills/filtros:**
- border-radius: 99px
- padding: 5px 11px
- font-size: 11px
- ativo: background #131320, color #e0e0e8, border-color #2a2a40
- inativo: background transparent, color #555, border #1e1e30

---

## Estrutura de navegação

5 abas no bottom nav, nesta ordem:
1. Início (ícone: casa)
2. Transações (ícone: lista com linhas)
3. Relatórios (ícone: gráfico de linhas com eixo)
4. Patrimônio (ícone: barras crescentes)
5. Perfil (ícone: pessoa/avatar)

---

## Telas

### 1. Início
**Header:** "Bom dia/Tarde/Noite," + nome do usuário
**Saldo disponível:** valor grande com variação % do mês em verde
**Mini gráfico de linha:** evolução do saldo nos últimos 6 meses (azul, com área preenchida)
**4 botões de ação rápida** (círculos 56px com ícone + label embaixo):
  - Adicionar — abre modal de nova transação
  - Transferir — abre modal de transferência entre carteiras
  - Aposta — abre modal de registro rápido de aposta
  - Rendimento — abre modal de registro de rendimento de carteira

**Últimas transações:** seção com header "Últimos gastos" + link "Ver todos"
- Lista com ícone colorido (círculo/quadrado por categoria), nome, data/categoria, valor
- Entradas em verde (#1d9e75), saídas em branco (#e0e0e8)
- Máximo 5 itens na home

**Modais da home:**

*Modal Adicionar:*
- Toggle Saída / Entrada
- Input grande de valor monetário
- Seletor de categoria (grid de ícones)
- Seletor de subcategoria
- Seletor de carteira
- Campo descrição (opcional)
- Seletor de método de pagamento
- Toggle "É fixo?" (se sim, vai para aba FIXOS também)
- Botão Salvar

*Modal Transferir:*
- Seletor "De" (carteira origem)
- Seletor "Para" (carteira destino)
- Input de valor
- Botão Confirmar

*Modal Aposta:*
- Toggle Ganho (verde) / Perda (coral)
- Input de valor
- Saldo corrido visível: "+R$ X,XX" ou "-R$ X,XX"
- Botão Registrar

*Modal Rendimento:*
- Seletor de carteira (apenas CDI e Físico — não crypto)
- Mês/ano de referência
- Input de valor rendido
- Saldo atual calculado
- Botão Salvar

---

### 2. Transações
**Header:** "Transações"
**Mini resumo do período:** 3 cards inline — Gastos | Receitas | Saldo
**Filtros de período (pills horizontais scrolláveis):**
  Este mês · Semana · [mês anterior] · [ano atual] · Período livre
**Lista agrupada por data** (label de data separador)
- Cada item: ícone categoria, nome, subcategoria/categoria, valor
- Puxar pra baixo recarrega (pull to refresh)
- Botão flutuante "+" no canto inferior direito para nova transação

---

### 3. Relatórios
**Header:** "Relatórios"
**Filtros de período (pills):** Este mês · [mês anterior] · [ano] · Período

**Seções em ordem:**

1. **Gastos por mês** (gráfico de barras)
   - 6 meses, barra do mês atual em azul (#378add), demais em #1e1e35
   - Label com média e valor atual embaixo

2. **Por categoria** (gráfico de pizza/donut)
   - Donut com legenda à direita: nome, percentual
   - Cores por categoria (ver seção Categorias)

3. **Receita vs Gastos** (gráfico de linha dupla)
   - Verde = receita, coral = gastos
   - Legenda embaixo

4. **Apostas — saldo corrido**
   - Total histórico em destaque verde
   - Valor do mês atual
   - Barra de progresso (% de ganhos)
   - Contagem de registros

5. **Top categorias do mês** (barras horizontais)
   - Ranking com barra proporcional + valor
   - Cor da barra = cor da categoria

6. **Score de saúde financeira**
   - Número 0-100 em verde
   - Barra de progresso
   - Texto explicativo curto

7. **Ações:**
   - Exportar PDF
   - Comparar meses
   - Ver metas

---

### 4. Patrimônio
**Header:** "Patrimônio"
**Total consolidado:** valor grande + variação do mês
**Gráfico de linha:** evolução patrimonial (verde, área preenchida)
**Cards de carteiras** (uma por carteira cadastrada):
  - Barra colorida lateral (cor da carteira)
  - Nome + tipo/CDI%
  - Saldo atual + rendimento do mês

**Seção Crypto** (aparece quando há criptos cadastradas):
  - Valor total em reais
  - Lista: nome/símbolo, quantidade, preço entrada, cotação atual (CoinGecko), variação %

**Projeção CDI — 12 meses:**
  - Gráfico de linhas tracejadas (uma por carteira CDI)
  - Legenda com cores

---

### 5. Perfil
**Avatar circular** com inicial do nome, borda azul
**Nome + localização**

**Score de saúde financeira** (card destacado):
  - Número grande verde
  - Barra de progresso
  - Texto de avaliação

**Seção Configurações:**
  - URL da API (editável)
  - Token de autenticação (editável)
  - Alertas por categoria (abre sub-tela)
  - Lembrete mensal (toggle)

**Seção Dados:**
  - Exportar PDF
  - Backup no Drive
  - Migrar dados antigos

---

## Schema do Google Sheets

### Aba: Transacoes
Colunas: id | data_hora | valor | tipo_fluxo | categoria | subcategoria | descricao | metodo_pagamento | carteira_id | tags

- id: string único (ex: txn_20260314_001)
- data_hora: dd/MM/yyyy - HH:mm:ss
- valor: number float puro (sem R$, sem vírgula — ex: 37.00)
- tipo_fluxo: "entrada" | "saida"
- categoria: ver lista abaixo
- subcategoria: ver lista abaixo
- descricao: string livre
- metodo_pagamento: "pix" | "cartao_credito" | "cartao_debito" | "dinheiro" | "transferencia"
- carteira_id: "99pay" | "c6bank" | "fisico" | "crypto" | "geral"
- tags: string separada por vírgula (ex: "viagem,presente")

### Aba: FIXOS
Colunas: id | nome | valor | tipo_fluxo | categoria | subcategoria | dia_vencimento | metodo_pagamento | carteira_id | ativo | data_inicio | observacao

- id: string (ex: fix_spotify)
- nome: string (ex: Spotify)
- valor: number float
- tipo_fluxo: "entrada" | "saida"
- dia_vencimento: number 1-31
- metodo_pagamento: "pix" | "cartao_credito" | "debito_automatico"
- ativo: TRUE | FALSE
- data_inicio: dd/MM/yyyy
- observacao: string livre

### Aba: Carteiras
Colunas: id | nome | cor | tipo | cdi_percentual | saldo_inicial | data_criacao | ativo

- id: string (ex: 99pay, c6bank, fisico, crypto)
- nome: string (ex: 99Pay)
- cor: hex (ex: #7f77dd)
- tipo: "cdi" | "fisico" | "crypto"
- cdi_percentual: number (ex: 100 para 100% do CDI, 103 para 103%)
- saldo_inicial: number float
- data_criacao: dd/MM/yyyy
- ativo: TRUE | FALSE

Carteiras iniciais:
| id     | nome           | cor     | tipo  | cdi  |
|--------|----------------|---------|-------|------|
| 99pay  | 99Pay          | #7f77dd | cdi   | 100  |
| c6bank | C6Bank         | #1d9e75 | cdi   | 103  |
| fisico | Dinheiro físico| #ef9f27 | fisico| —    |
| crypto | Crypto         | #378add | crypto| —    |

### Aba: Rendimentos
Colunas: id | carteira_id | mes | ano | valor_rendido | saldo_final | cdi_vigente

- id: string (ex: rend_99pay_032026)
- carteira_id: string
- mes: number 1-12
- ano: number (ex: 2026)
- valor_rendido: number float
- saldo_final: number float
- cdi_vigente: number (CDI % ao ano vigente no mês)

### Aba: Metas
Colunas: id | nome | valor_alvo | valor_atual | prazo | carteira_id | ativo | data_criacao

- id: string (ex: meta_reserva)
- nome: string
- valor_alvo: number float
- valor_atual: number float (atualizado manualmente)
- prazo: dd/MM/yyyy
- carteira_id: string (carteira vinculada)
- ativo: TRUE | FALSE

### Aba: Crypto
Colunas: id | simbolo | nome | quantidade | preco_entrada | data_compra | carteira_id | ativo

- id: string (ex: crypto_btc_001)
- simbolo: string (ex: BTC, ETH — deve ser ID válido na CoinGecko)
- nome: string (ex: Bitcoin)
- quantidade: number float
- preco_entrada: number float (em reais)
- data_compra: dd/MM/yyyy
- carteira_id: sempre "crypto"
- ativo: TRUE | FALSE

---

## Categorias e subcategorias

### Saída

| Categoria       | Cor     | Subcategorias                                                        |
|-----------------|---------|----------------------------------------------------------------------|
| Alimentação     | #1d9e75 | Restaurante · Mercado · iFood · Lanche rápido · Bebida               |
| Assinaturas     | #7f77dd | Streaming · Saúde e treino · Software e dev · Cloud e infra · Telecom|
| Compras         | #d85a30 | Roupas e calçados · Eletrônicos · Ferramentas e casa · Presentes      |
| Transporte      | #378add | Uber e 99 · Gasolina · Ônibus e trem · Pedágio · Estacionamento       |
| Saúde           | #ef9f27 | Consultas · Psicólogo · Fisio e quiro · Farmácia · Suplementos        |
| Lazer           | #d4537e | Futebol e esporte · Cinema e eventos · Viagem · Hobbies · Balada      |
| Educação        | #5dcaa5 | Cursos · Livros · Faculdade · Comunidades                             |
| Moradia         | #888780 | Aluguel · Contas · Internet · Manutenção                              |

### Entrada

| Categoria        | Cor     | Subcategorias                                          |
|------------------|---------|--------------------------------------------------------|
| Receita          | #1d9e75 | Salário · Freelance e vendas · Reembolso · Presente    |
| Apostas e jogos  | #ef9f27 | Ganho · Perda                                          |
| Patrimônio       | #5dcaa5 | Aporte em carteira · Resgate · Transferência           |

---

## Endpoints da API (Apps Script)

### GET /
Retorna todos os dados. Parâmetros opcionais:
- `?sheet=Transacoes` — filtra por aba
- `?mes=3&ano=2026` — filtra transações por mês/ano
- `?carteira=99pay` — filtra por carteira

Resposta:
```json
{
  "transactions": [...],
  "fixed": [...],
  "wallets": [...],
  "rendimentos": [...],
  "metas": [...],
  "crypto": [...]
}
```

### POST /
Body JSON array. Campo `action` define o que fazer:
- `action: "add_transaction"` — adiciona em Transacoes
- `action: "add_fixed"` — adiciona em FIXOS
- `action: "add_rendimento"` — adiciona em Rendimentos
- `action: "add_meta"` — adiciona em Metas
- `action: "add_crypto"` — adiciona em Crypto
- `action: "update_wallet"` — atualiza saldo de carteira
- `action: "transfer"` — registra transferência entre carteiras

Header obrigatório: `X-API-Token: fintrack2026`

---

## Integração CoinGecko

API pública, sem autenticação, gratuita.
Endpoint de cotação: `https://api.coingecko.com/api/v3/simple/price?ids={ids}&vs_currencies=brl`
Exemplo: `?ids=bitcoin,ethereum&vs_currencies=brl`
Resposta: `{ "bitcoin": { "brl": 520000 }, "ethereum": { "brl": 18000 } }`

IDs comuns: bitcoin, ethereum, solana, bnb, cardano
Para tokens de AirDrop: buscar o ID correto em coingecko.com/coins/list

---

## Score de saúde financeira

Calculado no frontend com os dados do mês atual. Fórmula:

```
score = 0

// % da renda guardada (peso 40)
pct_guardado = (receita_total - gasto_total) / receita_total * 100
if pct_guardado >= 20: score += 40
elif pct_guardado >= 10: score += 25
elif pct_guardado >= 0: score += 10

// Crescimento patrimonial (peso 30)
if patrimonio_atual > patrimonio_mes_anterior: score += 30
elif patrimonio_atual == patrimonio_mes_anterior: score += 15

// Gastos fixos vs variáveis (peso 30)
pct_fixos = gasto_fixo / gasto_total * 100
if pct_fixos <= 50: score += 30
elif pct_fixos <= 70: score += 15

score máximo: 100
```

Classificações:
- 80-100: Excelente
- 60-79: Bom
- 40-59: Atentar
- 0-39: Crítico

---

## PWA

### manifest.json
```json
{
  "name": "FinTrack",
  "short_name": "FinTrack",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#08080f",
  "theme_color": "#08080f",
  "orientation": "portrait"
}
```

### Service Worker (Workbox)
- Cache de assets estáticos (JS, CSS, fontes)
- Cache de respostas da API com stale-while-revalidate (30 min)
- Fila offline: transações salvas localmente quando sem internet, enviadas ao reconectar
- Background sync para envio da fila offline

---

## Stack técnica

```
fintrack/
├── public/
│   ├── manifest.json
│   └── icons/ (192px e 512px)
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── styles/
│   │   ├── _variables.scss    (tokens de cor e tipografia)
│   │   ├── _reset.scss
│   │   └── global.scss
│   ├── api/
│   │   ├── sheets.js          (GET/POST para Apps Script)
│   │   └── coingecko.js       (cotações crypto)
│   ├── store/
│   │   └── useFinanceStore.js (Zustand — estado global)
│   ├── hooks/
│   │   ├── useTransactions.js
│   │   ├── useWallets.js
│   │   └── useOfflineQueue.js
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Transactions.jsx
│   │   ├── Reports.jsx
│   │   ├── Patrimony.jsx
│   │   └── Profile.jsx
│   ├── components/
│   │   ├── BottomNav.jsx
│   │   ├── modals/
│   │   │   ├── AddTransaction.jsx
│   │   │   ├── Transfer.jsx
│   │   │   ├── AddBet.jsx
│   │   │   └── AddYield.jsx
│   │   ├── charts/
│   │   │   ├── BarChart.jsx
│   │   │   ├── DonutChart.jsx
│   │   │   ├── LineChart.jsx
│   │   │   └── MiniLineChart.jsx
│   │   └── ui/
│   │       ├── Card.jsx
│   │       ├── Pill.jsx
│   │       ├── Modal.jsx
│   │       └── TransactionItem.jsx
│   └── utils/
│       ├── formatters.js      (formatar moeda, datas)
│       ├── categories.js      (lista de categorias + cores)
│       └── scoreCalculator.js (lógica do score)
├── Code.gs                    (Apps Script — backend)
├── SPEC.md                    (este arquivo)
├── vite.config.js
├── package.json
└── index.html
```

### Dependências principais
```json
{
  "react": "^18",
  "react-dom": "^18",
  "react-router-dom": "^6",
  "recharts": "^2",
  "zustand": "^4",
  "vite-plugin-pwa": "^0.17",
  "workbox-window": "^7",
  "sass": "^1"
}
```

---

## Dados reais para migração

O usuário tem 113 transações históricas (fev-mar 2026) no formato antigo.
O Apps Script (Code.gs) inclui função `migrateOldData()` que converte automaticamente
para o novo schema ao ser executada uma vez.

Mapeamento de migração já definido:
- Investimentos/Resgate com "Aposta" na descrição → Apostas e jogos / Ganho
- Outros/Vendas → Receita / Freelance e vendas
- Outros/Reembolso → Receita / Reembolso
- Salário/Mensal → Receita / Salário
- Compras/Ferramentas com "Curso" → Educação / Cursos
- Compras/Ferramentas com "Telegram" → Educação / Comunidades
- Assinaturas/Geral → Assinaturas / Telecom
- Transporte/Geral → Transporte / Pedágio
- Valor converte de "R$37,00" para 37.00 (float)
- carteira_id = "geral" para todos os dados antigos

---

## Instruções para o Claude Code

1. Leia este SPEC.md completamente antes de criar qualquer arquivo
2. Use o Code.gs como referência de todos os endpoints disponíveis
3. Comece pela estrutura de pastas + vite.config.js + package.json
4. Implemente _variables.scss com todos os tokens de cor antes de qualquer componente
5. Construa na ordem: api/ → store/ → components/ui/ → pages/ → modals/ → charts/
6. Cada componente deve usar os tokens SCSS — zero cores hardcoded no JSX
7. Mobile first — o layout base é para tela de 375-430px, desktop é bonus
8. Teste o build com `npm run build` antes de considerar completo
