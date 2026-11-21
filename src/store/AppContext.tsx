import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  Affirmation,
  DailyHabitRecord,
  DailyJournalEntry,
  DailySummary,
  FocusSession,
  Goal,
  Habit,
  ManifestationEntry,
  ManifestationSessionType,
  NoFapHistoryEntry,
  PastSelfEntry,
  PhysiqueEntry,
  UserSettings,
  WeeklyReview,
  WhyIStartedData,
} from '../types';
import {
  CompleteAppState,
  INITIAL_NOFAP_STREAK_SECONDS,
  ensureTodayHabitRecords,
  initDatabase,
  savePersistedState,
} from '../db/database';
import {
  calculateCompletedDaysStreak,
  calculateDailyDisciplineScore,
  calculateNoFapStreak,
  getLjubljanaDateString,
  getWeekBounds,
} from '../utils/dateUtils';
import { syncAllNotifications } from '../services/notificationService';
import { TranslationKey, t } from '../i18n/translations';

interface AppContextValue {
  isReady: boolean;
  isLocked: boolean;
  unlockApp: () => void;
  lockApp: () => void;
  todayDateStr: string;
  state: CompleteAppState;
  tr: (key: TranslationKey) => string;

  // Settings & Onboarding
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  completeOnboarding: (payload: {
    reasons?: string;
    startingWeightKg?: number;
    goalWeightKg?: number;
    nofapStartIso?: string;
  }) => Promise<void>;
  replaceFullState: (newState: CompleteAppState) => Promise<void>;

  // Habits & Daily Checklist
  toggleHabitCompletion: (dateStr: string, habitId: string, notes?: string) => Promise<void>;
  toggleGymRestDay: (
    dateStr: string,
    habitId: string
  ) => Promise<{ ok: boolean; usedThisWeek: number; maxPerWeek: number }>;
  getGymRestDaysUsedThisWeek: (dateStr: string) => number;
  saveHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  togglePauseHabit: (habitId: string) => Promise<void>;
  updateDailySummaryNotes: (dateStr: string, notes: string) => Promise<void>;
  ensureDateRecords: (dateStr: string) => Promise<void>;

  // No Fap Streak
  setNoFapStartDate: (isoString: string) => Promise<void>;
  resetNoFapStreak: (reason: string) => Promise<void>;
  updateEmergencyReasons: (reasons: string[]) => Promise<void>;

  // Manifestation & Affirmations
  saveManifestationEntry: (
    dateStr: string,
    session: ManifestationSessionType,
    data: {
      gratefulFor: string;
      alreadyHave: string;
      becoming: string;
      presentTenseStatement: string;
      isFavorite?: boolean;
    }
  ) => Promise<void>;
  toggleManifestationFavorite: (entryId: string) => Promise<void>;
  deleteManifestationEntry: (entryId: string) => Promise<void>;
  addAffirmation: (text: string, category?: string) => Promise<void>;
  deleteAffirmation: (id: string) => Promise<void>;

  // Physique Progress
  savePhysiqueEntry: (entry: Omit<PhysiqueEntry, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  deletePhysiqueEntry: (id: string) => Promise<void>;

  // Bible Verses
  toggleFavoriteVerse: (verseId: string) => Promise<void>;

  // Weekly Review
  submitWeeklyReview: (
    review: Omit<WeeklyReview, 'id' | 'createdAt'>
  ) => Promise<void>;
  deleteWeeklyReview: (id: string) => Promise<void>;

  // Why I Started
  updateWhyIStarted: (partial: Partial<WhyIStartedData>) => Promise<void>;

  // Daily Journal
  saveDailyJournal: (entry: Omit<DailyJournalEntry, 'updatedAt'>) => Promise<void>;

  // Focus Mode
  recordFocusSession: (durationMinutes: number) => Promise<void>;

  // Goals
  saveGoal: (goal: Omit<Goal, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  toggleGoalMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;

  // Past Self Vault ("Poglej, kakšen si bil včasih")
  savePastSelfEntry: (
    entry: Omit<PastSelfEntry, 'id' | 'createdAt'> & { id?: string }
  ) => Promise<void>;
  deletePastSelfEntry: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function evaluateAchievements(state: CompleteAppState, todayStr: string): Record<string, string> {
  const unlocked = { ...state.unlockedAchievements };
  const nowIso = new Date().toISOString();

  const summaries = Object.values(state.dailySummaries);
  const hasPerfectDay = summaries.some(
    (s) => s.scheduledCount > 0 && s.completedCount >= s.scheduledCount
  );
  if (hasPerfectDay && !unlocked.first_perfect_day) {
    unlocked.first_perfect_day = nowIso;
  }

  const streak = calculateCompletedDaysStreak(state.dailySummaries, todayStr);
  if (streak >= 7 && !unlocked.consistency_7) {
    unlocked.consistency_7 = nowIso;
  }

  const activeDaysCount = summaries.filter((s) => s.completedCount > 0).length;
  if (activeDaysCount >= 30 && !unlocked.progress_30) {
    unlocked.progress_30 = nowIso;
  }
  if (activeDaysCount >= 365 && !unlocked.year_one) {
    unlocked.year_one = nowIso;
  }

  const totalCompletedHabits = state.dailyHabitRecords.filter((r) => r.completed).length;
  if (totalCompletedHabits >= 100 && !unlocked.habits_100) {
    unlocked.habits_100 = nowIso;
  }

  if (state.weeklyReviews.length >= 1 && !unlocked.first_weekly_review) {
    unlocked.first_weekly_review = nowIso;
  }

  const nofap = calculateNoFapStreak(state.nofapState.startTimestamp);
  if (nofap.days >= 30 && !unlocked.nofap_30_badge) {
    unlocked.nofap_30_badge = nowIso;
  }

  const completedFocus = state.focusSessions.filter((f) => f.completed).length;
  if (completedFocus >= 5 && !unlocked.focus_master) {
    unlocked.focus_master = nowIso;
  }

  return unlocked;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [todayDateStr, setTodayDateStr] = useState<string>(getLjubljanaDateString());
  const [state, setState] = useState<CompleteAppState | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const initial = await initDatabase();
      if (!mounted) return;
      const withBadges = {
        ...initial,
        unlockedAchievements: evaluateAchievements(initial, getLjubljanaDateString()),
      };
      setState(withBadges);
      if (withBadges.settings.pinLockEnabled || withBadges.settings.biometricEnabled) {
        setIsLocked(true);
      }
      setIsReady(true);

      // Sync OS notifications in background
      syncAllNotifications(withBadges.settings, withBadges.dailySummaries, (notifiedYesterday) => {
        setState((prev) => {
          if (!prev) return prev;
          const next = {
            ...prev,
            settings: {
              ...prev.settings,
              lastMissedNotificationDate: notifiedYesterday,
            },
          };
          savePersistedState(next);
          return next;
        });
      });
    })();

    // Check every minute if midnight passed in Europe/Ljubljana
    const dayWatcher = setInterval(() => {
      const currentDay = getLjubljanaDateString();
      setTodayDateStr((prevDay) => {
        if (prevDay !== currentDay) {
          setState((prevState) => {
            if (!prevState) return prevState;
            const updated = ensureTodayHabitRecords(prevState, currentDay);
            savePersistedState(updated);
            return updated;
          });
        }
        return currentDay;
      });
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(dayWatcher);
    };
  }, []);

  // Ensure the 298d 22h 36m 30s baseline is applied immediately even across hot-reloads
  useEffect(() => {
    if (!state) return;
    const calc = calculateNoFapStreak(state.nofapState.startTimestamp);
    if (calc.days < 298 && state.nofapState.totalResets === 0) {
      const targetIso = new Date(
        Date.now() - INITIAL_NOFAP_STREAK_SECONDS * 1000
      ).toISOString();
      setState((prev) => {
        if (!prev) return prev;
        const next: CompleteAppState = {
          ...prev,
          nofapState: {
            ...prev.nofapState,
            startTimestamp: targetIso,
            longestStreakSeconds: Math.max(
              prev.nofapState.longestStreakSeconds,
              INITIAL_NOFAP_STREAK_SECONDS
            ),
          },
        };
        savePersistedState(next);
        return next;
      });
    }
  }, [state?.nofapState.startTimestamp, state?.nofapState.totalResets]);

  const persistAndSet = useCallback(async (updater: (prev: CompleteAppState) => CompleteAppState) => {
    setState((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      const currentDay = getLjubljanaDateString();
      const withBadges: CompleteAppState = {
        ...updated,
        unlockedAchievements: evaluateAchievements(updated, currentDay),
      };
      savePersistedState(withBadges);
      return withBadges;
    });
  }, []);

  const tr = useCallback(
    (key: TranslationKey): string => {
      const lang = state?.settings.language || 'sl';
      return t(lang, key);
    },
    [state?.settings.language]
  );

  const updateSettings = useCallback(
    async (partial: Partial<UserSettings>) => {
      await persistAndSet((prev) => {
        const nextSettings = { ...prev.settings, ...partial };
        const nextState = ensureTodayHabitRecords(
          { ...prev, settings: nextSettings },
          getLjubljanaDateString()
        );
        syncAllNotifications(nextSettings, nextState.dailySummaries);
        return nextState;
      });
    },
    [persistAndSet]
  );

  const completeOnboarding = useCallback(
    async (payload: {
      reasons?: string;
      startingWeightKg?: number;
      goalWeightKg?: number;
      nofapStartIso?: string;
    }) => {
      await persistAndSet((prev) => {
        const nowIso = new Date().toISOString();
        const nextSettings: UserSettings = {
          ...prev.settings,
          onboardingCompleted: true,
          startingWeightKg: payload.startingWeightKg ?? prev.settings.startingWeightKg,
          goalWeightKg: payload.goalWeightKg ?? prev.settings.goalWeightKg,
        };
        const nextWhy: WhyIStartedData = payload.reasons
          ? {
              ...prev.whyIStarted,
              disciplineReasons: payload.reasons,
              updatedAt: nowIso,
            }
          : prev.whyIStarted;
        const nextNofap = payload.nofapStartIso
          ? { ...prev.nofapState, startTimestamp: payload.nofapStartIso }
          : prev.nofapState;

        const nextState: CompleteAppState = {
          ...prev,
          settings: nextSettings,
          whyIStarted: nextWhy,
          nofapState: nextNofap,
        };
        syncAllNotifications(nextSettings, nextState.dailySummaries);
        return nextState;
      });
    },
    [persistAndSet]
  );

  const replaceFullState = useCallback(
    async (newState: CompleteAppState) => {
      await persistAndSet(() => ensureTodayHabitRecords(newState, getLjubljanaDateString()));
    },
    [persistAndSet]
  );

  const ensureDateRecords = useCallback(
    async (dateStr: string) => {
      await persistAndSet((prev) => ensureTodayHabitRecords(prev, dateStr));
    },
    [persistAndSet]
  );

  const toggleHabitCompletion = useCallback(
    async (dateStr: string, habitId: string, notes?: string) => {
      await persistAndSet((prev) => {
        const ensured = ensureTodayHabitRecords(prev, dateStr);
        const nowIso = new Date().toISOString();

        const updatedRecords = ensured.dailyHabitRecords.map((r) => {
          if (r.date === dateStr && r.habitId === habitId) {
            const nextCompleted = !r.completed;
            return {
              ...r,
              completed: nextCompleted,
              isRestDay: false,
              completedAt: nextCompleted ? nowIso : undefined,
              notes: notes !== undefined ? notes : r.isRestDay ? undefined : r.notes,
            };
          }
          return r;
        });

        const dateRecords = updatedRecords.filter((r) => r.date === dateStr);
        const score = calculateDailyDisciplineScore(
          dateRecords,
          ensured.settings.priorityWeightingEnabled
        );

        const existingSummary = ensured.dailySummaries[dateStr];
        const nextSummary: DailySummary = {
          date: dateStr,
          scheduledCount: score.scheduledCount,
          completedCount: score.completedCount,
          completionPct: score.completionPct,
          disciplineScore: score.disciplineScore,
          notes: existingSummary?.notes ?? '',
          manualOverride: dateStr !== getLjubljanaDateString(),
          updatedAt: nowIso,
        };

        return {
          ...ensured,
          dailyHabitRecords: updatedRecords,
          dailySummaries: {
            ...ensured.dailySummaries,
            [dateStr]: nextSummary,
          },
        };
      });
    },
    [persistAndSet]
  );

  const getGymRestDaysUsedThisWeek = useCallback(
    (dateStr: string): number => {
      if (!state) return 0;
      const { weekStart, weekEnd } = getWeekBounds(dateStr);
      const restDates = new Set(
        state.dailyHabitRecords
          .filter(
            (r) =>
              r.date >= weekStart &&
              r.date <= weekEnd &&
              (r.isRestDay === true || r.notes === 'GYM_REST_DAY')
          )
          .map((r) => r.date)
      );
      return restDates.size;
    },
    [state]
  );

  const toggleGymRestDay = useCallback(
    async (
      dateStr: string,
      habitId: string
    ): Promise<{ ok: boolean; usedThisWeek: number; maxPerWeek: number }> => {
      const MAX_REST_DAYS = 2;
      let result = { ok: true, usedThisWeek: 0, maxPerWeek: MAX_REST_DAYS };

      await persistAndSet((prev) => {
        const ensured = ensureTodayHabitRecords(prev, dateStr);
        const { weekStart, weekEnd } = getWeekBounds(dateStr);
        const targetRecord = ensured.dailyHabitRecords.find(
          (r) => r.date === dateStr && r.habitId === habitId
        );

        const isCurrentlyRest = Boolean(
          targetRecord?.isRestDay || targetRecord?.notes === 'GYM_REST_DAY'
        );

        const otherRestDates = new Set(
          ensured.dailyHabitRecords
            .filter(
              (r) =>
                r.date >= weekStart &&
                r.date <= weekEnd &&
                r.date !== dateStr &&
                (r.isRestDay === true || r.notes === 'GYM_REST_DAY')
            )
            .map((r) => r.date)
        );

        if (!isCurrentlyRest && otherRestDates.size >= MAX_REST_DAYS) {
          result = {
            ok: false,
            usedThisWeek: otherRestDates.size,
            maxPerWeek: MAX_REST_DAYS,
          };
          return ensured;
        }

        const nowIso = new Date().toISOString();
        const nextIsRest = !isCurrentlyRest;
        result = {
          ok: true,
          usedThisWeek: otherRestDates.size + (nextIsRest ? 1 : 0),
          maxPerWeek: MAX_REST_DAYS,
        };

        const updatedRecords = ensured.dailyHabitRecords.map((r) => {
          if (r.date === dateStr && r.habitId === habitId) {
            return {
              ...r,
              completed: nextIsRest,
              isRestDay: nextIsRest,
              completedAt: nextIsRest ? nowIso : undefined,
              notes: nextIsRest ? 'GYM_REST_DAY' : undefined,
            };
          }
          return r;
        });

        const dateRecords = updatedRecords.filter((r) => r.date === dateStr);
        const score = calculateDailyDisciplineScore(
          dateRecords,
          ensured.settings.priorityWeightingEnabled
        );

        const existingSummary = ensured.dailySummaries[dateStr];
        const nextSummary: DailySummary = {
          date: dateStr,
          scheduledCount: score.scheduledCount,
          completedCount: score.completedCount,
          completionPct: score.completionPct,
          disciplineScore: score.disciplineScore,
          notes: existingSummary?.notes ?? '',
          manualOverride: dateStr !== getLjubljanaDateString(),
          updatedAt: nowIso,
        };

        return {
          ...ensured,
          dailyHabitRecords: updatedRecords,
          dailySummaries: {
            ...ensured.dailySummaries,
            [dateStr]: nextSummary,
          },
        };
      });

      return result;
    },
    [persistAndSet]
  );

  const saveHabit = useCallback(
    async (habitInput: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      await persistAndSet((prev) => {
        const nowIso = new Date().toISOString();
        const todayStr = getLjubljanaDateString();
        const isEditing = Boolean(
          habitInput.id && prev.habits.some((h) => h.id === habitInput.id)
        );

        let nextHabits: Habit[];
        if (isEditing) {
          nextHabits = prev.habits.map((h) =>
            h.id === habitInput.id
              ? {
                  ...h,
                  ...habitInput,
                  id: h.id,
                  updatedAt: nowIso,
                }
              : h
          );
        } else {
          const newHabit: Habit = {
            ...habitInput,
            id: habitInput.id || `habit_${Date.now()}`,
            createdAt: `${todayStr}T00:00:00.000Z`,
            updatedAt: nowIso,
          };
          nextHabits = [...prev.habits, newHabit];
        }

        // Update only TODAY's uncompleted record metadata if edited, keeping past dates 100% untouched!
        const editedId = habitInput.id;
        const nextRecords = prev.dailyHabitRecords.map((rec) => {
          if (isEditing && rec.date === todayStr && rec.habitId === editedId) {
            return {
              ...rec,
              habitTitleSnapshot: habitInput.title,
              habitCategorySnapshot: habitInput.category,
              habitPrioritySnapshot: habitInput.priority,
              habitIconSnapshot: habitInput.icon,
              habitColorSnapshot: habitInput.color,
              targetValueSnapshot: habitInput.targetValue,
              unitSnapshot: habitInput.unit,
            };
          }
          return rec;
        });

        return ensureTodayHabitRecords(
          {
            ...prev,
            habits: nextHabits,
            dailyHabitRecords: nextRecords,
          },
          todayStr
        );
      });
    },
    [persistAndSet]
  );

  const deleteHabit = useCallback(
    async (habitId: string) => {
      await persistAndSet((prev) => {
        const todayStr = getLjubljanaDateString();
        // Archive/remove from active habits and remove only today's uncompleted instance, preserving past history!
        const nextHabits = prev.habits.filter((h) => h.id !== habitId);
        const nextRecords = prev.dailyHabitRecords.filter(
          (r) => !(r.date === todayStr && r.habitId === habitId && !r.completed)
        );
        return ensureTodayHabitRecords(
          {
            ...prev,
            habits: nextHabits,
            dailyHabitRecords: nextRecords,
          },
          todayStr
        );
      });
    },
    [persistAndSet]
  );

  const togglePauseHabit = useCallback(
    async (habitId: string) => {
      await persistAndSet((prev) => {
        const nextHabits = prev.habits.map((h) =>
          h.id === habitId ? { ...h, isPaused: !h.isPaused, updatedAt: new Date().toISOString() } : h
        );
        return ensureTodayHabitRecords({ ...prev, habits: nextHabits }, getLjubljanaDateString());
      });
    },
    [persistAndSet]
  );

  const updateDailySummaryNotes = useCallback(
    async (dateStr: string, notes: string) => {
      await persistAndSet((prev) => {
        const ensured = ensureTodayHabitRecords(prev, dateStr);
        const existing = ensured.dailySummaries[dateStr];
        return {
          ...ensured,
          dailySummaries: {
            ...ensured.dailySummaries,
            [dateStr]: {
              ...existing,
              notes,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    },
    [persistAndSet]
  );

  const setNoFapStartDate = useCallback(
    async (isoString: string) => {
      await persistAndSet((prev) => {
        const streak = calculateNoFapStreak(isoString);
        const longest = Math.max(prev.nofapState.longestStreakSeconds, streak.totalSeconds);
        return {
          ...prev,
          nofapState: {
            ...prev.nofapState,
            startTimestamp: isoString,
            longestStreakSeconds: longest,
          },
        };
      });
    },
    [persistAndSet]
  );

  const resetNoFapStreak = useCallback(
    async (reason: string) => {
      await persistAndSet((prev) => {
        const nowIso = new Date().toISOString();
        const currentCalc = calculateNoFapStreak(prev.nofapState.startTimestamp);
        const newLongest = Math.max(
          prev.nofapState.longestStreakSeconds,
          currentCalc.totalSeconds
        );
        const historyEntry: NoFapHistoryEntry = {
          id: `nf_${Date.now()}`,
          startTimestamp: prev.nofapState.startTimestamp,
          endTimestamp: nowIso,
          durationSeconds: currentCalc.totalSeconds,
          resetReason: reason.trim() || 'Ročna ponastavitev / Manual reset',
          createdAt: nowIso,
        };
        return {
          ...prev,
          nofapState: {
            ...prev.nofapState,
            startTimestamp: nowIso,
            longestStreakSeconds: newLongest,
            totalResets: prev.nofapState.totalResets + 1,
          },
          nofapHistory: [historyEntry, ...prev.nofapHistory],
        };
      });
    },
    [persistAndSet]
  );

  const updateEmergencyReasons = useCallback(
    async (reasons: string[]) => {
      await persistAndSet((prev) => ({
        ...prev,
        nofapState: {
          ...prev.nofapState,
          emergencyReasons: reasons,
        },
      }));
    },
    [persistAndSet]
  );

  const saveManifestationEntry = useCallback(
    async (
      dateStr: string,
      session: ManifestationSessionType,
      data: {
        gratefulFor: string;
        alreadyHave: string;
        becoming: string;
        presentTenseStatement: string;
        isFavorite?: boolean;
      }
    ) => {
      await persistAndSet((prev) => {
        const nowIso = new Date().toISOString();
        const existingIdx = prev.manifestations.findIndex(
          (m) => m.date === dateStr && m.session === session
        );
        let nextManifestations: ManifestationEntry[];
        if (existingIdx >= 0) {
          nextManifestations = prev.manifestations.map((m, idx) =>
            idx === existingIdx
              ? {
                  ...m,
                  ...data,
                  isFavorite: data.isFavorite ?? m.isFavorite,
                  updatedAt: nowIso,
                }
              : m
          );
        } else {
          const newEntry: ManifestationEntry = {
            id: `manif_${dateStr}_${session}`,
            date: dateStr,
            session,
            gratefulFor: data.gratefulFor,
            alreadyHave: data.alreadyHave,
            becoming: data.becoming,
            presentTenseStatement: data.presentTenseStatement,
            isFavorite: Boolean(data.isFavorite),
            createdAt: nowIso,
            updatedAt: nowIso,
          };
          nextManifestations = [newEntry, ...prev.manifestations];
        }
        return {
          ...prev,
          manifestations: nextManifestations,
        };
      });
    },
    [persistAndSet]
  );

  const toggleManifestationFavorite = useCallback(
    async (entryId: string) => {
      await persistAndSet((prev) => ({
        ...prev,
        manifestations: prev.manifestations.map((m) =>
          m.id === entryId ? { ...m, isFavorite: !m.isFavorite } : m
        ),
      }));
    },
    [persistAndSet]
  );

  const deleteManifestationEntry = useCallback(
    async (entryId: string) => {
      await persistAndSet((prev) => ({
        ...prev,
        manifestations: prev.manifestations.filter((m) => m.id !== entryId),
      }));
    },
    [persistAndSet]
  );

  const addAffirmation = useCallback(
    async (text: string, category: string = 'discipline') => {
      await persistAndSet((prev) => ({
        ...prev,
        affirmations: [
          {
            id: `aff_${Date.now()}`,
            text,
            category,
            isFavorite: true,
            createdAt: new Date().toISOString(),
          },
          ...prev.affirmations,
        ],
      }));
    },
    [persistAndSet]
  );

  const deleteAffirmation = useCallback(
    async (id: string) => {
      await persistAndSet((prev) => ({
        ...prev,
        affirmations: prev.affirmations.filter((a) => a.id !== id),
      }));
    },
    [persistAndSet]
  );

  const savePhysiqueEntry = useCallback(
    async (entryInput: Omit<PhysiqueEntry, 'id' | 'createdAt'> & { id?: string }) => {
      await persistAndSet((prev) => {
        const nowIso = new Date().toISOString();
        const exists = entryInput.id && prev.physiqueEntries.some((p) => p.id === entryInput.id);
        let nextEntries: PhysiqueEntry[];
        if (exists) {
          nextEntries = prev.physiqueEntries.map((p) =>
            p.id === entryInput.id ? { ...p, ...entryInput, id: p.id } : p
          );
        } else {
          const created: PhysiqueEntry = {
            ...entryInput,
            id: entryInput.id || `phys_${Date.now()}`,
            createdAt: nowIso,
          };
          nextEntries = [created, ...prev.physiqueEntries].sort((a, b) =>
            b.date.localeCompare(a.date)
          );
        }
        return {
          ...prev,
          physiqueEntries: nextEntries,
        };
      });
    },
    [persistAndSet]
  );

  const deletePhysiqueEntry = useCallback(
    async (id: string) => {
      await persistAndSet((prev) => ({
        ...prev,
        physiqueEntries: prev.physiqueEntries.filter((p) => p.id !== id),
      }));
    },
    [persistAndSet]
  );

  const toggleFavoriteVerse = useCallback(
    async (verseId: string) => {
      await persistAndSet((prev) => {
        const exists = prev.favoriteVerseIds.includes(verseId);
        return {
          ...prev,
          favoriteVerseIds: exists
            ? prev.favoriteVerseIds.filter((id) => id !== verseId)
            : [...prev.favoriteVerseIds, verseId],
        };
      });
    },
    [persistAndSet]
  );

  const submitWeeklyReview = useCallback(
    async (reviewInput: Omit<WeeklyReview, 'id' | 'createdAt'>) => {
      await persistAndSet((prev) => {
        const created: WeeklyReview = {
          ...reviewInput,
          id: `rev_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          weeklyReviews: [
            created,
            ...prev.weeklyReviews.filter((r) => r.weekStartDate !== reviewInput.weekStartDate),
          ],
        };
      });
    },
    [persistAndSet]
  );

  const deleteWeeklyReview = useCallback(
    async (id: string) => {
      await persistAndSet((prev) => ({
        ...prev,
        weeklyReviews: prev.weeklyReviews.filter((r) => r.id !== id),
      }));
    },
    [persistAndSet]
  );

  const updateWhyIStarted = useCallback(
    async (partial: Partial<WhyIStartedData>) => {
      await persistAndSet((prev) => ({
        ...prev,
        whyIStarted: {
          ...prev.whyIStarted,
          ...partial,
          updatedAt: new Date().toISOString(),
        },
      }));
    },
    [persistAndSet]
  );

  const saveDailyJournal = useCallback(
    async (entry: Omit<DailyJournalEntry, 'updatedAt'>) => {
      await persistAndSet((prev) => ({
        ...prev,
        dailyJournals: {
          ...prev.dailyJournals,
          [entry.date]: {
            ...entry,
            updatedAt: new Date().toISOString(),
          },
        },
      }));
    },
    [persistAndSet]
  );

  const recordFocusSession = useCallback(
    async (durationMinutes: number) => {
      await persistAndSet((prev) => {
        const nowIso = new Date().toISOString();
        const session: FocusSession = {
          id: `focus_${Date.now()}`,
          date: getLjubljanaDateString(),
          durationMinutes,
          completed: true,
          startedAt: nowIso,
          completedAt: nowIso,
        };
        return {
          ...prev,
          focusSessions: [session, ...prev.focusSessions],
        };
      });
    },
    [persistAndSet]
  );

  const saveGoal = useCallback(
    async (goalInput: Omit<Goal, 'id' | 'createdAt'> & { id?: string }) => {
      await persistAndSet((prev) => {
        const exists = goalInput.id && prev.goals.some((g) => g.id === goalInput.id);
        const nextGoals = exists
          ? prev.goals.map((g) => (g.id === goalInput.id ? { ...g, ...goalInput, id: g.id } : g))
          : [
              {
                ...goalInput,
                id: goalInput.id || `goal_${Date.now()}`,
                createdAt: new Date().toISOString(),
              },
              ...prev.goals,
            ];
        return {
          ...prev,
          goals: nextGoals,
        };
      });
    },
    [persistAndSet]
  );

  const toggleGoalMilestone = useCallback(
    async (goalId: string, milestoneId: string) => {
      await persistAndSet((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => {
          if (g.id !== goalId) return g;
          const nextMilestones = g.milestones.map((m) =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          );
          const doneCount = nextMilestones.filter((m) => m.completed).length;
          const autoPct =
            nextMilestones.length > 0
              ? Math.round((doneCount / nextMilestones.length) * 100)
              : g.progressPct;
          return {
            ...g,
            milestones: nextMilestones,
            progressPct: autoPct,
            completed: autoPct === 100,
          };
        }),
      }));
    },
    [persistAndSet]
  );

  const deleteGoal = useCallback(
    async (goalId: string) => {
      await persistAndSet((prev) => ({
        ...prev,
        goals: prev.goals.filter((g) => g.id !== goalId),
      }));
    },
    [persistAndSet]
  );

  const savePastSelfEntry = useCallback(
    async (entryInput: Omit<PastSelfEntry, 'id' | 'createdAt'> & { id?: string }) => {
      await persistAndSet((prev) => {
        const list = prev.pastSelfEntries || [];
        const exists = entryInput.id && list.some((e) => e.id === entryInput.id);
        const nextList = exists
          ? list.map((e) =>
              e.id === entryInput.id ? { ...e, ...entryInput, id: e.id } : e
            )
          : [
              {
                ...entryInput,
                id: entryInput.id || `past_${Date.now()}`,
                createdAt: new Date().toISOString(),
              },
              ...list,
            ];
        return {
          ...prev,
          pastSelfEntries: nextList,
        };
      });
    },
    [persistAndSet]
  );

  const deletePastSelfEntry = useCallback(
    async (id: string) => {
      await persistAndSet((prev) => ({
        ...prev,
        pastSelfEntries: (prev.pastSelfEntries || []).filter((e) => e.id !== id),
      }));
    },
    [persistAndSet]
  );

  if (!isReady || !state) {
    return null;
  }

  return (
    <AppContext.Provider
      value={{
        isReady,
        isLocked,
        unlockApp: () => setIsLocked(false),
        lockApp: () => setIsLocked(true),
        todayDateStr,
        state,
        tr,
        updateSettings,
        completeOnboarding,
        replaceFullState,
        toggleHabitCompletion,
        toggleGymRestDay,
        getGymRestDaysUsedThisWeek,
        saveHabit,
        deleteHabit,
        togglePauseHabit,
        updateDailySummaryNotes,
        ensureDateRecords,
        setNoFapStartDate,
        resetNoFapStreak,
        updateEmergencyReasons,
        saveManifestationEntry,
        toggleManifestationFavorite,
        deleteManifestationEntry,
        addAffirmation,
        deleteAffirmation,
        savePhysiqueEntry,
        deletePhysiqueEntry,
        toggleFavoriteVerse,
        submitWeeklyReview,
        deleteWeeklyReview,
        updateWhyIStarted,
        saveDailyJournal,
        recordFocusSession,
        saveGoal,
        toggleGoalMilestone,
        deleteGoal,
        savePastSelfEntry,
        deletePastSelfEntry,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
