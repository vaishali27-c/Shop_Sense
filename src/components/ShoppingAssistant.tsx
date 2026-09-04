import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Send, ShoppingBag, ArrowRight, LoaderCircle } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { Link, useRouter } from '@/lib/router';
import { answerShoppingQueryWithAI, classifyShoppingIntent, type AssistantContext } from '@/lib/shoppingAssistant';
import type { ChatMessage } from '@/types';
import { formatINR, formatDate } from '@/lib/inventory';
import { StarRating } from '@/components/ui/StarRating';

const PRODUCT_SUGGESTIONS = ['Find headphones under ₹3000', 'Recommend a laptop', 'Track my order', 'Show my cart'];
const ORDER_SUGGESTIONS = ['Track my latest order', 'What did I buy?', 'Show my cart'];
const CART_SUGGESTIONS = ['Find headphones under ₹3000', 'Recommend a laptop', 'Track my order'];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ShoppingAssistant() {
  const { products, cart, currentUser, addToCart } = useStore();
  const { navigate } = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [contextOrder, setContextOrder] = useState<NonNullable<ChatMessage['orders']>[number] | null>(null);
  const [lastProducts, setLastProducts] = useState<typeof products>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: 'assistant',
      content:
        "Hi! 👋 I'm your ShopSense assistant. I can help you find products, compare options, check stock, manage your cart, or track your orders.",
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
      const intent = classifyShoppingIntent(trimmed);
      const context: AssistantContext = {
        lastProducts,
        selectedProductId,
        selectedOrderId: contextOrder?.orderId,
      };
      const isCartQuery = /\b(my|the|this)\s+cart\b|\bcart\b.*\b(items?|contain|have|inside)\b/i.test(trimmed)
        || /\bwhat(?:'s| is)\s+in\s+(?:my|the)\s+cart\b/i.test(trimmed);
      const selectedProduct = products.find((product) => product.id === selectedProductId) ?? lastProducts[0];

      if (intent === 'CART_ACTION' && /checkout|purchase|go to cart/i.test(trimmed)) {
        if (!currentUser) {
          setMessages((prev) => [...prev, { id: uid(), role: 'assistant', content: 'Please log in before continuing to checkout.', createdAt: new Date().toISOString() }]);
        } else {
          navigate(/checkout/i.test(trimmed) ? '/checkout' : '/cart');
          setMessages((prev) => [...prev, { id: uid(), role: 'assistant', content: 'Taking you there now.', createdAt: new Date().toISOString() }]);
          setOpen(false);
        }
        setTyping(false);
        return;
      }

      if (intent === 'CART_ACTION' && /add (this|it)|buy this/i.test(trimmed) && selectedProduct) {
        if (currentUser) {
          addToCart(selectedProduct.id);
          setMessages((prev) => [...prev, { id: uid(), role: 'assistant', content: `${selectedProduct.name} was added to your cart.`, products: [{ id: selectedProduct.id, name: selectedProduct.name, price: selectedProduct.price, image: selectedProduct.image, rating: selectedProduct.rating, stock: selectedProduct.stock }], createdAt: new Date().toISOString() }]);
        } else {
          setMessages((prev) => [...prev, { id: uid(), role: 'assistant', content: 'Please log in before adding items to your cart.', createdAt: new Date().toISOString() }]);
        }
        setTyping(false);
        return;
      }
      const cartItems = cart
        .map((cartItem) => {
          const product = products.find((item) => item.id === cartItem.productId);
          return product ? { product, quantity: cartItem.quantity } : null;
        })
        .filter((item): item is { product: (typeof products)[number]; quantity: number } => Boolean(item));
      const res = isCartQuery
        ? currentUser && cartItems.length > 0
          ? { content: `You have ${cartItems.reduce((sum, item) => sum + item.quantity, 0)} item(s) in your cart, totaling ${formatINR(cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0))}.`, products: cartItems.map((item) => ({ id: item.product.id, name: item.product.name, price: item.product.price, image: item.product.image, rating: item.product.rating, stock: item.product.stock })), orders: [] }
          : currentUser
            ? { content: 'Your cart is empty right now. Browse the catalog to add something you like.', products: [], orders: [] }
            : { content: 'I can check your cart, but you’ll need to log in first.', products: [], orders: [] }
        : await answerShoppingQueryWithAI(trimmed, products, context, Boolean(currentUser));
      if (res.products?.length) {
        const ids = new Set(res.products.map((product) => product.id));
        setLastProducts(products.filter((product) => ids.has(product.id)));
        setSelectedProductId(res.products[0].id);
      }
      if (res.orders?.[0]) setContextOrder(res.orders[0]);

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: res.content,
          products: res.products,
          orders: res.orders,
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
          content: "Sorry, I couldn't complete that request. Please try again.",
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
          <div className="relative flex h-[min(760px,92vh)] w-full min-w-0 flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-[640px] sm:max-w-md sm:rounded-2xl animate-slide-up">
            <div className="flex shrink-0 items-center justify-between border-b border-brand-500/30 bg-brand-600 px-4 py-3.5 text-white">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                  <Sparkles size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">ShopSense Assistant</p>
                  <p className="mt-0.5 text-xs text-brand-100">AI shopping helper · demo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/70"
                aria-label="Close assistant"
              >
                <X size={20} />
              </button>
            </div>

            <div
              ref={scrollRef}
              aria-label="Assistant conversation"
              className="min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto bg-ink-50 p-3 sm:p-4"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-brand-600 text-white'
                        : 'bg-white text-ink-800 shadow-card'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.products && m.products.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {m.products.map((p) => (
                          <div
                            key={p.id}
                            className="rounded-xl border border-ink-100 bg-ink-50 p-2.5 transition hover:border-brand-200"
                          >
                            <div className="flex items-center gap-3">
                              <img src={p.image} alt="" className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" />
                              <div className="min-w-0 flex-1">
                                <Link to={`/product/${p.id}`} onClick={() => setOpen(false)} className="block line-clamp-2 text-xs font-semibold text-ink-800 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400">
                                  {p.name}
                                </Link>
                                <p className="mt-0.5 text-xs font-bold text-brand-700">{formatINR(p.price)}</p>
                                <div className="mt-1 flex items-center gap-2">
                                  <StarRating rating={p.rating} size={11} />
                                  <span className="text-[10px] text-ink-500">{p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</span>
                                </div>
                              </div>
                              <button type="button" onClick={() => addToCart(p.id)} className="shrink-0 rounded-lg bg-brand-600 p-2 text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1" aria-label={`Add ${p.name} to cart`}>
                                <ShoppingBag size={14} />
                              </button>
                            </div>
                            <Link to={`/product/${p.id}`} onClick={() => setOpen(false)} className="mt-2 flex items-center justify-end gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-400">View product <ArrowRight size={12} /></Link>
                          </div>
                        ))}
                        <Link to="/products" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1 rounded-lg py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-400">View more results <ArrowRight size={12} /></Link>
                      </div>
                    )}
                    {m.orders && m.orders.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {m.orders.map((order) => (
                          <div key={order.orderId} className="rounded-xl border border-ink-100 bg-white p-3 shadow-sm">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-ink-800">{order.orderId}</p>
                              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700">{order.status}</span>
                            </div>
                            <p className="mt-1 text-[10px] text-ink-500">{formatDate(order.orderDate)} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)</p>
                            <div className="mt-2 space-y-1 text-xs text-ink-700">
                              {order.items.slice(0, 3).map((item) => <p key={`${order.orderId}-${item.productId}`}>{item.name} x{item.quantity}</p>)}
                            </div>
                            <div className="mt-2 flex items-center justify-between border-t border-ink-100 pt-2 text-xs">
                              <span className="font-semibold text-ink-800">{formatINR(order.totalAmount)}</span>
                              <Link to={`/orders?order=${encodeURIComponent(order.orderId)}`} onClick={() => setOpen(false)} className="font-semibold text-brand-700 hover:text-brand-800">View Order</Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-card" role="status" aria-label="ShopSense is preparing a response">
                    <div className="flex items-center gap-2 text-xs text-ink-500">
                      <LoaderCircle size={14} className="animate-spin text-brand-600" />
                      <span>ShopSense is checking that for you...</span>
                    </div>
                    <div className="mt-2 flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-ink-100 bg-white p-3">
              <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1" aria-label="Quick actions">
                {[...(contextOrder ? ORDER_SUGGESTIONS : PRODUCT_SUGGESTIONS), ...(currentUser && cart.length > 0 ? CART_SUGGESTIONS : [])].map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={typing}
                    className="whitespace-nowrap rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 text-xs text-ink-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="flex items-end gap-2"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder="Ask about products, orders, or your cart..."
                  rows={1}
                  aria-label="Message ShopSense Assistant"
                  className="input max-h-24 min-h-10 flex-1 resize-none py-2.5 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="submit"
                  disabled={typing || !input.trim()}
                  className="btn-primary h-10 w-10 shrink-0 p-0 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
