import { useState } from 'react';
import { useAppState } from './hooks/useAppState';
import { useRouter } from './hooks/useRouter';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import CollectionModal from './components/CollectionModal';
import Dashboard from './pages/Dashboard';
import Overview from './pages/Overview';
import CollectionPage from './pages/CollectionPage';
import Settings from './pages/Settings';

// Mobile collections picker overlay
function CollectionsOverlay({
  collections,
  navigate,
  onAdd,
  onClose,
}: {
  collections: ReturnType<typeof useAppState>['state']['customCollections'];
  navigate: (p: string) => void;
  onAdd: () => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm">
        <div className="modal-header">
          <h2 className="modal-title">Collections</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l8 8M11 3l-8 8" /></svg>
          </button>
        </div>
        <div className="modal-body" style={{ paddingBottom: '16px' }}>
          {collections.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px 0' }}>
              No collections yet. Create one!
            </div>
          )}
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => { navigate(`/collection/${col.id}`); onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '10px 0',
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', fontSize: '14px',
              }}
            >
              <span style={{ fontSize: '20px' }}>{col.icon}</span>
              <span style={{ fontWeight: 500 }}>{col.name}</span>
              {col.description && <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>{col.description}</span>}
            </button>
          ))}
          <button
            className="btn-secondary"
            onClick={() => { onAdd(); onClose(); }}
            style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
          >
            + New Collection
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const api = useAppState();
  const { route, navigate } = useRouter();
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [showMobileCollections, setShowMobileCollections] = useState(false);

  const { customCollections } = api.state;

  // Render current page
  const renderPage = () => {
    switch (route.page) {
      case 'overview':
        return <Overview api={api} />;
      case 'collection': {
        const col = customCollections.find((c) => c.id === route.id);
        return col
          ? <CollectionPage collection={col} api={api} />
          : <Dashboard api={api} />;
      }
      case 'settings':
        return <Settings api={api} />;
      default:
        return <Dashboard api={api} />;
    }
  };

  return (
    <div className="app-shell">
      {/* Desktop sidebar */}
      <Sidebar
        route={route}
        navigate={navigate}
        collections={customCollections}
        onAddCollection={() => setShowAddCollection(true)}
      />

      {/* Main content */}
      <main className="main-content" id="main-content">
        {renderPage()}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav
        route={route}
        navigate={navigate}
        collections={customCollections}
        onCollectionsMenu={() => setShowMobileCollections(true)}
      />

      {/* Add collection modal */}
      {showAddCollection && (
        <CollectionModal
          onSave={(partial) => {
            const col = api.addCollection({ ...partial, name: partial.name });
            setShowAddCollection(false);
            navigate(`/collection/${col.id}`);
          }}
          onClose={() => setShowAddCollection(false)}
        />
      )}

      {/* Mobile collections picker */}
      {showMobileCollections && (
        <CollectionsOverlay
          collections={customCollections}
          navigate={navigate}
          onAdd={() => setShowAddCollection(true)}
          onClose={() => setShowMobileCollections(false)}
        />
      )}
    </div>
  );
}
