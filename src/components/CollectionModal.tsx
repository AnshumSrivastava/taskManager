import { useState, useRef, useEffect } from 'react';
import { CustomCollection } from '../types';
import { ACCENT_COLORS } from '../utils';

const COLLECTION_EMOJIS = ['📚', '🎬', '📝', '🎵', '🔗', '🎮', '💡', '🌱', '🏋️', '✈️', '🍳', '🎨', '📷', '💻', '📦', '⭐', '🔖', '📁'];

interface CollectionModalProps {
  collection?: CustomCollection;
  onSave: (partial: Partial<CustomCollection> & { name: string }) => void;
  onClose: () => void;
}

export default function CollectionModal({ collection, onSave, onClose }: CollectionModalProps) {
  const [name, setName] = useState(collection?.name ?? '');
  const [icon, setIcon] = useState(collection?.icon ?? '📁');
  const [color, setColor] = useState(collection?.color ?? ACCENT_COLORS[0]);
  const [description, setDescription] = useState(collection?.description ?? '');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), icon, color, description: description.trim() });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="col-modal-title">
        <div className="modal-header">
          <h2 className="modal-title" id="col-modal-title">
            {collection ? 'Edit Collection' : 'New Collection'}
          </h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l8 8M11 3l-8 8" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Icon picker */}
            <div className="form-group">
              <label className="form-label">Icon</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {COLLECTION_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setIcon(e)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1.5px solid ${icon === e ? 'var(--accent)' : 'var(--border)'}`,
                      background: icon === e ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      cursor: 'pointer',
                      transition: 'all var(--t)',
                    }}
                    aria-label={`Icon ${e}`}
                    aria-pressed={icon === e}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="col-name">Collection Name</label>
              <input
                id="col-name"
                ref={nameRef}
                className="form-input"
                placeholder="e.g. Books to Read, YouTube Playlists…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="col-desc">Description</label>
              <input
                id="col-desc"
                className="form-input"
                placeholder="What's this collection for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Color */}
            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="color-picker">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch ${color === c ? 'selected' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    aria-label={`Color ${c}`}
                    aria-pressed={color === c}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                width: '40px', height: '40px',
                borderRadius: 'var(--radius-md)',
                background: `${color}20`,
                border: `1px solid ${color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px',
              }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{name || 'Collection Name'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{description || 'Description'}</div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>
              {collection ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
