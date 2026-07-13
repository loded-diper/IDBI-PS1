import { getDb } from '../../db';

interface HealthScoreInput {
  personaId: string;
}

interface HealthScoreResult {
  overall: number;
  components: {
    savingsRate: { score: number; value: number; weight: number };
    debtToIncome: { score: number; value: number; weight: number };
    emergencyFund: { score: number; value: number; weight: number };
    investmentDiversification: { score: number; value: number; weight: number };
  };
  grade: string;
  summary: string;
}

export function computeHealthScore({ personaId }: HealthScoreInput): HealthScoreResult {
  const db = getDb();

  // Get monthly income (average of credit transactions over last 3 months)
  const incomeResult = db.prepare(`
    SELECT AVG(monthly_income) as avg_income FROM (
      SELECT strftime('%Y-%m', date) as month, SUM(amount) as monthly_income
      FROM transactions
      WHERE persona_id = ? AND type = 'credit'
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC
      LIMIT 3
    )
  `).get(personaId) as any;
  const monthlyIncome = incomeResult?.avg_income || 0;

  // Get monthly expenses (average of debit transactions over last 3 months)
  const expenseResult = db.prepare(`
    SELECT AVG(monthly_expenses) as avg_expenses FROM (
      SELECT strftime('%Y-%m', date) as month, SUM(amount) as monthly_expenses
      FROM transactions
      WHERE persona_id = ? AND type = 'debit'
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC
      LIMIT 3
    )
  `).get(personaId) as any;
  const monthlyExpenses = expenseResult?.avg_expenses || 0;

  // Get total savings (all savings accounts)
  const savingsResult = db.prepare(`
    SELECT COALESCE(SUM(balance), 0) as total_savings
    FROM accounts
    WHERE persona_id = ? AND type = 'savings'
  `).get(personaId) as any;
  const totalSavings = savingsResult?.total_savings || 0;

  // Get total debt (outstanding loans + credit card balance)
  const loanResult = db.prepare(`
    SELECT COALESCE(SUM(outstanding), 0) as total_loans
    FROM loans
    WHERE persona_id = ?
  `).get(personaId) as any;
  const ccResult = db.prepare(`
    SELECT COALESCE(SUM(ABS(balance)), 0) as total_cc
    FROM accounts
    WHERE persona_id = ? AND type = 'credit_card' AND balance < 0
  `).get(personaId) as any;
  const totalDebt = (loanResult?.total_loans || 0) + (ccResult?.total_cc || 0);

  // Get investment diversification
  const investmentTypes = db.prepare(`
    SELECT COUNT(DISTINCT type) as type_count, COUNT(*) as total_count
    FROM investments
    WHERE persona_id = ?
  `).get(personaId) as any;

  // ─── 1. Savings Rate Score (30%) ──────────────────────────────────────
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
  let savingsRateScore: number;
  if (savingsRate >= 30) savingsRateScore = 100;
  else if (savingsRate >= 20) savingsRateScore = 80;
  else if (savingsRate >= 10) savingsRateScore = 60;
  else if (savingsRate >= 0) savingsRateScore = 40;
  else savingsRateScore = 10;

  // ─── 2. Debt-to-Income Score (25%) ────────────────────────────────────
  const monthlyDebtPayments = (loanResult?.total_loans || 0) > 0
    ? (db.prepare(`SELECT COALESCE(SUM(emi), 0) as total_emi FROM loans WHERE persona_id = ?`).get(personaId) as any)?.total_emi || 0
    : 0;
  const dti = monthlyIncome > 0 ? (monthlyDebtPayments / monthlyIncome) * 100 : 0;
  let dtiScore: number;
  if (dti <= 10) dtiScore = 100;
  else if (dti <= 20) dtiScore = 85;
  else if (dti <= 30) dtiScore = 70;
  else if (dti <= 40) dtiScore = 50;
  else if (dti <= 50) dtiScore = 30;
  else dtiScore = 10;

  // ─── 3. Emergency Fund Coverage (25%) ─────────────────────────────────
  const emergencyMonths = monthlyExpenses > 0 ? totalSavings / monthlyExpenses : 0;
  let efScore: number;
  if (emergencyMonths >= 6) efScore = 100;
  else if (emergencyMonths >= 4) efScore = 80;
  else if (emergencyMonths >= 3) efScore = 65;
  else if (emergencyMonths >= 2) efScore = 45;
  else if (emergencyMonths >= 1) efScore = 25;
  else efScore = 10;

  // ─── 4. Investment Diversification (20%) ──────────────────────────────
  const typeCount = investmentTypes?.type_count || 0;
  const totalInvestments = investmentTypes?.total_count || 0;
  let divScore: number;
  if (typeCount >= 3 && totalInvestments >= 5) divScore = 100;
  else if (typeCount >= 2 && totalInvestments >= 3) divScore = 75;
  else if (typeCount >= 1 && totalInvestments >= 2) divScore = 50;
  else if (totalInvestments >= 1) divScore = 30;
  else divScore = 0;

  // ─── Overall Score ────────────────────────────────────────────────────
  const overall = Math.round(
    savingsRateScore * 0.30 +
    dtiScore * 0.25 +
    efScore * 0.25 +
    divScore * 0.20
  );

  let grade: string;
  let summary: string;
  if (overall >= 85) { grade = 'Excellent'; summary = 'Your financial health is outstanding. Keep up the great work!'; }
  else if (overall >= 70) { grade = 'Good'; summary = 'Your finances are in good shape with some room for improvement.'; }
  else if (overall >= 55) { grade = 'Fair'; summary = 'Your financial health is average. Consider strengthening your savings and reducing debt.'; }
  else if (overall >= 40) { grade = 'Needs Attention'; summary = 'Several areas of your finances need improvement. Focus on building an emergency fund.'; }
  else { grade = 'Critical'; summary = 'Your financial health requires immediate attention. Prioritize debt reduction and emergency savings.'; }

  return {
    overall,
    components: {
      savingsRate: { score: savingsRateScore, value: Math.round(savingsRate * 10) / 10, weight: 30 },
      debtToIncome: { score: dtiScore, value: Math.round(dti * 10) / 10, weight: 25 },
      emergencyFund: { score: efScore, value: Math.round(emergencyMonths * 10) / 10, weight: 25 },
      investmentDiversification: { score: divScore, value: typeCount, weight: 20 },
    },
    grade,
    summary,
  };
}
