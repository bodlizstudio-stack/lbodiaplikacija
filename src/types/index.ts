export type LanguageCode = 'sl' | 'en';
export type ThemeMode = 'dark' | 'light' | 'system';

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

export type TransformationPhotoCategory =
  | 'telesna_preobrazba'
  | 'obraz'
  | 'fitnes'
  | 'zivljenjski_slog'
  | 'spomini'
  | 'drugo';

export interface PhysiqueEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title?: string;
  category?: TransformationPhotoCategory;
  weightKg?: number;
  waistCm?: number;
  bodyFatPct?: number;
  frontPhotoUri?: string;
  sidePhotoUri?: string;
  backPhotoUri?: string;
  customPhotoUri?: string;
  customCategoryLabel?: string;
  notes: string;
  milestoneThen?: string;
  milestoneNow?: string;
  milestoneLearned?: string;
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
  | 'hope'
  | 'temptation'
  | 'self_control'
  | 'love'
  | 'forgiveness'
  | 'anxiety'
  | 'trust';

export interface BibleVerse {
  id: string;
  referenceEn: string;
  referenceSl: string;
  textEn: string; // KJV (Public Domain)
  textSl: string; // Chraska / Classical Slovenian Public Domain Scripture (1914)
  translationEn?: string;
  translationSl?: string;
  reflectionEn?: string;
  reflectionSl?: string;
  applicationEn?: string;
  applicationSl?: string;
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

export type JournalEntryType =
  | 'daily_reflection'
  | 'gratitude'
  | 'prayer'
  | 'personal_thoughts'
  | 'milestone'
  | 'lessons_learned';

export interface DailyJournalEntry {
  date: string; // YYYY-MM-DD
  entryType?: JournalEntryType;
  wentWell: string;
  wentWrong: string;
  doBetterTomorrow: string;
  feelings: string;
  gratitude: string;
  prayerText?: string;
  archived?: boolean;
  moodRating: number; // 1-5
  energyRating: number; // 1-5
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  taskTitle?: string;
  completed: boolean;
  startedAt: string;
  completedAt?: string;
}

export type GoalTimeframe = 'short' | 'monthly' | 'yearly' | 'life';
export type GoalCategory =
  | 'vera'
  | 'zdravje'
  | 'disciplina'
  | 'izobrazba'
  | 'delo'
  | 'odnosi'
  | 'osebna_rast';

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category?: GoalCategory;
  timeframe: GoalTimeframe;
  startDate?: string; // YYYY-MM-DD
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

// ---------- LBODI 2.0: Gratitude, Prayer, Reading Plans ----------
export type GratitudeCategory =
  | 'family'
  | 'health'
  | 'faith'
  | 'friends'
  | 'opportunities'
  | 'growth'
  | 'small_joys'
  | 'other';

export interface GratitudeEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mainText: string;
  threeBlessings: string[];
  dailyPrayer?: string;
  category: GratitudeCategory;
  photoUri?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PrayerStatus = 'in_prayer' | 'still_praying' | 'answered' | 'closed';
export type PrayerCategory =
  | 'gratitude'
  | 'guidance'
  | 'strength'
  | 'family'
  | 'forgiveness'
  | 'other';

export interface PrayerEntry {
  id: string;
  title: string;
  text: string;
  date: string; // YYYY-MM-DD
  category: PrayerCategory;
  status: PrayerStatus;
  reflection?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BibleReadingDay {
  dayNumber: number;
  referenceSl: string;
  referenceEn: string;
  focusSl: string;
  focusEn: string;
}

export interface BibleReadingPlan {
  id: string;
  titleSl: string;
  titleEn: string;
  descriptionSl: string;
  descriptionEn: string;
  durationDays: number;
  days: BibleReadingDay[];
}

export interface DailyReflectionEntry {
  date: string; // YYYY-MM-DD
  question: string;
  answer: string;
  updatedAt: string;
}

// ---------- LBODI 2.0: Lifestyle Vision (14-Day System) ----------
export interface LifestyleVisionSections {
  faith: string;
  bodyHealth: string;
  discipline: string;
  workPurpose: string;
  relationships: string;
  personalIdentity: string;
}

export interface IdealDayPlan {
  morning: string;
  workStudy: string;
  fitness: string;
  meals: string;
  prayer: string;
  evening: string;
  sleep: string;
}

export interface LifestyleVisionVersion {
  id: string;
  versionNumber: number;
  sections: LifestyleVisionSections;
  idealDay: IdealDayPlan;
  visionStatement: string;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BiweeklyVisionReview {
  id: string;
  date: string; // YYYY-MM-DD
  visionVersionId: string;
  closerToPerson: string;
  spaceForGod: string;
  doDifferently: string;
  habitToImprove: string;
  accomplishments: string;
  challenges: string;
  gratitude: string;
  createdAt: string;
}

// ---------- LBODI 2.0: Fitness, Wellness & Nutrition ----------
export interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weightKg?: number;
}

export interface WorkoutLog {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  exercises: WorkoutExercise[];
  durationMinutes?: number;
  notes?: string;
  createdAt: string;
}

export interface DailyCheckIn {
  date: string; // YYYY-MM-DD
  sleepHours?: number;
  energy: number; // 1-5
  mood: number; // 1-5
  stress: number; // 1-5
  mainPriority?: string;
  gratitudeQuick?: string;
  reflection?: string;
  updatedAt: string;
}

export type NutritionSource = 'manual' | 'import_csv' | 'import_json' | 'import_pdf';

export interface NutritionEntry {
  date: string; // YYYY-MM-DD
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: NutritionSource;
  notes?: string;
  updatedAt: string;
}

export interface NutritionImportRecord {
  id: string;
  fileName: string;
  format: 'csv' | 'json' | 'pdf';
  importedDates: string[];
  fingerprint: string;
  importedAt: string;
}

export interface NutritionTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

// ---------- LBODI 2.0: Notifications, AI & Dashboard Customization ----------
export type ReminderType =
  | 'morning'
  | 'midday'
  | 'evening'
  | 'biweekly_vision'
  | 'morning_prayer'
  | 'bible_reading'
  | 'gratitude'
  | 'fitness'
  | 'water'
  | 'study'
  | 'weekly_review';

export interface ReminderConfig {
  id: string;
  type: ReminderType;
  enabled: boolean;
  localTime: string; // HH:MM
  timezone: string;
  recurrence: 'daily' | 'weekly' | 'every_14_days';
  anchorDate?: string; // YYYY-MM-DD
  lastDeliveredDate?: string; // YYYY-MM-DD
  channel: 'in_app' | 'web_push' | 'native';
  updatedAt: string;
}

export interface InAppNotificationItem {
  id: string;
  reminderType: ReminderType;
  title: string;
  body: string;
  date: string;
  route: string;
  read: boolean;
  createdAt: string;
}

export interface CustomReminderMessage {
  id: string;
  textSl: string;
  textEn: string;
  scriptureRef?: string;
  active: boolean;
}

export interface AIPrivacySettings {
  allowHabits: boolean;
  allowGoals: boolean;
  allowVision: boolean;
  allowWorkouts: boolean;
  allowNutrition: boolean;
  allowSleep: boolean;
  allowJournal: boolean;
  allowPrayers: boolean;
  allowDisciplineTracker: boolean;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  model?: string;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export type DashboardSectionId =
  | 'scripture'
  | 'dailyReflection'
  | 'dailyProgress'
  | 'quickActions'
  | 'discipline'
  | 'vision'
  | 'nutrition'
  | 'eveningReflection';

export interface DashboardSectionConfig {
  id: DashboardSectionId;
  enabled: boolean;
}

export interface DisciplinePrivacySettings {
  hideFromDashboard: boolean;
  customTitle: string;
  personalGoalDays: number;
  personalReason: string;
}

export interface UserSettings {
  profileName: string;
  language: LanguageCode;
  themeMode?: ThemeMode;
  timezone?: string;
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
  dashboardSections?: DashboardSectionConfig[];
  disciplinePrivacy?: DisciplinePrivacySettings;
  nutritionTargets?: NutritionTargets;
  aiPrivacy?: AIPrivacySettings;
  reminderConfigs?: ReminderConfig[];
  customReminders?: CustomReminderMessage[];
  visionReminderAnchorDate?: string;
  visionReminderTime?: string;
  webPushSubscribed?: boolean;
}
