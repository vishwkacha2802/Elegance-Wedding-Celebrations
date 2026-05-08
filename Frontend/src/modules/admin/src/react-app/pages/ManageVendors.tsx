import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { RefreshCw } from 'lucide-react';
import { fetchVendors, createVendor, updateVendor, deleteVendor, updateVendorStatus, vendorCategories, Vendor, VendorFormData } from '../services/mockApi';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal, { ConfirmModal } from '../components/Modal';

const initialFormState: VendorFormData = {
  name: '',
  email: '',
  phone: '',
  category: '',
  location: '',
};

export default function ManageVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<VendorFormData>(initialFormState);
  const [vendorPassword, setVendorPassword] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setLoading(true);
    try {
      setPageError('');
      const data = await fetchVendors();
      setVendors(data);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Failed to load vendors.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email format';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.location.trim()) errors.location = 'Location is required';
    if (!isEditing && !vendorPassword.trim()) errors.password = 'Password is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setFormData(initialFormState);
    setVendorPassword('');
    setFormErrors({});
    setPageError('');
    setModalOpen(true);
  };

  const handleEdit = (vendor: Vendor) => {
    setIsEditing(true);
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      category: vendor.category,
      location: vendor.location,
    });
    setVendorPassword('');
    setFormErrors({});
    setPageError('');
    setModalOpen(true);
  };

  const handleDelete = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setPageError('');
      if (selectedVendor) {
        await deleteVendor(selectedVendor.id);
        await loadVendors();
      }
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Failed to delete vendor.');
    }
    setConfirmOpen(false);
    setSelectedVendor(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setPageError('');
    try {
      if (isEditing && selectedVendor) {
        await updateVendor(selectedVendor.id, formData);
      } else {
        await createVendor({
          ...formData,
          password: vendorPassword,
        });
      }
      await loadVendors();
      setModalOpen(false);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Failed to save vendor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (vendorId: Vendor['id'], newStatus: string) => {
    try {
      setPageError('');
      await updateVendorStatus(vendorId, newStatus);
      await loadVendors();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Failed to update vendor status.');
    }
  };

  const columns = [
    { key: 'name', label: 'Business Name', cellClassName: 'vendor-table-wrap' },
    { key: 'email', label: 'Email', cellClassName: 'vendor-table-nowrap' },
    { key: 'category', label: 'Category', cellClassName: 'vendor-table-wrap' },
    { key: 'location', label: 'Location', cellClassName: 'vendor-table-nowrap' },
    { 
      key: 'rating', 
      label: 'Rating',
      cellClassName: 'vendor-table-nowrap',
      render: (_: unknown, vendor: Record<string, unknown>) => {
        const averageRating = Number(vendor.averageRating || vendor.rating || 0);
        const totalReviews = Number(vendor.totalReviews || 0);

        if (totalReviews > 0) {
          return `⭐ ${averageRating.toFixed(1)} (${totalReviews} review${totalReviews === 1 ? '' : 's'})`;
        }

        return 'No reviews yet';
      }
    },
    { 
      key: 'status', 
      label: 'Status',
      cellClassName: 'vendor-table-nowrap',
      render: (value: unknown) => <StatusBadge status={value as string} />
    },
    { 
      key: 'actions', 
      label: 'Actions',
      cellClassName: 'vendor-table-nowrap',
      render: (_: unknown, vendor: Record<string, unknown>) => (
        <div className="action-cell vendor-action-cell">
          <select 
            className="status-select"
            value={vendor.status as string}
            onChange={(e) => handleStatusChange(vendor.id as Vendor['id'], e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="btn-icon btn-edit" onClick={() => handleEdit(vendor as unknown as Vendor)} title="Edit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button className="btn-icon btn-delete" onClick={() => handleDelete(vendor as unknown as Vendor)} title="Delete">
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
          <h1>Vendor Management</h1>
          <p>Manage wedding vendors and service providers</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => void loadVendors()} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="btn btn-primary" onClick={handleAddNew}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Vendor
          </button>
        </div>
      </div>

      <div className="page-content">
        {pageError && <div className="profile-alert error">{pageError}</div>}
        <DataTable 
          columns={columns} 
          data={vendors as unknown as Record<string, unknown>[]} 
          loading={loading}
          emptyMessage="No vendors found. Add your first vendor!"
        />
      </div>

      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Vendor' : 'Add New Vendor'}
        size="medium"
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">Vendor Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter vendor name"
              className={formErrors.name ? 'error' : ''}
            />
            {formErrors.name && <span className="error-text">{formErrors.name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="vendor@example.com"
                className={formErrors.email ? 'error' : ''}
              />
              {formErrors.email && <span className="error-text">{formErrors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+91 99999 55555"
                className={formErrors.phone ? 'error' : ''}
              />
              {formErrors.phone && <span className="error-text">{formErrors.phone}</span>}
            </div>
          </div>

          {!isEditing && (
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={vendorPassword}
                onChange={(e) => {
                  setVendorPassword(e.target.value);
                  if (formErrors.password) {
                    setFormErrors(prev => ({ ...prev, password: '' }));
                  }
                }}
                placeholder="Enter vendor password"
                autoComplete="new-password"
                className={formErrors.password ? 'error' : ''}
              />
              {formErrors.password && <span className="error-text">{formErrors.password}</span>}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={formErrors.category ? 'error' : ''}
              >
                <option value="">Select category</option>
                {vendorCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {formErrors.category && <span className="error-text">{formErrors.category}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="location">Location *</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="City, State"
                className={formErrors.location ? 'error' : ''}
              />
              {formErrors.location && <span className="error-text">{formErrors.location}</span>}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : (isEditing ? 'Update Vendor' : 'Add Vendor')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Vendor"
        message={`Are you sure you want to delete "${selectedVendor?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

