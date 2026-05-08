import { useState, useRef, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.assign('/auth');
  };

  const handleOpenProfile = () => {
    setUserMenuOpen(false);
    navigate('/admin/profile');
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/admin/vendors', label: 'Vendors', icon: 'vendors' },
    { path: '/admin/users', label: 'Users', icon: 'users' },
    { path: '/admin/bookings', label: 'Bookings', icon: 'bookings' },
    { path: '/admin/reviews', label: 'Reviews', icon: 'reviews' },
    { path: '/admin/inquiries', label: 'Inquiries', icon: 'inquiries' },
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'dashboard':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </svg>
        );
      case 'vendors':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9,22 9,12 15,12 15,22" />
          </svg>
        );
      case 'users':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        );
      case 'bookings':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case 'inquiries':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        );
      case 'reviews':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.1 8.6 22 9.3 17 14.1 18.3 21 12 17.4 5.7 21 7 14.1 2 9.3 8.9 8.6 12 2" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="admin-layout">
      <header className="admin-navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <div className="brand-logo" aria-hidden="true">
              <Heart className="brand-logo-icon" />
            </div>
            <div className="brand-copy">
              <span className="brand-text">Elegance Admin</span>
              <span className="brand-subtext">Control Center</span>
            </div>
          </div>

          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>

          <nav className={`navbar-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {getIcon(item.icon)}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="navbar-user" ref={userMenuRef}>
            <button
              className="user-menu-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="user-avatar">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name || 'Admin'}</span>
                <span className="user-role">{user?.role || 'Administrator'}</span>
              </div>
              <svg 
                className={`dropdown-arrow ${userMenuOpen ? 'open' : ''}`}
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </button>

            {userMenuOpen && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <span>{user?.email}</span>
                </div>
                <button className="dropdown-item" onClick={handleOpenProfile}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21a8 8 0 10-16 0" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  My Profile
                </button>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16,17 21,12 16,7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
