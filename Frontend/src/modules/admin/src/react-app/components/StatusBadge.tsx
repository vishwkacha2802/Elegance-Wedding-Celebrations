interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusClass = () => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'completed':
        return 'badge-success';
      case 'in_progress':
      case 'in progress':
        return 'badge-info';
      case 'pending':
      case 'new':
        return 'badge-warning';
      case 'contacted':
        return 'badge-info';
      case 'inactive':
      case 'rejected':
      case 'cancelled':
      case 'canceled':
      case 'archived':
        return 'badge-danger';
      default:
        return 'badge-default';
    }
  };

  const label = String(status || '')
    .replace(/_/g, ' ')
    .trim() || 'pending';

  return (
    <span className={`status-badge ${getStatusClass()}`}>
      {label}
    </span>
  );
}

