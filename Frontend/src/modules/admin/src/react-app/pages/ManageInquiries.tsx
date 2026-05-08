import { useEffect, useState } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import {
  fetchContactInquiries,
  deleteContactInquiry,
  sendContactInquiryReply,
  type ContactInquiry,
} from '../services/mockApi';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal, { ConfirmModal } from '../components/Modal';
import { formatDateInIndia, formatDateTimeInIndia } from '../lib/dateTime';

export default function ManageInquiries() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [successPopupMessage, setSuccessPopupMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyInquiry, setReplyInquiry] = useState<ContactInquiry | null>(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [replyError, setReplyError] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    void loadInquiries();
  }, []);

  useEffect(() => {
    if (!successPopupMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessPopupMessage('');
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [successPopupMessage]);

  const loadInquiries = async () => {
    setLoading(true);
    try {
      setPageError('');
      const data = await fetchContactInquiries();
      setInquiries(data);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Failed to load contact inquiries.');
    } finally {
      setLoading(false);
    }
  };

  const handleReplyInquiry = (inquiry: ContactInquiry) => {
    const recipient = String(inquiry.email || '').trim();
    if (!recipient) {
      setPageError('This inquiry does not have an email address to reply to.');
      return;
    }

    setPageError('');
    setSuccessPopupMessage('');
    setReplyError('');
    setReplyInquiry(inquiry);
    setReplySubject('Re: Your wedding inquiry with Elegance Weddings');
    setReplyMessage(`${inquiry.name ? `Hi ${inquiry.name},` : 'Hello,'}\n\nThank you for reaching out to Elegance Weddings.\n\n`);
    setReplyOpen(true);
  };

  const handleCloseReplyModal = () => {
    setReplyOpen(false);
    setReplyInquiry(null);
    setReplySubject('');
    setReplyMessage('');
    setReplyError('');
    setIsSendingReply(false);
  };

  const handleSendReply = async () => {
    try {
      setReplyError('');
      setPageError('');
      setSuccessPopupMessage('');
      const inquiryId = String(replyInquiry?.id || '').trim();
      if (!inquiryId) {
        throw new Error('Unable to identify this inquiry.');
      }

      setIsSendingReply(true);
      await sendContactInquiryReply(inquiryId, {
        subject: replySubject,
        message: replyMessage,
      });
      await loadInquiries();
      setSuccessPopupMessage('Reply email sent successfully.');
      handleCloseReplyModal();
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : 'Failed to send reply email.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDeleteInquiry = (inquiry: ContactInquiry) => {
    setSelectedInquiry(inquiry);
    setConfirmOpen(true);
  };

  const confirmDeleteInquiry = async () => {
    try {
      setPageError('');
      setSuccessPopupMessage('');
      const inquiryId = String(selectedInquiry?.id || '').trim();
      if (!inquiryId) {
        throw new Error('Unable to identify this inquiry.');
      }

      await deleteContactInquiry(inquiryId);
      await loadInquiries();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Failed to delete inquiry.');
    }

    setConfirmOpen(false);
    setSelectedInquiry(null);
  };

  const inquiryCounts = {
    total: inquiries.length,
    new: inquiries.filter((inquiry) => inquiry.status === 'new').length,
    contacted: inquiries.filter((inquiry) => inquiry.status === 'contacted').length,
    archived: inquiries.filter((inquiry) => inquiry.status === 'archived').length,
  };

  const columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'accountType',
      label: 'Account',
      render: (_: unknown, inquiry: Record<string, unknown>) => {
        const isRegisteredUser = Boolean(inquiry.isRegisteredUser);
        const userRole = String(inquiry.userRole || '').trim().toLowerCase();

        return (
          <div className="inquiry-meta">
            <span>{isRegisteredUser ? 'Registered User' : 'New User'}</span>
            <span>{isRegisteredUser && userRole ? `Role: ${userRole}` : 'No account found'}</span>
          </div>
        );
      },
    },
    {
      key: 'email',
      label: 'Contact',
      cellClassName: 'inquiry-contact-cell',
      render: (_: unknown, inquiry: Record<string, unknown>) => {
        const email = String(inquiry.email || '').trim();
        const phone = String(inquiry.phone || '').trim();

        return (
          <div className="inquiry-contact">
            <span>{email || '—'}</span>
            <span>{phone || 'No phone provided'}</span>
          </div>
        );
      },
    },
    {
      key: 'eventDate',
      label: 'Wedding Details',
      render: (_: unknown, inquiry: Record<string, unknown>) => {
        const eventDate = String(inquiry.eventDate || '').trim();
        const guestCount = String(inquiry.guestCount || '').trim();
        const venue = String(inquiry.venue || '').trim();

        return (
          <div className="inquiry-meta">
            <span>{eventDate ? formatDateInIndia(eventDate) : 'Date not shared'}</span>
            <span>{guestCount ? `Guests: ${guestCount}` : 'Guest count not shared'}</span>
            <span>{venue || 'Venue not shared'}</span>
          </div>
        );
      },
    },
    {
      key: 'message',
      label: 'Message',
      render: (value: unknown) => (
        <div className="inquiry-message">{String(value || '').trim() || '—'}</div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Received',
      headerClassName: 'inquiry-table-nowrap',
      cellClassName: 'inquiry-table-nowrap',
      render: (value: unknown) => formatDateTimeInIndia(value as string),
    },
    {
      key: 'status',
      label: 'Status',
      headerClassName: 'inquiry-table-nowrap',
      cellClassName: 'inquiry-table-nowrap',
      render: (value: unknown) => <StatusBadge status={value as string} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'inquiry-table-nowrap',
      cellClassName: 'inquiry-table-nowrap',
      render: (_: unknown, inquiry: Record<string, unknown>) => (
        <div className="action-cell inquiry-action-cell">
          <button
            className="btn-icon btn-edit"
            onClick={() => handleReplyInquiry(inquiry as unknown as ContactInquiry)}
            title="Reply to inquiry"
          >
            <Mail size={16} />
          </button>
          <button
            className="btn-icon btn-delete"
            onClick={() => handleDeleteInquiry(inquiry as unknown as ContactInquiry)}
            title="Delete inquiry"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="manage-page">
      {successPopupMessage ? (
        <div className="inquiry-toast inquiry-toast-success" role="status" aria-live="polite">
          <div className="inquiry-toast-icon">
            <Mail size={16} />
          </div>
          <div className="inquiry-toast-copy">
            <strong>Reply Sent</strong>
            <span>{successPopupMessage}</span>
          </div>
        </div>
      ) : null}

      <div className="page-header">
        <div>
          <h1>Contact Inquiries</h1>
          <p>Review messages sent from the landing page contact form</p>
        </div>
        <button className="btn btn-secondary" onClick={() => void loadInquiries()} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="status-overview" aria-label="Inquiry status counts">
        <div className="status-chip">
          <span>Total Inquiries</span>
          <strong>{inquiryCounts.total}</strong>
        </div>
        <div className="status-chip">
          <span>New</span>
          <strong>{inquiryCounts.new}</strong>
        </div>
        <div className="status-chip">
          <span>Contacted</span>
          <strong>{inquiryCounts.contacted}</strong>
        </div>
        <div className="status-chip">
          <span>Archived</span>
          <strong>{inquiryCounts.archived}</strong>
        </div>
      </div>

      <div className="page-content">
        {pageError && <div className="profile-alert error">{pageError}</div>}
        <DataTable
          columns={columns}
          data={inquiries as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyMessage="No contact inquiries yet."
        />
      </div>

      <Modal
        isOpen={replyOpen}
        onClose={handleCloseReplyModal}
        title={`Reply to ${replyInquiry?.name || 'Inquiry'}`}
        size="medium"
      >
        <div className="modal-form">
          <div className="form-group">
            <label htmlFor="replyRecipient">To</label>
            <input
              id="replyRecipient"
              type="text"
              value={replyInquiry?.email || ''}
              readOnly
            />
          </div>

          <div className="form-group">
            <label htmlFor="replySubject">Subject</label>
            <input
              id="replySubject"
              type="text"
              value={replySubject}
              onChange={(event) => setReplySubject(event.target.value)}
              placeholder="Enter email subject"
            />
          </div>

          <div className="form-group">
            <label htmlFor="replyMessage">Message</label>
            <textarea
              id="replyMessage"
              rows={8}
              value={replyMessage}
              onChange={(event) => setReplyMessage(event.target.value)}
              placeholder="Write your reply"
            />
          </div>

          {replyError ? <div className="profile-alert error">{replyError}</div> : null}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCloseReplyModal}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void handleSendReply()} disabled={isSendingReply}>
              {isSendingReply ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setSelectedInquiry(null);
        }}
        onConfirm={confirmDeleteInquiry}
        title="Delete Inquiry"
        message={`Delete the inquiry from "${selectedInquiry?.name || 'this contact'}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
