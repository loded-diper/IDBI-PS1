import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getPortfolioAnalytics } from '../api/client';
import type { PortfolioAnalytics } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)} K`;
  return `₹${amount.toFixed(0)}`;
}

// Data Palette: Yale Blue, Amber, Teal, Slate
const COLORS = ['#1B436D', '#D99B5B', '#0F5E71', '#5A6B7C'];

export default function PortfolioPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<PortfolioAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    getPortfolioAnalytics().then(res => {
      setData(res);
      setLoading(false);
    }).catch(console.error);
  }, [isAuthenticated, navigate]);

  if (loading || !data) {
     return <div className="flex h-screen overflow-hidden"><Sidebar /><main className="flex-1 p-8"><div className="h-8 w-64 skeleton mb-8" /></main></div>;
  }

  // Group holdings by type for pie chart
  const groupedObj = data.holdings.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + curr.current_value;
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(groupedObj).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  const totalReturn = data.totalValue - data.totalInvested;
  const totalReturnPct = (totalReturn / data.totalInvested) * 100;

  // Group holdings by type for expanded display
  const holdingsByType: Record<string, typeof data.holdings> = {};
  for (const h of data.holdings) {
    if (!holdingsByType[h.type]) holdingsByType[h.type] = [];
    holdingsByType[h.type].push(h);
  }
  const typeOrder = ['mutual_fund', 'stock', 'fd'];
  const sortedTypes = typeOrder.filter(t => holdingsByType[t]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 xl:p-12 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="max-w-[1600px] w-full mx-auto flex flex-col lg:flex-row justify-between gap-8 xl:gap-12">
          
          {/* THE LEDGER STATEMENT */}
          <div className="flex-1 ledger-surface p-8 lg:p-12 mb-12">
            <div className="animate-fade-in-up">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>
                Asset Register — {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
              
              <div className="pt-8 border-t border-b py-8 mb-12 flex justify-between items-start" style={{ borderColor: 'var(--text-primary)' }}>
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-primary)' }}>Total Asset Value</p>
                  <h2 className="text-6xl font-display font-bold tabular tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(data.totalValue)}
                  </h2>
                  <div className="mt-4 flex items-center gap-6">
                    <p className="text-sm tabular font-medium" style={{ color: 'var(--text-primary)' }}>
                      <span className="font-bold" style={{ color: totalReturn >= 0 ? 'var(--accent-primary)' : 'var(--warning)' }}>
                        {totalReturn >= 0 ? '+' : ''}{formatCurrency(totalReturn)}
                      </span> lifetime yields
                    </p>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Total Invested: <span className="font-bold tabular">{formatCurrency(data.totalInvested)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end pt-2 pr-4 lg:pr-8">
                   <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>Yield %</p>
                   <span className="text-5xl font-display font-bold tabular" style={{ color: totalReturnPct >= 0 ? 'var(--accent-primary)' : 'var(--warning)' }}>
                      {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(1)}%
                   </span>
                </div>
              </div>

              {/* Data Visualization Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16 pb-16 border-b-2" style={{ borderColor: 'var(--text-primary)' }}>
                {/* Allocation */}
                <div className="flex flex-col">
                   <h3 className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--text-primary)' }}>Portfolio Composition</h3>
                   <div style={{ width: '100%', height: 180 }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val: number) => formatCurrency(val)} cursor={false} contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: '4px', boxShadow: 'var(--shadow-floating)' }} />
                        </PieChart>
                     </ResponsiveContainer>
                   </div>
                   <div className="flex flex-col gap-3 mt-6 w-full">
                      {pieData.map((d, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>{d.name.replace(/_/g, ' ')}</span>
                          </div>
                          <span className="font-bold tabular text-sm">{((d.value/data.totalValue)*100).toFixed(1)}%</span>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Performance */}
                <div className="lg:col-span-2 flex flex-col h-full relative">
                   <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-primary)' }}>Performance History (6M)</h3>
                   <div style={{ width: '100%', height: 280, flex: 1, pointerEvents: 'none' }}>
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.history} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                           <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.15}/>
                                 <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }} />
                           <YAxis tickFormatter={formatCurrency} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }} domain={['auto', 'auto']} />
                           <Area type="monotone" dataKey="value" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                        </AreaChart>
                     </ResponsiveContainer>
                   </div>
                </div>
              </div>

              {/* ════ EXPANDED HOLDINGS BY TYPE ════ */}
              {sortedTypes.map((type) => {
                const holdings = holdingsByType[type];
                const typeTotal = holdings.reduce((s, h) => s + h.current_value, 0);
                const typeInvested = holdings.reduce((s, h) => s + h.invested_amount, 0);
                const typeReturn = typeTotal - typeInvested;
                const typeName = type.replace(/_/g, ' ');

                return (
                  <div key={type} className="mb-12">
                    <div className="flex justify-between items-end border-b-2 pb-3 mb-6" style={{ borderColor: 'var(--text-primary)' }}>
                      <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
                        {typeName} ({holdings.length})
                      </h3>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold tabular" style={{ color: 'var(--text-primary)' }}>{formatCurrency(typeTotal)}</span>
                        <span className="text-xs font-bold tabular" style={{ color: typeReturn >= 0 ? 'var(--accent-primary)' : 'var(--warning)' }}>
                          {typeReturn >= 0 ? '+' : ''}{formatCurrency(typeReturn)}
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-strong)' }}>
                            <th className="pb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Name</th>
                            <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>Units</th>
                            <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>Invested</th>
                            <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>Current Value</th>
                            <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>Gain / Loss</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {holdings.map((h, i) => (
                            <tr key={i} className="ledger-row group">
                              <td className="py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{h.name}</td>
                              <td className="py-3 text-right tabular text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                                {h.units % 1 === 0 ? h.units : h.units.toFixed(1)}
                              </td>
                              <td className="py-3 text-right tabular text-[13px]" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(h.invested_amount)}</td>
                              <td className="py-3 text-right tabular font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(h.current_value)}</td>
                              <td className="py-3 text-right">
                                <div className="flex justify-end gap-2 items-center">
                                  <span className="font-semibold tabular text-xs" style={{ color: h.gain_loss >= 0 ? 'var(--accent-primary)' : 'var(--warning)' }}>
                                    {h.gain_loss >= 0 ? '+' : ''}{formatCurrency(h.gain_loss)}
                                  </span>
                                  <span className="text-[10px] font-bold py-0.5 px-1.5 rounded-sm" style={{ background: 'var(--bg-platform)', color: h.gain_loss >= 0 ? 'var(--accent-primary)' : 'var(--warning)' }}>
                                    {h.gain_loss_pct >= 0 ? '+' : ''}{h.gain_loss_pct.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
              
              {/* FOOTER */}
              <div className="pt-8 border-t mt-12" style={{ borderColor: 'var(--border-subtle)' }}>
                 <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Register Audited & Reconciled <br/>
                    <span className="font-normal tabular">{new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC</span>
                 </p>
                 <p className="text-[10px] mt-2 leading-relaxed max-w-xl" style={{ color: 'var(--text-muted)' }}>
                    Valuation marks calculated against preceding 24h market closes. Cash and unlisted illiquid assets held at par value unless explicitly impaired in ledger entries.
                 </p>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: CONCENTRATION WARNINGS */}
          {data.concentrationWarnings && data.concentrationWarnings.length > 0 && (
            <div className="lg:w-[320px] xl:w-[360px] flex-shrink-0 relative lg:border-l lg:pl-8 xl:pl-12 border-gray-300">
              <div className="sticky top-12 pt-8 lg:pt-12">
                <div className="space-y-6 animate-fade-in-up">
                  <div className="mb-8 pl-4 border-b pb-1" style={{ borderColor: 'var(--border-subtle)' }}>
                    <h4 className="inline-block text-xs font-bold uppercase tracking-widest text-[#1B436D] border-b-2 border-[#1B436D] pb-1">Risk Analyst</h4>
                  </div>

                  <div className="flex flex-col gap-6">
                    {data.concentrationWarnings.map((w, i) => (
                      <div key={i} className="insight-margin-note">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#6F353C' }}>
                          CONCENTRATION RISK
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                          {w.message}
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
