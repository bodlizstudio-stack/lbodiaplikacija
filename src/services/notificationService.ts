import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { DailySummary, UserSettings } from '../types';
import {
  AUTHENTIC_BIBLE_VERSES,
  MISSED_TASK_NOTIFICATIONS,
  RANDOM_MOTIVATION_MESSAGES,
} from '../data/seedData';
import {
  addDays,
  getLjubljanaDateString,
  shouldSendMissedTaskNotification,
} from '../utils/dateUtils';

// Configure foreground presentation
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // Ignore on non-native environments
}

function parseTimeHHMM(hhmm: string, fallbackHour: number, fallbackMin: number = 0): { hour: number; minute: number } {
  const parts = (hhmm || '').split(':').map((n) => parseInt(n, 10));
  if (
    parts.length === 2 &&
    !isNaN(parts[0]) &&
    !isNaN(parts[1]) &&
    parts[0] >= 0 &&
    parts[0] <= 23 &&
    parts[1] >= 0 &&
    parts[1] <= 59
  ) {
    return { hour: parts[0], minute: parts[1] };
  }
  return { hour: fallbackHour, minute: fallbackMin };
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'granted') return true;
      const res = await window.Notification.requestPermission();
      return res === 'granted';
    }
    return false;
  }

  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return true;
    }
    const requested = await Notifications.requestPermissionsAsync();
    return Boolean(requested.granted);
  } catch {
    return false;
  }
}

/**
 * Synchronizes all recurring and conditional notifications with the OS scheduler.
 * Prevents duplicates by clearing previous scheduled notifications first.
 */
export async function syncAllNotifications(
  settings: UserSettings,
  summariesByDate: Record<string, DailySummary>,
  onMissedTaskNotified?: (notifiedYesterdayDate: string) => void
): Promise<{ scheduledCount: number; permissionsGranted: boolean }> {
  if (!settings.notificationsEnabled) {
    if (Platform.OS !== 'web') {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch {}
    }
    return { scheduledCount: 0, permissionsGranted: false };
  }

  const granted = await requestNotificationPermissions();
  if (!granted || Platform.OS === 'web') {
    return { scheduledCount: 0, permissionsGranted: granted };
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}

  let scheduledCount = 0;
  const useEn = settings.language === 'en' || settings.preserveEnglishQuotes;

  // 1. Three Daily Manifestation Reminders (Morning, Afternoon, Evening)
  const manifSessions = [
    {
      id: 'manif-morning',
      time: settings.manifestationMorningTime || '08:00',
      title: 'GET UP — Jutranja manifestacija / Morning Manifestation',
      body: useEn
        ? 'Write what you are grateful for and who you are becoming today.'
        : 'Zapiši, za kaj si hvaležen in kdo danes postajaš.',
    },
    {
      id: 'manif-afternoon',
      time: settings.manifestationAfternoonTime || '14:00',
      title: 'GET UP — Popoldanska manifestacija / Afternoon Check-In',
      body: useEn
        ? 'Pause and realign with your vision. 2/3 daily manifestation.'
        : 'Ustavi se in se poveži s svojo vizijo (2/3 manifestacija).',
    },
    {
      id: 'manif-evening',
      time: settings.manifestationEveningTime || '21:00',
      title: 'GET UP — Večerna hvaležnost / Evening Gratitude',
      body: useEn
        ? 'Finish the day with gratitude and present-tense conviction.'
        : 'Zaključi dan s hvaležnostjo in trdno vero v svoj cilj.',
    },
  ];

  for (const s of manifSessions) {
    const { hour, minute } = parseTimeHHMM(s.time, 8, 0);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: s.title,
          body: s.body,
          data: { route: '/modals/manifestation' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
      scheduledCount++;
    } catch {}
  }

  // 2. Daily Bible Verse Notification
  const bibleTime = parseTimeHHMM(settings.bibleVerseReminderTime || '07:30', 7, 30);
  const randomVerse =
    AUTHENTIC_BIBLE_VERSES[Math.floor(Math.random() * AUTHENTIC_BIBLE_VERSES.length)];
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `GET UP — ${settings.language === 'sl' ? randomVerse.referenceSl : randomVerse.referenceEn}`,
        body: settings.language === 'sl' ? randomVerse.textSl : randomVerse.textEn,
        data: { route: '/modals/bible' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: bibleTime.hour,
        minute: bibleTime.minute,
      },
    });
    scheduledCount++;
  } catch {}

  // 3. Monday Physique Check-In Reminder (expo-notifications weekday: 1 = Sunday, 2 = Monday ... 7 = Saturday)
  const physiqueTime = parseTimeHHMM(settings.physiqueReminderTime || '09:00', 9, 0);
  const expoPhysiqueWeekday = ((settings.physiqueReminderDay ?? 1) % 7) + 1;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'MONDAY CHECK-IN. TAKE YOUR PROGRESS PHOTO.',
        body:
          settings.language === 'sl'
            ? 'Ponedeljkov pregled postave. Fotografiraj napredek in zabeleži težo.'
            : 'Document your physique transformation and log your current weight.',
        data: { route: '/(tabs)/progress' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: expoPhysiqueWeekday,
        hour: physiqueTime.hour,
        minute: physiqueTime.minute,
      },
    });
    scheduledCount++;
  } catch {}

  // 4. Mandatory Sunday Weekly Review Reminder
  const reviewTime = parseTimeHHMM(settings.weeklyReviewTime || '20:00', 20, 0);
  const expoReviewWeekday = ((settings.weeklyReviewDay ?? 0) % 7) + 1;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'WEEKLY REVIEW. WHAT DID YOU ACTUALLY ACHIEVE?',
        body:
          settings.language === 'sl'
            ? 'Obvezni nedeljski pregled tedna. Bodi brutalno iskren do sebe.'
            : 'Mandatory Sunday accountability review. Be ruthlessly honest with yourself.',
        data: { route: '/modals/weekly-review' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: expoReviewWeekday,
        hour: reviewTime.hour,
        minute: reviewTime.minute,
      },
    });
    scheduledCount++;
  } catch {}

  // 5. Randomized Motivational Notifications in Active Hour Windows (e.g. 08:00 - 22:00 every 4h)
  const startTime = parseTimeHHMM(settings.activeHoursStart || '08:00', 8, 0);
  const endTime = parseTimeHHMM(settings.activeHoursEnd || '22:00', 22, 0);
  const windowHours = Math.max(1, settings.randomMotivationWindowHours || 4);

  const pool = [...RANDOM_MOTIVATION_MESSAGES];
  let windowCursor = startTime.hour;
  while (windowCursor < endTime.hour) {
    const windowEnd = Math.min(endTime.hour, windowCursor + windowHours);
    const randomHour =
      windowCursor + Math.floor(Math.random() * Math.max(1, windowEnd - windowCursor));
    const randomMinute = Math.floor(Math.random() * 60);
    const msgIdx = Math.floor(Math.random() * pool.length);
    const chosen = pool.splice(msgIdx, 1)[0] || RANDOM_MOTIVATION_MESSAGES[0];

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'GET UP. NO EXCUSES.',
          body: useEn ? chosen.en : chosen.sl,
          data: { route: '/(tabs)' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: randomHour,
          minute: randomMinute,
        },
      });
      scheduledCount++;
    } catch {}

    if (pool.length === 0) {
      pool.push(...RANDOM_MOTIVATION_MESSAGES);
    }
    windowCursor += windowHours;
  }

  // 6. Conditional Missed-Task Accountability Notification for Yesterday
  const todayStr = getLjubljanaDateString();
  const yesterdayStr = addDays(todayStr, -1);
  const yesterdaySummary = summariesByDate[yesterdayStr];

  if (
    shouldSendMissedTaskNotification(
      yesterdaySummary,
      settings.lastMissedNotificationDate,
      yesterdayStr
    )
  ) {
    const missedPool = settings.hardcoreMode
      ? MISSED_TASK_NOTIFICATIONS.hardcore
      : MISSED_TASK_NOTIFICATIONS.normal;
    const chosenMissed = missedPool[Math.floor(Math.random() * missedPool.length)];
    const missedTime = parseTimeHHMM(settings.missedTaskNotificationTime || '09:00', 9, 0);

    const now = new Date();
    const targetDate = new Date();
    targetDate.setHours(missedTime.hour, missedTime.minute, 0, 0);

    try {
      if (now < targetDate) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: settings.hardcoreMode
              ? 'YOU FUCKED UP YESTERDAY. GET BETTER TODAY.'
              : 'GET UP — MISSED MISSION YESTERDAY',
            body: useEn ? chosenMissed.en : chosenMissed.sl,
            data: { route: '/(tabs)/habits' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: targetDate,
          },
        });
      } else {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: settings.hardcoreMode
              ? 'YOU FUCKED UP YESTERDAY. GET BETTER TODAY.'
              : 'GET UP — MISSED MISSION YESTERDAY',
            body: useEn ? chosenMissed.en : chosenMissed.sl,
            data: { route: '/(tabs)/habits' },
          },
          trigger: null,
        });
      }
      scheduledCount++;
      onMissedTaskNotified?.(yesterdayStr);
    } catch {}
  }

  return { scheduledCount, permissionsGranted: true };
}
