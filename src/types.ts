// ===== Frequency / Type =====
export type TaskFrequency = 'daily' | 'weekly' | 'once';
export type TaskType = 'daily' | 'weekly' | 'once' | 'custom';
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
export type CustomItemType = 'book' | 'video' | 'note' | 'link' | 'other';
export type PrimaryCTA = 'complete' | 'link' | 'note';

// ===== Shared =====
export interface TaskLink {
  id: string;
  label: string;
  url: string;
}

// ===== Task =====
export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  frequency: TaskFrequency;          // for daily/weekly/once tasks
  weekDays?: WeekDay[];              // for weekly tasks
  count: number;                     // target count per period
  completedCount: number;            // done this period
  streak: number;
  bestStreak: number;
  lastCompletedDate: string | null;
  links: TaskLink[];
  popupNote: string;
  color: string;
  createdAt: string;
  order: number;
  completedDates: string[];
  pinned?: boolean;
  primaryCTA?: PrimaryCTA;        // which action is the main card button
  primaryCTALinkId?: string;      // which link to open (if CTA = 'link')
  // Custom collection fields
  customCollectionId?: string;
  customItemType?: CustomItemType;
  // When a custom item is toggled to appear on dashboard
  showInDashboard?: boolean;
  dashboardFrequency?: TaskFrequency;
}

// ===== Custom Collection =====
export interface CustomCollection {
  id: string;
  name: string;
  icon: string;          // emoji
  color: string;
  description: string;
  createdAt: string;
  order: number;
}

// ===== Settings =====
export interface AppSettings {
  userName: string;
}

// ===== Root App State =====
export interface AppState {
  tasks: Task[];
  customCollections: CustomCollection[];
  settings: AppSettings;
  lastResetDate: string;
}
