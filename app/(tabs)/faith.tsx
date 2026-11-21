import React, { useMemo, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../src/store/AppContext';
import { LBODIShell, CrossIcon, SacredDivider } from '../../src/components/LBODIShell';
import { AUTHENTIC_BIBLE_VERSES } from '../../src/data/seedData';
import { BIBLE_READING_PLANS } from '../../src/data/faithData';
import { getDailyScriptureIndex } from '../../src/utils/dateUtils';
import { PrayerCategory, PrayerEntry, PrayerStatus } from '../../src/types';

export default function FaithCenterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const {
    state,
    todayDateStr,
    toggleFavoriteVerse,
    saveVerseNote,
    savePrayerEntry,
    updatePrayerStatus,
    deletePrayerEntry,
    toggleBibleReadingDay,
  } = useApp();

  const lang = state.settings.language;
  const [activeTab, setActiveTab] = useState<'word' | 'prayer' | 'plans' | 'saved'>(
    params.tab === 'prayer' ? 'prayer' : 'word'
  );

  // Daily Scripture
  const verseOfTheDay = useMemo(() => {
    const idx = getDailyScriptureIndex(todayDateStr, AUTHENTIC_BIBLE_VERSES.length);
    return AUTHENTIC_BIBLE_VERSES[idx] || AUTHENTIC_BIBLE_VERSES[0];
  }, [todayDateStr]);

  // Prayer Journal state
  const [prayerMode, setPrayerMode] = useState<'journal' | 'morning' | 'evening'>('journal');
  const [prayerTitle, setPrayerTitle] = useState('');
  const [prayerText, setPrayerText] = useState('');
  const [prayerCategory, setPrayerCategory] = useState<PrayerCategory>('guidance');
  const [prayerReflection, setPrayerReflection] = useState('');
  const [editingPrayerId, setEditingPrayerId] = useState<string | undefined>();
  const [savedNotice, setSavedNotice] = useState('');

  // Evening reflection fields
  const [evThanks, setEvThanks] = useState('');
  const [evGood, setEvGood] = useState('');
  const [evLove, setEvLove] = useState('');
  const [evSurrender, setEvSurrender] = useState('');

  // Selected Reading Plan
  const [selectedPlanId, setSelectedPlanId] = useState(BIBLE_READING_PLANS[0].id);

  // Saved Verses search
  const [savedSearch, setSavedSearch] = useState('');
  const [editingNoteVerseId, setEditingNoteVerseId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  const handleSavePrayer = async () => {
    if (!prayerTitle.trim() && !prayerText.trim()) return;
    await savePrayerEntry({
      id: editingPrayerId,
      title: prayerTitle.trim() || (lang === 'sl' ? 'Osebna molitev' : 'Personal Prayer'),
      text: prayerText.trim(),
      date: todayDateStr,
      category: prayerCategory,
      status: 'in_prayer',
      reflection: prayerReflection.trim() || undefined,
    });
    setPrayerTitle('');
    setPrayerText('');
    setPrayerReflection('');
    setEditingPrayerId(undefined);
    setSavedNotice(lang === 'sl' ? 'Molitev shranjena ✓' : 'Prayer saved ✓');
    setTimeout(() => setSavedNotice(''), 2000);
  };

  const handleSaveEveningPrayer = async () => {
    const composed = [
      evThanks && `Hvaležnost: ${evThanks}`,
      evGood && `Dobro danes: ${evGood}`,
      evLove && `Več ljubezni in potrpežljivosti: ${evLove}`,
      evSurrender && `Izročam Bogu: ${evSurrender}`,
    ]
      .filter(Boolean)
      .join('\n');
    if (!composed) return;
    await savePrayerEntry({
      title: lang === 'sl' ? `Večerna molitev (${todayDateStr})` : `Evening Prayer (${todayDateStr})`,
      text: composed,
      date: todayDateStr,
      category: 'gratitude',
      status: 'in_prayer',
    });
    setEvThanks('');
    setEvGood('');
    setEvLove('');
    setEvSurrender('');
    setSavedNotice(lang === 'sl' ? 'Večerna molitev shranjena ✓' : 'Evening prayer saved ✓');
    setTimeout(() => setSavedNotice(''), 2000);
  };

  const savedVerses = useMemo(() => {
    const q = savedSearch.trim().toLowerCase();
    return AUTHENTIC_BIBLE_VERSES.filter((v) => {
      if (!state.favoriteVerseIds.includes(v.id)) return false;
      if (!q) return true;
      return (
        v.referenceSl.toLowerCase().includes(q) ||
        v.referenceEn.toLowerCase().includes(q) ||
        v.textSl.toLowerCase().includes(q) ||
        v.textEn.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
      );
    });
  }, [state.favoriteVerseIds, savedSearch]);

  const statusLabels: Record<PrayerStatus, { sl: string; en: string; color: string }> = {
    in_prayer: { sl: 'V molitvi', en: 'In Prayer', color: 'text-[var(--accent-gold)]' },
    still_praying: { sl: 'Še vedno molim', en: 'Still Praying', color: 'text-sky-400' },
    answered: { sl: 'Uslišano', en: 'Answered', color: 'text-emerald-400' },
    closed: { sl: 'Zaključeno', en: 'Closed', color: 'text-[var(--text-muted)]' },
  };

  const activePlan =
    BIBLE_READING_PLANS.find((p) => p.id === selectedPlanId) || BIBLE_READING_PLANS[0];
  const completedPlanDays = (state.bibleReadingProgress?.[activePlan.id] || []) as number[];

  return (
    <LBODIShell>
      {/* Hero */}
      <section className="lbodi-card thermal-top-edge p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[var(--accent-gold)]">
              <CrossIcon size={14} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                {lang === 'sl' ? 'Center vere' : 'Christian Faith Center'}
              </span>
            </div>
            <h1 className="font-sacred text-3xl font-semibold text-[var(--text-main)] mt-1">
              {lang === 'sl' ? 'Moja pot z Bogom' : 'Walk With Christ'}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              {lang === 'sl'
                ? 'Vsak dan bližje Jezusu Kristusu.'
                : 'Growing closer to Jesus Christ every day.'}
            </p>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {[
            { id: 'word', label: lang === 'sl' ? 'Božja beseda' : 'Word' },
            { id: 'prayer', label: lang === 'sl' ? 'Molitev' : 'Prayer' },
            { id: 'plans', label: lang === 'sl' ? 'Načrti' : 'Plans' },
            { id: 'saved', label: lang === 'sl' ? 'Shranjeni' : 'Saved' },
          ].map((tItem) => (
            <button
              key={tItem.id}
              onClick={() => setActiveTab(tItem.id as any)}
              className={`py-2 px-1.5 rounded-xl text-[11px] font-semibold border transition-colors ${
                activeTab === tItem.id
                  ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent'
                  : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
              }`}
            >
              {tItem.label}
            </button>
          ))}
        </div>

        {/* Quick Links to Gratitude & Spiritual Journal */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => router.push('/modals/gratitude' as any)}
            className="py-2 px-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-main)] flex items-center justify-center gap-1.5 hover:border-[var(--border-gold)]"
          >
            <span className="material-symbols-outlined text-sm text-[var(--accent-gold)]">
              volunteer_activism
            </span>
            <span>{lang === 'sl' ? 'Hvaležnost Gospodu' : 'Gratitude'}</span>
          </button>
          <button
            onClick={() => router.push('/modals/journal' as any)}
            className="py-2 px-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-main)] flex items-center justify-center gap-1.5 hover:border-[var(--border-gold)]"
          >
            <span className="material-symbols-outlined text-sm text-[var(--accent-olive)]">
              edit_note
            </span>
            <span>{lang === 'sl' ? 'Duhovni dnevnik' : 'Spiritual Journal'}</span>
          </button>
        </div>
      </section>

      {savedNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center font-medium">
          {savedNotice}
        </div>
      )}

      {/* TAB 1: BOŽJA BESEDA */}
      {activeTab === 'word' && (
        <>
          <section className="lbodi-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent-gold)]">
                {lang === 'sl' ? 'Verz dneva' : 'Scripture of the Day'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                {lang === 'sl' ? 'Chraska (1914)' : 'KJV (1769)'}
              </span>
            </div>

            <blockquote className="font-sacred text-2xl italic text-[var(--text-main)] leading-snug">
              &ldquo;{lang === 'sl' ? verseOfTheDay.textSl : verseOfTheDay.textEn}&rdquo;
            </blockquote>
            <p className="text-xs font-semibold text-[var(--accent-gold)]">
              {lang === 'sl' ? verseOfTheDay.referenceSl : verseOfTheDay.referenceEn}
            </p>

            {(verseOfTheDay.reflectionSl || verseOfTheDay.applicationSl) && (
              <div className="p-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[var(--accent-olive)] font-semibold block">
                  {lang === 'sl' ? 'Izvirni razmislek (ločeno od Svetega pisma)' : 'Devotional Reflection'}
                </span>
                <p className="text-xs text-[var(--text-main)] leading-relaxed">
                  {lang === 'sl' ? verseOfTheDay.reflectionSl : verseOfTheDay.reflectionEn}
                </p>
                {(verseOfTheDay.applicationSl || verseOfTheDay.applicationEn) && (
                  <p className="text-xs text-[var(--accent-gold)] pt-1">
                    <strong>{lang === 'sl' ? 'Uporaba v praksi: ' : 'Practical step: '}</strong>
                    {lang === 'sl' ? verseOfTheDay.applicationSl : verseOfTheDay.applicationEn}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => toggleFavoriteVerse(verseOfTheDay.id)}
                className="flex-1 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-main)]"
              >
                {state.favoriteVerseIds.includes(verseOfTheDay.id)
                  ? lang === 'sl'
                    ? '✓ Med shranjenimi'
                    : '✓ Bookmarked'
                  : lang === 'sl'
                  ? 'Shrani verz'
                  : 'Bookmark Verse'}
              </button>
              <button
                onClick={() => router.push('/modals/bible' as any)}
                className="flex-1 py-2 rounded-xl lbodi-gold-btn text-xs"
              >
                {lang === 'sl' ? 'Vsi tematski verzi →' : 'Browse All Scripture →'}
              </button>
            </div>
          </section>

          <SacredDivider label={lang === 'sl' ? 'Izbrani odlomki' : 'Selected Passages'} />

          <section className="space-y-2.5">
            {AUTHENTIC_BIBLE_VERSES.slice(0, 8).map((v) => {
              const saved = state.favoriteVerseIds.includes(v.id);
              return (
                <div key={v.id} className="lbodi-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--accent-olive)] font-semibold">
                      {v.testament} • {v.category}
                    </span>
                    <button onClick={() => toggleFavoriteVerse(v.id)}>
                      <span
                        className="material-symbols-outlined text-base text-[var(--accent-gold)]"
                        style={saved ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        bookmark
                      </span>
                    </button>
                  </div>
                  <p className="text-sm text-[var(--text-main)]">
                    &ldquo;{lang === 'sl' ? v.textSl : v.textEn}&rdquo;
                  </p>
                  <p className="text-xs font-semibold text-[var(--accent-gold)]">
                    {lang === 'sl' ? v.referenceSl : v.referenceEn}
                  </p>
                </div>
              );
            })}
          </section>
        </>
      )}

      {/* TAB 2: MOLITEV */}
      {activeTab === 'prayer' && (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'journal', label: lang === 'sl' ? 'Molitvene prošnje' : 'Prayer Journal' },
              { id: 'morning', label: lang === 'sl' ? 'Jutranja molitev' : 'Morning' },
              { id: 'evening', label: lang === 'sl' ? 'Večerna molitev' : 'Evening' },
            ].map((pm) => (
              <button
                key={pm.id}
                onClick={() => setPrayerMode(pm.id as any)}
                className={`py-2 rounded-xl text-xs font-medium border ${
                  prayerMode === pm.id
                    ? 'bg-[var(--bg-elevated)] border-[var(--border-gold)] text-[var(--accent-gold)]'
                    : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                }`}
              >
                {pm.label}
              </button>
            ))}
          </div>

          {prayerMode === 'morning' && (
            <section className="lbodi-card p-5 space-y-3">
              <h2 className="font-sacred text-2xl font-semibold text-[var(--text-main)]">
                {lang === 'sl' ? 'Začni dan z molitvijo' : 'Begin Your Day With Prayer'}
              </h2>
              <p className="font-sacred italic text-base text-[var(--accent-gold)] leading-relaxed bg-[var(--bg-lowest)] p-3.5 rounded-xl border border-[var(--border-subtle)]">
                &ldquo;Gospod Jezus Kristus, hvala Ti za to novo jutro. Izročam Ti svoje misli, delo, telo in odnose. Podari mi srce polno hvaležnosti, trezen um, potrpežljivost z bližnjimi in zvestobo Tvoji besedi. Amen.&rdquo;
              </p>
              <textarea
                value={prayerText}
                onChange={(e) => setPrayerText(e.target.value)}
                rows={3}
                placeholder={
                  lang === 'sl'
                    ? 'Dodaj svojo lastno jutranjo molitev ali prošnjo...'
                    : 'Add your own morning prayer in your own words...'
                }
                className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-3 text-xs text-[var(--text-main)]"
              />
              <button
                onClick={async () => {
                  await savePrayerEntry({
                    title: lang === 'sl' ? `Jutranja molitev (${todayDateStr})` : `Morning Prayer (${todayDateStr})`,
                    text:
                      prayerText.trim() ||
                      'Gospod Jezus Kristus, izročam Ti današnji dan in vse svoje odločitve. Amen.',
                    date: todayDateStr,
                    category: 'guidance',
                    status: 'in_prayer',
                  });
                  setPrayerText('');
                  setSavedNotice(lang === 'sl' ? 'Jutranja molitev shranjena ✓' : 'Saved ✓');
                  setTimeout(() => setSavedNotice(''), 2000);
                }}
                className="w-full py-2.5 rounded-xl lbodi-gold-btn text-xs"
              >
                {lang === 'sl' ? 'Shrani jutranjo molitev' : 'Save Morning Prayer'}
              </button>
            </section>
          )}

          {prayerMode === 'evening' && (
            <section className="lbodi-card p-5 space-y-3">
              <h2 className="font-sacred text-2xl font-semibold text-[var(--text-main)]">
                {lang === 'sl' ? 'Večerna refleksija in molitev' : 'Evening Prayer Reflection'}
              </h2>
              {[
                { label: 'Za kaj sem danes hvaležen?', val: evThanks, set: setEvThanks },
                { label: 'Kje sem danes ravnal dobro?', val: evGood, set: setEvGood },
                { label: 'Kje bi lahko pokazal več ljubezni ali potrpežljivosti?', val: evLove, set: setEvLove },
                { label: 'Kaj želim izročiti Bogu v molitvi?', val: evSurrender, set: setEvSurrender },
              ].map((q, idx) => (
                <div key={idx}>
                  <label className="text-xs font-medium text-[var(--accent-gold)] block mb-1">
                    {q.label}
                  </label>
                  <textarea
                    value={q.val}
                    onChange={(e) => q.set(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
                  />
                </div>
              ))}
              <button
                onClick={handleSaveEveningPrayer}
                className="w-full py-2.5 rounded-xl lbodi-gold-btn text-xs"
              >
                {lang === 'sl' ? 'Zaključi večer z molitvijo' : 'Save Evening Prayer'}
              </button>
            </section>
          )}

          {prayerMode === 'journal' && (
            <>
              <section className="lbodi-card p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-main)]">
                  {editingPrayerId
                    ? lang === 'sl'
                      ? 'Uredi molitev'
                      : 'Edit Prayer'
                    : lang === 'sl'
                    ? 'Nova molitvena prošnja'
                    : 'New Prayer Entry'}
                </h3>
                <input
                  value={prayerTitle}
                  onChange={(e) => setPrayerTitle(e.target.value)}
                  placeholder={lang === 'sl' ? 'Naslov molitve...' : 'Prayer title...'}
                  className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
                />
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ['guidance', 'Vodstvo'],
                      ['strength', 'Moč'],
                      ['gratitude', 'Zahvala'],
                      ['family', 'Družina'],
                      ['forgiveness', 'Odpuščanje'],
                      ['other', 'Drugo'],
                    ] as const
                  ).map(([cid, label]) => (
                    <button
                      key={cid}
                      onClick={() => setPrayerCategory(cid)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] border ${
                        prayerCategory === cid
                          ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent font-semibold'
                          : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={prayerText}
                  onChange={(e) => setPrayerText(e.target.value)}
                  rows={3}
                  placeholder={lang === 'sl' ? 'Zapiši svojo molitev...' : 'Write your prayer...'}
                  className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
                />
                <button
                  onClick={handleSavePrayer}
                  className="w-full py-2.5 rounded-xl lbodi-gold-btn text-xs"
                >
                  {lang === 'sl' ? 'Shrani molitev' : 'Save Prayer'}
                </button>
              </section>

              <section className="space-y-2.5">
                {(state.prayerEntries || []).map((pr: PrayerEntry) => (
                  <div key={pr.id} className="lbodi-card p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`text-[10px] font-semibold uppercase ${statusLabels[pr.status].color}`}>
                          {lang === 'sl' ? statusLabels[pr.status].sl : statusLabels[pr.status].en} • {pr.date}
                        </span>
                        <h4 className="text-sm font-semibold text-[var(--text-main)]">{pr.title}</h4>
                      </div>
                      <button
                        onClick={() => deletePrayerEntry(pr.id)}
                        className="text-[var(--text-muted)] hover:text-red-400"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] whitespace-pre-line">{pr.text}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {(['in_prayer', 'still_praying', 'answered', 'closed'] as PrayerStatus[]).map((st) => (
                        <button
                          key={st}
                          onClick={() => updatePrayerStatus(pr.id, st)}
                          className={`px-2 py-1 rounded-lg text-[10px] border ${
                            pr.status === st
                              ? 'bg-[var(--bg-elevated)] border-[var(--border-gold)] text-[var(--accent-gold)] font-semibold'
                              : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
                          }`}
                        >
                          {lang === 'sl' ? statusLabels[st].sl : statusLabels[st].en}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            </>
          )}
        </>
      )}

      {/* TAB 3: NAČRTI BRANJA */}
      {activeTab === 'plans' && (
        <>
          <section className="flex gap-2 overflow-x-auto pb-1">
            {BIBLE_READING_PLANS.map((plan) => {
              const done = (state.bibleReadingProgress?.[plan.id] || []).length;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`px-3 py-2 rounded-xl border text-left flex-shrink-0 min-w-[150px] ${
                    selectedPlanId === plan.id
                      ? 'bg-[var(--bg-elevated)] border-[var(--border-gold)]'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)]'
                  }`}
                >
                  <span className="text-[10px] text-[var(--accent-gold)] font-semibold block">
                    {done}/{plan.durationDays} {lang === 'sl' ? 'dni' : 'days'}
                  </span>
                  <span className="text-xs font-semibold text-[var(--text-main)]">
                    {lang === 'sl' ? plan.titleSl : plan.titleEn}
                  </span>
                </button>
              );
            })}
          </section>

          <section className="lbodi-card p-4 space-y-3">
            <div>
              <h3 className="font-sacred text-2xl font-semibold text-[var(--text-main)]">
                {lang === 'sl' ? activePlan.titleSl : activePlan.titleEn}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {lang === 'sl' ? activePlan.descriptionSl : activePlan.descriptionEn}
              </p>
            </div>

            <div className="space-y-2">
              {activePlan.days.map((day) => {
                const isDone = completedPlanDays.includes(day.dayNumber);
                return (
                  <div
                    key={day.dayNumber}
                    onClick={() => toggleBibleReadingDay(activePlan.id, day.dayNumber)}
                    className="p-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isDone
                            ? 'bg-[var(--accent-olive)] text-white'
                            : 'border border-[var(--border-gold)]'
                        }`}
                      >
                        {isDone && (
                          <span className="material-symbols-outlined text-sm font-bold">check</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--accent-gold)]">
                          Dan {day.dayNumber} • {lang === 'sl' ? day.referenceSl : day.referenceEn}
                        </p>
                        <p className="text-xs text-[var(--text-main)] truncate">
                          {lang === 'sl' ? day.focusSl : day.focusEn}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* TAB 4: SHRANJENI VERZI */}
      {activeTab === 'saved' && (
        <section className="space-y-2.5">
          <input
            value={savedSearch}
            onChange={(e) => setSavedSearch(e.target.value)}
            placeholder={lang === 'sl' ? 'Išči shranjene verze...' : 'Search saved verses...'}
            className="w-full rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
          />
          {savedVerses.length === 0 ? (
            <div className="lbodi-card p-6 text-center text-xs text-[var(--text-muted)]">
              {lang === 'sl' ? 'Nimaš še shranjenih verzov za to iskanje.' : 'No saved verses match this search.'}
            </div>
          ) : (
            savedVerses.map((v) => {
              const personalNote = state.verseNotes?.[v.id] || '';
              return (
                <div key={v.id} className="lbodi-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--accent-gold)]">
                      {lang === 'sl' ? v.referenceSl : v.referenceEn}
                    </span>
                    <button
                      onClick={() => toggleFavoriteVerse(v.id)}
                      className="text-xs text-[var(--text-muted)] hover:text-red-400"
                    >
                      {lang === 'sl' ? 'Odstrani' : 'Remove'}
                    </button>
                  </div>
                  <p className="text-sm text-[var(--text-main)] italic">
                    &ldquo;{lang === 'sl' ? v.textSl : v.textEn}&rdquo;
                  </p>
                  {personalNote && editingNoteVerseId !== v.id && (
                    <p className="text-xs text-[var(--accent-olive)] bg-[var(--bg-lowest)] p-2 rounded-lg">
                      {personalNote}
                    </p>
                  )}
                  {editingNoteVerseId === v.id ? (
                    <div className="flex gap-2">
                      <input
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder={lang === 'sl' ? 'Osebni razmislek...' : 'Personal note...'}
                        className="flex-1 rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs text-[var(--text-main)]"
                      />
                      <button
                        onClick={async () => {
                          await saveVerseNote(v.id, noteInput.trim());
                          setEditingNoteVerseId(null);
                        }}
                        className="px-3 py-1.5 rounded-lg lbodi-gold-btn text-xs"
                      >
                        {lang === 'sl' ? 'Shrani' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingNoteVerseId(v.id);
                        setNoteInput(personalNote);
                      }}
                      className="text-[11px] text-[var(--accent-gold)] underline"
                    >
                      {personalNote
                        ? lang === 'sl'
                          ? 'Uredi opombo'
                          : 'Edit Note'
                        : lang === 'sl'
                        ? '+ Dodaj osebni razmislek'
                        : '+ Add Personal Note'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </section>
      )}
    </LBODIShell>
  );
}
