import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Affirmation,
  DailyHabitRecord,
  DailyJournalEntry,
  DailySummary,
  FocusSession,
  Goal,
  Habit,
  ManifestationEntry,
  NoFapHistoryEntry,
  NoFapState,
  PastSelfEntry,
  PhysiqueEntry,
  UserSettings,
  WeeklyReview,
  WhyIStartedData,
} from '../types';
import {
  DEFAULT_USER_SETTINGS,
  DEFAULT_WHY_I_STARTED,
  SEED_AFFIRMATIONS,
  SEED_GOALS,
  SEED_HABITS,
} from '../data/seedData';
import {
  calculateDailyDisciplineScore,
  getLjubljanaDateString,
  isHabitScheduledForDate,
} from '../utils/dateUtils';

export interface CompleteAppState {
  schemaVersion: number;
  settings: UserSettings;
  habits: Habit[];
  dailyHabitRecords: DailyHabitRecord[];
  dailySummaries: Record<string, DailySummary>;
  nofapState: NoFapState;
  nofapHistory: NoFapHistoryEntry[];
  manifestations: ManifestationEntry[];
  affirmations: Affirmation[];
  physiqueEntries: PhysiqueEntry[];
  favoriteVerseIds: string[];
  weeklyReviews: WeeklyReview[];
  whyIStarted: WhyIStartedData;
  dailyJournals: Record<string, DailyJournalEntry>;
  focusSessions: FocusSession[];
  goals: Goal[];
  unlockedAchievements: Record<string, string>; // badgeId -> unlockedAt ISO
  pastSelfEntries?: PastSelfEntry[];
}

const STORAGE_KEY = 'GET_UP_LUKA_SQLITE_SNAPSHOT_V4';
const CURRENT_SCHEMA_VERSION = 4;
export const INITIAL_NOFAP_STREAK_SECONDS = 298 * 86400 + 22 * 3600 + 36 * 60 + 30;

let sqliteDb: any = null;

/**
 * Initializes the native SQLite database (on iOS/Android) with schema migrations,
 * and maintains a synchronized transactional store so both native SQLite queries and
 * instant cross-platform persistence work reliably.
 */
export async function initDatabase(): Promise<CompleteAppState> {
  if (Platform.OS !== 'web') {
    try {
      // Dynamic require so web/jest environments without native SQLite binary never crash
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const SQLite = require('expo-sqlite');
      if (SQLite && typeof SQLite.openDatabaseAsync === 'function') {
        sqliteDb = await SQLite.openDatabaseAsync('get_up_luka.db');
        await runSqliteMigrations(sqliteDb);
      }
    } catch {
      // Fallback to AsyncStorage-backed relational store if running in environment without native binary
    }
  }

  const loaded = await loadPersistedState();
  const ensured = ensureTodayHabitRecords(loaded, getLjubljanaDateString());
  await savePersistedState(ensured);
  return ensured;
}

async function runSqliteMigrations(db: any): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_state_store (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      schema_version INTEGER NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL,
      repeat_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS daily_habit_records (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      habit_id TEXT NOT NULL,
      completed INTEGER NOT NULL,
      payload_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_habit_records(date);
    CREATE TABLE IF NOT EXISTS daily_summaries (
      date TEXT PRIMARY KEY NOT NULL,
      discipline_score INTEGER NOT NULL,
      completion_pct INTEGER NOT NULL,
      payload_json TEXT NOT NULL
    );
  `);
}

function createInitialState(): CompleteAppState {
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const todayStr = getLjubljanaDateString();

  // Default 298 days, 22 hours, 36 minutes, 30 seconds streak start (editable anytime)
  const defaultNofapStartIso = new Date(
    nowMs - INITIAL_NOFAP_STREAK_SECONDS * 1000
  ).toISOString();

  const habits: Habit[] = SEED_HABITS.map((h) => ({
    ...h,
    createdAt: `2026-01-01T00:00:00.000Z`,
    updatedAt: nowIso,
  }));

  const goals: Goal[] = SEED_GOALS.map((g) => ({
    ...g,
    createdAt: nowIso,
  }));

  const affirmations: Affirmation[] = SEED_AFFIRMATIONS.map((a) => ({
    ...a,
    createdAt: nowIso,
  }));

  const initial: CompleteAppState = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    settings: { ...DEFAULT_USER_SETTINGS },
    habits,
    dailyHabitRecords: [],
    dailySummaries: {},
    nofapState: {
      startTimestamp: defaultNofapStartIso,
      longestStreakSeconds: INITIAL_NOFAP_STREAK_SECONDS,
      totalResets: 0,
      emergencyReasons: [
        'Moja energija, fokus in samozavest so preveč dragoceni za trenutek šibkosti.',
        'Gradim moškega, na katerega bo moj prihodnji jaz ponosen.',
        'Disciplina nad impulzi. Vsak dan.',
      ],
    },
    nofapHistory: [],
    manifestations: [
      {
        id: `manif_${todayStr}_morning`,
        date: todayStr,
        session: 'morning',
        gratefulFor: 'I am grateful for my healthy body and relentless focus.',
        alreadyHave: 'Strength, clarity, faith, and daily discipline.',
        becoming: 'I am becoming the strongest, most disciplined version of myself.',
        presentTenseStatement: 'I am disciplined and consistent. I have achieved the physique I wanted.',
        isFavorite: true,
        createdAt: `${todayStr}T07:15:00.000Z`,
        updatedAt: `${todayStr}T07:15:00.000Z`,
      },
      {
        id: `manif_${todayStr}_afternoon`,
        date: todayStr,
        session: 'afternoon',
        gratefulFor: 'I am grateful for deep work and progress on my personal projects.',
        alreadyHave: 'Momentum, high energy, and unbreakable willpower.',
        becoming: 'I am financially independent and executing on my mission.',
        presentTenseStatement: 'I am financially independent. Every day I build massive value.',
        isFavorite: false,
        createdAt: `${todayStr}T13:40:00.000Z`,
        updatedAt: `${todayStr}T13:40:00.000Z`,
      },
    ],
    affirmations,
    physiqueEntries: [
      {
        id: 'phys_initial_1',
        date: todayStr,
        weightKg: 83.4,
        waistCm: 79.5,
        bodyFatPct: 12.5,
        frontPhotoUri: '/logo.jpg',
        notes: 'Monday Check-in verified 07:45 AM — solid strength progression.',
        createdAt: `${todayStr}T07:45:00.000Z`,
      },
    ],
    favoriteVerseIds: ['verse-phil-4-13', 'verse-josh-1-9', 'verse-2tim-1-7'],
    weeklyReviews: [],
    whyIStarted: { ...DEFAULT_WHY_I_STARTED, updatedAt: nowIso },
    dailyJournals: {},
    focusSessions: [],
    goals,
    unlockedAchievements: {
      first_perfect_day: nowIso,
      nofap_30_badge: nowIso,
    },
    pastSelfEntries: [],
  };

  const withToday = ensureTodayHabitRecords(initial, todayStr);
  // Pre-check 80% of today's initial tasks so the dashboard starts at 80% Discipline (fully interactive)
  const todayRecs = withToday.dailyHabitRecords.filter((r) => r.date === todayStr);
  const targetCompleted = Math.max(1, Math.round(todayRecs.length * 0.8));
  let count = 0;
  withToday.dailyHabitRecords = withToday.dailyHabitRecords.map((r) => {
    if (r.date === todayStr && count < targetCompleted) {
      count++;
      return { ...r, completed: true, completedAt: `${todayStr}T06:30:00.000Z` };
    }
    return r;
  });
  const recalc = calculateDailyDisciplineScore(
    withToday.dailyHabitRecords.filter((r) => r.date === todayStr),
    withToday.settings.priorityWeightingEnabled
  );
  withToday.dailySummaries[todayStr] = {
    ...withToday.dailySummaries[todayStr],
    scheduledCount: recalc.scheduledCount,
    completedCount: recalc.completedCount,
    completionPct: recalc.completionPct,
    disciplineScore: recalc.disciplineScore,
  };

  return withToday;
}

/**
 * Generates snapshot DailyHabitRecords for `dateStr` from active scheduled habits
 * without ever overwriting or erasing existing historical records.
 */
export function ensureTodayHabitRecords(
  state: CompleteAppState,
  dateStr: string
): CompleteAppState {
  const existingForDate = state.dailyHabitRecords.filter((r) => r.date === dateStr);
  const existingHabitIds = new Set(existingForDate.map((r) => r.habitId));

  const newRecords: DailyHabitRecord[] = [];
  for (const habit of state.habits) {
    if (isHabitScheduledForDate(habit, dateStr) && !existingHabitIds.has(habit.id)) {
      newRecords.push({
        id: `rec_${dateStr}_${habit.id}`,
        date: dateStr,
        habitId: habit.id,
        habitTitleSnapshot: habit.title,
        habitCategorySnapshot: habit.category,
        habitPrioritySnapshot: habit.priority,
        habitIconSnapshot: habit.icon,
        habitColorSnapshot: habit.color,
        targetValueSnapshot: habit.targetValue,
        unitSnapshot: habit.unit,
        completed: false,
      });
    }
  }

  const allRecords =
    newRecords.length > 0 ? [...state.dailyHabitRecords, ...newRecords] : state.dailyHabitRecords;

  const todayRecords = allRecords.filter((r) => r.date === dateStr);
  const scoreCalc = calculateDailyDisciplineScore(
    todayRecords,
    state.settings.priorityWeightingEnabled
  );

  const prevSummary = state.dailySummaries[dateStr];
  const updatedSummary: DailySummary = {
    date: dateStr,
    scheduledCount: scoreCalc.scheduledCount,
    completedCount: scoreCalc.completedCount,
    completionPct: scoreCalc.completionPct,
    disciplineScore: scoreCalc.disciplineScore,
    notes: prevSummary?.notes ?? '',
    manualOverride: prevSummary?.manualOverride ?? false,
    updatedAt: new Date().toISOString(),
  };

  return {
    ...state,
    dailyHabitRecords: allRecords,
    dailySummaries: {
      ...state.dailySummaries,
      [dateStr]: updatedSummary,
    },
  };
}

export async function loadPersistedState(): Promise<CompleteAppState> {
  try {
    if (sqliteDb) {
      const row = await sqliteDb.getFirstAsync(
        'SELECT payload_json FROM app_state_store WHERE id = 1;'
      );
      if (row && row.payload_json) {
        const parsed = JSON.parse(row.payload_json) as CompleteAppState;
        return migrateStateIfNeeded(parsed);
      }
    }

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CompleteAppState;
      return migrateStateIfNeeded(parsed);
    }
  } catch (err) {
    console.warn('Database load fallback:', err);
  }
  return createInitialState();
}

function migrateStateIfNeeded(state: CompleteAppState): CompleteAppState {
  const migratedHabits = (state.habits || []).map((h) =>
    h.id === 'habit-gym'
      ? {
          ...h,
          repeatType: 'daily' as const,
          repeatDays: [0, 1, 2, 3, 4, 5, 6],
        }
      : h
  );

  const existingStartMs = state.nofapState?.startTimestamp
    ? new Date(state.nofapState.startTimestamp).getTime()
    : Date.now();
  const existingElapsedSec = Math.floor((Date.now() - existingStartMs) / 1000);
  const needsNofapUpgrade =
    (state.schemaVersion || 0) < 4 || existingElapsedSec < 298 * 86400;

  const targetNofapStartIso = new Date(
    Date.now() - INITIAL_NOFAP_STREAK_SECONDS * 1000
  ).toISOString();

  const migratedNofapState: NoFapState = needsNofapUpgrade
    ? {
        ...(state.nofapState || createInitialState().nofapState),
        startTimestamp: targetNofapStartIso,
        longestStreakSeconds: Math.max(
          state.nofapState?.longestStreakSeconds || 0,
          INITIAL_NOFAP_STREAK_SECONDS
        ),
      }
    : state.nofapState || createInitialState().nofapState;

  return {
    ...createInitialState(),
    ...state,
    nofapState: migratedNofapState,
    habits: migratedHabits.length > 0 ? migratedHabits : createInitialState().habits,
    settings: {
      ...DEFAULT_USER_SETTINGS,
      ...(state.settings || {}),
    },
    whyIStarted: {
      ...DEFAULT_WHY_I_STARTED,
      ...(state.whyIStarted || {}),
    },
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}

export async function savePersistedState(state: CompleteAppState): Promise<void> {
  const serialized = JSON.stringify(state);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.warn('AsyncStorage save warning:', err);
  }

  if (sqliteDb) {
    try {
      const nowIso = new Date().toISOString();
      await sqliteDb.runAsync(
        `INSERT OR REPLACE INTO app_state_store (id, schema_version, payload_json, updated_at)
         VALUES (1, ?, ?, ?);`,
        [CURRENT_SCHEMA_VERSION, serialized, nowIso]
      );
    } catch (err) {
      console.warn('SQLite sync warning:', err);
    }
  }
}
