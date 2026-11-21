import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../src/store/AppContext';
import { LBODIShell, CrossIcon } from '../../src/components/LBODIShell';
import { calculateNext14DayReminder } from '../../src/utils/dateUtils';
import { IdealDayPlan, LifestyleVisionSections } from '../../src/types';

export default function LifestyleVisionScreen() {
  const {
    state,
    todayDateStr,
    saveVisionDraft,
    publishVisionVersion,
    saveBiweeklyVisionReview,
    updateSettings,
  } = useApp();

  const lang = state.settings.language;
  const versions = state.visionVersions || [];
  const reviews = state.biweeklyVisionReviews || [];

  const [tab, setTab] = useState<'vision' | 'review' | 'history'>('vision');
  const [sections, setSections] = useState<LifestyleVisionSections>(
    state.visionDraft?.sections || {
      faith: '',
      bodyHealth: '',
      discipline: '',
      workPurpose: '',
      relationships: '',
      personalIdentity: '',
    }
  );
  const [idealDay, setIdealDay] = useState<IdealDayPlan>(
    state.visionDraft?.idealDay || {
      morning: '',
      workStudy: '',
      fitness: '',
      meals: '',
      prayer: '',
      evening: '',
      sleep: '',
    }
  );
  const [statement, setStatement] = useState(state.visionDraft?.visionStatement || '');
  const [draftStatus, setDraftStatus] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Compare two versions
  const [compareAId, setCompareAId] = useState(versions[versions.length - 1]?.id || '');
  const [compareBId, setCompareBId] = useState(versions[0]?.id || '');

  // 14-day review state
  const anchorDate = state.settings.visionReminderAnchorDate || versions[0]?.createdAt?.slice(0, 10) || todayDateStr;
  const reminderTime = state.settings.visionReminderTime || '19:00';
  const scheduleInfo = useMemo(
    () => calculateNext14DayReminder(anchorDate, todayDateStr),
    [anchorDate, todayDateStr]
  );

  const [closerToPerson, setCloserToPerson] = useState('');
  const [spaceForGod, setSpaceForGod] = useState('');
  const [doDifferently, setDoDifferently] = useState('');
  const [habitToImprove, setHabitToImprove] = useState('');
  const [accomplishments, setAccomplishments] = useState('');
  const [challenges, setChallenges] = useState('');
  const [gratitudeNote, setGratitudeNote] = useState('');

  // Autosave draft gently after edits
  useEffect(() => {
    const timer = setTimeout(() => {
      saveVisionDraft({ sections, idealDay, visionStatement: statement });
      setDraftStatus(lang === 'sl' ? 'Osnutek samodejno shranjen' : 'Draft autosaved');
    }, 900);
    return () => clearTimeout(timer);
  }, [sections, idealDay, statement, saveVisionDraft, lang]);

  const generateStatementFromAnswers = () => {
    const generated = [
      sections.faith && `Moja vera: ${sections.faith}`,
      sections.bodyHealth && `Telo in zdravje: ${sections.bodyHealth}`,
      sections.discipline && `Disciplina: ${sections.discipline}`,
      sections.workPurpose && `Poslanstvo in delo: ${sections.workPurpose}`,
      sections.relationships && `Odnosi: ${sections.relationships}`,
      sections.personalIdentity && `Identiteta v Kristusu: ${sections.personalIdentity}`,
    ]
      .filter(Boolean)
      .join(' ');
    if (generated) setStatement(generated);
  };

  const handleAIRefineVision = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const prompt = `Na podlagi mojih odgovorov oblikuj jasen, miren, krščanski osebni zapis življenjske vizije v prvi osebi (slovenščina), brez spreminjanja pomena:\n\nVera: ${sections.faith}\nTelo: ${sections.bodyHealth}\nDisciplina: ${sections.discipline}\nDelo: ${sections.workPurpose}\nOdnosi: ${sections.relationships}\nIdentiteta: ${sections.personalIdentity}`;
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          language: lang,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setAiError(
          json.code === 'AI_NOT_CONFIGURED'
            ? 'GEMINI_API_KEY še ni nastavljen na Vercelu — osnutek lahko urediš neposredno spodaj.'
            : json.error || 'AI pomoč trenutno ni dosegljiva.'
        );
      } else if (json.reply) {
        setStatement(json.reply);
      }
    } catch {
      setAiError('Povezava do /api/ai/chat ni uspela. Uporabi gumb za ročno sestavo.');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePublishVersion = async () => {
    await publishVisionVersion({ sections, idealDay, visionStatement: statement });
    setDraftStatus(
      lang === 'sl' ? 'Nova različica shranjena v zgodovino ✓' : 'New version saved ✓'
    );
  };

  const recent14Records = useMemo(() => {
    const cutoff = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
    const recs = state.dailyHabitRecords.filter((r) => r.date >= cutoff);
    return {
      completed: recs.filter((r) => r.completed).length,
      total: recs.length,
    };
  }, [state.dailyHabitRecords]);

  const verA = versions.find((v) => v.id === compareAId) || versions[versions.length - 1];
  const verB = versions.find((v) => v.id === compareBId) || versions[0];

  return (
    <LBODIShell
      showBackButton
      subtitle={lang === 'sl' ? 'Vsakih 14 dni preveri svojo pot' : 'Biweekly Lifestyle Vision'}
    >
      {/* Hero Card */}
      <section className="lbodi-card thermal-top-edge p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--accent-gold)]">
            <CrossIcon size={14} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
              {lang === 'sl' ? 'Vizija življenja' : 'My God-Centered Vision'}
            </span>
          </div>
          {draftStatus && (
            <span className="text-[10px] text-[var(--accent-olive)] font-medium">
              {draftStatus}
            </span>
          )}
        </div>
        <h1 className="font-sacred text-3xl font-semibold text-[var(--text-main)]">
          {lang === 'sl' ? 'Moje prihodnje življenje' : 'My God-Centered Vision'}
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          {lang === 'sl'
            ? `14-dnevni opomnik (${reminderTime} ${state.settings.timezone || 'Europe/Ljubljana'}): naslednji pregled ${scheduleInfo.nextDate} (čez ${scheduleInfo.daysUntil} dni).`
            : `Next 14-day review: ${scheduleInfo.nextDate} (${scheduleInfo.daysUntil} days).`}
        </p>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'vision', label: lang === 'sl' ? 'Vizija in dan' : 'Vision' },
            { id: 'review', label: lang === 'sl' ? '14-dnevni pregled' : '14-Day Review' },
            { id: 'history', label: lang === 'sl' ? `Zgodovina (${versions.length})` : `Versions (${versions.length})` },
          ].map((tItem) => (
            <button
              key={tItem.id}
              onClick={() => setTab(tItem.id as any)}
              className={`py-2 rounded-xl text-xs font-semibold border ${
                tab === tItem.id
                  ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent'
                  : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
              }`}
            >
              {tItem.label}
            </button>
          ))}
        </div>
      </section>

      {/* TAB 1: VISION EDITOR + IDEAL DAY */}
      {tab === 'vision' && (
        <>
          <section className="lbodi-card p-4 sm:p-5 space-y-3">
            <h2 className="font-sacred text-2xl font-semibold text-[var(--text-main)]">
              {lang === 'sl' ? 'Področja življenja' : 'Core Life Pillars'}
            </h2>
            {(
              [
                ['faith', 'Vera (Odnos z Bogom in Jezusom Kristusom)'],
                ['bodyHealth', 'Telo in zdravje (Energija, trening, spanec, prehrana)'],
                ['discipline', 'Disciplina (Navade, čistost, odprava škodljivih vzorcev)'],
                ['workPurpose', 'Delo, izobrazba in poslanstvo'],
                ['relationships', 'Odnosi (Družina, prijatelji, ljubezen in potrpežljivost)'],
                ['personalIdentity', 'Osebna identiteta (Kakšen človek postajam)'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="text-xs font-medium text-[var(--accent-gold)] block mb-1">
                  {label}
                </label>
                <textarea
                  value={sections[key]}
                  onChange={(e) => setSections({ ...sections, [key]: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
                />
              </div>
            ))}
          </section>

          <section className="lbodi-card p-4 sm:p-5 space-y-3">
            <h2 className="font-sacred text-2xl font-semibold text-[var(--text-main)]">
              {lang === 'sl' ? 'Moj idealen dan' : 'My Ideal Day'}
            </h2>
            {(
              [
                ['morning', 'Jutranja rutina'],
                ['workStudy', 'Delo in študij'],
                ['fitness', 'Gibanje in trening'],
                ['meals', 'Prehrana in voda'],
                ['prayer', 'Molitev čez dan'],
                ['evening', 'Večerna rutina'],
                ['sleep', 'Spanec in počitek'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="text-[11px] font-medium text-[var(--accent-olive)] block mb-1">
                  {label}
                </label>
                <input
                  value={idealDay[key]}
                  onChange={(e) => setIdealDay({ ...idealDay, [key]: e.target.value })}
                  className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-main)]"
                />
              </div>
            ))}
          </section>

          <section className="lbodi-card p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-sacred text-2xl font-semibold text-[var(--text-main)]">
                {lang === 'sl' ? 'Izjava vizije' : 'Personal Vision Statement'}
              </h2>
              <div className="flex gap-1.5">
                <button
                  onClick={generateStatementFromAnswers}
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-main)]"
                >
                  {lang === 'sl' ? 'Sestavi iz odgovorov' : 'Compose'}
                </button>
                <button
                  onClick={handleAIRefineVision}
                  disabled={aiLoading}
                  className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-gold)] text-[11px] text-[var(--accent-gold)]"
                >
                  {aiLoading ? 'AI...' : 'LBODI AI uredi'}
                </button>
              </div>
            </div>
            {aiError && <p className="text-xs text-amber-300">{aiError}</p>}
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              rows={4}
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-3 text-xs text-[var(--text-main)] leading-relaxed"
            />
            <button onClick={handlePublishVersion} className="w-full py-3 rounded-xl lbodi-gold-btn text-sm">
              {lang === 'sl'
                ? 'Shrani novo različico vizije (ohrani stare različice)'
                : 'Save New Vision Version'}
            </button>
          </section>
        </>
      )}

      {/* TAB 2: 14-DAY REVIEW */}
      {tab === 'review' && (
        <>
          <section className="lbodi-card p-4 space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-gold)] block">
              {lang === 'sl' ? '14-dnevni opomnik (sidran cikel)' : '14-Day Reminder Schedule'}
            </span>
            <p className="text-xs text-[var(--text-muted)]">
              &ldquo;Minilo je 14 dni. Poglej svojo vizijo in razmisli, ali tvoje navade vodijo v pravo smer.&rdquo;
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-[var(--text-muted)] block mb-1">
                  {lang === 'sl' ? 'Sidrni datum (vsakih 14 dni)' : 'Anchor Date'}
                </label>
                <input
                  type="date"
                  value={anchorDate}
                  onChange={(e) =>
                    updateSettings({ visionReminderAnchorDate: e.target.value })
                  }
                  className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs text-[var(--text-main)]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[var(--text-muted)] block mb-1">
                  {lang === 'sl' ? 'Ura opomnika' : 'Reminder Time'}
                </label>
                <input
                  value={reminderTime}
                  onChange={(e) => updateSettings({ visionReminderTime: e.target.value })}
                  className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs text-[var(--text-main)]"
                />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-xs space-y-1">
              <p className="text-[var(--text-main)]">
                <strong>Naslednji opomnik:</strong> {scheduleInfo.nextDate} ob {reminderTime} (
                {state.settings.timezone || 'Europe/Ljubljana'})
              </p>
              <p className="text-[var(--text-muted)]">
                Zadnjih 14 dni navad: {recent14Records.completed}/{recent14Records.total} opravljenih •
                Aktivni cilji: {state.goals.length}
              </p>
            </div>
          </section>

          <section className="lbodi-card p-4 space-y-3">
            <h3 className="font-sacred text-2xl font-semibold text-[var(--text-main)]">
              {lang === 'sl' ? 'Dvotedenski pregled poti' : 'Two-Week Review'}
            </h3>
            {[
              ['Ali sem se približal človeku, kakršen želim postati?', closerToPerson, setCloserToPerson],
              ['Sem v zadnjih dveh tednih dal dovolj prostora Bogu?', spaceForGod, setSpaceForGod],
              ['Glavni dosežki in hvaležnost zadnjih 14 dni:', accomplishments, setAccomplishments],
              ['Izzivi in kaj bi naredil drugače?', doDifferently, setDoDifferently],
              ['Katero navado bom izboljšal v naslednjih 14 dneh?', habitToImprove, setHabitToImprove],
              ['Za kaj sem v tem obdobju hvaležen Gospodu?', gratitudeNote, setGratitudeNote],
            ].map(([label, val, setter]: any, idx) => (
              <div key={idx}>
                <label className="text-xs font-medium text-[var(--accent-gold)] block mb-1">
                  {label}
                </label>
                <textarea
                  value={val}
                  onChange={(e) => setter(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
                />
              </div>
            ))}
            <button
              onClick={async () => {
                await saveBiweeklyVisionReview({
                  date: todayDateStr,
                  visionVersionId: versions[0]?.id || 'vision_v1',
                  closerToPerson,
                  spaceForGod,
                  doDifferently,
                  habitToImprove,
                  accomplishments,
                  challenges,
                  gratitude: gratitudeNote,
                });
                setCloserToPerson('');
                setSpaceForGod('');
                setDoDifferently('');
                setHabitToImprove('');
                setAccomplishments('');
                setGratitudeNote('');
                setDraftStatus(lang === 'sl' ? '14-dnevni pregled shranjen ✓' : 'Review saved ✓');
              }}
              className="w-full py-3 rounded-xl lbodi-gold-btn text-sm"
            >
              {lang === 'sl' ? 'Shrani 14-dnevni pregled' : 'Submit 14-Day Review'}
            </button>
          </section>

          {reviews.length > 0 && (
            <section className="space-y-2">
              {reviews.map((r) => (
                <div key={r.id} className="lbodi-card p-3.5 text-xs space-y-1">
                  <span className="font-semibold text-[var(--accent-gold)]">{r.date}</span>
                  <p className="text-[var(--text-main)]">{r.closerToPerson}</p>
                  {r.spaceForGod && <p className="text-[var(--text-muted)]">{r.spaceForGod}</p>}
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {/* TAB 3: VERSION HISTORY & COMPARISON */}
      {tab === 'history' && (
        <section className="space-y-3">
          {versions.length >= 2 && verA && verB && (
            <div className="lbodi-card p-4 space-y-3">
              <span className="text-[11px] uppercase tracking-wider text-[var(--accent-gold)] font-semibold block">
                {lang === 'sl' ? 'Primerjava različic skozi čas' : 'Compare Versions'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={verA.id}
                  onChange={(e) => setCompareAId(e.target.value)}
                  className="rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
                >
                  {versions.map((v) => (
                    <option key={`a_${v.id}`} value={v.id}>
                      v{v.versionNumber} ({v.createdAt.slice(0, 10)})
                    </option>
                  ))}
                </select>
                <select
                  value={verB.id}
                  onChange={(e) => setCompareBId(e.target.value)}
                  className="rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
                >
                  {versions.map((v) => (
                    <option key={`b_${v.id}`} value={v.id}>
                      v{v.versionNumber} ({v.createdAt.slice(0, 10)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] space-y-1">
                  <span className="font-semibold text-[var(--text-muted)]">
                    v{verA.versionNumber} • {verA.createdAt.slice(0, 10)}
                  </span>
                  <p className="text-[var(--text-main)]">{verA.visionStatement}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-gold)] space-y-1">
                  <span className="font-semibold text-[var(--accent-gold)]">
                    v{verB.versionNumber} • {verB.createdAt.slice(0, 10)}
                  </span>
                  <p className="text-[var(--text-main)]">{verB.visionStatement}</p>
                </div>
              </div>
            </div>
          )}

          {versions.map((v) => (
            <div key={v.id} className="lbodi-card p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-[var(--accent-gold)]">
                  Različica {v.versionNumber} • {v.createdAt.slice(0, 10)}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-main)] leading-relaxed">
                {v.visionStatement}
              </p>
            </div>
          ))}
        </section>
      )}
    </LBODIShell>
  );
}
