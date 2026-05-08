import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { fetchUsers, updateUserStatus, deleteUser, User } from '../services/mockApi';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { ConfirmModal } from '../components/Modal';
import { formatDateTimeInIndia } from '../lib/dateTime';

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      setPageError('');
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: User['id'], newStatus: string) => {
    try {
      setPageError('');
      await updateUserStatus(userId, newStatus);
      await loadUsers();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Failed to update user status.');
    }
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setPageError('');
      if (selectedUser) {
        await deleteUser(selectedUser.id);
        await loadUsers();
      }
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Failed to delete user.');
    }
    setConfirmOpen(false);
    setSelectedUser(null);
  };

  const userCounts = {
    total: users.length,
    active: users.filter(user => user.status === 'active').length,
    pending: users.filter(user => user.status === 'pending').length,
    inactive: users.filter(user => user.status === 'inactive').length,
    rejected: users.filter(user => user.status === 'rejected').length,
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'partnerEmail',
      label: "Partner's Email",
      render: (value: unknown, user: Record<string, unknown>) => {
        if (String(user.role || '').toLowerCase() !== 'user') {
          return '—';
        }
        return String(value || '').trim() || '—';
      },
    },
    { key: 'phone', label: 'Phone' },
    { 
      key: 'role', 
      label: 'Role',
      render: (value: unknown) => (
        <span className="role-badge">{value as string}</span>
      )
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (value: unknown) => formatDateTimeInIndia(value as string),
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: unknown) => <StatusBadge status={value as string} />
    },
    { 
      key: 'actions', 
      label: 'Actions',
      render: (_: unknown, user: Record<string, unknown>) => (
        <div className="action-cell">
          <select 
            className="status-select"
            value={user.status as string}
            onChange={(e) => handleStatusChange(user.id as User['id'], e.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="btn-icon btn-delete" onClick={() => handleDelete(user as unknown as User)} title="Delete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="manage-page">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>View and manage registered users</p>
        </div>
        <button className="btn btn-secondary" onClick={() => void loadUsers()} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="status-overview" aria-label="User status counts">
        <div className="status-chip">
          <span>Total Users</span>
          <strong>{userCounts.total}</strong>
        </div>
        <div className="status-chip">
          <span>Active Users</span>
          <strong>{userCounts.active}</strong>
        </div>
        <div className="status-chip">
          <span>Pending Users</span>
          <strong>{userCounts.pending}</strong>
        </div>
        <div className="status-chip">
          <span>Inactive Users</span>
          <strong>{userCounts.inactive}</strong>
        </div>
        <div className="status-chip">
          <span>Rejected Users</span>
          <strong>{userCounts.rejected}</strong>
        </div>
      </div>

      <div className="page-content">
        {pageError && <div className="profile-alert error">{pageError}</div>}
        <DataTable 
          columns={columns} 
          data={users as unknown as Record<string, unknown>[]} 
          loading={loading}
          emptyMessage="No users found."
        />
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${selectedUser?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

