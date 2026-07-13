import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMe } from '../api/client';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { Save, User } from 'lucide-react';

export default function SettingsPage() {
  const { persona, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [riskProfile, setRiskProfile] = useState('moderate');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (persona) {
      setName(persona.name);
      setRiskProfile(persona.risk_profile);
    }
  }, [isAuthenticated, navigate, persona]);

  if (!persona) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    try {
      await updateMe({ name, risk_profile: riskProfile });
      // Reload page to refresh Context persona completely or rely on state. The simplest is a reload for synthetic seed data updates.
      window.location.reload();
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 xl:p-12 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="max-w-4xl mx-auto">
          <div className="animate-fade-in-up">
            <h2 className="text-xl font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-primary)' }}>Account Settings</h2>
            <p className="text-[10px] uppercase font-bold tracking-widest mb-12" style={{ color: 'var(--text-muted)' }}>Ledger Configurations & Details</p>
            
            <form onSubmit={handleSave} className="space-y-8 ledger-surface p-8 max-w-2xl border-t-2" style={{ borderColor: 'var(--accent-primary)' }}>
              
              <div>
                 <label className="block text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                   <User size={16} /> Legal Name
                 </label>
                 <input 
                   type="text" required
                   value={name} onChange={e => setName(e.target.value)}
                   className="w-full bg-transparent border-b outline-none py-2 text-base font-bold transition-colors"
                   style={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
                 />
              </div>

              <div>
                 <label className="block text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>Assessed Risk Profile</label>
                 <select 
                   value={riskProfile} onChange={e => setRiskProfile(e.target.value)}
                   className="w-full bg-transparent border-b outline-none py-2 text-base font-bold transition-colors"
                   style={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
                 >
                    <option value="conservative">Conservative</option>
                    <option value="moderate">Moderate</option>
                    <option value="aggressive">Aggressive</option>
                 </select>
                 <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                   Adjusting this profile will recalibrate your AI analyst recommendations and target allocation suggestions across the ledger.
                 </p>
              </div>

              <div className="pt-8 flex items-center gap-4">
                 <button 
                   type="submit" 
                   disabled={isSaving || name === persona.name && riskProfile === persona.risk_profile}
                   className="py-3 px-8 text-white text-xs font-bold uppercase tracking-widest transition-opacity flex items-center gap-2 cursor-pointer"
                   style={{ background: 'var(--accent-primary)', opacity: (isSaving || (name === persona.name && riskProfile === persona.risk_profile)) ? 0.7 : 1 }}
                 >
                   {isSaving ? <Save size={16} className="animate-pulse" /> : <Save size={16} />} 
                   {isSaving ? 'Updating...' : 'Save Settings'}
                 </button>
                 
                 {saved && (
                   <span className="text-xs font-bold" style={{ color: '#1B436D' }}>Preferences recorded locally.</span>
                 )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
