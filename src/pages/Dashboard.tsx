import { useState } from 'react';
import { format } from 'date-fns';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, arrayMove
} from '@dnd-kit/sortable';
import { Task, TaskType } from '../types';
import { AppStateAPI } from '../hooks/useAppState';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M7 2v10M2 7h10" />
  </svg>
);

interface SectionProps {
  title: string;
  color: string;
  tasks: Task[];
  api: AppStateAPI;
  onAdd: () => void;
  collectionName?: (id: string) => string;
}

function TaskSection({ title, color, tasks, api, onAdd, collectionName }: SectionProps) {
  const [editing, setEditing] = useState<Task | undefined>();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const ids = tasks.map((t) => t.id);
      const reordered = arrayMove(tasks, ids.indexOf(active.id as string), ids.indexOf(over.id as string));
      // Merge back with full list
      const fullList = api.state.tasks.map((t) => {
        const found = reordered.find((r) => r.id === t.id);
        return found ?? t;
      });
      api.reorderTasks(fullList);
    }
  };

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <div className="section-title">
          <div className="section-title-dot" style={{ backgroundColor: color }} />
          {title}
          <span className="section-count">{tasks.length}</span>
        </div>
        <button className="btn-ghost" style={{ fontSize: '12px', padding: '4px 8px', gap: '4px' }} onClick={onAdd}>
          <PlusIcon /> Add
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={rectSortingStrategy}>
          <div className="task-grid">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={setEditing}
                onDelete={api.deleteTask}
                onComplete={api.doComplete}
                collectionName={task.customCollectionId ? collectionName?.(task.customCollectionId) : undefined}
              />
            ))}
            {tasks.length === 0 && (
              <button className="btn-add-task" onClick={onAdd}>
                <PlusIcon /> Add {title.toLowerCase()} task
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>

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

interface DashboardProps { api: AppStateAPI; }

export default function Dashboard({ api }: DashboardProps) {
  const [addModal, setAddModal] = useState<TaskType | null>(null);
  const today = format(new Date(), "EEEE, MMMM d");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = api.state.settings.userName;

  const allTasks = api.state.tasks;
  const dailyTasks = allTasks.filter((t) => t.type === 'daily');
  const weeklyTasks = allTasks.filter((t) => t.type === 'weekly');
  const onceTasks = allTasks.filter((t) => t.type === 'once');
  const dashboardCustom = allTasks.filter((t) => t.type === 'custom' && t.showInDashboard);

  const doneTasks = allTasks.filter((t) => t.completedCount >= t.count).length;
  const totalStreaks = allTasks.reduce((s, t) => s + t.streak, 0);
  const bestStreak = Math.max(0, ...allTasks.map((t) => t.bestStreak));
  const totalCompletions = allTasks.reduce((s, t) => s + t.completedDates.length, 0);

  const getCollectionName = (id: string) => {
    const col = api.state.customCollections.find((c) => c.id === id);
    return col ? `${col.icon} ${col.name}` : 'Custom';
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">{greeting}{name ? `, ${name}` : ''} 👋</div>
          <div className="page-subtitle">{today}</div>
        </div>
        <div className="page-header-right">
          <button className="btn-primary" onClick={() => setAddModal('daily')} id="dashboard-add-btn">
            <PlusIcon /> New Task
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="dashboard-stats">
          <div className="stat-widget accent">
            <div className="stat-widget-value">{doneTasks}<span style={{ fontSize: '16px', fontWeight: '400', color: 'var(--text-muted)' }}>/{allTasks.length}</span></div>
            <div className="stat-widget-label">Done Today</div>
            <div className="stat-widget-sub">{allTasks.length === 0 ? 'No tasks yet' : doneTasks === allTasks.length ? '🎉 All done!' : `${allTasks.length - doneTasks} remaining`}</div>
          </div>
          <div className="stat-widget">
            <div className="stat-widget-value">{totalStreaks}</div>
            <div className="stat-widget-label">Total Streak</div>
            <div className="stat-widget-sub">{totalStreaks >= 10 ? '🔥 On fire!' : 'Keep going'}</div>
          </div>
          <div className="stat-widget">
            <div className="stat-widget-value">{bestStreak}<span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}> days</span></div>
            <div className="stat-widget-label">Best Streak</div>
            <div className="stat-widget-sub">Personal record</div>
          </div>
          <div className="stat-widget">
            <div className="stat-widget-value">{totalCompletions}</div>
            <div className="stat-widget-label">Total Done</div>
            <div className="stat-widget-sub">All time</div>
          </div>
        </div>

        {/* Daily */}
        <TaskSection
          title="Daily" color="#6366f1"
          tasks={dailyTasks}
          api={api}
          onAdd={() => setAddModal('daily')}
        />

        {/* Weekly */}
        <TaskSection
          title="Weekly" color="#8b5cf6"
          tasks={weeklyTasks}
          api={api}
          onAdd={() => setAddModal('weekly')}
        />

        {/* One-time */}
        <TaskSection
          title="One-time" color="#f43f5e"
          tasks={onceTasks}
          api={api}
          onAdd={() => setAddModal('once')}
        />

        {/* Custom items pinned to dashboard */}
        {dashboardCustom.length > 0 && (
          <TaskSection
            title="Pinned from Collections" color="#f97316"
            tasks={dashboardCustom}
            api={api}
            onAdd={() => setAddModal('custom')}
            collectionName={getCollectionName}
          />
        )}
      </div>

      {/* FAB for mobile */}
      <button className="fab" onClick={() => setAddModal('daily')} aria-label="Add task" id="dashboard-fab">
        <PlusIcon />
      </button>

      {addModal && (
        <TaskModal
          defaultType={addModal}
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
