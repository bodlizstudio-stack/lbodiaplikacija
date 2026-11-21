import React, { useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../src/store/AppContext';
import { PerformanceHQShell } from '../../src/components/PerformanceHQShell';
import { ACHIEVEMENT_BADGES } from '../../src/data/seedData';
import { persistPrivatePhoto } from '../../src/services/securityService';
import {
  calculateCompletedDaysStreak,
  formatTransformationElapsed,
} from '../../src/utils/dateUtils';
import { PhysiqueEntry } from '../../src/types';

export default function ProgressScreen() {
  const {
    state,
    todayDateStr,
    tr,
    savePhysiqueEntry,
    deletePhysiqueEntry,
  } = useApp();

  const lang = state.settings.language;
  const [activeTab, setActiveTab] = useState<'physique' | 'weight' | 'stats'>('physique');

  // Check-In Modal state
  const [entryModalVisible, setEntryModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [entryDate, setEntryDate] = useState(todayDateStr);
  const [weightKg, setWeightKg] = useState('');
  const [waistCm, setWaistCm] = useState('');
  const [bodyFatPct, setBodyFatPct] = useState('');
  const [frontPhotoUri, setFrontPhotoUri] = useState<string | undefined>();
  const [sidePhotoUri, setSidePhotoUri] = useState<string | undefined>();
  const [backPhotoUri, setBackPhotoUri] = useState<string | undefined>();
  const [customPhotoUri, setCustomPhotoUri] = useState<string | undefined>();
  const [notes, setNotes] = useState('');

  // Comparison state
  const [compareMode, setCompareMode] = useState<'side' | 'slider'>('side');
  const [compareCategory, setCompareCategory] = useState<
    'frontPhotoUri' | 'sidePhotoUri' | 'backPhotoUri' | 'customPhotoUri'
  >('frontPhotoUri');
  const [beforeEntryId, setBeforeEntryId] = useState<string | null>(null);
  const [afterEntryId, setAfterEntryId] = useState<string | null>(null);
  const [sliderPositionPct, setSliderPositionPct] = useState(50);

  // Fullscreen zoom
  const [zoomPhotoUri, setZoomPhotoUri] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sortedEntries = useMemo(
    () => [...state.physiqueEntries].sort((a, b) => b.date.localeCompare(a.date)),
    [state.physiqueEntries]
  );

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

  const pickImage = async (slot: 'front' | 'side' | 'back' | 'custom') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
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
    setEntryDate(todayDateStr);
    setWeightKg('83.5');
    setWaistCm('79.5');
    setBodyFatPct('12.5');
    setFrontPhotoUri('/logo.jpg');
    setSidePhotoUri(undefined);
    setBackPhotoUri(undefined);
    setCustomPhotoUri(undefined);
    setNotes('');
    setEntryModalVisible(true);
  };

  const openEditEntryModal = (entry: PhysiqueEntry) => {
    setEditingId(entry.id);
    setEntryDate(entry.date);
    setWeightKg(entry.weightKg ? String(entry.weightKg) : '');
    setWaistCm(entry.waistCm ? String(entry.waistCm) : '');
    setBodyFatPct(entry.bodyFatPct ? String(entry.bodyFatPct) : '');
    setFrontPhotoUri(entry.frontPhotoUri);
    setSidePhotoUri(entry.sidePhotoUri);
    setBackPhotoUri(entry.backPhotoUri);
    setCustomPhotoUri(entry.customPhotoUri);
    setNotes(entry.notes || '');
    setEntryModalVisible(true);
  };

  const handleSaveEntry = async () => {
    await savePhysiqueEntry({
      id: editingId,
      date: entryDate.trim() || todayDateStr,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      waistCm: waistCm ? parseFloat(waistCm) : undefined,
      bodyFatPct: bodyFatPct ? parseFloat(bodyFatPct) : undefined,
      frontPhotoUri,
      sidePhotoUri,
      backPhotoUri,
      customPhotoUri,
      notes: notes.trim(),
    });
    setEntryModalVisible(false);
  };

  const weightPoints = useMemo(() => {
    return [...state.physiqueEntries]
      .filter((e) => typeof e.weightKg === 'number' && !isNaN(e.weightKg))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [state.physiqueEntries]);

  const currentWeightVal =
    weightPoints.length > 0
      ? weightPoints[weightPoints.length - 1].weightKg!
      : state.settings.startingWeightKg;

  const habitCompletionRates = useMemo(() => {
    return state.habits.map((h) => {
      const recs = state.dailyHabitRecords.filter((r) => r.habitId === h.id);
      const done = recs.filter((r) => r.completed).length;
      const pct = recs.length > 0 ? Math.round((done / recs.length) * 100) : 0;
      return { id: h.id, title: h.title.split('/')[0].trim(), done, total: recs.length, pct };
    });
  }, [state.habits, state.dailyHabitRecords]);

  return (
    <PerformanceHQShell>
      {/* Top Banner */}
      <section className="rounded-xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low p-space-md machined-border thermal-top-edge">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-label-sm font-label-sm text-primary uppercase tracking-widest">
              TRANSFORMATION &amp; TELEMETRY
            </span>
            <h2 className="text-headline-sm font-headline-sm text-white">
              {tr('progressTitle')}
            </h2>
          </div>
          <button
            onClick={openNewEntryModal}
            className="py-2 px-3 bg-gradient-to-r from-primary-container to-inverse-primary rounded-lg text-on-primary font-headline-sm text-label-md flex items-center gap-1 shadow-md active:scale-95 machined-border"
          >
            <span className="material-symbols-outlined text-base">add_a_photo</span>
            <span>Check-In</span>
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          {[
            { id: 'physique', label: tr('physiqueTab') },
            { id: 'weight', label: tr('weightTab') },
            { id: 'stats', label: tr('disciplineStatsTab') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-2 rounded-lg text-label-sm font-label-sm machined-border ${
                activeTab === tab.id
                  ? 'bg-primary-container text-on-primary font-bold'
                  : 'bg-surface-container-lowest text-on-surface-variant'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'physique' && (
        <>
          {/* Transformation Comparison Card */}
          <section className="rounded-xl bg-surface-container p-space-md machined-border space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-headline-sm font-headline-sm text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary-container">
                  compare
                </span>
                {tr('comparePhotos')}
              </h3>
              <div className="flex bg-surface-container-lowest p-0.5 rounded-lg machined-border">
                <button
                  onClick={() => setCompareMode('side')}
                  className={`px-2 py-1 rounded text-label-sm font-label-sm ${
                    compareMode === 'side'
                      ? 'bg-primary-container text-on-primary font-bold'
                      : 'text-tertiary'
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setCompareMode('slider')}
                  className={`px-2 py-1 rounded text-label-sm font-label-sm ${
                    compareMode === 'slider'
                      ? 'bg-primary-container text-on-primary font-bold'
                      : 'text-tertiary'
                  }`}
                >
                  Slider
                </button>
              </div>
            </div>

            {/* Angle Selector */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { key: 'frontPhotoUri', label: tr('frontPhoto') },
                { key: 'sidePhotoUri', label: tr('sidePhoto') },
                { key: 'backPhotoUri', label: tr('backPhoto') },
                { key: 'customPhotoUri', label: tr('customPhoto') },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCompareCategory(c.key as any)}
                  className={`py-1.5 rounded text-label-sm font-label-sm machined-border ${
                    compareCategory === c.key
                      ? 'bg-surface-container-highest text-primary border border-primary-container'
                      : 'bg-surface-container-lowest text-tertiary'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {beforeEntry && afterEntry ? (
              <>
                <div className="bg-surface-container-lowest p-2 rounded-lg text-center machined-border">
                  <span className="text-label-md font-label-md text-primary-container font-bold">
                    {formatTransformationElapsed(
                      beforeEntry.date,
                      afterEntry.date,
                      lang
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={beforeEntry.id}
                    onChange={(e) => setBeforeEntryId(e.target.value)}
                    className="rounded-lg bg-surface-container-lowest border border-outline-variant text-white text-label-sm p-2"
                  >
                    {sortedEntries.map((e) => (
                      <option key={`b_${e.id}`} value={e.id}>
                        Before: {e.date} ({e.weightKg ?? '--'}kg)
                      </option>
                    ))}
                  </select>
                  <select
                    value={afterEntry.id}
                    onChange={(e) => setAfterEntryId(e.target.value)}
                    className="rounded-lg bg-surface-container-lowest border border-outline-variant text-white text-label-sm p-2"
                  >
                    {sortedEntries.map((e) => (
                      <option key={`a_${e.id}`} value={e.id}>
                        After: {e.date} ({e.weightKg ?? '--'}kg)
                      </option>
                    ))}
                  </select>
                </div>

                {compareMode === 'side' ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-surface-container-lowest p-2 rounded-lg machined-border text-center">
                      {beforeEntry[compareCategory] ? (
                        <img
                          onClick={() =>
                            setZoomPhotoUri(beforeEntry[compareCategory] || null)
                          }
                          src={beforeEntry[compareCategory]}
                          alt="Before"
                          className="w-full h-44 object-cover rounded cursor-pointer"
                        />
                      ) : (
                        <div className="w-full h-44 flex items-center justify-center text-tertiary">
                          <span className="material-symbols-outlined text-3xl">
                            image
                          </span>
                        </div>
                      )}
                      <p className="text-label-sm font-label-sm text-white mt-1.5">
                        {beforeEntry.date} • {beforeEntry.weightKg ?? '--'} kg
                      </p>
                    </div>

                    <div className="bg-surface-container-lowest p-2 rounded-lg machined-border text-center">
                      {afterEntry[compareCategory] ? (
                        <img
                          onClick={() =>
                            setZoomPhotoUri(afterEntry[compareCategory] || null)
                          }
                          src={afterEntry[compareCategory]}
                          alt="After"
                          className="w-full h-44 object-cover rounded cursor-pointer"
                        />
                      ) : (
                        <div className="w-full h-44 flex items-center justify-center text-tertiary">
                          <span className="material-symbols-outlined text-3xl">
                            image
                          </span>
                        </div>
                      )}
                      <p className="text-label-sm font-label-sm text-primary mt-1.5">
                        {afterEntry.date} • {afterEntry.weightKg ?? '--'} kg
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative w-full h-56 rounded-lg overflow-hidden bg-surface-container-lowest machined-border">
                      {afterEntry[compareCategory] && (
                        <img
                          src={afterEntry[compareCategory]}
                          alt="After"
                          className="w-full h-full object-cover"
                        />
                      )}
                      {beforeEntry[compareCategory] && (
                        <div
                          className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-primary-container"
                          style={{ width: `${sliderPositionPct}%` }}
                        >
                          <img
                            src={beforeEntry[compareCategory]}
                            alt="Before"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={95}
                      value={sliderPositionPct}
                      onChange={(e) => setSliderPositionPct(Number(e.target.value))}
                      className="w-full accent-orange-500"
                    />
                  </div>
                )}
              </>
            ) : null}
          </section>

          {/* Chronological Timeline */}
          <section className="space-y-2.5">
            <h3 className="text-label-md font-label-md text-primary uppercase tracking-wider">
              PRIVATE PHYSIQUE TIMELINE ({sortedEntries.length})
            </h3>
            {sortedEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl bg-surface-container p-space-md machined-border"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-headline-sm font-headline-sm text-white">
                      {entry.date}
                    </h4>
                    <p className="text-label-sm font-label-sm text-primary mt-0.5">
                      {entry.weightKg ? `${entry.weightKg} kg` : ''}{' '}
                      {entry.waistCm ? `• Waist: ${entry.waistCm} cm` : ''}{' '}
                      {entry.bodyFatPct ? `• BF: ${entry.bodyFatPct}%` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEditEntryModal(entry)}
                      className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-primary machined-border"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(entry.id)}
                      className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-error machined-border"
                    >
                      <span className="material-symbols-outlined text-base">
                        delete
                      </span>
                    </button>
                  </div>
                </div>

                {entry.notes && (
                  <p className="text-body-sm font-body-sm text-on-surface-variant mt-2">
                    {entry.notes}
                  </p>
                )}

                {confirmDeleteId === entry.id && (
                  <div className="mt-2 pt-2 border-t border-surface-variant flex justify-between items-center">
                    <span className="text-label-sm text-error">
                      Delete this check-in?
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          await deletePhysiqueEntry(entry.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2.5 py-1 rounded bg-error-container text-on-error-container text-label-sm font-bold"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 rounded bg-surface-variant text-tertiary text-label-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>
        </>
      )}

      {activeTab === 'weight' && (
        <section className="rounded-xl bg-surface-container p-space-md machined-border thermal-glow space-y-4">
          <h3 className="text-headline-sm font-headline-sm text-white">
            Weight &amp; Body Composition Telemetry
          </h3>
          <div className="grid grid-cols-2 gap-2.5 text-center">
            <div className="bg-surface-container-low p-3 rounded-lg machined-border">
              <span className="text-label-sm font-label-sm text-tertiary uppercase">
                {tr('startingWeight')}
              </span>
              <span className="text-headline-md font-headline-md text-white block mt-1">
                {state.settings.startingWeightKg} kg
              </span>
            </div>
            <div className="bg-surface-container-low p-3 rounded-lg machined-border">
              <span className="text-label-sm font-label-sm text-tertiary uppercase">
                {tr('currentWeight')}
              </span>
              <span className="text-headline-md font-headline-md text-primary-container block mt-1">
                {currentWeightVal} kg
              </span>
            </div>
            <div className="bg-surface-container-low p-3 rounded-lg machined-border">
              <span className="text-label-sm font-label-sm text-tertiary uppercase">
                {tr('goalWeight')}
              </span>
              <span className="text-headline-md font-headline-md text-emerald-400 block mt-1">
                {state.settings.goalWeightKg} kg
              </span>
            </div>
            <div className="bg-surface-container-low p-3 rounded-lg machined-border">
              <span className="text-label-sm font-label-sm text-tertiary uppercase">
                {tr('distanceToGoal')}
              </span>
              <span className="text-headline-md font-headline-md text-secondary block mt-1">
                {Math.abs(state.settings.goalWeightKg - currentWeightVal).toFixed(1)} kg
              </span>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'stats' && (
        <>
          <section className="rounded-xl bg-surface-container p-space-md machined-border space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-headline-sm font-headline-sm text-white">
                Completion Rate by Mission
              </h3>
              <span className="text-label-sm font-label-sm text-primary">
                {calculateCompletedDaysStreak(state.dailySummaries, todayDateStr)}D Streak
              </span>
            </div>

            {habitCompletionRates.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between text-label-sm font-label-sm">
                  <span className="text-on-surface">{item.title}</span>
                  <span className="text-primary">{item.pct}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-lowest rounded-full overflow-hidden machined-border">
                  <div
                    className="h-full bg-gradient-to-r from-primary-container to-secondary"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-2 gap-2.5">
            {ACHIEVEMENT_BADGES.map((b) => {
              const unlocked = Boolean(state.unlockedAchievements[b.id]);
              return (
                <div
                  key={b.id}
                  className={`rounded-xl bg-surface-container p-3 machined-border ${
                    unlocked ? 'thermal-top-edge' : 'opacity-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-primary-container text-xl">
                    {unlocked ? 'workspace_premium' : 'lock'}
                  </span>
                  <h4 className="text-label-md font-label-md text-white font-bold mt-1">
                    {lang === 'sl' ? b.titleSl : b.titleEn}
                  </h4>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">
                    {lang === 'sl' ? b.descriptionSl : b.descriptionEn}
                  </p>
                </div>
              );
            })}
          </section>
        </>
      )}

      {/* Add/Edit Check-In Modal */}
      {entryModalVisible && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-surface-container p-space-md machined-border thermal-top-edge space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-headline-sm font-headline-sm text-white">
                {tr('addProgressEntry')}
              </h3>
              <button
                onClick={() => setEntryModalVisible(false)}
                className="text-tertiary hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-label-sm text-primary uppercase block mb-1">
                  Date (YYYY-MM-DD)
                </label>
                <input
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2 text-body-sm"
                />
              </div>
              <div>
                <label className="text-label-sm text-primary uppercase block mb-1">
                  Weight (kg)
                </label>
                <input
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2 text-body-sm"
                />
              </div>
              <div>
                <label className="text-label-sm text-primary uppercase block mb-1">
                  Waist (cm)
                </label>
                <input
                  value={waistCm}
                  onChange={(e) => setWaistCm(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2 text-body-sm"
                />
              </div>
              <div>
                <label className="text-label-sm text-primary uppercase block mb-1">
                  Body Fat (%)
                </label>
                <input
                  value={bodyFatPct}
                  onChange={(e) => setBodyFatPct(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2 text-body-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['front', 'side', 'back', 'custom'] as const).map((slot) => (
                <button
                  key={slot}
                  onClick={() => pickImage(slot)}
                  className="p-2.5 rounded-lg bg-surface-container-low machined-border text-label-sm text-primary flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">
                    upload_file
                  </span>
                  <span className="uppercase">{slot} Photo</span>
                </button>
              ))}
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Check-in notes..."
              rows={2}
              className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-variant">
              <button
                onClick={() => setEntryModalVisible(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-low text-tertiary text-label-md machined-border"
              >
                {tr('cancel')}
              </button>
              <button
                onClick={handleSaveEntry}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-primary-container to-inverse-primary text-on-primary font-bold text-label-md machined-border"
              >
                {tr('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Zoom Viewer */}
      {zoomPhotoUri && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setZoomScale((s) => (s >= 2 ? 1 : s + 0.5))}
              className="px-3 py-1.5 rounded bg-surface-container text-white text-label-sm machined-border"
            >
              Zoom {zoomScale}x
            </button>
            <button
              onClick={() => {
                setZoomPhotoUri(null);
                setZoomScale(1);
              }}
              className="px-3 py-1.5 rounded bg-primary-container text-on-primary font-bold text-label-sm"
            >
              Close
            </button>
          </div>
          <img
            src={zoomPhotoUri}
            alt="Zoomed Physique"
            style={{ transform: `scale(${zoomScale})` }}
            className="max-w-sm max-h-[75vh] object-contain rounded-lg transition-transform"
          />
        </div>
      )}
    </PerformanceHQShell>
  );
}
