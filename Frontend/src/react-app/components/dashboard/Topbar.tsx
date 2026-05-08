type TopbarProps = {
  onToggleSidebar: () => void;
};

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  return (
    <header className="elegance-topbar">
      <div className="elegance-top-left">
        <button
          className="elegance-hamburger"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="elegance-section-title">User Dashboard</div>
      </div>
      <div className="elegance-top-right">
        <button className="elegance-icon-btn" aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22Zm7-5v-5a7 7 0 0 0-14 0v5l-2 2h18l-2-2Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>
        <div className="elegance-avatar">E</div>
      </div>
    </header>
  );
}
