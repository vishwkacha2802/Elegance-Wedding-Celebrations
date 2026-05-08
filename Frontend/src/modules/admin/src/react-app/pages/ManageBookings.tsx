import { useState, useEffect } from 'react';
import { RefreshCw, Star } from 'lucide-react';
import { fetchBookings, Booking, deleteBooking, updateRatingStatus } from '../services/mockApi';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { ConfirmModal } from '../components/Modal';
import { formatDateInIndia, formatDateTimeInIndia } from '../lib/dateTime';

export default function ManageBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [savingReviewId, setSavingReviewId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      setPageError('');
      const data = await fetchBookings();
      setBookings(data);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDeleteBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setConfirmOpen(true);
  };

  const confirmDeleteBooking = async () => {
    try {
      setPageError('');
      const bookingId = String(selectedBooking?.id || '').trim();
      if (!bookingId) {
        throw new Error('Unable to identify this booking.');
      }

      await deleteBooking(bookingId);
      await loadBookings();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Failed to delete booking.');
    }

    setConfirmOpen(false);
    setSelectedBooking(null);
  };

  const handleApproveReview = async (reviewId: string) => {
    if (!reviewId) {
      return;
    }

    try {
      setPageError('');
      setSavingReviewId(reviewId);
      await updateRatingStatus(reviewId, 'approved');
      await loadBookings();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Failed to approve review.');
    } finally {
      setSavingReviewId(null);
    }
  };

  const getReviewStatusLabel = (status: string) => {
    if (status === 'pending') {
      return 'Pending Approval';
    }
    if (status === 'rejected') {
      return 'Rejected';
    }
    return 'Approved';
  };

  const columns = [
    {
      key: 'bookedByName',
      label: 'Booked By',
      cellClassName: 'booking-table-nowrap',
      render: (_: unknown, booking: Record<string, unknown>) =>
        String(booking.bookedByName || booking.userName || '').trim() || '—',
    },
    {
      key: 'userEmail',
      label: 'User Email',
      cellClassName: 'booking-table-nowrap',
      render: (value: unknown) => String(value || '').trim() || '—',
    },
    {
      key: 'vendorName',
      label: 'Vendor',
      cellClassName: 'booking-vendor-cell',
      render: (value: unknown, booking: Record<string, unknown>) => {
        const vendorName = String(value || '').trim();
        const vendorEmail = String(booking.vendorEmail || '').trim();

        if (!vendorName && !vendorEmail) {
          return '—';
        }

        return (
          <div className="booking-vendor-stack">
            <span className="booking-vendor-name">{vendorName || '—'}</span>
            {vendorEmail ? <span className="booking-vendor-email">{vendorEmail}</span> : null}
          </div>
        );
      },
    },
    {
      key: 'service',
      label: 'Service',
      cellClassName: 'booking-table-nowrap',
      render: (value: unknown) => String(value || '').trim() || '—',
    },
    {
      key: 'eventDate',
      label: 'Event Date',
      cellClassName: 'booking-table-nowrap',
      render: (value: unknown) => formatDateInIndia(value as string),
    },
    {
      key: 'amount',
      label: 'Amount',
      cellClassName: 'booking-table-nowrap',
      render: (value: unknown) => <span className="amount">{formatCurrency(value as number)}</span>
    },
    {
      key: 'createdAt',
      label: 'Booked On',
      cellClassName: 'booking-table-nowrap',
      render: (value: unknown) => formatDateTimeInIndia(value as string),
    },
    {
      key: 'status',
      label: 'Status',
      cellClassName: 'booking-table-nowrap',
      render: (value: unknown) => <StatusBadge status={value as string} />
    },
    {
      key: 'rating',
      label: 'User Rating',
      cellClassName: 'booking-rating-cell',
      render: (_: unknown, booking: Record<string, unknown>) => {
        const bookingId = String(booking.id || '').trim();
        const reviewId = String(booking.userRatingId || '').trim();
        const rating = Number(booking.userRating || 0);
        const review = String(booking.userReview || '').trim();
        const reviewStatus = String(booking.userReviewStatus || '').trim().toLowerCase() || 'approved';

        if (rating <= 0) {
          return (
            <div className="booking-rating-stack">
              <span className="booking-rating-summary">Not rated</span>
            </div>
          );
        }

        return (
          <div className="booking-rating-stack">
            <span className="booking-rating-summary">
              <span className="booking-rating-stars">
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <Star
                    key={`${bookingId}-admin-rating-star-${starValue}`}
                    className={`booking-rating-star ${
                      starValue <= rating ? 'fill-gold text-gold' : 'text-foreground/30'
                    }`}
                  />
                ))}
              </span>
              <span>{rating}/5</span>
            </span>
            <div className="booking-rating-meta">
              <span className={`booking-review-status booking-review-status-${reviewStatus}`}>
                {getReviewStatusLabel(reviewStatus)}
              </span>
              {reviewId && reviewStatus !== 'approved' ? (
                <button
                  type="button"
                  className="btn btn-secondary booking-review-action"
                  onClick={() => void handleApproveReview(reviewId)}
                  disabled={savingReviewId === reviewId}
                >
                  {savingReviewId === reviewId ? 'Approving...' : 'Approve Review'}
                </button>
              ) : null}
            </div>
            {review ? <span className="booking-rating-review">{review}</span> : null}
            {reviewStatus !== 'approved' ? (
              <span className="booking-review-note">
                Hidden from user and vendor pages until approval.
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'booking-table-nowrap',
      cellClassName: 'booking-table-nowrap',
      render: (_: unknown, booking: Record<string, unknown>) => {
        const bookingId = String(booking.id || '').trim();

        return (
          <div className="action-cell">
            <button
              className="btn-icon btn-delete"
              onClick={() => handleDeleteBooking(booking as unknown as Booking)}
              title={bookingId ? 'Delete booking' : 'Booking not available for deletion'}
              disabled={!bookingId}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="manage-page">
      <div className="page-header">
        <div>
          <h1>Booking Management</h1>
          <p>Review all booking request statuses and user ratings</p>
        </div>
        <button className="btn btn-secondary" onClick={() => void loadBookings()} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="page-content">
        {pageError && <div className="profile-alert error">{pageError}</div>}
        <DataTable
          columns={columns}
          data={bookings as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyMessage="No bookings found."
        />
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setSelectedBooking(null);
        }}
        onConfirm={confirmDeleteBooking}
        title="Delete Booking"
        message={`Delete the booking for "${selectedBooking?.service || 'this service'}"? This will remove only the booking/request record and will not delete the vendor's service.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
