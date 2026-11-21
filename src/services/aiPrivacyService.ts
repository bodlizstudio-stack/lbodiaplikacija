import { CompleteAppState } from '../db/database';
import { AIPrivacySettings } from '../types';
import { DEFAULT_AI_PRIVACY, EXTENDED_BIBLE_VERSES } from '../data/faithData';
import { calculateNoFapStreak, getLjubljanaDateString } from '../utils/dateUtils';

export interface AuthorizedAIContextPayload {
  sharedCategories: string[];
  todayDate: string;
  habits?: {
    totalActive: number;
    completedLast14Days: number;
    scheduledLast14Days: number;
    habitNames: string[];
    recentSummaryNotes?: string[];
  };
  goals?: { title: string; progressPct: number; targetDate: string; completed: boolean }[];
  vision?: {
    statement: string;
    lastReviewDate?: string;
  };
  workouts?: {
    totalLoggedLast14Days: number;
    recentCategories: string[];
  };
  nutrition?: {
    loggedDaysLast7Days: number;
    avgCalories: number;
    avgProteinG: number;
    todayLogged?: { calories: number; proteinG: number; carbsG: number; fatG: number };
  };
  sleepAndWellness?: {
    recentCheckInsCount: number;
    avgSleepHours?: number;
    avgEnergy?: number;
  };
  journalEntries?: { date: string; wentWell: string; feelings: string; doBetterTomorrow: string }[];
  prayerEntries?: { date: string; title: string; text: string; status: string }[];
  disciplineTracker?: {
    daysClean: number;
    longestDays: number;
  };
}

/**
 * Strictly builds only the AI context explicitly permitted by the user's independent
 * AI privacy toggles. Never leaks disabled private journal, prayer, or No Fap entries.
 */
export function buildAuthorizedAIContext(
  state: CompleteAppState,
  overridePrivacy?: Partial<AIPrivacySettings>
): AuthorizedAIContextPayload {
  const privacy: AIPrivacySettings = {
    ...DEFAULT_AI_PRIVACY,
    ...(state.settings.aiPrivacy || {}),
    ...(overridePrivacy || {}),
  };

  const today = getLjubljanaDateString(new Date(), state.settings.timezone);
  const payload: AuthorizedAIContextPayload = {
    sharedCategories: [],
    todayDate: today,
  };

  if (privacy.allowHabits) {
    payload.sharedCategories.push('habits');
    const cutoffMs = Date.now() - 14 * 86400000;
    const recentRecords = state.dailyHabitRecords.filter((r) => {
      const ms = new Date(`${r.date}T12:00:00Z`).getTime();
      return !isNaN(ms) && ms >= cutoffMs;
    });
    payload.habits = {
      totalActive: state.habits.filter((h) => !h.isPaused && !h.isArchived).length,
      completedLast14Days: recentRecords.filter((r) => r.completed).length,
      scheduledLast14Days: recentRecords.length,
      habitNames: state.habits.filter((h) => !h.isArchived).map((h) => h.title.split('/')[0].trim()),
    };
  }

  if (privacy.allowGoals) {
    payload.sharedCategories.push('goals');
    payload.goals = state.goals.map((g) => ({
      title: g.title.split('/')[0].trim(),
      progressPct: g.progressPct,
      targetDate: g.targetDate,
      completed: g.completed,
    }));
  }

  if (privacy.allowVision && (state.visionVersions?.length || state.visionDraft)) {
    payload.sharedCategories.push('vision');
    const latestVersion = state.visionVersions?.[0];
    payload.vision = {
      statement:
        latestVersion?.visionStatement || state.visionDraft?.visionStatement || '',
      lastReviewDate: state.biweeklyVisionReviews?.[0]?.date,
    };
  }

  if (privacy.allowWorkouts) {
    payload.sharedCategories.push('workouts');
    const cutoffMs = Date.now() - 14 * 86400000;
    const recentWorkouts = (state.workoutLogs || []).filter(
      (w) => new Date(`${w.date}T12:00:00Z`).getTime() >= cutoffMs
    );
    const gymDoneCount = state.dailyHabitRecords.filter(
      (r) =>
        r.completed &&
        !r.isRestDay &&
        (r.habitId === 'habit-gym' || r.habitCategorySnapshot === 'fitness') &&
        new Date(`${r.date}T12:00:00Z`).getTime() >= cutoffMs
    ).length;

    payload.workouts = {
      totalLoggedLast14Days: Math.max(recentWorkouts.length, gymDoneCount),
      recentCategories: Array.from(new Set(recentWorkouts.map((w) => w.category))),
    };
  }

  if (privacy.allowNutrition) {
    payload.sharedCategories.push('nutrition');
    const cutoffMs = Date.now() - 7 * 86400000;
    const entries = Object.values(state.nutritionEntries || {}).filter(
      (n) => new Date(`${n.date}T12:00:00Z`).getTime() >= cutoffMs
    );
    const count = entries.length;
    const avgCalories =
      count > 0 ? Math.round(entries.reduce((a, b) => a + b.calories, 0) / count) : 0;
    const avgProteinG =
      count > 0 ? Math.round(entries.reduce((a, b) => a + b.proteinG, 0) / count) : 0;
    const todayEntry = state.nutritionEntries?.[today];

    payload.nutrition = {
      loggedDaysLast7Days: count,
      avgCalories,
      avgProteinG,
      todayLogged: todayEntry
        ? {
            calories: todayEntry.calories,
            proteinG: todayEntry.proteinG,
            carbsG: todayEntry.carbsG,
            fatG: todayEntry.fatG,
          }
        : undefined,
    };
  }

  if (privacy.allowSleep) {
    payload.sharedCategories.push('sleepAndWellness');
    const checkIns = Object.values(state.dailyCheckIns || {}).slice(-7);
    const sleepList = checkIns.filter((c) => typeof c.sleepHours === 'number');
    payload.sleepAndWellness = {
      recentCheckInsCount: checkIns.length,
      avgSleepHours:
        sleepList.length > 0
          ? Number(
              (
                sleepList.reduce((acc, c) => acc + (c.sleepHours || 0), 0) /
                sleepList.length
              ).toFixed(1)
            )
          : undefined,
      avgEnergy:
        checkIns.length > 0
          ? Number(
              (
                checkIns.reduce((acc, c) => acc + c.energy, 0) / checkIns.length
              ).toFixed(1)
            )
          : undefined,
    };
  }

  // Strictly protected private data: ONLY sent if explicitly enabled
  if (privacy.allowJournal) {
    payload.sharedCategories.push('journal');
    payload.journalEntries = Object.values(state.dailyJournals)
      .filter((j) => !j.archived)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map((j) => ({
        date: j.date,
        wentWell: j.wentWell,
        feelings: j.feelings,
        doBetterTomorrow: j.doBetterTomorrow,
      }));
  }

  if (privacy.allowPrayers) {
    payload.sharedCategories.push('prayers');
    payload.prayerEntries = (state.prayerEntries || [])
      .slice(0, 5)
      .map((p) => ({
        date: p.date,
        title: p.title,
        text: p.text,
        status: p.status,
      }));
  }

  if (privacy.allowDisciplineTracker) {
    payload.sharedCategories.push('disciplineTracker');
    const live = calculateNoFapStreak(state.nofapState.startTimestamp);
    payload.disciplineTracker = {
      daysClean: live.days,
      longestDays: Math.floor(
        Math.max(state.nofapState.longestStreakSeconds, live.totalSeconds) / 86400
      ),
    };
  }

  // Reference check to avoid unused import warnings if EXTENDED_BIBLE_VERSES is imported
  void EXTENDED_BIBLE_VERSES;
  return payload;
}
