import { useState } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { Task, TaskType } from '../types';
import { AppStateAPI } from '../hooks/useAppState';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';

interface KanbanColProps {
  id: string;
  title: string;
  color: string;
  icon?: string;
  tasks: Task[];
  api: AppStateAPI;
  onAdd: () => void;
  getCollectionName: (id: string) => string;
}

function KanbanColumn({ title, color, icon, tasks, api, onAdd, getCollectionName }: KanbanColProps) {
  const [editing, setEditing] = useState<Task | undefined>();

  return (
    <div className="kanban-col">
      <div className="kanban-col-header">
        {icon
          ? <span style={{ fontSize: '14px' }}>{icon}</span>
          : <div className="kanban-col-dot" style={{ backgroundColor: color }} />
        }
        <span className="kanban-col-title">{title}</span>
        <span className="kanban-col-count">{tasks.length}</span>
        <button
          style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1, transition: 'color var(--t)' }}
          onClick={onAdd}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          aria-label={`Add to ${title}`}
        >+</button>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className={`kanban-drop-zone`}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={setEditing}
              onDelete={api.deleteTask}
              onComplete={api.doComplete}
              compact
              onMoveTo={(taskId, newType, freq) => api.moveTaskToType(taskId, newType, freq)}
              collectionName={task.customCollectionId ? getCollectionName(task.customCollectionId) : undefined}
            />
          ))}
          {tasks.length === 0 && (
            <div className="kanban-empty">
              <span style={{ fontSize: '20px', opacity: 0.5 }}>{icon ?? '○'}</span>
              <span>No tasks</span>
            </div>
          )}
        </div>
      </SortableContext>

      {editing && (
        <TaskModal
          task={editing}
          collections={api.state.customCollections}
          onSave={(partial) => { api.updateTask({ ...editing, ...partial } as Task); setEditing(undefined); }}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}

interface OverviewProps { api: AppStateAPI; }

export default function Overview({ api }: OverviewProps) {
  const [addModal, setAddModal] = useState<{ type: TaskType; collectionId?: string } | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { tasks, customCollections } = api.state;

  const getTasksByType = (type: TaskType, colId?: string) => {
    if (type === 'custom' && colId) return tasks.filter((t) => t.type === 'custom' && t.customCollectionId === colId);
    if (type === 'custom') return tasks.filter((t) => t.type === 'custom' && !t.customCollectionId);
    return tasks.filter((t) => t.type === type);
  };

  const getCollectionName = (id: string) => {
    const col = customCollections.find((c) => c.id === id);
    return col ? `${col.icon} ${col.name}` : 'Custom';
  };

  const findContainerType = (id: string): { type: TaskType; colId?: string } | null => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;
    return { type: task.type, colId: task.customCollectionId };
  };

  const handleDragStart = (e: DragStartEvent) => {
    setActiveTask(tasks.find((t) => t.id === e.active.id) ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveTask(null);
    if (!over) return;

    const fromContainer = findContainerType(active.id as string);
    const toContainer = findContainerType(over.id as string);

    if (!fromContainer || !toContainer) return;

    if (fromContainer.type !== toContainer.type || fromContainer.colId !== toContainer.colId) {
      // Move between columns
      api.moveTaskToType(active.id as string, toContainer.type);
      if (toContainer.type === 'custom' && toContainer.colId) {
        api.updateTask({ ...tasks.find((t) => t.id === active.id)!, customCollectionId: toContainer.colId });
      }
    } else {
      // Reorder within column
      const colTasks = getTasksByType(fromContainer.type, fromContainer.colId);
      const ids = colTasks.map((t) => t.id);
      const reordered = arrayMove(colTasks, ids.indexOf(active.id as string), ids.indexOf(over.id as string));
      const updated = api.state.tasks.map((t) => reordered.find((r) => r.id === t.id) ?? t);
      api.reorderTasks(updated);
    }
  };

  const coreColumns: { type: TaskType; title: string; color: string }[] = [
    { type: 'daily', title: 'Daily', color: '#6366f1' },
    { type: 'weekly', title: 'Weekly', color: '#8b5cf6' },
    { type: 'once', title: 'One-time', color: '#f43f5e' },
  ];

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Overview</div>
          <div className="page-subtitle">Kanban view — drag cards between columns to change type</div>
        </div>
      </div>

      <div className="page-body" style={{ overflow: 'visible' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-board">
            {/* Core columns */}
            {coreColumns.map((col) => (
              <KanbanColumn
                key={col.type}
                id={col.type}
                title={col.title}
                color={col.color}
                tasks={getTasksByType(col.type)}
                api={api}
                onAdd={() => setAddModal({ type: col.type })}
                getCollectionName={getCollectionName}
              />
            ))}

            {/* Custom collection columns */}
            {customCollections.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.name}
                color={col.color}
                icon={col.icon}
                tasks={getTasksByType('custom', col.id)}
                api={api}
                onAdd={() => setAddModal({ type: 'custom', collectionId: col.id })}
                getCollectionName={getCollectionName}
              />
            ))}

            {/* Unassigned custom */}
            {tasks.some((t) => t.type === 'custom' && !t.customCollectionId) && (
              <KanbanColumn
                id="custom-unassigned"
                title="Uncategorized"
                color="#64748b"
                icon="📦"
                tasks={getTasksByType('custom')}
                api={api}
                onAdd={() => setAddModal({ type: 'custom' })}
                getCollectionName={getCollectionName}
              />
            )}
          </div>

          <DragOverlay>
            {activeTask && (
              <TaskCard
                task={activeTask}
                onEdit={() => {}}
                onDelete={() => {}}
                onComplete={() => {}}
                compact
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {addModal && (
        <TaskModal
          defaultType={addModal.type}
          defaultCollectionId={addModal.collectionId}
          collections={api.state.customCollections}
          onSave={(partial) => {
            api.addTask({ ...partial, title: partial.title ?? '' });
            setAddModal(null);
          }}
          onClose={() => setAddModal(null)}
        />
      )}
    </>
  );
}
