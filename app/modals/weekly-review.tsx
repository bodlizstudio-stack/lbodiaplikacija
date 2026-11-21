import React, { useMemo, useState } from 'react';
import { useApp } from '../../src/store/AppContext';
import { PerformanceHQShell } from '../../src/components/PerformanceHQShell';
import {
  computeWeeklyReviewStats,
  getWeekBounds,
} from '../../src/utils/dateUtils';

export default function WeeklyReviewModalScreen() {
  const {
    state,
    todayDateStr,
    tr,
    submitWeeklyReview,
    deleteWeeklyReview,
  } = useApp();

  const { weekStart, weekEnd } = useMemo(
    () => getWeekBounds(todayDateStr),
    [todayDateStr]
  );

  const autoStats = useMemo(
    () =>
      computeWeeklyReviewStats(
        weekStart,
        weekEnd,
        state.dailyHabitRecords,
        Object.values(state.dailySummaries),
        state.manifestations,
        state.physiqueEntries
      ),
    [
      weekStart,
      weekEnd,
      state.dailyHabitRecords,
      state.dailySummaries,
      state.manifestations,
      state.physiqueEntries,
    ]
  );

  const existingThisWeek = useMemo(
    () => state.weeklyReviews.find((r) => r.weekStartDate === weekStart),
    [state.weeklyReviews, weekStart]
  );

  const [achievedNothing, setAchievedNothing] = useState(
    existingThisWeek?.achievedNothing ?? false
  );
  const [achievements, setAchievements] = useState(
    existingThisWeek?.achievements ?? ''
  );
  const [failedGoals, setFailedGoals] = useState(
    existingThisWeek?.failedGoals ?? ''
  );
  const [learned, setLearned] = useState(existingThisWeek?.learned ?? '');
  const [improveNextWeek, setImproveNextWeek] = useState(
    existingThisWeek?.improveNextWeek ?? ''
  );
  const [proudOf, setProudOf] = useState(existingThisWeek?.proudOf ?? '');
  const [topGoalNextWeek, setTopGoalNextWeek] = useState(
    existingThisWeek?.topGoalNextWeek ?? ''
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleToggleZeroAchievement = () => {
    const next = !achievedNothing;
    setAchievedNothing(next);
    if (next) {
      setAchievements("I DIDN'T ACHIEVE ANYTHING THIS WEEK.");
      setProudOf('Nothing. Zero excuses next week.');
    }
  };

  const handleSubmit = async () => {
    if (!achievedNothing && !achievements.trim() && !topGoalNextWeek.trim()) {
      setErrorMsg(
        'Complete the review questions or select "I didn’t achieve anything this week".'
      );
      return;
    }
    setErrorMsg('');
    await submitWeeklyReview({
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      achievedNothing,
      achievements: achievements.trim(),
      failedGoals: failedGoals.trim(),
      learned: learned.trim(),
      improveNextWeek: improveNextWeek.trim(),
      proudOf: proudOf.trim(),
      topGoalNextWeek: topGoalNextWeek.trim(),
      statsSnapshot: autoStats,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <PerformanceHQShell
      showBackButton
      subtitle={`Week: ${weekStart} → ${weekEnd}`}
    >
      {/* Automatic Weekly Telemetry */}
      <section className="rounded-xl bg-surface-container p-space-md machined-border thermal-glow thermal-top-edge space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-label-sm font-label-sm text-primary uppercase tracking-widest">
            AUTOMATIC WEEKLY TELEMETRY
          </span>
          <span className="text-label-sm font-label-sm text-secondary font-bold">
            {autoStats.weeklyCompletionPct}% EXECUTION
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-surface-container-low p-2.5 rounded-lg machined-border">
            <span className="text-headline-sm font-headline-sm text-white block">
              {autoStats.completedHabits}/{autoStats.totalScheduledHabits}
            </span>
            <span className="text-label-sm font-label-sm text-tertiary uppercase">
              Missions Done
            </span>
          </div>
          <div className="bg-surface-container-low p-2.5 rounded-lg machined-border">
            <span className="text-headline-sm font-headline-sm text-primary-container block">
              {autoStats.avgDisciplineScore}%
            </span>
            <span className="text-label-sm font-label-sm text-tertiary uppercase">
              Avg Discipline
            </span>
          </div>
        </div>

        <div className="text-label-sm font-label-sm space-y-1 pt-2 border-t border-surface-variant">
          <p className="text-on-surface">
            MOST CONSISTENT:{' '}
            <span className="text-emerald-400">
              {autoStats.mostConsistentHabit || '—'}
            </span>
          </p>
          <p className="text-on-surface">
            MOST MISSED:{' '}
            <span className="text-error">{autoStats.mostMissedHabit || '—'}</span>
          </p>
          <p className="text-on-surface">
            MANIFESTATIONS: <span className="text-secondary">{autoStats.manifestationSessionsCount}</span> •
            PHYSIQUE PHOTO:{' '}
            <span className="text-primary">
              {autoStats.physiquePhotoTaken ? 'VERIFIED' : 'PENDING'}
            </span>
          </p>
        </div>
      </section>

      {/* Honest Zero-Achievement Dedicated Button */}
      <button
        onClick={handleToggleZeroAchievement}
        className={`w-full py-3 px-4 rounded-xl text-label-md font-label-md flex items-center justify-center gap-2 machined-border transition-colors ${
          achievedNothing
            ? 'bg-red-600 text-white font-bold'
            : 'bg-error-container/30 text-error border border-error/50'
        }`}
      >
        <span className="material-symbols-outlined text-base">
          {achievedNothing ? 'check_box' : 'check_box_outline_blank'}
        </span>
        <span>{tr('achievedNothingBtn')}</span>
      </button>

      {/* 6 Mandatory Questions */}
      <section className="rounded-xl bg-surface-container p-space-md machined-border space-y-3">
        {errorMsg && <p className="text-label-sm text-error">{errorMsg}</p>}
        {[
          { label: tr('q1Achievements'), val: achievements, set: setAchievements },
          { label: tr('q2Failed'), val: failedGoals, set: setFailedGoals },
          { label: tr('q3Learned'), val: learned, set: setLearned },
          { label: tr('q4Improve'), val: improveNextWeek, set: setImproveNextWeek },
          { label: tr('q5Proud'), val: proudOf, set: setProudOf },
          { label: tr('q6TopGoal'), val: topGoalNextWeek, set: setTopGoalNextWeek },
        ].map((q, idx) => (
          <div key={idx}>
            <label className="text-label-sm font-label-sm text-primary uppercase block mb-1">
              {q.label}
            </label>
            <textarea
              value={q.val}
              onChange={(e) => q.set(e.target.value)}
              rows={2}
              placeholder="..."
              className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
            />
          </div>
        ))}

        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-primary-container to-inverse-primary text-on-primary font-bold text-label-lg machined-border"
        >
          {savedNotice ? 'WEEKLY REVIEW LOGGED ✓' : tr('submitReviewBtn')}
        </button>
      </section>

      {/* Past Reviews Archive */}
      {state.weeklyReviews.length > 0 && (
        <section className="space-y-2">
          <span className="text-label-sm font-label-sm text-primary uppercase tracking-wider block">
            PAST WEEKLY REVIEWS ({state.weeklyReviews.length})
          </span>
          {state.weeklyReviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-xl bg-surface-container-low p-space-md machined-border"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-label-md font-label-md text-primary font-bold">
                  {rev.weekStartDate} → {rev.weekEndDate}
                </span>
                <button
                  onClick={() => deleteWeeklyReview(rev.id)}
                  className="text-tertiary hover:text-error"
                >
                  <span className="material-symbols-outlined text-base">
                    delete
                  </span>
                </button>
              </div>
              <p className="text-body-sm text-white">{rev.achievements}</p>
            </div>
          ))}
        </section>
      )}
    </PerformanceHQShell>
  );
}
