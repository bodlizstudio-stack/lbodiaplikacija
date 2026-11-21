import React, { useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useApp } from '../../src/store/AppContext';
import { LBODIShell } from '../../src/components/LBODIShell';
import { DEFAULT_NUTRITION_TARGETS } from '../../src/data/faithData';
import {
  NutritionParseResult,
  ParsedNutritionRow,
  parseNutritionCsv,
  parseNutritionJson,
  parseNutritionPdfBytes,
} from '../../src/services/nutritionParser';
import { addDays } from '../../src/utils/dateUtils';
import { NutritionEntry, NutritionSource } from '../../src/types';

export default function NutritionModalScreen() {
  const {
    state,
    todayDateStr,
    saveNutritionEntry,
    importNutritionEntries,
    deleteNutritionEntry,
    updateNutritionTargets,
  } = useApp();

  const lang = state.settings.language;
  const targets = state.settings.nutritionTargets || DEFAULT_NUTRITION_TARGETS;
  const entriesByDate = state.nutritionEntries || {};
  const todayEntry = entriesByDate[todayDateStr];

  const [tab, setTab] = useState<'overview' | 'manual' | 'import'>('overview');
  const [formDate, setFormDate] = useState(todayDateStr);
  const [calories, setCalories] = useState(todayEntry ? String(todayEntry.calories) : '');
  const [protein, setProtein] = useState(todayEntry ? String(todayEntry.proteinG) : '');
  const [carbs, setCarbs] = useState(todayEntry ? String(todayEntry.carbsG) : '');
  const [fat, setFat] = useState(todayEntry ? String(todayEntry.fatG) : '');
  const [notes, setNotes] = useState(todayEntry?.notes || '');
  const [statusBanner, setStatusBanner] = useState('');

  // Targets editor
  const [editingTargets, setEditingTargets] = useState(false);
  const [tCal, setTCal] = useState(String(targets.calories));
  const [tProt, setTProt] = useState(String(targets.proteinG));
  const [tCarb, setTCarb] = useState(String(targets.carbsG));
  const [tFat, setTFat] = useState(String(targets.fatG));

  // File Import Wizard (CSV / JSON / PDF)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingFileName, setPendingFileName] = useState('');
  const [parseResult, setParseResult] = useState<NutritionParseResult | null>(null);
  const [reviewRows, setReviewRows] = useState<ParsedNutritionRow[]>([]);

  // Opt-in AI Insight state
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(todayDateStr, i - 6);
      return {
        date,
        label: date.slice(5),
        entry: entriesByDate[date] as NutritionEntry | undefined,
      };
    });
  }, [todayDateStr, entriesByDate]);

  const logged7Count = last7Days.filter((d) => Boolean(d.entry)).length;

  const handleSaveManual = async () => {
    const cal = parseInt(calories, 10);
    if (isNaN(cal) || cal <= 0) {
      setStatusBanner(lang === 'sl' ? 'Vnesi veljavne kalorije.' : 'Enter valid calories.');
      return;
    }
    await saveNutritionEntry({
      date: formDate || todayDateStr,
      calories: cal,
      proteinG: parseInt(protein, 10) || 0,
      carbsG: parseInt(carbs, 10) || 0,
      fatG: parseInt(fat, 10) || 0,
      source: 'manual',
      notes: notes.trim() || undefined,
    });
    setStatusBanner(lang === 'sl' ? 'Prehrana zabeležena ✓' : 'Nutrition logged ✓');
    setTimeout(() => setStatusBanner(''), 2500);
    setTab('overview');
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFileName(file.name);
    const lower = file.name.toLowerCase();

    let res: NutritionParseResult;
    if (lower.endsWith('.json')) {
      const txt = await file.text();
      res = parseNutritionJson(txt, entriesByDate);
    } else if (lower.endsWith('.pdf')) {
      const buf = await file.arrayBuffer();
      res = parseNutritionPdfBytes(new Uint8Array(buf), entriesByDate, todayDateStr);
    } else {
      const txt = await file.text();
      res = parseNutritionCsv(txt, entriesByDate);
    }

    setParseResult(res);
    setReviewRows(res.rows);
  };

  const handleConfirmImport = async () => {
    if (!parseResult) return;
    const chosen = reviewRows.filter((r) => r.include);
    if (chosen.length === 0) return;

    const source: NutritionSource =
      parseResult.format === 'csv'
        ? 'import_csv'
        : parseResult.format === 'json'
        ? 'import_json'
        : 'import_pdf';

    const result = await importNutritionEntries(
      chosen.map((r) => ({
        date: r.date,
        calories: r.calories,
        proteinG: r.proteinG,
        carbsG: r.carbsG,
        fatG: r.fatG,
        source,
        notes: r.notes,
      })),
      {
        fileName: pendingFileName || `calai_export.${parseResult.format}`,
        format: parseResult.format,
        importedDates: chosen.map((c) => c.date),
        fingerprint: parseResult.fingerprint,
      }
    );

    setStatusBanner(
      lang === 'sl'
        ? `Uvoženo: ${result.importedCount} dni (preskočeni duplikati: ${result.skippedDuplicates}).`
        : `Imported ${result.importedCount} days (skipped duplicates: ${result.skippedDuplicates}).`
    );
    setParseResult(null);
    setReviewRows([]);
    setTab('overview');
  };

  const handleAskAINutrition = async () => {
    if (!state.settings.aiPrivacy?.allowNutrition) {
      setAiInsight(
        lang === 'sl'
          ? 'Analiza prehrane z AI je trenutno izklopljena v nastavitvah zasebnosti za LBODI AI.'
          : 'AI nutrition sharing is currently disabled in AI Privacy settings.'
      );
      return;
    }
    setAiLoading(true);
    try {
      const summary = Object.values(entriesByDate)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 7);
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content:
                'Preglej moje zadnje zabeležene dneve prehrane in podaj miren, zmeren, realističen povzetek (brez ekstremnih diet).',
            },
          ],
          authorizedContext: { nutritionLogs: summary, targets },
          language: lang,
        }),
      });
      const json = await res.json();
      setAiInsight(
        json.ok
          ? json.reply
          : json.code === 'AI_NOT_CONFIGURED'
          ? 'GEMINI_API_KEY še ni nastavljen na strežniku Vercel. Povzetek temelji na dejanskih podatkih zgoraj.'
          : json.error
      );
    } catch {
      setAiInsight('Napaka pri klicu /api/ai/chat.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <LBODIShell
      showBackButton
      subtitle={lang === 'sl' ? 'Prehrana in integracija Cal AI' : 'Nutrition & Cal AI'}
    >
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json,.pdf,text/csv,application/json,application/pdf"
          onChange={handleImportFileChange}
          style={{ display: 'none' }}
        />
      )}

      {/* Honest Cal AI Integration Status Card */}
      <section className="lbodi-card thermal-top-edge p-4 space-y-2.5">
        <div className="flex justify-between items-start gap-2">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
              Cal AI (calai.app) • Iskreno stanje integracije
            </span>
            <h1 className="font-sacred text-2xl font-semibold text-[var(--text-main)]">
              {lang === 'sl' ? 'Prehrana in energija' : 'Nutrition Overview'}
            </h1>
          </div>
          <button
            onClick={() => setEditingTargets(!editingTargets)}
            className="text-xs text-[var(--accent-gold)] underline"
          >
            {lang === 'sl' ? 'Cilji' : 'Targets'}
          </button>
        </div>

        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed bg-[var(--bg-lowest)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
          {lang === 'sl'
            ? 'Cal AI trenutno ne ponuja uradnega javnega API-ja ali OAuth povezave za zunanje aplikacije. Da ne bi ogrožali zasebnosti ali uporabljali neuradnih vdorov, LBODI ponuja varen uvoz tvojega izvoza (CSV, JSON ali PDF s predogledom in potrditvijo) ter hiter ročni vnos.'
            : 'Cal AI currently does not provide a public REST API or OAuth integration. LBODI supports safe CSV/JSON/PDF export import with verification plus fast manual entry.'}
        </p>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'overview', label: lang === 'sl' ? 'Pregled' : 'Overview' },
            { id: 'manual', label: lang === 'sl' ? 'Ročni vnos' : 'Manual' },
            { id: 'import', label: lang === 'sl' ? 'Uvozi izvoz' : 'Import' },
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

      {statusBanner && (
        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center font-medium">
          {statusBanner}
        </div>
      )}

      {editingTargets && (
        <section className="lbodi-card p-4 space-y-2.5">
          <span className="text-xs font-semibold text-[var(--accent-gold)] block">
            {lang === 'sl' ? 'Dnevni prehranski cilji' : 'Daily Nutrition Targets'}
          </span>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-[var(--text-muted)]">kcal</label>
              <input value={tCal} onChange={(e) => setTCal(e.target.value)} className="w-full rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-[var(--text-main)]" />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)]">Belj (g)</label>
              <input value={tProt} onChange={(e) => setTProt(e.target.value)} className="w-full rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-[var(--text-main)]" />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)]">OH (g)</label>
              <input value={tCarb} onChange={(e) => setTCarb(e.target.value)} className="w-full rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-[var(--text-main)]" />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)]">Mašč (g)</label>
              <input value={tFat} onChange={(e) => setTFat(e.target.value)} className="w-full rounded-lg bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-[var(--text-main)]" />
            </div>
          </div>
          <button
            onClick={async () => {
              await updateNutritionTargets({
                calories: parseInt(tCal, 10) || 2500,
                proteinG: parseInt(tProt, 10) || 180,
                carbsG: parseInt(tCarb, 10) || 260,
                fatG: parseInt(tFat, 10) || 75,
              });
              setEditingTargets(false);
            }}
            className="w-full py-2 rounded-xl lbodi-gold-btn text-xs"
          >
            {lang === 'sl' ? 'Shrani cilje' : 'Save Targets'}
          </button>
        </section>
      )}

      {/* TAB 1: OVERVIEW */}
      {tab === 'overview' && (
        <>
          <section className="lbodi-card p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-[var(--text-main)]">
                {lang === 'sl' ? `Danes (${todayDateStr})` : `Today (${todayDateStr})`}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--accent-gold)]">
                {todayEntry
                  ? todayEntry.source === 'manual'
                    ? 'Ročni vnos'
                    : `Uvoženo (${todayEntry.source.replace('import_', '').toUpperCase()})`
                  : lang === 'sl'
                  ? 'Ni zabeleženo (manjkajoči podatek)'
                  : 'Missing Log'}
              </span>
            </div>

            {todayEntry ? (
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  ['Kalorije', `${todayEntry.calories}`, `${targets.calories}`],
                  ['Beljakovine', `${todayEntry.proteinG}g`, `${targets.proteinG}g`],
                  ['OH', `${todayEntry.carbsG}g`, `${targets.carbsG}g`],
                  ['Maščobe', `${todayEntry.fatG}g`, `${targets.fatG}g`],
                ].map(([lbl, val, tgt], i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)]"
                  >
                    <span className="text-[10px] text-[var(--text-muted)] block">{lbl}</span>
                    <span className="text-sm font-bold text-[var(--text-main)] block mt-0.5">
                      {val}
                    </span>
                    <span className="text-[9px] text-[var(--accent-gold)]">/ {tgt}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">
                {lang === 'sl'
                  ? 'Danes še ni vnosa. Manjkajoč vnos ne pomeni slabega dne — dodaj podatke ročno ali prek uvoza.'
                  : 'No entry logged yet today. Missing data is never treated as a failed day.'}
              </p>
            )}
          </section>

          {/* Weekly Bar Trend */}
          <section className="lbodi-card p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-[var(--text-main)]">
                {lang === 'sl'
                  ? `Zadnjih 7 dni (${logged7Count}/7 dni zabeleženo)`
                  : `Last 7 Days (${logged7Count}/7 Logged)`}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 items-end h-28 pt-3">
              {last7Days.map((d) => {
                const pct = d.entry
                  ? Math.min(100, Math.round((d.entry.calories / Math.max(1, targets.calories)) * 100))
                  : 0;
                return (
                  <div key={d.date} className="flex flex-col items-center justify-end h-full gap-1">
                    <div className="w-full flex-1 flex items-end bg-[var(--bg-lowest)] rounded-md overflow-hidden p-0.5">
                      {d.entry ? (
                        <div
                          className="w-full rounded-sm bg-[var(--accent-gold)]"
                          style={{ height: `${Math.max(12, pct)}%` }}
                          title={`${d.entry.calories} kcal`}
                        />
                      ) : (
                        <div className="w-full h-1 bg-[var(--border-subtle)] rounded-sm opacity-40" />
                      )}
                    </div>
                    <span className="text-[9px] text-[var(--text-muted)]">{d.label}</span>
                  </div>
                );
              })}
            </div>

            {logged7Count > 0 && (
              <button
                onClick={handleAskAINutrition}
                disabled={aiLoading}
                className="w-full py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-gold)] text-xs text-[var(--accent-gold)] font-medium"
              >
                {aiLoading ? 'LBODI AI analizira...' : 'LBODI AI povzetek prehrane (opt-in)'}
              </button>
            )}
            {aiInsight && (
              <p className="text-xs text-[var(--text-main)] bg-[var(--bg-lowest)] p-3 rounded-xl border border-[var(--border-subtle)] leading-relaxed">
                {aiInsight}
              </p>
            )}
          </section>

          {/* All Logged Records */}
          {Object.values(entriesByDate).length > 0 && (
            <section className="space-y-2">
              {Object.values(entriesByDate)
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((e) => (
                  <div key={e.date} className="lbodi-card p-3 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-[var(--accent-gold)]">{e.date}</span>
                      <span className="ml-2 text-[10px] text-[var(--text-muted)]">
                        [{e.source === 'manual' ? 'Ročno' : 'Uvoz'}]
                      </span>
                      <p className="text-[var(--text-main)] mt-0.5">
                        {e.calories} kcal • B: {e.proteinG}g • OH: {e.carbsG}g • M: {e.fatG}g
                      </p>
                    </div>
                    <button onClick={() => deleteNutritionEntry(e.date)} className="text-red-400">
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                ))}
            </section>
          )}
        </>
      )}

      {/* TAB 2: MANUAL ENTRY */}
      {tab === 'manual' && (
        <section className="lbodi-card p-4 space-y-3">
          <div>
            <label className="text-[11px] text-[var(--accent-gold)] block mb-1">Datum</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-[var(--accent-gold)] block mb-1">Kalorije (kcal)</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="npr. 2450"
                className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
              />
            </div>
            <div>
              <label className="text-[11px] text-[var(--accent-gold)] block mb-1">Beljakovine (g)</label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="npr. 180"
                className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
              />
            </div>
            <div>
              <label className="text-[11px] text-[var(--accent-gold)] block mb-1">Ogljikovi hidrati (g)</label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="npr. 250"
                className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
              />
            </div>
            <div>
              <label className="text-[11px] text-[var(--accent-gold)] block mb-1">Maščobe (g)</label>
              <input
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="npr. 75"
                className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
              />
            </div>
          </div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opombe (npr. polnovredni obroki)..."
            className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
          />
          <button onClick={handleSaveManual} className="w-full py-3 rounded-xl lbodi-gold-btn text-sm">
            {lang === 'sl' ? 'Shrani dnevni vnos' : 'Save Daily Log'}
          </button>
        </section>
      )}

      {/* TAB 3: IMPORT CSV / JSON / PDF */}
      {tab === 'import' && (
        <section className="lbodi-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-main)]">
            {lang === 'sl' ? 'Uvoz izvoza prehrane (CSV, JSON, PDF)' : 'Import Nutrition Export'}
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            {lang === 'sl'
              ? 'Izberi datoteko CSV, JSON ali PDF. Pred shranjevanjem boš vse zaznane vrstice pregledal in potrdil. Podvojeni datumi so samodejno prepoznani.'
              : 'Select a CSV, JSON, or PDF file. You will review and confirm every parsed row before saving.'}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 rounded-xl bg-[var(--bg-elevated)] border border-dashed border-[var(--border-gold)] text-xs font-semibold text-[var(--accent-gold)]"
          >
            {lang === 'sl' ? 'Izberi datoteko (CSV / JSON / PDF)' : 'Select Export File'}
          </button>

          {parseResult?.warning && (
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs">
              {parseResult.warning}
            </div>
          )}

          {reviewRows.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-[var(--text-main)] block">
                Pregled pred shranjevanjem ({reviewRows.length} dni):
              </span>
              {reviewRows.map((row, idx) => (
                <div
                  key={row.date + idx}
                  className="p-2.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-xs space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 font-semibold text-[var(--accent-gold)]">
                      <input
                        type="checkbox"
                        checked={row.include}
                        onChange={(e) => {
                          const copy = [...reviewRows];
                          copy[idx] = { ...row, include: e.target.checked };
                          setReviewRows(copy);
                        }}
                        className="accent-amber-500"
                      />
                      <span>{row.date}</span>
                    </label>
                    {row.isDuplicate && (
                      <span className="text-[10px] text-amber-300">Že obstaja (duplikat)</span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <input
                      type="number"
                      value={row.calories}
                      onChange={(e) => {
                        const copy = [...reviewRows];
                        copy[idx] = { ...row, calories: parseInt(e.target.value, 10) || 0 };
                        setReviewRows(copy);
                      }}
                      className="rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-1 text-center text-[var(--text-main)]"
                    />
                    <input
                      type="number"
                      value={row.proteinG}
                      onChange={(e) => {
                        const copy = [...reviewRows];
                        copy[idx] = { ...row, proteinG: parseInt(e.target.value, 10) || 0 };
                        setReviewRows(copy);
                      }}
                      className="rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-1 text-center text-[var(--text-main)]"
                    />
                    <input
                      type="number"
                      value={row.carbsG}
                      onChange={(e) => {
                        const copy = [...reviewRows];
                        copy[idx] = { ...row, carbsG: parseInt(e.target.value, 10) || 0 };
                        setReviewRows(copy);
                      }}
                      className="rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-1 text-center text-[var(--text-main)]"
                    />
                    <input
                      type="number"
                      value={row.fatG}
                      onChange={(e) => {
                        const copy = [...reviewRows];
                        copy[idx] = { ...row, fatG: parseInt(e.target.value, 10) || 0 };
                        setReviewRows(copy);
                      }}
                      className="rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-1 text-center text-[var(--text-main)]"
                    />
                  </div>
                </div>
              ))}
              <button onClick={handleConfirmImport} className="w-full py-2.5 rounded-xl lbodi-gold-btn text-xs">
                {lang === 'sl' ? 'Potrdi in shrani izbrane dni' : 'Confirm & Save Selected'}
              </button>
            </div>
          )}
        </section>
      )}
    </LBODIShell>
  );
}
