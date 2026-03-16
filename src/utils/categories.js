export const CATEGORIES = {
  // Saída
  'Alimentação': {
    color: '#1d9e75',
    flow: 'saida',
    subcategories: ['Restaurante', 'Mercado', 'iFood', 'Lanche rápido', 'Bebida']
  },
  'Assinaturas': {
    color: '#7f77dd',
    flow: 'saida',
    subcategories: ['Streaming', 'Saúde e treino', 'Software e dev', 'Cloud e infra', 'Telecom']
  },
  'Compras': {
    color: '#d85a30',
    flow: 'saida',
    subcategories: ['Roupas e calçados', 'Eletrônicos', 'Ferramentas e casa', 'Presentes']
  },
  'Transporte': {
    color: '#378add',
    flow: 'saida',
    subcategories: ['Uber e 99', 'Gasolina', 'Ônibus e trem', 'Pedágio', 'Estacionamento']
  },
  'Saúde': {
    color: '#ef9f27',
    flow: 'saida',
    subcategories: ['Consultas', 'Psicólogo', 'Fisio e quiro', 'Farmácia', 'Suplementos']
  },
  'Lazer': {
    color: '#d4537e',
    flow: 'saida',
    subcategories: ['Futebol e esporte', 'Cinema e eventos', 'Viagem', 'Hobbies', 'Balada']
  },
  'Educação': {
    color: '#5dcaa5',
    flow: 'saida',
    subcategories: ['Cursos', 'Livros', 'Faculdade', 'Comunidades']
  },
  'Moradia': {
    color: '#888780',
    flow: 'saida',
    subcategories: ['Aluguel', 'Contas', 'Internet', 'Manutenção']
  },
  // Entrada
  'Receita': {
    color: '#1d9e75',
    flow: 'entrada',
    subcategories: ['Salário', 'Freelance e vendas', 'Reembolso', 'Presente']
  },
  'Apostas e jogos': {
    color: '#ef9f27',
    flow: 'entrada',
    subcategories: ['Ganho', 'Perda']
  },
  'Patrimônio': {
    color: '#5dcaa5',
    flow: 'entrada',
    subcategories: ['Aporte em carteira', 'Resgate', 'Transferência entre carteiras']
  }
}

export const EXPENSE_CATEGORIES = Object.entries(CATEGORIES)
  .filter(([, v]) => v.flow === 'saida')
  .map(([name, v]) => ({ name, ...v }))

export const INCOME_CATEGORIES = Object.entries(CATEGORIES)
  .filter(([, v]) => v.flow === 'entrada')
  .map(([name, v]) => ({ name, ...v }))

export const getCategoryColor = (name) =>
  CATEGORIES[name]?.color ?? '#888890'

export const getCategorySubcategories = (name) =>
  CATEGORIES[name]?.subcategories ?? []

export const PAYMENT_METHODS = [
  { id: 'pix',           label: 'PIX' },
  { id: 'cartao_credito',label: 'Crédito' },
  { id: 'cartao_debito', label: 'Débito' },
  { id: 'dinheiro',      label: 'Dinheiro' },
  { id: 'transferencia', label: 'Transferência' }
]

// Category icons as simple emoji / letter abbreviation fallback
export const CATEGORY_ICONS = {
  'Alimentação':    '🍽',
  'Assinaturas':    '📱',
  'Compras':        '🛍',
  'Transporte':     '🚗',
  'Saúde':          '💊',
  'Lazer':          '🎮',
  'Educação':       '📚',
  'Moradia':        '🏠',
  'Receita':        '💰',
  'Apostas e jogos':'🎲',
  'Patrimônio':     '💼'
}
