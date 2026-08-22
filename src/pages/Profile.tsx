import { useEffect, useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { meUser } from '@/services/api';

export default function Profile() {
  const { currentUser, logout } = useStore();
  const [profile, setProfile] = useState(currentUser ?? null);

  useEffect(() => {
    if (!currentUser) return;
    setProfile(currentUser);
  }, [currentUser]);

  if (!profile) {
    return (
      <div className="container-app py-20">
        <p>Please login to view profile.</p>
      </div>
    );
  }

  return (
    <div className="container-app py-20">
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="mt-6 max-w-md">
        <p><strong>Name:</strong> {profile.fullName}</p>
        <p className="mt-2"><strong>Email:</strong> {profile.email}</p>
        <div className="mt-4">
          <button className="btn-ghost" onClick={() => logout()}>Logout</button>
        </div>
      </div>
    </div>
  );
}
