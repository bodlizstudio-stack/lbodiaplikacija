import React, { useState } from 'react';
import { useApp } from '../../src/store/AppContext';
import { LBODIShell } from '../../src/components/LBODIShell';
import { GoalCategory, GoalTimeframe } from '../../src/types';

const GOAL_CATEGORIES: { id: GoalCategory; sl: string; en: string }[] = [
  { id: 'vera', sl: 'Vera', en: 'Faith' },
  { id: 'zdravje', sl: 'Zdravje', en: 'Health' },
  { id: 'disciplina', sl: 'Disciplina', en: 'Discipline' },
  { id: 'izobrazba', sl: 'Izobrazba', en: 'Education' },
  { id: 'delo', sl: 'Delo', en: 'Work' },
  { id: 'odnosi', sl: 'Odnosi', en: 'Relationships' },
  { id: 'osebna_rast', sl: 'Osebna rast', en: 'Personal Growth' },
];

export default function GoalsModalScreen() {
  const {
    state,
    todayDateStr,
    tr,
    saveGoal,
    toggleGoalMilestone,
    deleteGoal,
  } = useApp();

  const lang = state.settings.language;
  const [filterTimeframe, setFilterTimeframe] = useState<'all' | GoalTimeframe>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | GoalCategory>('all');
  const [modalVisible, setModalVisible] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('vera');
  const [timeframe, setTimeframe] = useState<GoalTimeframe>('monthly');
  const [startDate, setStartDate] = useState(todayDateStr);
  const [targetDate, setTargetDate] = useState('2027-06-01');
  const [milestonesText, setMilestonesText] = useState('');
  const [linkedHabitIds, setLinkedHabitIds] = useState<string[]>([]);

  const handleSaveGoal = async () => {
    if (!title.trim()) return;
    const milestones = milestonesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((mTitle, idx) => ({
        id: `ms_${Date.now()}_${idx}`,
        title: mTitle,
        completed: false,
      }));

    await saveGoal({
      title: title.trim(),
      description: description.trim(),
      category,
      timeframe,
      startDate: startDate.trim() || todayDateStr,
      targetDate: targetDate.trim(),
      progressPct: 0,
      milestones,
      linkedHabitIds,
      completed: false,
      notes: '',
    });
    setTitle('');
    setDescription('');
    setMilestonesText('');
    setLinkedHabitIds([]);
    setModalVisible(false);
  };

  const toggleLinkedHabit = (hid: string) => {
    setLinkedHabitIds((prev) =>
      prev.includes(hid) ? prev.filter((x) => x !== hid) : [...prev, hid]
    );
  };

  const filteredGoals = state.goals.filter(
    (g) =>
      (filterTimeframe === 'all' || g.timeframe === filterTimeframe) &&
      (filterCategory === 'all' || g.category === filterCategory)
  );

  return (
    <LBODIShell showBackButton subtitle={lang === 'sl' ? 'Cilji povezani z navadami' : 'Goals & Milestones'}>
      <section className="lbodi-card thermal-top-edge p-4 space-y-3">
        <div className="flex justify-between items-center gap-2">
          <div>
            <h1 className="font-sacred text-2xl font-semibold text-[var(--text-main)]">
              {lang === 'sl' ? 'Osebni cilji' : 'Personal Goals'}
            </h1>
            <p className="text-[11px] text-[var(--text-muted)]">
              {lang === 'sl'
                ? 'Cilj pove povečano smer (npr. Izboljšati telesno pripravljenost), navade pa dnevna dejanja.'
                : 'Goals define your direction; linked habits are the daily steps.'}
            </p>
          </div>
          <button
            onClick={() => setModalVisible(true)}
            className="px-3 py-2 rounded-xl lbodi-gold-btn text-xs flex items-center gap-1 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>{lang === 'sl' ? 'Nov cilj' : 'New Goal'}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-2 py-1 rounded-lg text-[10px] border ${
              filterCategory === 'all'
                ? 'bg-[var(--bg-elevated)] border-[var(--border-gold)] text-[var(--accent-gold)]'
                : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
            }`}
          >
            Vse
          </button>
          {GOAL_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCategory(c.id)}
              className={`px-2 py-1 rounded-lg text-[10px] border ${
                filterCategory === c.id
                  ? 'bg-[var(--bg-elevated)] border-[var(--border-gold)] text-[var(--accent-gold)]'
                  : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
              }`}
            >
              {lang === 'sl' ? c.sl : c.en}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-1">
          {(['all', 'short', 'monthly', 'yearly', 'life'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setFilterTimeframe(tf)}
              className={`py-1.5 rounded-lg text-[10px] uppercase border ${
                filterTimeframe === tf
                  ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent font-semibold'
                  : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {filteredGoals.map((g) => {
          const linkedHabits = state.habits.filter((h) => g.linkedHabitIds.includes(h.id));
          const catObj = GOAL_CATEGORIES.find((c) => c.id === g.category);
          return (
            <div key={g.id} className="lbodi-card p-4 space-y-2.5">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-[var(--accent-gold)]">
                    {catObj ? catObj.sl : 'Cilj'} • {g.timeframe} • Do: {g.targetDate}
                  </span>
                  <h3 className="text-sm font-semibold text-[var(--text-main)] mt-0.5">{g.title}</h3>
                </div>
                <button onClick={() => deleteGoal(g.id)} className="text-red-400">
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
              {g.description && <p className="text-xs text-[var(--text-muted)]">{g.description}</p>}

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[var(--text-muted)]">Napredek</span>
                  <span className="text-[var(--accent-gold)] font-semibold">{g.progressPct}%</span>
                </div>
                <div className="w-full h-2 bg-[var(--bg-lowest)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent-gold)]"
                    style={{ width: `${g.progressPct}%` }}
                  />
                </div>
              </div>

              {g.milestones.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
                  {g.milestones.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => toggleGoalMilestone(g.id, m.id)}
                      className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-lowest)] cursor-pointer text-xs"
                    >
                      <span
                        className={`material-symbols-outlined text-base ${
                          m.completed ? 'text-[var(--accent-olive)]' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {m.completed ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      <span
                        className={
                          m.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-main)]'
                        }
                      >
                        {m.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {linkedHabits.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {linkedHabits.map((lh) => (
                    <span
                      key={lh.id}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-[var(--accent-gold)]"
                    >
                      Navada: {lh.title.split('/')[0].trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {modalVisible && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md lbodi-card p-5 space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-[var(--text-main)]">
              {lang === 'sl' ? 'Nov osebni cilj' : 'New Goal'}
            </h3>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Naslov cilja..."
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opis in merljiv namen..."
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
            />
            <div className="flex flex-wrap gap-1">
              {GOAL_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] border ${
                    category === c.id
                      ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent font-semibold'
                      : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                  }`}
                >
                  {lang === 'sl' ? c.sl : c.en}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(['short', 'monthly', 'yearly', 'life'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`py-1.5 rounded-lg text-[11px] uppercase border ${
                    timeframe === tf
                      ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent font-semibold'
                      : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[var(--text-muted)]">Začetek</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[var(--text-muted)]">Ciljni datum</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
                />
              </div>
            </div>
            <textarea
              value={milestonesText}
              onChange={(e) => setMilestonesText(e.target.value)}
              placeholder="Mejniki (vsak v svoji vrstici)..."
              rows={3}
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
            />
            <div>
              <span className="text-[11px] text-[var(--accent-gold)] block mb-1">
                Povezane navade:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {state.habits.map((h) => {
                  const active = linkedHabitIds.includes(h.id);
                  return (
                    <button
                      key={h.id}
                      onClick={() => toggleLinkedHabit(h.id)}
                      className={`px-2 py-1 rounded-lg text-[11px] border ${
                        active
                          ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent font-semibold'
                          : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                      }`}
                    >
                      {h.title.split('/')[0].trim()}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setModalVisible(false)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-lowest)] text-xs text-[var(--text-muted)]"
              >
                {tr('cancel')}
              </button>
              <button onClick={handleSaveGoal} className="px-4 py-2 rounded-xl lbodi-gold-btn text-xs">
                {tr('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </LBODIShell>
  );
}
