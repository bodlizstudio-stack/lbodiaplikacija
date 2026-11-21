import React, { useEffect, useState } from 'react';
import { useApp } from '../../src/store/AppContext';
import { LBODIShell } from '../../src/components/LBODIShell';

export default function FocusModeScreen() {
  const { state, recordFocusSession } = useApp();

  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState('45');
  const [taskTitle, setTaskTitle] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          recordFocusSession(selectedMinutes);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, selectedMinutes, recordFocusSession]);

  const selectPreset = (mins: number) => {
    setIsRunning(false);
    setSelectedMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  const minsDisplay = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secsDisplay = String(secondsLeft % 60).padStart(2, '0');

  return (
    <LBODIShell showBackButton subtitle="Fokus način za zbrano delo">
      <section className="lbodi-card thermal-top-edge p-6 text-center space-y-4">
        <span className="text-[11px] uppercase tracking-widest text-[var(--accent-gold)] font-semibold block">
          Zbrano delo brez motenj
        </span>

        <input
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder="Naloga za ta blok fokusa (opcijsko)..."
          className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-center text-xs text-[var(--text-main)]"
        />

        <div className="py-4">
          <div className="text-5xl font-bold text-[var(--text-main)] tracking-tight">
            {minsDisplay}:{secsDisplay}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Opravljenih sej fokusa: {state.focusSessions.filter((s) => s.completed).length}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[25, 50].map((m) => (
            <button
              key={m}
              onClick={() => selectPreset(m)}
              className={`py-2.5 rounded-xl text-xs font-semibold border ${
                selectedMinutes === m
                  ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent'
                  : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
              }`}
            >
              {m} MIN
            </button>
          ))}
          <div className="flex gap-1">
            <input
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-[var(--text-main)] text-center text-xs"
            />
            <button
              onClick={() => {
                const n = parseInt(customMinutes, 10);
                if (!isNaN(n) && n > 0) selectPreset(n);
              }}
              className="px-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--accent-gold)] text-xs font-semibold"
            >
              OK
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setIsRunning(!isRunning)} className="flex-1 py-3 rounded-xl lbodi-gold-btn text-sm">
            {isRunning ? 'Pavza' : 'Začni fokus'}
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(selectedMinutes * 60);
            }}
            className="px-4 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-[var(--text-muted)]"
          >
            <span className="material-symbols-outlined">restart_alt</span>
          </button>
        </div>
      </section>

      {state.focusSessions.length > 0 && (
        <section className="lbodi-card p-4 space-y-2">
          <span className="text-xs font-semibold text-[var(--accent-gold)] block">
            Nedavne seje fokusa
          </span>
          {state.focusSessions.slice(0, 8).map((fs) => (
            <div key={fs.id} className="p-2 rounded-lg bg-[var(--bg-lowest)] flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">{fs.date}</span>
              <span className="text-[var(--text-main)] font-medium">{fs.durationMinutes} min</span>
            </div>
          ))}
        </section>
      )}
    </LBODIShell>
  );
}
