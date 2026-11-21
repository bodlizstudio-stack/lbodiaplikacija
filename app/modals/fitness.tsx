import React, { useMemo, useState } from 'react';
import { useApp } from '../../src/store/AppContext';
import { LBODIShell } from '../../src/components/LBODIShell';
import { WorkoutExercise } from '../../src/types';

export default function FitnessAndWellnessScreen() {
  const {
    state,
    todayDateStr,
    saveWorkoutLog,
    deleteWorkoutLog,
    saveDailyCheckIn,
  } = useApp();

  const lang = state.settings.language;
  const workouts = state.workoutLogs || [];
  const existingCheckIn = state.dailyCheckIns?.[todayDateStr];

  const [tab, setTab] = useState<'checkin' | 'workout'>('checkin');

  // 30-second Daily Check-In state
  const [sleepHours, setSleepHours] = useState(
    existingCheckIn?.sleepHours ? String(existingCheckIn.sleepHours) : '7.5'
  );
  const [energy, setEnergy] = useState(existingCheckIn?.energy || 4);
  const [mood, setMood] = useState(existingCheckIn?.mood || 4);
  const [stress, setStress] = useState(existingCheckIn?.stress || 2);
  const [mainPriority, setMainPriority] = useState(existingCheckIn?.mainPriority || '');
  const [gratitudeQuick, setGratitudeQuick] = useState(existingCheckIn?.gratitudeQuick || '');
  const [checkInSaved, setCheckInSaved] = useState(false);

  // Minimal Practical Workout Logger state
  const [wDate, setWDate] = useState(todayDateStr);
  const [wCategory, setWCategory] = useState('Moč / Fitnes');
  const [duration, setDuration] = useState('60');
  const [wNotes, setWNotes] = useState('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([
    { id: 'ex_1', name: 'Počepi / Squats', sets: 4, reps: '8', weightKg: 80 },
  ]);
  const [newExName, setNewExName] = useState('');
  const [newExSets, setNewExSets] = useState('3');
  const [newExReps, setNewExReps] = useState('10');
  const [newExWeight, setNewExWeight] = useState('');

  const weeklyWorkoutCount = useMemo(() => {
    const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    return workouts.filter((w) => w.date >= cutoff).length;
  }, [workouts]);

  const handleSaveCheckIn = async () => {
    await saveDailyCheckIn({
      date: todayDateStr,
      sleepHours: parseFloat(sleepHours) || undefined,
      energy,
      mood,
      stress,
      mainPriority: mainPriority.trim() || undefined,
      gratitudeQuick: gratitudeQuick.trim() || undefined,
    });
    setCheckInSaved(true);
    setTimeout(() => setCheckInSaved(false), 2000);
  };

  const handleAddExerciseRow = () => {
    if (!newExName.trim()) return;
    setExercises([
      ...exercises,
      {
        id: `ex_${Date.now()}`,
        name: newExName.trim(),
        sets: parseInt(newExSets, 10) || 3,
        reps: newExReps.trim() || '10',
        weightKg: newExWeight ? parseFloat(newExWeight) : undefined,
      },
    ]);
    setNewExName('');
    setNewExWeight('');
  };

  const handleSaveWorkout = async () => {
    await saveWorkoutLog({
      date: wDate || todayDateStr,
      category: wCategory,
      exercises,
      durationMinutes: parseInt(duration, 10) || 45,
      notes: wNotes.trim() || undefined,
    });
    setWNotes('');
    setTab('workout');
  };

  return (
    <LBODIShell showBackButton subtitle="Trening, spanec in dnevno počutje">
      <section className="lbodi-card thermal-top-edge p-4 space-y-3">
        <h1 className="font-sacred text-2xl font-semibold text-[var(--text-main)]">
          {lang === 'sl' ? 'Telesno zdravje in check-in' : 'Fitness & Daily Check-In'}
        </h1>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setTab('checkin')}
            className={`py-2 rounded-xl text-xs font-semibold border ${
              tab === 'checkin'
                ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent'
                : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
            }`}
          >
            Dnevni check-in (30s)
          </button>
          <button
            onClick={() => setTab('workout')}
            className={`py-2 rounded-xl text-xs font-semibold border ${
              tab === 'workout'
                ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent'
                : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
            }`}
          >
            Dnevnik vadbe ({weeklyWorkoutCount}/teden)
          </button>
        </div>
      </section>

      {tab === 'checkin' && (
        <section className="lbodi-card p-4 space-y-3">
          <div>
            <label className="text-xs text-[var(--accent-gold)] block mb-1">Ure spanja</label>
            <input
              type="number"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
            />
          </div>

          {[
            ['Energija (1–5)', energy, setEnergy],
            ['Razpoloženje (1–5)', mood, setMood],
            ['Stres (1 = miren, 5 = zelo napet)', stress, setStress],
          ].map(([label, val, setter]: any, idx) => (
            <div key={idx}>
              <span className="text-xs text-[var(--text-main)] block mb-1">{label}</span>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setter(n)}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      val === n
                        ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent'
                        : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <input
            value={mainPriority}
            onChange={(e) => setMainPriority(e.target.value)}
            placeholder="Glavna prioriteta dneva..."
            className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
          />
          <input
            value={gratitudeQuick}
            onChange={(e) => setGratitudeQuick(e.target.value)}
            placeholder="Kratka zahvala Bogu..."
            className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
          />

          <button onClick={handleSaveCheckIn} className="w-full py-3 rounded-xl lbodi-gold-btn text-xs">
            {checkInSaved ? 'Shranjeno ✓' : 'Shrani 30-sekundni check-in'}
          </button>
        </section>
      )}

      {tab === 'workout' && (
        <>
          <section className="lbodi-card p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={wDate}
                onChange={(e) => setWDate(e.target.value)}
                className="rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
              />
              <input
                value={wCategory}
                onChange={(e) => setWCategory(e.target.value)}
                placeholder="Tip vadbe (Fitnes, Tek...)"
                className="rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
              />
            </div>

            <div className="space-y-1.5">
              {exercises.map((ex) => (
                <div
                  key={ex.id}
                  className="p-2 rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] flex justify-between text-xs"
                >
                  <span className="text-[var(--text-main)]">
                    {ex.name} — {ex.sets}×{ex.reps} {ex.weightKg ? `(${ex.weightKg} kg)` : ''}
                  </span>
                  <button
                    onClick={() => setExercises(exercises.filter((x) => x.id !== ex.id))}
                    className="text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-xs">
              <input
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                placeholder="Vaja"
                className="col-span-2 rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-[var(--text-main)]"
              />
              <input
                value={newExSets}
                onChange={(e) => setNewExSets(e.target.value)}
                placeholder="Ser."
                className="rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-[var(--text-main)]"
              />
              <input
                value={newExReps}
                onChange={(e) => setNewExReps(e.target.value)}
                placeholder="Pon."
                className="rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-[var(--text-main)]"
              />
            </div>
            <div className="flex gap-2">
              <input
                value={newExWeight}
                onChange={(e) => setNewExWeight(e.target.value)}
                placeholder="Teža kg (opcijsko)"
                className="flex-1 rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
              />
              <button
                onClick={handleAddExerciseRow}
                className="px-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--accent-gold)]"
              >
                + Dodaj vajo
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Trajanje (min)"
                className="rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
              />
              <input
                value={wNotes}
                onChange={(e) => setWNotes(e.target.value)}
                placeholder="Opombe..."
                className="rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
              />
            </div>

            <button onClick={handleSaveWorkout} className="w-full py-2.5 rounded-xl lbodi-gold-btn text-xs">
              Shrani vadbo
            </button>
          </section>

          <section className="space-y-2">
            {workouts.map((w) => (
              <div key={w.id} className="lbodi-card p-3.5 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="font-semibold text-[var(--accent-gold)]">
                    {w.date} • {w.category} ({w.durationMinutes || 45} min)
                  </span>
                  <button onClick={() => deleteWorkoutLog(w.id)} className="text-red-400">
                    Izbriši
                  </button>
                </div>
                {w.exercises.map((ex) => (
                  <p key={ex.id} className="text-[var(--text-main)]">
                    • {ex.name}: {ex.sets}×{ex.reps} {ex.weightKg ? `@ ${ex.weightKg}kg` : ''}
                  </p>
                ))}
              </div>
            ))}
          </section>
        </>
      )}
    </LBODIShell>
  );
}
