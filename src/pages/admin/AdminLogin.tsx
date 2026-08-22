import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { useRouter } from '@/lib/router';
import { Sparkles } from 'lucide-react';

export default function AdminLogin() {
  const { adminLogin } = useStore();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      await adminLogin({ email, password });
      navigate('/admin');
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Invalid admin credentials') || msg.includes('Invalid credentials')) {
        setError('Invalid admin credentials.');
      } else {
        setError('Unable to connect to the server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-app py-20">
      <div className="mx-auto max-w-md">
        <div className="card p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Sparkles size={20} />
          </div>
          <h2 className="text-xl font-bold">ADMIN CONSOLE</h2>
          <p className="mt-1 text-sm text-ink-500">Welcome back, Admin</p>
          <p className="mt-2 text-xs text-ink-500">Sign in to manage your ShopSense store.</p>

          <form onSubmit={submit} className="mt-6 text-left">
            <label className="block text-sm font-medium text-ink-700">Email</label>
            <input
              className="input mt-1 w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setError(null)}
              type="email"
            />

            <label className="block mt-3 text-sm font-medium text-ink-700">Password</label>
            <div className="relative mt-1">
              <input
                type={show ? 'text' : 'password'}
                className="input w-full pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setError(null)}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-ink-500"
              >
                {show ? 'Hide' : 'Show'}
              </button>
            </div>

            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

            <div className="mt-4">
              <button className="btn-primary w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
