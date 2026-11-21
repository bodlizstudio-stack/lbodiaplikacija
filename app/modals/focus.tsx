import React, { useEffect, useState } from 'react';
import { useApp } from '../../src/store/AppContext';
import { PerformanceHQShell } from '../../src/components/PerformanceHQShell';

export default function FocusModeScreen() {
  const { state, recordFocusSession } = useApp();

  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState('45');
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
  const completedCount = state.focusSessions.filter((s) => s.completed).length;

  return (
    <PerformanceHQShell showBackButton subtitle="Deep Work Execution Timer">
      <section className="rounded-xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low p-space-lg machined-border thermal-glow thermal-top-edge text-center space-y-4">
        <span className="text-label-sm font-label-sm text-primary uppercase tracking-widest bg-surface-container-highest px-3 py-1 rounded border border-outline-variant inline-block">
          PUT THE PHONE DOWN. GET TO WORK.
        </span>

        <div className="py-6">
          <div className="text-display-hero font-display-hero text-primary-container tracking-tight">
            {minsDisplay}:{secsDisplay}
          </div>
          <p className="text-label-md font-label-md text-on-surface-variant uppercase mt-2">
            Completed Focus Sessions: {completedCount}
          </p>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-3 gap-2">
          {[25, 50].map((m) => (
            <button
              key={m}
              onClick={() => selectPreset(m)}
              className={`py-2.5 rounded-lg text-label-md font-label-md machined-border ${
                selectedMinutes === m
                  ? 'bg-primary-container text-on-primary font-bold'
                  : 'bg-surface-container-lowest text-on-surface-variant'
              }`}
            >
              {m} MIN
            </button>
          ))}
          <div className="flex gap-1">
            <input
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white text-center text-label-md"
            />
            <button
              onClick={() => {
                const n = parseInt(customMinutes, 10);
                if (!isNaN(n) && n > 0) selectPreset(n);
              }}
              className="px-2.5 rounded-lg bg-surface-container-highest text-primary text-label-sm font-bold machined-border"
            >
              SET
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex-1 py-3 rounded-lg bg-gradient-to-r from-primary-container to-inverse-primary text-on-primary font-bold text-label-lg flex items-center justify-center gap-2 machined-border"
          >
            <span className="material-symbols-outlined">
              {isRunning ? 'pause' : 'play_arrow'}
            </span>
            <span>{isRunning ? 'PAUSE SESSION' : 'START FOCUS'}</span>
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(selectedMinutes * 60);
            }}
            className="px-4 rounded-lg bg-surface-container-lowest text-tertiary hover:text-white machined-border flex items-center justify-center"
          >
            <span className="material-symbols-outlined">restart_alt</span>
          </button>
        </div>
      </section>
    </PerformanceHQShell>
  );
}
