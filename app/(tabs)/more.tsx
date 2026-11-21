import React from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/store/AppContext';
import { PerformanceHQShell } from '../../src/components/PerformanceHQShell';

export default function MoreHubScreen() {
  const router = useRouter();
  const { state } = useApp();
  const lang = state.settings.language;

  const menuItems = [
    {
      route: '/modals/past-self',
      icon: 'videocam',
      tag: 'PREHOJENA POT • ARHIV PRETEKLOSTI',
      title:
        lang === 'sl'
          ? 'Poglej, kakšen si bil včasih'
          : 'Look At Who You Used To Be (Past Self)',
      subtitle:
        lang === 'sl'
          ? 'Tvoji posnetki in slike iz preteklosti — spomni se, kako dolgo pot imaš že za sabo.'
          : 'Your past videos & photos — remind yourself how far you have already come.',
      highlight: true,
    },
    {
      route: '/modals/why-i-started',
      icon: 'bolt',
      tag: 'CORE PURPOSE',
      title: lang === 'sl' ? 'Zakaj sem začel (My Why)' : 'Why I Started (My Why)',
      subtitle:
        'Mission, long-term vision, values, quotes & emergency motivation screen.',
      highlight: true,
    },
    {
      route: '/modals/nofap',
      icon: 'shield',
      tag: 'SOVEREIGNTY',
      title: 'No Fap Streak Tracker',
      subtitle:
        'Live days/hours/mins/secs counter, 9 milestones & attempt history.',
      highlight: false,
    },
    {
      route: '/modals/manifestation',
      icon: 'auto_awesome',
      tag: '3X DAILY PROTOCOL',
      title: 'Manifestation & Gratitude',
      subtitle:
        'Morning, Midday & Evening present-tense journal and personal affirmations.',
      highlight: false,
    },
    {
      route: '/modals/bible',
      icon: 'book_5',
      tag: 'SPIRITUAL STRENGTH',
      title: 'Bible Verses (OT & NT)',
      subtitle:
        'Authentic KJV & Slovenian scripture filtered by 9 discipline categories.',
      highlight: false,
    },
    {
      route: '/modals/weekly-review',
      icon: 'fact_check',
      tag: 'SUNDAY 20:00',
      title: 'Mandatory Weekly Review',
      subtitle:
        'Automatic weekly telemetry & ruthless 6-question accountability check.',
      highlight: false,
    },
    {
      route: '/modals/goals',
      icon: 'flag',
      tag: 'STRATEGIC TARGETS',
      title: 'Personal Goal Tracking',
      subtitle:
        'Short-term, monthly, yearly & life goals linked to your daily habits.',
      highlight: false,
    },
    {
      route: '/modals/journal',
      icon: 'edit_note',
      tag: 'REFLECTION LOG',
      title: 'Daily Personal Journal',
      subtitle:
        'Mood & energy ratings, daily wins, lessons & searchable archive.',
      highlight: false,
    },
    {
      route: '/modals/focus',
      icon: 'timer',
      tag: 'DEEP EXECUTION',
      title: 'Focus Mode Timer',
      subtitle:
        '25m / 50m / custom metallic countdown — "PUT THE PHONE DOWN. GET TO WORK."',
      highlight: false,
    },
    {
      route: '/modals/settings',
      icon: 'tune',
      tag: 'SYSTEM CONFIG',
      title: 'Settings, Privacy & Backup',
      subtitle:
        'Slovenian/English, Hardcore Mode, PIN/Biometric lock & full JSON export.',
      highlight: false,
    },
  ];

  return (
    <PerformanceHQShell>
      <section className="rounded-xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low p-space-md machined-border thermal-top-edge">
        <span className="text-label-sm font-label-sm text-primary uppercase tracking-widest">
          COMMAND MODULES • LUKA BODLAJ
        </span>
        <h2 className="text-headline-md font-headline-md text-white mt-0.5">
          Personal Operating System
        </h2>
        <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
          DISCIPLINE. PROGRESS. ACCOUNTABILITY. FAITH. GROWTH.
        </p>
      </section>

      <section className="space-y-2.5">
        {menuItems.map((item) => (
          <div
            key={item.route}
            onClick={() => router.push(item.route as any)}
            className={`rounded-xl p-space-md machined-border cursor-pointer transition-all hover:bg-surface-container-high flex items-center justify-between ${
              item.highlight
                ? 'bg-gradient-to-r from-surface-container-high to-surface-container thermal-glow border-l-2 border-l-primary-container'
                : 'bg-surface-container'
            }`}
          >
            <div className="flex items-start space-x-3.5 pr-2">
              <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary-container machined-border flex-shrink-0 mt-0.5">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {item.icon}
                </span>
              </div>
              <div>
                <span className="text-label-sm font-label-sm text-primary uppercase tracking-wider">
                  {item.tag}
                </span>
                <h3 className="text-headline-sm font-headline-sm text-white">
                  {item.title}
                </h3>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-0.5">
                  {item.subtitle}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-primary text-lg">
              chevron_right
            </span>
          </div>
        ))}
      </section>
    </PerformanceHQShell>
  );
}
