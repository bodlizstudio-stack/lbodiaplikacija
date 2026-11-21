import React, { useMemo, useState } from 'react';
import { useApp } from '../../src/store/AppContext';
import { PerformanceHQShell } from '../../src/components/PerformanceHQShell';
import { AUTHENTIC_BIBLE_VERSES } from '../../src/data/seedData';
import { BibleCategory, BibleTestament } from '../../src/types';

const BIBLE_CATEGORIES: { id: BibleCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'discipline', label: 'Discipline' },
  { id: 'strength', label: 'Strength' },
  { id: 'faith', label: 'Faith' },
  { id: 'perseverance', label: 'Perseverance' },
  { id: 'wisdom', label: 'Wisdom' },
  { id: 'gratitude', label: 'Gratitude' },
  { id: 'patience', label: 'Patience' },
  { id: 'courage', label: 'Courage' },
  { id: 'hope', label: 'Hope' },
];

export default function BibleVersesModalScreen() {
  const { state, toggleFavoriteVerse, updateSettings } = useApp();
  const translationPref = state.settings.bibleTranslationPreference || 'both';

  const [testamentFilter, setTestamentFilter] = useState<'ALL' | BibleTestament>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<BibleCategory | 'all'>('all');
  const [onlySaved, setOnlySaved] = useState(false);
  const [spotlightIdx, setSpotlightIdx] = useState(0);

  const spotlightVerse =
    AUTHENTIC_BIBLE_VERSES[spotlightIdx] || AUTHENTIC_BIBLE_VERSES[0];

  const filteredVerses = useMemo(() => {
    return AUTHENTIC_BIBLE_VERSES.filter((v) => {
      if (testamentFilter !== 'ALL' && v.testament !== testamentFilter) return false;
      if (categoryFilter !== 'all' && v.category !== categoryFilter) return false;
      if (onlySaved && !state.favoriteVerseIds.includes(v.id)) return false;
      return true;
    });
  }, [testamentFilter, categoryFilter, onlySaved, state.favoriteVerseIds]);

  return (
    <PerformanceHQShell showBackButton subtitle="Old &amp; New Testament Scripture">
      {/* Spotlight Verse of the Day */}
      <section className="rounded-xl bg-surface-container p-space-md machined-border thermal-glow thermal-top-edge">
        <div className="flex justify-between items-center mb-space-sm">
          <span className="text-label-sm font-label-sm text-primary tracking-widest uppercase flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">book_5</span>
            SPOTLIGHT SCRIPTURE
          </span>
          <span className="text-label-sm font-label-sm bg-surface-variant text-tertiary px-2 py-0.5 rounded uppercase">
            {spotlightVerse.testament === 'NT' ? 'New Testament' : 'Old Testament'} •{' '}
            {spotlightVerse.category}
          </span>
        </div>

        {(translationPref === 'en_kjv' || translationPref === 'both') && (
          <blockquote className="text-body-lg font-body-lg text-white font-medium tracking-tight mb-2 leading-relaxed">
            &ldquo;{spotlightVerse.textEn}&rdquo;
          </blockquote>
        )}
        {(translationPref === 'sl' || translationPref === 'both') && (
          <blockquote className="text-body-md font-body-md text-on-surface-variant italic mb-2">
            &ldquo;{spotlightVerse.textSl}&rdquo;
          </blockquote>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-surface-variant">
          <span className="text-label-md font-label-md text-primary font-bold">
            {spotlightVerse.referenceEn} / {spotlightVerse.referenceSl}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setSpotlightIdx(
                  Math.floor(Math.random() * AUTHENTIC_BIBLE_VERSES.length)
                )
              }
              className="px-2.5 py-1 rounded bg-primary-container text-on-primary text-label-sm font-bold flex items-center gap-1 machined-border"
            >
              <span className="material-symbols-outlined text-sm">shuffle</span>
              Random
            </button>
            <button
              onClick={() => toggleFavoriteVerse(spotlightVerse.id)}
              className="px-2.5 py-1 rounded bg-surface-container-high text-primary text-label-sm flex items-center gap-1 machined-border"
            >
              <span
                className="material-symbols-outlined text-sm"
                style={
                  state.favoriteVerseIds.includes(spotlightVerse.id)
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                bookmark
              </span>
              Save
            </button>
          </div>
        </div>
      </section>

      {/* Translation & Testament Filters */}
      <section className="rounded-xl bg-surface-container-low p-space-md machined-border space-y-2.5">
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              { id: 'both', label: 'EN + SL' },
              { id: 'en_kjv', label: 'KJV (EN)' },
              { id: 'sl', label: 'Chraska (SL)' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              onClick={() => updateSettings({ bibleTranslationPreference: opt.id })}
              className={`py-1.5 rounded text-label-sm font-label-sm machined-border ${
                translationPref === opt.id
                  ? 'bg-primary-container text-on-primary font-bold'
                  : 'bg-surface-container text-tertiary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {(['ALL', 'OT', 'NT'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTestamentFilter(tf)}
              className={`py-1.5 rounded text-label-sm font-label-sm machined-border ${
                testamentFilter === tf
                  ? 'bg-surface-container-highest text-primary border border-primary-container'
                  : 'bg-surface-container text-tertiary'
              }`}
            >
              {tf === 'ALL' ? 'All' : tf}
            </button>
          ))}
          <button
            onClick={() => setOnlySaved(!onlySaved)}
            className={`py-1.5 rounded text-label-sm font-label-sm machined-border ${
              onlySaved
                ? 'bg-primary-container text-on-primary font-bold'
                : 'bg-surface-container text-secondary'
            }`}
          >
            ★ Saved ({state.favoriteVerseIds.length})
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {BIBLE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-full text-label-sm font-label-sm machined-border ${
                categoryFilter === cat.id
                  ? 'bg-primary-container text-on-primary font-bold'
                  : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Scripture List */}
      <section className="space-y-2.5">
        {filteredVerses.map((v) => {
          const isSaved = state.favoriteVerseIds.includes(v.id);
          return (
            <div
              key={v.id}
              className="rounded-xl bg-surface-container p-space-md machined-border space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-label-sm font-label-sm text-primary uppercase">
                  {v.testament} • {v.category}
                </span>
                <button
                  onClick={() => toggleFavoriteVerse(v.id)}
                  className="text-tertiary hover:text-primary"
                >
                  <span
                    className="material-symbols-outlined text-base text-primary"
                    style={
                      isSaved ? { fontVariationSettings: "'FILL' 1" } : undefined
                    }
                  >
                    bookmark
                  </span>
                </button>
              </div>
              {(translationPref === 'en_kjv' || translationPref === 'both') && (
                <p className="text-body-md font-body-md text-white">
                  &ldquo;{v.textEn}&rdquo;
                </p>
              )}
              {(translationPref === 'sl' || translationPref === 'both') && (
                <p className="text-body-sm font-body-sm text-on-surface-variant italic">
                  &ldquo;{v.textSl}&rdquo;
                </p>
              )}
              <div className="pt-1 border-t border-surface-variant flex justify-between text-label-sm font-label-sm text-primary font-bold">
                <span>{v.referenceEn}</span>
                <span className="text-tertiary">{v.referenceSl}</span>
              </div>
            </div>
          );
        })}
      </section>
    </PerformanceHQShell>
  );
}
