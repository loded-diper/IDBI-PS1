import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SummaryCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  accentColor?: string;
}

export default function SummaryCard({
  icon,
  label,
  value,
  subValue,
  trend,
  trendLabel,
  accentColor = 'var(--accent-primary)',
}: SummaryCardProps) {
  const trendColors = {
    up: 'var(--success)',
    down: 'var(--danger)',
    neutral: 'var(--text-muted)',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="glass-card p-5 relative overflow-hidden group">
      {/* Accent glow */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 transition-opacity group-hover:opacity-20"
        style={{
          background: `radial-gradient(circle, ${accentColor}, transparent 70%)`,
          transform: 'translate(30%, -30%)',
        }}
      />

      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accentColor}20`, color: accentColor }}
        >
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1" style={{ color: trendColors[trend] }}>
            <TrendIcon size={14} />
            {trendLabel && <span className="text-xs font-medium">{trendLabel}</span>}
          </div>
        )}
      </div>

      <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      {subValue && (
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          {subValue}
        </p>
      )}
    </div>
  );
}
