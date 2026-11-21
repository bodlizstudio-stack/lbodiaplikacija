import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/store/AppContext';
import { PerformanceHQShell } from '../../src/components/PerformanceHQShell';
import { NOFAP_MILESTONES } from '../../src/data/seedData';
import { calculateNoFapStreak } from '../../src/utils/dateUtils';

export default function NoFapModalScreen() {
  const router = useRouter();
  const { state, tr, setNoFapStartDate, resetNoFapStreak } = useApp();
  const lang = state.settings.language;

  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentStreak = useMemo(
    () => calculateNoFapStreak(state.nofapState.startTimestamp, nowMs),
    [state.nofapState.startTimestamp, nowMs]
  );

  const longestDays = useMemo(() => {
    const bestSec = Math.max(
      state.nofapState.longestStreakSeconds,
      currentStreak.totalSeconds
    );
    return Math.floor(bestSec / 86400);
  }, [state.nofapState.longestStreakSeconds, currentStreak.totalSeconds]);

  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [customDateStr, setCustomDateStr] = useState(
    state.nofapState.startTimestamp.slice(0, 16).replace('T', ' ')
  );
  const [dateError, setDateError] = useState('');

  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetReason, setResetReason] = useState('');

  const handleSaveStartDate = async () => {
    const normalized = customDateStr.trim().replace(' ', 'T');
    const parsed = new Date(normalized);
    if (isNaN(parsed.getTime()) || parsed.getTime() > Date.now()) {
      setDateError('Enter a valid past date & time (YYYY-MM-DD HH:MM).');
      return;
    }
    await setNoFapStartDate(parsed.toISOString());
    setDateModalVisible(false);
  };

  const handleConfirmReset = async () => {
    await resetNoFapStreak(resetReason);
    setResetReason('');
    setResetModalVisible(false);
  };

  return (
    <PerformanceHQShell showBackButton subtitle="Sovereign Streak Protocol">
      {/* Main Prominent Streak Card */}
      <section className="rounded-xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low p-space-md machined-border thermal-glow thermal-top-edge">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary-container"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield
            </span>
            <h2 className="text-headline-sm font-headline-sm text-white">
              {tr('nofapTitle')}
            </h2>
          </div>
          <span className="px-2 py-0.5 text-label-sm font-label-sm text-primary-fixed-dim bg-primary-container bg-opacity-20 rounded border border-primary-container border-opacity-30">
            LONGEST: {longestDays}D
          </span>
        </div>

        {/* 4-Column Live Telemetry: Days, Hours, Mins, Secs */}
        <div className="grid grid-cols-4 gap-2 my-3 text-center">
          <div className="bg-surface-container-lowest p-3 rounded-lg machined-border">
            <span className="text-headline-md font-headline-md text-white block">
              {currentStreak.days}
            </span>
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">
              Days
            </span>
          </div>
          <div className="bg-surface-container-lowest p-3 rounded-lg machined-border">
            <span className="text-headline-md font-headline-md text-white block">
              {String(currentStreak.hours).padStart(2, '0')}
            </span>
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">
              Hours
            </span>
          </div>
          <div className="bg-surface-container-lowest p-3 rounded-lg machined-border">
            <span className="text-headline-md font-headline-md text-white block">
              {String(currentStreak.minutes).padStart(2, '0')}
            </span>
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">
              Mins
            </span>
          </div>
          <div className="bg-surface-container-lowest p-3 rounded-lg machined-border">
            <span className="text-headline-md font-headline-md text-primary-container block">
              {String(currentStreak.seconds).padStart(2, '0')}
            </span>
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">
              Secs
            </span>
          </div>
        </div>

        {/* Emergency Motivation Button */}
        <button
          onClick={() => router.push('/modals/why-i-started')}
          className="w-full py-3 px-4 bg-gradient-to-r from-primary-container to-inverse-primary rounded-lg text-on-primary font-headline-sm text-label-lg flex items-center justify-center space-x-2 shadow-lg active:scale-95 machined-border"
        >
          <span
            className="material-symbols-outlined text-lg"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            bolt
          </span>
          <span>REMIND ME WHY I STARTED</span>
        </button>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => {
              setCustomDateStr(
                state.nofapState.startTimestamp.slice(0, 16).replace('T', ' ')
              );
              setDateError('');
              setDateModalVisible(true);
            }}
            className="py-2 px-3 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-white text-label-sm font-label-sm flex items-center justify-center gap-1.5 machined-border"
          >
            <span className="material-symbols-outlined text-sm text-primary">
              schedule
            </span>
            <span>Set Start Date</span>
          </button>
          <button
            onClick={() => setResetModalVisible(true)}
            className="py-2 px-3 rounded-lg bg-error-container/30 text-error hover:bg-error-container/50 text-label-sm font-label-sm flex items-center justify-center gap-1.5 machined-border"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            <span>{tr('resetStreakBtn')}</span>
          </button>
        </div>
      </section>

      {/* 9 Milestones Section */}
      <section className="rounded-xl bg-surface-container p-space-md machined-border space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-label-sm font-label-sm text-primary uppercase tracking-wider">
            SOVEREIGNTY MILESTONES (1D — 365D)
          </span>
          <span className="text-label-sm font-label-sm text-tertiary">
            {NOFAP_MILESTONES.filter((m) => currentStreak.days >= m.days).length}/9 Unlocked
          </span>
        </div>

        {NOFAP_MILESTONES.map((m) => {
          const achieved = currentStreak.days >= m.days;
          const pct = Math.min(100, Math.round((currentStreak.days / m.days) * 100));
          return (
            <div
              key={m.days}
              className={`p-3 rounded-lg machined-border ${
                achieved
                  ? 'bg-surface-container-high border-l-2 border-l-primary-container'
                  : 'bg-surface-container-low opacity-70'
              }`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-base ${
                      achieved ? 'text-primary-container' : 'text-tertiary'
                    }`}
                    style={
                      achieved ? { fontVariationSettings: "'FILL' 1" } : undefined
                    }
                  >
                    {achieved ? 'verified' : 'lock'}
                  </span>
                  <span className="text-body-sm font-body-sm text-white font-semibold">
                    {lang === 'sl' ? m.titleSl : m.titleEn}
                  </span>
                </div>
                <span className="text-label-sm font-label-sm text-primary font-bold">
                  {pct}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-container to-secondary"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* Previous Attempts History */}
      <section className="rounded-xl bg-surface-container-low p-space-md machined-border space-y-2">
        <h3 className="text-label-sm font-label-sm text-primary uppercase tracking-wider">
          {tr('previousAttempts')} ({state.nofapHistory.length})
        </h3>
        {state.nofapHistory.length === 0 ? (
          <p className="text-body-sm font-body-sm text-on-surface-variant italic">
            {tr('noPreviousAttempts')}
          </p>
        ) : (
          state.nofapHistory.map((item) => {
            const d = Math.floor(item.durationSeconds / 86400);
            const h = Math.floor((item.durationSeconds % 86400) / 3600);
            return (
              <div
                key={item.id}
                className="p-2.5 rounded-lg bg-surface-container machined-border"
              >
                <div className="flex justify-between text-label-sm font-label-sm text-primary">
                  <span>
                    {d} Days {h} Hours
                  </span>
                  <span className="text-tertiary">
                    {item.startTimestamp.slice(0, 10)} → {item.endTimestamp.slice(0, 10)}
                  </span>
                </div>
                <p className="text-body-sm font-body-sm text-on-surface mt-1">
                  {item.resetReason}
                </p>
              </div>
            );
          })
        )}
      </section>

      {/* Set Start Date Modal */}
      {dateModalVisible && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-surface-container p-space-md machined-border thermal-top-edge space-y-3">
            <h3 className="text-headline-sm font-headline-sm text-white">
              {tr('setStartDateBtn')}
            </h3>
            <p className="text-body-sm text-on-surface-variant">
              Format: YYYY-MM-DD HH:MM
            </p>
            {dateError && <p className="text-label-sm text-error">{dateError}</p>}
            <input
              value={customDateStr}
              onChange={(e) => setCustomDateStr(e.target.value)}
              className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDateModalVisible(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-low text-tertiary text-label-sm machined-border"
              >
                {tr('cancel')}
              </button>
              <button
                onClick={handleSaveStartDate}
                className="px-5 py-2 rounded-lg bg-primary-container text-on-primary font-bold text-label-sm machined-border"
              >
                {tr('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reset Modal */}
      {resetModalVisible && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-surface-container p-space-md machined-border border-t-2 border-t-red-500 space-y-3">
            <h3 className="text-headline-sm font-headline-sm text-error">
              {tr('resetConfirmTitle')}
            </h3>
            <p className="text-body-sm text-on-surface-variant">
              {tr('resetConfirmDesc')}
            </p>
            <textarea
              value={resetReason}
              onChange={(e) => setResetReason(e.target.value)}
              placeholder={tr('resetReasonPlaceholder')}
              rows={3}
              className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setResetModalVisible(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-low text-tertiary text-label-sm machined-border"
              >
                {tr('cancel')}
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-5 py-2 rounded-lg bg-error-container text-on-error-container font-bold text-label-sm machined-border"
              >
                {tr('confirmReset')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PerformanceHQShell>
  );
}
