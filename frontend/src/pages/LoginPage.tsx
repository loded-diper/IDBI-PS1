import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPersonas, register } from '../api/client';
import type { Persona } from '../types';
import { ChevronRight, Sparkles, Plus, ArrowLeft } from 'lucide-react';

const typeLabels: Record<string, string> = {
  young_professional: 'Young Professional',
  family_planner: 'Family Planner',
  retiree: 'Retiree',
};

const riskColors: Record<string, string> = {
  aggressive: '#ef4444',
  moderate: '#f59e0b',
  conservative: '#10b981',
};

const riskGradients: Record<string, string> = {
  aggressive: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.03))',
  moderate: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.03))',
  conservative: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.03))',
};

export default function LoginPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  
  // Registration form
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState('30');
  const [regRisk, setRegRisk] = useState('moderate');
  const [regGoal, setRegGoal] = useState('');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }
    getPersonas().then(setPersonas).catch(console.error);
  }, [isAuthenticated, navigate]);

  const handleLogin = async (personaId: string) => {
    setSelected(personaId);
    setLoggingIn(true);
    try {
      await login(personaId);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return;
    
    setLoggingIn(true);
    try {
      await register({
        name: regName,
        age: Number(regAge),
        risk_profile: regRisk,
        goal: regGoal
      });
      // Auth context does not automatically log us in since manual JWT setting happened in client.ts
      // But we can just forcefully reload or rely on a generic reload.
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Background */}
      <div className="bg-mesh" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }} />

      {/* Header */}
      <div className="text-center mb-16 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 text-3xl font-bold"
          style={{ background: 'var(--accent-gradient)', boxShadow: '0 8px 32px rgba(99,102,241,0.35)' }}>
          ₹
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>
          <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            WealthAI
          </span>
        </h1>
        <p className="text-base max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Choose a profile to explore your personalized financial insights
        </p>
      </div>

      {/* Main Content Area */}
      {!showCreate ? (
        <div className="w-full max-w-lg space-y-3 stagger-children">
          {personas.map((persona) => (
            <button
              key={persona.id}
              onClick={() => handleLogin(persona.id)}
              disabled={loggingIn}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-300 group"
              style={{
                background: selected === persona.id
                  ? 'rgba(99,102,241,0.12)'
                  : 'var(--bg-glass)',
                border: `1px solid ${selected === persona.id ? 'rgba(99,102,241,0.4)' : 'var(--glass-border)'}`,
                backdropFilter: 'blur(16px)',
                cursor: loggingIn && selected === persona.id ? 'wait' : 'pointer',
              }}
              onMouseEnter={e => {
                if (selected !== persona.id) {
                  e.currentTarget.style.background = 'var(--bg-glass-hover)';
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }
              }}
              onMouseLeave={e => {
                if (selected !== persona.id) {
                  e.currentTarget.style.background = 'var(--bg-glass)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}
              id={`persona-card-${persona.id}`}
            >
              {/* Avatar */}
              <div className="text-4xl flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-xl"
                style={{ background: riskGradients[persona.risk_profile] }}>
                {persona.avatar_emoji}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {persona.name}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent-primary)' }}>
                    {typeLabels[persona.type]}
                  </span>
                </div>
                <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                  Age {persona.age} · <span style={{ color: riskColors[persona.risk_profile] }}>
                    {persona.risk_profile.charAt(0).toUpperCase() + persona.risk_profile.slice(1)}
                  </span> risk profile
                </p>
              </div>

              {/* Arrow / Loader */}
              <div className="flex-shrink-0">
                {loggingIn && selected === persona.id ? (
                  <Sparkles size={18} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                ) : (
                  <ChevronRight size={18}
                    className="transition-transform group-hover:translate-x-0.5"
                    style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
            </button>
          ))}
          
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 p-4 mt-6 rounded-2xl transition-colors font-bold uppercase tracking-widest text-xs"
            style={{ border: '2px dashed var(--accent-primary)', color: 'var(--accent-primary)' }}
          >
            <Plus size={16} /> Initialize New Ledger (Create Account)
          </button>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="w-full max-w-lg glass-card p-8 animate-fade-in-up">
           <button 
             type="button" 
             onClick={() => setShowCreate(false)}
             className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--text-muted)' }}
           >
             <ArrowLeft size={14} /> Back
           </button>
           
           <h2 className="text-2xl font-display font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Initialize Profile</h2>
           
           <div className="space-y-5">
              <div>
                 <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-primary)' }}>Full Name</label>
                 <input 
                   type="text" required
                   value={regName} onChange={e => setRegName(e.target.value)}
                   className="w-full bg-white border outline-none px-4 py-3 text-sm font-medium transition-colors"
                   style={{ borderColor: 'var(--border-strong)', borderRadius: 'var(--radius-md)' }}
                 />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-primary)' }}>Age</label>
                   <input 
                     type="number" min="18" max="100" required
                     value={regAge} onChange={e => setRegAge(e.target.value)}
                     className="w-full bg-white border outline-none px-4 py-3 text-sm font-medium"
                     style={{ borderColor: 'var(--border-strong)', borderRadius: 'var(--radius-md)' }}
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-primary)' }}>Risk Profile</label>
                   <select 
                     value={regRisk} onChange={e => setRegRisk(e.target.value)}
                     className="w-full bg-white border outline-none px-4 py-3 text-sm font-medium"
                     style={{ borderColor: 'var(--border-strong)', borderRadius: 'var(--radius-md)' }}
                   >
                      <option value="conservative">Conservative</option>
                      <option value="moderate">Moderate</option>
                      <option value="aggressive">Aggressive</option>
                   </select>
                </div>
              </div>
              
              <div>
                 <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-primary)' }}>Primary Goal</label>
                 <input 
                   type="text" placeholder="e.g. Buying a House, Early Retirement" required
                   value={regGoal} onChange={e => setRegGoal(e.target.value)}
                   className="w-full bg-white border outline-none px-4 py-3 text-sm font-medium"
                   style={{ borderColor: 'var(--border-strong)', borderRadius: 'var(--radius-md)' }}
                 />
              </div>
           </div>

           <button 
             type="submit" 
             disabled={loggingIn || !regName.trim()}
             className="w-full mt-8 py-4 text-white text-sm font-bold uppercase tracking-widest transition-opacity flex items-center justify-center gap-2"
             style={{ background: 'var(--accent-primary)', borderRadius: 'var(--radius-md)', opacity: (loggingIn || !regName.trim()) ? 0.7 : 1 }}
           >
             {loggingIn ? <Sparkles size={16} className="animate-spin" /> : 'Generate Private Ledger'}
           </button>
        </form>
      )}

      {/* Footer */}
      <p className="mt-14 text-xs animate-fade-in" style={{ color: 'var(--text-muted)', animationDelay: '0.5s' }}>
        Demo Mode — All data is synthetic · Not financial advice
      </p>
    </div>
  );
}
