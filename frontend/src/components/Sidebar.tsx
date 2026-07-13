import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  path: string;
  active: boolean;
  disabled?: boolean;
}

export default function Sidebar() {
  const { persona, logout } = useAuth();
  const navigate = useNavigate();
  const location = window.location;
  const [collapsed, setCollapsed] = useState(false);

  const navItems: NavItem[] = [
    { label: 'Portfolio Statement', path: '/dashboard', active: location.pathname === '/dashboard' },
    { label: 'Cash Flow', path: '/spending', active: location.pathname === '/spending' },
    { label: 'Asset Register', path: '/portfolio', active: location.pathname === '/portfolio' },
    { label: 'Strategic Objectives', path: '/goals', active: location.pathname === '/goals' },
    { label: 'Wealth Simulator', path: '/simulator', active: location.pathname === '/simulator' },
    { label: 'Recommendations', path: '/recommendations', active: location.pathname === '/recommendations' },
    { label: 'Tax & Risk', path: '/tax-risk', active: location.pathname === '/tax-risk' },
  ];

  const riskColor = persona?.risk_profile === 'conservative' ? '#0F5E71' : persona?.risk_profile === 'moderate' ? '#D99B5B' : '#6F353C';
  const riskLabel = persona?.risk_profile ? persona.risk_profile.charAt(0).toUpperCase() + persona.risk_profile.slice(1) : '';

  return (
    <aside
      className="flex flex-col h-full transition-all duration-300 z-10"
      style={{
        width: collapsed ? '72px' : '260px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Brand */}
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-xl font-display font-bold tracking-tight" style={{ color: 'var(--accent-primary)' }}>WealthAI</span>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Private Ledger</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <ChevronLeft size={18} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
        </button>
      </div>

      {/* Client Identity */}
      {persona && (
        <div className="p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full text-lg font-bold font-display flex items-center justify-center flex-shrink-0 relative">
              <div className="absolute inset-0 rounded-full bg-[#1B436D] opacity-10" />
              <span className="text-[#1B436D]">{persona.name.charAt(0)}</span>
              <div className="absolute inset-0 rounded-full border border-[#1B436D] opacity-20" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {persona.name}
                </p>
                <button 
                  onClick={() => navigate('/settings')}
                  className="text-[10px] uppercase font-bold tracking-widest truncate tabular text-left hover:underline transition-all" 
                  style={{ color: 'var(--accent-primary)' }}
                >
                  ID: ACT-{persona.id.substring(0,4).toUpperCase()} • SETTINGS →
                </button>
              </div>
            )}
          </div>
          
          {/* Risk Profile Badge */}
          {!collapsed && (
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: riskColor }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: riskColor }}>
                {riskLabel} Risk
              </span>
            </div>
          )}
          {collapsed && (
            <div className="mt-2 flex justify-center" title={`${riskLabel} Risk`}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: riskColor }} />
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-5 space-y-0.5 overflow-y-auto min-h-0">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => !item.disabled && navigate(item.path)}
            disabled={item.disabled}
            className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-all ${item.active ? 'opacity-100' : 'opacity-70 outline-none'}`}
            style={{
              color: item.active ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderLeft: item.active ? '3px solid var(--accent-primary)' : '3px solid transparent',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              fontWeight: item.active ? 600 : 500,
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            onMouseEnter={e => {
              if (!item.disabled && !item.active) {
                e.currentTarget.style.opacity = '1';
              }
            }}
            onMouseLeave={e => {
              if (!item.active) {
                e.currentTarget.style.opacity = '0.7';
              }
            }}
            title={collapsed ? item.label : undefined}
          >
            {!collapsed && <span className="tracking-wide uppercase text-[11px] font-bold">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Actions */}
      <div className="p-0 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="w-full px-5 py-4 text-xs tracking-wider uppercase font-bold transition-colors flex items-center"
          style={{
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={e => {
             e.currentTarget.style.background = 'var(--bg-hover)';
             e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={e => {
             e.currentTarget.style.background = 'transparent';
             e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          {!collapsed && <span>End Session</span>}
        </button>
      </div>
    </aside>
  );
}
