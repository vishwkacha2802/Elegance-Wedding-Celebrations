import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardStats, type DashboardStats } from '../services/mockApi';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        setError('');
        const data = await fetchDashboardStats();
        setStats(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard stats.');
      }
    };

    loadStats();
  }, []);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Welcome back, {user?.name || 'Admin'}!</h1>
        <p>Manage your wedding planning platform from this dashboard.</p>
      </div>

      {error && <div className="profile-alert error">{error}</div>}

      <div className="dashboard-welcome">
        <div className="welcome-card">
          <div className="welcome-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
          </div>
          <h3>Vendor Management</h3>
          <p>Add, edit, and manage wedding vendors. Review applications and update vendor statuses.</p>
          <div className="welcome-stats">
            <div className="welcome-stat">
              <span className="welcome-stat-label">Total Vendors</span>
              <strong>{stats ? stats.totalVendors : '--'}</strong>
            </div>
            <div className="welcome-stat">
              <span className="welcome-stat-label">Pending Vendors</span>
              <strong>{stats ? stats.pendingVendors : '--'}</strong>
            </div>
            <div className="welcome-stat">
              <span className="welcome-stat-label">Rejected Vendors</span>
              <strong>{stats ? stats.rejectedVendors : '--'}</strong>
            </div>
          </div>
        </div>

        <div className="welcome-card">
          <div className="welcome-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <h3>User Management</h3>
          <p>View and manage registered users. Update user statuses and handle account issues.</p>
          <div className="welcome-stats">
            <div className="welcome-stat">
              <span className="welcome-stat-label">Total Users</span>
              <strong>{stats ? stats.totalUsers : '--'}</strong>
            </div>
            <div className="welcome-stat">
              <span className="welcome-stat-label">Pending Users</span>
              <strong>{stats ? stats.pendingUsers : '--'}</strong>
            </div>
            <div className="welcome-stat">
              <span className="welcome-stat-label">Inactive Users</span>
              <strong>{stats ? stats.inactiveUsers : '--'}</strong>
            </div>
            <div className="welcome-stat">
              <span className="welcome-stat-label">Rejected Users</span>
              <strong>{stats ? stats.rejectedUsers : '--'}</strong>
            </div>
          </div>
        </div>

        <div className="welcome-card">
          <div className="welcome-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h3>Booking Management</h3>
          <p>Review all bookings and update their status. Approve, reject, or manage pending requests.</p>
          <div className="welcome-stats">
            <div className="welcome-stat">
              <span className="welcome-stat-label">Total Bookings</span>
              <strong>{stats ? stats.totalBookings : '--'}</strong>
            </div>
            <div className="welcome-stat">
              <span className="welcome-stat-label">Pending Bookings</span>
              <strong>{stats ? stats.pendingBookings : '--'}</strong>
            </div>
            <div className="welcome-stat">
              <span className="welcome-stat-label">Rejected Bookings</span>
              <strong>{stats ? stats.rejectedBookings : '--'}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <a href="/admin/vendors" className="action-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New Vendor
          </a>
          <a href="/admin/bookings" className="action-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            View Bookings
          </a>
          <a href="/admin/users" className="action-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            Manage Users
          </a>
          <a href="/admin/inquiries" className="action-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            View Inquiries
          </a>
        </div>
      </div>
    </div>
  );
}

