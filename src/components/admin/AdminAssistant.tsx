import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Send, Bot } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { answerAdminQuery } from '@/lib/adminAssistant';
import { formatINR } from '@/lib/inventory';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  table?: { columns: string[]; rows: (string | number)[][] };
}

const SUGGESTIONS = [
  'Which products should I restock?',
  'Which products are low in stock?',
  'What are my best-selling products?',
  'Which category generated the most sales?',
  'What inventory needs attention?',
];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function AdminAssistant() {
  const { products, orders } = useStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: uid(),
      role: 'assistant',
      content:
        "Hi! I'm the ShopSense inventory assistant. Ask me about restocking, low stock, best-sellers, slow movers, category performance, or revenue.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing, open]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { id: uid(), role: 'user', content: trimmed }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const res = answerAdminQuery(trimmed, products, orders);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'assistant', content: res.content, table: res.table },
      ]);
      setTyping(false);
    }, 450);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 text-white shadow-lg shadow-ink-900/30 transition hover:scale-105 hover:bg-ink-800"
        aria-label="Open AI Inventory Assistant"
      >
        <Bot size={24} />
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-accent-500" />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-end sm:p-6">
          <div className="absolute inset-0 bg-ink-900/30 sm:rounded-2xl" onClick={() => setOpen(false)} />
          <div className="relative flex h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-[620px] sm:max-w-lg sm:rounded-2xl animate-slide-up">
            <div className="flex items-center justify-between border-b border-ink-100 bg-ink-900 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  <Bot size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Inventory Assistant</p>
                  <p className="text-xs text-ink-300">AI inventory helper · demo</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-white/15" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-ink-50 p-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      m.role === 'user' ? 'bg-ink-900 text-white' : 'bg-white text-ink-800 shadow-card'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.table && m.table.rows.length > 0 && (
                      <div className="mt-3 overflow-x-auto rounded-lg border border-ink-100">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-ink-50 text-ink-600">
                            <tr>
                              {m.table.columns.map((c) => (
                                <th key={c} className="whitespace-nowrap px-2.5 py-1.5 font-semibold">{c}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ink-100">
                            {m.table.rows.map((row, i) => (
                              <tr key={i}>
                                {row.map((cell, j) => (
                                  <td key={j} className="whitespace-nowrap px-2.5 py-1.5 text-ink-700">
                                    {typeof cell === 'number' && j > 0
                                      ? formatINR(cell)
                                      : String(cell)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-card">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-ink-100 bg-white p-3">
              <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="whitespace-nowrap rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-xs text-ink-600 hover:border-ink-900/30 hover:bg-ink-100"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about inventory, sales, restocking..."
                  className="input flex-1"
                />
                <button type="submit" className="btn h-10 w-10 bg-ink-900 p-0 text-white hover:bg-ink-800" aria-label="Send">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
