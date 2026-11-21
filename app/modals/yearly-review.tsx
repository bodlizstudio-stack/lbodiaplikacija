import React, { useMemo } from 'react';
import { useApp } from '../../src/store/AppContext';
import { LBODIShell } from '../../src/components/LBODIShell';

export default function YearlyReviewScreen() {
  const { state, todayDateStr } = useApp();
  const currentYear = todayDateStr.slice(0, 4);

  const summary = useMemo(() => {
    const yearHabitsDone = state.dailyHabitRecords.filter(
      (r) => r.date.startsWith(currentYear) && r.completed
    ).length;
    const yearGratitude = (state.gratitudeEntries || []).filter((g) =>
      g.date.startsWith(currentYear)
    );
    const yearWorkouts = (state.workoutLogs || []).filter((w) =>
      w.date.startsWith(currentYear)
    ).length;
    const yearPhotos = state.physiqueEntries.filter((p) =>
      p.date.startsWith(currentYear)
    ).length;
    const completedGoals = state.goals.filter((g) => g.completed);
    const yearJournals = Object.values(state.dailyJournals).filter((j) =>
      j.date.startsWith(currentYear)
    );
    return {
      yearHabitsDone,
      yearGratitude,
      yearWorkouts,
      yearPhotos,
      completedGoals,
      yearJournals,
    };
  }, [state, currentYear]);

  const handleExportYear = () => {
    if (typeof document === 'undefined') return;
    const blob = new Blob(
      [JSON.stringify({ year: currentYear, summary }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lbodi-yearly-reflection-${currentYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <LBODIShell showBackButton subtitle={`Osebni letni pregled • ${currentYear}`}>
      <section className="lbodi-card thermal-top-edge p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h1 className="font-sacred text-2xl font-semibold text-[var(--text-main)]">
            Letni pregled ({currentYear})
          </h1>
          <button onClick={handleExportYear} className="px-3 py-1.5 rounded-xl lbodi-gold-btn text-xs">
            Izvozi
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="p-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)]">
            <span className="text-xl font-bold text-[var(--accent-gold)] block">
              {summary.yearHabitsDone}
            </span>
            <span>Opravljenih navad</span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)]">
            <span className="text-xl font-bold text-[var(--accent-olive)] block">
              {summary.yearGratitude.length}
            </span>
            <span>Zapisov hvaležnosti</span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)]">
            <span className="text-xl font-bold text-[var(--text-main)] block">
              {summary.yearWorkouts}
            </span>
            <span>Zabeleženih vadb</span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)]">
            <span className="text-xl font-bold text-[var(--text-main)] block">
              {summary.yearPhotos}
            </span>
            <span>Fotografij preobrazbe</span>
          </div>
        </div>
      </section>

      {summary.yearGratitude.length > 0 && (
        <section className="lbodi-card p-4 space-y-2">
          <span className="text-xs font-semibold text-[var(--accent-gold)] block">
            Poudarki hvaležnosti v letu {currentYear}
          </span>
          {summary.yearGratitude.slice(0, 5).map((g) => (
            <div key={g.id} className="p-2.5 rounded-xl bg-[var(--bg-lowest)] text-xs">
              <span className="text-[10px] text-[var(--accent-olive)]">{g.date}</span>
              <p className="text-[var(--text-main)]">{g.mainText}</p>
            </div>
          ))}
        </section>
      )}
    </LBODIShell>
  );
}
