import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskType, TaskFrequency, PrimaryCTA } from '../types';
import { formatStreak, ITEM_TYPE_ICONS } from '../utils';
import NotePopup from './NotePopup';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onComplete: (task: Task) => void;
  compact?: boolean;
  onMoveTo?: (taskId: string, type: TaskType, freq?: TaskFrequency) => void;
  collectionName?: string;
}

/* ── Icons ── */
function DragHandle(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="card-drag-handle" {...props} aria-label="Drag to reorder">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <circle cx="4" cy="2.5" r="1" /><circle cx="8" cy="2.5" r="1" />
        <circle cx="4" cy="6"   r="1" /><circle cx="8" cy="6"   r="1" />
        <circle cx="4" cy="9.5" r="1" /><circle cx="8" cy="9.5" r="1" />
      </svg>
    </div>
  );
}

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6.5l3.5 3.5 5.5-6" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 2.5H2.5a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V8" />
    <path d="M8 1.5h3.5v3.5M11.5 1.5L6.5 6.5" />
  </svg>
);

const NoteOpenIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="1.5" width="10" height="10" rx="2" />
    <path d="M4 5h5M4 7.5h3" />
  </svg>
);

const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 1.5l2 2-6 6-2.5.5.5-2.5 6-6z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M2 3h8M4.5 3V2h3v1M3.5 3l.5 7h4l.5-7" />
  </svg>
);

const LinkPillIcon = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M3.5 5.5a2.3 2.3 0 003.2 0l1.2-1.2a2.3 2.3 0 00-3.2-3.2l-.5.5" />
    <path d="M5.5 3.5a2.3 2.3 0 00-3.2 0L1.1 4.7a2.3 2.3 0 003.2 3.2l.5-.5" />
  </svg>
);

const MoveIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M2 6h8M7 3l3 3-3 3" />
  </svg>
);

const MOVE_OPTIONS: { label: string; type: TaskType; freq?: TaskFrequency }[] = [
  { label: 'Daily',    type: 'daily',  freq: 'daily' },
  { label: 'Weekly',   type: 'weekly', freq: 'weekly' },
  { label: 'One-time', type: 'once',   freq: 'once' },
];

/* ── Helpers ── */
function resolveCTA(task: Task): PrimaryCTA {
  const cta = task.primaryCTA ?? 'complete';
  // Fallback: if link chosen but no links exist → complete
  if (cta === 'link' && task.links.length === 0) return 'complete';
  // Fallback: if note chosen but no note → complete
  if (cta === 'note' && !task.popupNote) return 'complete';
  return cta;
}

function getPrimaryLink(task: Task) {
  if (!task.links.length) return null;
  return task.primaryCTALinkId
    ? task.links.find((l) => l.id === task.primaryCTALinkId) ?? task.links[0]
    : task.links[0];
}

/* ── Component ── */
export default function TaskCard({
  task, onEdit, onDelete, onComplete, compact = false, onMoveTo, collectionName,
}: TaskCardProps) {
  const [showNote, setShowNote]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMove, setShowMove]         = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const isFullyDone = task.completedCount >= task.count;
  const progress    = Math.min(1, task.completedCount / Math.max(1, task.count));
  const freqLabel   = task.type === 'daily' ? 'Daily' : task.type === 'weekly' ? 'Weekly' : task.type === 'once' ? 'Once' : collectionName ?? 'Custom';
  const itemIcon    = task.customItemType ? ITEM_TYPE_ICONS[task.customItemType] : null;

  const cta         = resolveCTA(task);
  const primaryLink = cta === 'link' ? getPrimaryLink(task) : null;
  // Other links that are NOT the primary CTA link (shown as small pills below)
  const secondaryLinks = cta === 'link' && primaryLink
    ? task.links.filter((l) => l.id !== primaryLink.id)
    : task.links;

  /* ── CTA button renderer ── */
  function renderPrimaryCTA() {
    if (compact) {
      // In kanban compact mode: always just a small "complete" toggle
      return (
        <button
          className={`btn-complete ${isFullyDone ? 'done' : ''}`}
          onClick={() => onComplete(task)}
          id={`complete-btn-${task.id}`}
          aria-label={isFullyDone ? 'Undo' : 'Complete'}
        >
          <CheckIcon />
          {isFullyDone ? 'Done' : task.count > 1 ? 'Log' : 'Complete'}
        </button>
      );
    }

    if (cta === 'link' && primaryLink) {
      return (
        <a
          href={primaryLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="card-primary-cta"
          style={{ backgroundColor: task.color, color: '#fff' }}
          id={`cta-btn-${task.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLinkIcon />
          <span>{primaryLink.label || 'Open link'}</span>
          {/* small checkmark on right to also mark complete */}
          <button
            className="cta-also-complete"
            title="Also mark complete"
            aria-label="Also mark complete"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onComplete(task); }}
          >
            {isFullyDone
              ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 5l2.5 2.5 4.5-5" /></svg>
              : <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="5" cy="5" r="3.5" /></svg>
            }
          </button>
        </a>
      );
    }

    if (cta === 'note') {
      return (
        <button
          className="card-primary-cta"
          style={{ backgroundColor: task.color, color: '#fff' }}
          onClick={() => setShowNote(true)}
          id={`cta-btn-${task.id}`}
          aria-label="Read note"
        >
          <NoteOpenIcon />
          <span>Read note</span>
          <button
            className="cta-also-complete"
            title="Also mark complete"
            aria-label="Also mark complete"
            onClick={(e) => { e.stopPropagation(); onComplete(task); }}
          >
            {isFullyDone
              ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 5l2.5 2.5 4.5-5" /></svg>
              : <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="5" cy="5" r="3.5" /></svg>
            }
          </button>
        </button>
      );
    }

    // Default: complete
    return (
      <button
        className={`card-primary-cta ${isFullyDone ? 'cta-done' : ''}`}
        style={isFullyDone
          ? { backgroundColor: 'var(--success-dim)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.25)' }
          : { backgroundColor: task.color, color: '#fff' }
        }
        onClick={() => onComplete(task)}
        id={`cta-btn-${task.id}`}
        aria-label={isFullyDone ? 'Undo completion' : 'Mark complete'}
      >
        <CheckIcon />
        <span>
          {isFullyDone
            ? 'Completed — tap to undo'
            : task.count > 1
              ? `Log one (${task.completedCount}/${task.count})`
              : 'Mark complete'
          }
        </span>
      </button>
    );
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`task-card ${isFullyDone ? 'completed' : ''} ${isDragging ? 'dragging' : ''} ${compact ? 'compact' : ''}`}
        id={`task-card-${task.id}`}
      >
        <div className="card-accent-bar" style={{ backgroundColor: task.color }} />
        <div className="card-body">

          {/* ── Top row: drag + title + utility icons ── */}
          <div className="card-header">
            <DragHandle {...attributes} {...listeners} />
            <div className="card-title-area">
              <div className={`card-title ${isFullyDone ? 'done' : ''}`}>
                {itemIcon && <span style={{ marginRight: '5px' }}>{itemIcon}</span>}
                {task.title}
              </div>
              {!compact && task.description && (
                <div className="card-description">{task.description}</div>
              )}
            </div>

            {/* Utility icon cluster */}
            <div className="card-util-icons">
              <span className="card-freq-badge">{freqLabel}</span>

              {/* Note icon (only when NOT primary CTA) */}
              {task.popupNote && cta !== 'note' && !compact && (
                <button className="btn-icon" onClick={() => setShowNote(true)} title="Show note" aria-label="Show note">
                  <NoteOpenIcon />
                </button>
              )}

              {/* Move to (kanban) */}
              {onMoveTo && (
                <div style={{ position: 'relative' }}>
                  <button
                    className="btn-icon"
                    onClick={() => setShowMove((v) => !v)}
                    title="Move to…"
                    aria-label="Move to"
                    id={`move-btn-${task.id}`}
                  >
                    <MoveIcon />
                  </button>
                  {showMove && (
                    <div style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 50,
                      minWidth: '120px', boxShadow: 'var(--shadow-md)',
                    }}>
                      {MOVE_OPTIONS.filter((o) => o.type !== task.type).map((o) => (
                        <button
                          key={o.type}
                          onClick={() => { onMoveTo(task.id, o.type, o.freq); setShowMove(false); }}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            padding: '7px 12px', fontSize: '12px', color: 'var(--text-secondary)',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                        >
                          → {o.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button className="btn-icon" onClick={() => onEdit(task)} title="Edit" aria-label="Edit task">
                <EditIcon />
              </button>

              {confirmDelete ? (
                <>
                  <button className="btn-icon" onClick={() => onDelete(task.id)} style={{ color: 'var(--danger)' }} title="Confirm">
                    <TrashIcon />
                  </button>
                  <button className="btn-icon" onClick={() => setConfirmDelete(false)} title="Cancel">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l7 7M9 2l-7 7" /></svg>
                  </button>
                </>
              ) : (
                <button className="btn-icon" onClick={() => setConfirmDelete(true)} title="Delete" aria-label="Delete task">
                  <TrashIcon />
                </button>
              )}
            </div>
          </div>

          {/* Progress bar (count > 1) */}
          {task.count > 1 && (
            <div className="card-counter">
              <div className="counter-track">
                <div className="counter-fill" style={{
                  width: `${progress * 100}%`,
                  backgroundColor: isFullyDone ? 'var(--success)' : task.color,
                }} />
              </div>
              <span className="counter-label">{task.completedCount}/{task.count}</span>
            </div>
          )}

          {/* ── PRIMARY CTA ── */}
          <div className="card-cta-area">
            {renderPrimaryCTA()}
          </div>

          {/* Streaks */}
          {!compact && (
            <div className="card-streak">
              <div className="streak-item">
                <div className="streak-value" style={{ color: task.streak > 0 ? task.color : undefined }}>
                  {formatStreak(task.streak, task.frequency)}
                </div>
                <div className="streak-label">Streak</div>
              </div>
              <div className="streak-divider" />
              <div className="streak-item">
                <div className="streak-value">{formatStreak(task.bestStreak, task.frequency)}</div>
                <div className="streak-label">Best</div>
              </div>
              <div className="streak-divider" />
              <div className="streak-item">
                <div className="streak-value">{task.completedDates.length}</div>
                <div className="streak-label">Total</div>
              </div>
              {task.streak >= 3 && <div className="streak-fire">🔥</div>}
            </div>
          )}

          {/* Secondary links (pills) */}
          {!compact && secondaryLinks.length > 0 && (
            <div className="card-links">
              {secondaryLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-pill"
                  id={`link-${link.id}`}
                >
                  <LinkPillIcon />{link.label || 'Link'}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNote && task.popupNote && (
        <NotePopup title={task.title} note={task.popupNote} onClose={() => setShowNote(false)} />
      )}
    </>
  );
}
