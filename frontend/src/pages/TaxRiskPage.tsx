import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getDashboardSummary, getPortfolioAnalytics } from '../api/client';
import type { DashboardSummary, PortfolioAnalytics } from '../types';

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)} K`;
  return `₹${amount.toFixed(0)}`;
}

export default function TaxRiskPage() {
  const { isAuthenticated, persona } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    Promise.all([getDashboardSummary(), getPortfolioAnalytics()]).then(([s, p]) => {
      setSummary(s);
      setPortfolio(p);
      setLoading(false);
    }).catch(console.error);
  }, [isAuthenticated, navigate]);

  if (loading || !summary || !portfolio || !persona) {
    return <div className="flex h-screen overflow-hidden"><Sidebar /><main className="flex-1 p-8"><div className="h-8 w-64 skeleton mb-8" /></main></div>;
  }

  const riskProfile = persona.risk_profile;
  const riskLabel = riskProfile.charAt(0).toUpperCase() + riskProfile.slice(1);
  
  const riskColor = riskProfile === 'conservative' ? '#0F5E71' : riskProfile === 'moderate' ? '#D99B5B' : '#6F353C';
  
  // Compute asset allocation percentages
  const totalPortfolio = portfolio.totalValue;
  const equityTotal = portfolio.holdings
    .filter(h => h.type === 'stock' || h.type === 'mutual_fund')
    .reduce((s, h) => s + h.current_value, 0);
  const debtTotal = portfolio.holdings
    .filter(h => h.type === 'fd')
    .reduce((s, h) => s + h.current_value, 0);
  const equityPct = totalPortfolio > 0 ? Math.round((equityTotal / totalPortfolio) * 100) : 0;
  const debtPct = totalPortfolio > 0 ? Math.round((debtTotal / totalPortfolio) * 100) : 0;

  // Tax computations (illustrative)
  // Check for ELSS holdings
  const elssHoldings = portfolio.holdings.filter(h => 
    h.name.toLowerCase().includes('elss') || h.name.toLowerCase().includes('tax')
  );
  const elssInvested = elssHoldings.reduce((s, h) => s + h.invested_amount, 0);

  // PPF-like holdings
  const ppfHoldings = portfolio.holdings.filter(h => h.name.toLowerCase().includes('ppf'));
  const ppfAnnualEstimate = ppfHoldings.length > 0 ? Math.min(150000, ppfHoldings.reduce((s, h) => s + h.invested_amount / 5, 0)) : 0;

  // Insurance premiums (not fetched, estimate from summary context)
  const insuranceEstimate = persona.type === 'retiree' ? 50000 : persona.type === 'family_planner' ? 100000 : 23500;

  const used80C = Math.min(150000, elssInvested + ppfAnnualEstimate + insuranceEstimate);
  const remaining80C = Math.max(0, 150000 - used80C);
  const illustrativeTaxSaved = Math.round(remaining80C * 0.3);

  // LTCG estimation (equity holdings with gains held >1 year — illustrative)
  const equityGains = portfolio.holdings
    .filter(h => h.type === 'stock' || h.type === 'mutual_fund')
    .reduce((s, h) => s + Math.max(0, h.gain_loss), 0);
  const ltcgExemption = 100000;
  const taxableLTCG = Math.max(0, equityGains - ltcgExemption);
  const illustrativeLTCGTax = Math.round(taxableLTCG * 0.1);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 xl:p-12 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="max-w-[1600px] w-full mx-auto flex flex-col lg:flex-row justify-between gap-8 xl:gap-12">
          
          {/* THE LEDGER STATEMENT */}
          <div className="flex-1 ledger-surface p-8 lg:p-12 mb-12">
            <div className="animate-fade-in-up">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>
                Tax & Risk Assessment — {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
              
              {/* ════ RISK PROFILE HERO ════ */}
              <div className="pt-8 border-t border-b py-8 mb-12 flex justify-between items-start" style={{ borderColor: 'var(--text-primary)' }}>
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-primary)' }}>Risk Profile</p>
                  <h2 className="text-5xl font-display font-bold tracking-tighter" style={{ color: riskColor }}>
                    {riskLabel}
                  </h2>
                  <p className="text-sm font-medium mt-3" style={{ color: 'var(--text-secondary)' }}>
                    Based on onboarding questionnaire • Age {persona.age}
                  </p>
                </div>

                <div className="flex flex-col items-end pt-2 pr-4 lg:pr-8">
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>Current Allocation</p>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-2xl font-display font-bold tabular" style={{ color: '#1B436D' }}>{equityPct}%</span>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Equity</p>
                    </div>
                    <div className="w-px h-10" style={{ background: 'var(--border-strong)' }} />
                    <div className="text-right">
                      <span className="text-2xl font-display font-bold tabular" style={{ color: '#0F5E71' }}>{debtPct}%</span>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Debt/FD</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ════ RISK PROFILE DETAIL ════ */}
              <div className="mb-12">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--text-primary)' }}>Risk Profile Characteristics</h3>
                <table className="w-full text-left border-collapse">
                  <tbody className="text-sm">
                    <tr className="ledger-row">
                      <td className="py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Profile Classification</td>
                      <td className="py-3 text-right font-bold" style={{ color: riskColor }}>{riskLabel}</td>
                    </tr>
                    <tr className="ledger-row">
                      <td className="py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Suggested Equity–Debt Split</td>
                      <td className="py-3 text-right font-bold tabular" style={{ color: 'var(--text-primary)' }}>
                        {riskProfile === 'aggressive' ? '70–80% Equity' : riskProfile === 'moderate' ? '50–60% Equity' : '20–30% Equity'}
                      </td>
                    </tr>
                    <tr className="ledger-row">
                      <td className="py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Actual Equity Weight</td>
                      <td className="py-3 text-right font-bold tabular" style={{ color: 'var(--text-primary)' }}>{equityPct}%</td>
                    </tr>
                    <tr className="ledger-row">
                      <td className="py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Investment Horizon</td>
                      <td className="py-3 text-right font-bold" style={{ color: 'var(--text-primary)' }}>{persona.age < 35 ? 'Long-term (20+ years)' : persona.age < 55 ? 'Medium-term (10–20 years)' : 'Near-term (< 10 years)'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ════ TAX CONTEXT: SECTION 80C ════ */}
              <div className="mb-12 pb-12 border-b-2" style={{ borderColor: 'var(--text-primary)' }}>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--text-primary)' }}>Illustrative Tax Context — Section 80C</h3>
                
                <table className="w-full text-left border-collapse mb-8">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-strong)' }}>
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Component</th>
                      <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>Estimated Annual</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {elssInvested > 0 && (
                      <tr className="ledger-row">
                        <td className="py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>ELSS / Tax-saving Funds</td>
                        <td className="py-3 text-right tabular font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(Math.min(elssInvested, 150000))}</td>
                      </tr>
                    )}
                    {ppfAnnualEstimate > 0 && (
                      <tr className="ledger-row">
                        <td className="py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>PPF Contribution</td>
                        <td className="py-3 text-right tabular font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(ppfAnnualEstimate)}</td>
                      </tr>
                    )}
                    <tr className="ledger-row">
                      <td className="py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Insurance Premiums (est.)</td>
                      <td className="py-3 text-right tabular font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(insuranceEstimate)}</td>
                    </tr>
                    <tr style={{ borderTop: '2px solid var(--text-primary)' }}>
                      <td className="py-3 font-bold text-sm uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Total 80C Utilization</td>
                      <td className="py-3 text-right tabular font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{formatCurrency(used80C)} <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>/ ₹1.5L</span></td>
                    </tr>
                  </tbody>
                </table>

                {/* 80C Progress Bar */}
                <div className="mb-4">
                  <div className="w-full h-1.5 rounded-sm bg-[#E5E7EB] relative overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full rounded-sm"
                      style={{ 
                        width: `${Math.min(100, (used80C / 150000) * 100)}%`,
                        background: used80C >= 150000 ? '#0F5E71' : '#1B436D',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      {Math.round((used80C / 150000) * 100)}% Utilized
                    </span>
                    {remaining80C > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>
                        {formatCurrency(remaining80C)} remaining
                      </span>
                    )}
                  </div>
                </div>

                {/* LTCG context */}
                {equityGains > 0 && (
                  <div className="mt-8">
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-primary)' }}>LTCG Context (Equity)</h4>
                    <table className="w-full text-left border-collapse">
                      <tbody className="text-sm">
                        <tr className="ledger-row">
                          <td className="py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Total Unrealized Equity Gains</td>
                          <td className="py-3 text-right tabular font-bold" style={{ color: 'var(--accent-primary)' }}>{formatCurrency(equityGains)}</td>
                        </tr>
                        <tr className="ledger-row">
                          <td className="py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>LTCG Exemption (₹1L/yr)</td>
                          <td className="py-3 text-right tabular font-bold" style={{ color: '#0F5E71' }}>-{formatCurrency(Math.min(equityGains, ltcgExemption))}</td>
                        </tr>
                        <tr style={{ borderTop: '2px solid var(--text-primary)' }}>
                          <td className="py-3 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Illustrative LTCG Tax (10%)</td>
                          <td className="py-3 text-right tabular font-bold text-sm" style={{ color: illustrativeLTCGTax > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
                            {illustrativeLTCGTax > 0 ? formatCurrency(illustrativeLTCGTax) : '₹0'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* FOOTER / DISCLAIMER */}
              <div className="pt-8 border-t mt-8" style={{ borderColor: 'var(--border-subtle)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                  Important Tax Disclosure
                </p>
                <p className="text-[10px] leading-relaxed max-w-xl" style={{ color: 'var(--text-muted)' }}>
                  All tax figures shown are <strong>illustrative only</strong> and assume the 30% income tax bracket under the old tax regime. Actual tax liability depends on your chosen tax regime (old vs. new), total income, applicable deductions, and filing status. Section 80C limits, LTCG rates, and exemptions are subject to change per the latest Finance Act. This does not constitute tax advice. Please consult a qualified Chartered Accountant or tax professional for personalized guidance.
                </p>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: TAX MARGIN NOTES */}
          <div className="lg:w-[320px] xl:w-[360px] flex-shrink-0 relative lg:border-l lg:pl-8 xl:pl-12 border-gray-300">
            <div className="sticky top-12 pt-8 lg:pt-12">
              <div className="space-y-6 animate-fade-in-up">
                <div className="mb-8 pl-4 border-b pb-1" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h4 className="inline-block text-xs font-bold uppercase tracking-widest text-[#1B436D] border-b-2 border-[#1B436D] pb-1">Tax & Risk Notes</h4>
                </div>

                <div className="flex flex-col gap-6">
                  {/* Risk Profile Note */}
                  <div className="insight-margin-note" style={{ borderLeftColor: riskColor }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: riskColor }}>
                      RISK CLASSIFICATION
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      Your <strong>{riskLabel.toLowerCase()}</strong> profile suggests
                      {riskProfile === 'aggressive' && ' a higher tolerance for short-term volatility in pursuit of long-term capital appreciation. Ensure portfolio drawdowns won\'t affect near-term obligations.'}
                      {riskProfile === 'moderate' && ' a balanced approach to growth and stability. Your current equity–debt ratio aligns well with this profile.'}
                      {riskProfile === 'conservative' && ' prioritizing capital preservation over growth. FDs and debt instruments should form the core, with limited equity exposure for inflation hedging.'}
                    </p>
                  </div>

                  {/* 80C Tax Note */}
                  {remaining80C > 10000 && (
                    <div className="insight-margin-note">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#1B436D' }}>
                        TAX OPTIMISATION
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        Approximately <strong>{formatCurrency(remaining80C)}</strong> of your ₹1.5L Section 80C limit appears unutilized. An ELSS investment of this amount could illustratively save <strong>~{formatCurrency(illustrativeTaxSaved)}</strong> in taxes while offering equity exposure with a 3-year lock-in.
                      </p>
                      <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        Figures assume 30% tax bracket under old regime. Illustrative only.
                      </p>
                    </div>
                  )}

                  {/* Allocation Alignment Note */}
                  <div className="insight-margin-note">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#1B436D' }}>
                      ALLOCATION CHECK
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {riskProfile === 'aggressive' && equityPct < 60 && (
                        <>Your aggressive profile suggests 70–80% equity, but you're currently at {equityPct}%. Consider increasing equity exposure through diversified MFs.</>
                      )}
                      {riskProfile === 'aggressive' && equityPct >= 60 && (
                        <>Your {equityPct}% equity allocation aligns with your aggressive risk profile. Monitor rebalancing annually as you approach key life milestones.</>
                      )}
                      {riskProfile === 'moderate' && (
                        <>Your {equityPct}% equity / {debtPct}% debt split {equityPct >= 40 && equityPct <= 65 ? 'aligns well' : 'could be rebalanced to better match'} with the moderate 50-60% equity guideline.</>
                      )}
                      {riskProfile === 'conservative' && equityPct > 35 && (
                        <>Your {equityPct}% equity weight exceeds the conservative 20–30% guideline. Consider moving some equity into debt instruments for capital protection.</>
                      )}
                      {riskProfile === 'conservative' && equityPct <= 35 && (
                        <>Your {equityPct}% equity allocation is consistent with your conservative profile, maintaining focus on capital preservation.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
