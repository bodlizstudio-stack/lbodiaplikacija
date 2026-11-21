import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useApp } from '../store/AppContext';
import { parseDateStringUTCNoon } from '../utils/dateUtils';
import { ThemeMode } from '../types';

export const CrossIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 18,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 2v20" />
    <path d="M6.5 8h11" />
  </svg>
);

export const SacredDivider: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex items-center gap-3 my-3" aria-hidden={!label}>
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-gold)] to-transparent" />
    <div className="flex items-center gap-1.5 text-[var(--accent-gold)] opacity-85">
      <CrossIcon size={12} />
      {label ? (
        <span className="text-[10px] font-medium tracking-[0.14em] uppercase">
          {label}
        </span>
      ) : null}
    </div>
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-gold)] to-transparent" />
  </div>
);

const TAILWIND_CONFIG_OBJECT = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary-fixed': '#E9D9B8',
        'on-secondary-fixed': '#1A2416',
        'primary-fixed-dim': '#C7A76C',
        'inverse-primary': '#8B6D38',
        'on-primary-fixed-variant': '#523F1A',
        'on-tertiary': '#2E3035',
        'on-secondary': '#FFFFFF',
        'on-surface-variant': 'var(--text-muted)',
        primary: 'var(--accent-gold)',
        tertiary: 'var(--text-muted)',
        'surface-variant': 'var(--border-subtle)',
        'surface-container-lowest': 'var(--bg-lowest)',
        'secondary-fixed-dim': '#7F8D71',
        'on-secondary-container': '#F4F0E8',
        'tertiary-fixed': '#e2e2e9',
        secondary: 'var(--accent-olive)',
        background: 'var(--bg-canvas)',
        'on-primary-fixed': '#1D1405',
        'surface-tint': 'var(--accent-gold)',
        'surface-dim': 'var(--bg-canvas)',
        'secondary-container': 'var(--accent-olive)',
        'on-primary': '#0B1220',
        'on-tertiary-container': '#303237',
        'on-error': '#FFFFFF',
        'inverse-on-surface': '#131D2C',
        'on-tertiary-fixed-variant': '#45474c',
        'primary-container': 'var(--accent-gold)',
        'surface-container-high': 'var(--bg-elevated)',
        'surface-container-highest': 'var(--bg-elevated)',
        'outline-variant': 'var(--border-subtle)',
        'on-tertiary-fixed': '#191c20',
        'tertiary-fixed-dim': '#c5c6cd',
        surface: 'var(--bg-surface)',
        'on-surface': 'var(--text-main)',
        'secondary-fixed': '#DFE4DA',
        'on-background': 'var(--text-main)',
        'on-secondary-fixed-variant': '#3D4833',
        'on-error-container': '#FFDAD6',
        'tertiary-container': '#7A8596',
        error: '#F87171',
        outline: 'var(--border-gold)',
        'inverse-surface': 'var(--text-main)',
        'surface-container': 'var(--bg-surface)',
        'surface-bright': 'var(--bg-elevated)',
        'error-container': '#7F1D1D',
        'surface-container-low': 'var(--bg-surface-soft)',
        'on-primary-container': '#0B1220',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
      spacing: {
        'space-xs': '0.35rem',
        'space-lg': '1.5rem',
        'space-xl': '2.5rem',
        'margin-tablet': '2rem',
        'gutter-desktop': '1.75rem',
        gutter: '1.25rem',
        'space-md': '1rem',
        margin: '1rem',
        'margin-desktop': '3rem',
        'space-sm': '0.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        mono: ['Inter', 'ui-monospace', 'monospace'],
        'headline-lg': ['Cormorant Garamond', 'Georgia', 'serif'],
        'headline-sm': ['Inter', 'sans-serif'],
        'metric-xl': ['Inter', 'sans-serif'],
        'headline-lg-mobile': ['Cormorant Garamond', 'Georgia', 'serif'],
        'body-sm': ['Inter', 'sans-serif'],
        'display-hero-mobile': ['Cormorant Garamond', 'Georgia', 'serif'],
        'label-sm': ['Inter', 'sans-serif'],
        'metric-xl-mobile': ['Inter', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'label-lg': ['Inter', 'sans-serif'],
        'headline-md': ['Cormorant Garamond', 'Georgia', 'serif'],
        'display-hero': ['Cormorant Garamond', 'Georgia', 'serif'],
        'label-md': ['Inter', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
      },
      fontSize: {
        'headline-lg': ['32px', { lineHeight: '38px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'headline-sm': ['17px', { lineHeight: '23px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'metric-xl': ['44px', { lineHeight: '48px', letterSpacing: '-0.03em', fontWeight: '700' }],
        'headline-lg-mobile': ['26px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-sm': ['13px', { lineHeight: '19px', fontWeight: '400' }],
        'display-hero-mobile': ['32px', { lineHeight: '38px', fontWeight: '600' }],
        'label-sm': ['11px', { lineHeight: '15px', letterSpacing: '0.06em', fontWeight: '600' }],
        'metric-xl-mobile': ['30px', { lineHeight: '36px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-lg': ['16px', { lineHeight: '25px', fontWeight: '400' }],
        'label-lg': ['14px', { lineHeight: '18px', letterSpacing: '0.02em', fontWeight: '600' }],
        'headline-md': ['22px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-hero': ['46px', { lineHeight: '52px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.04em', fontWeight: '600' }],
        'body-md': ['14px', { lineHeight: '22px', fontWeight: '400' }],
      },
    },
  },
};

export function useResolvedTheme(themeMode: ThemeMode = 'dark'): 'dark' | 'light' {
  const [systemDark, setSystemDark] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mq.matches);
    const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener?.('change', listener);
    return () => mq.removeEventListener?.('change', listener);
  }, []);

  if (themeMode === 'system') return systemDark ? 'dark' : 'light';
  return themeMode;
}

export function useEnsureLBODITheme(resolvedTheme: 'dark' | 'light') {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    document.body.classList.toggle('lbodi-light', resolvedTheme === 'light');
    document.body.classList.toggle('lbodi-dark', resolvedTheme === 'dark');
    document.title = 'LBODI — Vera, Disciplina, Rast';

    if (!document.getElementById('lbodi-manifest-link')) {
      const manifestLink = document.createElement('link');
      manifestLink.id = 'lbodi-manifest-link';
      manifestLink.rel = 'manifest';
      manifestLink.href = '/manifest.json';
      document.head.appendChild(manifestLink);
    }

    if (
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      !(window as any).__lbodiSwRegistered
    ) {
      (window as any).__lbodiSwRegistered = true;
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    if (!document.getElementById('lbodi-google-fonts')) {
      const link1 = document.createElement('link');
      link1.id = 'lbodi-google-fonts';
      link1.rel = 'stylesheet';
      link1.href =
        'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@300;400;500;600;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
      document.head.appendChild(link1);
    }

    const styleId = 'lbodi-design-system-css';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        :root, body.lbodi-dark {
          --bg-canvas: #0B1220;
          --bg-surface: #131D2C;
          --bg-surface-soft: #101927;
          --bg-elevated: #1B293A;
          --bg-lowest: #080E19;
          --text-main: #F4F0E8;
          --text-muted: #A7B0BD;
          --accent-gold: #C7A76C;
          --accent-olive: #7F8D71;
          --border-subtle: rgba(244, 240, 232, 0.09);
          --border-gold: rgba(199, 167, 108, 0.34);
          --card-shadow: 0 10px 30px -12px rgba(2, 6, 14, 0.72);
          --header-bg: rgba(11, 18, 32, 0.90);
          --sunlight-grad: radial-gradient(circle at 85% -10%, rgba(199, 167, 108, 0.14), transparent 55%);
        }
        body.lbodi-light {
          --bg-canvas: #F7F4ED;
          --bg-surface: #FFFFFF;
          --bg-surface-soft: #FAF7F1;
          --bg-elevated: #F0EBE0;
          --bg-lowest: #EDE7DB;
          --text-main: #172033;
          --text-muted: #526071;
          --accent-gold: #9E7B3A;
          --accent-olive: #566848;
          --border-subtle: rgba(23, 32, 51, 0.11);
          --border-gold: rgba(158, 123, 58, 0.35);
          --card-shadow: 0 8px 24px -10px rgba(23, 32, 51, 0.10);
          --header-bg: rgba(247, 244, 237, 0.92);
          --sunlight-grad: radial-gradient(circle at 85% -10%, rgba(158, 123, 58, 0.10), transparent 55%);
        }
        body.lbodi-light .text-white {
          color: #172033 !important;
        }
        body.lbodi-light button.bg-gradient-to-r,
        body.lbodi-light button.bg-primary-container,
        body.lbodi-light .bg-red-600 {
          color: #FFFFFF !important;
        }
        body.lbodi-light .bg-gradient-to-r.text-on-primary {
          color: #FFFFFF !important;
        }
        body.lbodi-light .text-on-primary {
          color: #FFFFFF !important;
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          display: inline-block;
          vertical-align: middle;
          line-height: 1;
          user-select: none;
        }
        .font-sacred {
          font-family: 'Cormorant Garamond', Georgia, serif;
        }
        .carbon-mesh {
          background-color: var(--bg-canvas);
          background-image: var(--sunlight-grad);
        }
        .machined-border {
          border: 1px solid var(--border-subtle);
          box-shadow: var(--card-shadow);
        }
        .hud-reticle {
          position: relative;
        }
        .thermal-glow {
          box-shadow: 0 12px 32px -12px rgba(199, 167, 108, 0.18), var(--card-shadow);
        }
        .thermal-glow-sm {
          box-shadow: 0 4px 14px -4px rgba(199, 167, 108, 0.25);
        }
        .thermal-top-edge {
          border-top: 2px solid var(--accent-gold);
        }
        .lbodi-card {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 1rem;
          box-shadow: var(--card-shadow);
        }
        .lbodi-gold-btn {
          background: linear-gradient(135deg, #C7A76C 0%, #9E7B3A 100%);
          color: #0B1220 !important;
          font-weight: 600;
        }
        body.lbodi-light .lbodi-gold-btn {
          color: #FFFFFF !important;
        }
        @keyframes lbodiSmoothFade {
          0% {
            opacity: 0;
            transform: translateY(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .hq-page-fade {
          animation: lbodiSmoothFade 0.24s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .hq-page-fade {
            animation: none !important;
          }
          * {
            transition-duration: 0.01ms !important;
          }
        }
        html, body, #root {
          background-color: var(--bg-canvas) !important;
          color: var(--text-main) !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
          height: auto !important;
          min-height: 100vh !important;
          font-family: 'Inter', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
      `;
      document.head.appendChild(style);
    }

    const applyTailwindConfig = () => {
      if ((window as any).tailwind) {
        (window as any).tailwind.config = TAILWIND_CONFIG_OBJECT;
      }
    };

    if (!document.getElementById('lbodi-tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'lbodi-tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com?plugins=forms,container-queries';
      script.onload = applyTailwindConfig;
      document.head.appendChild(script);
    } else {
      applyTailwindConfig();
    }
  }, [resolvedTheme]);
}

export function formatReadableHeaderDate(dateStr: string, lang: 'sl' | 'en'): string {
  try {
    const d = parseDateStringUTCNoon(dateStr);
    return new Intl.DateTimeFormat(lang === 'sl' ? 'sl-SI' : 'en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export interface LBODIShellProps {
  children: React.ReactNode;
  subtitle?: string;
  showBackButton?: boolean;
  hideBottomNav?: boolean;
}

export const LBODIShell: React.FC<LBODIShellProps> = ({
  children,
  subtitle,
  showBackButton = false,
  hideBottomNav = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { state, todayDateStr, updateSettings } = useApp();

  const resolvedTheme = useResolvedTheme(state.settings.themeMode || 'dark');
  useEnsureLBODITheme(resolvedTheme);

  const lang = state.settings.language;
  const unreadNotifs = (state.inAppNotifications || []).filter((n) => !n.read).length;

  const navItems = [
    {
      id: 'home',
      label: lang === 'sl' ? 'Domov' : 'Home',
      icon: 'home',
      route: '/(tabs)',
      isActive: pathname === '/' || pathname === '/(tabs)' || pathname === '/index',
    },
    {
      id: 'habits',
      label: lang === 'sl' ? 'Navade' : 'Habits',
      icon: 'check_circle',
      route: '/(tabs)/habits',
      isActive: pathname.includes('/habits') || pathname.includes('/calendar'),
    },
    {
      id: 'faith',
      label: lang === 'sl' ? 'Vera' : 'Faith',
      icon: 'menu_book',
      route: '/(tabs)/faith',
      isActive:
        pathname.includes('/faith') ||
        pathname.includes('/modals/bible') ||
        pathname.includes('/modals/gratitude'),
    },
    {
      id: 'progress',
      label: lang === 'sl' ? 'Napredek' : 'Progress',
      icon: 'monitoring',
      route: '/(tabs)/progress',
      isActive: pathname.includes('/progress'),
    },
    {
      id: 'more',
      label: lang === 'sl' ? 'Več' : 'More',
      icon: 'grid_view',
      route: '/(tabs)/more',
      isActive:
        pathname.includes('/more') ||
        (pathname.includes('/modals') &&
          !pathname.includes('/modals/bible') &&
          !pathname.includes('/modals/gratitude')),
    },
  ];

  const desktopQuickLinks = [
    { label: lang === 'sl' ? 'Hvaležnost Gospodu' : 'Gratitude Journal', icon: 'volunteer_activism', route: '/modals/gratitude' },
    { label: lang === 'sl' ? 'Moje prihodnje življenje' : 'Lifestyle Vision', icon: 'visibility', route: '/modals/vision' },
    { label: lang === 'sl' ? 'Disciplina in čistost' : 'Purity & Discipline', icon: 'shield', route: '/modals/nofap' },
    { label: lang === 'sl' ? 'Prehrana & Cal AI' : 'Nutrition & Cal AI', icon: 'restaurant', route: '/modals/nutrition' },
    { label: lang === 'sl' ? 'Trening in počutje' : 'Fitness & Wellness', icon: 'fitness_center', route: '/modals/fitness' },
    { label: 'LBODI AI', icon: 'auto_awesome', route: '/modals/ai-assistant' },
  ];

  const isOnAIScreen = pathname.includes('/ai-assistant');
  const formattedDate = subtitle || formatReadableHeaderDate(todayDateStr, lang);

  return (
    <div className="min-h-screen w-full carbon-mesh text-[var(--text-main)] flex flex-col md:flex-row overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] px-4 py-5 justify-between z-40">
        <div className="space-y-6">
          {/* Brand Header */}
          <div
            onClick={() => router.replace('/(tabs)' as any)}
            className="flex items-center gap-3 cursor-pointer px-1"
          >
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-[var(--border-gold)] bg-[var(--bg-lowest)] p-0.5 flex-shrink-0">
              <img src="/logo.jpg" alt="LBODI" className="w-full h-full object-cover rounded-lg" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-sacred text-2xl font-semibold tracking-wide text-[var(--text-main)]">
                  LBODI
                </span>
                <CrossIcon size={14} className="text-[var(--accent-gold)]" />
              </div>
              <p className="text-[10px] tracking-widest uppercase text-[var(--accent-gold)] font-medium">
                {lang === 'sl' ? 'Vera • Disciplina • Rast' : 'Faith • Discipline • Growth'}
              </p>
            </div>
          </div>

          {/* Primary Nav */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => router.replace(item.route as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  item.isActive
                    ? 'bg-[var(--bg-elevated)] text-[var(--accent-gold)] border border-[var(--border-gold)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]/50'
                }`}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={item.isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Direct Feature Links */}
          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1">
            <span className="px-3 text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold block mb-1.5">
              {lang === 'sl' ? 'Osebna rast' : 'Growth Modules'}
            </span>
            {desktopQuickLinks.map((q) => (
              <button
                key={q.route}
                onClick={() => router.push(q.route as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  pathname.includes(q.route)
                    ? 'bg-[var(--bg-elevated)] text-[var(--accent-gold)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]/40'
                }`}
              >
                <span className="material-symbols-outlined text-base text-[var(--accent-gold)]">
                  {q.icon}
                </span>
                <span className="truncate">{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Verse Reminder */}
        <div className="p-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] space-y-1.5">
          <p className="font-sacred italic text-sm text-[var(--text-main)] leading-snug">
            &ldquo;{lang === 'sl' ? 'Postani to, za kar te je Bog ustvaril.' : 'Become who God created you to be.'}&rdquo;
          </p>
          <span className="text-[10px] text-[var(--accent-gold)] uppercase tracking-wider block">
            Jezus Kristus v središču
          </span>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 md:pl-64 flex justify-center w-full">
        <div className="w-full max-w-md md:max-w-3xl min-h-screen flex flex-col relative pb-28 md:pb-12">
          {/* Top App Bar */}
          <header
            className="sticky top-0 z-30 px-3 sm:px-5 pt-2.5 pb-2 backdrop-blur-md border-b border-[var(--border-subtle)]"
            style={{ backgroundColor: 'var(--header-bg)' }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {showBackButton ? (
                  <button
                    onClick={() => {
                      if (pathname.includes('/modals/')) {
                        router.replace('/(tabs)/more' as any);
                      } else {
                        router.back();
                      }
                    }}
                    className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-main)] hover:border-[var(--border-gold)] active:scale-95 transition-all flex-shrink-0"
                    aria-label={lang === 'sl' ? 'Nazaj' : 'Back'}
                  >
                    <span className="material-symbols-outlined text-lg text-[var(--accent-gold)]">
                      arrow_back
                    </span>
                  </button>
                ) : (
                  <div
                    onClick={() => router.replace('/(tabs)' as any)}
                    className="w-10 h-10 rounded-xl overflow-hidden border border-[var(--border-gold)] bg-[var(--bg-lowest)] p-0.5 cursor-pointer flex-shrink-0 md:hidden"
                  >
                    <img
                      src="/logo.jpg"
                      alt="LBODI"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-sacred text-xl font-semibold text-[var(--text-main)] tracking-tight leading-none">
                      LBODI
                    </span>
                    <CrossIcon size={13} className="text-[var(--accent-gold)] flex-shrink-0" />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] capitalize truncate mt-0.5">
                    {formattedDate}
                  </p>
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => router.push('/modals/search' as any)}
                  className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors"
                  aria-label={lang === 'sl' ? 'Iskanje' : 'Search'}
                  title={lang === 'sl' ? 'Išči zapiske' : 'Search'}
                >
                  <span className="material-symbols-outlined text-lg">search</span>
                </button>

                <button
                  onClick={() => router.push('/modals/notifications' as any)}
                  className="relative w-9 h-9 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors"
                  aria-label={lang === 'sl' ? 'Obvestila' : 'Notifications'}
                  title={lang === 'sl' ? 'Center za obvestila' : 'Notifications Center'}
                >
                  <span className="material-symbols-outlined text-lg">notifications</span>
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--accent-gold)] text-[#0B1220] text-[10px] font-bold flex items-center justify-center">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                <button
                  onClick={() =>
                    updateSettings({
                      themeMode: resolvedTheme === 'dark' ? 'light' : 'dark',
                    })
                  }
                  className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors"
                  aria-label="Theme"
                  title={resolvedTheme === 'dark' ? 'Svetli način / Light Mode' : 'Temni način / Dark Mode'}
                >
                  <span className="material-symbols-outlined text-lg">
                    {resolvedTheme === 'dark' ? 'light_mode' : 'dark_mode'}
                  </span>
                </button>

                <button
                  onClick={() => router.push('/modals/settings' as any)}
                  className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors"
                  aria-label={lang === 'sl' ? 'Nastavitve' : 'Settings'}
                  title={lang === 'sl' ? 'Nastavitve' : 'Settings'}
                >
                  <span className="material-symbols-outlined text-lg">tune</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Stream */}
          <main key={pathname} className="px-3.5 sm:px-5 pt-4 space-y-4 flex-1 hq-page-fade">
            {children}
          </main>

          {/* Floating LBODI AI Companion Button */}
          {!isOnAIScreen && (
            <button
              onClick={() => router.push('/modals/ai-assistant' as any)}
              className="fixed bottom-20 md:bottom-6 right-4 md:right-7 z-40 px-3.5 py-2.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-gold)] shadow-xl flex items-center gap-2 text-xs font-semibold text-[var(--text-main)] hover:scale-[1.03] active:scale-95 transition-all"
              style={{ boxShadow: '0 8px 26px rgba(0, 0, 0, 0.35)' }}
              aria-label="Odpri LBODI AI"
            >
              <span
                className="material-symbols-outlined text-base text-[var(--accent-gold)]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              <span>LBODI AI</span>
            </button>
          )}

          {/* Mobile 5-Tab Bottom Navigation Bar */}
          {!hideBottomNav && (
            <nav
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t border-[var(--border-subtle)] px-2 pt-1.5 pb-2.5 flex justify-around items-center max-w-md mx-auto"
              style={{ backgroundColor: 'var(--header-bg)' }}
            >
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!item.isActive || pathname !== item.route) {
                      router.replace(item.route as any);
                    }
                  }}
                  aria-current={item.isActive ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center min-w-[58px] py-1.5 px-2 rounded-xl transition-all ${
                    item.isActive
                      ? 'text-[var(--accent-gold)] bg-[var(--bg-elevated)] border border-[var(--border-gold)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={
                      item.isActive
                        ? { fontVariationSettings: "'FILL' 1" }
                        : undefined
                    }
                  >
                    {item.icon}
                  </span>
                  <span className="text-[11px] font-medium mt-0.5 leading-none">
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
};
