import { FormEvent, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminProfile() {
  const { user, updateProfile, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'A';
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
  }, [name]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedName) {
      setMessage({ type: 'error', text: 'Please enter your name.' });
      return;
    }

    if (!emailPattern.test(trimmedEmail)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setSaving(true);
    const result = await updateProfile({ name: trimmedName, email: trimmedEmail });
    setSaving(false);

    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      return;
    }

    setMessage({ type: 'error', text: result.error || 'Unable to update profile right now.' });
  };

  const resetValues = () => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setMessage(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage(null);
    const result = await refreshProfile();
    setRefreshing(false);

    if (result.success) {
      setMessage({ type: 'success', text: 'Profile refreshed.' });
      return;
    }

    setMessage({ type: 'error', text: result.error || 'Unable to refresh profile right now.' });
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p>Update your admin account information.</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void handleRefresh()}
          disabled={saving || refreshing}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="profile-grid">
        <aside className="profile-summary-card">
          <div className="profile-summary-avatar">{initials}</div>
          <h2>{user?.name || 'Admin User'}</h2>
          <p>{user?.email || 'admin@elegance.com'}</p>
          <span className="profile-role-chip">{user?.role || 'admin'}</span>
        </aside>

        <section className="profile-form-card">
          <h2>Account Details</h2>
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your full name"
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile-email">Email Address</label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile-role">Role</label>
              <input id="profile-role" type="text" value={user?.role || 'admin'} disabled />
            </div>

            {message && (
              <div className={`profile-alert ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="profile-actions">
              <button type="button" className="btn btn-secondary" onClick={resetValues} disabled={saving}>
                Reset
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

