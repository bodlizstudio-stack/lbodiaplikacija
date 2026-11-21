import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../src/store/AppContext';
import { PerformanceHQShell } from '../../src/components/PerformanceHQShell';
import { AUTHENTIC_BIBLE_VERSES } from '../../src/data/seedData';
import { persistPrivatePhoto } from '../../src/services/securityService';

export default function WhyIStartedScreen() {
  const router = useRouter();
  const { state, tr, updateWhyIStarted } = useApp();
  const why = state.whyIStarted;

  const [isEditing, setIsEditing] = useState(false);
  const [mission, setMission] = useState(why.mission);
  const [longTermGoals, setLongTermGoals] = useState(why.longTermGoals);
  const [disciplineReasons, setDisciplineReasons] = useState(why.disciplineReasons);
  const [financialGoals, setFinancialGoals] = useState(why.financialGoals);
  const [idealPhysique, setIdealPhysique] = useState(why.idealPhysique);
  const [personalValues, setPersonalValues] = useState(why.personalValues);
  const [personBecoming, setPersonBecoming] = useState(why.personBecoming);
  const [newQuote, setNewQuote] = useState('');

  const handleSave = async () => {
    await updateWhyIStarted({
      mission,
      longTermGoals,
      disciplineReasons,
      financialGoals,
      idealPhysique,
      personalValues,
      personBecoming,
    });
    setIsEditing(false);
  };

  const addMotivationPhoto = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        const uri = await persistPrivatePhoto(res.assets[0].uri, 'why');
        await updateWhyIStarted({
          motivationPhotoUris: [...(why.motivationPhotoUris || []), uri],
        });
      }
    } catch {}
  };

  const favoriteVerses = AUTHENTIC_BIBLE_VERSES.filter((v) =>
    state.favoriteVerseIds.includes(v.id)
  );

  return (
    <PerformanceHQShell showBackButton subtitle="Personal Purpose &amp; Command Intent">
      {/* Immersive Hero */}
      <section className="rounded-xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low p-space-md machined-border thermal-glow thermal-top-edge">
        <div className="flex justify-between items-center mb-2">
          <span className="text-label-sm font-label-sm text-primary uppercase tracking-widest bg-surface-container-highest px-2 py-0.5 rounded border border-outline-variant">
            EMERGENCY MOTIVATION
          </span>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-2.5 py-1 rounded bg-surface-container-highest text-primary text-label-sm font-label-sm flex items-center gap-1 machined-border"
          >
            <span className="material-symbols-outlined text-sm">
              {isEditing ? 'visibility' : 'edit'}
            </span>
            <span>{isEditing ? 'View' : 'Edit Purpose'}</span>
          </button>
        </div>

        <h2 className="text-headline-lg-mobile font-headline-lg-mobile text-white tracking-tight">
          THIS IS WHY <span className="text-primary-container">YOU STARTED.</span>
        </h2>
        <p className="text-label-md font-label-md text-on-surface-variant uppercase mt-1">
          &ldquo;DON&apos;T FORGET WHAT YOU&apos;RE HERE FOR, AND WHY YOU STARTED.&rdquo;
        </p>

        <button
          onClick={() => router.push('/modals/past-self' as any)}
          className="mt-3 w-full py-2.5 px-3 rounded-lg bg-surface-container-highest text-primary font-bold text-label-md uppercase tracking-wider flex items-center justify-between machined-border hover:bg-surface-bright transition-all"
        >
          <span className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary-container text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              videocam
            </span>
            <span>Poglej, kakšen si bil včasih (Posnetki iz preteklosti)</span>
          </span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </section>

      {isEditing ? (
        <section className="rounded-xl bg-surface-container p-space-md machined-border space-y-3">
          {[
            { label: tr('lifeMissionLabel'), val: mission, set: setMission },
            { label: tr('disciplineReasonsLabel'), val: disciplineReasons, set: setDisciplineReasons },
            { label: tr('personBecomingLabel'), val: personBecoming, set: setPersonBecoming },
            { label: tr('longTermGoalsLabel'), val: longTermGoals, set: setLongTermGoals },
            { label: tr('financialGoalsLabel'), val: financialGoals, set: setFinancialGoals },
            { label: tr('idealPhysiqueLabel'), val: idealPhysique, set: setIdealPhysique },
            { label: tr('personalValuesLabel'), val: personalValues, set: setPersonalValues },
          ].map((field, idx) => (
            <div key={idx}>
              <label className="text-label-sm font-label-sm text-primary uppercase block mb-1">
                {field.label}
              </label>
              <textarea
                value={field.val}
                onChange={(e) => field.set(e.target.value)}
                rows={3}
                className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2.5 text-body-sm"
              />
            </div>
          ))}
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-primary-container to-inverse-primary text-on-primary font-bold text-label-lg machined-border"
          >
            {tr('save')}
          </button>
        </section>
      ) : (
        <>
          {[
            { icon: 'explore', title: tr('lifeMissionLabel'), body: why.mission },
            { icon: 'bolt', title: tr('disciplineReasonsLabel'), body: why.disciplineReasons },
            { icon: 'person_celebrate', title: tr('personBecomingLabel'), body: why.personBecoming },
            { icon: 'emoji_events', title: tr('longTermGoalsLabel'), body: why.longTermGoals },
            { icon: 'payments', title: tr('financialGoalsLabel'), body: why.financialGoals },
            { icon: 'fitness_center', title: tr('idealPhysiqueLabel'), body: why.idealPhysique },
            { icon: 'shield', title: tr('personalValuesLabel'), body: why.personalValues },
          ].map((block, i) => (
            <section
              key={i}
              className={`rounded-xl bg-surface-container p-space-md machined-border ${
                i < 2 ? 'border-l-2 border-l-primary-container' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="material-symbols-outlined text-primary-container text-base">
                  {block.icon}
                </span>
                <span className="text-label-sm font-label-sm text-primary uppercase tracking-wider">
                  {block.title}
                </span>
              </div>
              <p className="text-body-md font-body-md text-white leading-relaxed">
                {block.body}
              </p>
            </section>
          ))}

          {/* Personal Power Quotes */}
          <section className="rounded-xl bg-surface-container-low p-space-md machined-border space-y-2.5">
            <span className="text-label-sm font-label-sm text-primary uppercase tracking-wider block">
              PERSONAL POWER QUOTES
            </span>
            {why.personalQuotes.map((q, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-surface-container machined-border flex items-start gap-2"
              >
                <span className="material-symbols-outlined text-primary text-sm mt-0.5">
                  format_quote
                </span>
                <p className="text-body-sm font-body-sm text-white italic">
                  &ldquo;{q}&rdquo;
                </p>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <input
                value={newQuote}
                onChange={(e) => setNewQuote(e.target.value)}
                placeholder="Add new personal quote..."
                className="flex-1 rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2 text-body-sm"
              />
              <button
                onClick={async () => {
                  if (!newQuote.trim()) return;
                  await updateWhyIStarted({
                    personalQuotes: [...why.personalQuotes, newQuote.trim()],
                  });
                  setNewQuote('');
                }}
                className="px-3 rounded-lg bg-primary-container text-on-primary font-bold text-label-sm machined-border"
              >
                Add
              </button>
            </div>
          </section>

          {/* Vision Board Photos */}
          <section className="rounded-xl bg-surface-container p-space-md machined-border space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-label-sm font-label-sm text-primary uppercase tracking-wider">
                VISION &amp; MOTIVATION GALLERY
              </span>
              <button
                onClick={addMotivationPhoto}
                className="px-2.5 py-1 rounded bg-surface-container-high text-primary text-label-sm flex items-center gap-1 machined-border"
              >
                <span className="material-symbols-outlined text-sm">add_a_photo</span>
                <span>Add Photo</span>
              </button>
            </div>
            {why.motivationPhotoUris && why.motivationPhotoUris.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {why.motivationPhotoUris.map((uri, idx) => (
                  <img
                    key={idx}
                    src={uri}
                    alt="Motivation"
                    className="w-full h-36 object-cover rounded-lg machined-border"
                  />
                ))}
              </div>
            ) : (
              <p className="text-body-sm text-on-surface-variant italic">
                Upload photos that remind you of your goals and target lifestyle.
              </p>
            )}
          </section>

          {/* Selected Scripture */}
          <section className="rounded-xl bg-surface-container p-space-md machined-border thermal-top-edge space-y-2.5">
            <span className="text-label-sm font-label-sm text-primary uppercase tracking-wider block">
              ANCHOR SCRIPTURE
            </span>
            {favoriteVerses.map((v) => (
              <div
                key={v.id}
                className="p-3 rounded-lg bg-surface-container-low machined-border"
              >
                <p className="text-body-sm text-white italic">&ldquo;{v.textEn}&rdquo;</p>
                <span className="text-label-sm text-primary font-bold block mt-1">
                  {v.referenceEn}
                </span>
              </div>
            ))}
          </section>
        </>
      )}
    </PerformanceHQShell>
  );
}
