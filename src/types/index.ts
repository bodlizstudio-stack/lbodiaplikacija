export type LanguageCode = 'sl' | 'en';

export type HabitCategory =
  | 'fitness'
  | 'nutrition'
  | 'faith'
  | 'mindset'
  | 'study'
  | 'work'
  | 'recovery'
  | 'discipline';

export type HabitPriority = 'low' | 'medium' | 'high' | 'critical';

export type HabitRepeatType = 'daily' | 'weekdays' | 'one_time';

export interface Habit {
  id: string;
  title: string;
  description: string;
  category: HabitCategory;
  icon: string;
  priority: HabitPriority;
  color: string;
  repeatType: HabitRepeatType;
  /** Days of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
  repeatDays: number[];
  /** Specific YYYY-MM-DD date if repeatType === 'one_time' */
  targetDate?: string;
  /** Optional HH:mm reminder time */
  reminderTime?: string;
  /** Optional numeric target e.g. 10000 (steps) or 3 (liters) */
  targetValue?: number;
  unit?: string;
  isPaused: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyHabitRecord {
  id: string;
  date: string; // YYYY-MM-DD in Europe/Ljubljana
  habitId: string;
  habitTitleSnapshot: string;
  habitCategorySnapshot: HabitCategory;
  habitPrioritySnapshot: HabitPriority;
  habitIconSnapshot: string;
  habitColorSnapshot: string;
  targetValueSnapshot?: number;
  unitSnapshot?: string;
  completed: boolean;
  isRestDay?: boolean;
  completedAt?: string;
  valueAchieved?: number;
  notes?: string;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  scheduledCount: number;
  completedCount: number;
  completionPct: number;
  disciplineScore: number;
  notes: string;
  manualOverride?: boolean;
  updatedAt: string;
}

export interface NoFapMilestone {
  days: number;
  titleEn: string;
  titleSl: string;
  badgeIcon: string;
}

export interface NoFapHistoryEntry {
  id: string;
  startTimestamp: string; // ISO timestamp
  endTimestamp: string; // ISO timestamp
  durationSeconds: number;
  resetReason: string;
  createdAt: string;
}

export interface NoFapState {
  startTimestamp: string; // ISO timestamp
  longestStreakSeconds: number;
  totalResets: number;
  emergencyReasons: string[];
}

export type ManifestationSessionType = 'morning' | 'afternoon' | 'evening';

export interface ManifestationEntry {
  id: string;
  date: string; // YYYY-MM-DD
  session: ManifestationSessionType;
  gratefulFor: string;
  alreadyHave: string;
  becoming: string;
  presentTenseStatement: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Affirmation {
  id: string;
  text: string;
  category: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface PhysiqueEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg?: number;
  waistCm?: number;
  bodyFatPct?: number;
  frontPhotoUri?: string;
  sidePhotoUri?: string;
  backPhotoUri?: string;
  customPhotoUri?: string;
  customCategoryLabel?: string;
  notes: string;
  createdAt: string;
}

export type BibleTestament = 'OT' | 'NT';

export type BibleCategory =
  | 'discipline'
  | 'strength'
  | 'faith'
  | 'perseverance'
  | 'wisdom'
  | 'gratitude'
  | 'patience'
  | 'courage'
  | 'hope';

export interface BibleVerse {
  id: string;
  referenceEn: string;
  referenceSl: string;
  textEn: string; // KJV (Public Domain)
  textSl: string; // Chraska / Classical Slovenian Public Domain Scripture
  testament: BibleTestament;
  category: BibleCategory;
  isFavorite?: boolean;
}

export interface WeeklyReviewStatsSnapshot {
  completedHabits: number;
  totalScheduledHabits: number;
  weeklyCompletionPct: number;
  avgDisciplineScore: number;
  mostConsistentHabit: string | null;
  mostMissedHabit: string | null;
  manifestationSessionsCount: number;
  physiquePhotoTaken: boolean;
}

export interface WeeklyReview {
  id: string;
  weekStartDate: string; // YYYY-MM-DD (Monday)
  weekEndDate: string; // YYYY-MM-DD (Sunday)
  achievedNothing: boolean;
  achievements: string;
  failedGoals: string;
  learned: string;
  improveNextWeek: string;
  proudOf: string;
  topGoalNextWeek: string;
  statsSnapshot: WeeklyReviewStatsSnapshot;
  createdAt: string;
}

export interface WhyIStartedData {
  mission: string;
  longTermGoals: string;
  disciplineReasons: string;
  financialGoals: string;
  idealPhysique: string;
  personalValues: string;
  personBecoming: string;
  personalQuotes: string[];
  motivationPhotoUris: string[];
  updatedAt: string;
}

export interface DailyJournalEntry {
  date: string; // YYYY-MM-DD
  wentWell: string;
  wentWrong: string;
  doBetterTomorrow: string;
  feelings: string;
  gratitude: string;
  moodRating: number; // 1-5
  energyRating: number; // 1-5
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  completed: boolean;
  startedAt: string;
  completedAt?: string;
}

export type GoalTimeframe = 'short' | 'monthly' | 'yearly' | 'life';

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  timeframe: GoalTimeframe;
  targetDate: string; // YYYY-MM-DD
  progressPct: number; // 0-100
  milestones: GoalMilestone[];
  linkedHabitIds: string[];
  completed: boolean;
  notes: string;
  createdAt: string;
}

export interface AchievementBadge {
  id: string;
  titleEn: string;
  titleSl: string;
  descriptionEn: string;
  descriptionSl: string;
  icon: string;
  unlockedAt?: string;
}

export interface PastSelfEntry {
  id: string;
  title: string;
  recordedDate: string; // YYYY-MM-DD or period label
  mediaType: 'video' | 'image';
  mediaUri: string; // idb:// key or file URI
  weightThenKg?: number;
  reflectionNote: string;
  createdAt: string;
}

export interface UserSettings {
  profileName: string;
  language: LanguageCode;
  preserveEnglishQuotes: boolean;
  onboardingCompleted: boolean;
  hardcoreMode: boolean;
  priorityWeightingEnabled: boolean;
  notificationsEnabled: boolean;
  manifestationMorningTime: string; // default "08:00"
  manifestationAfternoonTime: string; // default "14:00"
  manifestationEveningTime: string; // default "21:00"
  missedTaskNotificationTime: string; // default "09:00"
  randomMotivationWindowHours: number; // default 4
  activeHoursStart: string; // default "08:00"
  activeHoursEnd: string; // default "22:00"
  quietHoursEnabled: boolean;
  physiqueReminderDay: number; // 1 = Monday
  physiqueReminderTime: string; // default "09:00"
  weeklyReviewDay: number; // 0 = Sunday
  weeklyReviewTime: string; // default "20:00"
  bibleVerseReminderTime: string; // default "07:30"
  bibleTranslationPreference: 'sl' | 'en_kjv' | 'both';
  startingWeightKg: number;
  goalWeightKg: number;
  pinLockEnabled: boolean;
  biometricEnabled: boolean;
  customQuotes: string[];
  lastMissedNotificationDate?: string;
  weeklyReviewDismissedForWeek?: string;
}
