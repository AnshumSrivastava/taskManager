import { CustomCollection } from '../types';
import { Route } from '../hooks/useRouter';

interface BottomNavProps {
  route: Route;
  navigate: (path: string) => void;
  collections: CustomCollection[];
  onCollectionsMenu: () => void;
}

const DashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="7" height="7" rx="1.5" />
    <rect x="11" y="2" width="7" height="7" rx="1.5" />
    <rect x="2" y="11" width="7" height="7" rx="1.5" />
    <rect x="11" y="11" width="7" height="7" rx="1.5" />
  </svg>
);

const OverviewIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="2" y="3" width="4" height="14" rx="1" />
    <rect x="8" y="3" width="4" height="10" rx="1" />
    <rect x="14" y="3" width="4" height="12" rx="1" />
  </svg>
);

const CollectionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h14M3 10h14M3 14h8" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="3" />
    <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" />
  </svg>
);

function isCollectionActive(route: Route) {
  return route.page === 'collection';
}

export default function BottomNav({ route, navigate, onCollectionsMenu }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      <div className="bottom-nav-inner">
        <button
          className={`bottom-nav-item ${route.page === 'dashboard' ? 'active' : ''}`}
          onClick={() => navigate('/')}
          id="mobile-nav-dashboard"
          aria-label="Dashboard"
        >
          <div className="bottom-nav-icon"><DashIcon /></div>
          Dashboard
        </button>

        <button
          className={`bottom-nav-item ${route.page === 'overview' ? 'active' : ''}`}
          onClick={() => navigate('/overview')}
          id="mobile-nav-overview"
          aria-label="Overview"
        >
          <div className="bottom-nav-icon"><OverviewIcon /></div>
          Overview
        </button>

        <button
          className={`bottom-nav-item ${isCollectionActive(route) ? 'active' : ''}`}
          onClick={onCollectionsMenu}
          id="mobile-nav-collections"
          aria-label="Collections"
        >
          <div className="bottom-nav-icon"><CollectionIcon /></div>
          Collections
        </button>

        <button
          className={`bottom-nav-item ${route.page === 'settings' ? 'active' : ''}`}
          onClick={() => navigate('/settings')}
          id="mobile-nav-settings"
          aria-label="Settings"
        >
          <div className="bottom-nav-icon"><SettingsIcon /></div>
          Settings
        </button>
      </div>
    </nav>
  );
}
