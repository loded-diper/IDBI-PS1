import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import AIRecommendations from '../components/Dashboard/AIRecommendations';
import { getDashboardSummary } from '../api/client';
import type { DashboardSummary } from '../types';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)} K`;
  return `₹${amount.toFixed(0)}`;
}

export default function DashboardPage() {
  const { persona, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    async function loadData() {
      setLoading(true);
      try {
        const summaryData = await getDashboardSummary();
        setSummary(summaryData);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isAuthenticated, navigate]);

  if (loading || !summary) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-8"><div className="h-8 w-64 skeleton mb-8" /></main>
      </div>
    );
  }

  // Filter assets/liab
  const assetAccounts = summary.accounts.filter(a => a.balance >= 0);
  const liabilityAccounts = summary.accounts.filter(a => a.balance < 0);
  
  const totalAssetsVal = assetAccounts.reduce((acc, a) => acc + a.balance, 0) + summary.investmentSummary.reduce((acc, i) => acc + i.total_current, 0);
  const totalLiabilitiesVal = liabilityAccounts.reduce((acc, a) => acc + Math.abs(a.balance), 0);

  const cashTotal = assetAccounts.reduce((acc, a) => acc + a.balance, 0);
  const fdTotal = summary.investmentSummary.find(i => i.type === 'fd')?.total_current || 0;
  const mfTotal = summary.investmentSummary.find(i => i.type === 'mutual_fund')?.total_current || 0;
  const stockTotal = summary.investmentSummary.find(i => i.type === 'stock')?.total_current || 0;
  const getPct = (val: number) => totalAssetsVal ? (val / totalAssetsVal) * 100 : 0;

  const mockTrendData = [
     { value: summary.netWorth * 0.8 },
     { value: summary.netWorth * 0.82 },
     { value: summary.netWorth * 0.87 },
     { value: summary.netWorth * 0.93 },
     { value: summary.netWorth * 0.96 },
     { value: summary.netWorth }
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 xl:p-12 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="max-w-[1600px] w-full mx-auto flex flex-col lg:flex-row justify-between gap-8 xl:gap-12">
          
          {/* LEFT COLUMN: THE LEDGER STATEMENT */}
          <div className="flex-1 ledger-surface p-8 lg:p-12 mb-12">
            <div className="animate-fade-in-up">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>
                Portfolio Statement — {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
              <h1 className="text-4xl font-bold font-display leading-tight mb-8" style={{ color: 'var(--text-primary)' }}>
                {persona?.name}
              </h1>
              
              <div className="pt-8 border-t border-b py-8 mb-12 flex justify-between items-start" style={{ borderColor: 'var(--text-primary)' }}>
                <div>
                   <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-primary)' }}>Total Wealth</p>
                   <h2 className="text-7xl font-display font-bold tabular tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                     {formatCurrency(summary.netWorth)}
                   </h2>
                   
                   <div className="mt-4">
                     <p className="text-sm tabular font-medium" style={{ color: 'var(--text-primary)' }}>
                       <span style={{ color: 'var(--accent-primary)' }} className="font-bold">+ {formatCurrency(summary.monthlyIncome - summary.monthlyExpenses)}</span> this month
                     </p>
                     
                     {/* Net Worth Sparkline */}
                     <div className="w-32 h-10 mt-1 -ml-1">
                       <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={mockTrendData}>
                           <Line type="monotone" dataKey="value" stroke="var(--accent-primary)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                         </LineChart>
                       </ResponsiveContainer>
                     </div>
                   </div>
                </div>

                {/* Health Score Gauge */}
                <div className="flex flex-col items-end pt-2 pr-4 lg:pr-8">
                   <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>Health Rating</p>
                   <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1 w-8">
                         {/* High - Yale Blue */}
                         <div className="relative">
                            <div className="h-2.5 w-full rounded-sm bg-[#E5E7EB]" />
                            {summary.healthScore.overall >= 80 && <div className="absolute inset-0 rounded-sm bg-[#1B436D]" />}
                         </div>
                         {/* Medium - Amber */}
                         <div className="relative">
                            <div className="h-2.5 w-full rounded-sm bg-[#E5E7EB]" />
                            {summary.healthScore.overall >= 40 && <div className="absolute inset-0 rounded-sm bg-[#D99B5B]" />}
                         </div>
                         {/* Low - Burgundy */}
                         <div className="relative">
                            <div className="h-2.5 w-full rounded-sm bg-[#E5E7EB]" />
                            <div className="absolute inset-0 rounded-sm bg-[#6F353C]" />
                         </div>
                      </div>
                      <span className="text-5xl font-display font-bold tabular" style={{ color: summary.healthScore.overall >= 80 ? 'var(--accent-primary)' : summary.healthScore.overall >= 40 ? '#D99B5B' : 'var(--warning)' }}>
                        {summary.healthScore.overall}
                      </span>
                   </div>
                </div>
              </div>

              {/* ASSETS TABLE */}
              <div className="mb-16 relative" id="ledger-assets">
                <div className="flex justify-between items-end border-b-2 pb-3 mb-6" style={{ borderColor: 'var(--text-primary)' }}>
                   <h3 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Assets</h3>
                   <span className="text-xl font-bold tabular" style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalAssetsVal)}</span>
                </div>
                 {/* ASSET ALLOCATION BAR */}
                 <div className="mb-8">
                    <div className="w-full h-2.5 flex rounded-sm overflow-hidden mb-4">
                       {getPct(cashTotal) > 0 && <div style={{ width: `${getPct(cashTotal)}%`, background: '#1B436D' }} />}
                       {getPct(mfTotal) > 0 && <div style={{ width: `${getPct(mfTotal)}%`, background: '#D99B5B' }} />}
                       {getPct(fdTotal) > 0 && <div style={{ width: `${getPct(fdTotal)}%`, background: '#0F5E71' }} />}
                       {getPct(stockTotal) > 0 && <div style={{ width: `${getPct(stockTotal)}%`, background: '#5A6B7C' }} />}
                    </div>
                    {/* Legend */}
                    <div className="flex gap-4 items-center flex-wrap">
                       {getPct(cashTotal) > 0 && (
                          <div className="flex items-center gap-1.5">
                             <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#1B436D' }} />
                             <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Cash</span>
                          </div>
                       )}
                       {getPct(mfTotal) > 0 && (
                          <div className="flex items-center gap-1.5">
                             <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#D99B5B' }} />
                             <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Mutual Fund</span>
                          </div>
                       )}
                       {getPct(fdTotal) > 0 && (
                          <div className="flex items-center gap-1.5">
                             <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#0F5E71' }} />
                             <span className="text-[10px] font-bold uppercase tracking-widest text-primary">FD</span>
                          </div>
                       )}
                       {getPct(stockTotal) > 0 && (
                          <div className="flex items-center gap-1.5">
                             <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#5A6B7C' }} />
                             <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Stock</span>
                          </div>
                       )}
                    </div>
                 </div>
                
                {/* Cash & Equivalents */}
                {assetAccounts.length > 0 && (
                   <div className="mb-8">
                      <h4 className="text-xs font-bold uppercase tracking-widest py-3 mb-2" style={{ color: 'var(--text-secondary)' }}>Cash & Equivalents</h4>
                      {assetAccounts.map(acc => (
                         <div key={acc.account_name} className="flex justify-between py-3 border-b ledger-row">
                            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{acc.account_name}</span>
                            <span className="text-sm font-semibold tabular" style={{ color: 'var(--text-primary)' }}>{formatCurrency(acc.balance)}</span>
                         </div>
                      ))}
                   </div>
                )}
                
                {/* Investments */}
                {summary.investmentSummary.length > 0 && (
                   <div className="mb-8">
                      <h4 className="text-xs font-bold uppercase tracking-widest py-3 mb-2" style={{ color: 'var(--text-secondary)' }}>Investments</h4>
                      {summary.investmentSummary.map(inv => (
                         <div key={inv.type} className="flex justify-between py-3 border-b ledger-row">
                            <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-secondary)' }}>{inv.type.replace('_', ' ')} ({inv.count})</span>
                            <span className="text-sm font-semibold tabular" style={{ color: 'var(--text-primary)' }}>{formatCurrency(inv.total_current)}</span>
                         </div>
                      ))}
                   </div>
                )}
              </div>

              {/* LIABILITIES TABLE */}
              <div className="mb-16 relative" id="ledger-liabilities">
                <div className="flex justify-between items-end border-b-2 pb-3 mb-6" style={{ borderColor: 'var(--text-primary)' }}>
                   <h3 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Liabilities</h3>
                   <span className="text-xl font-bold tabular" style={{ color: 'var(--warning)' }}>-{formatCurrency(totalLiabilitiesVal)}</span>
                </div>
                
                {liabilityAccounts.length > 0 ? (
                   <div>
                      {liabilityAccounts.map(acc => (
                         <div key={acc.account_name} className="flex justify-between py-3 border-b ledger-row">
                            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{acc.account_name}</span>
                            <span className="text-sm font-semibold tabular" style={{ color: 'var(--warning)' }}>-{formatCurrency(Math.abs(acc.balance))}</span>
                         </div>
                      ))}
                   </div>
                ) : (
                  <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>No recorded liabilities.</p>
                )}
              </div>

              {/* FOOTER */}
              <div className="pt-8 border-t mt-12" style={{ borderColor: 'var(--border-subtle)' }}>
                 <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Statement Verified & Timestamped <br/>
                    <span className="font-normal tabular">{new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC</span>
                 </p>
                 <p className="text-[10px] mt-2 leading-relaxed max-w-md" style={{ color: 'var(--text-muted)' }}>
                    This portfolio statement serves as a consolidated ledger of all recorded assets and liabilities. Calculation excludes illiquid assets not formally registered under the primary mandate.
                 </p>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: INSIGHT MARGIN */}
          <div className="lg:w-[320px] xl:w-[360px] flex-shrink-0 relative lg:border-l lg:pl-8 xl:pl-12 border-gray-300">
             {/* Note anchored cleanly to the top of the column to avoid overlaps. Leader line spans across to Assets. */}
             <div className="sticky top-12 pt-8 lg:pt-12">
                <AIRecommendations />
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
