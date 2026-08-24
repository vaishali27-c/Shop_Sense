import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { useRouter } from '@/lib/router';

export default function Register() {
  const { register, apiError } = useStore();
  const { navigate } = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return alert('Passwords do not match');
    try {
      await register({ fullName, email, phone, password });
      navigate('/');
    } catch {
      /* handled */
    }
  };

  return (
    <div className="container-app py-20">
      <h1 className="text-2xl font-bold">Register</h1>
      <form onSubmit={submit} className="mt-6 max-w-md">
        <label className="block">Full name</label>
        <input autoComplete="name" required className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <label className="block mt-3">Email</label>
        <input type="email" autoComplete="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="block mt-3">Phone</label>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <label className="block mt-3">Password</label>
        <input type="password" autoComplete="new-password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        <label className="block mt-3">Confirm password</label>
        <input type="password" autoComplete="new-password" required className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {apiError && <p className="mt-3 text-sm text-red-600" role="alert">{apiError}</p>}
        <div className="mt-4">
          <button className="btn-primary">Create account</button>
        </div>
      </form>
    </div>
  );
}
