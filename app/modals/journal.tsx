import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../src/store/AppContext';
import { PerformanceHQShell } from '../../src/components/PerformanceHQShell';

export default function DailyJournalModalScreen() {
  const { state, todayDateStr, tr, saveDailyJournal } = useApp();

  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const [searchQuery, setSearchQuery] = useState('');

  const existing = state.dailyJournals[selectedDate];

  const [wentWell, setWentWell] = useState('');
  const [wentWrong, setWentWrong] = useState('');
  const [doBetterTomorrow, setDoBetterTomorrow] = useState('');
  const [feelings, setFeelings] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [moodRating, setMoodRating] = useState(4);
  const [energyRating, setEnergyRating] = useState(4);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setWentWell(existing?.wentWell ?? '');
    setWentWrong(existing?.wentWrong ?? '');
    setDoBetterTomorrow(existing?.doBetterTomorrow ?? '');
    setFeelings(existing?.feelings ?? '');
    setGratitude(existing?.gratitude ?? '');
    setMoodRating(existing?.moodRating ?? 4);
    setEnergyRating(existing?.energyRating ?? 4);
  }, [existing, selectedDate]);

  const handleSave = async () => {
    await saveDailyJournal({
      date: selectedDate,
      wentWell: wentWell.trim(),
      wentWrong: wentWrong.trim(),
      doBetterTomorrow: doBetterTomorrow.trim(),
      feelings: feelings.trim(),
      gratitude: gratitude.trim(),
      moodRating,
      energyRating,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const pastEntries = useMemo(() => {
    const all = Object.values(state.dailyJournals).sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    const q = searchQuery.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (e) =>
        e.date.includes(q) ||
        e.wentWell.toLowerCase().includes(q) ||
        e.wentWrong.toLowerCase().includes(q) ||
        e.doBetterTomorrow.toLowerCase().includes(q)
    );
  }, [state.dailyJournals, searchQuery]);

  return (
    <PerformanceHQShell showBackButton subtitle={`Reflection Log • ${selectedDate}`}>
      <section className="rounded-xl bg-surface-container p-space-md machined-border thermal-top-edge space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-label-sm font-label-sm text-primary uppercase block mb-1">
              Mood Rating (1–5)
            </span>
            <div className="grid grid-cols-5 gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setMoodRating(n)}
                  className={`py-1.5 rounded text-label-sm font-bold machined-border ${
                    moodRating === n
                      ? 'bg-primary-container text-on-primary'
                      : 'bg-surface-container-lowest text-tertiary'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-label-sm font-label-sm text-secondary uppercase block mb-1">
              Energy Rating (1–5)
            </span>
            <div className="grid grid-cols-5 gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setEnergyRating(n)}
                  className={`py-1.5 rounded text-label-sm font-bold machined-border ${
                    energyRating === n
                      ? 'bg-primary-container text-on-primary'
                      : 'bg-surface-container-lowest text-tertiary'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {[
          { label: 'What went well today?', val: wentWell, set: setWentWell },
          { label: 'What went wrong?', val: wentWrong, set: setWentWrong },
          { label: 'What can I do better tomorrow?', val: doBetterTomorrow, set: setDoBetterTomorrow },
          { label: 'How do I feel?', val: feelings, set: setFeelings },
          { label: 'What am I grateful for?', val: gratitude, set: setGratitude },
        ].map((item, idx) => (
          <div key={idx}>
            <label className="text-label-sm font-label-sm text-primary uppercase block mb-1">
              {item.label}
            </label>
            <textarea
              value={item.val}
              onChange={(e) => item.set(e.target.value)}
              rows={2}
              className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
            />
          </div>
        ))}

        <button
          onClick={handleSave}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-primary-container to-inverse-primary text-on-primary font-bold text-label-lg machined-border"
        >
          {savedNotice ? 'REFLECTION SAVED ✓' : tr('save')}
        </button>
      </section>

      {pastEntries.length > 0 && (
        <section className="space-y-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr('searchPlaceholder')}
            className="w-full rounded-lg bg-surface-container border border-outline-variant text-white p-2.5 text-body-sm"
          />
          {pastEntries.map((entry) => (
            <div
              key={entry.date}
              onClick={() => setSelectedDate(entry.date)}
              className="rounded-xl bg-surface-container-low p-space-md machined-border cursor-pointer"
            >
              <div className="flex justify-between text-label-sm font-label-sm text-primary">
                <span>{entry.date}</span>
                <span>
                  Mood: {entry.moodRating}/5 • Energy: {entry.energyRating}/5
                </span>
              </div>
              <p className="text-body-sm text-white mt-1">{entry.wentWell}</p>
            </div>
          ))}
        </section>
      )}
    </PerformanceHQShell>
  );
}
