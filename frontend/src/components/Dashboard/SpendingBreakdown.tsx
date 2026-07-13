import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { SpendingCategory } from '../../types';

interface SpendingBreakdownProps {
  data: SpendingCategory[];
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#f59e0b',
  '#10b981', '#06b6d4', '#3b82f6', '#a855f7', '#ef4444',
  '#14b8a6', '#64748b',
];

function formatCurrency(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

function formatLabel(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="px-3 py-2 rounded-lg text-xs" style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--glass-border)',
      color: 'var(--text-primary)',
    }}>
      <p className="font-semibold">{formatLabel(item.name)}</p>
      <p style={{ color: item.payload.fill }}>{formatCurrency(item.value)}</p>
    </div>
  );
};

export default function SpendingBreakdown({ data }: SpendingBreakdownProps) {
  const total = data.reduce((sum, item) => sum + item.total, 0);
  const top5 = data.slice(0, 5);

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
        Spending Breakdown
      </h3>

      <div className="flex items-center gap-6">
        {/* Donut Chart */}
        <div style={{ width: 150, height: 150, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={65}
                paddingAngle={2}
                dataKey="total"
                nameKey="category"
                strokeWidth={0}
              >
                {data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5">
          {top5.map((item, index) => {
            const pct = total > 0 ? ((item.total / total) * 100).toFixed(1) : '0';
            return (
              <div key={item.category} className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[index] }} />
                <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {formatLabel(item.category)}
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(item.total)}
                </span>
                <span className="text-xs w-10 text-right" style={{ color: 'var(--text-muted)' }}>
                  {pct}%
                </span>
              </div>
            );
          })}
          {data.length > 5 && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              +{data.length - 5} more categories
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
