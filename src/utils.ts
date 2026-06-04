import { Task, AppState, TaskFrequency, TaskType, WeekDay, CustomCollection, CustomItemType } from './types';
import { v4 as uuidv4 } from 'uuid';
import { format, isToday, isYesterday, parseISO, startOfWeek, isSameWeek } from 'date-fns';

const STORAGE_KEY = 'daily-task-manager-v2';

export const ACCENT_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#06b6d4', // cyan
];

export const ITEM_TYPE_ICONS: Record<CustomItemType, string> = {
  book: '📚',
  video: '▶️',
  note: '📝',
  link: '🔗',
  other: '✦',
};

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// ===== Factory functions =====
export function createTask(
  title: string,
  type: TaskType = 'daily',
  color: string = ACCENT_COLORS[0],
  customCollectionId?: string,
  customItemType?: CustomItemType
): Task {
  const frequency: TaskFrequency = type === 'once' ? 'once' : type === 'weekly' ? 'weekly' : 'daily';
  return {
    id: uuidv4(),
    title,
    description: '',
    type,
    frequency: type === 'custom' ? 'once' : frequency,
    weekDays: type === 'weekly' ? [1] : undefined,
    count: 1,
    completedCount: 0,
    streak: 0,
    bestStreak: 0,
    lastCompletedDate: null,
    links: [],
    popupNote: '',
    color,
    createdAt: new Date().toISOString(),
    order: Date.now(),
    completedDates: [],
    pinned: false,
    customCollectionId,
    customItemType: customItemType ?? (type === 'custom' ? 'other' : undefined),
    showInDashboard: false,
    dashboardFrequency: 'daily',
  };
}

export function createCollection(name: string, icon: string, color: string): CustomCollection {
  return {
    id: uuidv4(),
    name,
    icon,
    color,
    description: '',
    createdAt: new Date().toISOString(),
    order: Date.now(),
  };
}

// ===== Storage =====
const DEFAULT_STATE: AppState = {
  tasks: [],
  customCollections: [],
  settings: { userName: '' },
  lastResetDate: todayISO(),
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      // Forward-migrate tasks that have no `type` field
      const tasks = parsed.tasks.map((t) => ({
        ...t,
        type: t.type ?? (t.frequency === 'once' ? 'once' : t.frequency ?? 'daily') as TaskType,
        customCollectionId: t.customCollectionId,
        showInDashboard: t.showInDashboard ?? false,
        dashboardFrequency: t.dashboardFrequency ?? 'daily',
      }));
      return {
        ...DEFAULT_STATE,
        ...parsed,
        tasks,
        customCollections: parsed.customCollections ?? [],
        settings: parsed.settings ?? { userName: '' },
      };
    }
    // Try migrating v1 data
    const v1 = localStorage.getItem('daily-task-manager-v1');
    if (v1) {
      const parsed = JSON.parse(v1) as { tasks: Task[]; lastResetDate: string };
      const tasks = parsed.tasks.map((t) => ({
        ...t,
        type: (t.frequency === 'once' ? 'once' : t.frequency ?? 'daily') as TaskType,
        showInDashboard: false,
        dashboardFrequency: 'daily' as TaskFrequency,
      }));
      return { ...DEFAULT_STATE, tasks, lastResetDate: parsed.lastResetDate };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_STATE };
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ===== Streak logic =====
export function shouldReset(task: Task): boolean {
  if (!task.lastCompletedDate) return false;
  const last = parseISO(task.lastCompletedDate);
  const freq = task.showInDashboard ? task.dashboardFrequency : task.frequency;
  if (freq === 'daily') return !isToday(last);
  if (freq === 'weekly') return !isSameWeek(last, new Date(), { weekStartsOn: 1 });
  return false;
}

export function isStreakBroken(task: Task): boolean {
  if (!task.lastCompletedDate) return false;
  const last = parseISO(task.lastCompletedDate);
  const freq = task.showInDashboard ? task.dashboardFrequency : task.frequency;
  if (freq === 'daily') return !isToday(last) && !isYesterday(last);
  if (freq === 'weekly') {
    const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(last, { weekStartsOn: 1 });
    return thisWeekStart.getTime() - lastWeekStart.getTime() > 7 * 24 * 60 * 60 * 1000;
  }
  return false;
}

export function applyDailyReset(tasks: Task[]): Task[] {
  return tasks.map((task) => {
    if (task.type === 'once' && !task.showInDashboard) return task;
    if (!shouldReset(task)) return task;
    const broken = isStreakBroken(task);
    return { ...task, completedCount: 0, streak: broken ? 0 : task.streak };
  });
}

export function completeTask(task: Task): Task {
  const today = todayISO();
  const newCount = task.completedCount + 1;
  const isFullyDone = newCount >= task.count;

  let streak = task.streak;
  let bestStreak = task.bestStreak;

  if (isFullyDone && task.lastCompletedDate !== today) {
    const last = task.lastCompletedDate ? parseISO(task.lastCompletedDate) : null;
    let streakContinues = false;
    const freq = task.showInDashboard ? task.dashboardFrequency : task.frequency;
    if (last) {
      if (freq === 'daily') streakContinues = isYesterday(last) || isToday(last);
      else if (freq === 'weekly') {
        const diff = startOfWeek(new Date(), { weekStartsOn: 1 }).getTime()
          - startOfWeek(last, { weekStartsOn: 1 }).getTime();
        streakContinues = diff <= 7 * 24 * 60 * 60 * 1000;
      }
    }
    streak = streakContinues ? streak + 1 : 1;
    bestStreak = Math.max(bestStreak, streak);
  }

  return {
    ...task,
    completedCount: newCount,
    lastCompletedDate: isFullyDone ? today : task.lastCompletedDate,
    streak,
    bestStreak,
    completedDates: isFullyDone && !task.completedDates.includes(today)
      ? [...task.completedDates, today]
      : task.completedDates,
  };
}

export function undoComplete(task: Task): Task {
  if (task.completedCount <= 0) return task;
  const newCount = task.completedCount - 1;
  const wasFullyDone = task.completedCount >= task.count;
  const today = todayISO();
  return {
    ...task,
    completedCount: newCount,
    lastCompletedDate: wasFullyDone ? null : task.lastCompletedDate,
    streak: wasFullyDone && task.lastCompletedDate === today ? Math.max(0, task.streak - 1) : task.streak,
    completedDates: wasFullyDone ? task.completedDates.filter((d) => d !== today) : task.completedDates,
  };
}

// ===== Helpers =====
export function getWeekDayLabel(day: WeekDay): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day];
}

export function formatStreak(streak: number, freq: TaskFrequency): string {
  if (streak === 0) return '—';
  return `${streak}${freq === 'weekly' ? 'wk' : 'd'}`;
}

export function getDashboardTasks(tasks: Task[]): Task[] {
  return tasks.filter(
    (t) => t.type === 'daily' || t.type === 'weekly' || t.type === 'once' || t.showInDashboard
  );
}
