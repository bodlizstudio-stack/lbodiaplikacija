import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/store/AppContext';
import { LBODIShell } from '../../src/components/LBODIShell';
import { AUTHENTIC_BIBLE_VERSES } from '../../src/data/seedData';

export default function UnifiedSearchScreen() {
  const router = useRouter();
  const { state } = useApp();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const hits: { type: string; title: string; snippet: string; route: string }[] = [];

    (state.gratitudeEntries || []).forEach((g) => {
      if (g.mainText.toLowerCase().includes(q) || (g.dailyPrayer || '').toLowerCase().includes(q)) {
        hits.push({ type: 'Hvaležnost', title: g.date, snippet: g.mainText, route: '/modals/gratitude' });
      }
    });

    (state.prayerEntries || []).forEach((p) => {
      if (p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q)) {
        hits.push({ type: 'Molitev', title: p.title, snippet: p.text, route: '/(tabs)/faith?tab=prayer' });
      }
    });

    Object.values(state.dailyJournals).forEach((j) => {
      if (
        j.wentWell.toLowerCase().includes(q) ||
        j.feelings.toLowerCase().includes(q) ||
        j.gratitude.toLowerCase().includes(q)
      ) {
        hits.push({ type: 'Dnevnik', title: j.date, snippet: j.wentWell || j.feelings, route: '/modals/journal' });
      }
    });

    state.goals.forEach((g) => {
      if (g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)) {
        hits.push({ type: 'Cilj', title: g.title, snippet: g.description, route: '/modals/goals' });
      }
    });

    AUTHENTIC_BIBLE_VERSES.forEach((v) => {
      if (
        v.textSl.toLowerCase().includes(q) ||
        v.textEn.toLowerCase().includes(q) ||
        v.referenceSl.toLowerCase().includes(q)
      ) {
        hits.push({ type: 'Sveto pismo', title: v.referenceSl, snippet: v.textSl, route: '/modals/bible' });
      }
    });

    return hits.slice(0, 30);
  }, [query, state]);

  return (
    <LBODIShell showBackButton subtitle="Iskanje po vseh osebnih zapisih">
      <section className="lbodi-card p-4 space-y-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Išči hvaležnost, molitve, dnevnik, cilje ali Sveto pismo..."
          className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-3 text-xs text-[var(--text-main)]"
          autoFocus
        />
        {query.trim() && (
          <p className="text-[11px] text-[var(--text-muted)]">
            Zadetki: {results.length}
          </p>
        )}
      </section>

      <section className="space-y-2">
        {results.map((r, i) => (
          <div
            key={i}
            onClick={() => router.push(r.route as any)}
            className="lbodi-card p-3.5 cursor-pointer hover:border-[var(--border-gold)] text-xs space-y-1"
          >
            <span className="text-[10px] font-semibold uppercase text-[var(--accent-gold)]">
              {r.type} • {r.title}
            </span>
            <p className="text-[var(--text-main)] line-clamp-2">{r.snippet}</p>
          </div>
        ))}
      </section>
    </LBODIShell>
  );
}
