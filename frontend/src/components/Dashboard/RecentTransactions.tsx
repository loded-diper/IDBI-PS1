import type { Transaction } from '../../types';
import {
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Coffee,
  Home,
  Zap,
  Car,
  Heart,
  Gift,
  CreditCard,
  Briefcase,
  TrendingUp,
  Shield,
  Landmark,
  Banknote,
} from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  salary: <Briefcase size={16} />,
  pension: <Landmark size={16} />,
  interest: <Banknote size={16} />,
  rent: <Home size={16} />,
  emi: <Home size={16} />,
  groceries: <ShoppingCart size={16} />,
  dining: <Coffee size={16} />,
  transport: <Car size={16} />,
  utilities: <Zap size={16} />,
  medical: <Heart size={16} />,
  shopping: <CreditCard size={16} />,
  subscriptions: <CreditCard size={16} />,
  investment: <TrendingUp size={16} />,
  insurance: <Shield size={16} />,
  education: <Briefcase size={16} />,
  transfer: <ArrowUpRight size={16} />,
  charity: <Gift size={16} />,
  gift: <Gift size={16} />,
};

const categoryColors: Record<string, string> = {
  salary: '#10b981',
  pension: '#10b981',
  interest: '#10b981',
  rent: '#f97316',
  emi: '#f97316',
  groceries: '#6366f1',
  dining: '#ec4899',
  transport: '#8b5cf6',
  utilities: '#f59e0b',
  medical: '#ef4444',
  shopping: '#06b6d4',
  subscriptions: '#06b6d4',
  investment: '#3b82f6',
  insurance: '#14b8a6',
  education: '#a855f7',
  transfer: '#64748b',
  charity: '#f472b6',
  gift: '#f472b6',
};

function formatCurrency(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Recent Transactions
        </h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Last {transactions.length} entries
        </span>
      </div>

      <div className="space-y-1">
        {transactions.map((txn, index) => {
          const color = categoryColors[txn.category] || '#64748b';
          const icon = categoryIcons[txn.category] || <CreditCard size={16} />;

          return (
            <div
              key={txn.id}
              className="flex items-center gap-3 p-2.5 rounded-xl transition-colors"
              style={{ animationDelay: `${index * 0.03}s` }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-glass-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Category Icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}18`, color }}
              >
                {icon}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {txn.description}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {txn.merchant} · {formatDate(txn.date)}
                </p>
              </div>

              {/* Amount */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {txn.type === 'credit' ? (
                  <ArrowDownRight size={14} style={{ color: 'var(--success)' }} />
                ) : (
                  <ArrowUpRight size={14} style={{ color: 'var(--danger)' }} />
                )}
                <span
                  className="text-sm font-semibold"
                  style={{ color: txn.type === 'credit' ? 'var(--success)' : 'var(--text-primary)' }}
                >
                  {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
