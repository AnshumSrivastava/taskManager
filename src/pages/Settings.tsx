import { useState } from 'react';
import { AppStateAPI } from '../hooks/useAppState';

interface SettingsProps { api: AppStateAPI; }

export default function Settings({ api }: SettingsProps) {
  const [name, setName] = useState(api.state.settings.userName);
  const [exported, setExported] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const save = () => api.updateSettings({ userName: name });

  const exportData = () => {
    const blob = new Blob([JSON.stringify(api.state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dailytrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const clearAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  const taskCount = api.state.tasks.length;
  const colCount = api.state.customCollections.length;
  const totalCompletions = api.state.tasks.reduce((s, t) => s + t.completedDates.length, 0);

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Preferences and data management</div>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: '540px' }}>

        {/* Profile */}
        <div className="settings-section">
          <div className="settings-section-title">Profile</div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Your Name</div>
              <div className="settings-row-desc">Shown in the dashboard greeting</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={{ width: '140px' }}
                id="settings-name"
              />
              <button className="btn-primary" onClick={save} style={{ padding: '7px 12px' }}>Save</button>
            </div>
          </div>
        </div>

        {/* Stats summary */}
        <div className="settings-section">
          <div className="settings-section-title">Your Stats</div>
          <div className="settings-row">
            <div className="settings-row-label">Total Tasks</div>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{taskCount}</span>
          </div>
          <div className="settings-row">
            <div className="settings-row-label">Collections</div>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{colCount}</span>
          </div>
          <div className="settings-row">
            <div className="settings-row-label">Total Completions (all time)</div>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{totalCompletions}</span>
          </div>
        </div>

        {/* App info */}
        <div className="settings-section">
          <div className="settings-section-title">App</div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Install on Mobile</div>
              <div className="settings-row-desc">Open in Firefox or Chrome → "Add to Home Screen"</div>
            </div>
            <span style={{ fontSize: '20px' }}>📱</span>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Storage</div>
              <div className="settings-row-desc">All data stored locally in your browser</div>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>localStorage</span>
          </div>
        </div>

        {/* Data management */}
        <div className="settings-section">
          <div className="settings-section-title">Data</div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Export Data</div>
              <div className="settings-row-desc">Download a JSON backup of all tasks and collections</div>
            </div>
            <button className="btn-secondary" onClick={exportData} id="export-btn">
              {exported ? '✓ Exported' : 'Export JSON'}
            </button>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label" style={{ color: 'var(--danger)' }}>Clear All Data</div>
              <div className="settings-row-desc">Permanently deletes all tasks and collections</div>
            </div>
            {confirmClear ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn-danger" onClick={clearAll}>Confirm</button>
                <button className="btn-secondary" onClick={() => setConfirmClear(false)}>Cancel</button>
              </div>
            ) : (
              <button className="btn-danger" onClick={() => setConfirmClear(true)} id="clear-btn">Clear</button>
            )}
          </div>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '32px' }}>
          DailyTrack · v0.2.0 · Made with ♥
        </div>
      </div>
    </>
  );
}
