import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Send, ShoppingBag } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { Link } from '@/lib/router';
import { answerShoppingQueryWithAI } from '@/lib/shoppingAssistant';
import type { ChatMessage } from '@/types';
import { formatINR } from '@/lib/inventory';
import { StarRating } from '@/components/ui/StarRating';

const SUGGESTIONS = [
  'Show me headphones under ₹3000',
  'I need a laptop bag for college',
  'Which headphones have the best rating?',
  'What is currently in stock?',
  'Best selling electronics',
];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ShoppingAssistant() {
  const { products } = useStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: 'assistant',
      content:
        "Hi! I'm your ShopSense assistant. Ask me to find products, compare ratings, or check stock.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing, open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const res = await answerShoppingQueryWithAI(trimmed, products);

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: res.content,
          products: res.products,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('[Shopping Assistant]', error);

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content:
            'Sorry, I could not process your request right now. Please try again.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 hover:scale-105"
        aria-label="Open AI Shopping Assistant"
      >
        <Sparkles size={24} />
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-accent-500" />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-end sm:p-6">
          <div
            className="absolute inset-0 bg-ink-900/30 sm:rounded-2xl"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-[600px] sm:max-w-md sm:rounded-2xl animate-slide-up">
            <div className="flex items-center justify-between border-b border-ink-100 bg-brand-600 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">ShopSense Assistant</p>
                  <p className="text-xs text-brand-100">AI shopping helper · demo</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 hover:bg-white/15"
                aria-label="Close assistant"
              >
                <X size={20} />
              </button>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto bg-ink-50 p-4"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      m.role === 'user'
                        ? 'bg-brand-600 text-white'
                        : 'bg-white text-ink-800 shadow-card'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.products && m.products.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {m.products.map((p) => (
                          <Link
                            key={p.id}
                            to={`/product/${p.id}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 rounded-lg border border-ink-100 p-2 transition hover:border-brand-300 hover:bg-brand-50"
                          >
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-12 w-12 flex-shrink-0 rounded-md object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-1 text-xs font-semibold text-ink-800">
                                {p.name}
                              </p>
                              <p className="text-xs font-bold text-brand-700">
                                {formatINR(p.price)}
                              </p>
                              <div className="flex items-center justify-between">
                                <StarRating rating={p.rating} size={11} />
                                <span className="text-[10px] text-ink-500">
                                  {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                                </span>
                              </div>
                            </div>
                            <ShoppingBag size={14} className="text-ink-400" />
                          </Link>
                        ))}
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
                    className="whitespace-nowrap rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-xs text-ink-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about products..."
                  className="input flex-1"
                />
                <button
                  type="submit"
                  className="btn-primary h-10 w-10 p-0"
                  aria-label="Send"
                >
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
