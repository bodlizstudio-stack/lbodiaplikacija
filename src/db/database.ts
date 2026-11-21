import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AIConversation,
  Affirmation,
  BiweeklyVisionReview,
  DailyCheckIn,
  DailyHabitRecord,
  DailyJournalEntry,
  DailyReflectionEntry,
  DailySummary,
  FocusSession,
  Goal,
  GratitudeEntry,
  Habit,
  IdealDayPlan,
  InAppNotificationItem,
  LifestyleVisionSections,
  LifestyleVisionVersion,
  ManifestationEntry,
  NoFapHistoryEntry,
  NoFapState,
  NutritionEntry,
  NutritionImportRecord,
  PastSelfEntry,
  PhysiqueEntry,
  PrayerEntry,
  UserSettings,
  WeeklyReview,
  WhyIStartedData,
  WorkoutLog,
} from '../types';
import {
  DEFAULT_USER_SETTINGS,
  DEFAULT_WHY_I_STARTED,
  SEED_AFFIRMATIONS,
  SEED_GOALS,
  SEED_HABITS,
} from '../data/seedData';
import {
  DEFAULT_AI_PRIVACY,
  DEFAULT_DASHBOARD_SECTIONS,
  DEFAULT_DISCIPLINE_PRIVACY,
  DEFAULT_NUTRITION_TARGETS,
  REMINDER_MESSAGE_LIBRARY,
  createDefaultReminderConfigs,
} from '../data/faithData';
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

  // LBODI 2.0 collections
  gratitudeEntries?: GratitudeEntry[];
  prayerEntries?: PrayerEntry[];
  bibleReadingProgress?: Record<string, number[]>; // planId -> completed day numbers
  verseNotes?: Record<string, string>; // verseId -> personal reflection note
  dailyReflections?: Record<string, DailyReflectionEntry>;
  visionDraft?: {
    sections: LifestyleVisionSections;
    idealDay: IdealDayPlan;
    visionStatement: string;
    updatedAt: string;
  };
  visionVersions?: LifestyleVisionVersion[];
  biweeklyVisionReviews?: BiweeklyVisionReview[];
  workoutLogs?: WorkoutLog[];
  dailyCheckIns?: Record<string, DailyCheckIn>;
  nutritionEntries?: Record<string, NutritionEntry>;
  nutritionImports?: NutritionImportRecord[];
  aiConversations?: AIConversation[];
  inAppNotifications?: InAppNotificationItem[];
}

const STORAGE_KEY = 'GET_UP_LUKA_SQLITE_SNAPSHOT_V4';
const CURRENT_SCHEMA_VERSION = 5;
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
    gratitudeEntries: [
      {
        id: `grat_${todayStr}_seed`,
        date: todayStr,
        mainText:
          'Hvaležen sem Bogu za nov dan, zdravje, družino in milost, da lahko vsako jutro začnem znova.',
        threeBlessings: [
          'Mirno jutro in jasne misli',
          'Zdravo telo za delo in trening',
          'Priložnost za duhovno in osebno rast',
        ],
        dailyPrayer:
          'Gospod Jezus, hvala Ti za Tvojo zvestobo. Vodi me danes v ponižnosti, ljubezni in disciplini.',
        category: 'faith',
        isFavorite: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ],
    prayerEntries: [
      {
        id: 'prayer_seed_1',
        title: 'Jutranja izročitev dneva',
        text: 'Gospod Jezus Kristus, izročam Ti svoje misli, delo in odnose. Pomagaj mi hoditi po Tvoji besedi z ljubeznijo, ponižnostjo in zbranostjo.',
        date: todayStr,
        category: 'guidance',
        status: 'in_prayer',
        reflection: 'Molitev za jasnost in notranji mir.',
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ],
    bibleReadingProgress: {},
    verseNotes: {},
    dailyReflections: {},
    visionDraft: {
      sections: {
        faith:
          'Želim imeti iskren, vsakodneven odnos z Jezusom Kristusom skozi jutranjo molitev, branje Svetega pisma in ponižno služenje bližnjim.',
        bodyHealth:
          'Želim skrbeti za svoje telo kot za darilo: redni treningi moči, kakovosten spanec, čista prehrana in stabilna energija brez skrajnosti.',
        discipline:
          'Zvestoba majhnim dnevnim obveznostim, čistost uma, manj nepotrebnega časa pred zasloni in mirna samokontrola v vsakem trenutku.',
        workPurpose:
          'Pošteno, predano delo z dodano vrednostjo, nenehno učenje ter finančna urejenost, ki služi družini in dobrim namenom.',
        relationships:
          'Več potrpežljivosti, poslušanja, odpuščanja in konkretne prijaznosti do družine, prijateljev in sodelavcev.',
        personalIdentity:
          'Moški vere, miru, resnicoljubnosti in vztrajnosti, ki ne išče vrednosti v zunanjem aplavzu, temveč v zvestobi Kristusu.',
      },
      idealDay: {
        morning: 'Zgodnje vstajanje, jutranja molitev, branje Svetega pisma in hvaležnost.',
        workStudy: '2 bloka globokega dela ali študija brez motenj telefona.',
        fitness: 'Trening moči ali hiter sprehod na svežem zraku ter gibanje čez dan.',
        meals: 'Zmerni, polnovredni obroki z dovolj beljakovinami in čiste vode.',
        prayer: 'Kratka opoldanska ustavitev z Bogom ter iskrena večerna molitev.',
        evening: 'Pregled dneva, zapis treh blagoslovov in priprava na jutrišnji dan.',
        sleep: 'Miren odhod v posteljo brez zaslonov vsaj 30 minut pred spanjem.',
      },
      visionStatement:
        'Vsak dan hodim bližje Jezusu Kristusu, odgovorno skrbim za svoje telo in čas ter z vztrajnostjo, ponižnostjo in ljubeznijo gradim mirno, osmišljeno življenje.',
      updatedAt: nowIso,
    },
    visionVersions: [
      {
        id: 'vision_v1',
        versionNumber: 1,
        sections: {
          faith:
            'Želim imeti iskren, vsakodneven odnos z Jezusom Kristusom skozi jutranjo molitev, branje Svetega pisma in ponižno služenje bližnjim.',
          bodyHealth:
            'Želim skrbeti za svoje telo kot za darilo: redni treningi moči, kakovosten spanec, čista prehrana in stabilna energija.',
          discipline:
            'Zvestoba majhnim dnevnim obveznostim, čistost uma in mirna samokontrola.',
          workPurpose:
            'Pošteno, predano delo in finančna urejenost, ki služi dobrim namenom.',
          relationships:
            'Potrpežljivost, odpuščanje in prijaznost do družine ter prijateljev.',
          personalIdentity:
            'Moški vere, miru in zvestobe Kristusu.',
        },
        idealDay: {
          morning: 'Jutranja molitev, Sveto pismo in miren začetek dneva.',
          workStudy: 'Zbrano delo brez nepotrebnih motenj.',
          fitness: 'Trening moči ali aktiven sprehod.',
          meals: 'Polnovredna prehrana in voda.',
          prayer: 'Kratka molitev sredi dneva in zvečer.',
          evening: 'Zapis hvaležnosti Gospodu.',
          sleep: '7,5–8 ur kakovostnega spanca.',
        },
        visionStatement:
          'Vsak dan hodim bližje Jezusu Kristusu, odgovorno skrbim za svoje telo in čas ter gradim mirno, disciplinirano in ljubeče življenje.',
        isDraft: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ],
    biweeklyVisionReviews: [],
    workoutLogs: [],
    dailyCheckIns: {},
    nutritionEntries: {},
    nutritionImports: [],
    aiConversations: [],
    inAppNotifications: [],
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
  const base = createInitialState();
  const migratedHabits = (state.habits || []).map((h) =>
    h.id === 'habit-gym'
      ? {
          ...h,
          repeatType: 'daily' as const,
          repeatDays: [0, 1, 2, 3, 4, 5, 6],
        }
      : h
  );

  const needsNofapUpgrade =
    (state.schemaVersion || 0) < 4 && (state.nofapState?.totalResets || 0) === 0;

  const targetNofapStartIso = new Date(
    Date.now() - INITIAL_NOFAP_STREAK_SECONDS * 1000
  ).toISOString();

  const migratedNofapState: NoFapState = needsNofapUpgrade
    ? {
        ...(state.nofapState || base.nofapState),
        startTimestamp: targetNofapStartIso,
        longestStreakSeconds: Math.max(
          state.nofapState?.longestStreakSeconds || 0,
          INITIAL_NOFAP_STREAK_SECONDS
        ),
      }
    : state.nofapState || base.nofapState;

  const todayStr = getLjubljanaDateString();

  return {
    ...base,
    ...state,
    nofapState: migratedNofapState,
    habits: migratedHabits.length > 0 ? migratedHabits : base.habits,
    settings: {
      ...DEFAULT_USER_SETTINGS,
      ...(state.settings || {}),
      themeMode: state.settings?.themeMode || 'dark',
      timezone: state.settings?.timezone || 'Europe/Ljubljana',
      dashboardSections:
        state.settings?.dashboardSections && state.settings.dashboardSections.length > 0
          ? state.settings.dashboardSections
          : DEFAULT_DASHBOARD_SECTIONS,
      disciplinePrivacy: {
        ...DEFAULT_DISCIPLINE_PRIVACY,
        ...(state.settings?.disciplinePrivacy || {}),
      },
      nutritionTargets: {
        ...DEFAULT_NUTRITION_TARGETS,
        ...(state.settings?.nutritionTargets || {}),
      },
      aiPrivacy: {
        ...DEFAULT_AI_PRIVACY,
        ...(state.settings?.aiPrivacy || {}),
      },
      reminderConfigs:
        state.settings?.reminderConfigs && state.settings.reminderConfigs.length > 0
          ? state.settings.reminderConfigs
          : createDefaultReminderConfigs(
              state.settings?.timezone || 'Europe/Ljubljana',
              state.settings?.visionReminderAnchorDate || todayStr
            ),
      customReminders:
        state.settings?.customReminders && state.settings.customReminders.length > 0
          ? state.settings.customReminders
          : REMINDER_MESSAGE_LIBRARY,
      visionReminderTime: state.settings?.visionReminderTime || '19:00',
    },
    whyIStarted: {
      ...DEFAULT_WHY_I_STARTED,
      ...(state.whyIStarted || {}),
    },
    gratitudeEntries: state.gratitudeEntries ?? base.gratitudeEntries,
    prayerEntries: state.prayerEntries ?? base.prayerEntries,
    bibleReadingProgress: state.bibleReadingProgress ?? {},
    verseNotes: state.verseNotes ?? {},
    dailyReflections: state.dailyReflections ?? {},
    visionDraft: state.visionDraft ?? base.visionDraft,
    visionVersions:
      state.visionVersions && state.visionVersions.length > 0
        ? state.visionVersions
        : base.visionVersions,
    biweeklyVisionReviews: state.biweeklyVisionReviews ?? [],
    workoutLogs: state.workoutLogs ?? [],
    dailyCheckIns: state.dailyCheckIns ?? {},
    nutritionEntries: state.nutritionEntries ?? {},
    nutritionImports: state.nutritionImports ?? [],
    aiConversations: state.aiConversations ?? [],
    inAppNotifications: state.inAppNotifications ?? [],
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
