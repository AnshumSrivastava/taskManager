import { useState, useEffect, useCallback } from 'react';
import { AppState, Task, CustomCollection, TaskType, TaskFrequency } from '../types';
import {
  loadState, saveState, createTask, createCollection,
  applyDailyReset, todayISO, ACCENT_COLORS, completeTask, undoComplete
} from '../utils';

export function useAppState() {
  const [state, setState] = useState<AppState>(() => {
    const loaded = loadState();
    return { ...loaded, tasks: applyDailyReset(loaded.tasks), lastResetDate: todayISO() };
  });

  // Persist on every change
  useEffect(() => { saveState(state); }, [state]);

  // ===== Task operations =====
  const addTask = useCallback((partial: Partial<Task> & { title: string }) => {
    const colorIndex = state.tasks.length % ACCENT_COLORS.length;
    const base = createTask(
      partial.title,
      partial.type ?? 'daily',
      partial.color ?? ACCENT_COLORS[colorIndex],
      partial.customCollectionId,
      partial.customItemType
    );
    const task: Task = { ...base, ...partial, id: base.id, createdAt: base.createdAt, order: base.order };
    setState((prev) => ({ ...prev, tasks: [...prev.tasks, task] }));
    return task;
  }, [state.tasks.length]);

  const updateTask = useCallback((updated: Task) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => t.id === updated.id ? updated : t),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
  }, []);

  const reorderTasks = useCallback((tasks: Task[]) => {
    setState((prev) => ({ ...prev, tasks }));
  }, []);

  const doComplete = useCallback((task: Task) => {
    updateTask(task.completedCount >= task.count ? undoComplete(task) : completeTask(task));
  }, [updateTask]);

  const moveTaskToType = useCallback((taskId: string, newType: TaskType, newFrequency?: TaskFrequency) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const freq = newFrequency ?? (newType === 'weekly' ? 'weekly' : newType === 'once' ? 'once' : 'daily');
        return {
          ...t,
          type: newType,
          frequency: newType === 'custom' ? t.frequency : freq,
          customCollectionId: newType === 'custom' ? t.customCollectionId : undefined,
          showInDashboard: newType === 'custom' ? false : t.showInDashboard,
        };
      }),
    }));
  }, []);

  const toggleDashboard = useCallback((taskId: string, show: boolean, freq?: TaskFrequency) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? { ...t, showInDashboard: show, dashboardFrequency: freq ?? t.dashboardFrequency }
          : t
      ),
    }));
  }, []);

  // ===== Collection operations =====
  const addCollection = useCallback((partial: Partial<CustomCollection> & { name: string }) => {
    const base = createCollection(partial.name, partial.icon ?? '📁', partial.color ?? ACCENT_COLORS[0]);
    const col: CustomCollection = { ...base, ...partial, id: base.id };
    setState((prev) => ({ ...prev, customCollections: [...prev.customCollections, col] }));
    return col;
  }, []);

  const updateCollection = useCallback((updated: CustomCollection) => {
    setState((prev) => ({
      ...prev,
      customCollections: prev.customCollections.map((c) => c.id === updated.id ? updated : c),
    }));
  }, []);

  const deleteCollection = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      customCollections: prev.customCollections.filter((c) => c.id !== id),
      // Orphan tasks become 'once' type
      tasks: prev.tasks.map((t) =>
        t.customCollectionId === id
          ? { ...t, type: 'once' as TaskType, customCollectionId: undefined }
          : t
      ),
    }));
  }, []);

  // ===== Settings =====
  const updateSettings = useCallback((settings: Partial<AppState['settings']>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...settings } }));
  }, []);

  return {
    state,
    // Tasks
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    doComplete,
    moveTaskToType,
    toggleDashboard,
    // Collections
    addCollection,
    updateCollection,
    deleteCollection,
    // Settings
    updateSettings,
  };
}

export type AppStateAPI = ReturnType<typeof useAppState>;
