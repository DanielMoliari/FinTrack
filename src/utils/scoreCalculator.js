/**
 * Calculates the financial health score (0–100)
 * Based on: savings rate (40pts), patrimony growth (30pts), fixed vs variable (30pts)
 */
export const calculateScore = ({ receita, gasto, gastoFixo, patrimonioAtual, patrimonioAnterior }) => {
  let score = 0

  // 1. Savings rate (peso 40)
  if (receita > 0) {
    const pctGuardado = ((receita - gasto) / receita) * 100
    if (pctGuardado >= 20) score += 40
    else if (pctGuardado >= 10) score += 25
    else if (pctGuardado >= 0) score += 10
  }

  // 2. Patrimony growth (peso 30)
  if (patrimonioAtual > patrimonioAnterior) score += 30
  else if (patrimonioAtual === patrimonioAnterior) score += 15

  // 3. Fixed vs variable (peso 30)
  if (gasto > 0) {
    const pctFixos = (gastoFixo / gasto) * 100
    if (pctFixos <= 50) score += 30
    else if (pctFixos <= 70) score += 15
  }

  return Math.min(100, Math.max(0, score))
}

export const getScoreLabel = (score) => {
  if (score >= 80) return 'Excelente'
  if (score >= 60) return 'Bom'
  if (score >= 40) return 'Atentar'
  return 'Crítico'
}

export const getScoreColor = (score) => {
  if (score >= 80) return '#1d9e75'
  if (score >= 60) return '#378add'
  if (score >= 40) return '#ef9f27'
  return '#d85a30'
}
