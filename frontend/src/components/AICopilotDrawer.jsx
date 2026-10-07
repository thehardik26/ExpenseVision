import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Send, X, Bot, Sparkles, Trash2, RotateCw } from 'lucide-react';

export default function AICopilotDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const messagesEndRef = useRef(null);

  const defaultGreeting = {
    role: 'assistant',
    text: "👋 Hi! I'm your ExpenseVision Copilot powered by open AI models via Ollama. I have live access to your transactions and budgets in Indian Rupees (₹). How can I assist you today?"
  };

  const fetchHistory = useCallback(async () => {
    try {
      setFetchingHistory(true);
      const res = await axios.get('/api/ai/chat/history/');
      if (res.data && res.data.length > 0) {
        const formatted = res.data.map(item => ({
          id: item.id,
          role: (item.role === 'model' || item.role === 'assistant') ? 'assistant' : 'user',
          text: item.message,
          createdAt: item.created_at
        }));
        setMessages(formatted);
      } else {
        setMessages([defaultGreeting]);
      }
    } catch (err) {
      console.error("Could not load chat history:", err);
      setMessages([defaultGreeting]);
    } finally {
      setFetchingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (customText = null) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/chat/', { message: textToSend });
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }]);
    } catch (err) {
      console.error("AI Chat error:", err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: "⚠️ Could not connect to AI Copilot service. Please verify your Django server is running."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your AI Copilot conversation history?")) return;
    try {
      await axios.delete('/api/ai/chat/history/');
      setMessages([
        {
          role: 'assistant',
          text: "🧹 Conversation history cleared. Ask me anything about your expenses, budgets, or savings goals!"
        }
      ]);
    } catch (err) {
      console.error("Error clearing chat history:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed top-0 right-0 h-full w-[430px] max-w-[95vw] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-700 via-purple-700 to-violet-700 text-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
            <Bot size={20} />
          </div>
          <div>
            <div className="font-extrabold text-sm leading-tight flex items-center gap-1.5">
              <span>ExpenseVision Copilot</span>
              <Sparkles size={12} className="text-yellow-300" />
            </div>
            <div className="text-[10px] text-purple-200 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Ollama & Open Models • Saved to DB</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={fetchHistory}
            title="Refresh conversation history"
            disabled={fetchingHistory}
            className="p-1.5 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
          >
            <RotateCw size={15} className={fetchingHistory ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleClearHistory}
            title="Clear saved conversation history"
            className="p-1.5 text-purple-200 hover:text-rose-200 hover:bg-white/10 rounded-lg transition cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={onClose}
            title="Close Copilot"
            className="p-1.5 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/70">
        {fetchingHistory && messages.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400 flex flex-col items-center gap-2">
            <RotateCw size={18} className="animate-spin text-violet-500" />
            <span>Loading your saved conversation...</span>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={m.id || idx}
              className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[90%] shadow-sm whitespace-pre-line ${
                m.role === 'assistant'
                  ? 'bg-white text-slate-800 border border-slate-200/80 mr-auto shadow-slate-100'
                  : 'bg-violet-600 text-white ml-auto font-medium shadow-violet-100'
              }`}
            >
              {m.text}
            </div>
          ))
        )}

        {loading && (
          <div className="text-xs text-violet-600 font-bold italic animate-pulse flex items-center gap-1.5 p-2 bg-white/80 rounded-xl border border-violet-100 w-fit">
            <Sparkles size={14} className="text-violet-500" />
            <span>Ollama AI is analyzing your financial ledger...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-3.5 py-2 bg-slate-100/80 border-t border-slate-200 flex gap-2 overflow-x-auto text-[11px]">
        <button
          onClick={() => sendMessage("Am I over budget this month?")}
          className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-violet-600 hover:border-violet-300 whitespace-nowrap cursor-pointer transition font-semibold shadow-2xs"
        >
          📊 Am I over budget?
        </button>
        <button
          onClick={() => sendMessage("How can I save ₹2,000 more this month?")}
          className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-violet-600 hover:border-violet-300 whitespace-nowrap cursor-pointer transition font-semibold shadow-2xs"
        >
          💰 Save ₹2,000?
        </button>
        <button
          onClick={() => sendMessage("What were my largest expenses recently?")}
          className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-violet-600 hover:border-violet-300 whitespace-nowrap cursor-pointer transition font-semibold shadow-2xs"
        >
          🔍 Top expenses?
        </button>
      </div>

      {/* Input */}
      <div className="p-3.5 border-t border-slate-200 bg-white flex gap-2">
        <input
          type="text"
          className="flex-1 h-10 px-3.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium placeholder:text-slate-400"
          placeholder="Ask anything about your expenses or budgets..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-md shadow-violet-200 disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </div>
    </aside>
  );
}
