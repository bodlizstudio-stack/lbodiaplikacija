import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../src/store/AppContext';
import { PerformanceHQShell } from '../../src/components/PerformanceHQShell';
import { ManifestationSessionType } from '../../src/types';

const PRESENT_TENSE_TEMPLATES = [
  'I am grateful for my healthy body.',
  'I am financially independent.',
  'I am disciplined and consistent.',
  'I have achieved the physique I wanted.',
  'I am becoming a better version of myself every day.',
];

export default function ManifestationModalScreen() {
  const {
    state,
    todayDateStr,
    tr,
    saveManifestationEntry,
    toggleManifestationFavorite,
    deleteManifestationEntry,
    addAffirmation,
    deleteAffirmation,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'write' | 'affirmations' | 'history'>('write');
  const [selectedSession, setSelectedSession] =
    useState<ManifestationSessionType>('morning');
  const [selectedDate] = useState(todayDateStr);

  const existingEntry = useMemo(
    () =>
      state.manifestations.find(
        (m) => m.date === selectedDate && m.session === selectedSession
      ),
    [state.manifestations, selectedDate, selectedSession]
  );

  const [gratefulFor, setGratefulFor] = useState('');
  const [alreadyHave, setAlreadyHave] = useState('');
  const [becoming, setBecoming] = useState('');
  const [presentTenseStatement, setPresentTenseStatement] = useState('');
  const [savedBanner, setSavedBanner] = useState(false);

  const [newAffirmation, setNewAffirmation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setGratefulFor(existingEntry?.gratefulFor || '');
    setAlreadyHave(existingEntry?.alreadyHave || '');
    setBecoming(existingEntry?.becoming || '');
    setPresentTenseStatement(existingEntry?.presentTenseStatement || '');
  }, [existingEntry, selectedDate, selectedSession]);

  const todayCount = useMemo(
    () => state.manifestations.filter((m) => m.date === todayDateStr).length,
    [state.manifestations, todayDateStr]
  );

  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return state.manifestations;
    return state.manifestations.filter(
      (m) =>
        m.gratefulFor.toLowerCase().includes(q) ||
        m.alreadyHave.toLowerCase().includes(q) ||
        m.becoming.toLowerCase().includes(q) ||
        m.presentTenseStatement.toLowerCase().includes(q) ||
        m.date.includes(q)
    );
  }, [state.manifestations, searchQuery]);

  const handleSave = async () => {
    await saveManifestationEntry(selectedDate, selectedSession, {
      gratefulFor,
      alreadyHave,
      becoming,
      presentTenseStatement,
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2000);
  };

  return (
    <PerformanceHQShell
      showBackButton
      subtitle={`Manifestation: ${todayCount}/3 completed today`}
    >
      {/* Header & Tabs */}
      <section className="rounded-xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low p-space-md machined-border thermal-top-edge">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-secondary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            <h2 className="text-headline-sm font-headline-sm text-white">
              Manifestation &amp; Gratitude
            </h2>
          </div>
          <span className="text-label-sm font-label-sm text-secondary bg-secondary-container bg-opacity-20 px-2 py-0.5 rounded">
            {todayCount}/3 Complete
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {[
            { id: 'write', label: 'Daily Journal' },
            { id: 'affirmations', label: 'Affirmations' },
            { id: 'history', label: 'Archive' },
          ].map((tItem) => (
            <button
              key={tItem.id}
              onClick={() => setActiveTab(tItem.id as any)}
              className={`py-2 rounded-lg text-label-sm font-label-sm machined-border ${
                activeTab === tItem.id
                  ? 'bg-primary-container text-on-primary font-bold'
                  : 'bg-surface-container-lowest text-on-surface-variant'
              }`}
            >
              {tItem.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'write' && (
        <>
          {/* 3 Sessions Selector */}
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                {
                  id: 'morning',
                  label: 'Morning',
                  time: state.settings.manifestationMorningTime,
                },
                {
                  id: 'afternoon',
                  label: 'Midday',
                  time: state.settings.manifestationAfternoonTime,
                },
                {
                  id: 'evening',
                  label: 'Evening',
                  time: state.settings.manifestationEveningTime,
                },
              ] as const
            ).map((s) => {
              const isDone = state.manifestations.some(
                (m) => m.date === selectedDate && m.session === s.id
              );
              const active = selectedSession === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSession(s.id)}
                  className={`bg-surface-container p-2.5 rounded-lg text-center border-t-2 machined-border ${
                    active
                      ? 'border-primary-container thermal-glow-sm'
                      : isDone
                      ? 'border-emerald-500'
                      : 'border-outline-variant'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-base ${
                      isDone ? 'text-primary' : 'text-tertiary'
                    }`}
                  >
                    {isDone ? 'check_circle' : 'schedule'}
                  </span>
                  <p className="text-label-sm font-label-sm text-white mt-1">
                    {s.label}
                  </p>
                  <span className="text-label-sm font-label-sm text-on-surface-variant">
                    {s.time}
                  </span>
                </button>
              );
            })}
          </div>

          <section className="rounded-xl bg-surface-container p-space-md machined-border space-y-3">
            <div>
              <label className="text-label-sm font-label-sm text-primary uppercase block mb-1">
                {tr('gratefulForLabel')}
              </label>
              <textarea
                value={gratefulFor}
                onChange={(e) => setGratefulFor(e.target.value)}
                rows={2}
                placeholder="I am grateful for my healthy body..."
                className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
              />
            </div>

            <div>
              <label className="text-label-sm font-label-sm text-primary uppercase block mb-1">
                {tr('alreadyHaveLabel')}
              </label>
              <textarea
                value={alreadyHave}
                onChange={(e) => setAlreadyHave(e.target.value)}
                rows={2}
                placeholder="Strength, focus, discipline..."
                className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
              />
            </div>

            <div>
              <label className="text-label-sm font-label-sm text-primary uppercase block mb-1">
                {tr('becomingLabel')}
              </label>
              <textarea
                value={becoming}
                onChange={(e) => setBecoming(e.target.value)}
                rows={2}
                placeholder="I am becoming a better version of myself every day..."
                className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
              />
            </div>

            <div>
              <label className="text-label-sm font-label-sm text-secondary uppercase block mb-1">
                {tr('presentTenseLabel')}
              </label>
              <textarea
                value={presentTenseStatement}
                onChange={(e) => setPresentTenseStatement(e.target.value)}
                rows={2}
                placeholder="I have achieved the physique I wanted..."
                className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
              />
            </div>

            {/* Templates */}
            <div className="space-y-1.5">
              <span className="text-label-sm font-label-sm text-tertiary uppercase block">
                Present-Tense Templates:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESENT_TENSE_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setPresentTenseStatement((prev) =>
                        prev ? `${prev} ${tpl}` : tpl
                      )
                    }
                    className="px-2.5 py-1 rounded bg-surface-container-low text-on-surface-variant hover:text-primary text-label-sm machined-border text-left"
                  >
                    + {tpl}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary-container to-inverse-primary text-on-primary font-bold text-label-lg machined-border"
            >
              {savedBanner ? 'SAVED TO VAULT ✓' : 'SAVE MANIFESTATION SESSION'}
            </button>
          </section>
        </>
      )}

      {activeTab === 'affirmations' && (
        <section className="rounded-xl bg-surface-container p-space-md machined-border space-y-3">
          <div className="flex gap-2">
            <input
              value={newAffirmation}
              onChange={(e) => setNewAffirmation(e.target.value)}
              placeholder="Write a new present-tense affirmation..."
              className="flex-1 rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
            />
            <button
              onClick={async () => {
                if (!newAffirmation.trim()) return;
                await addAffirmation(newAffirmation.trim());
                setNewAffirmation('');
              }}
              className="px-4 rounded-lg bg-primary-container text-on-primary font-bold text-label-sm machined-border"
            >
              Add
            </button>
          </div>

          <div className="space-y-2">
            {state.affirmations.map((aff) => (
              <div
                key={aff.id}
                className="p-3 rounded-lg bg-surface-container-low machined-border flex items-center justify-between gap-2"
              >
                <span className="text-body-sm text-white font-medium">
                  {aff.text}
                </span>
                <button
                  onClick={() => deleteAffirmation(aff.id)}
                  className="text-tertiary hover:text-error"
                >
                  <span className="material-symbols-outlined text-base">
                    delete
                  </span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'history' && (
        <section className="space-y-2.5">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr('searchPlaceholder')}
            className="w-full rounded-lg bg-surface-container border border-outline-variant text-white p-2.5 text-body-sm"
          />
          {filteredHistory.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl bg-surface-container p-space-md machined-border space-y-1.5"
            >
              <div className="flex justify-between items-center">
                <span className="text-label-sm font-label-sm text-primary uppercase">
                  {entry.date} • {entry.session}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => toggleManifestationFavorite(entry.id)}>
                    <span
                      className="material-symbols-outlined text-secondary text-base"
                      style={
                        entry.isFavorite
                          ? { fontVariationSettings: "'FILL' 1" }
                          : undefined
                      }
                    >
                      star
                    </span>
                  </button>
                  <button onClick={() => setConfirmDeleteId(entry.id)}>
                    <span className="material-symbols-outlined text-error text-base">
                      delete
                    </span>
                  </button>
                </div>
              </div>
              {entry.gratefulFor && (
                <p className="text-body-sm text-on-surface">{entry.gratefulFor}</p>
              )}
              {entry.presentTenseStatement && (
                <p className="text-body-sm text-primary italic">
                  &ldquo;{entry.presentTenseStatement}&rdquo;
                </p>
              )}

              {confirmDeleteId === entry.id && (
                <div className="pt-2 border-t border-surface-variant flex justify-between items-center">
                  <span className="text-label-sm text-error">
                    Confirm deleting entry?
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await deleteManifestationEntry(entry.id);
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
      )}
    </PerformanceHQShell>
  );
}
