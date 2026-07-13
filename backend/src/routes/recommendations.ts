import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { getDb } from '../db';

const router = Router();
router.use(authMiddleware);

router.get('/', (req: AuthRequest, res: Response) => {
  const personaId = req.personaId!;
  const db = getDb();
  
  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(personaId) as any;
  const accounts = db.prepare('SELECT type, balance FROM accounts WHERE persona_id = ?').all(personaId) as any[];
  const investments = db.prepare('SELECT type, name, invested_amount, current_value FROM investments WHERE persona_id = ?').all(personaId) as any[];
  
  // Calculate savings rate
  const latestMonthRows = db.prepare(`
    SELECT type, SUM(amount) as total
    FROM transactions
    WHERE persona_id = ?
    AND strftime('%Y-%m', date) = (
      SELECT strftime('%Y-%m', date) FROM transactions 
      WHERE persona_id = ?
      ORDER BY date DESC LIMIT 1
    )
    GROUP BY type
  `).all(personaId, personaId) as { type: string, total: number }[];

  const income = latestMonthRows.find(r => r.type === 'credit')?.total || 0;
  const expenses = latestMonthRows.find(r => r.type === 'debit')?.total || 0;
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  
  const totalInvested = investments.reduce((acc: number, i: any) => acc + i.invested_amount, 0);
  const liquidCash = accounts.filter((a: any) => a.type === 'savings').reduce((acc: number, a: any) => acc + a.balance, 0);

  // 3-month average expenses
  const avg3mExpenses = (db.prepare(`
    SELECT AVG(monthly_total) as avg_exp FROM (
      SELECT strftime('%Y-%m', date) as month, SUM(amount) as monthly_total
      FROM transactions
      WHERE persona_id = ? AND type = 'debit'
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC
      LIMIT 3
    )
  `).get(personaId) as any)?.avg_exp || expenses || 1;

  const emergencyFundMonths = Math.round((liquidCash / avg3mExpenses) * 10) / 10;

  const DISCLAIMER = 'This is an AI-generated observation based on your transaction data. It does not constitute financial advice. Please consult a SEBI-registered advisor before making investment decisions.';

  const recommendations = [];

  // ── 1. Savings Rate ─────────────────────────────────────
  if (savingsRate < 20) {
    recommendations.push({
      id: 'rec-savings-rate',
      title: 'Action Required: Savings Rate',
      message: `You're saving ${savingsRate.toFixed(1)}% of your income this month. Reaching the recommended 20% target requires reducing discretionary spend by approximately ₹${Math.round((0.2 * income) - (income - expenses)).toLocaleString('en-IN')}/month.`,
      type: 'warning',
      triggerReason: `Triggered because: current savings rate is ${savingsRate.toFixed(1)}%, below the 20% recommended minimum.`,
      actionText: 'Review Spending',
      actionUrl: '/spending',
      disclaimer: DISCLAIMER,
    });
  } else {
    recommendations.push({
      id: 'rec-savings-surplus',
      title: 'Surplus Capital Detected',
      message: `You're saving ${savingsRate.toFixed(1)}% of your income — above the 20% benchmark. Consider allocating the surplus ₹${Math.round(income - expenses - (0.2 * income)).toLocaleString('en-IN')}/month to index funds to prevent inflation drag.`,
      type: 'success',
      triggerReason: `Triggered because: savings rate of ${savingsRate.toFixed(1)}% exceeds the 20% target, leaving investable surplus.`,
      actionText: 'Simulate Growth',
      actionUrl: '/simulator',
      disclaimer: DISCLAIMER,
    });
  }

  // ── 2. Emergency Fund ───────────────────────────────────
  if (emergencyFundMonths < 3) {
    recommendations.push({
      id: 'rec-emergency-fund',
      title: 'Critical: Low Emergency Fund',
      message: `Your liquid savings cover only ${emergencyFundMonths} months of expenses. Building a 3–6 month safety net (₹${Math.round(avg3mExpenses * 3).toLocaleString('en-IN')}–₹${Math.round(avg3mExpenses * 6).toLocaleString('en-IN')}) is recommended before further investing.`,
      type: 'warning',
      triggerReason: `Triggered because: emergency fund covers only ${emergencyFundMonths} months, below your 3-month target. Liquid savings: ₹${Math.round(liquidCash).toLocaleString('en-IN')}, avg monthly expenses: ₹${Math.round(avg3mExpenses).toLocaleString('en-IN')}.`,
      actionText: 'Adjust Goals',
      actionUrl: '/goals',
      disclaimer: DISCLAIMER,
    });
  } else if (liquidCash > (avg3mExpenses * 6)) {
    recommendations.push({
      id: 'rec-cash-drag',
      title: 'High Cash Drag',
      message: `You have ${emergencyFundMonths} months of expenses (₹${Math.round(liquidCash).toLocaleString('en-IN')}) sitting in savings accounts at ~3.5% yield. Amounts beyond 6 months coverage (₹${Math.round(liquidCash - avg3mExpenses * 6).toLocaleString('en-IN')}) could be deployed into higher-yielding instruments.`,
      type: 'info',
      triggerReason: `Triggered because: liquid savings of ₹${Math.round(liquidCash).toLocaleString('en-IN')} exceeds 6 months of expenses (₹${Math.round(avg3mExpenses * 6).toLocaleString('en-IN')}), creating inflation drag.`,
      actionText: 'Invest Excess',
      actionUrl: '/portfolio',
      disclaimer: DISCLAIMER,
    });
  }

  // ── 3. Profile-Specific ─────────────────────────────────
  if (persona.risk_profile === 'conservative' && persona.age < 35) {
    recommendations.push({
      id: 'rec-allocation-mismatch',
      title: 'Asset Allocation Mismatch',
      message: `A conservative portfolio at age ${persona.age} may restrict long-term compounding. Research suggests a 60/40 equity–debt split aligns better with a 20+ year investment horizon.`,
      type: 'info',
      triggerReason: `Triggered because: risk profile is "conservative" but age (${persona.age}) suggests a long investment horizon suitable for moderate equity exposure.`,
      actionText: 'Simulate Scenarios',
      actionUrl: '/simulator',
      disclaimer: DISCLAIMER,
    });
  } else if (persona.risk_profile === 'aggressive' && persona.age > 55) {
    recommendations.push({
      id: 'rec-sequence-risk',
      title: 'Sequence of Returns Risk',
      message: `With an aggressive equity weight at age ${persona.age}, sudden market corrections could materially impact your corpus during the withdrawal phase. A gradual shift towards fixed-income instruments reduces this risk.`,
      type: 'warning',
      triggerReason: `Triggered because: risk profile is "aggressive" at age ${persona.age}, which is within the sequence-of-returns risk window (<10 years to typical retirement).`,
      actionText: 'Rebalance Portfolio',
      actionUrl: '/portfolio',
      disclaimer: DISCLAIMER,
    });
  }

  // ── 4. Tax — ELSS / 80C suggestion ─────────────────────
  // Check if persona has ELSS investments
  const hasELSS = investments.some((i: any) => 
    i.name.toLowerCase().includes('elss') || i.name.toLowerCase().includes('tax')
  );
  const totalELSSInvestment = investments
    .filter((i: any) => i.name.toLowerCase().includes('elss') || i.name.toLowerCase().includes('tax'))
    .reduce((sum: number, i: any) => sum + i.invested_amount, 0);

  // Section 80C limit is ₹1.5L
  const section80CLimit = 150000;
  const estimatedPPF = investments
    .filter((i: any) => i.name.toLowerCase().includes('ppf'))
    .reduce((sum: number, i: any) => sum + Math.min(i.invested_amount / 5, 150000), 0); // Rough annual estimate
  const estimatedInsurancePremiums = (db.prepare(`
    SELECT COALESCE(SUM(premium_annual), 0) as total FROM insurance WHERE persona_id = ?
  `).get(personaId) as any)?.total || 0;
  
  const used80C = Math.min(section80CLimit, totalELSSInvestment + estimatedPPF + estimatedInsurancePremiums);
  const remaining80C = Math.max(0, section80CLimit - used80C);

  if (remaining80C > 10000) {
    const taxSaved = Math.round(remaining80C * 0.3); // Illustrative at 30% bracket
    recommendations.push({
      id: 'rec-tax-80c',
      title: 'Tax Optimization: Section 80C',
      message: `Based on your current investments, approximately ₹${remaining80C.toLocaleString('en-IN')} of your ₹1.5L Section 80C limit may be unutilized. Investing this in an ELSS fund could illustratively save ~₹${taxSaved.toLocaleString('en-IN')} in taxes (at the 30% bracket) while offering equity exposure with only a 3-year lock-in.`,
      type: 'info',
      triggerReason: `Triggered because: estimated 80C utilization is ₹${used80C.toLocaleString('en-IN')} of ₹${section80CLimit.toLocaleString('en-IN')} limit. Figures are illustrative and based on available data.`,
      actionText: 'View Tax & Risk',
      actionUrl: '/tax-risk',
      disclaimer: 'Tax figures are illustrative only, based on the 30% income tax bracket. Actual liability depends on your specific tax situation. ' + DISCLAIMER,
    });
  }

  // ── 5. Spending anomaly teaser ──────────────────────────
  // Find worst spending anomaly to surface as recommendation
  const currentMonthExp = db.prepare(`
    SELECT category, SUM(amount) as current_total
    FROM transactions
    WHERE persona_id = ? AND type = 'debit'
    AND strftime('%Y-%m', date) = (
      SELECT strftime('%Y-%m', date) FROM transactions 
      WHERE persona_id = ? AND type = 'debit' 
      ORDER BY date DESC LIMIT 1
    )
    GROUP BY category
  `).all(personaId, personaId) as any[];

  const avgByCategory = db.prepare(`
    WITH PriorMonths AS (
      SELECT DISTINCT strftime('%Y-%m', date) as month
      FROM transactions
      WHERE persona_id = ? AND type = 'debit'
      ORDER BY month DESC LIMIT 3 OFFSET 1
    )
    SELECT category, SUM(amount) / COUNT(DISTINCT strftime('%Y-%m', date)) as avg_amount
    FROM transactions
    WHERE persona_id = ? AND type = 'debit'
    AND strftime('%Y-%m', date) IN (SELECT month FROM PriorMonths)
    GROUP BY category
  `).all(personaId, personaId) as any[];

  let worstAnomaly: any = null;
  let worstPct = 0;
  for (const exp of currentMonthExp) {
    const hist = avgByCategory.find((a: any) => a.category === exp.category);
    if (hist && hist.avg_amount > 500) {
      const pctDiff = ((exp.current_total - hist.avg_amount) / hist.avg_amount) * 100;
      if (pctDiff > worstPct && pctDiff > 25) {
        worstPct = pctDiff;
        worstAnomaly = { category: exp.category, pct: Math.round(pctDiff), current: Math.round(exp.current_total), avg: Math.round(hist.avg_amount) };
      }
    }
  }

  if (worstAnomaly) {
    const catName = worstAnomaly.category.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    recommendations.push({
      id: 'rec-spending-anomaly',
      title: `Spending Alert: ${catName}`,
      message: `Your ${catName.toLowerCase()} spending this month (₹${worstAnomaly.current.toLocaleString('en-IN')}) is ${worstAnomaly.pct}% above your recent average (₹${worstAnomaly.avg.toLocaleString('en-IN')}). Review the Cash Flow ledger for details.`,
      type: 'warning',
      triggerReason: `Triggered because: ${catName.toLowerCase()} spending of ₹${worstAnomaly.current.toLocaleString('en-IN')} exceeds 3-month trailing average of ₹${worstAnomaly.avg.toLocaleString('en-IN')} by ${worstAnomaly.pct}%.`,
      actionText: 'Review Cash Flow',
      actionUrl: '/spending',
      disclaimer: DISCLAIMER,
    });
  }

  res.json(recommendations);
});

export default router;
