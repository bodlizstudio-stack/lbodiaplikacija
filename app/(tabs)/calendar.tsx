import React, { useMemo, useState } from 'react';
import { useApp } from '../../src/store/AppContext';
import { PerformanceHQShell } from '../../src/components/PerformanceHQShell';
import {
  addDays,
  getDayOfWeek,
  parseDateStringUTCNoon,
} from '../../src/utils/dateUtils';

const MONTH_NAMES_SL = [
  'Januar',
  'Februar',
  'Marec',
  'April',
  'Maj',
  'Junij',
  'Julij',
  'Avgust',
  'September',
  'Oktober',
  'November',
  'December',
];

const MONTH_NAMES_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function CalendarScreen() {
  const {
    state,
    todayDateStr,
    tr,
    toggleHabitCompletion,
    updateDailySummaryNotes,
    ensureDateRecords,
  } = useApp();

  const lang = state.settings.language;
  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [manualCorrectionEnabled, setManualCorrectionEnabled] = useState(false);

  const selectedDateObj = useMemo(
    () => parseDateStringUTCNoon(selectedDate),
    [selectedDate]
  );
  const currentYear = selectedDateObj.getUTCFullYear();
  const currentMonth = selectedDateObj.getUTCMonth();

  const monthDays = useMemo(() => {
    const firstDayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const firstDow = getDayOfWeek(firstDayStr);
    const leadingBlanks = firstDow === 0 ? 6 : firstDow - 1;
    const daysInMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < leadingBlanks; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(
        `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(
          2,
          '0'
        )}`
      );
    }
    return cells;
  }, [currentYear, currentMonth]);

  const weekDays = useMemo(() => {
    const dow = getDayOfWeek(selectedDate);
    const diffToMon = dow === 0 ? -6 : 1 - dow;
    const mon = addDays(selectedDate, diffToMon);
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  }, [selectedDate]);

  const changeMonth = (delta: number) => {
    const dt = new Date(Date.UTC(currentYear, currentMonth + delta, 1, 12, 0, 0));
    setSelectedDate(
      `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-01`
    );
  };

  const getDayDotClass = (dateStr: string): string => {
    const s = state.dailySummaries[dateStr];
    if (!s || s.scheduledCount === 0) return 'bg-surface-variant';
    if (s.completedCount >= s.scheduledCount) return 'bg-emerald-500';
    if (s.completedCount > 0) return 'bg-primary-container';
    return 'bg-red-500';
  };

  const computePeriodAvg = (daysBack: number) => {
    let totalScore = 0;
    let countedDays = 0;
    let perfectDays = 0;
    for (let i = 0; i < daysBack; i++) {
      const d = addDays(todayDateStr, -i);
      const s = state.dailySummaries[d];
      if (s && s.scheduledCount > 0) {
        totalScore += s.disciplineScore;
        countedDays++;
        if (s.completedCount >= s.scheduledCount) perfectDays++;
      }
    }
    return {
      avgScore: countedDays > 0 ? Math.round(totalScore / countedDays) : 0,
      perfectDays,
    };
  };

  const stats7 = useMemo(() => computePeriodAvg(7), [state.dailySummaries, todayDateStr]);
  const stats30 = useMemo(() => computePeriodAvg(30), [state.dailySummaries, todayDateStr]);
  const stats90 = useMemo(() => computePeriodAvg(90), [state.dailySummaries, todayDateStr]);
  const stats365 = useMemo(() => computePeriodAvg(365), [state.dailySummaries, todayDateStr]);

  const dayRecords = useMemo(
    () => state.dailyHabitRecords.filter((r) => r.date === selectedDate),
    [state.dailyHabitRecords, selectedDate]
  );
  const completedDayRecords = dayRecords.filter((r) => r.completed);
  const missedDayRecords = dayRecords.filter((r) => !r.completed);
  const daySummary = state.dailySummaries[selectedDate];
  const dayManifestations = state.manifestations.filter((m) => m.date === selectedDate);

  return (
    <PerformanceHQShell>
      {/* Period Telemetry Grid (7d, 30d, 90d, 365d) */}
      <section className="grid grid-cols-2 gap-2.5">
        {[
          { label: tr('stats7Days'), data: stats7 },
          { label: tr('stats30Days'), data: stats30 },
          { label: tr('stats90Days'), data: stats90 },
          { label: tr('stats365Days'), data: stats365 },
        ].map((item, idx) => (
          <div
            key={idx}
            className="rounded-xl bg-surface-container p-3 machined-border flex flex-col justify-between"
          >
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase">
              {item.label}
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-headline-md font-headline-md text-primary-container font-bold">
                {item.data.avgScore}%
              </span>
              <span className="text-label-sm font-label-sm text-tertiary">
                {item.data.perfectDays} Perfect
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* Interactive Calendar Card */}
      <section className="rounded-xl bg-surface-container p-space-md machined-border thermal-top-edge">
        <div className="flex items-center justify-between mb-space-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-primary machined-border"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <h3 className="text-headline-sm font-headline-sm text-white">
              {(lang === 'sl' ? MONTH_NAMES_SL : MONTH_NAMES_EN)[currentMonth]}{' '}
              {currentYear}
            </h3>
            <button
              onClick={() => changeMonth(1)}
              className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-primary machined-border"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>

          <div className="flex bg-surface-container-lowest p-0.5 rounded-lg machined-border">
            <button
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1 rounded text-label-sm font-label-sm ${
                viewMode === 'month'
                  ? 'bg-primary-container text-on-primary font-bold'
                  : 'text-tertiary'
              }`}
            >
              {lang === 'sl' ? 'Mesec' : 'Month'}
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-2.5 py-1 rounded text-label-sm font-label-sm ${
                viewMode === 'week'
                  ? 'bg-primary-container text-on-primary font-bold'
                  : 'text-tertiary'
              }`}
            >
              {lang === 'sl' ? 'Teden' : 'Week'}
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 text-center mb-1">
          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => (
            <span
              key={d}
              className="text-label-sm font-label-sm text-tertiary py-1"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {(viewMode === 'month' ? monthDays : weekDays).map((dateStr, idx) => {
            if (!dateStr) {
              return <div key={`blank_${idx}`} className="h-11" />;
            }
            const dayNum = Number(dateStr.slice(8, 10));
            const isSelected = dateStr === selectedDate;
            const dotClass = getDayDotClass(dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`h-11 rounded-lg flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-surface-container-highest border border-primary-container thermal-glow-sm'
                    : 'bg-surface-container-low hover:bg-surface-container-high machined-border'
                }`}
              >
                <span
                  className={`text-label-md font-label-md ${
                    isSelected ? 'text-primary-container font-bold' : 'text-white'
                  }`}
                >
                  {dayNum}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dotClass}`} />
              </button>
            );
          })}
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap justify-between gap-2 mt-3 pt-2 border-t border-surface-variant text-label-sm font-label-sm text-tertiary">
          <span className="flex items-center gap-1">
            <i className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></i> 100%
          </span>
          <span className="flex items-center gap-1">
            <i className="w-2 h-2 rounded-full bg-primary-container inline-block"></i>{' '}
            Partial
          </span>
          <span className="flex items-center gap-1">
            <i className="w-2 h-2 rounded-full bg-red-500 inline-block"></i> 0% Missed
          </span>
          <span className="flex items-center gap-1">
            <i className="w-2 h-2 rounded-full bg-surface-variant inline-block"></i> Rest
          </span>
        </div>
      </section>

      {/* Historical Day Drill-Down Summary */}
      <section className="rounded-xl bg-surface-container-low p-space-md machined-border space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-label-sm font-label-sm text-primary uppercase">
              HISTORICAL TELEMETRY LOG
            </span>
            <h3 className="text-headline-sm font-headline-sm text-white">
              {selectedDate} • {daySummary?.disciplineScore ?? 0}% Discipline
            </h3>
          </div>
          <button
            onClick={async () => {
              await ensureDateRecords(selectedDate);
              setManualCorrectionEnabled(!manualCorrectionEnabled);
            }}
            className={`px-2.5 py-1.5 rounded-lg text-label-sm font-label-sm flex items-center gap-1 machined-border ${
              manualCorrectionEnabled
                ? 'bg-primary-container text-on-primary font-bold'
                : 'bg-surface-container text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">edit_calendar</span>
            <span>{manualCorrectionEnabled ? 'Editing Active' : 'Manual Fix'}</span>
          </button>
        </div>

        {/* Completed vs Missed */}
        <div className="space-y-1.5">
          <p className="text-label-sm font-label-sm text-emerald-400 uppercase">
            Completed Missions ({completedDayRecords.length})
          </p>
          {completedDayRecords.map((rec) => (
            <div
              key={rec.id}
              onClick={() =>
                (manualCorrectionEnabled || selectedDate === todayDateStr) &&
                toggleHabitCompletion(selectedDate, rec.habitId)
              }
              className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container machined-border cursor-pointer"
            >
              <span className="text-body-sm font-body-sm text-on-surface">
                {rec.habitTitleSnapshot}
              </span>
              <span className="material-symbols-outlined text-emerald-400 text-base">
                check_circle
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <p className="text-label-sm font-label-sm text-error uppercase">
            Missed Missions ({missedDayRecords.length})
          </p>
          {missedDayRecords.map((rec) => (
            <div
              key={rec.id}
              onClick={() =>
                (manualCorrectionEnabled || selectedDate === todayDateStr) &&
                toggleHabitCompletion(selectedDate, rec.habitId)
              }
              className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container machined-border cursor-pointer"
            >
              <span className="text-body-sm font-body-sm text-on-surface-variant">
                {rec.habitTitleSnapshot}
              </span>
              <span className="material-symbols-outlined text-error text-base">
                cancel
              </span>
            </div>
          ))}
        </div>

        {dayManifestations.length > 0 && (
          <div className="pt-2 border-t border-surface-variant">
            <p className="text-label-sm font-label-sm text-secondary uppercase mb-1">
              Manifestation Logs ({dayManifestations.length}/3)
            </p>
            {dayManifestations.map((m) => (
              <div
                key={m.id}
                className="p-2 rounded bg-surface-container mb-1 text-body-sm text-on-surface"
              >
                <strong className="text-primary uppercase text-label-sm mr-2">
                  {m.session}:
                </strong>
                {m.presentTenseStatement || m.gratefulFor}
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="text-label-sm font-label-sm text-tertiary uppercase block mb-1">
            Day Notes
          </label>
          <textarea
            value={daySummary?.notes ?? ''}
            onChange={(e) => updateDailySummaryNotes(selectedDate, e.target.value)}
            rows={2}
            placeholder="Record operational notes for this date..."
            className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
          />
        </div>
      </section>
    </PerformanceHQShell>
  );
}
