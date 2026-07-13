import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import type { HealthScore } from '../../types';

interface HealthScoreGaugeProps {
  healthScore: HealthScore;
}

const gradeColors: Record<string, string> = {
  'Excellent': '#10b981',
  'Good': '#6366f1',
  'Fair': '#f59e0b',
  'Needs Attention': '#f97316',
  'Critical': '#ef4444',
};

export default function HealthScoreGauge({ healthScore }: HealthScoreGaugeProps) {
  const color = gradeColors[healthScore.grade] || '#6366f1';

  const data = [
    { name: 'score', value: healthScore.overall, fill: color },
  ];

  const components = [
    { label: 'Savings Rate', ...healthScore.components.savingsRate, suffix: '%' },
    { label: 'Debt-to-Income', ...healthScore.components.debtToIncome, suffix: '%' },
    { label: 'Emergency Fund', ...healthScore.components.emergencyFund, suffix: ' mo' },
    { label: 'Diversification', ...healthScore.components.investmentDiversification, suffix: ' types' },
  ];

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
        Financial Health Score
      </h3>

      <div className="flex items-center gap-6">
        {/* Circular Gauge */}
        <div className="relative" style={{ width: 160, height: 160, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="75%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              data={data}
              barSize={12}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={6}
                background={{ fill: 'rgba(255,255,255,0.05)' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color }}>{healthScore.overall}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>/100</span>
          </div>
        </div>

        {/* Grade & Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold" style={{ background: `${color}20`, color }}>
              {healthScore.grade}
            </span>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {healthScore.summary}
          </p>

          {/* Component Bars */}
          <div className="space-y-2.5">
            {components.map((comp) => (
              <div key={comp.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{comp.label}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {comp.value}{comp.suffix}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${comp.score}%`,
                      background: comp.score >= 70 ? 'var(--success)' : comp.score >= 40 ? 'var(--warning)' : 'var(--danger)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
