import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getRecommendations } from '../api/client';
import type { Recommendation } from '../types';
import { ArrowRight } from 'lucide-react';

export default function RecommendationsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    getRecommendations().then(res => {
      setRecommendations(res);
      setLoading(false);
    }).catch(console.error);
  }, [isAuthenticated, navigate]);

  if (loading) {
    return <div className="flex h-screen overflow-hidden"><Sidebar /><main className="flex-1 p-8"><div className="h-8 w-64 skeleton mb-8" /></main></div>;
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning': return '#6F353C';
      case 'success': return '#0F5E71';
      default: return '#1B436D';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'warning': return 'ACTION REQUIRED';
      case 'success': return 'POSITIVE SIGNAL';
      default: return 'OBSERVATION';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 xl:p-12 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="max-w-[1100px] w-full mx-auto">
          
          <div className="ledger-surface p-8 lg:p-12 mb-12">
            <div className="animate-fade-in-up">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>
                AI Analyst Briefing — {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
              
              <div className="pt-8 border-t border-b py-8 mb-12 flex justify-between items-start" style={{ borderColor: 'var(--text-primary)' }}>
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-primary)' }}>Active Recommendations</p>
                  <h2 className="text-6xl font-display font-bold tabular tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                    {recommendations.length}
                  </h2>
                  <p className="text-sm font-medium mt-2" style={{ color: 'var(--text-secondary)' }}>
                    {recommendations.filter(r => r.type === 'warning').length} requiring attention
                  </p>
                </div>
                <div className="flex flex-col items-end pt-2">
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>Priority</p>
                  <div className="flex flex-col gap-1 items-end">
                    {recommendations.filter(r => r.type === 'warning').length > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6F353C' }}>
                        ● {recommendations.filter(r => r.type === 'warning').length} Warnings
                      </span>
                    )}
                    {recommendations.filter(r => r.type === 'info').length > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#1B436D' }}>
                        ● {recommendations.filter(r => r.type === 'info').length} Observations
                      </span>
                    )}
                    {recommendations.filter(r => r.type === 'success').length > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#0F5E71' }}>
                        ● {recommendations.filter(r => r.type === 'success').length} Positive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recommendations List */}
              <div className="space-y-10">
                {recommendations.map((rec, i) => {
                  const color = getTypeColor(rec.type);
                  return (
                    <div key={rec.id} className="relative">
                      {/* Ordinal */}
                      <div className="flex items-start gap-6">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                          <span className="text-xl font-display font-bold tabular" style={{ color }}>
                            {i + 1}
                          </span>
                        </div>

                        <div className="flex-1 border-l-2 pl-6 pb-8" style={{ borderColor: color }}>
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color }}>
                            {getTypeLabel(rec.type)}
                          </p>
                          <h3 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>
                            {rec.title}
                          </h3>
                          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-primary)' }}>
                            {rec.message}
                          </p>

                          {/* Trigger Reason — Explainability */}
                          {rec.triggerReason && (
                            <div className="bg-[var(--bg-platform)] rounded-sm p-3 mb-4">
                              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Why This Matters</p>
                              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                {rec.triggerReason}
                              </p>
                            </div>
                          )}

                          {/* Action CTA */}
                          {rec.actionUrl && rec.actionUrl !== '#' && (
                            <Link 
                              to={rec.actionUrl} 
                              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest hover:underline"
                              style={{ color }}
                            >
                              {rec.actionText} <ArrowRight size={12} />
                            </Link>
                          )}

                          {/* Disclaimer */}
                          {rec.disclaimer && (
                            <p className="text-[9px] mt-4 leading-relaxed max-w-lg" style={{ color: 'var(--text-muted)' }}>
                              {rec.disclaimer}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Global Non-Advisory Disclaimer */}
              <div className="pt-8 border-t mt-12" style={{ borderColor: 'var(--border-subtle)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  Important Disclosure
                </p>
                <p className="text-[10px] leading-relaxed max-w-xl" style={{ color: 'var(--text-muted)' }}>
                  These recommendations are generated algorithmically from your transaction and portfolio data. They do not constitute financial, tax, or investment advice. Past performance is not indicative of future results. This platform is not registered as an investment advisor with SEBI or any regulatory body. Please consult a qualified, SEBI-registered investment advisor before making any financial decisions.
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
