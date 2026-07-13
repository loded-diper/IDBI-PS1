import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getCashFlowAnalytics } from '../api/client';
import type { CashFlowAnalytics } from '../types';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)} K`;
  return `₹${amount.toFixed(0)}`;
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(m)]} '${y.slice(2)}`;
}

export default function SpendingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<CashFlowAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    getCashFlowAnalytics().then(res => {
      setData(res);
      setLoading(false);
    }).catch(console.error);
  }, [isAuthenticated, navigate]);

  if (loading || !data) {
    return <div className="flex h-screen overflow-hidden"><Sidebar /><main className="flex-1 p-8"><div className="h-8 w-64 skeleton mb-8" /></main></div>;
  }

  const currentMonthDisplay = data.currentMonth
    ? formatMonthLabel(data.currentMonth)
    : new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  // Prepare sparkline data for 6-month trend
  const trendSparkline = data.monthlyTrend.map(t => ({
    income: t.income,
    expenses: t.expenses,
    surplus: t.income - t.expenses,
  }));

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 xl:p-12 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="max-w-[1600px] w-full mx-auto flex flex-col lg:flex-row justify-between gap-8 xl:gap-12">
          
          {/* THE LEDGER STATEMENT */}
          <div className="flex-1 ledger-surface p-8 lg:p-12 mb-12">
            <div className="animate-fade-in-up">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>
                Cash Flow Ledger — {currentMonthDisplay}
              </p>
              
              {/* ════ HERO: NET SURPLUS / DEFICIT ════ */}
              <div className="pt-8 border-t border-b py-8 mb-12 flex justify-between items-start" style={{ borderColor: 'var(--text-primary)' }}>
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-primary)' }}>Net Cash Flow</p>
                  <h2 className="text-6xl font-display font-bold tabular tracking-tighter" style={{ color: data.netSurplus >= 0 ? 'var(--accent-primary)' : 'var(--warning)' }}>
                    {data.netSurplus >= 0 ? '+' : ''}{formatCurrency(data.netSurplus)}
                  </h2>
                  <div className="mt-2 flex items-center gap-4">
                    <p className="text-sm tabular font-medium" style={{ color: 'var(--text-secondary)' }}>
                      In: <span className="font-bold" style={{ color: 'var(--accent-primary)' }}>{formatCurrency(data.totalIncome)}</span>
                    </p>
                    <p className="text-sm tabular font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Out: <span className="font-bold" style={{ color: 'var(--warning)' }}>{formatCurrency(data.totalExpenses)}</span>
                    </p>
                  </div>
                  
                  {/* 6-month trend sparkline */}
                  {trendSparkline.length > 1 && (
                    <div className="mt-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>6M Surplus Trend</p>
                      <div className="w-36 h-10 -ml-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendSparkline}>
                            <Line type="monotone" dataKey="surplus" stroke="var(--accent-primary)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>

                {/* Emergency Fund Gauge */}
                <div className="flex flex-col items-end pt-2 pr-4 lg:pr-8">
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>Emergency Fund</p>
                  <span className="text-5xl font-display font-bold tabular" style={{ color: data.emergencyFundMonths >= 3 ? 'var(--accent-primary)' : data.emergencyFundMonths >= 2 ? '#D99B5B' : 'var(--warning)' }}>
                    {data.emergencyFundMonths}
                  </span>
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>
                    Months Covered
                  </p>
                  <p className="text-[10px] tabular mt-1" style={{ color: 'var(--text-muted)' }}>
                    Liquid: {formatCurrency(data.liquidSavings)}
                  </p>
                </div>
              </div>

              {/* ════ INCOME BREAKDOWN ════ */}
              <div className="mb-12">
                <div className="flex justify-between items-end border-b-2 pb-3 mb-6" style={{ borderColor: 'var(--text-primary)' }}>
                  <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Inflows</h3>
                  <span className="text-sm font-bold tabular" style={{ color: 'var(--accent-primary)' }}>{formatCurrency(data.totalIncome)}</span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-strong)' }}>
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Source</th>
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>Amount</th>
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>% Share</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {data.incomeLines.map((line, i) => (
                      <tr key={i} className="ledger-row group">
                        <td className="py-3 font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{line.category.replace(/_/g, ' ')}</td>
                        <td className="py-3 text-right tabular font-bold" style={{ color: 'var(--accent-primary)' }}>{formatCurrency(line.amount)}</td>
                        <td className="py-3 text-right tabular text-[13px]" style={{ color: 'var(--text-secondary)' }}>{(line.amount / data.totalIncome * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ════ EXPENSE BREAKDOWN ════ */}
              <div className="mb-16">
                <div className="flex justify-between items-end border-b-2 pb-3 mb-6" style={{ borderColor: 'var(--text-primary)' }}>
                  <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Outflows</h3>
                  <span className="text-sm font-bold tabular" style={{ color: 'var(--warning)' }}>{formatCurrency(data.totalExpenses)}</span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-strong)' }}>
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Category</th>
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>Amount</th>
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>% Share</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {data.expenseLines.map((line, i) => (
                      <tr key={i} className="ledger-row group">
                        <td className="py-3 font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{line.category.replace(/_/g, ' ')}</td>
                        <td className="py-3 text-right tabular font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(line.amount)}</td>
                        <td className="py-3 text-right tabular text-[13px]" style={{ color: 'var(--text-secondary)' }}>{(line.amount / data.totalExpenses * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                    {/* Subtotal row */}
                    <tr style={{ borderTop: '2px solid var(--text-primary)' }}>
                      <td className="py-3 text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Total Outflows</td>
                      <td className="py-3 text-right tabular font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{formatCurrency(data.totalExpenses)}</td>
                      <td className="py-3 text-right tabular text-[13px] font-bold" style={{ color: 'var(--text-secondary)' }}>100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ════ 6-MONTH TREND TABLE ════ */}
              <div className="mb-16 pb-16 border-b-2" style={{ borderColor: 'var(--text-primary)' }}>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--text-primary)' }}>Monthly Reconciliation (6M)</h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-strong)' }}>
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Period</th>
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>Inflows</th>
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>Outflows</th>
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>Net</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {data.monthlyTrend.map((t, i) => {
                      const net = t.income - t.expenses;
                      return (
                        <tr key={i} className="ledger-row group">
                          <td className="py-3 font-medium tabular" style={{ color: 'var(--text-primary)' }}>{formatMonthLabel(t.month)}</td>
                          <td className="py-3 text-right tabular" style={{ color: 'var(--accent-primary)' }}>{formatCurrency(t.income)}</td>
                          <td className="py-3 text-right tabular" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(t.expenses)}</td>
                          <td className="py-3 text-right tabular font-bold" style={{ color: net >= 0 ? 'var(--accent-primary)' : 'var(--warning)' }}>
                            {net >= 0 ? '+' : ''}{formatCurrency(net)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* FOOTER */}
              <div className="pt-8 border-t mt-8" style={{ borderColor: 'var(--border-subtle)' }}>
                 <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Ledger Snapshot <br/>
                    <span className="font-normal tabular">{new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC</span>
                 </p>
                 <p className="text-[10px] mt-2 leading-relaxed max-w-xl" style={{ color: 'var(--text-muted)' }}>
                    Transactions are mapped via aggregate ledger feeds. Adjustments and pending authorizations are subject to a 48h settlement delay.
                 </p>
              </div>

            </div>
          </div>
          
          {/* RIGHT COLUMN: INSIGHT MARGIN */}
          {data.anomalies.length > 0 && (
             <div className="lg:w-[320px] xl:w-[360px] flex-shrink-0 relative lg:border-l lg:pl-8 xl:pl-12 border-gray-300">
               <div className="sticky top-12 pt-8 lg:pt-12">
                  
                  <div className="space-y-6 animate-fade-in-up">
                    <div className="mb-8 pl-4 border-b pb-1" style={{ borderColor: 'var(--border-subtle)' }}>
                      <h4 className="inline-block text-xs font-bold uppercase tracking-widest text-[#1B436D] border-b-2 border-[#1B436D] pb-1">Ledger Analyst</h4>
                    </div>

                    <div className="flex flex-col gap-6">
                      {data.anomalies.map((anom, i) => (
                        <div key={i} className="insight-margin-note">
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: anom.type === 'warning' ? '#6F353C' : '#1B436D' }}>
                            {anom.category === 'emergency_fund' ? 'COVERAGE ALERT' : anom.type === 'warning' ? 'VARIANCE DETECTED' : 'EFFICIENCY NOTED'}
                          </p>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                            {anom.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

               </div>
             </div>
          )}

        </div>
      </main>
    </div>
  );
}
