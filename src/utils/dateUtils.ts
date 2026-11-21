import {
  DailyHabitRecord,
  DailySummary,
  Habit,
  HabitPriority,
  ManifestationEntry,
  PhysiqueEntry,
  WeeklyReviewStatsSnapshot,
} from '../types';

export const LJUBLJANA_TZ = 'Europe/Ljubljana';

/**
 * Formats a Date object or ISO string into YYYY-MM-DD in the given IANA timezone (default Europe/Ljubljana).
 */
export function getLjubljanaDateString(
  date: Date = new Date(),
  timezone: string = LJUBLJANA_TZ
): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || LJUBLJANA_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Fallback if Intl timeZone not supported
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the hour (0-23) in the given IANA timezone (default Europe/Ljubljana).
 */
export function getLjubljanaHour(
  date: Date = new Date(),
  timezone: string = LJUBLJANA_TZ
): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone || LJUBLJANA_TZ,
      hour: '2-digit',
      hour12: false,
    });
    return parseInt(formatter.format(date), 10);
  } catch {
    return date.getHours();
  }
}

/**
 * Parses a YYYY-MM-DD date string into { year, month, day } and returns a UTC noon Date
 * so calendar arithmetic is 100% immune to DST shifts.
 */
export function parseDateStringUTCNoon(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0));
}

export function formatUTCNoonToDateString(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds or subtracts calendar days safely across DST transitions.
 */
export function addDays(dateStr: string, deltaDays: number): string {
  const dt = parseDateStringUTCNoon(dateStr);
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return formatUTCNoonToDateString(dt);
}

/**
 * Returns the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday) for a YYYY-MM-DD string.
 */
export function getDayOfWeek(dateStr: string): number {
  return parseDateStringUTCNoon(dateStr).getUTCDay();
}

/**
 * Returns the Monday (YYYY-MM-DD) and Sunday (YYYY-MM-DD) of the week containing `dateStr`.
 */
export function getWeekBounds(dateStr: string): { weekStart: string; weekEnd: string } {
  const dow = getDayOfWeek(dateStr); // 0 = Sun, 1 = Mon ...
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const weekStart = addDays(dateStr, diffToMonday);
  const weekEnd = addDays(weekStart, 6);
  return { weekStart, weekEnd };
}

/**
 * Checks whether a habit is scheduled for a specific YYYY-MM-DD date.
 */
export function isHabitScheduledForDate(habit: Habit, dateStr: string): boolean {
  if (habit.isPaused || habit.isArchived) {
    return false;
  }
  const createdDateStr = habit.createdAt ? habit.createdAt.slice(0, 10) : '0000-00-00';
  if (dateStr < createdDateStr) {
    return false;
  }
  if (habit.repeatType === 'daily') {
    return true;
  }
  if (habit.repeatType === 'one_time') {
    return habit.targetDate === dateStr;
  }
  if (habit.repeatType === 'weekdays') {
    const dow = getDayOfWeek(dateStr);
    return Array.isArray(habit.repeatDays) && habit.repeatDays.includes(dow);
  }
  return false;
}

export function getPriorityWeight(priority: HabitPriority): number {
  switch (priority) {
    case 'critical':
      return 2.0;
    case 'high':
      return 1.5;
    case 'medium':
      return 1.0;
    case 'low':
    default:
      return 0.75;
  }
}

/**
 * Calculates daily completion percentage and discipline score (0-100).
 * Never assigns a failing score to a day with zero scheduled tasks.
 */
export function calculateDailyDisciplineScore(
  records: Pick<DailyHabitRecord, 'completed' | 'habitPrioritySnapshot'>[],
  priorityWeightingEnabled: boolean = false
): {
  scheduledCount: number;
  completedCount: number;
  completionPct: number;
  disciplineScore: number;
} {
  const scheduledCount = records.length;
  if (scheduledCount === 0) {
    return {
      scheduledCount: 0,
      completedCount: 0,
      completionPct: 100,
      disciplineScore: 100,
    };
  }

  const completedCount = records.filter((r) => r.completed).length;
  const completionPct = Math.round((completedCount / scheduledCount) * 100);

  if (!priorityWeightingEnabled) {
    return {
      scheduledCount,
      completedCount,
      completionPct,
      disciplineScore: completionPct,
    };
  }

  let totalWeight = 0;
  let earnedWeight = 0;
  for (const r of records) {
    const w = getPriorityWeight(r.habitPrioritySnapshot || 'medium');
    totalWeight += w;
    if (r.completed) {
      earnedWeight += w;
    }
  }
  const disciplineScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 100;

  return {
    scheduledCount,
    completedCount,
    completionPct,
    disciplineScore,
  };
}

/**
 * Determines whether a Missed Task Accountability Notification should be triggered for yesterday.
 * Only returns true if yesterday actually had scheduled tasks AND at least one was left unfinished.
 */
export function shouldSendMissedTaskNotification(
  yesterdaySummary: Pick<DailySummary, 'scheduledCount' | 'completedCount'> | null | undefined,
  alreadyNotifiedForDate: string | undefined,
  yesterdayDateStr: string
): boolean {
  if (!yesterdaySummary) {
    return false;
  }
  if (alreadyNotifiedForDate === yesterdayDateStr) {
    return false;
  }
  if (yesterdaySummary.scheduledCount <= 0) {
    return false;
  }
  return yesterdaySummary.completedCount < yesterdaySummary.scheduledCount;
}

/**
 * Calculates live No Fap streak breakdown in days, hours, minutes, seconds, and total seconds.
 */
export function calculateNoFapStreak(
  startIsoTimestamp: string,
  nowMs: number = Date.now()
): {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const startMs = new Date(startIsoTimestamp).getTime();
  if (isNaN(startMs) || nowMs <= startMs) {
    return { totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const totalSeconds = Math.floor((nowMs - startMs) / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { totalSeconds, days, hours, minutes, seconds };
}

/**
 * Calculates consecutive completed days streak up to `todayDateStr`.
 * If today is not yet 100% completed, counts consecutive completed days up through yesterday
 * (plus today if today is 100% completed). Days with 0 scheduled tasks do not break or inflate the streak.
 */
export function calculateCompletedDaysStreak(
  summariesByDate: Record<string, Pick<DailySummary, 'scheduledCount' | 'completedCount'>>,
  todayDateStr: string
): number {
  let streak = 0;
  let cursor = todayDateStr;

  const todaySummary = summariesByDate[cursor];
  const todayComplete =
    todaySummary &&
    todaySummary.scheduledCount > 0 &&
    todaySummary.completedCount >= todaySummary.scheduledCount;

  if (todayComplete) {
    streak += 1;
  }
  cursor = addDays(cursor, -1);

  for (let i = 0; i < 3650; i++) {
    const s = summariesByDate[cursor];
    if (!s) {
      break;
    }
    if (s.scheduledCount === 0) {
      // Rest day with no scheduled tasks: step over without breaking streak
      cursor = addDays(cursor, -1);
      continue;
    }
    if (s.completedCount >= s.scheduledCount) {
      streak += 1;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Computes automatic weekly statistics for the Weekly Review screen.
 */
export function computeWeeklyReviewStats(
  weekStartDate: string,
  weekEndDate: string,
  records: DailyHabitRecord[],
  summaries: DailySummary[],
  manifestations: ManifestationEntry[],
  physiqueEntries: PhysiqueEntry[]
): WeeklyReviewStatsSnapshot {
  const weekRecords = records.filter((r) => r.date >= weekStartDate && r.date <= weekEndDate);
  const weekSummaries = summaries.filter((s) => s.date >= weekStartDate && s.date <= weekEndDate);
  const weekManifestations = manifestations.filter(
    (m) => m.date >= weekStartDate && m.date <= weekEndDate
  );
  const weekPhysique = physiqueEntries.filter(
    (p) =>
      p.date >= weekStartDate &&
      p.date <= weekEndDate &&
      Boolean(p.frontPhotoUri || p.sidePhotoUri || p.backPhotoUri || p.customPhotoUri)
  );

  const totalScheduledHabits = weekRecords.length;
  const completedHabits = weekRecords.filter((r) => r.completed).length;
  const weeklyCompletionPct =
    totalScheduledHabits > 0 ? Math.round((completedHabits / totalScheduledHabits) * 100) : 0;

  const activeSummaries = weekSummaries.filter((s) => s.scheduledCount > 0);
  const avgDisciplineScore =
    activeSummaries.length > 0
      ? Math.round(
          activeSummaries.reduce((acc, s) => acc + s.disciplineScore, 0) / activeSummaries.length
        )
      : 0;

  // Group by habit title
  const statsByHabit: Record<string, { title: string; completed: number; missed: number }> = {};
  for (const r of weekRecords) {
    if (!statsByHabit[r.habitId]) {
      statsByHabit[r.habitId] = { title: r.habitTitleSnapshot, completed: 0, missed: 0 };
    }
    if (r.completed) {
      statsByHabit[r.habitId].completed += 1;
    } else {
      statsByHabit[r.habitId].missed += 1;
    }
  }

  const habitList = Object.values(statsByHabit);
  let mostConsistentHabit: string | null = null;
  let mostMissedHabit: string | null = null;

  if (habitList.length > 0) {
    const sortedByCompleted = [...habitList].sort((a, b) => b.completed - a.completed);
    if (sortedByCompleted[0].completed > 0) {
      mostConsistentHabit = sortedByCompleted[0].title;
    }
    const sortedByMissed = [...habitList].sort((a, b) => b.missed - a.missed);
    if (sortedByMissed[0].missed > 0) {
      mostMissedHabit = sortedByMissed[0].title;
    }
  }

  return {
    completedHabits,
    totalScheduledHabits,
    weeklyCompletionPct,
    avgDisciplineScore,
    mostConsistentHabit,
    mostMissedHabit,
    manifestationSessionsCount: weekManifestations.length,
    physiquePhotoTaken: weekPhysique.length > 0,
  };
}

/**
 * Formats elapsed time between two YYYY-MM-DD dates for Physique Transformation comparisons.
 */
export function formatTransformationElapsed(
  dateA: string,
  dateB: string,
  lang: 'sl' | 'en'
): string {
  const msA = parseDateStringUTCNoon(dateA).getTime();
  const msB = parseDateStringUTCNoon(dateB).getTime();
  const diffDays = Math.round(Math.abs(msB - msA) / 86400000);

  if (diffDays === 0) {
    return lang === 'sl' ? 'Isti dan' : 'Same day';
  }
  if (diffDays < 14) {
    return lang === 'sl'
      ? `Transformacija — ${diffDays} dni`
      : `Transformation — ${diffDays} day${diffDays === 1 ? '' : 's'}`;
  }
  const weeks = Math.round(diffDays / 7);
  return lang === 'sl'
    ? `Transformacija — ${weeks} tednov (${diffDays} dni)`
    : `Transformation — ${weeks} weeks (${diffDays} days)`;
}

/**
 * Deterministic daily index for Scripture of the Day so it stays consistent
 * across reloads throughout the same local calendar day.
 */
export function getDailyScriptureIndex(dateStr: string, totalVerses: number): number {
  if (totalVerses <= 0) return 0;
  const noonMs = parseDateStringUTCNoon(dateStr).getTime();
  const dayNumber = Math.floor(noonMs / 86400000);
  return ((dayNumber % totalVerses) + totalVerses) % totalVerses;
}

/**
 * Deterministic daily index for rotating daily reflection questions.
 */
export function getDailyReflectionIndex(dateStr: string, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  const noonMs = parseDateStringUTCNoon(dateStr).getTime();
  const dayNumber = Math.floor(noonMs / 86400000);
  return (((dayNumber + 5) % totalQuestions) + totalQuestions) % totalQuestions;
}

/**
 * Exact 14-calendar-day recurring lifestyle vision reminder anchored to `anchorDate`.
 * Immune to DST shifts via UTC-noon calendar day arithmetic.
 */
export function calculateNext14DayReminder(
  anchorDate: string,
  todayDateStr: string
): {
  nextDate: string;
  daysUntil: number;
  isDueToday: boolean;
  cycleNumber: number;
} {
  const safeAnchor = anchorDate && /^\d{4}-\d{2}-\d{2}$/.test(anchorDate) ? anchorDate : todayDateStr;
  const anchorMs = parseDateStringUTCNoon(safeAnchor).getTime();
  const todayMs = parseDateStringUTCNoon(todayDateStr).getTime();
  const diffDays = Math.round((todayMs - anchorMs) / 86400000);

  if (diffDays <= 0) {
    const firstDue = addDays(safeAnchor, 14);
    const daysUntil = Math.round(
      (parseDateStringUTCNoon(firstDue).getTime() - todayMs) / 86400000
    );
    return {
      nextDate: firstDue,
      daysUntil,
      isDueToday: false,
      cycleNumber: 1,
    };
  }

  const remainder = diffDays % 14;
  if (remainder === 0) {
    const cycleNumber = Math.floor(diffDays / 14);
    return {
      nextDate: todayDateStr,
      daysUntil: 0,
      isDueToday: true,
      cycleNumber,
    };
  }

  const daysUntil = 14 - remainder;
  const cycleNumber = Math.floor(diffDays / 14) + 1;
  return {
    nextDate: addDays(todayDateStr, daysUntil),
    daysUntil,
    isDueToday: false,
    cycleNumber,
  };
}

/**
 * Calculates per-habit current and longest streaks while strictly respecting
 * scheduled days (unscheduled rest days do not break or artificially inflate the streak).
 */
export function calculateHabitStreak(
  habit: Habit,
  records: DailyHabitRecord[],
  todayDateStr: string
): { current: number; longest: number } {
  const habitRecsByDate = new Map<string, boolean>();
  for (const r of records) {
    if (r.habitId === habit.id && r.completed) {
      habitRecsByDate.set(r.date, true);
    }
  }

  // Determine earliest scan boundary
  const createdDate = habit.createdAt ? habit.createdAt.slice(0, 10) : addDays(todayDateStr, -365);
  const startScan = createdDate < addDays(todayDateStr, -365) ? addDays(todayDateStr, -365) : createdDate;

  let current = 0;
  let longest = 0;
  let running = 0;

  let cursor = startScan;
  while (cursor <= todayDateStr) {
    const scheduled = isHabitScheduledForDate(habit, cursor);
    const done = Boolean(habitRecsByDate.get(cursor));

    if (scheduled) {
      if (done) {
        running += 1;
        if (running > longest) longest = running;
      } else if (cursor < todayDateStr) {
        running = 0;
      }
    } else if (done) {
      // Bonus completion on unscheduled day counts safely
      running += 1;
      if (running > longest) longest = running;
    }

    cursor = addDays(cursor, 1);
  }

  // Backward scan for current active streak ending today (or yesterday if today still open)
  let backCursor = todayDateStr;
  let backStreak = 0;
  for (let i = 0; i < 366; i++) {
    if (backCursor < createdDate) break;
    const scheduled = isHabitScheduledForDate(habit, backCursor);
    const done = Boolean(habitRecsByDate.get(backCursor));

    if (done) {
      backStreak += 1;
    } else if (scheduled) {
      if (backCursor === todayDateStr) {
        // Today is still in progress; allow yesterday's streak to stand
        backCursor = addDays(backCursor, -1);
        continue;
      }
      break;
    }
    // Unscheduled day with no completion: step over without breaking streak
    backCursor = addDays(backCursor, -1);
  }
  current = backStreak;
  if (current > longest) longest = current;

  return { current, longest };
}

/**
 * Returns true during reflective evening/night hours (18:00–03:59) in the user's timezone.
 */
export function isEveningHour(timezone: string = LJUBLJANA_TZ, now: Date = new Date()): boolean {
  const hr = getLjubljanaHour(now, timezone);
  return hr >= 18 || hr < 4;
}
