import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../src/store/AppContext';
import { LBODIShell, CrossIcon } from '../../src/components/LBODIShell';
import { DEFAULT_DISCIPLINE_PRIVACY } from '../../src/data/faithData';
import { NOFAP_MILESTONES } from '../../src/data/seedData';
import {
  calculateNoFapStreak,
  getDayOfWeek,
  parseDateStringUTCNoon,
} from '../../src/utils/dateUtils';

export default function DisciplinePurityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ emergency?: string }>();
  const {
    state,
    todayDateStr,
    setNoFapStartDate,
    resetNoFapStreak,
    updateDisciplinePrivacy,
  } = useApp();

  const lang = state.settings.language;
  const privacy = state.settings.disciplinePrivacy || DEFAULT_DISCIPLINE_PRIVACY;

  // Derived strictly from persisted startTimestamp — survives browser reloads
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const currentStreak = useMemo(
    () => calculateNoFapStreak(state.nofapState.startTimestamp, nowMs),
    [state.nofapState.startTimestamp, nowMs]
  );

  const longestDays = Math.floor(
    Math.max(state.nofapState.longestStreakSeconds, currentStreak.totalSeconds) / 86400
  );

  const totalSuccessfulDays = useMemo(() => {
    const pastSeconds = state.nofapHistory.reduce((acc, h) => acc + h.durationSeconds, 0);
    return Math.floor((pastSeconds + currentStreak.totalSeconds) / 86400);
  }, [state.nofapHistory, currentStreak.totalSeconds]);

  const nextMilestone = useMemo(
    () => NOFAP_MILESTONES.find((m) => m.days > currentStreak.days) || NOFAP_MILESTONES[NOFAP_MILESTONES.length - 1],
    [currentStreak.days]
  );

  // Modals
  const [startModalVisible, setStartModalVisible] = useState(false);
  const [customDateStr, setCustomDateStr] = useState(
    state.nofapState.startTimestamp.slice(0, 16).replace('T', ' ')
  );
  const [personalReason, setPersonalReason] = useState(privacy.personalReason);
  const [goalDays, setGoalDays] = useState(String(privacy.personalGoalDays || 365));
  const [customTitle, setCustomTitle] = useState(privacy.customTitle);
  const [dateError, setDateError] = useState('');

  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [postResetEncouragement, setPostResetEncouragement] = useState(false);

  // Full-Screen "Potrebujem moč / I Need Strength" Support Experience
  const [supportVisible, setSupportVisible] = useState(params.emergency === '1');
  const [groundingSec, setGroundingSec] = useState(60);
  const [groundingRunning, setGroundingRunning] = useState(false);

  useEffect(() => {
    if (!supportVisible || !groundingRunning) return;
    const t = setInterval(() => {
      setGroundingSec((prev) => {
        if (prev <= 1) {
          setGroundingRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [supportVisible, groundingRunning]);

  // Monthly History Calendar
  const todayObj = parseDateStringUTCNoon(todayDateStr);
  const [calYear, setCalYear] = useState(todayObj.getUTCFullYear());
  const [calMonth, setCalMonth] = useState(todayObj.getUTCMonth());

  const calCells = useMemo(() => {
    const firstStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`;
    const dow = getDayOfWeek(firstStr);
    const leading = dow === 0 ? 6 : dow - 1;
    const daysCount = new Date(Date.UTC(calYear, calMonth + 1, 0)).getUTCDate();
    const list: (string | null)[] = [];
    for (let i = 0; i < leading; i++) list.push(null);
    for (let d = 1; d <= daysCount; d++) {
      list.push(`${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return list;
  }, [calYear, calMonth]);

  const streakStartDateOnly = state.nofapState.startTimestamp.slice(0, 10);
  const setbackDates = useMemo(
    () => new Set(state.nofapHistory.map((h) => h.endTimestamp.slice(0, 10))),
    [state.nofapHistory]
  );

  const handleSaveStartConfig = async () => {
    const normalized = customDateStr.trim().replace(' ', 'T');
    const parsed = new Date(normalized);
    if (isNaN(parsed.getTime()) || parsed.getTime() > Date.now()) {
      setDateError(
        lang === 'sl'
          ? 'Vnesi veljaven pretekli datum in uro (YYYY-MM-DD HH:MM).'
          : 'Enter a valid past date and time (YYYY-MM-DD HH:MM).'
      );
      return;
    }
    setDateError('');
    await setNoFapStartDate(parsed.toISOString());
    await updateDisciplinePrivacy({
      personalReason: personalReason.trim() || privacy.personalReason,
      personalGoalDays: parseInt(goalDays, 10) || 365,
      customTitle: customTitle.trim() || 'Disciplina in čistost',
    });
    setStartModalVisible(false);
  };

  const handleConfirmReset = async () => {
    await resetNoFapStreak(resetReason);
    setResetReason('');
    setResetModalVisible(false);
    setPostResetEncouragement(true);
  };

  return (
    <LBODIShell showBackButton subtitle={privacy.customTitle || 'Disciplina in čistost'}>
      {/* Gentle Post-Reset Christian Encouragement */}
      {postResetEncouragement && (
        <section className="lbodi-card p-4 border-[var(--border-gold)] space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-sacred text-lg font-semibold text-[var(--accent-gold)]">
                {lang === 'sl'
                  ? 'En neuspeh ne izbriše vsega napredka. Vstani in nadaljuj.'
                  : 'One setback does not erase all your progress. Rise and keep walking.'}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Pregovori 24,16 — &ldquo;Kajti sedemkrat pade pravični in spet vstane.&rdquo;
              </p>
            </div>
            <button onClick={() => setPostResetEncouragement(false)}>
              <span className="material-symbols-outlined text-base text-[var(--text-muted)]">
                close
              </span>
            </button>
          </div>
        </section>
      )}

      {/* Main Counter Card */}
      <section className="lbodi-card thermal-top-edge p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[var(--accent-gold)] font-semibold">
              {lang === 'sl' ? 'Zasebna zaveza' : 'Purity & Self-Control'}
            </span>
            <h1 className="font-sacred text-2xl sm:text-3xl font-semibold text-[var(--text-main)]">
              {privacy.customTitle || 'Disciplina in čistost'}
            </h1>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--bg-elevated)] text-[var(--accent-gold)] border border-[var(--border-gold)] font-semibold">
            {currentStreak.days} {lang === 'sl' ? 'dni' : 'days'}
          </span>
        </div>

        {/* Live Counter Derived From Persisted Timestamp */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { val: currentStreak.days, lbl: lang === 'sl' ? 'Dni' : 'Days' },
            { val: String(currentStreak.hours).padStart(2, '0'), lbl: lang === 'sl' ? 'Ur' : 'Hrs' },
            { val: String(currentStreak.minutes).padStart(2, '0'), lbl: lang === 'sl' ? 'Min' : 'Min' },
            { val: String(currentStreak.seconds).padStart(2, '0'), lbl: lang === 'sl' ? 'Sek' : 'Sec' },
          ].map((c, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)]"
            >
              <span className="text-xl sm:text-2xl font-bold text-[var(--text-main)] block">
                {c.val}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                {c.lbl}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] block">
              {lang === 'sl' ? 'Začetek niza' : 'Started'}
            </span>
            <span className="font-semibold text-[var(--text-main)]">
              {streakStartDateOnly}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] block">
              {lang === 'sl' ? 'Najdaljši niz' : 'Longest'}
            </span>
            <span className="font-semibold text-[var(--accent-gold)]">{longestDays} d</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] block">
              {lang === 'sl' ? 'Naslednji mejnik' : 'Next Milestone'}
            </span>
            <span className="font-semibold text-[var(--accent-olive)]">
              {nextMilestone.days} d
            </span>
          </div>
        </div>

        {/* Emergency Support Button */}
        <button
          onClick={() => {
            setGroundingSec(60);
            setGroundingRunning(true);
            setSupportVisible(true);
          }}
          className="w-full py-3 rounded-xl lbodi-gold-btn text-sm flex items-center justify-center gap-2 shadow-lg"
        >
          <CrossIcon size={16} />
          <span>{lang === 'sl' ? 'Potrebujem moč' : 'I Need Strength'}</span>
        </button>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setCustomDateStr(state.nofapState.startTimestamp.slice(0, 16).replace('T', ' '));
              setStartModalVisible(true);
            }}
            className="py-2 px-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-main)]"
          >
            {lang === 'sl' ? 'Začni svojo pot / Nastavi' : 'Set Start & Goal'}
          </button>
          <button
            onClick={() => setResetModalVisible(true)}
            className="py-2 px-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-xs font-medium text-red-400"
          >
            {lang === 'sl' ? 'Zabeleži padec' : 'Record Setback'}
          </button>
        </div>
      </section>

      {/* Personal Motivation Statement ("Zakaj sem začel?") */}
      <section className="lbodi-card p-4 space-y-2">
        <span className="text-[11px] uppercase tracking-wider text-[var(--accent-olive)] font-semibold block">
          {lang === 'sl' ? 'Zakaj sem začel?' : 'Why I Started'}
        </span>
        <p className="font-sacred text-lg italic text-[var(--text-main)] leading-snug">
          &ldquo;{privacy.personalReason}&rdquo;
        </p>
        <p className="text-[11px] text-[var(--text-muted)]">
          {lang === 'sl'
            ? `Skupno zabeleženih dni discipline: ${totalSuccessfulDays} dni • Cilj: ${privacy.personalGoalDays} dni`
            : `Total recorded days: ${totalSuccessfulDays} days • Target: ${privacy.personalGoalDays} days`}
        </p>
      </section>

      {/* Privacy Toggles */}
      <section className="lbodi-card p-4 space-y-2.5">
        <span className="text-[11px] uppercase tracking-wider text-[var(--accent-gold)] font-semibold block">
          {lang === 'sl' ? 'Zasebnost' : 'Privacy Settings'}
        </span>
        <label className="flex items-center justify-between cursor-pointer text-xs text-[var(--text-main)]">
          <span>
            {lang === 'sl'
              ? 'Skrij kartico discipline z domačega zaslona'
              : 'Hide discipline card from Home Dashboard'}
          </span>
          <input
            type="checkbox"
            checked={privacy.hideFromDashboard}
            onChange={(e) => updateDisciplinePrivacy({ hideFromDashboard: e.target.checked })}
            className="w-4 h-4 rounded accent-amber-500"
          />
        </label>
        <div className="flex gap-2">
          <input
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Nevtralen naslov..."
            className="flex-1 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--text-main)]"
          />
          <button
            onClick={() => updateDisciplinePrivacy({ customTitle: customTitle.trim() || 'Disciplina' })}
            className="px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--accent-gold)]"
          >
            {lang === 'sl' ? 'Preimenuj' : 'Save Title'}
          </button>
        </div>
      </section>

      {/* Monthly History Calendar (Progress, Setbacks, No Data clearly distinguished) */}
      <section className="lbodi-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-main)]">
            {lang === 'sl' ? 'Mesečni koledar napredka' : 'Monthly Progress Calendar'} ({calYear}-{String(calMonth + 1).padStart(2, '0')})
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => {
                if (calMonth === 0) {
                  setCalMonth(11);
                  setCalYear(calYear - 1);
                } else setCalMonth(calMonth - 1);
              }}
              className="p-1 rounded bg-[var(--bg-lowest)] border border-[var(--border-subtle)]"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button
              onClick={() => {
                if (calMonth === 11) {
                  setCalMonth(0);
                  setCalYear(calYear + 1);
                } else setCalMonth(calMonth + 1);
              }}
              className="p-1 rounded bg-[var(--bg-lowest)] border border-[var(--border-subtle)]"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {['P', 'T', 'S', 'Č', 'P', 'S', 'N'].map((d, i) => (
            <span key={i} className="text-[10px] text-[var(--text-muted)] py-0.5">
              {d}
            </span>
          ))}
          {calCells.map((dateStr, i) => {
            if (!dateStr) return <div key={`b_${i}`} className="h-8" />;
            const isSetback = setbackDates.has(dateStr);
            const isProgressDay =
              !isSetback && dateStr >= streakStartDateOnly && dateStr <= todayDateStr;

            return (
              <div
                key={dateStr}
                className={`h-8 rounded-lg flex items-center justify-center text-[11px] font-medium border ${
                  isSetback
                    ? 'bg-red-500/20 border-red-400/50 text-red-300'
                    : isProgressDay
                    ? 'bg-[var(--accent-olive)]/25 border-[var(--accent-olive)]/60 text-[var(--text-main)]'
                    : 'bg-[var(--bg-lowest)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                }`}
              >
                {Number(dateStr.slice(8, 10))}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 text-[10px] text-[var(--text-muted)] pt-1">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[var(--accent-olive)] inline-block" /> Napredek
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-red-400 inline-block" /> Zabeležen padec
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[var(--bg-lowest)] border border-[var(--border-subtle)] inline-block" /> Brez podatkov
          </span>
        </div>
      </section>

      {/* Milestones (1d – 365d) */}
      <section className="lbodi-card p-4 space-y-2">
        <span className="text-[11px] uppercase tracking-wider text-[var(--accent-gold)] font-semibold block">
          {lang === 'sl' ? 'Mejniki discipline' : 'Discipline Milestones'}
        </span>
        {NOFAP_MILESTONES.map((m) => {
          const achieved = currentStreak.days >= m.days;
          return (
            <div
              key={m.days}
              className="p-2.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`material-symbols-outlined text-base ${
                    achieved ? 'text-[var(--accent-olive)]' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {achieved ? 'verified' : 'lock'}
                </span>
                <span className="text-xs font-medium text-[var(--text-main)]">
                  {lang === 'sl' ? m.titleSl : m.titleEn}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[var(--accent-gold)]">
                {achieved ? (lang === 'sl' ? 'Doseženo' : 'Reached') : `${m.days} d`}
              </span>
            </div>
          );
        })}
      </section>

      {/* Historical Records */}
      {state.nofapHistory.length > 0 && (
        <section className="lbodi-card p-4 space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold block">
            {lang === 'sl' ? 'Zgodovina preteklih obdobij' : 'Previous Periods'}
          </span>
          {state.nofapHistory.map((h) => (
            <div
              key={h.id}
              className="p-2.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-xs"
            >
              <div className="flex justify-between text-[var(--accent-gold)] font-medium">
                <span>{Math.floor(h.durationSeconds / 86400)} dni</span>
                <span>{h.endTimestamp.slice(0, 10)}</span>
              </div>
              {h.resetReason && (
                <p className="text-[var(--text-muted)] mt-1">{h.resetReason}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Full-Screen Support Modal: "Potrebujem moč / I Need Strength" */}
      {supportVisible && (
        <div className="fixed inset-0 z-50 bg-[#0B1220] text-[#F4F0E8] overflow-y-auto p-5 flex flex-col justify-between">
          <div className="max-w-md mx-auto w-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#C7A76C]">
                <CrossIcon size={16} />
                <span className="text-xs uppercase tracking-widest font-semibold">
                  {lang === 'sl' ? 'Podpora v skušnjavi' : 'Support In Temptation'}
                </span>
              </div>
              <button
                onClick={() => {
                  setGroundingRunning(false);
                  setSupportVisible(false);
                }}
                className="p-1.5 rounded-lg bg-[#131D2C] text-[#A7B0BD]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-[#131D2C] border border-[#C7A76C]/30 space-y-3">
              <h2 className="font-sacred text-3xl font-semibold leading-tight">
                {lang === 'sl'
                  ? 'Skušnjava ni tvoja identiteta. Danes se lahko odločiš drugače.'
                  : 'Temptation is not your identity. Today you can choose differently.'}
              </h2>
              <p className="text-xs text-[#A7B0BD] leading-relaxed">
                {lang === 'sl'
                  ? '1 Korinčanom 10,13 — Bog je zvest in ti s preizkušnjo vedno pokaže tudi izhod.'
                  : '1 Corinthians 10:13 — God is faithful and always provides a way of escape.'}
              </p>
            </div>

            {/* 60-Second Grounding Exercise */}
            <div className="p-4 rounded-2xl bg-[#131D2C] border border-white/10 text-center space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-[#C7A76C] font-semibold block">
                {lang === 'sl' ? 'Umiritev dihanja (60 sekund)' : '60-Second Grounding'}
              </span>
              <p className="text-4xl font-bold text-[#F4F0E8]">
                00:{String(groundingSec).padStart(2, '0')}
              </p>
              <p className="text-xs text-[#A7B0BD]">
                {lang === 'sl'
                  ? 'Počasi vdihni 4 sekunde, zadrži 4 sekunde, izdihni 6 sekund.'
                  : 'Inhale calmly 4s, hold 4s, exhale slowly 6s.'}
              </p>
              <button
                onClick={() => {
                  if (groundingSec === 0) setGroundingSec(60);
                  setGroundingRunning(!groundingRunning);
                }}
                className="px-4 py-1.5 rounded-lg bg-[#1B293A] text-xs text-[#C7A76C]"
              >
                {groundingRunning ? (lang === 'sl' ? 'Pavza' : 'Pause') : (lang === 'sl' ? 'Zaženi vajo' : 'Start Exercise')}
              </button>
            </div>

            {/* Brief Prayer */}
            <div className="p-4 rounded-2xl bg-[#131D2C] border border-white/10 space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider text-[#7F8D71] font-semibold block">
                {lang === 'sl' ? 'Kratka molitev' : 'Brief Prayer'}
              </span>
              <p className="font-sacred italic text-base leading-snug">
                &ldquo;Gospod Jezus, v tem trenutku sem šibak, a Ti si moja moč. Umiri moje misli, očisti moje srce in mi podari pogum, da zaprem ta zaslon in stopim na svetlobo. Amen.&rdquo;
              </p>
            </div>

            {/* Personal Reason */}
            <div className="p-4 rounded-2xl bg-[#131D2C] border border-white/10 space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[#C7A76C] font-semibold block">
                {lang === 'sl' ? 'Tvoj osebni razlog' : 'Your Personal Reason'}
              </span>
              <p className="text-sm">{privacy.personalReason}</p>
            </div>

            {/* Practical Immediate Actions */}
            <div className="p-4 rounded-2xl bg-[#131D2C] border border-white/10 space-y-1.5 text-xs text-[#A7B0BD]">
              <p className="text-[#F4F0E8] font-semibold">
                {lang === 'sl' ? 'Konkretni naslednji koraki:' : 'Practical steps right now:'}
              </p>
              <p>• {lang === 'sl' ? 'Odloži telefon v drug prostor za 15 minut.' : 'Place your phone in another room for 15 minutes.'}</p>
              <p>• {lang === 'sl' ? 'Pojdi na kratek sprehod ali spij kozarec hladne vode.' : 'Go for a short walk or drink cold water.'}</p>
              <p>• {lang === 'sl' ? 'Pokliči ali napiši sporočilo zaupanja vrednemu prijatelju.' : 'Text or call a trusted friend.'}</p>
            </div>

            <button
              onClick={() => {
                setGroundingRunning(false);
                setSupportVisible(false);
                router.replace('/(tabs)' as any);
              }}
              className="w-full py-3 rounded-xl lbodi-gold-btn text-sm"
            >
              {lang === 'sl' ? 'Nazaj na domači zaslon' : 'Return to Dashboard'}
            </button>
          </div>
        </div>
      )}

      {/* Start Date & Reason Modal */}
      {startModalVisible && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md lbodi-card p-5 space-y-3">
            <h3 className="text-base font-semibold text-[var(--text-main)]">
              {lang === 'sl' ? 'Nastavi začetek in svoj namen' : 'Start Date & Personal Reason'}
            </h3>
            {dateError && <p className="text-xs text-red-400">{dateError}</p>}
            <div>
              <label className="text-[11px] text-[var(--text-muted)] block mb-1">
                {lang === 'sl' ? 'Datum in ura začetka (YYYY-MM-DD HH:MM)' : 'Start Date & Time'}
              </label>
              <input
                value={customDateStr}
                onChange={(e) => setCustomDateStr(e.target.value)}
                className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
              />
            </div>
            <div>
              <label className="text-[11px] text-[var(--text-muted)] block mb-1">
                {lang === 'sl' ? 'Zakaj sem začel?' : 'Why I Started'}
              </label>
              <textarea
                value={personalReason}
                onChange={(e) => setPersonalReason(e.target.value)}
                rows={2}
                className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
              />
            </div>
            <div>
              <label className="text-[11px] text-[var(--text-muted)] block mb-1">
                {lang === 'sl' ? 'Osebni cilj (dni)' : 'Target Days'}
              </label>
              <input
                type="number"
                value={goalDays}
                onChange={(e) => setGoalDays(e.target.value)}
                className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setStartModalVisible(false)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-lowest)] text-xs text-[var(--text-muted)]"
              >
                {lang === 'sl' ? 'Prekliči' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveStartConfig}
                className="px-4 py-2 rounded-xl lbodi-gold-btn text-xs"
              >
                {lang === 'sl' ? 'Shrani' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Non-Judgmental Reset Confirmation */}
      {resetModalVisible && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md lbodi-card p-5 space-y-3 border-t-2 border-t-red-400">
            <h3 className="text-base font-semibold text-[var(--text-main)]">
              {lang === 'sl' ? 'Iskren zapis padca' : 'Record Setback'}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {lang === 'sl'
                ? 'Tvoj pretekli napredek in najdaljši niz ostaneta shranjena. Bog te ne meri po popolnosti — zapiši, kaj se lahko naučiš, in pojdi naprej.'
                : 'Your past progress and longest streak stay preserved. Note what you learned without shame and move forward.'}
            </p>
            <textarea
              value={resetReason}
              onChange={(e) => setResetReason(e.target.value)}
              rows={2}
              placeholder={lang === 'sl' ? 'Opcijski zasebni razmislek...' : 'Optional private reflection...'}
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setResetModalVisible(false)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-lowest)] text-xs text-[var(--text-muted)]"
              >
                {lang === 'sl' ? 'Prekliči' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold text-xs"
              >
                {lang === 'sl' ? 'Potrdi zapis' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </LBODIShell>
  );
}
