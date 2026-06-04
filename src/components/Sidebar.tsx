import { CustomCollection } from '../types';
import { Route } from '../hooks/useRouter';

interface SidebarProps {
  route: Route;
  navigate: (path: string) => void;
  collections: CustomCollection[];
  onAddCollection: () => void;
}

function Icon({ children }: { children: React.ReactNode }) {
  return <div className="sidebar-link-icon">{children}</div>;
}

const DashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="5" height="5" rx="1" />
    <rect x="9" y="2" width="5" height="5" rx="1" />
    <rect x="2" y="9" width="5" height="5" rx="1" />
    <rect x="9" y="9" width="5" height="5" rx="1" />
  </svg>
);

const OverviewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="2" y="2" width="3.5" height="12" rx="1" />
    <rect x="6.5" y="2" width="3.5" height="8" rx="1" />
    <rect x="11" y="2" width="3" height="10" rx="1" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="2.5" />
    <path d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.85.85M11.75 11.75l.85.85M12.6 3.4l-.85.85M4.25 11.75l-.85.85" />
  </svg>
);

const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M6.5 2v9M2 6.5h9" />
  </svg>
);

function isActive(route: Route, page: string, id?: string) {
  if (route.page !== page) return false;
  if (id && route.page === 'collection') return (route as { page: 'collection'; id: string }).id === id;
  return true;
}

export default function Sidebar({ route, navigate, collections, onAddCollection }: SidebarProps) {
  return (
    <nav className="sidebar" aria-label="Main navigation">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">D</div>
        <span className="sidebar-logo-text">DailyTrack</span>
      </div>

      <div className="sidebar-nav">
        {/* Core nav */}
        <div className="sidebar-section-label">Menu</div>

        <button
          className={`sidebar-link ${isActive(route, 'dashboard') ? 'active' : ''}`}
          onClick={() => navigate('/')}
          id="nav-dashboard"
          aria-label="Dashboard"
        >
          <Icon><DashIcon /></Icon>
          <span className="sidebar-link-text">Dashboard</span>
        </button>

        <button
          className={`sidebar-link ${isActive(route, 'overview') ? 'active' : ''}`}
          onClick={() => navigate('/overview')}
          id="nav-overview"
          aria-label="Overview"
        >
          <Icon><OverviewIcon /></Icon>
          <span className="sidebar-link-text">Overview</span>
        </button>

        {/* Custom collections */}
        {collections.length > 0 && (
          <>
            <div className="sidebar-section-label" style={{ marginTop: '8px' }}>Collections</div>
            {collections.map((col) => (
              <button
                key={col.id}
                className={`sidebar-link ${isActive(route, 'collection', col.id) ? 'active' : ''}`}
                onClick={() => navigate(`/collection/${col.id}`)}
                id={`nav-col-${col.id}`}
                aria-label={col.name}
              >
                <Icon><span style={{ fontSize: '14px' }}>{col.icon}</span></Icon>
                <span className="sidebar-link-text">{col.name}</span>
              </button>
            ))}
          </>
        )}

        {/* Add collection */}
        <button
          className="sidebar-add-col-btn"
          onClick={onAddCollection}
          id="nav-add-collection"
          aria-label="Add collection"
          style={{ marginTop: '4px' }}
        >
          <div className="sidebar-link-icon">
            <PlusIcon />
          </div>
          <span style={{ fontSize: '12px' }}>New Collection</span>
        </button>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          className={`sidebar-link ${isActive(route, 'settings') ? 'active' : ''}`}
          onClick={() => navigate('/settings')}
          id="nav-settings"
          aria-label="Settings"
        >
          <Icon><SettingsIcon /></Icon>
          <span className="sidebar-link-text">Settings</span>
        </button>
      </div>
    </nav>
  );
}
