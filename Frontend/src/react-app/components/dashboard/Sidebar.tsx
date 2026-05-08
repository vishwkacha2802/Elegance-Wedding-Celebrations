const items = [
  { key: "home", label: "Home" },
  { key: "events", label: "My Events" },
  { key: "budget", label: "Budget Planner" },
  { key: "guests", label: "Guest List" },
  { key: "vendors", label: "Vendors" },
  { key: "messages", label: "Messages" },
  { key: "settings", label: "Profile Settings" },
];

type SidebarProps = {
  open: boolean;
};

export default function Sidebar({ open }: SidebarProps) {
  return (
    <aside className="elegance-sidebar" aria-hidden={!open}>
      <div className="elegance-brand">
        <img
          src="/favicon-elegance.svg"
          alt="Elegance Weddings logo"
          className="elegance-brand-logo"
        />
        <div>
          <div className="elegance-brand-title">Elegance</div>
          <div className="elegance-brand-sub">Wedding & Celebrations</div>
        </div>
      </div>

      <div className="elegance-nav-section">Dashboard</div>
      <nav className="elegance-nav">
        {items.map((it, idx) => (
          <a
            key={it.key}
            href="#"
            className={`elegance-nav-item ${idx === 0 ? "active" : ""}`}
            onClick={(e) => e.preventDefault()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <span>{it.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
