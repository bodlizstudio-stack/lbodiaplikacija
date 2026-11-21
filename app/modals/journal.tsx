import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../src/store/AppContext';
import { LBODIShell } from '../../src/components/LBODIShell';
import { JournalEntryType } from '../../src/types';

const ENTRY_TYPES: { id: JournalEntryType; sl: string; en: string }[] = [
  { id: 'daily_reflection', sl: 'Dnevna refleksija', en: 'Daily Reflection' },
  { id: 'gratitude', sl: 'Hvaležnost', en: 'Gratitude' },
  { id: 'prayer', sl: 'Molitev', en: 'Prayer' },
  { id: 'personal_thoughts', sl: 'Osebne misli', en: 'Personal Thoughts' },
  { id: 'milestone', sl: 'Mejnik', en: 'Milestone' },
  { id: 'lessons_learned', sl: 'Nauki in lekcije', en: 'Lessons Learned' },
];

export default function DailyJournalModalScreen() {
  const { state, todayDateStr, tr, saveDailyJournal } = useApp();
  const lang = state.settings.language;

  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const existing = state.dailyJournals[selectedDate];

  const [entryType, setEntryType] = useState<JournalEntryType>(
    existing?.entryType || 'daily_reflection'
  );
  const [wentWell, setWentWell] = useState('');
  const [wentWrong, setWentWrong] = useState('');
  const [doBetterTomorrow, setDoBetterTomorrow] = useState('');
  const [feelings, setFeelings] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [prayerText, setPrayerText] = useState('');
  const [moodRating, setMoodRating] = useState(4);
  const [energyRating, setEnergyRating] = useState(4);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setEntryType(existing?.entryType || 'daily_reflection');
    setWentWell(existing?.wentWell ?? '');
    setWentWrong(existing?.wentWrong ?? '');
    setDoBetterTomorrow(existing?.doBetterTomorrow ?? '');
    setFeelings(existing?.feelings ?? '');
    setGratitude(existing?.gratitude ?? '');
    setPrayerText(existing?.prayerText ?? '');
    setMoodRating(existing?.moodRating ?? 4);
    setEnergyRating(existing?.energyRating ?? 4);
  }, [existing, selectedDate]);

  const handleSave = async () => {
    await saveDailyJournal({
      date: selectedDate,
      entryType,
      wentWell: wentWell.trim(),
      wentWrong: wentWrong.trim(),
      doBetterTomorrow: doBetterTomorrow.trim(),
      feelings: feelings.trim(),
      gratitude: gratitude.trim(),
      prayerText: prayerText.trim() || undefined,
      archived: false,
      moodRating,
      energyRating,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleToggleArchive = async (dateKey: string) => {
    const entry = state.dailyJournals[dateKey];
    if (!entry) return;
    await saveDailyJournal({
      ...entry,
      archived: !entry.archived,
    });
  };

  const pastEntries = useMemo(() => {
    const all = Object.values(state.dailyJournals)
      .filter((e) => (showArchived ? Boolean(e.archived) : !e.archived))
      .sort((a, b) => b.date.localeCompare(a.date));
    const q = searchQuery.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (e) =>
        e.date.includes(q) ||
        e.wentWell.toLowerCase().includes(q) ||
        e.wentWrong.toLowerCase().includes(q) ||
        e.doBetterTomorrow.toLowerCase().includes(q) ||
        (e.prayerText || '').toLowerCase().includes(q) ||
        e.gratitude.toLowerCase().includes(q)
    );
  }, [state.dailyJournals, searchQuery, showArchived]);

  return (
    <LBODIShell showBackButton subtitle={`Osebni in duhovni dnevnik • ${selectedDate}`}>
      <section className="lbodi-card thermal-top-edge p-4 space-y-3">
        <div className="flex justify-between items-center gap-2">
          <h1 className="font-sacred text-2xl font-semibold text-[var(--text-main)]">
            {lang === 'sl' ? 'Osebni dnevnik' : 'Personal Journal'}
          </h1>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] px-2 py-1 text-xs text-[var(--text-main)]"
          />
        </div>

        {/* Entry Type Selector */}
        <div className="flex flex-wrap gap-1.5">
          {ENTRY_TYPES.map((tItem) => (
            <button
              key={tItem.id}
              onClick={() => setEntryType(tItem.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] border ${
                entryType === tItem.id
                  ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent font-semibold'
                  : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
              }`}
            >
              {lang === 'sl' ? tItem.sl : tItem.en}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[11px] text-[var(--accent-gold)] font-medium block mb-1">
              {lang === 'sl' ? 'Počutje (1–5)' : 'Mood (1–5)'}
            </span>
            <div className="grid grid-cols-5 gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setMoodRating(n)}
                  className={`py-1.5 rounded-lg text-xs font-bold border ${
                    moodRating === n
                      ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent'
                      : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] text-[var(--accent-olive)] font-medium block mb-1">
              {lang === 'sl' ? 'Energija (1–5)' : 'Energy (1–5)'}
            </span>
            <div className="grid grid-cols-5 gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setEnergyRating(n)}
                  className={`py-1.5 rounded-lg text-xs font-bold border ${
                    energyRating === n
                      ? 'bg-[var(--accent-olive)] text-white border-transparent'
                      : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {[
          { label: lang === 'sl' ? 'Kaj je šlo danes dobro?' : 'What went well today?', val: wentWell, set: setWentWell },
          { label: lang === 'sl' ? 'Kje sem imel težave ali izzive?' : 'What was difficult?', val: wentWrong, set: setWentWrong },
          { label: lang === 'sl' ? 'Kaj želim izboljšati jutri?' : 'What will I improve tomorrow?', val: doBetterTomorrow, set: setDoBetterTomorrow },
          { label: lang === 'sl' ? 'Moji občutki in misli:' : 'Personal thoughts & feelings:', val: feelings, set: setFeelings },
          { label: lang === 'sl' ? 'Za kaj sem hvaležen Bogu?' : 'Gratitude to God:', val: gratitude, set: setGratitude },
          { label: lang === 'sl' ? 'Molitev (opcijsko):' : 'Prayer (optional):', val: prayerText, set: setPrayerText },
        ].map((item, idx) => (
          <div key={idx}>
            <label className="text-[11px] font-medium text-[var(--accent-gold)] block mb-1">
              {item.label}
            </label>
            <textarea
              value={item.val}
              onChange={(e) => item.set(e.target.value)}
              rows={2}
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
            />
          </div>
        ))}

        <button onClick={handleSave} className="w-full py-3 rounded-xl lbodi-gold-btn text-sm">
          {savedNotice ? (lang === 'sl' ? 'Zapis shranjen ✓' : 'Saved ✓') : tr('save')}
        </button>
      </section>

      <section className="space-y-2">
        <div className="flex gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr('searchPlaceholder')}
            className="flex-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
          />
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)]"
          >
            {showArchived ? 'Aktivni' : 'Arhiv'}
          </button>
        </div>

        {pastEntries.map((entry) => (
          <div key={entry.date} className="lbodi-card p-3.5 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span
                onClick={() => setSelectedDate(entry.date)}
                className="font-semibold text-[var(--accent-gold)] cursor-pointer"
              >
                {entry.date} • Počutje {entry.moodRating}/5
              </span>
              <button
                onClick={() => handleToggleArchive(entry.date)}
                className="text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-gold)]"
              >
                {entry.archived ? 'Obnovi' : 'Arhiviraj'}
              </button>
            </div>
            <p className="text-[var(--text-main)]">{entry.wentWell || entry.feelings || entry.gratitude}</p>
          </div>
        ))}
      </section>
    </LBODIShell>
  );
}
