import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getGoalAnalytics } from '../api/client';
import type { GoalProjected } from '../types';

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount.toFixed(0)}`;
}

export default function GoalsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<GoalProjected[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    getGoalAnalytics().then(res => {
      setGoals(res);
      setLoading(false);
    }).catch(console.error);
  }, [isAuthenticated, navigate]);

  if (loading) {
     return <div className="flex h-screen overflow-hidden"><Sidebar /><main className="flex-1 p-8"><div className="h-8 w-64 skeleton mb-8" /></main></div>;
  }

  const offTrackGoals = goals.filter(g => g.isOffTrack && g.remainingAmount > 0);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 xl:p-12 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="max-w-[1600px] w-full mx-auto flex flex-col lg:flex-row justify-between gap-8 xl:gap-12">
          
          {/* THE LEDGER STATEMENT */}
          <div className="flex-1 ledger-surface p-8 lg:p-12 mb-12">
            <div className="animate-fade-in-up">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>
                Capital Allocation Mandates — {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
              
              <div className="pt-8 border-t border-b py-8 mb-12 flex justify-between items-start" style={{ borderColor: 'var(--text-primary)' }}>
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-primary)' }}>Total Earmarked Capital</p>
                  <h2 className="text-6xl font-display font-bold tabular tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(goals.reduce((acc, g) => acc + g.current_amount, 0))}
                  </h2>
                  <p className="text-sm tabular font-medium mt-2" style={{ color: 'var(--text-secondary)' }}>
                    Target: <span className="font-bold">{formatCurrency(goals.reduce((acc, g) => acc + g.target_amount, 0))}</span>
                  </p>
                </div>
                
                <div className="flex flex-col items-end pt-2">
                   <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>Active Mandates</p>
                   <span className="text-5xl font-display font-bold tabular text-[#1B436D]">
                      {goals.length}
                   </span>
                   {offTrackGoals.length > 0 && (
                     <p className="text-[10px] font-bold uppercase tracking-widest mt-2" style={{ color: 'var(--warning)' }}>
                       {offTrackGoals.length} Off-Track
                     </p>
                   )}
                </div>
              </div>

              {/* Mandates List */}
              <div className="mb-16">
                <div className="space-y-12">
                  {goals.map((goal, index) => {
                    const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                    const isCompleted = progress >= 100;
                    
                    const targetDate = new Date(goal.target_date);
                    const projectedDate = new Date(goal.projectedDate);
                    const isBehind = goal.isOffTrack && !isCompleted;

                    return (
                      <div key={index} className="flex flex-col relative group">
                        <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-6">
                           <div>
                              <div className="flex items-center gap-3 mb-2">
                                 <div className={`w-3 h-3 rounded-none ${isCompleted ? 'bg-[#0F5E71]' : isBehind ? 'bg-[#6F353C]' : 'bg-[#1B436D]'}`} />
                                 <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>{goal.name}</h3>
                              </div>
                              <p className="text-[10px] font-bold uppercase tracking-widest ml-6" style={{ color: 'var(--text-secondary)' }}>Class: {goal.category.replace(/_/g, ' ')}</p>
                           </div>
                           
                           <div className="flex gap-8 text-right">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Target Horizon</p>
                                <p className="text-sm font-medium tabular" style={{ color: 'var(--text-primary)' }}>
                                  {targetDate.toLocaleDateString('en-IN', {month: 'short', year: 'numeric'})}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Projected</p>
                                <p className="text-sm font-medium tabular" style={{ color: isCompleted ? '#0F5E71' : isBehind ? '#6F353C' : '#1B436D' }}>
                                  {isCompleted ? 'ACHIEVED' : projectedDate.toLocaleDateString('en-IN', {month: 'short', year: 'numeric'})}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Remaining</p>
                                <p className="text-sm font-medium tabular" style={{ color: 'var(--text-primary)' }}>
                                  {isCompleted ? '—' : formatCurrency(goal.remainingAmount)}
                                </p>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                           <span className="text-3xl font-display font-bold tabular tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                              {formatCurrency(goal.current_amount)} <span className="text-xl font-medium" style={{ color: 'var(--text-muted)' }}>/ {formatCurrency(goal.target_amount)}</span>
                           </span>
                           <span className="text-sm font-bold tabular" style={{ color: isCompleted ? '#0F5E71' : isBehind ? '#6F353C' : '#1B436D' }}>
                              {progress.toFixed(1)}%
                           </span>
                        </div>

                        {/* Progress Bar — slim, same visual language as health score */}
                        <div className="w-full h-1.5 rounded-sm bg-[#E5E7EB] mt-1 relative overflow-hidden">
                           <div 
                             className="absolute top-0 left-0 h-full rounded-sm transition-all duration-700"
                             style={{ 
                               width: `${progress}%`,
                               background: isCompleted ? '#0F5E71' : isBehind ? '#6F353C' : '#1B436D',
                             }}
                           />
                        </div>

                        {/* Status badge for off-track */}
                        {isBehind && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#6F353C]" />
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6F353C' }}>
                              {goal.monthsLate} month{goal.monthsLate !== 1 ? 's' : ''} behind schedule
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FOOTER */}
              <div className="pt-8 border-t mt-12" style={{ borderColor: 'var(--border-subtle)' }}>
                 <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Obligation & Mandate Status <br/>
                    <span className="font-normal tabular">{new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC</span>
                 </p>
                 <p className="text-[10px] mt-2 leading-relaxed max-w-xl" style={{ color: 'var(--text-muted)' }}>
                    Projections are modeled dynamically against aggregate 30-day trailing savings rates. Volatility in gross income or portfolio yields may impact projected horizons.
                 </p>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: OFF-TRACK MARGIN NOTES */}
          {offTrackGoals.length > 0 && (
            <div className="lg:w-[320px] xl:w-[360px] flex-shrink-0 relative lg:border-l lg:pl-8 xl:pl-12 border-gray-300">
              <div className="sticky top-12 pt-8 lg:pt-12">
                <div className="space-y-6 animate-fade-in-up">
                  <div className="mb-8 pl-4 border-b pb-1" style={{ borderColor: 'var(--border-subtle)' }}>
                    <h4 className="inline-block text-xs font-bold uppercase tracking-widest text-[#1B436D] border-b-2 border-[#1B436D] pb-1">Goal Analyst</h4>
                  </div>

                  <div className="flex flex-col gap-6">
                    {offTrackGoals.map((goal, i) => (
                      <div key={i} className="insight-margin-note">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#6F353C' }}>
                          PACING ALERT — {goal.name.toUpperCase()}
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                          At this pace, you'll reach <strong>{goal.name}</strong> approximately {goal.monthsLate} month{goal.monthsLate !== 1 ? 's' : ''} late.
                          {goal.additionalSIPNeeded > 0 && (
                            <> Consider increasing your monthly allocation by <strong style={{ color: '#1B436D' }}>₹{goal.additionalSIPNeeded.toLocaleString('en-IN')}</strong> to stay on target.</>
                          )}
                        </p>
                        <p className="text-[10px] mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          Required: {formatCurrency(goal.monthlySIPRequired)}/mo • Current pace: {formatCurrency(goal.monthlySIPRequired - (goal.additionalSIPNeeded || 0))}/mo
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
