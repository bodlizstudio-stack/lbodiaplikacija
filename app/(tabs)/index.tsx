import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/store/AppContext';
import { LBODIShell, CrossIcon, SacredDivider } from '../../src/components/LBODIShell';
import { AUTHENTIC_BIBLE_VERSES } from '../../src/data/seedData';
import {
  DAILY_REFLECTION_QUESTIONS,
  DEFAULT_DASHBOARD_SECTIONS,
  DEFAULT_DISCIPLINE_PRIVACY,
  DEFAULT_NUTRITION_TARGETS,
} from '../../src/data/faithData';
import {
  calculateCompletedDaysStreak,
  calculateNext14DayReminder,
  calculateNoFapStreak,
  getDailyReflectionIndex,
  getDailyScriptureIndex,
  getLjubljanaHour,
  isEveningHour,
} from '../../src/utils/dateUtils';
import { DashboardSectionId } from '../../src/types';

export default function HomeDashboardScreen() {
  const router = useRouter();
  const {
    state,
    todayDateStr,
    toggleHabitCompletion,
    toggleGymRestDay,
    getGymRestDaysUsedThisWeek,
    toggleFavoriteVerse,
    saveDailyReflection,
    updateDashboardSections,
    pushInAppNotification,
  } = useApp();

  const lang = state.settings.language;
  const tz = state.settings.timezone || 'Europe/Ljubljana';
  const localHour = getLjubljanaHour(new Date(), tz);
  const isEvening = isEveningHour(tz);

  const [restAlertMsg, setRestAlertMsg] = useState<string | null>(null);
  const [customizeVisible, setCustomizeVisible] = useState(false);

  // Live ticker only updates when viewing screen; streak itself derives from persisted startTimestamp
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // Greeting by local time
  const greetingText = useMemo(() => {
    if (lang === 'en') {
      if (localHour < 11) return 'Good morning, Luka.';
      if (localHour < 18) return 'Good afternoon, Luka.';
      return 'Good evening, Luka.';
    }
    if (localHour < 11) return 'Dobro jutro, Luka.';
    if (localHour < 18) return 'Dober dan, Luka.';
    return 'Dober večer, Luka.';
  }, [lang, localHour]);

  const greetingSubText = useMemo(() => {
    if (lang === 'en') {
      return isEvening
        ? 'Close this day in peace, gratitude, and prayer.'
        : 'God has given you another day to grow in Christ.';
    }
    return isEvening
      ? 'Zaključi današnji dan v miru, hvaležnosti in molitvi.'
      : 'Bog ti je podaril nov dan. Danes je nova priložnost za rast z Bogom.';
  }, [lang, isEvening]);

  // Deterministic Daily Scripture (does not shuffle on reload)
  const verseOfTheDay = useMemo(() => {
    const idx = getDailyScriptureIndex(todayDateStr, AUTHENTIC_BIBLE_VERSES.length);
    return AUTHENTIC_BIBLE_VERSES[idx] || AUTHENTIC_BIBLE_VERSES[0];
  }, [todayDateStr]);
  const isVerseSaved = state.favoriteVerseIds.includes(verseOfTheDay.id);

  // Deterministic Daily Reflection Question + inline saved answer
  const reflectionQuestionObj = useMemo(() => {
    const idx = getDailyReflectionIndex(todayDateStr, DAILY_REFLECTION_QUESTIONS.length);
    return DAILY_REFLECTION_QUESTIONS[idx] || DAILY_REFLECTION_QUESTIONS[0];
  }, [todayDateStr]);
  const reflectionQuestionText =
    lang === 'sl' ? reflectionQuestionObj.sl : reflectionQuestionObj.en;
  const savedReflection = state.dailyReflections?.[todayDateStr];
  const [reflectionAnswer, setReflectionAnswer] = useState(savedReflection?.answer || '');
  const [reflectionSavedToast, setReflectionSavedToast] = useState(false);

  useEffect(() => {
    setReflectionAnswer(savedReflection?.answer || '');
  }, [savedReflection?.answer, todayDateStr]);

  // Daily progress & habits
  const todayRecords = useMemo(
    () => state.dailyHabitRecords.filter((r) => r.date === todayDateStr),
    [state.dailyHabitRecords, todayDateStr]
  );
  const completedCount = todayRecords.filter((r) => r.completed).length;
  const scheduledCount = todayRecords.length;
  const completionPct =
    scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 100;
  const completedDaysStreak = useMemo(
    () => calculateCompletedDaysStreak(state.dailySummaries, todayDateStr),
    [state.dailySummaries, todayDateStr]
  );
  const gymRestUsedThisWeek = getGymRestDaysUsedThisWeek(todayDateStr);

  // Discipline summary (No Fap / Purity)
  const disciplinePrivacy = state.settings.disciplinePrivacy || DEFAULT_DISCIPLINE_PRIVACY;
  const nofapLive = useMemo(
    () => calculateNoFapStreak(state.nofapState.startTimestamp, nowMs),
    [state.nofapState.startTimestamp, nowMs]
  );

  // Lifestyle Vision & 14-day schedule
  const latestVision = state.visionVersions?.[0];
  const visionTextPreview =
    latestVision?.visionStatement ||
    state.visionDraft?.visionStatement ||
    (lang === 'sl'
      ? 'Opiši življenje, ki ga z Božjo pomočjo gradiš vsak dan.'
      : 'Define the Christian life and habits you are building step by step.');
  const anchorDate = state.settings.visionReminderAnchorDate || todayDateStr;
  const biweeklyStatus = useMemo(
    () => calculateNext14DayReminder(anchorDate, todayDateStr),
    [anchorDate, todayDateStr]
  );

  // Trigger honest in-app reminder notification if 14-day vision review is due today
  useEffect(() => {
    if (biweeklyStatus.isDueToday) {
      pushInAppNotification({
        reminderType: 'biweekly_vision',
        date: todayDateStr,
        title: lang === 'sl' ? '14-dnevni pregled vizije' : '14-Day Lifestyle Vision Check',
        body:
          lang === 'sl'
            ? 'Minilo je 14 dni. Poglej svojo vizijo in preveri, ali tvoje navade vodijo v pravo smer.'
            : '14 days have passed. Revisit your lifestyle vision and align your habits.',
        route: '/modals/vision',
      });
    }
  }, [biweeklyStatus.isDueToday, todayDateStr, lang, pushInAppNotification]);

  // Nutrition summary today
  const todayNutrition = state.nutritionEntries?.[todayDateStr];
  const nutritionTargets = state.settings.nutritionTargets || DEFAULT_NUTRITION_TARGETS;

  // Section personalization
  const sectionConfigs = useMemo(() => {
    const raw = state.settings.dashboardSections;
    if (raw && raw.length > 0) return raw;
    return DEFAULT_DASHBOARD_SECTIONS;
  }, [state.settings.dashboardSections]);

  const moveSection = async (idx: number, delta: -1 | 1) => {
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= sectionConfigs.length) return;
    const copy = [...sectionConfigs];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    await updateDashboardSections(copy);
  };

  const toggleSectionEnabled = async (id: DashboardSectionId) => {
    const copy = sectionConfigs.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    await updateDashboardSections(copy);
  };

  const handleGymRestClick = async (e: React.MouseEvent, habitId: string) => {
    e.stopPropagation();
    const res = await toggleGymRestDay(todayDateStr, habitId);
    if (!res.ok) {
      setRestAlertMsg(
        lang === 'sl'
          ? 'Največ 2 dni počitka na teden sta že porabljena (2/2). Danes je priložnost za trening.'
          : 'Maximum 2 rest days in one week already used (2/2).'
      );
      setTimeout(() => setRestAlertMsg(null), 4500);
    } else {
      setRestAlertMsg(null);
    }
  };

  const handleSaveReflection = async () => {
    if (!reflectionAnswer.trim()) return;
    await saveDailyReflection(todayDateStr, reflectionQuestionText, reflectionAnswer.trim());
    setReflectionSavedToast(true);
    setTimeout(() => setReflectionSavedToast(false), 2000);
  };

  const circumference = 238.76; // 2 * Math.PI * 38
  const strokeDashoffset = (
    circumference -
    (Math.min(100, Math.max(0, completionPct)) / 100) * circumference
  ).toFixed(2);

  const sectionLabels: Record<DashboardSectionId, string> = {
    scripture: lang === 'sl' ? 'Današnja Božja beseda' : 'Daily Scripture',
    dailyReflection: lang === 'sl' ? 'Dnevno razmišljanje' : 'Daily Reflection',
    dailyProgress: lang === 'sl' ? 'Današnji napredek navad' : 'Daily Progress',
    quickActions: lang === 'sl' ? 'Hitri dostop' : 'Quick Access',
    discipline: disciplinePrivacy.customTitle || 'Disciplina in čistost',
    vision: lang === 'sl' ? 'Življenje, ki ga gradim' : 'My Lifestyle Vision',
    nutrition: lang === 'sl' ? 'Prehrana danes' : 'Today’s Nutrition',
    eveningReflection: lang === 'sl' ? 'Večerni pregled in zahvala' : 'Evening Reflection',
  };

  const orderedVisibleIds = useMemo(() => {
    const ids = sectionConfigs.filter((s) => s.enabled).map((s) => s.id);
    // In evening hours, naturally elevate eveningReflection closer to top (after scripture)
    if (isEvening && ids.includes('eveningReflection')) {
      const withoutEvening = ids.filter((id) => id !== 'eveningReflection');
      const scripturePos = withoutEvening.indexOf('scripture');
      withoutEvening.splice(scripturePos >= 0 ? scripturePos + 1 : 0, 0, 'eveningReflection');
      return withoutEvening;
    }
    return ids;
  }, [sectionConfigs, isEvening]);

  const renderSection = (id: DashboardSectionId) => {
    switch (id) {
      case 'scripture':
        return (
          <section
            key="scripture"
            className="lbodi-card thermal-top-edge p-4 sm:p-5 space-y-3 relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[var(--accent-gold)]">
                <CrossIcon size={14} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                  {lang === 'sl' ? 'Današnja Božja beseda' : 'Daily Scripture'}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                {lang === 'sl'
                  ? verseOfTheDay.translationSl || 'Chraska'
                  : verseOfTheDay.translationEn || 'KJV'}
              </span>
            </div>

            <blockquote className="font-sacred text-xl sm:text-2xl leading-snug text-[var(--text-main)] italic">
              &ldquo;{lang === 'sl' ? verseOfTheDay.textSl : verseOfTheDay.textEn}&rdquo;
            </blockquote>

            <p className="text-xs font-semibold text-[var(--accent-gold)] tracking-wide">
              {lang === 'sl' ? verseOfTheDay.referenceSl : verseOfTheDay.referenceEn}
            </p>

            {(verseOfTheDay.reflectionSl || verseOfTheDay.reflectionEn) && (
              <p className="text-xs text-[var(--text-muted)] leading-relaxed pt-2 border-t border-[var(--border-subtle)]">
                {lang === 'sl' ? verseOfTheDay.reflectionSl : verseOfTheDay.reflectionEn}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => router.replace('/(tabs)/faith' as any)}
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-main)] hover:border-[var(--border-gold)] transition-colors"
              >
                {lang === 'sl' ? 'Preberi več' : 'Read More'}
              </button>
              <button
                onClick={() => toggleFavoriteVerse(verseOfTheDay.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors ${
                  isVerseSaved
                    ? 'bg-[var(--accent-gold)]/15 border-[var(--border-gold)] text-[var(--accent-gold)]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                }`}
              >
                <span
                  className="material-symbols-outlined text-sm"
                  style={isVerseSaved ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  bookmark
                </span>
                <span>{isVerseSaved ? (lang === 'sl' ? 'Shranjeno' : 'Saved') : (lang === 'sl' ? 'Shrani' : 'Save')}</span>
              </button>
              <button
                onClick={() => router.push('/modals/journal' as any)}
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--accent-olive)] hover:border-[var(--accent-olive)] transition-colors"
              >
                {lang === 'sl' ? 'Razmisli' : 'Reflect'}
              </button>
            </div>
          </section>
        );

      case 'dailyReflection':
        return (
          <section key="dailyReflection" className="lbodi-card p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-olive)]">
                {lang === 'sl' ? 'Dnevno vprašanje' : 'Daily Reflection'}
              </span>
              {reflectionSavedToast && (
                <span className="text-[11px] font-medium text-emerald-400">
                  {lang === 'sl' ? 'Shranjeno ✓' : 'Saved ✓'}
                </span>
              )}
            </div>
            <p className="font-sacred text-lg font-medium text-[var(--text-main)]">
              {reflectionQuestionText}
            </p>
            <div className="flex gap-2">
              <input
                value={reflectionAnswer}
                onChange={(e) => setReflectionAnswer(e.target.value)}
                placeholder={
                  lang === 'sl'
                    ? 'Zapiši kratek, iskren odgovor...'
                    : 'Write a brief, honest reflection...'
                }
                className="flex-1 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-main)] focus:border-[var(--accent-gold)] focus:outline-none"
              />
              <button
                onClick={handleSaveReflection}
                className="px-3.5 py-2 rounded-xl lbodi-gold-btn text-xs whitespace-nowrap"
              >
                {lang === 'sl' ? 'Shrani' : 'Save'}
              </button>
            </div>
          </section>
        );

      case 'dailyProgress':
        return (
          <section key="dailyProgress" className="lbodi-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                  {lang === 'sl' ? 'Današnji ritem' : 'Today’s Progress'}
                </span>
                <h3 className="text-base font-semibold text-[var(--text-main)]">
                  {lang === 'sl' ? 'Navade in odgovornost' : 'Habits & Stewardship'}
                </h3>
              </div>
              <button
                onClick={() => router.replace('/(tabs)/habits' as any)}
                className="text-xs font-medium text-[var(--accent-gold)] hover:underline"
              >
                {lang === 'sl' ? 'Vse navade →' : 'All Habits →'}
              </button>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)]">
              <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
                  <circle
                    cx="44"
                    cy="44"
                    r="38"
                    fill="transparent"
                    stroke="var(--border-subtle)"
                    strokeWidth="7"
                  />
                  <circle
                    cx="44"
                    cy="44"
                    r="38"
                    fill="transparent"
                    stroke="var(--accent-gold)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <span className="absolute text-base font-bold text-[var(--text-main)]">
                  {completionPct}%
                </span>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-semibold text-[var(--text-main)]">
                  {completedCount} / {scheduledCount}{' '}
                  {lang === 'sl' ? 'opravljenih navad' : 'habits completed'}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {lang === 'sl'
                    ? `Doslednost: ${completedDaysStreak} dni zapored • Napredek, ne popolnost.`
                    : `Consistency: ${completedDaysStreak} consecutive days • Progress, not perfection.`}
                </p>
              </div>
            </div>

            {restAlertMsg && (
              <div className="p-2.5 rounded-xl bg-red-900/20 border border-red-400/40 text-red-300 text-xs">
                {restAlertMsg}
              </div>
            )}

            <div className="space-y-2">
              {todayRecords.slice(0, 6).map((rec) => {
                const displayTitle =
                  lang === 'en' && rec.habitTitleSnapshot.includes('/')
                    ? rec.habitTitleSnapshot.split('/')[1].trim()
                    : rec.habitTitleSnapshot.split('/')[0].trim();

                const isGymHabit =
                  rec.habitId === 'habit-gym' ||
                  rec.habitCategorySnapshot === 'fitness' ||
                  rec.habitTitleSnapshot.toLowerCase().includes('gym') ||
                  rec.habitTitleSnapshot.toLowerCase().includes('fitnes');
                const isRestDayToday = Boolean(rec.isRestDay || rec.notes === 'GYM_REST_DAY');

                return (
                  <div
                    key={rec.id}
                    className="rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] overflow-hidden"
                  >
                    <div
                      onClick={() => toggleHabitCompletion(todayDateStr, rec.habitId)}
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-[var(--bg-elevated)]/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                            rec.completed
                              ? isRestDayToday
                                ? 'bg-[var(--accent-olive)] text-white'
                                : 'bg-[var(--accent-gold)] text-[#0B1220]'
                              : 'border border-[var(--border-gold)] bg-transparent'
                          }`}
                        >
                          {rec.completed && (
                            <span className="material-symbols-outlined text-sm font-bold">
                              {isRestDayToday ? 'bedtime' : 'check'}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-sm truncate ${
                              rec.completed
                                ? 'line-through text-[var(--text-muted)]'
                                : 'text-[var(--text-main)] font-medium'
                            }`}
                          >
                            {displayTitle}
                          </p>
                          {isRestDayToday && (
                            <span className="text-[11px] text-[var(--accent-olive)]">
                              {lang === 'sl'
                                ? `Počitek zabeležen (${gymRestUsedThisWeek}/2 ta teden)`
                                : `Rest day logged (${gymRestUsedThisWeek}/2 this week)`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isGymHabit && (
                      <div className="px-3 py-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 text-[11px] bg-[var(--bg-surface)]/50">
                        <span className="text-[var(--text-muted)]">
                          {lang === 'sl'
                            ? `Počitek ta teden: ${gymRestUsedThisWeek}/2`
                            : `Weekly rest days: ${gymRestUsedThisWeek}/2`}
                        </span>
                        <button
                          onClick={(e) => handleGymRestClick(e, rec.habitId)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                            isRestDayToday
                              ? 'bg-[var(--accent-olive)] text-white border-transparent'
                              : 'border-[var(--border-subtle)] text-[var(--text-main)] bg-[var(--bg-elevated)]'
                          }`}
                        >
                          {isRestDayToday
                            ? lang === 'sl'
                              ? '✓ Počitek danes (Prekliči)'
                              : '✓ Rest Today (Undo)'
                            : lang === 'sl'
                            ? 'Danes sem imel počitek'
                            : 'I had a rest today'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );

      case 'quickActions':
        return (
          <section key="quickActions" className="grid grid-cols-3 gap-2.5">
            {[
              { label: lang === 'sl' ? 'Molitev' : 'Prayer', icon: 'favorite', route: '/(tabs)/faith' },
              { label: lang === 'sl' ? 'Hvaležnost' : 'Gratitude', icon: 'volunteer_activism', route: '/modals/gratitude' },
              { label: lang === 'sl' ? 'Navade' : 'Habits', icon: 'check_circle', route: '/(tabs)/habits' },
              { label: lang === 'sl' ? 'Disciplina' : 'Discipline', icon: 'shield', route: '/modals/nofap' },
              { label: lang === 'sl' ? 'Moj cilj' : 'My Goals', icon: 'flag', route: '/modals/goals' },
              { label: lang === 'sl' ? 'Napredek' : 'Progress', icon: 'monitoring', route: '/(tabs)/progress' },
            ].map((q) => (
              <button
                key={q.route}
                onClick={() =>
                  q.route.startsWith('/(tabs)')
                    ? router.replace(q.route as any)
                    : router.push(q.route as any)
                }
                className="lbodi-card p-3 flex flex-col items-center justify-center gap-1.5 hover:border-[var(--border-gold)] active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-xl text-[var(--accent-gold)]">
                  {q.icon}
                </span>
                <span className="text-xs font-medium text-[var(--text-main)]">{q.label}</span>
              </button>
            ))}
          </section>
        );

      case 'discipline':
        if (disciplinePrivacy.hideFromDashboard) return null;
        return (
          <section
            key="discipline"
            onClick={() => router.push('/modals/nofap' as any)}
            className="lbodi-card p-4 cursor-pointer hover:border-[var(--border-gold)] transition-colors space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--accent-gold)]">shield</span>
                <h3 className="text-sm font-semibold text-[var(--text-main)]">
                  {disciplinePrivacy.customTitle || (lang === 'sl' ? 'Disciplina in čistost' : 'Purity & Self-Control')}
                </h3>
              </div>
              <span className="text-xs font-bold text-[var(--accent-gold)]">
                {nofapLive.days} {lang === 'sl' ? 'dni' : 'days'}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {lang === 'sl'
                ? 'Tiha zvestoba in samokontrola vsak dan. Ko pride skušnjava, se obrni na Gospoda.'
                : 'Quiet daily self-control and integrity. Turn to God whenever temptation knocks.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/modals/nofap?emergency=1' as any);
                }}
                className="flex-1 py-2 rounded-xl lbodi-gold-btn text-xs"
              >
                {lang === 'sl' ? 'Potrebujem moč' : 'I Need Strength'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/modals/nofap' as any);
                }}
                className="px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)]"
              >
                {lang === 'sl' ? 'Odpri' : 'Open'}
              </button>
            </div>
          </section>
        );

      case 'vision':
        return (
          <section key="vision" className="lbodi-card p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-wider text-[var(--accent-gold)] font-semibold">
                {lang === 'sl' ? 'Življenje, ki ga gradim' : 'My God-Centered Vision'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--accent-olive)] font-semibold">
                {biweeklyStatus.isDueToday
                  ? lang === 'sl'
                    ? 'Pregled danes'
                    : 'Review Due Today'
                  : lang === 'sl'
                  ? `Pregled čez ${biweeklyStatus.daysUntil} dni`
                  : `Review in ${biweeklyStatus.daysUntil}d`}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-main)] leading-relaxed line-clamp-3">
              {visionTextPreview}
            </p>
            <button
              onClick={() => router.push('/modals/vision' as any)}
              className="px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--accent-gold)] hover:border-[var(--border-gold)] transition-colors"
            >
              {lang === 'sl' ? 'Preberi svojo vizijo' : 'Read My Vision'}
            </button>
          </section>
        );

      case 'nutrition':
        return (
          <section
            key="nutrition"
            onClick={() => router.push('/modals/nutrition' as any)}
            className="lbodi-card p-4 cursor-pointer hover:border-[var(--border-gold)] transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                {lang === 'sl' ? 'Prehrana danes (Cal AI / Ročno)' : 'Nutrition Today'}
              </span>
              <span className="text-[11px] text-[var(--accent-gold)] font-medium">
                {todayNutrition
                  ? `${todayNutrition.calories} / ${nutritionTargets.calories} kcal`
                  : lang === 'sl'
                  ? 'Brez vnosa danes'
                  : 'Not logged today'}
              </span>
            </div>
            {todayNutrition ? (
              <p className="text-xs text-[var(--text-muted)]">
                B: {todayNutrition.proteinG}g / {nutritionTargets.proteinG}g • OH:{' '}
                {todayNutrition.carbsG}g • M: {todayNutrition.fatG}g
              </p>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">
                {lang === 'sl'
                  ? 'Dotakni se za hiter ročni vnos ali uvoz izvoza iz Cal AI (CSV/JSON/PDF).'
                  : 'Tap to log macros manually or import a Cal AI export.'}
              </p>
            )}
          </section>
        );

      case 'eveningReflection':
        return (
          <section
            key="eveningReflection"
            className={`lbodi-card p-4 space-y-2.5 ${
              isEvening ? 'border-[var(--border-gold)] thermal-glow' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--accent-gold)] text-lg">
                  nights_stay
                </span>
                <h3 className="text-sm font-semibold text-[var(--text-main)]">
                  {lang === 'sl' ? 'Večerna umiritev in zahvala' : 'Evening Prayer & Gratitude'}
                </h3>
              </div>
              {isEvening && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] font-semibold">
                  {lang === 'sl' ? 'Večer' : 'Evening'}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {lang === 'sl'
                ? 'Pred spanjem se zahvali Gospodu za blagoslove dneva, zapiši kratko molitev in pripravi srce na jutri.'
                : 'Thank the Lord before rest, pray honestly, and finish a 30-second check-in.'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => router.push('/modals/gratitude' as any)}
                className="py-2 px-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px] font-medium text-[var(--text-main)]"
              >
                {lang === 'sl' ? 'Hvaležnost' : 'Gratitude'}
              </button>
              <button
                onClick={() => router.replace('/(tabs)/faith?tab=prayer' as any)}
                className="py-2 px-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px] font-medium text-[var(--text-main)]"
              >
                {lang === 'sl' ? 'Večerna molitev' : 'Prayer'}
              </button>
              <button
                onClick={() => router.push('/modals/fitness' as any)}
                className="py-2 px-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px] font-medium text-[var(--text-main)]"
              >
                {lang === 'sl' ? 'Check-in (30s)' : 'Check-In'}
              </button>
            </div>
          </section>
        );
    }
  };

  return (
    <LBODIShell>
      {/* Section A — Greeting */}
      <section className="flex items-start justify-between gap-3 px-0.5">
        <div>
          <h1 className="font-sacred text-3xl sm:text-4xl font-semibold text-[var(--text-main)] tracking-tight leading-tight">
            {greetingText}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            {greetingSubText}
          </p>
        </div>

        <button
          onClick={() => setCustomizeVisible(true)}
          className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--accent-gold)] flex items-center gap-1 flex-shrink-0"
          title={lang === 'sl' ? 'Prilagodi začetni zaslon' : 'Customize Home'}
        >
          <span className="material-symbols-outlined text-sm">dashboard_customize</span>
          <span className="hidden sm:inline">{lang === 'sl' ? 'Prilagodi' : 'Layout'}</span>
        </button>
      </section>

      <SacredDivider label={lang === 'sl' ? 'Vera pred strahom' : 'Walk With Christ'} />

      {orderedVisibleIds.map((id) => renderSection(id))}

      {/* Customize Home Layout Overlay */}
      {customizeVisible && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md lbodi-card p-5 space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--text-main)]">
                {lang === 'sl' ? 'Prilagodi domači zaslon' : 'Customize Home Dashboard'}
              </h3>
              <button
                onClick={() => setCustomizeVisible(false)}
                className="text-[var(--text-muted)]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {lang === 'sl'
                ? 'Vklopi, izklopi ali spremeni vrstni red kartic.'
                : 'Show, hide, or reorder dashboard sections.'}
            </p>
            <div className="space-y-2">
              {sectionConfigs.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="p-2.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] flex items-center justify-between gap-2"
                >
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={sec.enabled}
                      onChange={() => toggleSectionEnabled(sec.id)}
                      className="rounded accent-amber-500 w-4 h-4"
                    />
                    <span className="text-xs font-medium text-[var(--text-main)]">
                      {sectionLabels[sec.id]}
                    </span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveSection(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_upward</span>
                    </button>
                    <button
                      onClick={() => moveSection(idx, 1)}
                      disabled={idx === sectionConfigs.length - 1}
                      className="p-1 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_downward</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </LBODIShell>
  );
}
