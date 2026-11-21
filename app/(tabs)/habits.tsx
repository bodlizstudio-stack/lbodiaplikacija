import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/store/AppContext';
import { LBODIShell } from '../../src/components/LBODIShell';
import { HABIT_TEMPLATES, HabitTemplate } from '../../src/data/faithData';
import { calculateHabitStreak } from '../../src/utils/dateUtils';
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
  { value: 'recovery', labelSl: 'Spanec', labelEn: 'Recovery', icon: 'bedtime' },
  { value: 'discipline', labelSl: 'Disciplina', labelEn: 'Discipline', icon: 'shield' },
];

const PRIORITIES: { value: HabitPriority; labelSl: string; labelEn: string }[] = [
  { value: 'critical', labelSl: 'Ključna', labelEn: 'Critical' },
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
  const router = useRouter();
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
  const [subTab, setSubTab] = useState<'today' | 'manage' | 'templates'>('today');
  const [restAlertMsg, setRestAlertMsg] = useState<string | null>(null);
  const gymRestUsedThisWeek = getGymRestDaysUsedThisWeek(todayDateStr);

  // Modal editor
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
  const activeRecords = todayRecords.filter((r) => !r.completed);
  const completedRecords = todayRecords.filter((r) => r.completed);

  const todaySummary = state.dailySummaries[todayDateStr] || {
    date: todayDateStr,
    scheduledCount: todayRecords.length,
    completedCount: completedRecords.length,
    completionPct: 0,
    disciplineScore: 0,
    notes: '',
    updatedAt: '',
  };

  // Real Habit Analytics (best performing & needing attention)
  const habitAnalytics = useMemo(() => {
    return state.habits
      .filter((h) => !h.isArchived)
      .map((h) => {
        const recs = state.dailyHabitRecords.filter((r) => r.habitId === h.id);
        const done = recs.filter((r) => r.completed).length;
        const pct = recs.length > 0 ? Math.round((done / recs.length) * 100) : 0;
        const streaks = calculateHabitStreak(h, state.dailyHabitRecords, todayDateStr);
        return { habit: h, done, total: recs.length, pct, ...streaks };
      });
  }, [state.habits, state.dailyHabitRecords, todayDateStr]);

  const handleGymRestClick = async (e: React.MouseEvent, habitId: string) => {
    e.stopPropagation();
    const res = await toggleGymRestDay(todayDateStr, habitId);
    if (!res.ok) {
      setRestAlertMsg(
        lang === 'sl'
          ? 'Največ 2 dni počitka na teden sta že porabljena (2/2).'
          : 'Maximum 2 rest days in one week already used (2/2).'
      );
      setTimeout(() => setRestAlertMsg(null), 4500);
    } else {
      setRestAlertMsg(null);
    }
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
      setFormError(lang === 'sl' ? 'Vnesi naziv navade.' : 'Enter a habit name.');
      return;
    }
    await saveHabit({
      id: editingHabitId,
      title: title.trim(),
      description: description.trim(),
      category,
      icon: 'checkbox',
      priority,
      color: '#C7A76C',
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

  const handleAddTemplate = async (tpl: HabitTemplate) => {
    await saveHabit({
      title: `${tpl.titleSl} / ${tpl.titleEn}`,
      description: lang === 'sl' ? tpl.descriptionSl : tpl.descriptionEn,
      category: tpl.category,
      icon: 'checkbox',
      priority: tpl.priority,
      color: '#C7A76C',
      repeatType: tpl.repeatType,
      repeatDays: tpl.repeatDays,
      targetValue: tpl.targetValue,
      unit: tpl.unit,
      isPaused: false,
      isArchived: false,
    });
    setSubTab('today');
  };

  return (
    <LBODIShell>
      <section className="lbodi-card thermal-top-edge p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent-gold)]">
              {lang === 'sl' ? 'Dnevne navade in ritem' : 'Daily Habits & Consistency'}
            </span>
            <h1 className="font-sacred text-3xl font-semibold text-[var(--text-main)]">
              {lang === 'sl' ? 'Moje navade' : 'My Habits'}
            </h1>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => router.replace('/(tabs)/calendar' as any)}
              className="px-2.5 py-2 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)]"
              title="Koledar navad"
            >
              <span className="material-symbols-outlined text-base text-[var(--accent-gold)]">
                calendar_month
              </span>
            </button>
            <button
              onClick={openNewHabitModal}
              className="px-3 py-2 rounded-xl lbodi-gold-btn text-xs flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>{lang === 'sl' ? 'Nova' : 'New'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'today', label: `${lang === 'sl' ? 'Danes' : 'Today'} (${todaySummary.completedCount}/${todaySummary.scheduledCount})` },
            { id: 'manage', label: `${lang === 'sl' ? 'Analitika' : 'Manage'} (${state.habits.length})` },
            { id: 'templates', label: lang === 'sl' ? 'Predloge (12)' : 'Templates' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              className={`py-2 rounded-xl text-[11px] font-semibold border ${
                subTab === t.id
                  ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent'
                  : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {subTab === 'today' && (
        <>
          {/* Weekly Gym Rest Status */}
          <section className="lbodi-card p-3.5 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--accent-olive)]">bedtime</span>
              <span className="text-[var(--text-main)] font-medium">
                {lang === 'sl'
                  ? `Fitnes počitek ta teden: ${gymRestUsedThisWeek}/2 (največ 2)`
                  : `Gym rest days this week: ${gymRestUsedThisWeek}/2`}
              </span>
            </div>
            <div className="flex gap-1">
              {[0, 1].map((s) => (
                <span
                  key={s}
                  className={`w-2.5 h-2.5 rounded-full ${
                    s < gymRestUsedThisWeek ? 'bg-[var(--accent-olive)]' : 'bg-[var(--border-subtle)]'
                  }`}
                />
              ))}
            </div>
          </section>

          {restAlertMsg && (
            <div className="p-2.5 rounded-xl bg-red-900/25 border border-red-400/40 text-red-300 text-xs">
              {restAlertMsg}
            </div>
          )}

          {/* Pending */}
          <section className="lbodi-card p-4 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
                {tr('activeMission')}
              </span>
              <span className="text-[var(--text-muted)]">{activeRecords.length} odprtih</span>
            </div>

            {activeRecords.length === 0 ? (
              <div className="p-4 rounded-xl bg-[var(--bg-lowest)] text-center text-xs text-[var(--text-main)]">
                Vse načrtovane navade za danes so opravljene. Hvala Bogu za zvesto vztrajnost.
              </div>
            ) : (
              activeRecords.map((rec) => {
                const isGymHabit =
                  rec.habitId === 'habit-gym' ||
                  rec.habitCategorySnapshot === 'fitness' ||
                  rec.habitTitleSnapshot.toLowerCase().includes('gym') ||
                  rec.habitTitleSnapshot.toLowerCase().includes('fitnes');
                return (
                  <div
                    key={rec.id}
                    className="rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] overflow-hidden"
                  >
                    <div
                      onClick={() => toggleHabitCompletion(todayDateStr, rec.habitId)}
                      className="flex items-center justify-between p-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-6 h-6 rounded-lg border border-[var(--border-gold)] flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--text-main)] truncate">
                            {rec.habitTitleSnapshot}
                          </p>
                          <span className="text-[10px] uppercase text-[var(--text-muted)]">
                            {rec.habitCategorySnapshot}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isGymHabit && (
                      <div className="px-3 py-2 border-t border-[var(--border-subtle)] flex justify-between items-center text-[11px]">
                        <span className="text-[var(--text-muted)]">
                          Počitek: {gymRestUsedThisWeek}/2
                        </span>
                        <button
                          onClick={(e) => handleGymRestClick(e, rec.habitId)}
                          className="px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--accent-gold)]"
                        >
                          Danes sem imel počitek
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </section>

          {/* Completed */}
          <section className="lbodi-card p-4 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold uppercase tracking-wider text-[var(--accent-olive)]">
                {tr('completedMission')}
              </span>
              <span className="text-[var(--text-muted)]">{completedRecords.length}</span>
            </div>
            {completedRecords.map((rec) => {
              const isRest = Boolean(rec.isRestDay || rec.notes === 'GYM_REST_DAY');
              return (
                <div
                  key={rec.id}
                  onClick={() => toggleHabitCompletion(todayDateStr, rec.habitId)}
                  className="p-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] flex items-center gap-3 cursor-pointer"
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isRest ? 'bg-[var(--accent-olive)] text-white' : 'bg-[var(--accent-gold)] text-[#0B1220]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm font-bold">
                      {isRest ? 'bedtime' : 'check'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm line-through text-[var(--text-muted)] truncate">
                      {rec.habitTitleSnapshot}
                    </p>
                    {isRest && (
                      <span className="text-[10px] text-[var(--accent-olive)]">
                        Počitek zabeležen (klikni za preklic)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          {/* Daily Notes */}
          <section className="lbodi-card p-4 space-y-2">
            <label className="text-xs font-semibold text-[var(--text-main)] block">
              {tr('dailyNotesTitle')}
            </label>
            <textarea
              value={todaySummary.notes}
              onChange={(e) => updateDailySummaryNotes(todayDateStr, e.target.value)}
              placeholder={tr('dailyNotesPlaceholder')}
              rows={2}
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
            />
          </section>
        </>
      )}

      {subTab === 'manage' && (
        <section className="space-y-2.5">
          {habitAnalytics.map(({ habit: h, pct, current, longest }) => (
            <div key={h.id} className="lbodi-card p-4 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-[var(--text-main)] truncate">
                    {h.title}
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Niz: {current} dni (najdaljši {longest}) • Konsistenca: {pct}%
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => openEditHabitModal(h)} className="text-[var(--accent-gold)]">
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button onClick={() => togglePauseHabit(h.id)} className="text-[var(--accent-olive)]">
                    <span className="material-symbols-outlined text-base">
                      {h.isPaused ? 'play_arrow' : 'pause'}
                    </span>
                  </button>
                  <button onClick={() => setConfirmDeleteId(h.id)} className="text-red-400">
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
              {confirmDeleteId === h.id && (
                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                  <button
                    onClick={async () => {
                      await deleteHabit(h.id);
                      setConfirmDeleteId(null);
                    }}
                    className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold"
                  >
                    Izbriši
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-3 py-1 rounded-lg bg-[var(--bg-lowest)] text-xs text-[var(--text-muted)]"
                  >
                    Prekliči
                  </button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {subTab === 'templates' && (
        <section className="space-y-2">
          <p className="text-xs text-[var(--text-muted)] px-1">
            Neobvezni predlogi krščanskih in življenjskih navad — z enim dotikom jih dodaš med svoje navade:
          </p>
          {HABIT_TEMPLATES.map((tpl) => (
            <div key={tpl.id} className="lbodi-card p-3.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-[var(--text-main)]">
                  {lang === 'sl' ? tpl.titleSl : tpl.titleEn}
                </h4>
                <p className="text-xs text-[var(--text-muted)]">
                  {lang === 'sl' ? tpl.descriptionSl : tpl.descriptionEn}
                </p>
              </div>
              <button
                onClick={() => handleAddTemplate(tpl)}
                className="px-3 py-1.5 rounded-xl lbodi-gold-btn text-xs flex-shrink-0"
              >
                + Dodaj
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Habit Editor Modal */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md lbodi-card p-5 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-[var(--text-main)]">
                {editingHabitId ? tr('edit') : tr('newHabitBtn')}
              </h3>
              <button onClick={() => setModalVisible(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={tr('habitTitleLabel')}
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tr('habitDescLabel')}
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
            />
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`p-1.5 rounded-lg text-[11px] border ${
                    category === c.value
                      ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent font-semibold'
                      : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                  }`}
                >
                  {lang === 'sl' ? c.labelSl : c.labelEn}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={`p-1.5 rounded-lg text-[11px] border ${
                    priority === p.value
                      ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent font-semibold'
                      : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                  }`}
                >
                  {lang === 'sl' ? p.labelSl : p.labelEn}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(['daily', 'weekdays', 'one_time'] as const).map((rt) => (
                <button
                  key={rt}
                  onClick={() => setRepeatType(rt)}
                  className={`p-1.5 rounded-lg text-[11px] border ${
                    repeatType === rt
                      ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent font-semibold'
                      : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                  }`}
                >
                  {rt === 'daily' ? 'Vsak dan' : rt === 'weekdays' ? 'Dnevi' : 'Danes'}
                </button>
              ))}
            </div>
            {repeatType === 'weekdays' && (
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((w) => {
                  const sel = repeatDays.includes(w.day);
                  return (
                    <button
                      key={w.day}
                      onClick={() =>
                        setRepeatDays((prev) =>
                          prev.includes(w.day) ? prev.filter((x) => x !== w.day) : [...prev, w.day]
                        )
                      }
                      className={`py-1.5 rounded-lg text-[11px] border ${
                        sel
                          ? 'bg-[var(--accent-gold)] text-[#0B1220] font-semibold border-transparent'
                          : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                      }`}
                    >
                      {lang === 'sl' ? w.sl : w.en}
                    </button>
                  );
                })}
              </div>
            )}
            <button onClick={handleSaveHabit} className="w-full py-2.5 rounded-xl lbodi-gold-btn text-xs">
              {tr('save')}
            </button>
          </div>
        </div>
      )}
    </LBODIShell>
  );
}
