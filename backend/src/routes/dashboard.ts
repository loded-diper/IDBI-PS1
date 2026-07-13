import { Router, Response } from 'express';
import { getDb } from '../db';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { computeHealthScore } from '../services/analytics/healthScore';

const router = Router();

// All dashboard routes require auth
router.use(authMiddleware);

// GET /api/dashboard/summary — Computed financial summary
router.get('/summary', (req: AuthRequest, res: Response) => {
  const personaId = req.personaId!;
  const db = getDb();

  // Total assets (savings + investments)
  const savingsResult = db.prepare(`
    SELECT COALESCE(SUM(balance), 0) as total 
    FROM accounts WHERE persona_id = ? AND type = 'savings'
  `).get(personaId) as any;

  const investmentResult = db.prepare(`
    SELECT COALESCE(SUM(current_value), 0) as total 
    FROM investments WHERE persona_id = ?
  `).get(personaId) as any;

  // Total liabilities (loans + credit card)
  const loanResult = db.prepare(`
    SELECT COALESCE(SUM(outstanding), 0) as total 
    FROM loans WHERE persona_id = ?
  `).get(personaId) as any;

  const ccResult = db.prepare(`
    SELECT COALESCE(SUM(ABS(balance)), 0) as total 
    FROM accounts WHERE persona_id = ? AND type = 'credit_card' AND balance < 0
  `).get(personaId) as any;

  const totalAssets = (savingsResult?.total || 0) + (investmentResult?.total || 0);
  const totalLiabilities = (loanResult?.total || 0) + (ccResult?.total || 0);
  const netWorth = totalAssets - totalLiabilities;

  // Monthly income (latest month)
  const incomeResult = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE persona_id = ? AND type = 'credit'
    AND strftime('%Y-%m', date) = (
      SELECT strftime('%Y-%m', date) FROM transactions 
      WHERE persona_id = ? AND type = 'credit' 
      ORDER BY date DESC LIMIT 1
    )
  `).get(personaId, personaId) as any;

  // Monthly expenses (latest month)
  const expenseResult = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE persona_id = ? AND type = 'debit'
    AND strftime('%Y-%m', date) = (
      SELECT strftime('%Y-%m', date) FROM transactions 
      WHERE persona_id = ? AND type = 'debit' 
      ORDER BY date DESC LIMIT 1
    )
  `).get(personaId, personaId) as any;

  const monthlyIncome = incomeResult?.total || 0;
  const monthlyExpenses = expenseResult?.total || 0;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

  // Spending by category (latest month)
  const spendingByCategory = db.prepare(`
    SELECT category, SUM(amount) as total
    FROM transactions
    WHERE persona_id = ? AND type = 'debit'
    AND strftime('%Y-%m', date) = (
      SELECT strftime('%Y-%m', date) FROM transactions 
      WHERE persona_id = ? AND type = 'debit' 
      ORDER BY date DESC LIMIT 1
    )
    GROUP BY category
    ORDER BY total DESC
  `).all(personaId, personaId);

  // Investment summary
  const investmentSummary = db.prepare(`
    SELECT type, COUNT(*) as count, 
           SUM(invested_amount) as total_invested,
           SUM(current_value) as total_current
    FROM investments
    WHERE persona_id = ?
    GROUP BY type
  `).all(personaId);

  // Goals summary
  const goals = db.prepare(`
    SELECT name, target_amount, current_amount, target_date, category
    FROM goals WHERE persona_id = ?
  `).all(personaId);

  // Financial health score
  const healthScore = computeHealthScore({ personaId });

  // Account balances
  const accounts = db.prepare(`
    SELECT type, account_name, balance, credit_limit
    FROM accounts WHERE persona_id = ?
  `).all(personaId);

  res.json({
    netWorth: Math.round(netWorth),
    totalAssets: Math.round(totalAssets),
    totalLiabilities: Math.round(totalLiabilities),
    monthlyIncome: Math.round(monthlyIncome),
    monthlyExpenses: Math.round(monthlyExpenses),
    savingsRate: Math.round(savingsRate * 10) / 10,
    healthScore,
    spendingByCategory,
    investmentSummary,
    goals,
    accounts,
  });
});

// GET /api/dashboard/recent-transactions — Last 15 transactions
router.get('/recent-transactions', (req: AuthRequest, res: Response) => {
  const personaId = req.personaId!;
  const db = getDb();

  const transactions = db.prepare(`
    SELECT id, date, amount, type, category, description, merchant
    FROM transactions
    WHERE persona_id = ?
    ORDER BY date DESC
    LIMIT 15
  `).all(personaId);

  res.json(transactions);
});

// GET /api/dashboard/spending-trend — Monthly spending trend (last 6 months)
router.get('/spending-trend', (req: AuthRequest, res: Response) => {
  const personaId = req.personaId!;
  const db = getDb();

  const trend = db.prepare(`
    SELECT strftime('%Y-%m', date) as month,
           SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as income,
           SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as expenses
    FROM transactions
    WHERE persona_id = ?
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month DESC
    LIMIT 6
  `).all(personaId);

  res.json(trend.reverse());
});

// GET /api/dashboard/spending — Detailed spending anomalies and breakdown
router.get('/spending', (req: AuthRequest, res: Response) => {
  const personaId = req.personaId!;
  const db = getDb();

  // Get the last month's spending
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

  // Get the average spending for the prior 3 months
  const avgExp = db.prepare(`
    WITH RecentMonths AS (
      SELECT DISTINCT strftime('%Y-%m', date) as month
      FROM transactions
      WHERE persona_id = ? AND type = 'debit'
      ORDER BY month DESC LIMIT 4 OFFSET 1
    )
    SELECT category, SUM(amount) / COUNT(DISTINCT strftime('%Y-%m', date)) as avg_total
    FROM transactions
    WHERE persona_id = ? AND type = 'debit'
    AND strftime('%Y-%m', date) IN (SELECT month FROM RecentMonths)
    GROUP BY category
  `).all(personaId, personaId) as any[];

  const anomalies: any[] = [];
  const comparison = currentMonthExp.map(current => {
    const historical = avgExp.find(a => a.category === current.category);
    const avg = historical ? historical.avg_total : 0;
    let diff = 0;
    
    if (avg > 0) {
      diff = ((current.current_total - avg) / avg) * 100;
      if (diff > 30 && current.current_total > 1000) {
        anomalies.push({
          category: current.category,
          message: `Your ${current.category.replace('_', ' ')} spending is up ${Math.round(diff)}% compared to your recent average.`,
          type: 'warning'
        });
      } else if (diff < -20 && avg > 1000) {
        anomalies.push({
          category: current.category,
          message: `Great job! Your ${current.category.replace('_', ' ')} spending is down ${Math.round(Math.abs(diff))}% compared to usual.`,
          type: 'success'
        });
      }
    }
    
    return {
      category: current.category,
      current: current.current_total,
      average: avg,
      percentageDiff: diff
    };
  });

  res.json({ categories: comparison, anomalies });
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/dashboard/cashflow — Full cash flow statement with trends & insights
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/cashflow', (req: AuthRequest, res: Response) => {
  const personaId = req.personaId!;
  const db = getDb();

  // ── Latest month identifier ──────────────────────────────────────────
  const latestMonth = (db.prepare(`
    SELECT strftime('%Y-%m', date) as month FROM transactions 
    WHERE persona_id = ? ORDER BY date DESC LIMIT 1
  `).get(personaId) as any)?.month;

  if (!latestMonth) {
    return res.json({ incomeLines: [], expenseLines: [], monthlyTrend: [], emergencyFundMonths: 0, anomalies: [], totalIncome: 0, totalExpenses: 0, netSurplus: 0 });
  }

  // ── Income breakdown (current month) ─────────────────────────────────
  const incomeLines = db.prepare(`
    SELECT category, SUM(amount) as amount, COUNT(*) as txn_count
    FROM transactions
    WHERE persona_id = ? AND type = 'credit'
    AND strftime('%Y-%m', date) = ?
    GROUP BY category
    ORDER BY amount DESC
  `).all(personaId, latestMonth) as any[];

  // ── Expense breakdown (current month) ────────────────────────────────
  const expenseLines = db.prepare(`
    SELECT category, SUM(amount) as amount, COUNT(*) as txn_count
    FROM transactions
    WHERE persona_id = ? AND type = 'debit'
    AND strftime('%Y-%m', date) = ?
    GROUP BY category
    ORDER BY amount DESC
  `).all(personaId, latestMonth) as any[];

  const totalIncome = incomeLines.reduce((s: number, l: any) => s + l.amount, 0);
  const totalExpenses = expenseLines.reduce((s: number, l: any) => s + l.amount, 0);
  const netSurplus = totalIncome - totalExpenses;

  // ── 6-month trend ────────────────────────────────────────────────────
  const monthlyTrend = db.prepare(`
    SELECT strftime('%Y-%m', date) as month,
           SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as income,
           SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as expenses
    FROM transactions
    WHERE persona_id = ?
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month DESC
    LIMIT 6
  `).all(personaId) as any[];

  // ── Emergency fund (liquid savings ÷ avg monthly expenses) ─────────
  const liquidSavings = (db.prepare(`
    SELECT COALESCE(SUM(balance), 0) as total
    FROM accounts WHERE persona_id = ? AND type = 'savings'
  `).get(personaId) as any)?.total || 0;

  const avg3mExpenses = (db.prepare(`
    SELECT AVG(monthly_total) as avg_exp FROM (
      SELECT strftime('%Y-%m', date) as month, SUM(amount) as monthly_total
      FROM transactions
      WHERE persona_id = ? AND type = 'debit'
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC
      LIMIT 3
    )
  `).get(personaId) as any)?.avg_exp || 1;

  const emergencyFundMonths = Math.round((liquidSavings / avg3mExpenses) * 10) / 10;

  // ── Spending anomalies (current vs. 3-month trailing) ────────────────
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

  const anomalies: any[] = [];
  for (const exp of expenseLines) {
    const hist = avgByCategory.find((a: any) => a.category === exp.category);
    if (hist && hist.avg_amount > 500) {
      const pctDiff = ((exp.amount - hist.avg_amount) / hist.avg_amount) * 100;
      if (pctDiff > 25) {
        anomalies.push({
          category: exp.category,
          currentAmount: Math.round(exp.amount),
          averageAmount: Math.round(hist.avg_amount),
          percentChange: Math.round(pctDiff),
          message: `${exp.category.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} spend up ${Math.round(pctDiff)}% vs. your 3-month average (₹${Math.round(exp.amount).toLocaleString('en-IN')} vs. ₹${Math.round(hist.avg_amount).toLocaleString('en-IN')})`,
          type: 'warning' as const,
        });
      } else if (pctDiff < -20) {
        anomalies.push({
          category: exp.category,
          currentAmount: Math.round(exp.amount),
          averageAmount: Math.round(hist.avg_amount),
          percentChange: Math.round(pctDiff),
          message: `${exp.category.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} spend down ${Math.round(Math.abs(pctDiff))}% vs. your 3-month average — well managed.`,
          type: 'success' as const,
        });
      }
    }
  }

  // Add emergency fund anomaly if below 3 months
  if (emergencyFundMonths < 3) {
    anomalies.unshift({
      category: 'emergency_fund',
      currentAmount: Math.round(liquidSavings),
      averageAmount: Math.round(avg3mExpenses),
      percentChange: 0,
      message: `Emergency fund covers only ${emergencyFundMonths} months of expenses — below the recommended 3-month minimum. Consider redirecting surplus towards liquid savings.`,
      type: 'warning' as const,
    });
  }

  res.json({
    incomeLines,
    expenseLines,
    totalIncome: Math.round(totalIncome),
    totalExpenses: Math.round(totalExpenses),
    netSurplus: Math.round(netSurplus),
    monthlyTrend: monthlyTrend.reverse(),
    emergencyFundMonths,
    liquidSavings: Math.round(liquidSavings),
    avgMonthlyExpenses: Math.round(avg3mExpenses),
    anomalies,
    currentMonth: latestMonth,
  });
});

// GET /api/dashboard/portfolio — Detailed holdings with concentration warnings
router.get('/portfolio', (req: AuthRequest, res: Response) => {
  const personaId = req.personaId!;
  const db = getDb();

  const holdings = db.prepare(`
    SELECT id, type, name, units, buy_price, current_nav, invested_amount, current_value
    FROM investments
    WHERE persona_id = ?
    ORDER BY current_value DESC
  `).all(personaId) as any[];

  // Generate some simple mock performance data based on current value for a nice line chart
  const totalValue = holdings.reduce((sum: number, h: any) => sum + h.current_value, 0);
  const totalInvested = holdings.reduce((sum: number, h: any) => sum + h.invested_amount, 0);
  
  const history = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']; // simplified a bit
  let runningVal = totalInvested;
  const growthRate = (totalValue - totalInvested) / 6;
  
  for(let i = 0; i < 6; i++) {
     runningVal += growthRate * (0.8 + Math.random() * 0.4); // Add some noise
     if (i === 5) runningVal = totalValue; // ensure last month matches exact
     history.push({ month: months[i], value: Math.round(runningVal) });
  }

  // ── Concentration warnings ─────────────────────────────────────────────
  const concentrationWarnings: any[] = [];

  // Group by type to calculate concentration within asset class
  const typeGroups: Record<string, { total: number; holdings: any[] }> = {};
  for (const h of holdings) {
    if (!typeGroups[h.type]) typeGroups[h.type] = { total: 0, holdings: [] };
    typeGroups[h.type].total += h.current_value;
    typeGroups[h.type].holdings.push(h);
  }

  // Check equity holdings for over-concentration (>25% of class)
  for (const [type, group] of Object.entries(typeGroups)) {
    if (group.holdings.length > 1) {
      for (const h of group.holdings) {
        const pct = (h.current_value / group.total) * 100;
        if (pct > 25) {
          const typeName = type.replace(/_/g, ' ');
          concentrationWarnings.push({
            holdingName: h.name,
            holdingType: type,
            percentage: Math.round(pct),
            message: `${h.name} is ${Math.round(pct)}% of your ${typeName} holdings — consider diversifying to reduce single-asset risk.`,
          });
        }
      }
    }
  }

  // Also check if any single holding is >30% of total portfolio
  for (const h of holdings) {
    const portfolioPct = (h.current_value / totalValue) * 100;
    if (portfolioPct > 30) {
      const exists = concentrationWarnings.find(w => w.holdingName === h.name);
      if (!exists) {
        concentrationWarnings.push({
          holdingName: h.name,
          holdingType: h.type,
          percentage: Math.round(portfolioPct),
          message: `${h.name} represents ${Math.round(portfolioPct)}% of your total portfolio — high concentration risk.`,
        });
      }
    }
  }

  // ── Enrich holdings with gain/loss ─────────────────────────────────────
  const enrichedHoldings = holdings.map((h: any) => ({
    ...h,
    gain_loss: Math.round(h.current_value - h.invested_amount),
    gain_loss_pct: h.invested_amount > 0 ? Math.round(((h.current_value - h.invested_amount) / h.invested_amount) * 1000) / 10 : 0,
  }));

  res.json({ history, holdings: enrichedHoldings, totalInvested, totalValue, concentrationWarnings });
});

// GET /api/dashboard/goals — Insights and projected completion dates
router.get('/goals', (req: AuthRequest, res: Response) => {
  const personaId = req.personaId!;
  const db = getDb();

  const goals = db.prepare(`
    SELECT id, name, target_amount, current_amount, target_date, category
    FROM goals WHERE persona_id = ?
  `).all(personaId) as any[];

  // Monthly income and expenses to calculate savings rate
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
  let monthlySavings = income - expenses;
  if(monthlySavings <= 0) monthlySavings = 1000; // fallback to avoid infinity

  const numGoals = goals.length || 1;

  const projectedGoals = goals.map(g => {
    const remaining = g.target_amount - g.current_amount;
    if (remaining <= 0) {
      // Goal achieved
      return {
        ...g,
        remainingAmount: 0,
        projectedDate: new Date().toISOString().split('T')[0],
        monthsRemaining: 0,
        isOffTrack: false,
        monthsLate: 0,
        monthlySIPRequired: 0,
      };
    }
    
    // Split savings evenly across goals for projection
    const savingsPerGoal = monthlySavings / numGoals;
    const monthsRemaining = Math.max(1, Math.ceil(remaining / savingsPerGoal)); 
    
    const projectedDate = new Date();
    projectedDate.setMonth(projectedDate.getMonth() + monthsRemaining);
    const projectedDateStr = projectedDate.toISOString().split('T')[0];

    const targetDate = new Date(g.target_date);
    const now = new Date();
    const targetMonthsLeft = Math.max(1, Math.ceil((targetDate.getTime() - now.getTime()) / (30.44 * 24 * 60 * 60 * 1000)));
    
    const isOffTrack = projectedDate > targetDate;
    const monthsLate = isOffTrack ? monthsRemaining - targetMonthsLeft : 0;
    
    // Monthly SIP required to hit target on time
    const monthlySIPRequired = isOffTrack ? Math.round(remaining / targetMonthsLeft) : 0;
    // Additional SIP = required per goal - what they're currently saving per goal
    const additionalSIPNeeded = isOffTrack ? Math.max(0, Math.round(monthlySIPRequired - savingsPerGoal)) : 0;

    return {
      ...g,
      remainingAmount: remaining,
      projectedDate: projectedDateStr,
      monthsRemaining,
      isOffTrack,
      monthsLate,
      monthlySIPRequired,
      additionalSIPNeeded,
    };
  });

  res.json(projectedGoals);
});

export default router;
