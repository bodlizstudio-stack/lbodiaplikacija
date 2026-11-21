import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../src/store/AppContext';
import { PerformanceHQShell } from '../../src/components/PerformanceHQShell';
import { PastSelfEntry } from '../../src/types';
import {
  deleteVaultMedia,
  resolveVaultMediaUrl,
  saveMediaFileToVault,
  saveNativeUriToVault,
} from '../../src/services/videoVaultService';
import {
  getLjubljanaDateString,
  parseDateStringUTCNoon,
} from '../../src/utils/dateUtils';

function calculateDaysBetween(startIso: string, endIso: string): number {
  const start = parseDateStringUTCNoon(startIso).getTime();
  const end = parseDateStringUTCNoon(endIso).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function PastSelfMediaCard({
  entry,
  currentWeightKg,
  onDelete,
}: {
  entry: PastSelfEntry;
  currentWeightKg?: number;
  onDelete: (entry: PastSelfEntry) => void;
}) {
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let mounted = true;
    resolveVaultMediaUrl(entry.mediaUri).then((url) => {
      if (mounted) setResolvedUrl(url);
    });
    return () => {
      mounted = false;
    };
  }, [entry.mediaUri]);

  const todayKey = getLjubljanaDateString();
  const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(entry.recordedDate);
  const daysAgo = isIsoDate
    ? Math.max(0, calculateDaysBetween(entry.recordedDate, todayKey))
    : null;

  const weightDiff =
    entry.weightThenKg && currentWeightKg
      ? +(currentWeightKg - entry.weightThenKg).toFixed(1)
      : null;

  return (
    <article className="rounded-xl bg-surface-container p-space-md machined-border thermal-top-edge space-y-3">
      <div className="flex justify-between items-start gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-label-sm font-label-sm uppercase px-2 py-0.5 rounded bg-surface-container-highest text-primary border border-outline-variant">
              {entry.mediaType === 'video' ? 'POSNETEK • VIDEO' : 'SLIKA • PHOTO'}
            </span>
            <span className="text-label-sm font-label-sm text-secondary uppercase">
              Obdobje: {entry.recordedDate}
            </span>
            {daysAgo !== null && (
              <span className="text-label-sm font-label-sm text-primary-container font-bold uppercase">
                • {daysAgo} dni za tabo
              </span>
            )}
          </div>
          <h3 className="text-headline-sm font-headline-sm text-white mt-1">
            {entry.title}
          </h3>
        </div>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg bg-surface-container-low text-tertiary hover:text-error machined-border"
            title="Izbriši posnetek"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onDelete(entry)}
              className="px-2 py-1 rounded bg-error-container text-on-error-container text-label-sm font-bold"
            >
              Potrdi izbris
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 rounded bg-surface-container-high text-tertiary text-label-sm"
            >
              Prekliči
            </button>
          </div>
        )}
      </div>

      {/* Video or Image Player */}
      <div className="rounded-lg overflow-hidden bg-surface-container-lowest machined-border">
        {resolvedUrl ? (
          entry.mediaType === 'video' ? (
            <video
              src={resolvedUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full max-h-[420px] object-contain bg-black"
            />
          ) : (
            <img
              src={resolvedUrl}
              alt={entry.title}
              className="w-full max-h-[420px] object-cover"
            />
          )
        ) : (
          <div className="h-48 flex items-center justify-center text-tertiary text-label-md">
            Nalaganje posnetka iz osebnega trezorja...
          </div>
        )}
      </div>

      {/* Telemetry Row: Weight Then vs Now */}
      {(entry.weightThenKg !== undefined || weightDiff !== null) && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-2 rounded-lg bg-surface-container-low machined-border">
            <span className="text-label-sm text-tertiary uppercase block">
              TEŽA TAKRAT
            </span>
            <span className="text-label-lg font-bold text-white">
              {entry.weightThenKg ? `${entry.weightThenKg} kg` : '—'}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-surface-container-low machined-border">
            <span className="text-label-sm text-tertiary uppercase block">
              TEŽA DANES
            </span>
            <span className="text-label-lg font-bold text-primary">
              {currentWeightKg ? `${currentWeightKg} kg` : '—'}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-surface-container-low machined-border">
            <span className="text-label-sm text-tertiary uppercase block">
              RAZLIKA
            </span>
            <span className="text-label-lg font-bold text-secondary">
              {weightDiff !== null
                ? `${weightDiff > 0 ? '+' : ''}${weightDiff} kg`
                : '—'}
            </span>
          </div>
        </div>
      )}

      {/* Reflection Note */}
      {entry.reflectionNote ? (
        <div className="p-3 rounded-lg bg-surface-container-low border-l-2 border-l-primary-container">
          <span className="text-label-sm font-label-sm text-primary uppercase tracking-wider block mb-1">
            OPOMNIK SEBI • KAKO DOLGO POT IMAŠ ZA SABO
          </span>
          <p className="text-body-sm font-body-sm text-on-surface leading-relaxed whitespace-pre-line">
            {entry.reflectionNote}
          </p>
        </div>
      ) : null}
    </article>
  );
}

export default function PastSelfScreen() {
  const { state, savePastSelfEntry, deletePastSelfEntry } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [recordedDate, setRecordedDate] = useState('2024-01-01');
  const [weightThen, setWeightThen] = useState('');
  const [reflectionNote, setReflectionNote] = useState('');
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [pendingMediaUri, setPendingMediaUri] = useState<string>('');
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string>('');
  const [pendingFileName, setPendingFileName] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const pastSelfEntries = state.pastSelfEntries || [];
  const latestPhysiqueWithWeight = [...state.physiqueEntries]
    .filter((p) => p.weightKg !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const currentWeightKg =
    latestPhysiqueWithWeight?.weightKg || state.settings.startingWeightKg;

  const handleWebFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSaving(true);
    try {
      const detectedType: 'video' | 'image' = file.type.startsWith('video')
        ? 'video'
        : 'image';
      setMediaType(detectedType);
      setPendingFileName(file.name);
      const vaultUri = await saveMediaFileToVault(file, 'past_self');
      setPendingMediaUri(vaultUri);
      const preview = await resolveVaultMediaUrl(vaultUri);
      setPendingPreviewUrl(preview);
      if (!title.trim()) {
        setTitle(
          detectedType === 'video'
            ? 'Posnetek iz preteklosti — Kako sem izgledal včasih'
            : 'Slika iz preteklosti — Začetek moje poti'
        );
      }
      setShowAddForm(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickMedia = async () => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
      return;
    }
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos', 'images'],
        quality: 0.9,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
        const detectedType: 'video' | 'image' =
          asset.type === 'video' ? 'video' : 'image';
        setMediaType(detectedType);
        const savedUri = await saveNativeUriToVault(asset.uri, 'past_self');
        setPendingMediaUri(savedUri);
        setPendingPreviewUrl(savedUri);
        setPendingFileName(asset.fileName || 'posnetek.mp4');
        if (!title.trim()) {
          setTitle('Kako sem izgledal včasih');
        }
        setShowAddForm(true);
      }
    } catch {}
  };

  const handleSaveEntry = async () => {
    if (!pendingMediaUri) return;
    setIsSaving(true);
    try {
      const parsedWeight = parseFloat(weightThen);
      await savePastSelfEntry({
        title: title.trim() || 'Kako sem izgledal včasih',
        recordedDate: recordedDate.trim() || getLjubljanaDateString(),
        mediaType,
        mediaUri: pendingMediaUri,
        weightThenKg: !isNaN(parsedWeight) ? parsedWeight : undefined,
        reflectionNote:
          reflectionNote.trim() ||
          'Spomni se, kje si začel in koliko truda je že za tabo. Nikoli več nazaj.',
      });
      setTitle('');
      setWeightThen('');
      setReflectionNote('');
      setPendingMediaUri('');
      setPendingPreviewUrl('');
      setPendingFileName('');
      setShowAddForm(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (entry: PastSelfEntry) => {
    await deleteVaultMedia(entry.mediaUri);
    await deletePastSelfEntry(entry.id);
  };

  return (
    <PerformanceHQShell
      showBackButton
      subtitle="Poglej, kakšen si bil včasih • Spomin na prehojeno pot"
    >
      {/* Hidden Web File Input for Videos & Photos */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/*"
          onChange={handleWebFileSelect}
          style={{ display: 'none' }}
        />
      )}

      {/* Hero Motivational Card */}
      <section className="rounded-xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low p-space-md machined-border thermal-glow thermal-top-edge space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-label-sm font-label-sm text-primary uppercase tracking-widest bg-surface-container-highest px-2.5 py-0.5 rounded border border-outline-variant">
            ARHIV PRETEKLOSTI • NIKOLI VEČ NAZAJ
          </span>
          <span className="text-label-sm font-label-sm text-secondary font-bold">
            {pastSelfEntries.length} POSNETKOV
          </span>
        </div>

        <div>
          <h2 className="text-headline-lg-mobile font-headline-lg-mobile text-white tracking-tight uppercase">
            POGLEJ, KAKŠEN SI <span className="text-primary-container">BIL VČASIH.</span>
          </h2>
          <p className="text-body-sm font-body-sm text-on-surface-variant mt-1 leading-relaxed">
            Tukaj so tvoji posnetki in slike iz preteklosti. Ko ti pade motivacija ali ko postane težko, si zavrti posnetek in se spomni, kako dolgo pot imaš že za sabo — in zakaj se nikoli več ne vrneš nazaj.
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handlePickMedia}
            className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-primary-container to-inverse-primary text-on-primary font-bold text-label-md uppercase tracking-wider flex items-center justify-center gap-2 machined-border active:scale-[0.99] transition-all"
          >
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              video_call
            </span>
            <span>Naloži posnetek ali sliko iz preteklosti</span>
          </button>
        </div>
      </section>

      {/* Upload / Details Form */}
      {showAddForm && (
        <section className="rounded-xl bg-surface-container p-space-md machined-border border-l-2 border-l-primary-container space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-label-md font-bold text-primary uppercase tracking-wider">
              SHRANI POSNETEK V OSEBNI ARHIV
            </span>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-tertiary text-label-sm"
            >
              Prekliči
            </button>
          </div>

          {pendingPreviewUrl ? (
            <div className="rounded-lg overflow-hidden bg-surface-container-lowest machined-border">
              {mediaType === 'video' ? (
                <video
                  src={pendingPreviewUrl}
                  controls
                  playsInline
                  className="w-full max-h-64 object-contain bg-black"
                />
              ) : (
                <img
                  src={pendingPreviewUrl}
                  alt="Predogled"
                  className="w-full max-h-64 object-cover"
                />
              )}
              <div className="px-3 py-1.5 bg-surface-container-low flex justify-between items-center">
                <span className="text-label-sm text-primary truncate">
                  {pendingFileName || 'Izbrana datoteka'}
                </span>
                <button
                  onClick={handlePickMedia}
                  className="text-label-sm text-secondary underline ml-2"
                >
                  Zamenjaj posnetek
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handlePickMedia}
              className="w-full py-6 rounded-lg bg-surface-container-lowest border border-dashed border-outline-variant text-primary flex flex-col items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-2xl">
                upload_file
              </span>
              <span className="text-label-md">
                Izberi video posnetek (.mp4, .mov) ali sliko
              </span>
            </button>
          )}

          <div>
            <label className="text-label-sm text-primary uppercase block mb-1">
              Naslov posnetka / obdobja
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="npr. Kako sem izgledal pred začetkom preobrazbe"
              className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-label-sm text-primary uppercase block mb-1">
                Kdaj je bil posnetek narejen (Datum ali leto)
              </label>
              <input
                value={recordedDate}
                onChange={(e) => setRecordedDate(e.target.value)}
                placeholder="2023-05-10 ali Leto 2022"
                className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
              />
            </div>
            <div>
              <label className="text-label-sm text-primary uppercase block mb-1">
                Tvoja teža takrat (kg - opcijsko)
              </label>
              <input
                value={weightThen}
                onChange={(e) => setWeightThen(e.target.value)}
                placeholder="npr. 96.5"
                type="number"
                step="0.1"
                className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-label-sm text-primary uppercase block mb-1">
              Opomnik sebi (Kako si se takrat počutil &amp; zakaj greš naprej)
            </label>
            <textarea
              value={reflectionNote}
              onChange={(e) => setReflectionNote(e.target.value)}
              rows={3}
              placeholder="Napiši iskreno: kako si se takrat počutil v svojem telesu, zakaj si začel in zakaj nikoli več ne greš nazaj na staro pot..."
              className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
            />
          </div>

          <button
            onClick={handleSaveEntry}
            disabled={!pendingMediaUri || isSaving}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-primary-container to-inverse-primary text-on-primary font-bold text-label-lg uppercase tracking-wider machined-border disabled:opacity-40"
          >
            {isSaving ? 'Shranjevanje...' : 'Shrani posnetek v arhiv'}
          </button>
        </section>
      )}

      {/* Journey Reminder Quote */}
      <section className="rounded-xl bg-surface-container-low p-space-md machined-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary-container machined-border flex-shrink-0">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              footprint
            </span>
          </div>
          <div>
            <span className="text-label-sm font-label-sm text-primary uppercase tracking-wider block">
              TVOJA PREHOJENA POT • LUKA BODLAJ
            </span>
            <p className="text-body-sm text-white font-semibold">
              &ldquo;Vsak dan, ko vztrajaš, povečuje razdaljo med tem, kar si bil včasih, in človekom, ki postajaš.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Saved Past Self Videos & Photos */}
      {pastSelfEntries.length === 0 ? (
        <section className="rounded-xl bg-surface-container p-6 machined-border text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-surface-container-lowest mx-auto flex items-center justify-center text-primary-container machined-border">
            <span className="material-symbols-outlined text-3xl">
              videocam
            </span>
          </div>
          <h3 className="text-headline-sm font-headline-sm text-white">
            Še nimaš naloženih posnetkov iz preteklosti
          </h3>
          <p className="text-body-sm text-on-surface-variant max-w-md mx-auto">
            Naloži posneteke ali fotografije, kako si izgledal včasih. Vsi posnetki so shranjeni lokalno in zasebno v tvojem osebnem trezorju.
          </p>
          <button
            onClick={handlePickMedia}
            className="px-5 py-2.5 rounded-lg bg-surface-container-highest text-primary font-bold text-label-md uppercase tracking-wider machined-border inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Dodaj prvi posnetek</span>
          </button>
        </section>
      ) : (
        <section className="space-y-4">
          {pastSelfEntries.map((entry) => (
            <PastSelfMediaCard
              key={entry.id}
              entry={entry}
              currentWeightKg={currentWeightKg}
              onDelete={handleDeleteEntry}
            />
          ))}
        </section>
      )}
    </PerformanceHQShell>
  );
}
