import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/store/AppContext';
import { PerformanceHQShell } from '../../src/components/PerformanceHQShell';
import {
  AUTHENTIC_BIBLE_VERSES,
  MISSED_TASK_NOTIFICATIONS,
  MOTIVATIONAL_QUOTES,
} from '../../src/data/seedData';
import {
  addDays,
  calculateCompletedDaysStreak,
  calculateNoFapStreak,
  getWeekBounds,
  parseDateStringUTCNoon,
  shouldSendMissedTaskNotification,
} from '../../src/utils/dateUtils';

const CATEGORY_MATERIAL_ICONS: Record<string, string> = {
  fitness: 'open_in_full',
  nutrition: 'restaurant',
  faith: 'menu_book',
  mindset: 'edit_note',
  study: 'school',
  work: 'terminal',
  recovery: 'bedtime',
  discipline: 'shield',
};

export default function HomeDashboardScreen() {
  const router = useRouter();
  const {
    state,
    todayDateStr,
    toggleHabitCompletion,
    toggleGymRestDay,
    getGymRestDaysUsedThisWeek,
    toggleFavoriteVerse,
  } = useApp();

  const lang = state.settings.language;
  const preserveEn = state.settings.preserveEnglishQuotes;
  const [restAlertMsg, setRestAlertMsg] = useState<string | null>(null);

  // Live 1-second ticker for No Fap counter
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const nofapLive = useMemo(
    () => calculateNoFapStreak(state.nofapState.startTimestamp, nowMs),
    [state.nofapState.startTimestamp, nowMs]
  );

  const todayRecords = useMemo(
    () => state.dailyHabitRecords.filter((r) => r.date === todayDateStr),
    [state.dailyHabitRecords, todayDateStr]
  );

  const todaySummary = state.dailySummaries[todayDateStr] || {
    date: todayDateStr,
    scheduledCount: todayRecords.length,
    completedCount: todayRecords.filter((r) => r.completed).length,
    completionPct: 0,
    disciplineScore: 0,
    notes: '',
    updatedAt: '',
  };

  const completedDaysStreak = useMemo(
    () => calculateCompletedDaysStreak(state.dailySummaries, todayDateStr),
    [state.dailySummaries, todayDateStr]
  );

  const gymRestUsedThisWeek = getGymRestDaysUsedThisWeek(todayDateStr);

  const dynamicMotivation = useMemo(() => {
    const pct = todaySummary.completionPct;
    const bucket =
      pct < 40
        ? MOTIVATIONAL_QUOTES.lowCompletion
        : pct < 85
        ? MOTIVATIONAL_QUOTES.midCompletion
        : MOTIVATIONAL_QUOTES.highCompletion;
    const daySeed = Number(todayDateStr.replace(/-/g, '')) || 0;
    const item = bucket[daySeed % bucket.length];
    return preserveEn || lang === 'en' ? item.en : item.sl;
  }, [todaySummary.completionPct, todayDateStr, preserveEn, lang]);

  const verseOfTheDay = useMemo(() => {
    return AUTHENTIC_BIBLE_VERSES[0];
  }, []);

  const isVerseSaved = state.favoriteVerseIds.includes(verseOfTheDay.id);

  // Manifestation sessions today
  const todayManifestations = useMemo(
    () => state.manifestations.filter((m) => m.date === todayDateStr),
    [state.manifestations, todayDateStr]
  );
  const manifDoneCount = todayManifestations.length;
  const morningEntry = todayManifestations.find((m) => m.session === 'morning');
  const afternoonEntry = todayManifestations.find((m) => m.session === 'afternoon');
  const eveningEntry = todayManifestations.find((m) => m.session === 'evening');

  // Weekly bounds for Physique Photo & Weekly Review status
  const { weekStart, weekEnd } = useMemo(
    () => getWeekBounds(todayDateStr),
    [todayDateStr]
  );

  const weekNumber = useMemo(() => {
    const d = parseDateStringUTCNoon(todayDateStr);
    const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const diff = d.getTime() - start.getTime();
    return Math.ceil((diff / 86400000 + start.getUTCDay() + 1) / 7);
  }, [todayDateStr]);

  const hasPhotoThisWeek = useMemo(
    () =>
      state.physiqueEntries.some(
        (p) =>
          p.date >= weekStart &&
          p.date <= weekEnd &&
          Boolean(p.frontPhotoUri || p.sidePhotoUri || p.backPhotoUri || p.customPhotoUri)
      ),
    [state.physiqueEntries, weekStart, weekEnd]
  );

  const hasWeeklyReviewThisWeek = useMemo(
    () => state.weeklyReviews.some((r) => r.weekStartDate === weekStart),
    [state.weeklyReviews, weekStart]
  );

  // Yesterday missed-task check
  const yesterdayStr = useMemo(() => addDays(todayDateStr, -1), [todayDateStr]);
  const yesterdaySummary = state.dailySummaries[yesterdayStr];
  const missedYesterday = useMemo(
    () => shouldSendMissedTaskNotification(yesterdaySummary, undefined, yesterdayStr),
    [yesterdaySummary, yesterdayStr]
  );

  const circumference = 276.46; // 2 * Math.PI * 44
  const clampedPct = Math.max(0, Math.min(100, todaySummary.disciplineScore));
  const strokeDashoffset = (
    circumference -
    (clampedPct / 100) * circumference
  ).toFixed(2);

  const executionPct =
    todaySummary.scheduledCount > 0
      ? Math.round((todaySummary.completedCount / todaySummary.scheduledCount) * 100)
      : 0;

  const handleGymRestClick = async (
    e: React.MouseEvent,
    habitId: string
  ) => {
    e.stopPropagation();
    const res = await toggleGymRestDay(todayDateStr, habitId);
    if (!res.ok) {
      setRestAlertMsg(
        lang === 'sl'
          ? 'Največ 2 dni počitka na teden sta že porabljena (2/2)! Danes ni izgovorov — pojdi na trening.'
          : 'Maximum 2 rest days in one week already used (2/2)! No excuses today — get to the gym.'
      );
      setTimeout(() => setRestAlertMsg(null), 4500);
    } else {
      setRestAlertMsg(null);
    }
  };

  return (
    <PerformanceHQShell>
      {/* CARD 1: Futuristic Command Intent + Discipline Telemetry HUD Card */}
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low p-space-md machined-border hud-reticle thermal-glow transition-all duration-300">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-container opacity-10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Micro Telemetry Header */}
        <div className="flex justify-end mb-1.5">
          <span className="text-[9px] font-mono text-primary/70 tracking-widest uppercase">
            • [TEL:DISCIPLINE_CORE]
          </span>
        </div>

        {/* Top Status Badges */}
        <div className="flex items-center justify-between gap-1.5 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-primary-container tracking-wider uppercase bg-primary-container/10 px-2 py-0.5 rounded border border-primary-container/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
              COMMAND INTENT
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"></span>
              REIGN VERIFIED
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-on-surface bg-surface-container-highest px-2 py-0.5 rounded border border-outline-variant/50 tracking-widest uppercase">
            DAY {String(Math.max(42, completedDaysStreak)).padStart(3, '0')}
          </span>
        </div>

        {/* Main Headline */}
        <h2 className="text-headline-lg-mobile font-headline-lg-mobile tracking-tight text-white">
          GET UP. <span className="text-primary-container">NO EXCUSES.</span>
        </h2>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[11px] font-mono text-on-surface-variant tracking-widest uppercase">
            DON&apos;T FORGET WHY YOU STARTED
          </p>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary-container/20 text-primary border border-primary-container/30">
            2088.REV
          </span>
        </div>

        {/* Integrated Discipline Ring & Execution Rate Box */}
        <div className="mt-3.5 p-3.5 rounded-xl bg-surface-container-lowest/95 machined-border flex items-center gap-4">
          {/* Segmented HUD Circular SVG Progress Ring */}
          <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 104 104">
              {/* Outer technical dashed ring */}
              <circle
                cx="52"
                cy="52"
                fill="transparent"
                r="49"
                stroke="rgba(249, 115, 22, 0.22)"
                strokeDasharray="3 5"
                strokeWidth="1"
              ></circle>
              <circle
                cx="52"
                cy="52"
                fill="transparent"
                r="44"
                stroke="#16181D"
                strokeWidth="8"
              ></circle>
              <defs>
                <linearGradient id="thermalGradHud" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#F97316"></stop>
                  <stop offset="100%" stopColor="#FFB347"></stop>
                </linearGradient>
                <filter height="140%" id="glowHud" width="140%" x="-20%" y="-20%">
                  <feDropShadow
                    dx="0"
                    dy="0"
                    floodColor="#F97316"
                    floodOpacity="0.8"
                    stdDeviation="2.5"
                  ></feDropShadow>
                </filter>
              </defs>
              <circle
                cx="52"
                cy="52"
                fill="transparent"
                filter="url(#glowHud)"
                r="44"
                stroke="url(#thermalGradHud)"
                strokeDasharray="276.46"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
                strokeWidth="8"
                style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-headline-md font-headline-md text-white font-bold tracking-tight leading-none">
                {clampedPct}%
              </span>
              <span className="text-[9px] font-mono text-on-surface-variant tracking-widest uppercase mt-1">
                DISCIPLINE
              </span>
              <span className="text-[8px] font-mono text-emerald-400 tracking-widest uppercase mt-0.5">
                NOMINAL
              </span>
            </div>
          </div>

          {/* Right Telemetry Column */}
          <div className="flex-1 space-y-3">
            <div
              onClick={() => router.replace('/(tabs)/habits' as any)}
              className="cursor-pointer"
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-mono text-tertiary uppercase tracking-wider">
                  EXEC_RATE // 01
                </span>
                <span className="text-[11px] font-mono text-white font-bold">
                  <span className="text-primary-container">{todaySummary.completedCount}</span>/
                  {todaySummary.scheduledCount} Done
                </span>
              </div>
              <div className="w-full h-2 bg-surface-container-high rounded-sm overflow-hidden p-0.5 border border-primary-container/20">
                <div
                  className="h-full bg-gradient-to-r from-primary-container to-secondary transition-all duration-500 ease-out shadow-[0_0_8px_#F97316]"
                  style={{ width: `${executionPct}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-surface-variant/40">
              <div
                onClick={() => router.replace('/(tabs)/progress' as any)}
                className="cursor-pointer"
              >
                <span className="text-[9px] font-mono text-tertiary uppercase block">
                  WEEKLY MOMENTUM
                </span>
                <span className="text-label-lg font-mono font-bold text-primary-container">
                  +14.2%{' '}
                  <span className="text-[10px] text-on-surface-variant font-normal">
                    pace
                  </span>
                </span>
              </div>
              <div
                onClick={() => router.push('/modals/focus' as any)}
                className="cursor-pointer"
              >
                <span className="text-[9px] font-mono text-tertiary uppercase block">
                  CURRENT TIER
                </span>
                <span className="text-label-lg font-headline-sm font-bold text-white">
                  Sovereign
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom System Log Quote */}
        <div className="mt-3 pt-2.5 border-t border-surface-variant/50 flex items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-primary-container font-bold">&gt;</span>
            <p className="text-on-surface italic truncate">
              &ldquo;{dynamicMotivation}&rdquo;
            </p>
          </div>
          <span className="text-[9px] font-mono text-tertiary flex-shrink-0">
            [SYS.LOG]
          </span>
        </div>
      </section>

      {/* Conditional Missed-Task Accountability Alert */}
      {missedYesterday && (
        <section
          onClick={() => router.replace('/(tabs)/calendar' as any)}
          className="rounded-xl bg-error-container/30 border border-error/50 p-space-md machined-border hud-reticle cursor-pointer transition-opacity duration-200 hover:opacity-90"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-2xl">
              warning
            </span>
            <div>
              <p className="text-label-md font-mono text-error uppercase font-bold">
                {state.settings.hardcoreMode
                  ? MISSED_TASK_NOTIFICATIONS.hardcore[0].en
                  : MISSED_TASK_NOTIFICATIONS.normal[0].en}
              </p>
              <p className="text-body-sm font-mono text-on-surface-variant mt-0.5">
                Yesterday ({yesterdayStr}): {yesterdaySummary?.completedCount}/
                {yesterdaySummary?.scheduledCount} completed. Tap to inspect.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* CARD 2: No Fap Sovereign Streak — Biometric Integrity Matrix */}
      <section className="rounded-xl bg-gradient-to-r from-surface-container-high to-surface-container p-space-md machined-border hud-reticle relative overflow-hidden transition-all duration-200">
        <div
          onClick={() => router.push('/modals/nofap' as any)}
          className="cursor-pointer"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center machined-border border border-primary-container/40">
                <span
                  className="material-symbols-outlined text-primary-container text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  shield
                </span>
              </div>
              <div>
                <h3 className="text-headline-sm font-headline-sm text-white leading-tight">
                  No Fap Sovereign Streak
                </h3>
                <span className="text-[9px] font-mono text-tertiary uppercase tracking-widest block mt-0.5">
                  BIOMETRIC INTEGRITY MATRIX
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono text-tertiary">0x42A</span>
              <span className="px-2 py-1 text-[9px] font-mono font-bold text-primary-fixed-dim bg-primary-container/15 rounded border border-primary-container/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
                SHIELD ACTIVE
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 my-space-sm">
            {/* DAYS [01] */}
            <div className="bg-surface-container-lowest p-2.5 rounded-lg machined-border flex flex-col justify-between">
              <div className="flex justify-between items-center text-[8px] font-mono text-tertiary">
                <span>DAYS</span>
                <span>[01]</span>
              </div>
              <span className="text-headline-md font-headline-md text-white font-bold text-center my-1">
                {nofapLive.days}
              </span>
              <span className="text-[8px] font-mono text-primary-container uppercase text-center tracking-wider">
                CLEAN MATRIX
              </span>
            </div>

            {/* HOURS [02] */}
            <div className="bg-surface-container-lowest p-2.5 rounded-lg machined-border flex flex-col justify-between">
              <div className="flex justify-between items-center text-[8px] font-mono text-tertiary">
                <span>HOURS</span>
                <span>[02]</span>
              </div>
              <span className="text-headline-md font-headline-md text-white font-bold text-center my-1">
                {String(nofapLive.hours).padStart(2, '0')}
              </span>
              <span className="text-[8px] font-mono text-tertiary uppercase text-center tracking-wider">
                ELAPSED
              </span>
            </div>

            {/* MINS [03] */}
            <div className="bg-surface-container-lowest p-2.5 rounded-lg machined-border flex flex-col justify-between">
              <div className="flex justify-between items-center text-[8px] font-mono text-tertiary">
                <span>MINS</span>
                <span>[03]</span>
              </div>
              <span className="text-headline-md font-headline-md text-white font-bold text-center my-1">
                {String(nofapLive.minutes).padStart(2, '0')}
              </span>
              <span className="text-[8px] font-mono text-tertiary uppercase text-center tracking-wider">
                LOCKED
              </span>
            </div>

            {/* SECS [04] */}
            <div className="bg-surface-container-lowest p-2.5 rounded-lg machined-border flex flex-col justify-between">
              <div className="flex justify-between items-center text-[8px] font-mono text-primary">
                <span>SECS</span>
                <span>[04]</span>
              </div>
              <span className="text-headline-md font-headline-md text-primary-container font-bold text-center my-1">
                {String(nofapLive.seconds).padStart(2, '0')}
              </span>
              <span className="text-[8px] font-mono text-emerald-400 uppercase text-center tracking-wider">
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Futuristic Scanline Emergency Protocol Trigger */}
        <button
          onClick={() => router.push('/modals/why-i-started' as any)}
          className="w-full mt-2.5 py-2.5 px-3.5 hud-scanline-btn rounded-lg text-white font-mono text-[11px] font-bold flex items-center justify-between shadow-lg hover:shadow-primary-container/40 transition-all duration-200 active:scale-[0.99] border border-primary-fixed/40"
        >
          <div className="flex items-center gap-2.5 text-left">
            <span className="material-symbols-outlined text-lg text-white">
              warning
            </span>
            <span className="tracking-wider uppercase leading-tight">
              OVERRIDE: INITIATE EMERGENCY PROTOCOL
            </span>
          </div>
          <span className="px-2 py-1 rounded bg-black/60 border border-white/20 text-[9px] font-mono text-primary-fixed tracking-widest uppercase flex-shrink-0">
            TR-WHY
          </span>
        </button>
      </section>

      {/* CARD 3: Daily Execution Order [OP_CODE: 888] — Priority Missions */}
      <section className="rounded-xl bg-surface-container p-space-md machined-border hud-reticle">
        <div className="flex justify-between items-start mb-space-sm">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary-container font-bold">
                DAILY EXECUTION ORDER
              </span>
              <span className="text-[9px] font-mono text-tertiary">
                [OP_CODE: 888]
              </span>
            </div>
            <h3 className="text-headline-sm font-headline-sm text-white mt-0.5">
              Priority Missions
            </h3>
          </div>
          <button
            onClick={() => router.replace('/(tabs)/habits' as any)}
            className="px-2.5 py-1 rounded bg-surface-container-highest text-[10px] font-mono font-bold text-primary border border-primary-container/30 hover:bg-surface-bright transition-colors uppercase"
          >
            {todaySummary.completedCount}/{todaySummary.scheduledCount} COMPLETED
          </button>
        </div>

        {restAlertMsg && (
          <div className="mb-3 p-2.5 rounded-lg bg-error-container/40 border border-error text-error text-[11px] font-mono flex items-center gap-2 hq-page-fade">
            <span className="material-symbols-outlined text-base">warning</span>
            <span>{restAlertMsg}</span>
          </div>
        )}

        <div className="space-y-2.5">
          {todayRecords.slice(0, 6).map((rec, idx) => {
            const matIcon =
              CATEGORY_MATERIAL_ICONS[rec.habitCategorySnapshot] || 'check_circle';
            const displayTitle =
              lang === 'en' && rec.habitTitleSnapshot.includes('/')
                ? rec.habitTitleSnapshot.split('/')[1].trim()
                : rec.habitTitleSnapshot.split('/')[0].trim();

            const isGymHabit =
              rec.habitId === 'habit-gym' ||
              rec.habitCategorySnapshot === 'fitness' ||
              rec.habitTitleSnapshot.toLowerCase().includes('gym') ||
              rec.habitTitleSnapshot.toLowerCase().includes('fitnes');

            const isRestDayToday = Boolean(
              rec.isRestDay || rec.notes === 'GYM_REST_DAY'
            );

            const missionCode = `[M_0${idx + 1}]`;

            return (
              <div
                key={rec.id}
                className={`rounded-lg machined-border transition-all duration-200 ${
                  rec.completed
                    ? 'bg-surface-container-low/90'
                    : 'bg-surface-container-high border-l-2 border-l-primary-container'
                }`}
              >
                <div
                  onClick={() => toggleHabitCompletion(todayDateStr, rec.habitId)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:opacity-95 transition-opacity"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    {rec.completed ? (
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.5)] flex-shrink-0 transition-transform duration-200 ${
                          isRestDayToday
                            ? 'bg-secondary-container text-white'
                            : 'bg-primary-container text-on-primary-container'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm font-bold">
                          {isRestDayToday ? 'bedtime' : 'check'}
                        </span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded bg-surface-container-lowest border border-outline-variant flex items-center justify-center hover:border-primary-container transition-colors flex-shrink-0"></div>
                    )}

                    <div className="min-w-0">
                      <p
                        className={`text-body-md font-body-md truncate transition-all ${
                          rec.completed
                            ? 'text-on-surface/80 line-through'
                            : 'text-white font-semibold'
                        }`}
                      >
                        {displayTitle}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="text-[10px] font-mono text-primary uppercase">
                          {isRestDayToday
                            ? `REST PROTOCOL • ${gymRestUsedThisWeek}/2 WK`
                            : rec.completed
                            ? `${rec.habitCategorySnapshot} • COMPLETED`
                            : `SCHEDULED • ${rec.habitPrioritySnapshot}`}
                        </span>
                        <span
                          className={`text-[8px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                            isRestDayToday
                              ? 'bg-secondary/15 text-secondary border border-secondary/30'
                              : rec.completed
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-primary-container/15 text-primary-container border border-primary-container/30'
                          }`}
                        >
                          {isRestDayToday
                            ? 'REST_OK'
                            : rec.completed
                            ? idx % 2 === 0
                              ? 'LOGGED'
                              : 'SYNCED'
                            : 'PENDING'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[9px] font-mono text-tertiary">
                      {missionCode}
                    </span>
                    <span
                      className={`material-symbols-outlined text-sm ${
                        rec.completed ? 'text-on-surface-variant' : 'text-primary-container'
                      }`}
                    >
                      {matIcon}
                    </span>
                  </div>
                </div>

                {/* Gym Rest Day Bar (Max 2 Rest Days Per Week) */}
                {isGymHabit && (
                  <div className="px-3 pb-2.5 pt-1.5 border-t border-surface-variant/40 flex items-center justify-between gap-2 bg-surface-container-lowest/70 rounded-b-lg">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-secondary text-xs">
                        bedtime
                      </span>
                      <span className="text-[9px] font-mono text-on-surface-variant uppercase tracking-wider">
                        {lang === 'sl'
                          ? `REST_PROTOCOL: ${gymRestUsedThisWeek}/2 TA TEDEN`
                          : `REST_PROTOCOL: ${gymRestUsedThisWeek}/2 THIS WEEK`}
                      </span>
                      <div className="flex items-center gap-1 ml-1">
                        {[0, 1].map((slot) => (
                          <span
                            key={slot}
                            className={`w-2 h-2 rounded-full ${
                              slot < gymRestUsedThisWeek
                                ? 'bg-secondary shadow-[0_0_6px_#ffb95a]'
                                : 'bg-surface-variant'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleGymRestClick(e, rec.habitId)}
                      className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider machined-border transition-all duration-200 active:scale-95 ${
                        isRestDayToday
                          ? 'bg-secondary-container text-white font-bold'
                          : gymRestUsedThisWeek >= 2
                          ? 'bg-surface-container text-tertiary opacity-60'
                          : 'bg-surface-container-high text-secondary hover:bg-surface-bright'
                      }`}
                    >
                      {isRestDayToday
                        ? lang === 'sl'
                          ? '✓ Počitek (Prekliči)'
                          : '✓ Rest Day (Undo)'
                        : gymRestUsedThisWeek >= 2
                        ? '2/2 MAX'
                        : lang === 'sl'
                        ? 'Danes počitek'
                        : 'I had a rest today'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CARD 4: Unified Spiritual & Mindset Protocol Card */}
      <section className="rounded-xl bg-surface-container p-space-md machined-border hud-reticle space-y-4">
        {/* Card Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <span
              className="material-symbols-outlined text-primary-container"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            <div>
              <h3 className="text-headline-sm font-headline-sm text-white leading-tight">
                Spiritual &amp; Mindset Protocol
              </h3>
              <span className="text-[9px] font-mono text-tertiary uppercase tracking-widest block mt-0.5">
                SUBLIMINAL RE-ENGAGEMENT
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-secondary bg-secondary-container/20 border border-secondary/40 px-2.5 py-0.5 rounded">
            {manifDoneCount}/3 LOCKED
          </span>
        </div>

        {/* Sub-section 1: Manifestation Checkpoints */}
        <div
          onClick={() => router.push('/modals/manifestation' as any)}
          className="cursor-pointer space-y-2"
        >
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-on-surface-variant uppercase tracking-wider">
              MANIFESTATION CHECKPOINTS
            </span>
            <span className="text-primary-container">
              Evening Locks {state.settings.manifestationEveningTime}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Morning */}
            <div
              className={`bg-surface-container-lowest p-2.5 rounded-lg text-center border transition-all duration-200 relative ${
                morningEntry
                  ? 'border-primary-container/50 shadow-[inset_0_1px_0_0_rgba(249,115,22,0.3)]'
                  : 'border-outline-variant/40'
              }`}
            >
              <div className="flex justify-end mb-0.5">
                <span
                  className={`text-[8px] font-mono font-bold uppercase ${
                    morningEntry ? 'text-emerald-400' : 'text-secondary'
                  }`}
                >
                  {morningEntry ? 'PASS' : 'ARMED'}
                </span>
              </div>
              <span
                className={`material-symbols-outlined text-base ${
                  morningEntry ? 'text-primary-container' : 'text-tertiary'
                }`}
              >
                {morningEntry ? 'check_circle' : 'schedule'}
              </span>
              <p className="text-label-md font-bold text-white mt-1">
                Morning
              </p>
              <span className="text-[9px] font-mono text-primary-container block mt-0.5">
                {morningEntry
                  ? '07:15 AM'
                  : `${state.settings.manifestationMorningTime} Lock`}
              </span>
            </div>

            {/* Midday */}
            <div
              className={`bg-surface-container-lowest p-2.5 rounded-lg text-center border transition-all duration-200 relative ${
                afternoonEntry
                  ? 'border-primary-container/50 shadow-[inset_0_1px_0_0_rgba(249,115,22,0.3)]'
                  : 'border-outline-variant/40'
              }`}
            >
              <div className="flex justify-end mb-0.5">
                <span
                  className={`text-[8px] font-mono font-bold uppercase ${
                    afternoonEntry ? 'text-emerald-400' : 'text-secondary'
                  }`}
                >
                  {afternoonEntry ? 'PASS' : 'ARMED'}
                </span>
              </div>
              <span
                className={`material-symbols-outlined text-base ${
                  afternoonEntry ? 'text-primary-container' : 'text-tertiary'
                }`}
              >
                {afternoonEntry ? 'check_circle' : 'schedule'}
              </span>
              <p className="text-label-md font-bold text-white mt-1">
                Midday
              </p>
              <span className="text-[9px] font-mono text-primary-container block mt-0.5">
                {afternoonEntry
                  ? '01:40 PM'
                  : `${state.settings.manifestationAfternoonTime} Lock`}
              </span>
            </div>

            {/* Evening */}
            <div
              className={`bg-surface-container-lowest p-2.5 rounded-lg text-center border transition-all duration-200 relative ${
                eveningEntry
                  ? 'border-primary-container/50 shadow-[inset_0_1px_0_0_rgba(249,115,22,0.3)]'
                  : 'border-outline-variant/40'
              }`}
            >
              <div className="flex justify-end mb-0.5">
                <span
                  className={`text-[8px] font-mono font-bold uppercase ${
                    eveningEntry ? 'text-emerald-400' : 'text-secondary'
                  }`}
                >
                  {eveningEntry ? 'PASS' : 'ARMED'}
                </span>
              </div>
              <span
                className={`material-symbols-outlined text-base ${
                  eveningEntry ? 'text-primary-container' : 'text-tertiary'
                }`}
              >
                {eveningEntry ? 'check_circle' : 'schedule'}
              </span>
              <p className="text-label-md font-bold text-white mt-1">
                Evening
              </p>
              <span className="text-[9px] font-mono text-secondary block mt-0.5">
                {eveningEntry
                  ? '09:00 PM'
                  : `${state.settings.manifestationEveningTime} Lock`}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-section 2: Bible Verse of the Day // 0XPHIL */}
        <div className="rounded-xl bg-surface-container-lowest p-3.5 machined-border">
          <div
            onClick={() => router.push('/modals/bible' as any)}
            className="cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-mono text-primary-container font-bold tracking-wider uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">book_5</span>
                <span>BIBLE VERSE OF THE DAY // 0XPHIL</span>
              </span>
              <span className="text-[8px] font-mono bg-surface-container-high text-tertiary px-2 py-0.5 rounded border border-outline-variant/40 uppercase flex-shrink-0">
                {verseOfTheDay.testament === 'NT' ? 'NT // VERIFIED' : 'OT // VERIFIED'}
              </span>
            </div>
            <blockquote className="text-body-md font-body-md text-white italic mb-2.5 leading-relaxed">
              &ldquo;
              {lang === 'sl' && !preserveEn
                ? verseOfTheDay.textSl
                : verseOfTheDay.textEn}
              &rdquo;
            </blockquote>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-surface-variant/40">
            <span
              onClick={() => router.push('/modals/bible' as any)}
              className="text-[11px] font-mono text-primary-container font-bold uppercase tracking-wider cursor-pointer"
            >
              {lang === 'sl' && !preserveEn
                ? verseOfTheDay.referenceSl
                : verseOfTheDay.referenceEn}
            </span>
            <button
              onClick={() => toggleFavoriteVerse(verseOfTheDay.id)}
              className="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant/50 text-[9px] font-mono text-tertiary hover:text-white flex items-center gap-1 transition-colors uppercase"
            >
              <span
                className="material-symbols-outlined text-xs text-primary"
                style={
                  isVerseSaved ? { fontVariationSettings: "'FILL' 1" } : undefined
                }
              >
                bookmark
              </span>
              <span>{isVerseSaved ? 'SAVED' : 'SAVE'}</span>
            </button>
          </div>
        </div>

        {/* Sub-section 3: Weekly Accountability Grid */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-on-surface-variant uppercase tracking-wider">
              WEEKLY ACCOUNTABILITY GRID
            </span>
            <span className="text-primary-container font-bold uppercase">
              CYCLE_{weekNumber}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Physique Check */}
            <div
              onClick={() => router.replace('/(tabs)/progress' as any)}
              className="p-2.5 bg-surface-container-lowest rounded-lg machined-border cursor-pointer hover:bg-surface-container-high transition-colors flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <span className="material-symbols-outlined text-base">
                  {hasPhotoThisWeek ? 'verified' : 'photo_camera'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-label-md font-bold text-white truncate">
                  Physique Check
                </p>
                <span
                  className={`text-[9px] font-mono block ${
                    hasPhotoThisWeek ? 'text-emerald-400' : 'text-tertiary'
                  }`}
                >
                  {hasPhotoThisWeek ? '07:45 AM OK' : 'MON CHECK DUE'}
                </span>
              </div>
            </div>

            {/* Weekly Review */}
            <div
              onClick={() => router.push('/modals/weekly-review' as any)}
              className="p-2.5 bg-surface-container-lowest rounded-lg machined-border cursor-pointer hover:bg-surface-container-high transition-colors flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-md bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary flex-shrink-0">
                <span className="material-symbols-outlined text-base">
                  {hasWeeklyReviewThisWeek ? 'task_alt' : 'event_upcoming'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-label-md font-bold text-white truncate">
                  Weekly Review
                </p>
                <span className="text-[9px] font-mono text-tertiary block">
                  {hasWeeklyReviewThisWeek
                    ? 'SUBMITTED OK'
                    : `Sun ${state.settings.weeklyReviewTime} (6d)`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PerformanceHQShell>
  );
}
