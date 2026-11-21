import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../src/store/AppContext';
import { LBODIShell, CrossIcon } from '../../src/components/LBODIShell';
import { GratitudeCategory, GratitudeEntry } from '../../src/types';
import {
  deleteVaultMedia,
  resolveVaultMediaUrl,
  saveMediaFileToVault,
  saveNativeUriToVault,
} from '../../src/services/videoVaultService';

const GRATITUDE_CATEGORIES: { id: GratitudeCategory; sl: string; en: string }[] = [
  { id: 'faith', sl: 'Vera', en: 'Faith' },
  { id: 'family', sl: 'Družina', en: 'Family' },
  { id: 'health', sl: 'Zdravje', en: 'Health' },
  { id: 'friends', sl: 'Prijatelji', en: 'Friends' },
  { id: 'opportunities', sl: 'Priložnosti', en: 'Opportunities' },
  { id: 'growth', sl: 'Osebna rast', en: 'Growth' },
  { id: 'small_joys', sl: 'Majhne radosti', en: 'Small Joys' },
  { id: 'other', sl: 'Drugo', en: 'Other' },
];

function VaultPhotoPreview({ uri }: { uri: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let active = true;
    resolveVaultMediaUrl(uri).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [uri]);
  if (!url) return null;
  return (
    <img
      src={url}
      alt="Gratitude"
      className="w-full max-h-56 object-cover rounded-xl border border-[var(--border-subtle)]"
    />
  );
}

export default function GratitudeModalScreen() {
  const {
    state,
    todayDateStr,
    saveGratitudeEntry,
    deleteGratitudeEntry,
    toggleGratitudeFavorite,
  } = useApp();

  const lang = state.settings.language;
  const entries = state.gratitudeEntries || [];
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [tab, setTab] = useState<'write' | 'history' | 'monthly'>('write');
  const [editingId, setEditingId] = useState<string | undefined>();
  const [entryDate, setEntryDate] = useState(todayDateStr);
  const [mainText, setMainText] = useState('');
  const [blessings, setBlessings] = useState<string[]>(['', '', '']);
  const [dailyPrayer, setDailyPrayer] = useState('');
  const [category, setCategory] = useState<GratitudeCategory>('faith');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [savedToast, setSavedToast] = useState('');

  // History filters
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState<GratitudeCategory | 'all'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<GratitudeEntry | null>(null);

  // "Spomni se svojih blagoslovov" — picks a real entry only if one exists
  const randomPastEntry = useMemo(() => {
    const past = entries.filter((e) => e.date !== todayDateStr);
    const pool = past.length > 0 ? past : entries;
    if (pool.length === 0) return null;
    const daySeed = Number(todayDateStr.replace(/-/g, '')) || 0;
    return pool[daySeed % pool.length];
  }, [entries, todayDateStr]);

  const handleWebPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const vaultUri = await saveMediaFileToVault(file, 'gratitude');
    setPhotoUri(vaultUri);
  };

  const handlePickPhoto = async () => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
      return;
    }
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (!res.canceled && res.assets?.[0]) {
        const uri = await saveNativeUriToVault(res.assets[0].uri, 'gratitude');
        setPhotoUri(uri);
      }
    } catch {}
  };

  const handleSave = async () => {
    const cleanBlessings = blessings.map((b) => b.trim()).filter(Boolean);
    if (!mainText.trim() && cleanBlessings.length === 0) return;

    await saveGratitudeEntry({
      id: editingId,
      date: entryDate || todayDateStr,
      mainText: mainText.trim() || cleanBlessings[0] || '',
      threeBlessings: cleanBlessings,
      dailyPrayer: dailyPrayer.trim() || undefined,
      category,
      photoUri,
      isFavorite: editingId
        ? Boolean(entries.find((e) => e.id === editingId)?.isFavorite)
        : false,
    });

    setEditingId(undefined);
    setMainText('');
    setBlessings(['', '', '']);
    setDailyPrayer('');
    setPhotoUri(undefined);
    setSavedToast(lang === 'sl' ? 'Zapis hvaležnosti shranjen ✓' : 'Gratitude saved ✓');
    setTimeout(() => setSavedToast(''), 2500);
  };

  const startEdit = (item: GratitudeEntry) => {
    setEditingId(item.id);
    setEntryDate(item.date);
    setMainText(item.mainText);
    const padded = [...(item.threeBlessings || [])];
    while (padded.length < 3) padded.push('');
    setBlessings(padded);
    setDailyPrayer(item.dailyPrayer || '');
    setCategory(item.category);
    setPhotoUri(item.photoUri);
    setSelectedDetail(null);
    setTab('write');
  };

  const handleDelete = async (item: GratitudeEntry) => {
    if (item.photoUri) await deleteVaultMedia(item.photoUri);
    await deleteGratitudeEntry(item.id);
    if (selectedDetail?.id === item.id) setSelectedDetail(null);
  };

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...entries]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((e) => {
        if (catFilter !== 'all' && e.category !== catFilter) return false;
        if (onlyFavorites && !e.isFavorite) return false;
        if (!q) return true;
        return (
          e.mainText.toLowerCase().includes(q) ||
          (e.dailyPrayer || '').toLowerCase().includes(q) ||
          e.threeBlessings.some((b) => b.toLowerCase().includes(q)) ||
          e.date.includes(q)
        );
      });
  }, [entries, searchQuery, catFilter, onlyFavorites]);

  const currentMonthPrefix = todayDateStr.slice(0, 7);
  const monthlyEntries = useMemo(
    () => entries.filter((e) => e.date.startsWith(currentMonthPrefix)),
    [entries, currentMonthPrefix]
  );

  return (
    <LBODIShell
      showBackButton
      subtitle={
        lang === 'sl'
          ? 'Vsak dan prepoznaj blagoslove, ki ti jih daje Bog.'
          : 'Recognize God’s daily blessings.'
      }
    >
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleWebPhotoSelect}
          style={{ display: 'none' }}
        />
      )}

      {/* Header */}
      <section className="lbodi-card thermal-top-edge p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-[var(--accent-gold)]">
          <CrossIcon size={14} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
            {lang === 'sl' ? 'Duhovni dnevnik' : 'Spiritual Diary'}
          </span>
        </div>
        <h1 className="font-sacred text-3xl font-semibold text-[var(--text-main)]">
          {lang === 'sl' ? 'Hvaležnost Gospodu' : 'Gratitude to God'}
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          {lang === 'sl'
            ? 'Vsak dan prepoznaj blagoslove, ki ti jih daje Bog.'
            : 'Recognize the daily blessings God gives you.'}
        </p>

        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {[
            { id: 'write', label: lang === 'sl' ? 'Nov zapis' : 'Daily Entry' },
            { id: 'history', label: lang === 'sl' ? `Zgodovina (${entries.length})` : `History (${entries.length})` },
            { id: 'monthly', label: lang === 'sl' ? 'Mesečni pogled' : 'Monthly' },
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

      {savedToast && (
        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center font-medium">
          {savedToast}
        </div>
      )}

      {/* Spomni se svojih blagoslovov */}
      {randomPastEntry && (
        <section className="lbodi-card p-4 border-[var(--border-gold)] space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
            {lang === 'sl'
              ? `Spomni se svojih blagoslovov (${randomPastEntry.date})`
              : `Remember Your Blessings (${randomPastEntry.date})`}
          </span>
          <p className="font-sacred italic text-lg text-[var(--text-main)]">
            &ldquo;{randomPastEntry.mainText}&rdquo;
          </p>
        </section>
      )}

      {/* WRITE TAB */}
      {tab === 'write' && (
        <section className="lbodi-card p-4 sm:p-5 space-y-3.5">
          <div className="flex justify-between items-center gap-2">
            <label className="text-sm font-semibold text-[var(--text-main)]">
              {lang === 'sl' ? 'Za kaj si danes hvaležen Bogu?' : 'What are you grateful to God for today?'}
            </label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] px-2 py-1 text-xs text-[var(--text-main)]"
            />
          </div>

          <textarea
            value={mainText}
            onChange={(e) => setMainText(e.target.value)}
            rows={3}
            placeholder={
              lang === 'sl'
                ? 'Danes sem hvaležen Bogu za svojo družino, zdravje in možnost, da napredujem...'
                : 'Today I am thankful to God for...'
            }
            className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-3 text-xs text-[var(--text-main)]"
          />

          {/* Category */}
          <div>
            <span className="text-[11px] font-medium text-[var(--accent-gold)] block mb-1.5">
              {lang === 'sl' ? 'Kategorija (opcijsko)' : 'Category (optional)'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {GRATITUDE_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] border ${
                    category === c.id
                      ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent font-semibold'
                      : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                  }`}
                >
                  {lang === 'sl' ? c.sl : c.en}
                </button>
              ))}
            </div>
          </div>

          {/* Three Blessings (optional, flexible) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[var(--accent-olive)]">
                {lang === 'sl' ? 'Danes sem hvaležen za ... (opcijsko)' : 'Today I am grateful for...'}
              </span>
              <button
                onClick={() => setBlessings([...blessings, ''])}
                className="text-[11px] text-[var(--accent-gold)] font-medium"
              >
                + {lang === 'sl' ? 'Dodaj vrstico' : 'Add row'}
              </button>
            </div>
            {blessings.map((val, idx) => (
              <input
                key={idx}
                value={val}
                onChange={(e) => {
                  const next = [...blessings];
                  next[idx] = e.target.value;
                  setBlessings(next);
                }}
                placeholder={`${idx + 1}. ...`}
                className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-main)]"
              />
            ))}
          </div>

          {/* Daily Prayer (optional) */}
          <div>
            <label className="text-[11px] font-medium text-[var(--accent-gold)] block mb-1">
              {lang === 'sl' ? 'Moja današnja molitev (opcijsko)' : 'My Prayer Today (optional)'}
            </label>
            <textarea
              value={dailyPrayer}
              onChange={(e) => setDailyPrayer(e.target.value)}
              rows={2}
              placeholder={
                lang === 'sl'
                  ? 'Gospod, hvala Ti za...'
                  : 'Lord, thank You for...'
              }
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
            />
          </div>

          {/* Optional Photo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePickPhoto}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm text-[var(--accent-gold)]">
                  add_a_photo
                </span>
                <span>{lang === 'sl' ? 'Priloži zasebno sliko (opcijsko)' : 'Attach Photo'}</span>
              </button>
              {photoUri && (
                <button
                  onClick={() => setPhotoUri(undefined)}
                  className="text-xs text-red-400"
                >
                  {lang === 'sl' ? 'Odstrani sliko' : 'Remove'}
                </button>
              )}
            </div>
            {photoUri && <VaultPhotoPreview uri={photoUri} />}
          </div>

          <button onClick={handleSave} className="w-full py-3 rounded-xl lbodi-gold-btn text-sm">
            {editingId
              ? lang === 'sl'
                ? 'Shrani spremembe'
                : 'Save Changes'
              : lang === 'sl'
              ? 'Shrani hvaležnost Bogu'
              : 'Save Gratitude Entry'}
          </button>
        </section>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <section className="space-y-3">
          <div className="flex gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'sl' ? 'Išči po zapisih in molitvah...' : 'Search gratitude...'}
              className="flex-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-main)]"
            />
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`px-3 rounded-xl border text-xs ${
                onlyFavorites
                  ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent font-semibold'
                  : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)]'
              }`}
            >
              ★
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCatFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] border ${
                catFilter === 'all'
                  ? 'bg-[var(--bg-elevated)] border-[var(--border-gold)] text-[var(--accent-gold)]'
                  : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
              }`}
            >
              {lang === 'sl' ? 'Vse' : 'All'}
            </button>
            {GRATITUDE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCatFilter(c.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] border ${
                  catFilter === c.id
                    ? 'bg-[var(--bg-elevated)] border-[var(--border-gold)] text-[var(--accent-gold)]'
                    : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
                }`}
              >
                {lang === 'sl' ? c.sl : c.en}
              </button>
            ))}
          </div>

          {filteredEntries.map((item) => {
            const catObj = GRATITUDE_CATEGORIES.find((c) => c.id === item.category);
            return (
              <article key={item.id} className="lbodi-card p-4 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div
                    onClick={() => setSelectedDetail(item)}
                    className="cursor-pointer min-w-0"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
                      {item.date} • {catObj ? (lang === 'sl' ? catObj.sl : catObj.en) : item.category}
                    </span>
                    <p className="text-sm text-[var(--text-main)] mt-1">{item.mainText}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => toggleGratitudeFavorite(item.id)}>
                      <span
                        className="material-symbols-outlined text-base text-[var(--accent-gold)]"
                        style={item.isFavorite ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        star
                      </span>
                    </button>
                    <button onClick={() => startEdit(item)}>
                      <span className="material-symbols-outlined text-base text-[var(--text-muted)]">
                        edit
                      </span>
                    </button>
                    <button onClick={() => handleDelete(item)}>
                      <span className="material-symbols-outlined text-base text-red-400">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
                {item.threeBlessings.length > 0 && (
                  <ul className="text-xs text-[var(--text-muted)] space-y-0.5 pl-3 list-disc">
                    {item.threeBlessings.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
                {item.dailyPrayer && (
                  <p className="text-xs italic text-[var(--accent-olive)] bg-[var(--bg-lowest)] p-2.5 rounded-xl">
                    {item.dailyPrayer}
                  </p>
                )}
                {item.photoUri && <VaultPhotoPreview uri={item.photoUri} />}
              </article>
            );
          })}
        </section>
      )}

      {/* MONTHLY REFLECTION TAB */}
      {tab === 'monthly' && (
        <section className="lbodi-card p-5 space-y-3">
          <h3 className="font-sacred text-2xl font-semibold text-[var(--text-main)]">
            {lang === 'sl'
              ? 'Kateri blagoslovi so najbolj zaznamovali ta mesec?'
              : 'Which blessings defined this month?'}
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            {lang === 'sl'
              ? `V mesecu ${currentMonthPrefix} imaš shranjenih ${monthlyEntries.length} zapisov hvaležnosti.`
              : `Recorded ${monthlyEntries.length} gratitude entries in ${currentMonthPrefix}.`}
          </p>
          {monthlyEntries.map((m) => (
            <div
              key={m.id}
              className="p-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-xs space-y-1"
            >
              <span className="font-semibold text-[var(--accent-gold)]">{m.date}</span>
              <p className="text-[var(--text-main)]">{m.mainText}</p>
            </div>
          ))}
        </section>
      )}

      {/* Detail Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md lbodi-card p-5 space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-[var(--accent-gold)]">
                {selectedDetail.date}
              </span>
              <button onClick={() => setSelectedDetail(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-sm text-[var(--text-main)] leading-relaxed">
              {selectedDetail.mainText}
            </p>
            {selectedDetail.threeBlessings.map((b, i) => (
              <p key={i} className="text-xs text-[var(--text-muted)]">
                • {b}
              </p>
            ))}
            {selectedDetail.dailyPrayer && (
              <p className="font-sacred italic text-base text-[var(--accent-olive)]">
                &ldquo;{selectedDetail.dailyPrayer}&rdquo;
              </p>
            )}
            {selectedDetail.photoUri && <VaultPhotoPreview uri={selectedDetail.photoUri} />}
          </div>
        </div>
      )}
    </LBODIShell>
  );
}
