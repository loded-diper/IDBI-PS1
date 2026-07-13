import { useState, useEffect, useRef } from 'react';
import { getRecommendations, sendChatMessage } from '../../api/client';
import type { Recommendation } from '../../types';
import { Link } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getRecommendations()
      .then(res => {
        setRecommendations(res);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading || recommendations.length === 0) return null;

  const dismiss = (id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || chatLoading) return;
    
    const query = inputText.trim();
    setInputText('');
    setChatLoading(true);
    
    try {
      const res = await sendChatMessage(query, []);
      const customRec: Recommendation = {
        id: `chat-${Date.now()}`,
        title: query,
        message: res.reply,
        type: 'info'
      };
      // Prepend to top of margin
      setRecommendations(prev => [customRec, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="mb-8 pl-4 border-b pb-1" style={{ borderColor: 'var(--border-subtle)' }}>
        <h4 className="inline-block text-xs font-bold uppercase tracking-widest text-[#1B436D] border-b-2 border-[#1B436D] pb-1">AI Analyst</h4>
      </div>
      
      <div className="flex flex-col gap-8 relative mt-auto">
        {recommendations.map((rec) => (
          <div key={rec.id} className="insight-margin-note insight-leader group relative">
             <button 
               onClick={() => dismiss(rec.id)} 
               className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" 
               style={{ color: 'var(--text-muted)' }}
               aria-label="Dismiss note"
             >
               <X size={14} />
             </button>

             <h4 className="text-sm font-bold mb-2 uppercase tracking-wide border-l-2 pl-2" style={{ color: rec.type === 'warning' ? '#6F353C' : '#1B436D', borderColor: rec.type === 'warning' ? '#6F353C' : '#1B436D' }}>
                {rec.title}
             </h4>
             
             <p className="text-sm mb-4 leading-relaxed font-medium" style={{ color: 'var(--text-primary)' }}>
                {rec.message}
             </p>
             
             {rec.actionUrl && rec.actionUrl !== '#' && (
               <Link to={rec.actionUrl} className="inline-flex items-center gap-1 text-sm font-bold hover:underline opacity-80" style={{ color: '#1B436D' }}>
                  {rec.actionText} <ArrowRight size={12} />
               </Link>
             )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 mt-8 pt-8 pb-8 bg-[var(--bg-platform)] z-10">
         <form onSubmit={handleChat}>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={chatLoading ? "Analyst is typing..." : "Ask about this statement..."}
              disabled={chatLoading}
              className="w-full bg-transparent border-b border-gray-400 focus:border-[#1B436D] outline-none py-2 text-sm font-bold placeholder-gray-500 transition-colors"
              style={{ color: 'var(--text-primary)' }}
            />
         </form>
      </div>
    </div>
  );
}
