import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getDashboardSummary } from '../api/client';
import type { DashboardSummary } from '../types';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount.toFixed(0)}`;
}

type SimMode = 'sip' | 'retirement';

export default function SimulatorPage() {
  const { isAuthenticated, persona } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  
  // Mode toggle
  const [mode, setMode] = useState<SimMode>('sip');
  
  // SIP mode controls
  const [sipAdjustment, setSipAdjustment] = useState<number>(0);
  const [marketCondition, setMarketCondition] = useState<'bull' | 'base' | 'bear'>('base');
  const [timeHorizon, setTimeHorizon] = useState<number>(15);

  // Retirement mode controls
  const [retirementAge, setRetirementAge] = useState<number>(60);
  const [expectedReturn, setExpectedReturn] = useState<number>(10);
  const [inflationRate] = useState<number>(6); // Fixed assumption
  
  useEffect(() => {
    if (!isAuthenticated) navigate('/');
    getDashboardSummary().then(setSummary).catch(console.error);
  }, [isAuthenticated, navigate]);

  // ── SIP Projection ──────────────────────────────────────────────
  const sipData = useMemo(() => {
    if (!summary || !persona) return [];
    
    const currentAge = persona.age;
    const initialWealth = summary.netWorth > 0 ? summary.netWorth : 0;
    const currentSIP = (summary.monthlyIncome - summary.monthlyExpenses) * 12;
    const simulatedSIP = currentSIP * (1 + (sipAdjustment / 100));
    
    const rates = { bull: 0.12, base: 0.08, bear: 0.04 };
    const simulatedRate = rates[marketCondition];
    const currentRate = rates.base;
    
    const data = [];
    let currentTrajectory = initialWealth;
    let newTrajectory = initialWealth;

    for (let year = 0; year <= timeHorizon; year++) {
      data.push({
        name: `Age ${currentAge + year}`,
        year: year,
        Current: Math.round(currentTrajectory),
        Simulated: Math.round(newTrajectory)
      });
      currentTrajectory = (currentTrajectory * (1 + currentRate)) + currentSIP;
      newTrajectory = (newTrajectory * (1 + simulatedRate)) + simulatedSIP;
    }
    return data;
  }, [summary, persona, sipAdjustment, marketCondition, timeHorizon]);

  // ── Retirement Projection ──────────────────────────────────────
  const retirementData = useMemo(() => {
    if (!summary || !persona) return [];

    const currentAge = persona.age;
    const yearsToRetire = Math.max(1, retirementAge - currentAge);
    const initialWealth = summary.netWorth > 0 ? summary.netWorth : 0;
    const annualSavings = (summary.monthlyIncome - summary.monthlyExpenses) * 12;
    const nominalRate = expectedReturn / 100;
    const realRate = (1 + nominalRate) / (1 + inflationRate / 100) - 1;

    const data = [];
    let nominalCorpus = initialWealth;
    let realCorpus = initialWealth;

    for (let year = 0; year <= yearsToRetire; year++) {
      data.push({
        name: `Age ${currentAge + year}`,
        year,
        Nominal: Math.round(nominalCorpus),
        Real: Math.round(realCorpus),
      });
      nominalCorpus = (nominalCorpus * (1 + nominalRate)) + annualSavings;
      realCorpus = (realCorpus * (1 + realRate)) + annualSavings;
    }
    return data;
  }, [summary, persona, retirementAge, expectedReturn, inflationRate]);

  if (!summary || !persona) {
    return <div className="flex h-screen overflow-hidden"><Sidebar /><main className="flex-1 p-8"><div className="h-8 w-64 skeleton mb-8" /></main></div>;
  }

  const isSIP = mode === 'sip';
  const chartData = isSIP ? sipData : retirementData;
  
  // SIP final values
  const finalCurrent = isSIP ? (sipData[sipData.length - 1]?.Current || 0) : 0;
  const finalSimulated = isSIP ? (sipData[sipData.length - 1]?.Simulated || 0) : 0;
  const diff = finalSimulated - finalCurrent;

  // Retirement final values
  const finalNominal = !isSIP ? (retirementData[retirementData.length - 1]?.Nominal || 0) : 0;
  const finalReal = !isSIP ? (retirementData[retirementData.length - 1]?.Real || 0) : 0;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 xl:p-12 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="max-w-[1600px] w-full mx-auto flex flex-col lg:flex-row xl:gap-8">
          
          {/* LEFT CALCULATION PANEL */}
          <div className="lg:w-[320px] flex-shrink-0 mb-8 lg:mb-0 lg:pr-12 lg:border-r border-gray-300">
             <div className="animate-fade-in-up">
               <h2 className="text-xl font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-primary)' }}>Modeling Engine</h2>
               <p className="text-[10px] uppercase font-bold tracking-widest mb-8" style={{ color: 'var(--text-muted)' }}>Interactive Projection</p>
               
               {/* Mode Toggle */}
               <div className="mb-10">
                 <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>Mode</label>
                 <div className="flex bg-[#E5E7EB] p-1 rounded-sm">
                   {([['sip', 'SIP Growth'], ['retirement', 'Retirement']] as const).map(([key, label]) => (
                     <button
                       key={key}
                       onClick={() => setMode(key)}
                       className={`flex-1 text-[10px] py-1.5 font-bold uppercase tracking-widest transition-colors ${mode === key ? 'bg-white shadow-sm' : ''}`}
                       style={{ color: mode === key ? 'var(--text-primary)' : 'var(--text-muted)' }}
                     >
                       {label}
                     </button>
                   ))}
                 </div>
               </div>

               {isSIP ? (
                 <div className="flex flex-col gap-10">
                   {/* SIP Modifier */}
                   <div>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>SIP Modifier</label>
                      <div className="flex justify-between text-xs font-bold tabular mb-1" style={{ color: 'var(--text-secondary)' }}>
                        <span>-50%</span>
                        <span style={{ color: sipAdjustment >= 0 ? 'var(--accent-primary)' : 'var(--warning)' }}>{sipAdjustment >= 0 ? '+' : ''}{sipAdjustment}%</span>
                        <span>+100%</span>
                      </div>
                      <input 
                        type="range" 
                        min="-50" max="100" step="5"
                        value={sipAdjustment} 
                        onChange={(e) => setSipAdjustment(Number(e.target.value))}
                        className="w-full accent-[#1B436D]"
                      />
                      <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>Adjust your forward-looking monthly savings contribution relative to current run-rate.</p>
                   </div>

                   {/* Macro Environment */}
                   <div>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>Macro Environment</label>
                      <div className="flex bg-[#E5E7EB] p-1 rounded-sm">
                        {(['bear', 'base', 'bull'] as const).map(m => (
                          <button
                            key={m}
                            onClick={() => setMarketCondition(m)}
                            className={`flex-1 text-[10px] py-1.5 font-bold uppercase tracking-widest transition-colors ${marketCondition === m ? 'bg-white shadow-sm' : ''}`}
                            style={{ color: marketCondition === m ? 'var(--text-primary)' : 'var(--text-muted)' }}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>Expected aggregate portfolio yield: {marketCondition === 'bull' ? '12%' : marketCondition === 'base' ? '8%' : '4%'} annualized.</p>
                   </div>

                   {/* Investment Horizon */}
                   <div>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>Investment Horizon</label>
                      <div className="flex justify-between text-xs font-bold tabular mb-1" style={{ color: 'var(--text-secondary)' }}>
                        <span>5 Yrs</span>
                        <span style={{ color: 'var(--accent-primary)' }}>{timeHorizon} Yrs</span>
                        <span>30 Yrs</span>
                      </div>
                      <input 
                        type="range" 
                        min="5" max="30" step="5"
                        value={timeHorizon} 
                        onChange={(e) => setTimeHorizon(Number(e.target.value))}
                        className="w-full accent-[#1B436D]"
                      />
                   </div>
                 </div>
               ) : (
                 <div className="flex flex-col gap-10">
                   {/* Retirement Age */}
                   <div>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>Retirement Age</label>
                      <div className="flex justify-between text-xs font-bold tabular mb-1" style={{ color: 'var(--text-secondary)' }}>
                        <span>{Math.max(persona.age + 2, 45)}</span>
                        <span style={{ color: 'var(--accent-primary)' }}>{retirementAge}</span>
                        <span>75</span>
                      </div>
                      <input 
                        type="range" 
                        min={Math.max(persona.age + 2, 45)} max="75" step="1"
                        value={retirementAge} 
                        onChange={(e) => setRetirementAge(Number(e.target.value))}
                        className="w-full accent-[#1B436D]"
                      />
                      <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        {retirementAge - persona.age} years to retirement from current age ({persona.age}).
                      </p>
                   </div>

                   {/* Expected Return */}
                   <div>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>Expected Return (Nominal)</label>
                      <div className="flex justify-between text-xs font-bold tabular mb-1" style={{ color: 'var(--text-secondary)' }}>
                        <span>6%</span>
                        <span style={{ color: 'var(--accent-primary)' }}>{expectedReturn}%</span>
                        <span>15%</span>
                      </div>
                      <input 
                        type="range" 
                        min="6" max="15" step="0.5"
                        value={expectedReturn} 
                        onChange={(e) => setExpectedReturn(Number(e.target.value))}
                        className="w-full accent-[#1B436D]"
                      />
                   </div>

                   {/* Inflation (fixed display) */}
                   <div>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>Inflation Rate (Assumed)</label>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold font-display tabular" style={{ color: 'var(--text-primary)' }}>{inflationRate}%</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Per Annum</span>
                      </div>
                      <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        Long-term Indian CPI assumption. Real return: {(((1 + expectedReturn/100) / (1 + inflationRate/100) - 1) * 100).toFixed(1)}% p.a.
                      </p>
                   </div>
                 </div>
               )}
             </div>
          </div>

          {/* RIGHT VISUALIZATION PANEL */}
          <div className="flex-1 lg:pl-12 flex flex-col">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              
              {isSIP ? (
                <>
                  {/* SIP Header */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
                     <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-primary)' }}>Projected Terminal Wealth</p>
                        <h2 className="text-7xl font-display font-bold tabular tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                          {formatCurrency(finalSimulated)}
                        </h2>
                        <p className="text-sm font-medium mt-3 flex gap-2 items-center tabular">
                          Base trajectory: <span style={{ color: 'var(--text-muted)' }} className="line-through">{formatCurrency(finalCurrent)}</span>
                        </p>
                     </div>
                     <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-primary)' }}>Variance vs Base</p>
                        <h3 className="text-4xl font-display font-bold tabular" style={{ color: diff >= 0 ? 'var(--accent-primary)' : 'var(--warning)' }}>
                          {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                        </h3>
                     </div>
                  </div>

                  {/* SIP Chart — clean, no gridlines */}
                  <div style={{ width: '100%', height: 400 }} className="mb-16">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sipData} margin={{ top: 10, right: 0, bottom: 20, left: 0 }}>
                           <defs>
                              <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="0%" stopColor={diff >= 0 ? '#1B436D' : '#6F353C'} stopOpacity={0.1}/>
                                 <stop offset="95%" stopColor={diff >= 0 ? '#1B436D' : '#6F353C'} stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }} dy={10} />
                           <YAxis tickFormatter={formatCurrency} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }} domain={['auto', 'auto']} dx={-10} />
                           <Tooltip formatter={(val) => formatCurrency(Number(val ?? 0))} cursor={false} contentStyle={{ background: '#FFFFFF', border: '1px solid var(--border-strong)', borderRadius: '4px', boxShadow: 'var(--shadow-floating)' }}/>
                           <Area type="monotone" dataKey="Current" stroke="var(--text-muted)" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                           <Area type="monotone" dataKey="Simulated" stroke={diff >= 0 ? '#1B436D' : '#6F353C'} fillOpacity={1} fill="url(#simGrad)" strokeWidth={2.5} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>

                  {/* Chart Legend */}
                  <div className="flex justify-center gap-6 mb-12">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-0.5" style={{ background: diff >= 0 ? '#1B436D' : '#6F353C' }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Simulated</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-0.5 border-t-2 border-dashed" style={{ borderColor: 'var(--text-muted)' }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Base Case</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Retirement Header */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
                     <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-primary)' }}>Retirement Corpus (Nominal)</p>
                        <h2 className="text-7xl font-display font-bold tabular tracking-tighter" style={{ color: 'var(--accent-primary)' }}>
                          {formatCurrency(finalNominal)}
                        </h2>
                        <p className="text-sm font-medium mt-3 tabular" style={{ color: 'var(--text-secondary)' }}>
                          at age {retirementAge} • {retirementAge - persona.age} years from now
                        </p>
                     </div>
                     <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-primary)' }}>Real Value (Inflation-Adj.)</p>
                        <h3 className="text-4xl font-display font-bold tabular" style={{ color: '#0F5E71' }}>
                          {formatCurrency(finalReal)}
                        </h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>
                          In today's purchasing power
                        </p>
                     </div>
                  </div>

                  {/* Retirement Chart — dual lines */}
                  <div style={{ width: '100%', height: 400 }} className="mb-16">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={retirementData} margin={{ top: 10, right: 0, bottom: 20, left: 0 }}>
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }} dy={10} />
                           <YAxis tickFormatter={formatCurrency} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }} domain={['auto', 'auto']} dx={-10} />
                           <Tooltip formatter={(val) => formatCurrency(Number(val ?? 0))} cursor={false} contentStyle={{ background: '#FFFFFF', border: '1px solid var(--border-strong)', borderRadius: '4px', boxShadow: 'var(--shadow-floating)' }}/>
                           <Line type="monotone" dataKey="Nominal" stroke="#1B436D" strokeWidth={2.5} dot={false} />
                           <Line type="monotone" dataKey="Real" stroke="#0F5E71" strokeWidth={2} dot={false} strokeDasharray="6 3" />
                        </LineChart>
                     </ResponsiveContainer>
                  </div>

                  {/* Chart Legend */}
                  <div className="flex justify-center gap-6 mb-12">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-0.5" style={{ background: '#1B436D' }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Nominal Corpus</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-0.5 border-t-2 border-dashed" style={{ borderColor: '#0F5E71' }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#0F5E71' }}>Real Value ({inflationRate}% Infl.)</span>
                    </div>
                  </div>
                </>
              )}

              {/* Data Table */}
              <div className="overflow-x-auto border-t-2 pt-8" style={{ borderColor: 'var(--text-primary)' }}>
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr style={{ borderBottom: '1px solid var(--border-strong)' }}>
                       <th className="pb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Horizon Checkpoint</th>
                       {isSIP ? (
                         <>
                           <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>Base Expectation</th>
                           <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>Simulated Portfolio</th>
                           <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>Delta</th>
                         </>
                       ) : (
                         <>
                           <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>Nominal Corpus</th>
                           <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>Real Value</th>
                           <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>Inflation Erosion</th>
                         </>
                       )}
                     </tr>
                   </thead>
                   <tbody className="text-sm">
                     {chartData.filter((_, i) => i % 5 === 0 || i === chartData.length - 1).map((row: any, i) => {
                       if (isSIP) {
                         const rowDiff = row.Simulated - row.Current;
                         return (
                           <tr key={i} className="ledger-row group">
                             <td className="py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{row.name} (Year {row.year})</td>
                             <td className="py-3 text-right tabular text-[13px]" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(row.Current)}</td>
                             <td className="py-3 text-right tabular font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(row.Simulated)}</td>
                             <td className="py-3 text-right">
                                <span className="font-bold tabular text-xs" style={{ color: rowDiff >= 0 ? 'var(--accent-primary)' : 'var(--warning)' }}>
                                   {rowDiff > 0 ? '+' : ''}{formatCurrency(rowDiff)}
                                </span>
                             </td>
                           </tr>
                         );
                       } else {
                         const erosion = row.Nominal - row.Real;
                         return (
                           <tr key={i} className="ledger-row group">
                             <td className="py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{row.name} (Year {row.year})</td>
                             <td className="py-3 text-right tabular font-bold" style={{ color: 'var(--accent-primary)' }}>{formatCurrency(row.Nominal)}</td>
                             <td className="py-3 text-right tabular font-bold" style={{ color: '#0F5E71' }}>{formatCurrency(row.Real)}</td>
                             <td className="py-3 text-right">
                                <span className="font-bold tabular text-xs" style={{ color: 'var(--warning)' }}>
                                   -{formatCurrency(erosion)}
                                </span>
                             </td>
                           </tr>
                         );
                       }
                     })}
                   </tbody>
                 </table>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
