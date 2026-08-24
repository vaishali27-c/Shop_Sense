import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { useRouter } from '@/lib/router';

export default function Login() {
  const { login, apiError } = useStore();
  const { path, navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      // respect return query param: /login?return=/checkout
      const qp = path.split('?')[1] ?? '';
      const params = new URLSearchParams(qp);
      const returnTo = params.get('return') ?? '/';
      navigate(returnTo);
    } catch {
      // handled by store error state
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-app py-20">
      <h1 className="text-2xl font-bold">Login</h1>
      <form onSubmit={submit} className="mt-6 max-w-md">
        <label className="block">Email</label>
        <input type="email" autoComplete="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="block mt-3">Password</label>
        <input type="password" autoComplete="current-password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        {apiError && <p className="mt-3 text-sm text-red-600" role="alert">{apiError}</p>}
        <div className="mt-4">
          <button className="btn-primary" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
        </div>
      </form>
    </div>
  );
}
