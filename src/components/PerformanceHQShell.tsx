import React, { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useApp } from '../store/AppContext';
import { parseDateStringUTCNoon } from '../utils/dateUtils';

const TAILWIND_CONFIG_OBJECT = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary-fixed': '#ffdbca',
        'on-secondary-fixed': '#2a1800',
        'primary-fixed-dim': '#ffb690',
        'inverse-primary': '#9d4300',
        'on-primary-fixed-variant': '#783200',
        'on-tertiary': '#2e3035',
        'on-secondary': '#462a00',
        'on-surface-variant': '#e0c0b1',
        primary: '#ffb690',
        tertiary: '#c5c6cd',
        'surface-variant': '#343537',
        'surface-container-lowest': '#08090b',
        'secondary-fixed-dim': '#ffb95a',
        'on-secondary-container': '#3d2400',
        'tertiary-fixed': '#e2e2e9',
        secondary: '#ffb95a',
        background: '#0a0b0e',
        'on-primary-fixed': '#341100',
        'surface-tint': '#ffb690',
        'surface-dim': '#0a0b0e',
        'secondary-container': '#c68315',
        'on-primary': '#552100',
        'on-tertiary-container': '#303237',
        'on-error': '#690005',
        'inverse-on-surface': '#303033',
        'on-tertiary-fixed-variant': '#45474c',
        'primary-container': '#f97316',
        'surface-container-high': '#1b1d22',
        'surface-container-highest': '#262930',
        'outline-variant': '#584237',
        'on-tertiary-fixed': '#191c20',
        'tertiary-fixed-dim': '#c5c6cd',
        surface: '#0e1014',
        'on-surface': '#e3e2e5',
        'secondary-fixed': '#ffddb6',
        'on-background': '#e3e2e5',
        'on-secondary-fixed-variant': '#643f00',
        'on-error-container': '#ffdad6',
        'tertiary-container': '#999aa0',
        error: '#ffb4ab',
        outline: '#a78b7d',
        'inverse-surface': '#e3e2e5',
        'surface-container': '#13151a',
        'surface-bright': '#2c2f36',
        'error-container': '#93000a',
        'surface-container-low': '#0f1115',
        'on-primary-container': '#582200',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      spacing: {
        'space-xs': '0.25rem',
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
        mono: ['JetBrains Mono', 'monospace'],
        'headline-lg': ['Space Grotesk', 'sans-serif'],
        'headline-sm': ['Space Grotesk', 'sans-serif'],
        'metric-xl': ['Space Grotesk', 'sans-serif'],
        'headline-lg-mobile': ['Space Grotesk', 'sans-serif'],
        'body-sm': ['Inter', 'sans-serif'],
        'display-hero-mobile': ['Space Grotesk', 'sans-serif'],
        'label-sm': ['JetBrains Mono', 'Space Grotesk', 'monospace'],
        'metric-xl-mobile': ['Space Grotesk', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'label-lg': ['Space Grotesk', 'sans-serif'],
        'headline-md': ['Space Grotesk', 'sans-serif'],
        'display-hero': ['Space Grotesk', 'sans-serif'],
        'label-md': ['JetBrains Mono', 'Space Grotesk', 'monospace'],
        'body-md': ['Inter', 'sans-serif'],
      },
      fontSize: {
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-sm': ['18px', { lineHeight: '24px', letterSpacing: '0em', fontWeight: '600' }],
        'metric-xl': ['48px', { lineHeight: '52px', letterSpacing: '-0.04em', fontWeight: '700' }],
        'headline-lg-mobile': ['26px', { lineHeight: '34px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'body-sm': ['12px', { lineHeight: '18px', letterSpacing: '0.02em', fontWeight: '400' }],
        'display-hero-mobile': ['36px', { lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'label-sm': ['10px', { lineHeight: '14px', letterSpacing: '0.1em', fontWeight: '600' }],
        'metric-xl-mobile': ['32px', { lineHeight: '38px', letterSpacing: '-0.03em', fontWeight: '700' }],
        'body-lg': ['16px', { lineHeight: '26px', letterSpacing: '0em', fontWeight: '400' }],
        'label-lg': ['14px', { lineHeight: '18px', letterSpacing: '0.05em', fontWeight: '600' }],
        'headline-md': ['22px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-hero': ['56px', { lineHeight: '64px', letterSpacing: '-0.03em', fontWeight: '700' }],
        'label-md': ['11px', { lineHeight: '16px', letterSpacing: '0.08em', fontWeight: '600' }],
        'body-md': ['14px', { lineHeight: '22px', letterSpacing: '0.01em', fontWeight: '400' }],
      },
    },
  },
};

export function useEnsurePerformanceHQTheme() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    document.documentElement.classList.add('dark');
    document.title = 'GET UP // DISCIPLINE_OS 2088 — LUKA BODLAJ';

    if (!document.getElementById('hq-google-fonts')) {
      const link1 = document.createElement('link');
      link1.id = 'hq-google-fonts';
      link1.rel = 'stylesheet';
      link1.href =
        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
      document.head.appendChild(link1);
    }

    const styleId = 'hq-custom-css-v2';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          display: inline-block;
          vertical-align: middle;
          line-height: 1;
          user-select: none;
        }
        .carbon-mesh {
          background-color: #07080A;
          background-image:
            linear-gradient(to right, rgba(249, 115, 22, 0.045) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(249, 115, 22, 0.045) 1px, transparent 1px),
            radial-gradient(rgba(249, 115, 22, 0.08) 1px, transparent 0);
          background-size: 32px 32px, 32px 32px, 16px 16px;
        }
        .machined-border {
          position: relative;
          border: 1px solid rgba(249, 115, 22, 0.16);
          box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.06), 0 6px 20px -4px rgba(0, 0, 0, 0.85);
        }
        .hud-reticle {
          position: relative;
        }
        .hud-reticle::before {
          content: '';
          position: absolute;
          top: -1px;
          left: -1px;
          width: 10px;
          height: 10px;
          border-top: 2px solid #F97316;
          border-left: 2px solid #F97316;
          border-top-left-radius: 6px;
          pointer-events: none;
        }
        .hud-reticle::after {
          content: '';
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 10px;
          height: 10px;
          border-bottom: 2px solid #F97316;
          border-right: 2px solid #F97316;
          border-bottom-right-radius: 6px;
          pointer-events: none;
        }
        .thermal-glow {
          box-shadow: 0 0 28px -6px rgba(249, 115, 22, 0.35), 0 8px 20px -2px rgba(0, 0, 0, 0.9);
        }
        .thermal-glow-sm {
          box-shadow: 0 0 14px -2px rgba(249, 115, 22, 0.45);
        }
        .thermal-top-edge {
          border-top: 2px solid #F97316;
        }
        .hud-scanline-btn {
          background-image: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.14) 0px,
            rgba(0, 0, 0, 0.14) 1px,
            transparent 1px,
            transparent 3px
          ), linear-gradient(90deg, #EA580C 0%, #F97316 50%, #D97706 100%);
        }
        @keyframes hqSmoothFade {
          0% {
            opacity: 0;
            transform: translateY(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .hq-page-fade {
          animation: hqSmoothFade 0.24s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        html, body, #root {
          background-color: #07080A !important;
          color: #e3e2e5 !important;
          overflow-y: auto !important;
          height: auto !important;
          min-height: 100vh !important;
          scroll-behavior: smooth;
        }
      `;
      document.head.appendChild(style);
    }

    const applyTailwindConfig = () => {
      if ((window as any).tailwind) {
        (window as any).tailwind.config = TAILWIND_CONFIG_OBJECT;
      }
    };

    if (!document.getElementById('hq-tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'hq-tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com?plugins=forms,container-queries';
      script.onload = applyTailwindConfig;
      document.head.appendChild(script);
    } else {
      applyTailwindConfig();
    }
  }, []);
}

export function formatReadableHeaderDate(dateStr: string, lang: 'sl' | 'en'): string {
  try {
    const d = parseDateStringUTCNoon(dateStr);
    return new Intl.DateTimeFormat(lang === 'sl' ? 'sl-SI' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

interface PerformanceHQShellProps {
  children: React.ReactNode;
  subtitle?: string;
  showBackButton?: boolean;
  hideBottomNav?: boolean;
}

export const PerformanceHQShell: React.FC<PerformanceHQShellProps> = ({
  children,
  subtitle,
  showBackButton = false,
  hideBottomNav = false,
}) => {
  useEnsurePerformanceHQTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { state, todayDateStr, updateSettings } = useApp();

  const lang = state.settings.language;

  const weekNumber = useMemo(() => {
    const d = parseDateStringUTCNoon(todayDateStr);
    const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const diff = d.getTime() - start.getTime();
    return Math.ceil((diff / 86400000 + start.getUTCDay() + 1) / 7);
  }, [todayDateStr]);

  const navItems = [
    {
      id: 'home',
      label: 'HUD',
      icon: 'home',
      route: '/(tabs)',
      isActive: pathname === '/' || pathname === '/(tabs)' || pathname === '/index',
    },
    {
      id: 'habits',
      label: lang === 'sl' ? 'Habits' : 'Habits',
      icon: 'check_circle',
      route: '/(tabs)/habits',
      isActive: pathname.includes('/habits'),
    },
    {
      id: 'calendar',
      label: 'Timeline',
      icon: 'calendar_today',
      route: '/(tabs)/calendar',
      isActive: pathname.includes('/calendar'),
    },
    {
      id: 'progress',
      label: 'Telemetry',
      icon: 'monitoring',
      route: '/(tabs)/progress',
      isActive: pathname.includes('/progress'),
    },
    {
      id: 'more',
      label: 'System',
      icon: 'more_horiz',
      route: '/(tabs)/more',
      isActive: pathname.includes('/more') || pathname.includes('/modals'),
    },
  ];

  return (
    <div className="bg-surface-container-lowest text-on-surface carbon-mesh min-h-screen w-full antialiased selection:bg-primary-container selection:text-on-primary-container flex justify-center overflow-y-auto">
      {/* Mobile Viewport Container capped at max-w-md */}
      <div className="w-full max-w-md min-h-screen flex flex-col relative pb-28">
        {/* Top Futuristic Telemetry Strip */}
        <div className="bg-[#060709] border-b border-primary-container/20 px-3 py-1.5 flex items-center justify-between text-[9px] font-mono tracking-wider uppercase text-tertiary">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="text-[8px] animate-pulse">◆</span>
            <span>SYS.ONLINE</span>
          </div>
          <div className="text-on-surface-variant/80">
            DISCIPLINE_OS <span className="text-primary-container">// 2088</span>
          </div>
          <div className="hidden xs:block text-on-surface-variant/80">
            LOC: <span className="text-primary">46.0569° N</span>
          </div>
          <div className="text-tertiary">
            PING: <span className="text-emerald-400">14MS</span>
          </div>
        </div>

        {/* Sticky Operator HUD Header */}
        <header className="sticky top-0 z-40 px-margin pt-2 pb-1 bg-[#07080A]/90 backdrop-blur-md">
          <div className="rounded-xl bg-surface-container/95 px-3 py-2.5 machined-border hud-reticle flex justify-between items-center">
            <div className="flex items-center space-x-3 min-w-0">
              {showBackButton ? (
                <button
                  onClick={() => {
                    if (pathname.includes('/modals/')) {
                      router.replace('/(tabs)/more' as any);
                    } else {
                      router.back();
                    }
                  }}
                  className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface hover:text-primary transition-all duration-200 active:scale-95 machined-border flex-shrink-0"
                  title="Back"
                >
                  <span className="material-symbols-outlined text-primary-container text-xl">
                    arrow_back
                  </span>
                </button>
              ) : null}

              {/* Prominent GET UP badge logo asset */}
              <div
                onClick={() => router.replace('/(tabs)' as any)}
                className="relative w-11 h-11 rounded-lg overflow-hidden p-0.5 thermal-glow-sm bg-surface-container-high border border-primary-container/50 flex-shrink-0 cursor-pointer transition-transform duration-200 hover:scale-105"
              >
                <img
                  alt="GET UP Brand Badge"
                  className="w-full h-full object-cover rounded-md"
                  src="/logo.jpg"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-primary-container/15 border border-primary-container/50 text-[9px] font-mono text-primary-container font-bold tracking-widest uppercase">
                    OPERATOR
                  </span>
                  <h1 className="text-headline-sm font-headline-sm text-white tracking-tight truncate">
                    Luka Bodlaj
                  </h1>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono tracking-wider uppercase">
                  <span className="text-tertiary truncate">
                    {subtitle ? subtitle : 'SEC:01 // PROTOCOL V4.2'}
                  </span>
                  <span className="text-primary-container font-semibold flex items-center gap-1 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
                    WK-{weekNumber} // ACTIVE
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
              <button
                onClick={() =>
                  updateSettings({ language: lang === 'sl' ? 'en' : 'sl' })
                }
                aria-label="Switch Language"
                className="h-9 px-2 rounded-lg bg-surface-container-lowest flex items-center justify-center text-[10px] font-mono font-bold text-primary hover:text-white transition-colors duration-200 active:scale-95 machined-border uppercase"
                title="Toggle Slovenian / English"
              >
                {lang.toUpperCase()}
              </button>

              <button
                onClick={() => router.push('/modals/settings' as any)}
                aria-label="System Configuration"
                className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface hover:text-primary transition-colors duration-200 active:scale-95 machined-border"
              >
                <span className="material-symbols-outlined text-primary-container text-lg">
                  radar
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Stream with smooth fade transition */}
        <main
          key={pathname}
          className="px-margin pt-2 space-y-space-md flex-1 hq-page-fade"
        >
          {children}
        </main>

        {/* Fixed Bottom Futuristic HUD Navigation Bar */}
        {!hideBottomNav && (
          <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-3 py-2 bg-[#08090C]/95 backdrop-blur-md shadow-2xl max-w-md left-1/2 -translate-x-1/2 border-t border-primary-container/25">
            {navItems.map((item) =>
              item.isActive ? (
                <button
                  key={item.id}
                  onClick={() => {
                    if (pathname !== item.route) {
                      router.replace(item.route as any);
                    }
                  }}
                  aria-current="page"
                  className="flex flex-col items-center justify-center text-primary-container font-mono font-bold bg-primary-container/10 rounded-xl px-3.5 py-1.5 transition-all duration-200 border border-primary-container/60 shadow-[0_0_14px_rgba(249,115,22,0.25)]"
                >
                  <span
                    className="material-symbols-outlined text-primary-container text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {item.icon}
                  </span>
                  <span className="text-[10px] font-mono tracking-wider uppercase mt-0.5">
                    {item.label}
                  </span>
                </button>
              ) : (
                <button
                  key={item.id}
                  onClick={() => router.replace(item.route as any)}
                  className="flex flex-col items-center justify-center text-tertiary px-3 py-1.5 hover:text-primary transition-all duration-200 active:scale-95"
                >
                  <span className="material-symbols-outlined text-xl">
                    {item.icon}
                  </span>
                  <span className="text-[10px] font-mono tracking-wider uppercase mt-0.5">
                    {item.label}
                  </span>
                </button>
              )
            )}
          </nav>
        )}
      </div>
    </div>
  );
};
