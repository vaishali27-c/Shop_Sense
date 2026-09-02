import { useState } from 'react';
import { AtSign, Edit3, LockKeyhole, MapPin, Package, Phone, Plus, Trash2, UserRound } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { Link } from '@/lib/router';
import type { Address } from '@/types';

const emptyAddress = { label: 'Home', street: '', city: '', state: '', pincode: '', isDefault: false };

type ProfileForm = { fullName: string; email: string; phone: string };

export default function Profile() {
  const { currentUser, logout, updateProfile, addresses, saveAddress, editAddress, removeAddress, makeDefaultAddress } = useStore();
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>({ fullName: '', email: '', phone: '' });
  const [profileError, setProfileError] = useState('');
  const [editing, setEditing] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressError, setAddressError] = useState('');

  if (!currentUser) return <div className="container-app py-20"><p>Please login to view your profile.</p></div>;

  const user = currentUser;
  const initials = user.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  function beginProfileEdit() {
    setProfileForm({ fullName: user.fullName, email: user.email, phone: user.phone ?? '' });
    setProfileError('');
    setShowProfileForm(true);
  }

  async function submitProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!profileForm.fullName.trim() || !/^\S+@\S+\.\S+$/.test(profileForm.email)) {
      setProfileError('Enter a valid name and email.');
      return;
    }
    try {
      await updateProfile(profileForm);
      setShowProfileForm(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not update profile.');
    }
  }

  function beginAdd() {
    setEditing(null);
    setAddressForm(emptyAddress);
    setAddressError('');
    setShowAddressForm(true);
  }

  function beginEdit(address: Address) {
    setEditing(address);
    setAddressForm({ label: address.label, street: address.street, city: address.city, state: address.state, pincode: address.pincode, isDefault: address.isDefault });
    setAddressError('');
    setShowAddressForm(true);
  }

  async function submitAddress(event: React.FormEvent) {
    event.preventDefault();
    if (!addressForm.street || !addressForm.city || !addressForm.state || !/^\d{6}$/.test(addressForm.pincode)) {
      setAddressError('Enter a complete address and valid 6-digit pincode.');
      return;
    }
    try {
      if (editing) await editAddress(editing.id, addressForm);
      else await saveAddress(addressForm);
      setShowAddressForm(false);
    } catch (error) {
      setAddressError(error instanceof Error ? error.message : 'Could not save address.');
    }
  }

  return (
    <div className="container-app py-8 sm:py-12">
      <div className="overflow-hidden rounded-2xl bg-brand-900 text-white shadow-lg">
        <div className="flex flex-wrap items-center gap-5 px-6 py-8 sm:px-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-400 text-2xl font-bold text-ink-900">{initials}</div>
          <div className="flex-1"><p className="text-sm uppercase tracking-widest text-brand-200">Your account</p><h1 className="mt-1 text-3xl font-bold">{currentUser.fullName}</h1><p className="mt-1 text-brand-100">{currentUser.email}</p></div>
          <button onClick={beginProfileEdit} className="btn bg-white/10 px-4 py-2 text-white hover:bg-white/20"><Edit3 size={16} /> Edit profile</button>
        </div>
      </div>

      {showProfileForm && <form onSubmit={submitProfile} className="card mt-6 p-6"><h2 className="text-lg font-semibold">Edit profile</h2><div className="mt-4 grid gap-4 sm:grid-cols-3"><div><label className="label">Full name</label><input className="input" value={profileForm.fullName} onChange={(event) => setProfileForm({ ...profileForm, fullName: event.target.value })} /></div><div><label className="label">Email</label><input type="email" className="input" value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} /></div><div><label className="label">Phone</label><input className="input" value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} /></div></div>{profileError && <p className="mt-3 text-sm text-red-600">{profileError}</p>}<div className="mt-4 flex gap-2"><button className="btn-primary" type="submit">Save profile</button><button className="btn-outline" type="button" onClick={() => setShowProfileForm(false)}>Cancel</button></div></form>}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <main className="space-y-6 lg:col-span-2">
          <section className="card p-6"><div className="flex items-center gap-3"><UserRound className="text-brand-600" size={20} /><h2 className="text-lg font-semibold">Account information</h2></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-lg bg-ink-50 p-4"><p className="text-xs text-ink-500">Full name</p><p className="mt-1 font-medium">{currentUser.fullName}</p></div><div className="rounded-lg bg-ink-50 p-4"><p className="text-xs text-ink-500">Email address</p><p className="mt-1 break-all font-medium">{currentUser.email}</p></div><div className="rounded-lg bg-ink-50 p-4"><p className="text-xs text-ink-500">Phone number</p><p className="mt-1 font-medium">{currentUser.phone || 'Not added yet'}</p></div></div></section>
          <section className="card p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><MapPin className="text-brand-600" size={20} /><h2 className="text-lg font-semibold">Saved addresses</h2></div><button className="btn-primary py-2" onClick={beginAdd}><Plus size={16} /> Add address</button></div>{addresses.length === 0 && <p className="mt-5 rounded-lg bg-ink-50 p-4 text-sm text-ink-500">No saved addresses yet. Add one for faster checkout.</p>}<div className="mt-5 grid gap-4 sm:grid-cols-2">{addresses.map((address) => <div key={address.id} className="rounded-lg border border-ink-200 p-4"><div className="flex items-center justify-between"><span className="font-semibold uppercase text-brand-700">{address.label}</span>{address.isDefault && <span className="text-xs font-semibold text-brand-700">DEFAULT</span>}</div><p className="mt-3 text-sm text-ink-600">{address.street}<br />{address.city}, {address.state} - {address.pincode}</p><div className="mt-4 flex flex-wrap gap-2"><button className="btn-ghost px-2 py-1" onClick={() => beginEdit(address)}><Edit3 size={14} /> Edit</button><button className="btn-danger px-2 py-1" onClick={() => removeAddress(address.id)}><Trash2 size={14} /> Remove</button>{!address.isDefault && <button className="btn-ghost px-2 py-1 text-brand-700" onClick={() => makeDefaultAddress(address.id)}>Make default</button>}</div></div>)}</div>{showAddressForm && <form onSubmit={submitAddress} className="mt-5 border-t border-ink-100 pt-5"><h3 className="font-semibold">{editing ? 'Edit address' : 'Add new address'}</h3><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><label className="label">Label</label><input className="input" value={addressForm.label} onChange={(event) => setAddressForm({ ...addressForm, label: event.target.value })} placeholder="Home" /></div><div><label className="label">Pincode</label><input className="input" value={addressForm.pincode} onChange={(event) => setAddressForm({ ...addressForm, pincode: event.target.value })} placeholder="560001" /></div><div className="sm:col-span-2"><label className="label">Street address</label><textarea className="input" value={addressForm.street} onChange={(event) => setAddressForm({ ...addressForm, street: event.target.value })} /></div><div><label className="label">City</label><input className="input" value={addressForm.city} onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })} /></div><div><label className="label">State</label><input className="input" value={addressForm.state} onChange={(event) => setAddressForm({ ...addressForm, state: event.target.value })} /></div></div>{addressError && <p className="mt-3 text-sm text-red-600">{addressError}</p>}<div className="mt-4 flex gap-2"><button className="btn-primary" type="submit">Save address</button><button className="btn-outline" type="button" onClick={() => setShowAddressForm(false)}>Cancel</button></div></form>}</section>
        </main>
        <aside className="space-y-4"><Link to="/orders" className="card flex items-center gap-4 p-5 hover:border-brand-300"><Package className="text-brand-600" /><div><p className="font-semibold">My Orders</p><p className="text-sm text-ink-500">Track your purchases</p></div></Link><div className="card p-5"><div className="flex items-center gap-3"><LockKeyhole className="text-brand-600" size={19} /><h2 className="font-semibold">Account & security</h2></div><div className="mt-4 space-y-3 text-sm text-ink-600"><p className="flex items-center gap-2"><AtSign size={16} /> {currentUser.email}</p><p className="flex items-center gap-2"><Phone size={16} /> {currentUser.phone || 'Phone not added'}</p></div></div><button className="btn-danger w-full py-3" onClick={() => logout()}>Log out</button></aside>
      </div>
    </div>
  );
}
