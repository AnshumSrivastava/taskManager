import { useState, useEffect, useRef } from 'react';
import { Task, TaskLink, TaskType, TaskFrequency, WeekDay, CustomCollection, CustomItemType, PrimaryCTA } from '../types';
import { ACCENT_COLORS, getWeekDayLabel, ITEM_TYPE_ICONS } from '../utils';
import { v4 as uuidv4 } from 'uuid';

interface TaskModalProps {
  task?: Task;
  defaultType?: TaskType;
  defaultCollectionId?: string;
  collections: CustomCollection[];
  onSave: (task: Partial<Task>) => void;
  onClose: () => void;
}

const allWeekDays: WeekDay[] = [1, 2, 3, 4, 5, 6, 0];
const itemTypes: CustomItemType[] = ['book', 'video', 'note', 'link', 'other'];

const TYPE_META: Record<TaskType, { label: string; emoji: string; hint: string }> = {
  daily:  { label: 'Daily',    emoji: '🔁', hint: 'Repeats every day, builds streaks' },
  weekly: { label: 'Weekly',   emoji: '📅', hint: 'Repeats each week' },
  once:   { label: 'One-time', emoji: '✅', hint: 'A task you do once' },
  custom: { label: 'Save it',  emoji: '📌', hint: 'Books, videos, notes to revisit' },
};

export default function TaskModal({
  task, defaultType, defaultCollectionId, collections, onSave, onClose,
}: TaskModalProps) {
  const [title, setTitle]             = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [type, setType]               = useState<TaskType>(task?.type ?? defaultType ?? 'daily');
  const [frequency, setFrequency]     = useState<TaskFrequency>(task?.frequency ?? 'daily');
  const [weekDays, setWeekDays]       = useState<WeekDay[]>(task?.weekDays ?? [1]);
  const [count, setCount]             = useState(task?.count ?? 1);
  const [color, setColor]             = useState(task?.color ?? ACCENT_COLORS[0]);
  const [links, setLinks]             = useState<TaskLink[]>(task?.links ?? []);
  const [popupNote, setPopupNote]     = useState(task?.popupNote ?? '');
  const [collectionId, setCollectionId]     = useState(task?.customCollectionId ?? defaultCollectionId ?? '');
  const [customItemType, setCustomItemType] = useState<CustomItemType>(task?.customItemType ?? 'other');
  const [primaryCTA, setPrimaryCTA]         = useState<PrimaryCTA>(task?.primaryCTA ?? 'complete');
  const [primaryCTALinkId, setPrimaryCTALinkId] = useState<string>(task?.primaryCTALinkId ?? '');

  // Tab state
  const [activeTab, setActiveTab] = useState<'general' | 'details' | 'actions'>('general');

  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => { titleRef.current?.focus(); }, []);

  const showWeekDays = type === 'weekly' || (type === 'custom' && frequency === 'weekly');

  const toggleWeekDay = (day: WeekDay) =>
    setWeekDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);

  const addLink    = () => setLinks((prev) => [...prev, { id: uuidv4(), label: '', url: '' }]);
  const removeLink = (id: string) => setLinks((prev) => prev.filter((l) => l.id !== id));
  const updateLink = (id: string, field: 'label' | 'url', value: string) =>
    setLinks((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const freq: TaskFrequency = type === 'weekly' ? 'weekly' : type === 'once' ? 'once' : 'daily';
    onSave({
      title: title.trim(),
      description: description.trim(),
      type,
      frequency: type === 'custom' ? frequency : freq,
      weekDays: showWeekDays ? weekDays : undefined,
      count: Math.max(1, count),
      color,
      links: links.filter((l) => l.url.trim()),
      popupNote: popupNote.trim(),
      customCollectionId: type === 'custom' ? (collectionId || undefined) : undefined,
      customItemType: type === 'custom' ? customItemType : undefined,
      primaryCTA,
      primaryCTALinkId: primaryCTA === 'link' ? primaryCTALinkId : undefined,
    });
  };

  const placeholder =
    type === 'custom'  ? 'e.g. Atomic Habits, Lo-fi playlist, article…' :
    type === 'daily'   ? 'e.g. Morning run, drink water, journal…' :
    type === 'weekly'  ? 'e.g. Grocery run, deep work session…' :
                         'e.g. Fix bug, call dentist, submit form…';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title" style={{ maxWidth: '440px' }}>

        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title" id="task-modal-title">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '0 24px' }}>
          {(['general', 'details', 'actions'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 16px',
                fontSize: '13px',
                fontWeight: '600',
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
                background: 'none',
                cursor: 'pointer',
                transition: 'color var(--t)',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ minHeight: '340px' }}>

            {/* ── TAB: GENERAL ── */}
            {activeTab === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Task Type</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {(Object.entries(TYPE_META) as [TaskType, typeof TYPE_META[TaskType]][]).map(([t, meta]) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          border: `1.5px solid ${type === t ? 'var(--accent)' : 'var(--border-subtle)'}`,
                          background: type === t ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                          cursor: 'pointer',
                          transition: 'all var(--t)',
                          textAlign: 'left',
                        }}
                        id={`type-btn-${t}`}
                        aria-pressed={type === t}
                      >
                        <span style={{ fontSize: '18px', lineHeight: 1, marginTop: '1px', flexShrink: 0 }}>{meta.emoji}</span>
                        <span>
                          <span style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: type === t ? 'var(--accent)' : 'var(--text-primary)', lineHeight: 1.2 }}>{meta.label}</span>
                          <span style={{ display: 'block', fontSize: '10px', color: type === t ? 'var(--accent)' : 'var(--text-muted)', marginTop: '3px', lineHeight: 1.3 }}>{meta.hint}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }} htmlFor="task-title">Title</label>
                  <input
                    id="task-title"
                    ref={titleRef}
                    className="form-input"
                    placeholder={placeholder}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    style={{ fontSize: '15px', padding: '11px 13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }} htmlFor="task-desc">Description (Optional)</label>
                  <textarea
                    id="task-desc"
                    className="form-input form-textarea"
                    placeholder="Add details, notes, etc…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ minHeight: '60px', fontSize: '13px' }}
                  />
                </div>
              </div>
            )}


            {/* ── TAB: DETAILS ── */}
            {activeTab === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Color */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Color Theme</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`color-swatch ${color === c ? 'selected' : ''}`}
                        style={{ backgroundColor: c, width: '28px', height: '28px' }}
                        onClick={() => setColor(c)}
                        aria-label={`Color ${c}`}
                        aria-pressed={color === c}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom specifics */}
                {type === 'custom' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Collection</label>
                        <select className="form-input form-select" value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
                          <option value="">No collection</option>
                          {collections.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Show in Dashboard as</label>
                        <select className="form-input form-select" value={frequency} onChange={(e) => setFrequency(e.target.value as TaskFrequency)}>
                          <option value="daily">Daily habit</option>
                          <option value="weekly">Weekly habit</option>
                          <option value="once">One-time</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Item Type</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {itemTypes.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setCustomItemType(t)}
                            style={{
                              padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '500',
                              border: `1px solid ${customItemType === t ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                              background: customItemType === t ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                              color: customItemType === t ? 'var(--accent)' : 'var(--text-secondary)',
                              display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                          >
                            <span>{ITEM_TYPE_ICONS[t]}</span> <span style={{ textTransform: 'capitalize' }}>{t}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Days of week */}
                {showWeekDays && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Which days?</div>
                    <div className="weekday-picker">
                      {allWeekDays.map((day) => (
                        <button
                          key={day} type="button"
                          className={`weekday-btn ${weekDays.includes(day) ? 'active' : ''}`}
                          onClick={() => toggleWeekDay(day)}
                        >{getWeekDayLabel(day)}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Daily target count */}
                {type !== 'custom' && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Times per session</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button type="button" className="counter-step-btn" style={{ width: '36px', height: '36px' }} onClick={() => setCount((c) => Math.max(1, c - 1))}>−</button>
                      <input
                        className="form-input counter-num-input" type="number" min={1} max={100}
                        value={count} onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ height: '36px', width: '60px', fontSize: '16px' }}
                      />
                      <button type="button" className="counter-step-btn" style={{ width: '36px', height: '36px' }} onClick={() => setCount((c) => Math.min(100, c + 1))}>+</button>
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* ── TAB: ACTIONS ── */}
            {activeTab === 'actions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Primary CTA Picker */}
                <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Main Card Button</label>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>Choose the primary action when you tap this task</div>
                  <select
                    className="form-input form-select"
                    value={primaryCTA}
                    onChange={(e) => setPrimaryCTA(e.target.value as PrimaryCTA)}
                    style={{ marginBottom: primaryCTA === 'link' && links.length > 1 ? '8px' : '0' }}
                  >
                    <option value="complete">Complete Task (Default)</option>
                    <option value="link">Open Link</option>
                    <option value="note">Read Note</option>
                  </select>
                  
                  {primaryCTA === 'link' && links.length > 1 && (
                    <select className="form-input form-select" value={primaryCTALinkId} onChange={(e) => setPrimaryCTALinkId(e.target.value)}>
                      <option value="">(First link)</option>
                      {links.map((l) => <option key={l.id} value={l.id}>{l.label || l.url}</option>)}
                    </select>
                  )}
                  {primaryCTA === 'link' && links.length === 0 && (
                    <div style={{ fontSize: '11px', color: 'var(--warning)', marginTop: '6px' }}>⚠️ Add a link below first.</div>
                  )}
                  {primaryCTA === 'note' && !popupNote && (
                    <div style={{ fontSize: '11px', color: 'var(--warning)', marginTop: '6px' }}>⚠️ Add a note below first.</div>
                  )}
                </div>

                {/* Links */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>External Links</div>
                    <button type="button" className="btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={addLink}>+ Add Link</button>
                  </div>
                  {links.length > 0 ? (
                    <div className="links-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {links.map((link) => (
                        <div key={link.id} style={{ display: 'flex', gap: '6px' }}>
                          <input className="form-input" placeholder="Label" value={link.label} onChange={(e) => updateLink(link.id, 'label', e.target.value)} style={{ width: '35%' }} />
                          <input className="form-input" placeholder="https://…" type="url" value={link.url} onChange={(e) => updateLink(link.id, 'url', e.target.value)} style={{ flex: 1 }} />
                          <button type="button" className="btn-icon" onClick={() => removeLink(link.id)} style={{ color: 'var(--danger)' }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                      No links added.
                    </div>
                  )}
                </div>

                {/* Popup note */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }} htmlFor="task-note">Popup Note / Reminder</label>
                  <textarea
                    id="task-note"
                    className="form-input form-textarea"
                    placeholder="Instructions, motivation, or text to read…"
                    value={popupNote}
                    onChange={(e) => setPopupNote(e.target.value)}
                    style={{ minHeight: '80px', fontSize: '13px' }}
                  />
                </div>
              </div>
            )}

          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '16px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            
            {/* If not on the last tab, maybe show a "Next" button instead of Create? 
                Actually, having Create always visible is fine since Title is on tab 1. */}
            <button type="submit" className="btn-primary" disabled={!title.trim()} id="task-submit-btn">
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
