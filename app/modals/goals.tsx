import React, { useState } from 'react';
import { useApp } from '../../src/store/AppContext';
import { PerformanceHQShell } from '../../src/components/PerformanceHQShell';
import { GoalTimeframe } from '../../src/types';

export default function GoalsModalScreen() {
  const {
    state,
    tr,
    saveGoal,
    toggleGoalMilestone,
    deleteGoal,
  } = useApp();

  const [filterTimeframe, setFilterTimeframe] = useState<'all' | GoalTimeframe>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeframe, setTimeframe] = useState<GoalTimeframe>('monthly');
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
      timeframe,
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
    (g) => filterTimeframe === 'all' || g.timeframe === filterTimeframe
  );

  return (
    <PerformanceHQShell showBackButton subtitle="Strategic Target Execution">
      <section className="rounded-xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low p-space-md machined-border thermal-top-edge">
        <div className="flex justify-between items-center mb-2">
          <div>
            <span className="text-label-sm font-label-sm text-primary uppercase tracking-widest">
              STRATEGIC OBJECTIVES
            </span>
            <h2 className="text-headline-sm font-headline-sm text-white">
              Personal Goal Tracking
            </h2>
          </div>
          <button
            onClick={() => setModalVisible(true)}
            className="py-2 px-3 bg-gradient-to-r from-primary-container to-inverse-primary rounded-lg text-on-primary font-headline-sm text-label-md flex items-center gap-1 machined-border"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>New Goal</span>
          </button>
        </div>

        <div className="grid grid-cols-5 gap-1 mt-2">
          {(['all', 'short', 'monthly', 'yearly', 'life'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setFilterTimeframe(tf)}
              className={`py-1.5 rounded text-label-sm font-label-sm uppercase machined-border ${
                filterTimeframe === tf
                  ? 'bg-primary-container text-on-primary font-bold'
                  : 'bg-surface-container-lowest text-tertiary'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {filteredGoals.map((g) => {
          const linkedHabits = state.habits.filter((h) =>
            g.linkedHabitIds.includes(h.id)
          );
          return (
            <div
              key={g.id}
              className="rounded-xl bg-surface-container p-space-md machined-border space-y-2.5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-label-sm font-label-sm text-primary uppercase">
                    {g.timeframe} • TARGET: {g.targetDate}
                  </span>
                  <h3 className="text-headline-sm font-headline-sm text-white mt-0.5">
                    {g.title}
                  </h3>
                </div>
                <button
                  onClick={() => deleteGoal(g.id)}
                  className="text-tertiary hover:text-error"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>

              {g.description && (
                <p className="text-body-sm font-body-sm text-on-surface-variant">
                  {g.description}
                </p>
              )}

              <div>
                <div className="flex justify-between text-label-sm font-label-sm mb-1">
                  <span className="text-tertiary">PROGRESS</span>
                  <span className="text-primary font-bold">{g.progressPct}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-lowest rounded-full overflow-hidden machined-border">
                  <div
                    className="h-full bg-gradient-to-r from-primary-container to-secondary"
                    style={{ width: `${g.progressPct}%` }}
                  />
                </div>
              </div>

              {g.milestones.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-surface-variant">
                  <span className="text-label-sm font-label-sm text-primary uppercase">
                    Milestones
                  </span>
                  {g.milestones.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => toggleGoalMilestone(g.id, m.id)}
                      className="flex items-center gap-2 p-2 rounded bg-surface-container-low machined-border cursor-pointer"
                    >
                      <span
                        className={`material-symbols-outlined text-base ${
                          m.completed ? 'text-primary-container' : 'text-tertiary'
                        }`}
                      >
                        {m.completed ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      <span
                        className={`text-body-sm ${
                          m.completed
                            ? 'line-through text-on-surface-variant'
                            : 'text-white'
                        }`}
                      >
                        {m.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {linkedHabits.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1.5">
                  {linkedHabits.map((lh) => (
                    <span
                      key={lh.id}
                      className="text-label-sm font-label-sm px-2 py-0.5 rounded bg-surface-container-lowest text-primary border border-outline-variant"
                    >
                      ⚡ {lh.title.split('/')[0].trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {modalVisible && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-surface-container p-space-md machined-border thermal-top-edge space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="text-headline-sm font-headline-sm text-white">
              Create Strategic Goal
            </h3>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Goal Title..."
              className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description..."
              className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
            />
            <div className="grid grid-cols-4 gap-1.5">
              {(['short', 'monthly', 'yearly', 'life'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`py-1.5 rounded text-label-sm uppercase machined-border ${
                    timeframe === tf
                      ? 'bg-primary-container text-on-primary font-bold'
                      : 'bg-surface-container-lowest text-tertiary'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <input
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              placeholder="Target Date (YYYY-MM-DD)"
              className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
            />
            <textarea
              value={milestonesText}
              onChange={(e) => setMilestonesText(e.target.value)}
              placeholder="Milestones (one per line)..."
              rows={3}
              className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
            />
            <div>
              <span className="text-label-sm text-primary uppercase block mb-1">
                Link Habits
              </span>
              <div className="flex flex-wrap gap-1.5">
                {state.habits.map((h) => {
                  const active = linkedHabitIds.includes(h.id);
                  return (
                    <button
                      key={h.id}
                      onClick={() => toggleLinkedHabit(h.id)}
                      className={`px-2 py-1 rounded text-label-sm machined-border ${
                        active
                          ? 'bg-primary-container text-on-primary font-bold'
                          : 'bg-surface-container-lowest text-tertiary'
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
                className="px-4 py-2 rounded-lg bg-surface-container-low text-tertiary text-label-sm machined-border"
              >
                {tr('cancel')}
              </button>
              <button
                onClick={handleSaveGoal}
                className="px-5 py-2 rounded-lg bg-primary-container text-on-primary font-bold text-label-sm machined-border"
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
