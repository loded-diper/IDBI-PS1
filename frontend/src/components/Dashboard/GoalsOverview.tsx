import type { Goal } from '../../types';
import { Home, GraduationCap, Umbrella, Plane, Landmark, AlertTriangle } from 'lucide-react';

interface GoalsOverviewProps {
  goals: Goal[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  house: <Home size={16} />,
  education: <GraduationCap size={16} />,
  emergency_fund: <Umbrella size={16} />,
  retirement: <Landmark size={16} />,
  vacation: <Plane size={16} />,
};

const categoryColors: Record<string, string> = {
  house: '#f97316',
  education: '#8b5cf6',
  emergency_fund: '#10b981',
  retirement: '#3b82f6',
  vacation: '#ec4899',
};

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export default function GoalsOverview({ goals }: GoalsOverviewProps) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
        Financial Goals
      </h3>

      <div className="space-y-4">
        {goals.map((goal) => {
          const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
          const color = categoryColors[goal.category] || '#6366f1';
          const icon = categoryIcons[goal.category] || <AlertTriangle size={16} />;
          const remaining = goal.target_amount - goal.current_amount;

          return (
            <div key={goal.name} className="group">
              <div className="flex items-start gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${color}18`, color }}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {goal.name}
                    </p>
                    <span className="text-xs font-semibold ml-2" style={{ color }}>
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      by {formatDate(goal.target_date)}
                    </span>
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="ml-11 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%`, background: color }}
                />
              </div>
              {remaining > 0 && (
                <p className="ml-11 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatCurrency(remaining)} remaining
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
