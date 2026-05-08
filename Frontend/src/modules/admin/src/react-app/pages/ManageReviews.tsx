import { useEffect, useMemo, useState } from 'react';
import { Check, RefreshCw, Star, Trash2, X } from 'lucide-react';
import {
  fetchReviews,
  updateRatingStatus,
  deleteReview,
  type AdminReview,
  type ReviewStatus,
} from '../services/mockApi';
import DataTable from '../components/DataTable';
import { ConfirmModal } from '../components/Modal';
import { formatDateInIndia, formatDateTimeInIndia } from '../lib/dateTime';

const getReviewStatusLabel = (status: ReviewStatus) => {
  if (status === 'pending') {
    return 'Pending Approval';
  }
  if (status === 'rejected') {
    return 'Rejected';
  }
  return 'Approved';
};

export default function ManageReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [savingReviewId, setSavingReviewId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);

  useEffect(() => {
    void loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      setPageError('');
      const data = await fetchReviews();
      setReviews(data);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reviewId: string, status: ReviewStatus) => {
    if (!reviewId) {
      return;
    }

    try {
      setPageError('');
      setSavingReviewId(reviewId);
      await updateRatingStatus(reviewId, status);
      await loadReviews();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Failed to update review status.');
    } finally {
      setSavingReviewId(null);
    }
  };

  const handleDeleteReview = (review: AdminReview) => {
    setSelectedReview(review);
    setConfirmOpen(true);
  };

  const confirmDeleteReview = async () => {
    try {
      setPageError('');
      const reviewId = String(selectedReview?.id || '').trim();
      if (!reviewId) {
        throw new Error('Unable to identify this review.');
      }

      setSavingReviewId(reviewId);
      await deleteReview(reviewId);
      await loadReviews();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Failed to delete review.');
    } finally {
      setSavingReviewId(null);
      setConfirmOpen(false);
      setSelectedReview(null);
    }
  };

  const reviewCounts = useMemo(
    () => ({
      total: reviews.length,
      pending: reviews.filter((review) => review.status === 'pending').length,
      approved: reviews.filter((review) => review.status === 'approved').length,
      rejected: reviews.filter((review) => review.status === 'rejected').length,
    }),
    [reviews],
  );

  const columns = [
    {
      key: 'author',
      label: 'Couple',
      render: (_: unknown, review: Record<string, unknown>) => {
        const primaryUserName = String(review.primaryUserName || review.author || 'User').trim();
        const partnerName = String(review.partnerName || '').trim();

        return (
          <div className="review-identity">
            <span className="review-identity-name">
              {primaryUserName}
              {partnerName ? ` & ${partnerName}` : ''}
            </span>
            <span className="review-identity-subtitle">
              {partnerName ? 'Couple review' : 'Single reviewer'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'vendorName',
      label: 'Vendor / Service',
      render: (_: unknown, review: Record<string, unknown>) => (
        <div className="review-identity">
          <span className="review-identity-name">{String(review.vendorName || 'Vendor').trim() || 'Vendor'}</span>
          <span className="review-identity-subtitle">{String(review.serviceName || 'Service').trim() || 'Service'}</span>
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      headerClassName: 'booking-table-nowrap',
      cellClassName: 'booking-rating-cell',
      render: (value: unknown, review: Record<string, unknown>) => {
        const reviewId = String(review.id || '').trim();
        const rating = Number(value || 0);

        return (
          <div className="booking-rating-stack">
            <span className="booking-rating-summary">
              <span className="booking-rating-stars">
                {[1, 2, 3, 4, 5].map((starValue) => (
                  <Star
                    key={`${reviewId}-review-star-${starValue}`}
                    className={`booking-rating-star ${
                      starValue <= rating ? 'fill-gold text-gold' : 'text-foreground/30'
                    }`}
                  />
                ))}
              </span>
              <span>{rating}/5</span>
            </span>
          </div>
        );
      },
    },
    {
      key: 'review',
      label: 'Review',
      render: (value: unknown) => (
        <div className="review-message">
          {String(value || '').trim() || 'Rated without a written review.'}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Submitted',
      headerClassName: 'booking-table-nowrap',
      cellClassName: 'booking-table-nowrap',
      render: (value: unknown) => {
        const createdAt = String(value || '').trim();
        return createdAt ? (
          <div className="review-identity">
            <span className="review-identity-name">{formatDateTimeInIndia(createdAt)}</span>
            <span className="review-identity-subtitle">{formatDateInIndia(createdAt)}</span>
          </div>
        ) : '—';
      },
    },
    {
      key: 'status',
      label: 'Status',
      headerClassName: 'booking-table-nowrap',
      cellClassName: 'booking-table-nowrap',
      render: (value: unknown) => {
        const status = (String(value || 'approved').trim().toLowerCase() || 'approved') as ReviewStatus;
        return (
          <span className={`booking-review-status booking-review-status-${status}`}>
            {getReviewStatusLabel(status)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'booking-table-nowrap',
      cellClassName: 'booking-table-nowrap',
      render: (_: unknown, review: Record<string, unknown>) => {
        const reviewId = String(review.id || '').trim();
        const status = (String(review.status || 'approved').trim().toLowerCase() || 'approved') as ReviewStatus;
        const isSaving = savingReviewId === reviewId;

        return (
          <div className="action-cell review-action-cell">
            <button
              className="btn-icon btn-edit"
              onClick={() => void handleUpdateStatus(reviewId, 'approved')}
              title="Approve review"
              disabled={isSaving || status === 'approved'}
            >
              <Check size={16} />
            </button>
            <button
              className="btn-icon review-reject-btn"
              onClick={() => void handleUpdateStatus(reviewId, 'rejected')}
              title="Reject review"
              disabled={isSaving || status === 'rejected'}
            >
              <X size={16} />
            </button>
            <button
              className="btn-icon btn-delete"
              onClick={() => handleDeleteReview(review as unknown as AdminReview)}
              title="Delete review"
              disabled={isSaving}
            >
              <Trash2 size={16} />
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
          <h1>Review Management</h1>
          <p>Approve, reject, or remove reviews before they appear on user and vendor pages</p>
        </div>
        <button className="btn btn-secondary" onClick={() => void loadReviews()} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="status-overview" aria-label="Review status counts">
        <div className="status-chip">
          <span>Total Reviews</span>
          <strong>{reviewCounts.total}</strong>
        </div>
        <div className="status-chip">
          <span>Pending</span>
          <strong>{reviewCounts.pending}</strong>
        </div>
        <div className="status-chip">
          <span>Approved</span>
          <strong>{reviewCounts.approved}</strong>
        </div>
        <div className="status-chip">
          <span>Rejected</span>
          <strong>{reviewCounts.rejected}</strong>
        </div>
      </div>

      <div className="page-content">
        {pageError && <div className="profile-alert error">{pageError}</div>}
        <DataTable
          columns={columns}
          data={reviews as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyMessage="No reviews found."
        />
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setSelectedReview(null);
        }}
        onConfirm={confirmDeleteReview}
        title="Delete Review"
        message={`Delete the review for "${selectedReview?.serviceName || 'this service'}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
