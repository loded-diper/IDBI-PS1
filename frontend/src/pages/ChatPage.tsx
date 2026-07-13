import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { sendChatMessage } from '../api/client';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const { isAuthenticated, persona } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm WealthAI, your digital wealth advisor.\n\nI have access to your full financial profile, including your goals, investments, and spending trends. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Pass the previous history without IDs to the backend
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      const { reply } = await sendChatMessage(userMsg.content, history);
      
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: reply };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: "I'm sorry, I encountered an error connecting to my servers. Please try again later." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="bg-mesh" />
      <Sidebar />

      <main className="flex-1 flex flex-col relative z-10" style={{ background: 'rgba(10, 14, 26, 0.4)' }}>
        {/* Header */}
        <header className="p-6 pb-4" style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(20px)' }}>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>WealthAI</span>
            <span>Advisor</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Personalized financial guidance for {persona?.name}</p>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 animate-fade-in-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                
                {/* Avatar */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                     style={{ background: msg.role === 'user' ? 'var(--bg-card)' : 'var(--accent-gradient)', border: '1px solid var(--glass-border)' }}>
                  {msg.role === 'user' ? <User size={20} style={{ color: 'var(--text-primary)' }}/> : <Bot size={20} className="text-white" />}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                     style={{ 
                       background: msg.role === 'user' ? 'rgba(255,255,255,0.05)' : 'var(--bg-card)', 
                       border: '1px solid var(--glass-border)',
                       color: 'var(--text-primary)'
                     }}>
                   <div className="text-sm prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-a:text-indigo-400">
                     <ReactMarkdown>{msg.content}</ReactMarkdown>
                   </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 animate-fade-in-up">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                     style={{ background: 'var(--accent-gradient)', border: '1px solid var(--glass-border)' }}>
                  <Bot size={20} className="text-white" />
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm p-4 flex items-center gap-2"
                     style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
                   <Loader2 size={16} className="animate-spin text-indigo-400" />
                   <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>WealthAI is thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6" style={{ background: 'rgba(17, 24, 39, 0.6)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--glass-border)' }}>
          <div className="max-w-4xl mx-auto w-full relative">
            <form onSubmit={handleSend} className="relative flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your spending habits, investments, or goals..."
                  className="w-full bg-transparent p-4 pr-12 rounded-2xl resize-none outline-none text-sm transition-all shadow-inner"
                  style={{ 
                    border: '1px solid var(--glass-border)', 
                    color: 'var(--text-primary)', 
                    background: 'rgba(0,0,0,0.2)',
                    minHeight: '60px',
                    maxHeight: '150px'
                  }}
                  rows={2}
                  disabled={isLoading}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="absolute right-3 bottom-3 p-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: input.trim() && !isLoading ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)',
                  color: input.trim() && !isLoading ? 'white' : 'var(--text-muted)'
                }}
              >
                <Send size={18} />
              </button>
            </form>
            
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
               {['How is my spending this month?', 'Am I on track for my goals?', 'Is my portfolio balanced?'].map(starter => (
                 <button 
                  key={starter}
                  onClick={() => { setInput(starter); }}
                  className="text-xs px-3 py-1.5 rounded-full transition-colors"
                  style={{ border: '1px solid var(--glass-border)', background: 'var(--bg-glass)', color: 'var(--text-secondary)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-glass-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-glass)'}
                 >
                   {starter}
                 </button>
               ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
