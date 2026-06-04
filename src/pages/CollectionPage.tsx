import { useState } from 'react';
import { Task, CustomCollection, TaskFrequency } from '../types';
import { AppStateAPI } from '../hooks/useAppState';
import { ITEM_TYPE_ICONS } from '../utils';
import TaskModal from '../components/TaskModal';
import CollectionModal from '../components/CollectionModal';
import NotePopup from '../components/NotePopup';

const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M6.5 1.5v10M1.5 6.5h10" />
  </svg>
);

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 2l2 2-6 6L3 11l.5-2 5.5-7z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M2 3.5h9M4.5 3.5V2.5h4v1M3.5 3.5l.5 7h5l.5-7" />
  </svg>
);

const LinkIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M3.5 6.5a2.5 2.5 0 003.5 0l1-1a2.5 2.5 0 00-3.5-3.5L4 2.5" />
    <path d="M6.5 3.5a2.5 2.5 0 00-3.5 0L2 4.5a2.5 2.5 0 003.5 3.5l.5-.5" />
  </svg>
);

const NoteIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="2" y="2" width="8" height="8" rx="1.5" /><path d="M4 5h4M4 7h2.5" />
  </svg>
);

interface CollectionPageProps {
  collection: CustomCollection;
  api: AppStateAPI;
}

function ItemCard({ task, api, collection, onEdit, onDelete }: {
  task: Task;
  api: AppStateAPI;
  collection: CustomCollection;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const [showNote, setShowNote] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const icon = task.customItemType ? ITEM_TYPE_ICONS[task.customItemType] : '✦';

  return (
    <>
      <div className="collection-item-card">
        <div className="collection-item-header">
          <div className="item-type-icon" style={{ borderColor: `${collection.color}40`, background: `${collection.color}15` }}>
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="collection-item-title">{task.title}</div>
            {task.description && <div className="collection-item-desc">{task.description}</div>}
          </div>
          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
            {task.popupNote && (
              <button className="btn-icon" onClick={() => setShowNote(true)} title="Show note"><NoteIcon /></button>
            )}
            <button className="btn-icon" onClick={() => onEdit(task)} title="Edit"><EditIcon /></button>
            {confirmDelete ? (
              <>
                <button className="btn-icon" onClick={() => onDelete(task.id)} style={{ color: 'var(--danger)' }}><TrashIcon /></button>
                <button className="btn-icon" onClick={() => setConfirmDelete(false)}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l7 7M9 2l-7 7" /></svg>
                </button>
              </>
            ) : (
              <button className="btn-icon" onClick={() => setConfirmDelete(true)} title="Delete"><TrashIcon /></button>
            )}
          </div>
        </div>

        {/* Links */}
        {task.links.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {task.links.map((link) => (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="link-pill">
                <LinkIcon />{link.label || 'Link'}
              </a>
            ))}
          </div>
        )}

        {/* Footer: dashboard toggle + streak */}
        <div className="collection-item-footer">
          <button
            className={`toggle-dashboard-btn ${task.showInDashboard ? 'active' : ''}`}
            onClick={() => api.toggleDashboard(task.id, !task.showInDashboard, task.dashboardFrequency)}
            id={`toggle-dash-${task.id}`}
            aria-pressed={task.showInDashboard}
          >
            {task.showInDashboard ? '✓ On Dashboard' : '+ Add to Dashboard'}
          </button>

          {task.showInDashboard && (
            <select
              className="form-input form-select"
              value={task.dashboardFrequency ?? 'daily'}
              onChange={(e) => api.toggleDashboard(task.id, true, e.target.value as TaskFrequency)}
              style={{ fontSize: '11px', padding: '3px 22px 3px 7px', height: 'auto', width: 'auto' }}
              aria-label="Dashboard frequency"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="once">Once</option>
            </select>
          )}

          {task.streak > 0 && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              🔥 {task.streak}
            </span>
          )}
        </div>
      </div>

      {showNote && task.popupNote && (
        <NotePopup title={task.title} note={task.popupNote} onClose={() => setShowNote(false)} />
      )}
    </>
  );
}

export default function CollectionPage({ collection, api }: CollectionPageProps) {
  const [addModal, setAddModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>();
  const [editCollection, setEditCollection] = useState(false);

  const items = api.state.tasks.filter((t) => t.customCollectionId === collection.id);
  const pinnedCount = items.filter((t) => t.showInDashboard).length;

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{collection.icon}</span>
            {collection.name}
          </div>
          <div className="page-subtitle">{items.length} item{items.length !== 1 ? 's' : ''} · {pinnedCount} on dashboard</div>
        </div>
        <div className="page-header-right">
          <button className="btn-secondary" onClick={() => setEditCollection(true)} aria-label="Edit collection">
            <EditIcon /> Edit
          </button>
          <button className="btn-primary" onClick={() => setAddModal(true)} id={`col-add-btn-${collection.id}`}>
            <PlusIcon /> Add Item
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Collection header card */}
        <div className="collection-header-card">
          <div
            className="collection-icon-large"
            style={{ background: `${collection.color}20`, border: `1px solid ${collection.color}40` }}
          >
            {collection.icon}
          </div>
          <div className="collection-info">
            <div className="collection-name">{collection.name}</div>
            {collection.description && <div className="collection-desc">{collection.description}</div>}
            <div className="collection-meta">{items.length} items · {pinnedCount} pinned to dashboard</div>
          </div>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{collection.icon}</div>
            <div className="empty-state-title">No items yet</div>
            <div className="empty-state-sub">Add books, videos, notes, or anything you want to keep track of</div>
            <button className="btn-primary" onClick={() => setAddModal(true)} style={{ marginTop: '8px' }}>
              <PlusIcon /> Add First Item
            </button>
          </div>
        ) : (
          <div className="collection-item-grid">
            {items.map((task) => (
              <ItemCard
                key={task.id}
                task={task}
                api={api}
                collection={collection}
                onEdit={setEditTask}
                onDelete={api.deleteTask}
              />
            ))}
            <button className="btn-add-task" onClick={() => setAddModal(true)}>
              <PlusIcon /> Add Item
            </button>
          </div>
        )}
      </div>

      {addModal && (
        <TaskModal
          defaultType="custom"
          defaultCollectionId={collection.id}
          collections={api.state.customCollections}
          onSave={(partial) => {
            api.addTask({ ...partial, title: partial.title ?? '', customCollectionId: collection.id });
            setAddModal(false);
          }}
          onClose={() => setAddModal(false)}
        />
      )}

      {editTask && (
        <TaskModal
          task={editTask}
          collections={api.state.customCollections}
          onSave={(partial) => { api.updateTask({ ...editTask, ...partial } as Task); setEditTask(undefined); }}
          onClose={() => setEditTask(undefined)}
        />
      )}

      {editCollection && (
        <CollectionModal
          collection={collection}
          onSave={(partial) => { api.updateCollection({ ...collection, ...partial }); setEditCollection(false); }}
          onClose={() => setEditCollection(false)}
        />
      )}
    </>
  );
}
