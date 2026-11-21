import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../src/store/AppContext';
import { LBODIShell } from '../../src/components/LBODIShell';
import { ACHIEVEMENT_BADGES } from '../../src/data/seedData';
import { persistPrivatePhoto } from '../../src/services/securityService';
import {
  deleteVaultMedia,
  resolveVaultMediaUrl,
  saveMediaFileToVault,
} from '../../src/services/videoVaultService';
import {
  addDays,
  calculateCompletedDaysStreak,
  formatTransformationElapsed,
} from '../../src/utils/dateUtils';
import { PhysiqueEntry, TransformationPhotoCategory } from '../../src/types';

const PHOTO_CATEGORIES: { id: TransformationPhotoCategory; sl: string; en: string }[] = [
  { id: 'telesna_preobrazba', sl: 'Telesna preobrazba', en: 'Body Transformation' },
  { id: 'obraz', sl: 'Obraz', en: 'Face' },
  { id: 'fitnes', sl: 'Fitnes', en: 'Fitness' },
  { id: 'zivljenjski_slog', sl: 'Življenjski slog', en: 'Lifestyle' },
  { id: 'spomini', sl: 'Spomini', en: 'Memories' },
  { id: 'drugo', sl: 'Drugo', en: 'Other' },
];

function VaultImage({
  uri,
  alt,
  className,
  onClick,
}: {
  uri?: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}) {
  const [resolved, setResolved] = useState(uri && !uri.startsWith('idb://') ? uri : '');

  useEffect(() => {
    let active = true;
    if (!uri) {
      setResolved('');
      return;
    }
    if (!uri.startsWith('idb://')) {
      setResolved(uri);
      return;
    }
    resolveVaultMediaUrl(uri).then((url) => {
      if (active) setResolved(url);
    });
    return () => {
      active = false;
    };
  }, [uri]);

  if (!resolved) {
    return (
      <div className={`flex items-center justify-center bg-[var(--bg-lowest)] text-[var(--text-muted)] ${className || 'h-40'}`}>
        <span className="material-symbols-outlined text-2xl">image</span>
      </div>
    );
  }

  return <img src={resolved} alt={alt} className={className} onClick={onClick} />;
}

export default function ProgressScreen() {
  const router = useRouter();
  const {
    state,
    todayDateStr,
    savePhysiqueEntry,
    deletePhysiqueEntry,
  } = useApp();

  const lang = state.settings.language;
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'weight' | 'milestones'>('overview');

  // Check-In / Transformation Photo Modal
  const [entryModalVisible, setEntryModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [entryTitle, setEntryTitle] = useState('');
  const [entryDate, setEntryDate] = useState(todayDateStr);
  const [entryCategory, setEntryCategory] = useState<TransformationPhotoCategory>('telesna_preobrazba');
  const [weightKg, setWeightKg] = useState('');
  const [waistCm, setWaistCm] = useState('');
  const [bodyFatPct, setBodyFatPct] = useState('');
  const [frontPhotoUri, setFrontPhotoUri] = useState<string | undefined>();
  const [sidePhotoUri, setSidePhotoUri] = useState<string | undefined>();
  const [backPhotoUri, setBackPhotoUri] = useState<string | undefined>();
  const [customPhotoUri, setCustomPhotoUri] = useState<string | undefined>();
  const [milestoneThen, setMilestoneThen] = useState('');
  const [milestoneNow, setMilestoneNow] = useState('');
  const [milestoneLearned, setMilestoneLearned] = useState('');
  const [notes, setNotes] = useState('');

  // Multi-file & Drag-Drop Ref
  const multiInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Before / After Comparison
  const [compareMode, setCompareMode] = useState<'side' | 'slider'>('side');
  const [compareAngle, setCompareAngle] = useState<
    'frontPhotoUri' | 'sidePhotoUri' | 'backPhotoUri' | 'customPhotoUri'
  >('frontPhotoUri');
  const [beforeEntryId, setBeforeEntryId] = useState<string | null>(null);
  const [afterEntryId, setAfterEntryId] = useState<string | null>(null);
  const [sliderPositionPct, setSliderPositionPct] = useState(50);

  // Zoom & Delete
  const [zoomPhotoUri, setZoomPhotoUri] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sortedEntries = useMemo(
    () => [...state.physiqueEntries].sort((a, b) => b.date.localeCompare(a.date)),
    [state.physiqueEntries]
  );

  // Group timeline by Year -> Entries
  const entriesByYear = useMemo(() => {
    const map: Record<string, PhysiqueEntry[]> = {};
    for (const e of sortedEntries) {
      const yr = e.date.slice(0, 4) || 'Drugo';
      if (!map[yr]) map[yr] = [];
      map[yr].push(e);
    }
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [sortedEntries]);

  const beforeEntry = useMemo(
    () =>
      sortedEntries.find((e) => e.id === beforeEntryId) ||
      sortedEntries[sortedEntries.length - 1] ||
      null,
    [sortedEntries, beforeEntryId]
  );
  const afterEntry = useMemo(
    () => sortedEntries.find((e) => e.id === afterEntryId) || sortedEntries[0] || null,
    [sortedEntries, afterEntryId]
  );

  const handleMultiWebFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (files.length === 1) {
      const file = files[0];
      if (file.size > 15 * 1024 * 1024) return;
      const uri = await saveMediaFileToVault(file, 'physique');
      setFrontPhotoUri(uri);
      if (file.lastModified) {
        setEntryDate(new Date(file.lastModified).toISOString().slice(0, 10));
      }
      setEntryModalVisible(true);
      return;
    }

    // Multiple files at once -> store sequentially with editable entries
    const uris: string[] = [];
    for (let i = 0; i < Math.min(files.length, 4); i++) {
      if (files[i].size <= 15 * 1024 * 1024) {
        uris.push(await saveMediaFileToVault(files[i], `physique_${i}`));
      }
    }
    setFrontPhotoUri(uris[0]);
    setSidePhotoUri(uris[1]);
    setBackPhotoUri(uris[2]);
    setCustomPhotoUri(uris[3]);
    setEntryModalVisible(true);
  };

  const pickSingleImage = async (slot: 'front' | 'side' | 'back' | 'custom') => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (ev: any) => {
        const file: File | undefined = ev.target?.files?.[0];
        if (!file || file.size > 15 * 1024 * 1024) return;
        const vaultUri = await saveMediaFileToVault(file, slot);
        if (slot === 'front') setFrontPhotoUri(vaultUri);
        if (slot === 'side') setSidePhotoUri(vaultUri);
        if (slot === 'back') setBackPhotoUri(vaultUri);
        if (slot === 'custom') setCustomPhotoUri(vaultUri);
      };
      input.click();
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]) {
        const savedUri = await persistPrivatePhoto(result.assets[0].uri, slot);
        if (slot === 'front') setFrontPhotoUri(savedUri);
        if (slot === 'side') setSidePhotoUri(savedUri);
        if (slot === 'back') setBackPhotoUri(savedUri);
        if (slot === 'custom') setCustomPhotoUri(savedUri);
      }
    } catch {}
  };

  const openNewEntryModal = () => {
    setEditingId(undefined);
    setEntryTitle('');
    setEntryDate(todayDateStr);
    setEntryCategory('telesna_preobrazba');
    setWeightKg('');
    setWaistCm('');
    setBodyFatPct('');
    setFrontPhotoUri(undefined);
    setSidePhotoUri(undefined);
    setBackPhotoUri(undefined);
    setCustomPhotoUri(undefined);
    setMilestoneThen('');
    setMilestoneNow('');
    setMilestoneLearned('');
    setNotes('');
    setEntryModalVisible(true);
  };

  const openEditEntryModal = (entry: PhysiqueEntry) => {
    setEditingId(entry.id);
    setEntryTitle(entry.title || '');
    setEntryDate(entry.date);
    setEntryCategory(entry.category || 'telesna_preobrazba');
    setWeightKg(entry.weightKg ? String(entry.weightKg) : '');
    setWaistCm(entry.waistCm ? String(entry.waistCm) : '');
    setBodyFatPct(entry.bodyFatPct ? String(entry.bodyFatPct) : '');
    setFrontPhotoUri(entry.frontPhotoUri);
    setSidePhotoUri(entry.sidePhotoUri);
    setBackPhotoUri(entry.backPhotoUri);
    setCustomPhotoUri(entry.customPhotoUri);
    setMilestoneThen(entry.milestoneThen || '');
    setMilestoneNow(entry.milestoneNow || '');
    setMilestoneLearned(entry.milestoneLearned || '');
    setNotes(entry.notes || '');
    setEntryModalVisible(true);
  };

  const handleSaveEntry = async () => {
    await savePhysiqueEntry({
      id: editingId,
      title: entryTitle.trim() || undefined,
      date: entryDate.trim() || todayDateStr,
      category: entryCategory,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      waistCm: waistCm ? parseFloat(waistCm) : undefined,
      bodyFatPct: bodyFatPct ? parseFloat(bodyFatPct) : undefined,
      frontPhotoUri,
      sidePhotoUri,
      backPhotoUri,
      customPhotoUri,
      milestoneThen: milestoneThen.trim() || undefined,
      milestoneNow: milestoneNow.trim() || undefined,
      milestoneLearned: milestoneLearned.trim() || undefined,
      notes: notes.trim(),
    });
    setEntryModalVisible(false);
  };

  // Real data summaries for Overview & Charts
  const last7HabitTrend = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(todayDateStr, i - 6);
      const sum = state.dailySummaries[date];
      return {
        date,
        label: date.slice(5),
        pct: sum && sum.scheduledCount > 0 ? sum.completionPct : null,
      };
    });
  }, [state.dailySummaries, todayDateStr]);

  const weightPoints = useMemo(() => {
    return [...state.physiqueEntries]
      .filter((e) => typeof e.weightKg === 'number' && !isNaN(e.weightKg))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [state.physiqueEntries]);

  const currentWeightVal =
    weightPoints.length > 0
      ? weightPoints[weightPoints.length - 1].weightKg!
      : state.settings.startingWeightKg;

  const weeklyAvgCompletion = useMemo(() => {
    const valid = last7HabitTrend.filter((d) => d.pct !== null);
    if (valid.length === 0) return 0;
    return Math.round(valid.reduce((a, b) => a + (b.pct || 0), 0) / valid.length);
  }, [last7HabitTrend]);

  const hasWorkoutLogs = (state.workoutLogs || []).length > 0;
  const hasNutritionLogs = Object.keys(state.nutritionEntries || {}).length > 0;

  return (
    <LBODIShell>
      {Platform.OS === 'web' && (
        <input
          ref={multiInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleMultiWebFiles(e.target.files)}
          style={{ display: 'none' }}
        />
      )}

      {/* Header */}
      <section className="lbodi-card thermal-top-edge p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent-gold)]">
              {lang === 'sl' ? 'Napredek in preobrazba' : 'Personal Progress'}
            </span>
            <h1 className="font-sacred text-3xl font-semibold text-[var(--text-main)]">
              {lang === 'sl' ? 'Moj napredek' : 'My Progress'}
            </h1>
          </div>
          <button onClick={openNewEntryModal} className="px-3 py-2 rounded-xl lbodi-gold-btn text-xs flex items-center gap-1">
            <span className="material-symbols-outlined text-base">add_a_photo</span>
            <span>{lang === 'sl' ? 'Dodaj sliko' : 'Add Photo'}</span>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'overview', label: lang === 'sl' ? 'Pregled' : 'Overview' },
            { id: 'photos', label: lang === 'sl' ? 'Preobrazba' : 'Photos' },
            { id: 'weight', label: lang === 'sl' ? 'Teža' : 'Weight' },
            { id: 'milestones', label: lang === 'sl' ? 'Mejniki' : 'Milestones' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`py-2 px-1 rounded-xl text-[11px] font-semibold border ${
                activeTab === t.id
                  ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent'
                  : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <>
          {/* "Poglej, kako daleč si prišel" Reflection Card */}
          <section className="lbodi-card p-4 border-[var(--border-gold)] space-y-2.5">
            <span className="text-[11px] uppercase tracking-wider text-[var(--accent-gold)] font-semibold block">
              {lang === 'sl' ? 'Poglej, kako daleč si prišel' : 'Look How Far You Have Come'}
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)] block">Zapisi hvaležnosti</span>
                <span className="text-base font-bold text-[var(--text-main)]">
                  {(state.gratitudeEntries || []).length}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)] block">Tedenski pregledi</span>
                <span className="text-base font-bold text-[var(--text-main)]">
                  {state.weeklyReviews.length + (state.biweeklyVisionReviews?.length || 0)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)] block">Opravljeni cilji</span>
                <span className="text-base font-bold text-[var(--accent-olive)]">
                  {state.goals.filter((g) => g.completed).length} / {state.goals.length}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)] block">Doslednost (7d)</span>
                <span className="text-base font-bold text-[var(--accent-gold)]">
                  {weeklyAvgCompletion}%
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push('/modals/past-self' as any)}
              className="w-full py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--accent-gold)] font-medium"
            >
              Odpri arhiv posnetkov iz preteklosti →
            </button>
          </section>

          {/* 7-Day Habit Completion Chart */}
          <section className="lbodi-card p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-[var(--text-main)]">
                {lang === 'sl' ? 'Tedenska doslednost navad' : 'Weekly Habit Consistency'}
              </span>
              <span className="text-xs text-[var(--accent-gold)] font-semibold">
                {calculateCompletedDaysStreak(state.dailySummaries, todayDateStr)} dni v nizu
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 items-end h-28 pt-2">
              {last7HabitTrend.map((d) => (
                <div key={d.date} className="flex flex-col items-center justify-end h-full gap-1">
                  <div className="w-full flex-1 flex items-end bg-[var(--bg-lowest)] rounded-md p-0.5">
                    {d.pct !== null ? (
                      <div
                        className="w-full rounded-sm bg-[var(--accent-olive)]"
                        style={{ height: `${Math.max(10, d.pct)}%` }}
                      />
                    ) : (
                      <div className="w-full h-1 bg-[var(--border-subtle)] rounded-sm opacity-40" />
                    )}
                  </div>
                  <span className="text-[9px] text-[var(--text-muted)]">{d.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Conditional Modules Summary (shown only when used!) */}
          {(hasWorkoutLogs || hasNutritionLogs) && (
            <section className="grid grid-cols-2 gap-2.5 text-xs">
              {hasWorkoutLogs && (
                <div
                  onClick={() => router.push('/modals/fitness' as any)}
                  className="lbodi-card p-3.5 cursor-pointer"
                >
                  <span className="text-[var(--text-muted)] block">Zabeležene vadbe</span>
                  <span className="text-lg font-bold text-[var(--text-main)]">
                    {(state.workoutLogs || []).length}
                  </span>
                </div>
              )}
              {hasNutritionLogs && (
                <div
                  onClick={() => router.push('/modals/nutrition' as any)}
                  className="lbodi-card p-3.5 cursor-pointer"
                >
                  <span className="text-[var(--text-muted)] block">Zabeleženi dnevi prehrane</span>
                  <span className="text-lg font-bold text-[var(--accent-gold)]">
                    {Object.keys(state.nutritionEntries || {}).length}
                  </span>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* TAB 2: PERSONAL TRANSFORMATION PHOTO TIMELINE */}
      {activeTab === 'photos' && (
        <>
          {/* Drag & Drop / Multi-Upload Zone */}
          {Platform.OS === 'web' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleMultiWebFiles(e.dataTransfer.files);
              }}
              onClick={() => multiInputRef.current?.click()}
              className={`p-4 rounded-2xl border border-dashed text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-[var(--accent-gold)] bg-[var(--bg-elevated)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]'
              }`}
            >
              <span className="material-symbols-outlined text-2xl text-[var(--accent-gold)]">
                cloud_upload
              </span>
              <p className="text-xs font-medium text-[var(--text-main)] mt-1">
                {lang === 'sl'
                  ? 'Povleci ali izberi eno ali več fotografij preobrazbe (2022–2026)'
                  : 'Drag & drop or pick one or multiple private transformation photos'}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                Zasebno shranjeno v lokalnem trezorju naprave. Datum je mogoče urediti po nalaganju.
              </p>
            </div>
          )}

          {/* Before / After Comparison */}
          {beforeEntry && afterEntry && (
            <section className="lbodi-card p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-[var(--text-main)]">
                  {lang === 'sl' ? 'Primerjava (Pred / Po)' : 'Before & After Comparison'}
                </h3>
                <div className="flex bg-[var(--bg-lowest)] p-0.5 rounded-lg border border-[var(--border-subtle)]">
                  <button
                    onClick={() => setCompareMode('side')}
                    className={`px-2 py-1 rounded text-[11px] ${
                      compareMode === 'side' ? 'bg-[var(--accent-gold)] text-[#0B1220] font-semibold' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    Bok ob boku
                  </button>
                  <button
                    onClick={() => setCompareMode('slider')}
                    className={`px-2 py-1 rounded text-[11px] ${
                      compareMode === 'slider' ? 'bg-[var(--accent-gold)] text-[#0B1220] font-semibold' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    Drsnik
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1">
                {(
                  [
                    ['frontPhotoUri', 'Glavna / Spredaj'],
                    ['sidePhotoUri', 'Stran'],
                    ['backPhotoUri', 'Zadaj'],
                    ['customPhotoUri', 'Po meri'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setCompareAngle(key)}
                    className={`py-1 rounded-lg text-[10px] border ${
                      compareAngle === key
                        ? 'bg-[var(--bg-elevated)] border-[var(--border-gold)] text-[var(--accent-gold)]'
                        : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <p className="text-center text-xs font-semibold text-[var(--accent-gold)]">
                {formatTransformationElapsed(beforeEntry.date, afterEntry.date, lang)}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={beforeEntry.id}
                  onChange={(e) => setBeforeEntryId(e.target.value)}
                  className="rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
                >
                  {sortedEntries.map((e) => (
                    <option key={`b_${e.id}`} value={e.id}>
                      Prej: {e.date}
                    </option>
                  ))}
                </select>
                <select
                  value={afterEntry.id}
                  onChange={(e) => setAfterEntryId(e.target.value)}
                  className="rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
                >
                  {sortedEntries.map((e) => (
                    <option key={`a_${e.id}`} value={e.id}>
                      Danes: {e.date}
                    </option>
                  ))}
                </select>
              </div>

              {compareMode === 'side' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-[var(--bg-lowest)] p-2 border border-[var(--border-subtle)] text-center">
                    <VaultImage
                      uri={beforeEntry[compareAngle]}
                      alt="Pred"
                      className="w-full h-44 object-contain rounded cursor-pointer"
                      onClick={() => {
                        if (beforeEntry[compareAngle]) setZoomPhotoUri(beforeEntry[compareAngle]!);
                      }}
                    />
                    <span className="text-[11px] text-[var(--text-main)] block mt-1">
                      {beforeEntry.date} {beforeEntry.weightKg ? `• ${beforeEntry.weightKg} kg` : ''}
                    </span>
                  </div>
                  <div className="rounded-xl bg-[var(--bg-lowest)] p-2 border border-[var(--border-gold)] text-center">
                    <VaultImage
                      uri={afterEntry[compareAngle]}
                      alt="Po"
                      className="w-full h-44 object-contain rounded cursor-pointer"
                      onClick={() => {
                        if (afterEntry[compareAngle]) setZoomPhotoUri(afterEntry[compareAngle]!);
                      }}
                    />
                    <span className="text-[11px] text-[var(--accent-gold)] block mt-1">
                      {afterEntry.date} {afterEntry.weightKg ? `• ${afterEntry.weightKg} kg` : ''}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative w-full h-60 rounded-xl overflow-hidden bg-[var(--bg-lowest)] border border-[var(--border-subtle)]">
                    <VaultImage
                      uri={afterEntry[compareAngle]}
                      alt="Po"
                      className="w-full h-full object-contain"
                    />
                    <div
                      className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-[var(--accent-gold)]"
                      style={{ width: `${sliderPositionPct}%` }}
                    >
                      <VaultImage
                        uri={beforeEntry[compareAngle]}
                        alt="Pred"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={95}
                    value={sliderPositionPct}
                    onChange={(e) => setSliderPositionPct(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
              )}
            </section>
          )}

          {/* Year-Grouped Chronological Photo Timeline */}
          {entriesByYear.map(([year, list]) => (
            <section key={year} className="space-y-2">
              <h3 className="font-sacred text-2xl font-semibold text-[var(--accent-gold)] px-1">
                {year}
              </h3>
              {list.map((entry) => {
                const catObj = PHOTO_CATEGORIES.find((c) => c.id === entry.category);
                return (
                  <div key={entry.id} className="lbodi-card p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-[var(--accent-olive)]">
                          {entry.date} • {catObj ? catObj.sl : 'Preobrazba'}
                        </span>
                        <h4 className="text-sm font-semibold text-[var(--text-main)]">
                          {entry.title || `Vnos ${entry.date}`}
                        </h4>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {entry.weightKg ? `${entry.weightKg} kg ` : ''}
                          {entry.waistCm ? `• Pas: ${entry.waistCm} cm ` : ''}
                          {entry.bodyFatPct ? `• BF: ${entry.bodyFatPct}%` : ''}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => openEditEntryModal(entry)} className="text-[var(--accent-gold)]">
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button onClick={() => setConfirmDeleteId(entry.id)} className="text-red-400">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>

                    {entry.frontPhotoUri && (
                      <VaultImage
                        uri={entry.frontPhotoUri}
                        alt={entry.title || entry.date}
                        className="w-full max-h-56 object-contain rounded-xl bg-[var(--bg-lowest)] cursor-pointer"
                        onClick={() => setZoomPhotoUri(entry.frontPhotoUri!)}
                      />
                    )}

                    {(entry.milestoneThen || entry.milestoneNow || entry.milestoneLearned) && (
                      <div className="p-2.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-xs space-y-1">
                        {entry.milestoneThen && (
                          <p className="text-[var(--text-muted)]">
                            <strong>Takrat sem bil:</strong> {entry.milestoneThen}
                          </p>
                        )}
                        {entry.milestoneNow && (
                          <p className="text-[var(--text-main)]">
                            <strong>Danes sem:</strong> {entry.milestoneNow}
                          </p>
                        )}
                        {entry.milestoneLearned && (
                          <p className="text-[var(--accent-gold)]">
                            <strong>Kaj sem se naučil:</strong> {entry.milestoneLearned}
                          </p>
                        )}
                      </div>
                    )}

                    {entry.notes && <p className="text-xs text-[var(--text-muted)]">{entry.notes}</p>}

                    {confirmDeleteId === entry.id && (
                      <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                        <button
                          onClick={async () => {
                            if (entry.frontPhotoUri?.startsWith('idb://')) await deleteVaultMedia(entry.frontPhotoUri);
                            if (entry.sidePhotoUri?.startsWith('idb://')) await deleteVaultMedia(entry.sidePhotoUri);
                            if (entry.backPhotoUri?.startsWith('idb://')) await deleteVaultMedia(entry.backPhotoUri);
                            if (entry.customPhotoUri?.startsWith('idb://')) await deleteVaultMedia(entry.customPhotoUri);
                            await deletePhysiqueEntry(entry.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold"
                        >
                          Potrdi izbris
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1 rounded-lg bg-[var(--bg-lowest)] text-xs text-[var(--text-muted)]"
                        >
                          Prekliči
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          ))}
        </>
      )}

      {/* TAB 3: BODY WEIGHT & METRICS */}
      {activeTab === 'weight' && (
        <section className="lbodi-card p-4 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-main)]">
            {lang === 'sl' ? 'Telesna teža in meritve' : 'Weight & Measurements'}
          </h3>
          <div className="grid grid-cols-2 gap-2.5 text-center text-xs">
            <div className="p-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)] block">Začetna teža</span>
              <span className="text-lg font-bold text-[var(--text-main)]">
                {state.settings.startingWeightKg} kg
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-gold)]">
              <span className="text-[var(--text-muted)] block">Trenutna teža</span>
              <span className="text-lg font-bold text-[var(--accent-gold)]">
                {currentWeightVal} kg
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)] block">Ciljna teža</span>
              <span className="text-lg font-bold text-[var(--accent-olive)]">
                {state.settings.goalWeightKg} kg
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)] block">Razlika do cilja</span>
              <span className="text-lg font-bold text-[var(--text-main)]">
                {Math.abs(state.settings.goalWeightKg - currentWeightVal).toFixed(1)} kg
              </span>
            </div>
          </div>

          {weightPoints.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-[var(--accent-gold)] block">
                Zgodovina meritev ({weightPoints.length})
              </span>
              {weightPoints.slice(-8).map((wp) => (
                <div
                  key={wp.id}
                  className="p-2.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] flex justify-between text-xs"
                >
                  <span className="text-[var(--text-muted)]">{wp.date}</span>
                  <span className="font-semibold text-[var(--text-main)]">
                    {wp.weightKg} kg {wp.waistCm ? `• Pas ${wp.waistCm} cm` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 4: MILESTONES */}
      {activeTab === 'milestones' && (
        <section className="grid grid-cols-2 gap-2.5">
          {ACHIEVEMENT_BADGES.map((b) => {
            const unlocked = Boolean(state.unlockedAchievements[b.id]);
            return (
              <div
                key={b.id}
                className={`lbodi-card p-3.5 ${unlocked ? 'thermal-top-edge' : 'opacity-50'}`}
              >
                <span className="material-symbols-outlined text-[var(--accent-gold)] text-xl">
                  {unlocked ? 'workspace_premium' : 'lock'}
                </span>
                <h4 className="text-xs font-semibold text-[var(--text-main)] mt-1">
                  {lang === 'sl' ? b.titleSl : b.titleEn}
                </h4>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {lang === 'sl' ? b.descriptionSl : b.descriptionEn}
                </p>
              </div>
            );
          })}
        </section>
      )}

      {/* Add / Edit Photo & Check-in Modal */}
      {entryModalVisible && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md lbodi-card p-5 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-[var(--text-main)]">
                {editingId ? 'Uredi fotografijo / vnos' : 'Nov zapis preobrazbe'}
              </h3>
              <button onClick={() => setEntryModalVisible(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <input
              value={entryTitle}
              onChange={(e) => setEntryTitle(e.target.value)}
              placeholder="Naslov (npr. Začetek 2022, Leto 2026...)"
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
              />
              <select
                value={entryCategory}
                onChange={(e) => setEntryCategory(e.target.value as TransformationPhotoCategory)}
                className="rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
              >
                {PHOTO_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.sl}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="Teža (kg)"
                className="rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
              />
              <input
                value={waistCm}
                onChange={(e) => setWaistCm(e.target.value)}
                placeholder="Pas (cm)"
                className="rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
              />
              <input
                value={bodyFatPct}
                onChange={(e) => setBodyFatPct(e.target.value)}
                placeholder="Maščoba %"
                className="rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['front', 'Glavna slika', frontPhotoUri],
                  ['side', 'Stran', sidePhotoUri],
                  ['back', 'Zadaj', backPhotoUri],
                  ['custom', 'Dodatna', customPhotoUri],
                ] as const
              ).map(([slot, label, uri]) => (
                <button
                  key={slot}
                  onClick={() => pickSingleImage(slot)}
                  className="p-2 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-[11px] text-[var(--accent-gold)] flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">
                    {uri ? 'check_circle' : 'upload_file'}
                  </span>
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <input
              value={milestoneThen}
              onChange={(e) => setMilestoneThen(e.target.value)}
              placeholder="Takrat sem bil ... (opcijsko)"
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
            />
            <input
              value={milestoneNow}
              onChange={(e) => setMilestoneNow(e.target.value)}
              placeholder="Danes sem ... (opcijsko)"
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
            />
            <input
              value={milestoneLearned}
              onChange={(e) => setMilestoneLearned(e.target.value)}
              placeholder="Kaj sem se naučil ... (opcijsko)"
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Dodatne opombe..."
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
            />

            <button onClick={handleSaveEntry} className="w-full py-2.5 rounded-xl lbodi-gold-btn text-xs">
              Shrani v zasebni trezor
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Zoom Viewer */}
      {zoomPhotoUri && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setZoomScale((s) => (s >= 2 ? 1 : s + 0.5))}
              className="px-3 py-1.5 rounded-lg bg-[#131D2C] text-white text-xs"
            >
              Povečava {zoomScale}x
            </button>
            <button
              onClick={() => {
                setZoomPhotoUri(null);
                setZoomScale(1);
              }}
              className="px-3 py-1.5 rounded-lg lbodi-gold-btn text-xs"
            >
              Zapri
            </button>
          </div>
          <div style={{ transform: `scale(${zoomScale})` }} className="transition-transform max-w-sm max-h-[75vh]">
            <VaultImage
              uri={zoomPhotoUri}
              alt="Preobrazba"
              className="max-w-sm max-h-[75vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </LBODIShell>
  );
}
