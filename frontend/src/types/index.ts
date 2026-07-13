export interface Persona {
  id: string;
  name: string;
  age: number;
  type: 'young_professional' | 'family_planner' | 'retiree';
  description: string;
  avatar_emoji: string;
  risk_profile: 'conservative' | 'moderate' | 'aggressive';
}

export interface Account {
  type: string;
  account_name: string;
  balance: number;
  credit_limit: number | null;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  description: string;
  merchant: string;
}

export interface SpendingCategory {
  category: string;
  total: number;
}

export interface InvestmentSummary {
  type: string;
  count: number;
  total_invested: number;
  total_current: number;
}

export interface Goal {
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: string;
}

export interface HealthScoreComponent {
  score: number;
  value: number;
  weight: number;
}

export interface HealthScore {
  overall: number;
  components: {
    savingsRate: HealthScoreComponent;
    debtToIncome: HealthScoreComponent;
    emergencyFund: HealthScoreComponent;
    investmentDiversification: HealthScoreComponent;
  };
  grade: string;
  summary: string;
}

export interface DashboardSummary {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  healthScore: HealthScore;
  spendingByCategory: SpendingCategory[];
  investmentSummary: InvestmentSummary[];
  goals: Goal[];
  accounts: Account[];
}

export interface SpendingTrend {
  month: string;
  income: number;
  expenses: number;
}

export interface AuthResponse {
  token: string;
  persona: Persona;
}

export interface SpendingCategoryDetailed {
  category: string;
  current: number;
  average: number;
  percentageDiff: number;
}

export interface Anomaly {
  category: string;
  message: string;
  type: 'success' | 'warning';
}

export interface SpendingAnalytics {
  categories: SpendingCategoryDetailed[];
  anomalies: Anomaly[];
}

export interface PortfolioHolding {
  id: string;
  type: string;
  name: string;
  units: number;
  buy_price: number;
  current_nav: number;
  invested_amount: number;
  current_value: number;
  gain_loss: number;
  gain_loss_pct: number;
}

export interface ConcentrationWarning {
  holdingName: string;
  holdingType: string;
  percentage: number;
  message: string;
}

export interface PortfolioAnalytics {
  holdings: PortfolioHolding[];
  history: { month: string; value: number }[];
  totalInvested: number;
  totalValue: number;
  concentrationWarnings: ConcentrationWarning[];
}

export interface GoalProjected extends Goal {
  id: string;
  remainingAmount: number;
  projectedDate: string;
  monthsRemaining: number;
  isOffTrack: boolean;
  monthsLate: number;
  monthlySIPRequired: number;
  additionalSIPNeeded: number;
}

export interface Recommendation {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success';
  triggerReason?: string;
  disclaimer?: string;
  actionText?: string;
  actionUrl?: string;
}

// ── Cash Flow Analytics ──────────────────────────────────────────
export interface CashFlowLine {
  category: string;
  amount: number;
  txn_count: number;
}

export interface CashFlowAnomaly {
  category: string;
  currentAmount: number;
  averageAmount: number;
  percentChange: number;
  message: string;
  type: 'warning' | 'success';
}

export interface CashFlowAnalytics {
  incomeLines: CashFlowLine[];
  expenseLines: CashFlowLine[];
  totalIncome: number;
  totalExpenses: number;
  netSurplus: number;
  monthlyTrend: { month: string; income: number; expenses: number }[];
  emergencyFundMonths: number;
  liquidSavings: number;
  avgMonthlyExpenses: number;
  anomalies: CashFlowAnomaly[];
  currentMonth: string;
}
