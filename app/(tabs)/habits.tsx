import React, { useMemo, useState } from 'react';
import { useApp } from '../../src/store/AppContext';
import { PerformanceHQShell } from '../../src/components/PerformanceHQShell';
import {
  Habit,
  HabitCategory,
  HabitPriority,
  HabitRepeatType,
} from '../../src/types';

const CATEGORIES: { value: HabitCategory; labelSl: string; labelEn: string; icon: string }[] = [
  { value: 'fitness', labelSl: 'Fitnes', labelEn: 'Fitness', icon: 'fitness_center' },
  { value: 'nutrition', labelSl: 'Prehrana', labelEn: 'Nutrition', icon: 'restaurant' },
  { value: 'faith', labelSl: 'Vera', labelEn: 'Faith', icon: 'menu_book' },
  { value: 'mindset', labelSl: 'Misli', labelEn: 'Mindset', icon: 'auto_awesome' },
  { value: 'study', labelSl: 'Študij', labelEn: 'Study', icon: 'school' },
  { value: 'work', labelSl: 'Projekti', labelEn: 'Work', icon: 'terminal' },
  { value: 'recovery', labelSl: 'Spanje', labelEn: 'Recovery', icon: 'bedtime' },
  { value: 'discipline', labelSl: 'Disciplina', labelEn: 'Discipline', icon: 'shield' },
];

const PRIORITIES: { value: HabitPriority; labelSl: string; labelEn: string }[] = [
  { value: 'critical', labelSl: 'Kritična', labelEn: 'Critical' },
  { value: 'high', labelSl: 'Visoka', labelEn: 'High' },
  { value: 'medium', labelSl: 'Srednja', labelEn: 'Medium' },
  { value: 'low', labelSl: 'Nizka', labelEn: 'Low' },
];

const WEEKDAYS = [
  { day: 1, sl: 'Pon', en: 'Mon' },
  { day: 2, sl: 'Tor', en: 'Tue' },
  { day: 3, sl: 'Sre', en: 'Wed' },
  { day: 4, sl: 'Čet', en: 'Thu' },
  { day: 5, sl: 'Pet', en: 'Fri' },
  { day: 6, sl: 'Sob', en: 'Sat' },
  { day: 0, sl: 'Ned', en: 'Sun' },
];

export default function HabitsScreen() {
  const {
    state,
    todayDateStr,
    tr,
    toggleHabitCompletion,
    toggleGymRestDay,
    getGymRestDaysUsedThisWeek,
    saveHabit,
    deleteHabit,
    togglePauseHabit,
    updateDailySummaryNotes,
  } = useApp();

  const lang = state.settings.language;
  const [subTab, setSubTab] = useState<'today' | 'manage'>('today');
  const [restAlertMsg, setRestAlertMsg] = useState<string | null>(null);
  const gymRestUsedThisWeek = getGymRestDaysUsedThisWeek(todayDateStr);

  const handleGymRestClick = async (e: React.MouseEvent, habitId: string) => {
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

  // Form Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('discipline');
  const [priority, setPriority] = useState<HabitPriority>('high');
  const [repeatType, setRepeatType] = useState<HabitRepeatType>('daily');
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [reminderTime, setReminderTime] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [formError, setFormError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const todayRecords = useMemo(
    () => state.dailyHabitRecords.filter((r) => r.date === todayDateStr),
    [state.dailyHabitRecords, todayDateStr]
  );

  const activeRecords = useMemo(
    () => todayRecords.filter((r) => !r.completed),
    [todayRecords]
  );
  const completedRecords = useMemo(
    () => todayRecords.filter((r) => r.completed),
    [todayRecords]
  );

  const todaySummary = state.dailySummaries[todayDateStr] || {
    date: todayDateStr,
    scheduledCount: todayRecords.length,
    completedCount: completedRecords.length,
    completionPct: 0,
    disciplineScore: 0,
    notes: '',
    updatedAt: '',
  };

  const openNewHabitModal = () => {
    setEditingHabitId(undefined);
    setTitle('');
    setDescription('');
    setCategory('discipline');
    setPriority('high');
    setRepeatType('daily');
    setRepeatDays([1, 2, 3, 4, 5, 6, 0]);
    setReminderTime('');
    setTargetValue('');
    setUnit('');
    setFormError('');
    setModalVisible(true);
  };

  const openEditHabitModal = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setTitle(habit.title);
    setDescription(habit.description);
    setCategory(habit.category);
    setPriority(habit.priority);
    setRepeatType(habit.repeatType);
    setRepeatDays(habit.repeatDays || [1, 2, 3, 4, 5, 6, 0]);
    setReminderTime(habit.reminderTime || '');
    setTargetValue(habit.targetValue ? String(habit.targetValue) : '');
    setUnit(habit.unit || '');
    setFormError('');
    setModalVisible(true);
  };

  const handleSaveHabit = async () => {
    if (!title.trim()) {
      setFormError(
        lang === 'sl' ? 'Vnesi naziv naloge.' : 'Please enter a habit title.'
      );
      return;
    }
    await saveHabit({
      id: editingHabitId,
      title: title.trim(),
      description: description.trim(),
      category,
      icon: 'checkbox',
      priority,
      color: '#F97316',
      repeatType,
      repeatDays: repeatType === 'weekdays' ? repeatDays : [0, 1, 2, 3, 4, 5, 6],
      targetDate: repeatType === 'one_time' ? todayDateStr : undefined,
      reminderTime: reminderTime.trim() || undefined,
      targetValue: targetValue ? parseFloat(targetValue) : undefined,
      unit: unit.trim() || undefined,
      isPaused: false,
      isArchived: false,
    });
    setModalVisible(false);
  };

  const toggleWeekday = (d: number) => {
    setRepeatDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  return (
    <PerformanceHQShell>
      {/* Top Telemetry Banner */}
      <section className="rounded-xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low p-space-md machined-border thermal-top-edge">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-label-sm font-label-sm text-primary uppercase tracking-widest">
              DAILY EXECUTION PROTOCOL
            </span>
            <h2 className="text-headline-md font-headline-md text-white">
              {tr('habitsTitle')}
            </h2>
          </div>
          <button
            onClick={openNewHabitModal}
            className="py-2 px-3 bg-gradient-to-r from-primary-container to-inverse-primary rounded-lg text-on-primary font-headline-sm text-label-md flex items-center gap-1 shadow-md active:scale-95 machined-border"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>{lang === 'sl' ? 'Nova' : 'New'}</span>
          </button>
        </div>

        {/* Sub-Tab Selector */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => setSubTab('today')}
            className={`py-2 px-3 rounded-lg text-label-md font-label-md machined-border transition-colors ${
              subTab === 'today'
                ? 'bg-primary-container text-on-primary font-bold'
                : 'bg-surface-container-lowest text-on-surface-variant'
            }`}
          >
            {tr('todaysMission')} ({todaySummary.completedCount}/{todaySummary.scheduledCount})
          </button>
          <button
            onClick={() => setSubTab('manage')}
            className={`py-2 px-3 rounded-lg text-label-md font-label-md machined-border transition-colors ${
              subTab === 'manage'
                ? 'bg-primary-container text-on-primary font-bold'
                : 'bg-surface-container-lowest text-on-surface-variant'
            }`}
          >
            {tr('allHabitsManage')} ({state.habits.length})
          </button>
        </div>
      </section>

      {subTab === 'today' ? (
        <>
          {/* Weekly Gym Rest Day Status Banner */}
          <section className="rounded-xl bg-surface-container-low p-space-md machined-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary machined-border flex-shrink-0">
                <span className="material-symbols-outlined text-lg">bedtime</span>
              </div>
              <div>
                <span className="text-label-sm font-label-sm text-secondary uppercase tracking-wider block">
                  {lang === 'sl'
                    ? 'TEDENSKI FITNES POČITEK (MAX 2 NA TEDEN)'
                    : 'WEEKLY GYM REST PROTOCOL (MAX 2 / WEEK)'}
                </span>
                <p className="text-body-sm font-body-sm text-white font-medium">
                  {lang === 'sl'
                    ? `Porabljeni dnevi počitka ta teden: ${gymRestUsedThisWeek} / 2`
                    : `Rest days used this week: ${gymRestUsedThisWeek} / 2`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {[0, 1].map((slot) => (
                <span
                  key={slot}
                  className={`w-3 h-3 rounded-full ${
                    slot < gymRestUsedThisWeek
                      ? 'bg-secondary shadow-[0_0_8px_#ffb95a]'
                      : 'bg-surface-variant'
                  }`}
                />
              ))}
            </div>
          </section>

          {restAlertMsg && (
            <section className="rounded-xl bg-error-container/40 border border-error p-3 text-error text-label-sm font-label-sm flex items-center gap-2 hq-page-fade">
              <span className="material-symbols-outlined text-base">warning</span>
              <span>{restAlertMsg}</span>
            </section>
          )}

          {/* Pending Priority Missions */}
          <section className="rounded-xl bg-surface-container p-space-md machined-border">
            <div className="flex justify-between items-center mb-space-sm">
              <span className="text-label-sm font-label-sm uppercase tracking-wider text-primary">
                {tr('activeMission')}
              </span>
              <span className="text-label-sm font-label-sm text-on-surface-variant">
                {activeRecords.length} Remaining
              </span>
            </div>

            {activeRecords.length === 0 ? (
              <div className="p-4 rounded-lg bg-surface-container-low machined-border text-center">
                <span className="material-symbols-outlined text-primary-container text-3xl">
                  emoji_events
                </span>
                <p className="text-headline-sm font-headline-sm text-white mt-1">
                  100% MISSION COMPLETE
                </p>
                <p className="text-body-sm font-body-sm text-on-surface-variant">
                  Relentless execution today, Luka.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeRecords.map((rec) => {
                  const catObj = CATEGORIES.find(
                    (c) => c.value === rec.habitCategorySnapshot
                  );
                  const isGymHabit =
                    rec.habitId === 'habit-gym' ||
                    rec.habitCategorySnapshot === 'fitness' ||
                    rec.habitTitleSnapshot.toLowerCase().includes('gym') ||
                    rec.habitTitleSnapshot.toLowerCase().includes('fitnes');

                  return (
                    <div
                      key={rec.id}
                      className="rounded-lg bg-surface-container-high machined-border border-l-2 border-l-primary-container transition-all duration-200"
                    >
                      <div
                        onClick={() => toggleHabitCompletion(todayDateStr, rec.habitId)}
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-surface-bright transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded bg-surface-variant border border-outline-variant flex items-center justify-center flex-shrink-0"></div>
                          <div>
                            <p className="text-body-md font-body-md text-white font-medium">
                              {rec.habitTitleSnapshot}
                            </p>
                            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">
                              {rec.habitCategorySnapshot} • {rec.habitPrioritySnapshot}{' '}
                              {rec.targetValueSnapshot
                                ? `• TARGET: ${rec.targetValueSnapshot} ${rec.unitSnapshot || ''}`
                                : ''}
                            </span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-primary text-sm">
                          {catObj?.icon || 'bolt'}
                        </span>
                      </div>

                      {isGymHabit && (
                        <div className="px-3 pb-2.5 pt-1.5 border-t border-surface-variant/40 flex items-center justify-between bg-surface-container-lowest/50 rounded-b-lg">
                          <span className="text-[10px] font-label-sm text-on-surface-variant uppercase">
                            {lang === 'sl'
                              ? `Počitek ta teden: ${gymRestUsedThisWeek}/2 (max 2)`
                              : `Gym Rest Days: ${gymRestUsedThisWeek}/2 (Max 2)`}
                          </span>
                          <button
                            onClick={(e) => handleGymRestClick(e, rec.habitId)}
                            className={`px-2.5 py-1 rounded text-[10px] font-label-sm uppercase tracking-wider machined-border transition-all ${
                              gymRestUsedThisWeek >= 2
                                ? 'bg-surface-container text-tertiary opacity-60'
                                : 'bg-surface-container-high text-secondary hover:bg-surface-bright'
                            }`}
                          >
                            {gymRestUsedThisWeek >= 2
                              ? lang === 'sl'
                                ? '2/2 Počitka porabljena'
                                : '2/2 Rests Used (Max)'
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
            )}
          </section>

          {/* Completed Missions Today */}
          <section className="rounded-xl bg-surface-container p-space-md machined-border">
            <div className="flex justify-between items-center mb-space-sm">
              <span className="text-label-sm font-label-sm uppercase tracking-wider text-secondary">
                {tr('completedMission')}
              </span>
              <span className="text-label-sm font-label-sm text-primary">
                {completedRecords.length} Done
              </span>
            </div>

            <div className="space-y-2.5">
              {completedRecords.map((rec) => {
                const catObj = CATEGORIES.find(
                  (c) => c.value === rec.habitCategorySnapshot
                );
                const isRestDayToday = Boolean(
                  rec.isRestDay || rec.notes === 'GYM_REST_DAY'
                );
                return (
                  <div
                    key={rec.id}
                    onClick={() => toggleHabitCompletion(todayDateStr, rec.habitId)}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low machined-border cursor-pointer transition-opacity hover:opacity-90"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center shadow-sm flex-shrink-0 ${
                          isRestDayToday
                            ? 'bg-secondary-container text-white'
                            : 'bg-primary-container text-on-primary-container'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm font-bold">
                          {isRestDayToday ? 'bedtime' : 'check'}
                        </span>
                      </div>
                      <div>
                        <p className="text-body-md font-body-md text-on-surface line-through opacity-75">
                          {rec.habitTitleSnapshot}
                        </p>
                        <span
                          className={`text-label-sm font-label-sm tracking-wide uppercase ${
                            isRestDayToday ? 'text-secondary' : 'text-primary'
                          }`}
                        >
                          {isRestDayToday
                            ? `REST DAY LOGGED • ${gymRestUsedThisWeek}/2 USED THIS WEEK`
                            : `${rec.habitCategorySnapshot} • COMPLETED`}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">
                      {catObj?.icon || 'check_circle'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* End-of-Day Summary & Field Notes */}
          <section className="rounded-xl bg-surface-container-low p-space-md machined-border thermal-top-edge">
            <h3 className="text-headline-sm font-headline-sm text-white mb-2">
              {tr('dailyNotesTitle')}
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <div className="bg-surface-container p-2 rounded-lg machined-border">
                <span className="text-headline-sm font-headline-sm text-white block">
                  {todaySummary.completedCount}
                </span>
                <span className="text-label-sm font-label-sm text-tertiary uppercase">
                  Done
                </span>
              </div>
              <div className="bg-surface-container p-2 rounded-lg machined-border">
                <span className="text-headline-sm font-headline-sm text-error block">
                  {Math.max(0, todaySummary.scheduledCount - todaySummary.completedCount)}
                </span>
                <span className="text-label-sm font-label-sm text-tertiary uppercase">
                  Missed
                </span>
              </div>
              <div className="bg-surface-container p-2 rounded-lg machined-border">
                <span className="text-headline-sm font-headline-sm text-primary-container block">
                  {todaySummary.disciplineScore}%
                </span>
                <span className="text-label-sm font-label-sm text-tertiary uppercase">
                  Score
                </span>
              </div>
            </div>

            <textarea
              value={todaySummary.notes}
              onChange={(e) => updateDailySummaryNotes(todayDateStr, e.target.value)}
              placeholder={tr('dailyNotesPlaceholder')}
              rows={3}
              className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface p-3 text-body-sm focus:border-primary-container focus:ring-0"
            />
          </section>
        </>
      ) : (
        /* Manage All Habits View */
        <section className="space-y-3">
          {state.habits.map((h) => (
            <div
              key={h.id}
              className="rounded-xl bg-surface-container p-space-md machined-border"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h4 className="text-body-md font-body-md text-white font-semibold">
                    {h.title}
                  </h4>
                  {h.description && (
                    <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">
                      {h.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-label-sm font-label-sm px-2 py-0.5 rounded bg-surface-container-highest text-primary uppercase">
                      {h.category}
                    </span>
                    <span className="text-label-sm font-label-sm px-2 py-0.5 rounded bg-surface-container-lowest text-secondary uppercase">
                      {h.priority}
                    </span>
                    <span className="text-label-sm font-label-sm px-2 py-0.5 rounded bg-surface-container-lowest text-tertiary uppercase">
                      {h.repeatType}
                    </span>
                    {h.reminderTime && (
                      <span className="text-label-sm font-label-sm px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant">
                        ⏰ {h.reminderTime}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditHabitModal(h)}
                    className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-primary hover:text-white machined-border"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button
                    onClick={() => togglePauseHabit(h.id)}
                    className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-secondary hover:text-white machined-border"
                  >
                    <span className="material-symbols-outlined text-base">
                      {h.isPaused ? 'play_arrow' : 'pause'}
                    </span>
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(h.id)}
                    className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-error hover:text-white machined-border"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>

              {confirmDeleteId === h.id && (
                <div className="mt-3 pt-2 border-t border-surface-variant flex items-center justify-between">
                  <span className="text-label-sm font-label-sm text-error">
                    Delete habit? Past history stays safe.
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await deleteHabit(h.id);
                        setConfirmDeleteId(null);
                      }}
                      className="px-2.5 py-1 rounded bg-error-container text-on-error-container text-label-sm font-bold"
                    >
                      {tr('delete')}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2.5 py-1 rounded bg-surface-variant text-tertiary text-label-sm"
                    >
                      {tr('cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Habit Editor Overlay Modal */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-surface-container p-space-md machined-border thermal-top-edge max-h-[90vh] overflow-y-auto space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-headline-sm font-headline-sm text-white">
                {editingHabitId ? tr('edit') : tr('newHabitBtn')}
              </h3>
              <button
                onClick={() => setModalVisible(false)}
                className="text-tertiary hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {formError && (
              <p className="text-label-sm font-label-sm text-error">{formError}</p>
            )}

            <div>
              <label className="text-label-sm font-label-sm text-primary uppercase block mb-1">
                {tr('habitTitleLabel')}
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Morning Gym & Heavy Lifting"
                className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
              />
            </div>

            <div>
              <label className="text-label-sm font-label-sm text-primary uppercase block mb-1">
                {tr('habitDescLabel')}
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="No excuses..."
                className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
              />
            </div>

            <div>
              <label className="text-label-sm font-label-sm text-primary uppercase block mb-1">
                {tr('habitCategoryLabel')}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`p-2 rounded text-label-sm font-label-sm machined-border ${
                      category === c.value
                        ? 'bg-primary-container text-on-primary font-bold'
                        : 'bg-surface-container-lowest text-on-surface-variant'
                    }`}
                  >
                    {lang === 'sl' ? c.labelSl : c.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-label-sm font-label-sm text-primary uppercase block mb-1">
                {tr('habitPriorityLabel')}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className={`p-2 rounded text-label-sm font-label-sm machined-border ${
                      priority === p.value
                        ? 'bg-primary-container text-on-primary font-bold'
                        : 'bg-surface-container-lowest text-on-surface-variant'
                    }`}
                  >
                    {lang === 'sl' ? p.labelSl : p.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-label-sm font-label-sm text-primary uppercase block mb-1">
                {tr('habitRepeatLabel')}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['daily', 'weekdays', 'one_time'] as const).map((rt) => (
                  <button
                    key={rt}
                    onClick={() => setRepeatType(rt)}
                    className={`p-2 rounded text-label-sm font-label-sm machined-border ${
                      repeatType === rt
                        ? 'bg-primary-container text-on-primary font-bold'
                        : 'bg-surface-container-lowest text-on-surface-variant'
                    }`}
                  >
                    {rt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {repeatType === 'weekdays' && (
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((w) => {
                  const selected = repeatDays.includes(w.day);
                  return (
                    <button
                      key={w.day}
                      onClick={() => toggleWeekday(w.day)}
                      className={`py-2 rounded text-label-sm font-label-sm machined-border ${
                        selected
                          ? 'bg-primary-container text-on-primary font-bold'
                          : 'bg-surface-container-lowest text-tertiary'
                      }`}
                    >
                      {lang === 'sl' ? w.sl : w.en}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-label-sm font-label-sm text-primary uppercase block mb-1">
                  Reminder (HH:MM)
                </label>
                <input
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  placeholder="07:30"
                  className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2 text-body-sm"
                />
              </div>
              <div>
                <label className="text-label-sm font-label-sm text-primary uppercase block mb-1">
                  Target Value
                </label>
                <input
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="10000"
                  className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2 text-body-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-surface-variant">
              <button
                onClick={() => setModalVisible(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-low text-tertiary text-label-md machined-border"
              >
                {tr('cancel')}
              </button>
              <button
                onClick={handleSaveHabit}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-primary-container to-inverse-primary text-on-primary font-bold text-label-md machined-border"
              >
                {tr('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PerformanceHQShell>
  );
}
