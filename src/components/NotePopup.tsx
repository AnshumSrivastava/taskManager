interface NotePopupProps {
  title: string;
  note: string;
  onClose: () => void;
}

export default function NotePopup({ title, note, onClose }: NotePopupProps) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal popup-note-modal" role="dialog" aria-modal="true" aria-labelledby="note-title">
        <div className="modal-header">
          <h2 className="modal-title" id="note-title" style={{ fontSize: '14px' }}>{title}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close note">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
        <div className="popup-note-content">{note}</div>
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
