import {
  addDays,
  calculateCompletedDaysStreak,
  calculateDailyDisciplineScore,
  calculateHabitStreak,
  calculateNext14DayReminder,
  calculateNoFapStreak,
  computeWeeklyReviewStats,
  formatTransformationElapsed,
  getDailyScriptureIndex,
  getWeekBounds,
  isHabitScheduledForDate,
  shouldSendMissedTaskNotification,
} from '../src/utils/dateUtils';
import { ensureTodayHabitRecords, CompleteAppState } from '../src/db/database';
import { DEFAULT_USER_SETTINGS, DEFAULT_WHY_I_STARTED } from '../src/data/seedData';
import { parseNutritionCsv, parseNutritionJson } from '../src/services/nutritionParser';
import { buildAuthorizedAIContext } from '../src/services/aiPrivacyService';
import { DailyHabitRecord, Habit } from '../src/types';

// Mock AsyncStorage for database unit tests
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'web', select: (obj: any) => obj.default },
}));

describe('GET UP — Core Discipline Engine & Accountability Tests', () => {
  const sampleDailyHabit: Habit = {
    id: 'habit-gym',
    title: 'Go to the gym',
    description: 'Strength training',
    category: 'fitness',
    icon: 'barbell',
    priority: 'critical',
    color: '#F97316',
    repeatType: 'daily',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    isPaused: false,
    isArchived: false,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  };

  describe('1. Daily Resets & Historical Immutability', () => {
    it('does not carry yesterday completion state into today and preserves yesterday history when habits change', () => {
      const baseState: CompleteAppState = {
        schemaVersion: 2,
        settings: { ...DEFAULT_USER_SETTINGS },
        habits: [sampleDailyHabit],
        dailyHabitRecords: [],
        dailySummaries: {},
        nofapState: {
          startTimestamp: '2026-11-01T08:00:00.000Z',
          longestStreakSeconds: 0,
          totalResets: 0,
          emergencyReasons: [],
        },
        nofapHistory: [],
        manifestations: [],
        affirmations: [],
        physiqueEntries: [],
        favoriteVerseIds: [],
        weeklyReviews: [],
        whyIStarted: { ...DEFAULT_WHY_I_STARTED },
        dailyJournals: {},
        focusSessions: [],
        goals: [],
        unlockedAchievements: {},
      };

      // Day 1: 2026-11-08
      const day1State = ensureTodayHabitRecords(baseState, '2026-11-08');
      expect(day1State.dailyHabitRecords).toHaveLength(1);
      expect(day1State.dailyHabitRecords[0].completed).toBe(false);

      // Mark Day 1 habit completed
      day1State.dailyHabitRecords[0].completed = true;
      day1State.dailySummaries['2026-11-08'].completedCount = 1;
      day1State.dailySummaries['2026-11-08'].completionPct = 100;
      day1State.dailySummaries['2026-11-08'].disciplineScore = 100;

      // Day 2: 2026-11-09 (Daily Reset)
      const day2State = ensureTodayHabitRecords(day1State, '2026-11-09');
      const day1Rec = day2State.dailyHabitRecords.find((r) => r.date === '2026-11-08');
      const day2Rec = day2State.dailyHabitRecords.find((r) => r.date === '2026-11-09');

      expect(day1Rec?.completed).toBe(true);
      expect(day2Rec?.completed).toBe(false);
      expect(day2State.dailySummaries['2026-11-09'].completedCount).toBe(0);

      // Rename the habit on Day 2 — Day 1 snapshot title must remain intact
      day2State.habits[0] = {
        ...day2State.habits[0],
        title: 'Modified Gym Routine',
      };
      expect(day1Rec?.habitTitleSnapshot).toBe('Go to the gym');
    });
  });

  describe('2. Recurring Schedules & DST-Safe Date Math', () => {
    it('correctly schedules daily, weekday-specific, one-time, and paused habits', () => {
      // 2026-11-09 is a Monday (dow = 1)
      expect(isHabitScheduledForDate(sampleDailyHabit, '2026-11-09')).toBe(true);

      const mwfHabit: Habit = {
        ...sampleDailyHabit,
        id: 'mwf',
        repeatType: 'weekdays',
        repeatDays: [1, 3, 5], // Mon, Wed, Fri
      };
      expect(isHabitScheduledForDate(mwfHabit, '2026-11-09')).toBe(true); // Monday
      expect(isHabitScheduledForDate(mwfHabit, '2026-11-10')).toBe(false); // Tuesday

      const oneTimeHabit: Habit = {
        ...sampleDailyHabit,
        id: 'onetime',
        repeatType: 'one_time',
        targetDate: '2026-11-12',
      };
      expect(isHabitScheduledForDate(oneTimeHabit, '2026-11-12')).toBe(true);
      expect(isHabitScheduledForDate(oneTimeHabit, '2026-11-13')).toBe(false);

      const pausedHabit: Habit = {
        ...sampleDailyHabit,
        isPaused: true,
      };
      expect(isHabitScheduledForDate(pausedHabit, '2026-11-09')).toBe(false);
    });

    it('calculates Monday-to-Sunday week bounds accurately', () => {
      // 2026-11-09 is Monday
      const bounds = getWeekBounds('2026-11-09');
      expect(bounds.weekStart).toBe('2026-11-09');
      expect(bounds.weekEnd).toBe('2026-11-15');

      // 2026-11-15 is Sunday of the same week
      const sunBounds = getWeekBounds('2026-11-15');
      expect(sunBounds.weekStart).toBe('2026-11-09');
      expect(sunBounds.weekEnd).toBe('2026-11-15');
    });
  });

  describe('3. Streak Calculations (No Fap & Completed Days Streak)', () => {
    it('calculates live No Fap days, hours, minutes, and seconds accurately', () => {
      const startIso = '2026-11-01T00:00:00.000Z';
      // 8 days, 3 hours, 15 minutes, 42 seconds later
      const deltaMs = (8 * 86400 + 3 * 3600 + 15 * 60 + 42) * 1000;
      const nowMs = new Date(startIso).getTime() + deltaMs;

      const streak = calculateNoFapStreak(startIso, nowMs);
      expect(streak.days).toBe(8);
      expect(streak.hours).toBe(3);
      expect(streak.minutes).toBe(15);
      expect(streak.seconds).toBe(42);
    });

    it('calculates consecutive completed days streak and steps over 0-task rest days', () => {
      const summaries = {
        '2026-11-05': { scheduledCount: 5, completedCount: 5 },
        '2026-11-06': { scheduledCount: 5, completedCount: 5 },
        '2026-11-07': { scheduledCount: 0, completedCount: 0 }, // Rest day
        '2026-11-08': { scheduledCount: 4, completedCount: 4 },
        '2026-11-09': { scheduledCount: 4, completedCount: 2 }, // Today in progress
      };
      // Streak should count Nov 8, Nov 6, Nov 5 = 3 days
      expect(calculateCompletedDaysStreak(summaries, '2026-11-09')).toBe(3);

      // Once today is completed, streak becomes 4
      summaries['2026-11-09'].completedCount = 4;
      expect(calculateCompletedDaysStreak(summaries, '2026-11-09')).toBe(4);
    });
  });

  describe('4. Discipline Score & Weekly Review Summaries', () => {
    it('computes unweighted and priority-weighted discipline scores and handles 0-task rest days', () => {
      const restScore = calculateDailyDisciplineScore([], false);
      expect(restScore.disciplineScore).toBe(100);

      const records: Pick<DailyHabitRecord, 'completed' | 'habitPrioritySnapshot'>[] = [
        { completed: true, habitPrioritySnapshot: 'critical' }, // weight 2.0
        { completed: false, habitPrioritySnapshot: 'low' },     // weight 0.75
      ];
      const unweighted = calculateDailyDisciplineScore(records, false);
      expect(unweighted.completionPct).toBe(50);
      expect(unweighted.disciplineScore).toBe(50);

      const weighted = calculateDailyDisciplineScore(records, true);
      // 2.0 / 2.75 = 72.72% -> 73%
      expect(weighted.disciplineScore).toBe(73);
    });

    it('computes weekly review automatic statistics accurately', () => {
      const records: DailyHabitRecord[] = [
        {
          id: '1',
          date: '2026-11-09',
          habitId: 'h1',
          habitTitleSnapshot: 'Gym',
          habitCategorySnapshot: 'fitness',
          habitPrioritySnapshot: 'critical',
          habitIconSnapshot: 'barbell',
          habitColorSnapshot: '#F97316',
          completed: true,
        },
        {
          id: '2',
          date: '2026-11-09',
          habitId: 'h2',
          habitTitleSnapshot: 'Study',
          habitCategorySnapshot: 'study',
          habitPrioritySnapshot: 'high',
          habitIconSnapshot: 'school',
          habitColorSnapshot: '#A855F7',
          completed: false,
        },
      ];

      const stats = computeWeeklyReviewStats(
        '2026-11-09',
        '2026-11-15',
        records,
        [
          {
            date: '2026-11-09',
            scheduledCount: 2,
            completedCount: 1,
            completionPct: 50,
            disciplineScore: 50,
            notes: '',
            updatedAt: '',
          },
        ],
        [
          {
            id: 'm1',
            date: '2026-11-09',
            session: 'morning',
            gratefulFor: 'Health',
            alreadyHave: 'Strength',
            becoming: 'Relentless',
            presentTenseStatement: 'I am strong',
            isFavorite: false,
            createdAt: '',
            updatedAt: '',
          },
        ],
        []
      );

      expect(stats.completedHabits).toBe(1);
      expect(stats.totalScheduledHabits).toBe(2);
      expect(stats.weeklyCompletionPct).toBe(50);
      expect(stats.mostConsistentHabit).toBe('Gym');
      expect(stats.mostMissedHabit).toBe('Study');
      expect(stats.manifestationSessionsCount).toBe(1);
      expect(stats.physiquePhotoTaken).toBe(false);
    });
  });

  describe('5. Missed-Task Accountability Detection', () => {
    it('triggers only when yesterday had unfinished scheduled tasks and has not already been notified', () => {
      // Unfinished tasks yesterday -> true
      expect(
        shouldSendMissedTaskNotification(
          { scheduledCount: 8, completedCount: 6 },
          undefined,
          '2026-11-08'
        )
      ).toBe(true);

      // Duplicate check -> false
      expect(
        shouldSendMissedTaskNotification(
          { scheduledCount: 8, completedCount: 6 },
          '2026-11-08',
          '2026-11-08'
        )
      ).toBe(false);

      // 100% completed day -> false
      expect(
        shouldSendMissedTaskNotification(
          { scheduledCount: 8, completedCount: 8 },
          undefined,
          '2026-11-08'
        )
      ).toBe(false);

      // Rest day with 0 scheduled tasks -> false
      expect(
        shouldSendMissedTaskNotification(
          { scheduledCount: 0, completedCount: 0 },
          undefined,
          '2026-11-08'
        )
      ).toBe(false);
    });

    it('formats transformation elapsed weeks and days accurately', () => {
      expect(
        formatTransformationElapsed('2026-08-17', '2026-11-09', 'en')
      ).toBe('Transformation — 12 weeks (84 days)');
    });
  });

  describe('6. LBODI 2.0 — Faith, 14-Day Vision, Scheduled Habit Streaks, Nutrition & AI Privacy', () => {
    it('returns deterministic Scripture index for a given date without shifting on reload', () => {
      const idxA = getDailyScriptureIndex('2026-11-21', 31);
      const idxB = getDailyScriptureIndex('2026-11-21', 31);
      const nextDay = getDailyScriptureIndex('2026-11-22', 31);
      expect(idxA).toBe(idxB);
      expect(nextDay).not.toBe(idxA);
    });

    it('calculates exact 14-calendar-day intervals safely across DST transitions', () => {
      // Anchor right before European spring-forward DST (2026-03-20 + 14d = 2026-04-03)
      const res1 = calculateNext14DayReminder('2026-03-20', '2026-03-25');
      expect(res1.nextDate).toBe('2026-04-03');
      expect(res1.daysUntil).toBe(9);
      expect(res1.isDueToday).toBe(false);

      // Exact 14-day mark
      const due = calculateNext14DayReminder('2026-03-20', '2026-04-03');
      expect(due.isDueToday).toBe(true);
      expect(due.daysUntil).toBe(0);
      expect(due.cycleNumber).toBe(1);
    });

    it('computes per-habit streak without penalizing unscheduled days', () => {
      const mwfHabit: Habit = {
        ...sampleDailyHabit,
        id: 'habit-mwf',
        repeatType: 'weekdays',
        repeatDays: [1, 3, 5], // Mon, Wed, Fri
        createdAt: '2026-11-01T00:00:00.000Z',
      };
      // Mon 2026-11-09, Wed 2026-11-11, Fri 2026-11-13 completed; Tue & Thu intentionally omitted
      const recs: DailyHabitRecord[] = ['2026-11-09', '2026-11-11', '2026-11-13'].map((d) => ({
        id: `rec_${d}`,
        date: d,
        habitId: 'habit-mwf',
        habitTitleSnapshot: 'MWF Gym',
        habitCategorySnapshot: 'fitness',
        habitPrioritySnapshot: 'high',
        habitIconSnapshot: 'barbell',
        habitColorSnapshot: '#C7A76C',
        completed: true,
      }));
      const streak = calculateHabitStreak(mwfHabit, recs, '2026-11-13');
      expect(streak.current).toBe(3);
      expect(streak.longest).toBe(3);
    });

    it('parses CSV & JSON nutrition exports and flags duplicate existing dates', () => {
      const existing = {
        '2026-11-20': {
          date: '2026-11-20',
          calories: 2400,
          proteinG: 170,
          carbsG: 250,
          fatG: 70,
          source: 'manual' as const,
          updatedAt: '',
        },
      };
      const csv = 'date,calories,protein,carbs,fat\n2026-11-20,2500,180,260,75\n2026-11-21,2350,175,230,68';
      const parsedCsv = parseNutritionCsv(csv, existing);
      expect(parsedCsv.rows).toHaveLength(2);
      const dupRow = parsedCsv.rows.find((r) => r.date === '2026-11-20');
      const newRow = parsedCsv.rows.find((r) => r.date === '2026-11-21');
      expect(dupRow?.isDuplicate).toBe(true);
      expect(dupRow?.include).toBe(false);
      expect(newRow?.isDuplicate).toBe(false);
      expect(newRow?.calories).toBe(2350);

      const json = JSON.stringify([{ date: '2026-11-19', kcal: 2200, protein: 165, carbs: 210, fat: 65 }]);
      const parsedJson = parseNutritionJson(json, existing);
      expect(parsedJson.rows).toHaveLength(1);
      expect(parsedJson.rows[0].proteinG).toBe(165);
    });

    it('enforces AI privacy toggles and excludes sensitive private records by default', () => {
      const stateWithPrivateData: CompleteAppState = {
        schemaVersion: 5,
        settings: { ...DEFAULT_USER_SETTINGS },
        habits: [sampleDailyHabit],
        dailyHabitRecords: [],
        dailySummaries: {},
        nofapState: {
          startTimestamp: '2026-01-01T00:00:00.000Z',
          longestStreakSeconds: 999999,
          totalResets: 0,
          emergencyReasons: [],
        },
        nofapHistory: [],
        manifestations: [],
        affirmations: [],
        physiqueEntries: [],
        favoriteVerseIds: [],
        weeklyReviews: [],
        whyIStarted: { ...DEFAULT_WHY_I_STARTED },
        dailyJournals: {
          '2026-11-21': {
            date: '2026-11-21',
            wentWell: 'Top secret reflection',
            wentWrong: '',
            doBetterTomorrow: '',
            feelings: 'Private',
            gratitude: 'Family',
            moodRating: 5,
            energyRating: 5,
            updatedAt: '',
          },
        },
        prayerEntries: [
          {
            id: 'p1',
            title: 'Private prayer',
            text: 'Lord guide me privately',
            date: '2026-11-21',
            category: 'guidance',
            status: 'in_prayer',
            createdAt: '',
            updatedAt: '',
          },
        ],
        focusSessions: [],
        goals: [],
        unlockedAchievements: {},
      };

      const defaultCtx = buildAuthorizedAIContext(stateWithPrivateData);
      expect(defaultCtx.journalEntries).toBeUndefined();
      expect(defaultCtx.prayerEntries).toBeUndefined();
      expect(defaultCtx.disciplineTracker).toBeUndefined();

      const explicitCtx = buildAuthorizedAIContext(stateWithPrivateData, {
        allowJournal: true,
        allowPrayers: true,
      });
      expect(explicitCtx.journalEntries).toHaveLength(1);
      expect(explicitCtx.prayerEntries).toHaveLength(1);
    });
  });
});
