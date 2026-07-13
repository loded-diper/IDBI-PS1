import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { SpendingTrend } from '../../types';

interface IncomeExpenseTrendProps {
  data: SpendingTrend[];
}

function formatCurrency(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
}

function formatMonth(month: string): string {
  const [y, m] = month.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m) - 1]} '${y.slice(2)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs" style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--glass-border)',
      color: 'var(--text-primary)',
    }}>
      <p className="font-semibold mb-1">{formatMonth(label)}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.dataKey === 'income' ? 'Income' : 'Expenses'}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

export default function IncomeExpenseTrend({ data }: IncomeExpenseTrendProps) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Income vs Expenses
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#8b5cf6' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Expenses</span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              fill="url(#incomeGrad)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#10b981' }}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#8b5cf6"
              fill="url(#expenseGrad)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#8b5cf6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
