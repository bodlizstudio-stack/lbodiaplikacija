import React from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/store/AppContext';
import { LBODIShell, CrossIcon } from '../../src/components/LBODIShell';

export default function MoreHubScreen() {
  const router = useRouter();
  const { state } = useApp();
  const lang = state.settings.language;

  const sections = [
    {
      heading: lang === 'sl' ? 'Vera, hvaležnost in vizija' : 'Faith, Gratitude & Vision',
      items: [
        {
          route: '/modals/gratitude',
          icon: 'volunteer_activism',
          title: lang === 'sl' ? 'Hvaležnost Gospodu' : 'Gratitude to God',
          subtitle: lang === 'sl' ? 'Vsak dan prepoznaj blagoslove, ki ti jih daje Bog.' : 'Daily Christian gratitude & prayers.',
          featured: true,
        },
        {
          route: '/modals/vision',
          icon: 'visibility',
          title: lang === 'sl' ? 'Moje prihodnje življenje (14-dnevna vizija)' : 'My God-Centered Vision',
          subtitle: lang === 'sl' ? 'Tvoja krščanska življenjska vizija, idealen dan in 14-dnevni pregled.' : 'Vision pillars, ideal day & version history.',
          featured: true,
        },
        {
          route: '/modals/ai-assistant',
          icon: 'auto_awesome',
          title: 'LBODI AI',
          subtitle: lang === 'sl' ? 'Vera • Disciplina • Rast — kontekstni AI spremljevalec.' : 'Private context-aware Christian companion.',
          featured: true,
        },
        {
          route: '/modals/bible',
          icon: 'book_5',
          title: lang === 'sl' ? 'Sveto pismo (SZ in NZ)' : 'Bible Scripture (OT & NT)',
          subtitle: lang === 'sl' ? 'Tematski verzi, Chraska & KJV.' : 'Curated verified verses by topic.',
        },
      ],
    },
    {
      heading: lang === 'sl' ? 'Disciplina, zdravje in prehrana' : 'Discipline, Health & Nutrition',
      items: [
        {
          route: '/modals/nofap',
          icon: 'shield',
          title: lang === 'sl' ? 'Disciplina in čistost' : 'Purity & Self-Control',
          subtitle: lang === 'sl' ? 'Zasebni niz, mejniki, koledar in podpora "Potrebujem moč".' : 'Streak, calendar, and calming support.',
        },
        {
          route: '/modals/nutrition',
          icon: 'restaurant',
          title: lang === 'sl' ? 'Prehrana in uvoz Cal AI' : 'Nutrition & Cal AI',
          subtitle: lang === 'sl' ? 'Ročni vnos in CSV/JSON/PDF uvoz iz Cal AI.' : 'Manual logs & verified file import.',
        },
        {
          route: '/modals/fitness',
          icon: 'fitness_center',
          title: lang === 'sl' ? 'Vadbe in dnevni check-in (30s)' : 'Fitness & Daily Check-In',
          subtitle: lang === 'sl' ? 'Spanec, energija, razpoloženje in dnevnik treningov.' : 'Sleep, mood & workout logs.',
        },
        {
          route: '/modals/past-self',
          icon: 'videocam',
          title: lang === 'sl' ? 'Poglej, kakšen si bil včasih' : 'Past Self Archive',
          subtitle: lang === 'sl' ? 'Posnetki in slike iz preteklosti — spomni se prehojene poti.' : 'Videos & photos reminding you how far you came.',
        },
      ],
    },
    {
      heading: lang === 'sl' ? 'Cilji, refleksija in sistem' : 'Goals, Reflection & System',
      items: [
        {
          route: '/modals/goals',
          icon: 'flag',
          title: lang === 'sl' ? 'Osebni cilji' : 'Personal Goals',
          subtitle: lang === 'sl' ? 'Vera, zdravje, disciplina, delo, odnosi in mejniki.' : 'Structured life goals linked to habits.',
        },
        {
          route: '/modals/journal',
          icon: 'edit_note',
          title: lang === 'sl' ? 'Osebni in duhovni dnevnik' : 'Personal Journal',
          subtitle: lang === 'sl' ? 'Refleksija, hvaležnost, molitev in lekcije.' : 'Searchable private reflection entries.',
        },
        {
          route: '/(tabs)/calendar',
          icon: 'calendar_today',
          title: lang === 'sl' ? 'Koledar zgodovine navad' : 'Habit Calendar',
          subtitle: lang === 'sl' ? '7/30/90/365-dnevni pregled in popravki.' : 'Monthly discipline history.',
        },
        {
          route: '/modals/weekly-review',
          icon: 'fact_check',
          title: lang === 'sl' ? 'Tedenski pregled' : 'Weekly Review',
          subtitle: lang === 'sl' ? 'Nedeljska refleksija, dosežki in naslednji koraki.' : 'Weekly telemetry & accountability.',
        },
        {
          route: '/modals/yearly-review',
          icon: 'auto_stories',
          title: lang === 'sl' ? 'Letni pregled' : 'Yearly Reflection',
          subtitle: lang === 'sl' ? 'Resnični povzetek leta in izvoz.' : 'Real yearly summary & export.',
        },
        {
          route: '/modals/why-i-started',
          icon: 'bolt',
          title: lang === 'sl' ? 'Zakaj sem začel (My Why)' : 'Why I Started',
          subtitle: lang === 'sl' ? 'Trajni opomnik tvojega najglobljega namena.' : 'Your core personal statement.',
        },
        {
          route: '/modals/focus',
          icon: 'timer',
          title: lang === 'sl' ? 'Fokus časovnik' : 'Focus Timer',
          subtitle: '25 / 50 min zbrano delo brez motenj.',
        },
        {
          route: '/modals/notifications',
          icon: 'notifications',
          title: lang === 'sl' ? 'Obvestila in opomniki' : 'Notifications & Reminders',
          subtitle: lang === 'sl' ? 'Urnik, 14-dnevni opomnik in knjižnica spodbud.' : 'Configure reminder schedules.',
        },
        {
          route: '/modals/settings',
          icon: 'tune',
          title: lang === 'sl' ? 'Nastavitve, tema, zasebnost & varnostna kopija' : 'Settings & Privacy',
          subtitle: lang === 'sl' ? 'Temni/svetli način, jezik, AI zasebnost, PIN in JSON.' : 'Theme, timezone, privacy & export.',
        },
      ],
    },
  ];

  return (
    <LBODIShell>
      <section className="lbodi-card thermal-top-edge p-4 sm:p-5 space-y-1.5">
        <div className="flex items-center gap-2 text-[var(--accent-gold)]">
          <CrossIcon size={14} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
            LBODI 2.0
          </span>
        </div>
        <h1 className="font-sacred text-3xl font-semibold text-[var(--text-main)]">
          {lang === 'sl' ? 'Vsa orodja in moduli' : 'All Modules & Tools'}
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          {lang === 'sl'
            ? 'Postani to, za kar te je Bog ustvaril.'
            : 'Become who God created you to be.'}
        </p>
      </section>

      {sections.map((sec) => (
        <section key={sec.heading} className="space-y-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-gold)] px-1">
            {sec.heading}
          </h2>
          <div className="space-y-2">
            {sec.items.map((item) => (
              <div
                key={item.route}
                onClick={() =>
                  item.route.startsWith('/(tabs)')
                    ? router.replace(item.route as any)
                    : router.push(item.route as any)
                }
                className={`lbodi-card p-3.5 cursor-pointer flex items-center justify-between gap-3 hover:border-[var(--border-gold)] transition-colors ${
                  item.featured ? 'border-l-2 border-l-[var(--accent-gold)]' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-gold)] flex-shrink-0">
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--text-main)] truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-lg text-[var(--accent-gold)] flex-shrink-0">
                  chevron_right
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </LBODIShell>
  );
}
