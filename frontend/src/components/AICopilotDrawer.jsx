import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, X, Bot, Sparkles } from 'lucide-react';

export default function AICopilotDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      text: "👋 Hi! I'm your Gemini AI financial copilot. I have live access to your transactions and budgets in Indian Rupees (₹). How can I assist you today?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/chat/', { message: textToSend });
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }]);
    } catch (err) {
      console.error("AI Chat error:", err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "⚠️ Could not connect to Gemini service. Please verify your Django server is running." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-indigo-700 via-purple-700 to-violet-700 text-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
            <Bot size={20} />
          </div>
          <div>
            <div className="font-extrabold text-sm leading-tight flex items-center gap-1.5">
              <span>ExpenseVision AI</span>
              <Sparkles size={12} className="text-yellow-300" />
            </div>
            <div className="text-[11px] text-purple-200 font-medium">Gemini Grounded Intelligence</div>
          </div>
        </div>
        <button onClick={onClose} className="text-white hover:text-purple-200 cursor-pointer p-1">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-slate-50/60">
        {messages.map((m, idx) => (
          <div 
            key={idx} 
            className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[90%] shadow-sm whitespace-pre-line ${
              m.role === 'assistant' 
                ? 'bg-white text-slate-800 border border-slate-200/80 mr-auto' 
                : 'bg-violet-600 text-white ml-auto font-medium'
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="text-xs text-violet-600 font-bold italic animate-pulse flex items-center gap-1.5 p-2">
            <Sparkles size={14} />
            <span>Gemini is analyzing your finances...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips (From Master Plan) */}
      <div className="px-4 py-2 bg-slate-100/70 border-t border-slate-200 flex gap-2 overflow-x-auto text-[11px]">
        <button
          onClick={() => sendMessage("Am I over budget this month?")}
          className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-violet-600 hover:border-violet-300 whitespace-nowrap cursor-pointer transition font-semibold"
        >
          📊 Am I over budget?
        </button>
        <button
          onClick={() => sendMessage("How can I save ₹2,000 more?")}
          className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-violet-600 hover:border-violet-300 whitespace-nowrap cursor-pointer transition font-semibold"
        >
          💰 Save ₹2,000?
        </button>
        <button
          onClick={() => sendMessage("Can I afford a ₹3,500 flight?")}
          className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-violet-600 hover:border-violet-300 whitespace-nowrap cursor-pointer transition font-semibold"
        >
          ✈️ Afford ₹3,500?
        </button>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-white flex gap-2">
        <input 
          type="text" 
          className="flex-1 h-10 px-3.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium" 
          placeholder="Ask anything (e.g. How is my spending this month?)..." 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button 
          onClick={() => sendMessage()}
          disabled={loading}
          className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-md shadow-violet-200 disabled:opacity-50"
        >
          <Send size={15} />
        </button>
      </div>
    </aside>
  );
}
