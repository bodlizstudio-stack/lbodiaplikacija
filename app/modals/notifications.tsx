import React, { useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/store/AppContext';
import { LBODIShell } from '../../src/components/LBODIShell';
import {
  DEFAULT_REMINDER_CONFIGS_FALLBACK,
} from './_notificationsHelper';
import { requestNotificationPermissions } from '../../src/services/notificationService';
import { ReminderType } from '../../src/types';

const REMINDER_LABELS: Record<ReminderType, { sl: string; en: string; descSl: string }> = {
  morning: {
    sl: 'Jutranji opomnik (Vera & namen)',
    en: 'Morning Reminder (Faith & Purpose)',
    descSl: 'Dobro jutro. Bog ti je podaril nov dan. Kako ga boš uporabil?',
  },
  midday: {
    sl: 'Opoldanski opomnik (Samokontrola)',
    en: 'Midday Reminder (Self-Control)',
    descSl: 'Zakaj si se odločil spremeniti svoje življenje? Spomni se svojega razloga.',
  },
  evening: {
    sl: 'Večerni opomnik (Hvaležnost & molitev)',
    en: 'Evening Reminder (Gratitude & Prayer)',
    descSl: 'Pred spanjem se zahvali Gospodu za današnji dan.',
  },
  biweekly_vision: {
    sl: '14-dnevni opomnik življenjske vizije',
    en: '14-Day Lifestyle Vision Reminder',
    descSl: 'Ali še vedno gradiš življenje, ki si ga želiš?',
  },
  morning_prayer: { sl: 'Jutranja molitev (opcijsko)', en: 'Morning Prayer', descSl: 'Tiha jutranja molitev.' },
  bible_reading: { sl: 'Branje Svetega pisma (opcijsko)', en: 'Bible Reading', descSl: 'Dnevni svetopisemski odlomek.' },
  gratitude: { sl: 'Dnevnik hvaležnosti (opcijsko)', en: 'Gratitude Journal', descSl: 'Zapis blagoslovov dneva.' },
  fitness: { sl: 'Trening / Gibanje (opcijsko)', en: 'Fitness Reminder', descSl: 'Skrb za zdravje in telo.' },
  water: { sl: 'Pitje vode (opcijsko)', en: 'Water Reminder', descSl: 'Opomnik za hidracijo.' },
  study: { sl: 'Učenje / Branje (opcijsko)', en: 'Study Reminder', descSl: 'Čas za osebni razvoj.' },
  weekly_review: { sl: 'Nedeljski pregled tedna', en: 'Weekly Review', descSl: 'Pregled navad in hvaležnosti.' },
};

export default function NotificationsModalScreen() {
  const router = useRouter();
  const {
    state,
    updateReminderConfig,
    markNotificationRead,
    markAllNotificationsRead,
    addCustomReminderMessage,
    deleteCustomReminderMessage,
  } = useApp();

  const lang = state.settings.language;
  const configs =
    state.settings.reminderConfigs && state.settings.reminderConfigs.length > 0
      ? state.settings.reminderConfigs
      : DEFAULT_REMINDER_CONFIGS_FALLBACK;
  const inbox = state.inAppNotifications || [];
  const messageLibrary = state.settings.customReminders || [];

  const [permStatus, setPermStatus] = useState<string>(() => {
    if (Platform.OS === 'web' && typeof Notification !== 'undefined') {
      return Notification.permission;
    }
    return 'unknown';
  });
  const [pushServerStatus, setPushServerStatus] = useState('');
  const [newMsgSl, setNewMsgSl] = useState('');
  const [newMsgEn, setNewMsgEn] = useState('');

  const handleRequestBrowserPermission = async () => {
    const ok = await requestNotificationPermissions(true);
    if (Platform.OS === 'web' && typeof Notification !== 'undefined') {
      setPermStatus(Notification.permission);
    }
    if (!ok) {
      setPushServerStatus(
        lang === 'sl'
          ? 'Dovoljenje v brskalniku ni odobreno. Opomniki v aplikaciji vseeno delujejo zanesljivo.'
          : 'Browser notification permission denied/unavailable. In-app reminders remain active.'
      );
      return;
    }
    try {
      const check = await fetch('/api/notifications/subscribe');
      const json = await check.json();
      setPushServerStatus(
        json.webPushConfigured
          ? 'Brskalnik in strežniški Web Push sta pripravljena.'
          : 'Brskalnik je odobren za obvestila v seji. Za pošiljanje ob zaprtem zavihku v ozadju je potrebno dodati VAPID_PUBLIC_KEY in VAPID_PRIVATE_KEY na Vercel.'
      );
    } catch {
      setPushServerStatus('Brskalnik je odobren. Opomniki v aplikaciji so aktivni.');
    }
  };

  return (
    <LBODIShell showBackButton subtitle={lang === 'sl' ? 'Obvestila in opomniki' : 'Notifications'}>
      {/* Browser Permission & Honest Capability Explanation */}
      <section className="lbodi-card thermal-top-edge p-4 space-y-2.5">
        <h1 className="font-sacred text-2xl font-semibold text-[var(--text-main)]">
          {lang === 'sl' ? 'Center za obvestila' : 'Notification Center'}
        </h1>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          {lang === 'sl'
            ? 'Tukaj nastaviš ure za jutranje, opoldanske, večerne in 14-dnevne opomnike ter preveriš stanje brskalniških potisnih obvestil. Dovoljenje se zahteva šele ob tvojem kliku.'
            : 'Configure reminder schedules cleanly. Browser permission is requested only on explicit user action.'}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRequestBrowserPermission}
            className="px-3.5 py-2 rounded-xl lbodi-gold-btn text-xs"
          >
            {permStatus === 'granted'
              ? '✓ Dovoljenje v brskalniku odobreno'
              : lang === 'sl'
              ? 'Aktiviraj obvestila v brskalniku'
              : 'Enable Browser Notifications'}
          </button>
          <span className="text-[11px] text-[var(--text-muted)]">
            Stanje: {permStatus}
          </span>
        </div>

        {pushServerStatus && (
          <p className="text-[11px] text-[var(--accent-gold)] bg-[var(--bg-lowest)] p-2.5 rounded-xl border border-[var(--border-subtle)]">
            {pushServerStatus}
          </p>
        )}
      </section>

      {/* In-App Inbox */}
      <section className="lbodi-card p-4 space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-[var(--text-main)]">
            {lang === 'sl' ? `Prejeti opomniki (${inbox.length})` : `In-App Reminders (${inbox.length})`}
          </span>
          {inbox.some((n) => !n.read) && (
            <button onClick={markAllNotificationsRead} className="text-[11px] text-[var(--accent-gold)]">
              Označi vse kot prebrano
            </button>
          )}
        </div>
        {inbox.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] italic">
            {lang === 'sl' ? 'Trenutno ni neprebranih opomnikov.' : 'No notifications yet.'}
          </p>
        ) : (
          inbox.map((n) => (
            <div
              key={n.id}
              onClick={async () => {
                await markNotificationRead(n.id);
                if (n.route) router.push(n.route as any);
              }}
              className={`p-3 rounded-xl border cursor-pointer text-xs ${
                n.read
                  ? 'bg-[var(--bg-lowest)] border-[var(--border-subtle)] opacity-75'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-gold)]'
              }`}
            >
              <div className="flex justify-between text-[10px] text-[var(--accent-gold)] font-semibold">
                <span>{n.title}</span>
                <span>{n.date}</span>
              </div>
              <p className="text-[var(--text-main)] mt-1">{n.body}</p>
            </div>
          ))
        )}
      </section>

      {/* Reminder Type Schedules */}
      <section className="lbodi-card p-4 space-y-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)] block">
          {lang === 'sl' ? 'Urnik opomnikov' : 'Reminder Schedules'}
        </span>
        {configs.map((rc) => {
          const info = REMINDER_LABELS[rc.type];
          return (
            <div
              key={rc.id}
              className="p-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] flex items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[var(--text-main)]">
                  {lang === 'sl' ? info?.sl || rc.type : info?.en || rc.type}
                </p>
                <span className="text-[10px] text-[var(--text-muted)] block truncate">
                  {info?.descSl}
                </span>
              </div>
              <input
                value={rc.localTime}
                onChange={(e) => updateReminderConfig(rc.id, { localTime: e.target.value })}
                className="w-16 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-1.5 py-1 text-center text-xs text-[var(--text-main)]"
              />
              <input
                type="checkbox"
                checked={rc.enabled}
                onChange={(e) => updateReminderConfig(rc.id, { enabled: e.target.checked })}
                className="w-4 h-4 accent-amber-500"
              />
            </div>
          );
        })}
      </section>

      {/* Editable 32+ Message Library */}
      <section className="lbodi-card p-4 space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-olive)] block">
          {lang === 'sl'
            ? `Knjižnica opomnikov in spodbud (${messageLibrary.length})`
            : `Reminder Library (${messageLibrary.length})`}
        </span>
        <div className="space-y-2">
          <input
            value={newMsgSl}
            onChange={(e) => setNewMsgSl(e.target.value)}
            placeholder="Novo slovensko sporočilo..."
            className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
          />
          <div className="flex gap-2">
            <input
              value={newMsgEn}
              onChange={(e) => setNewMsgEn(e.target.value)}
              placeholder="Angleška različica (opcijsko)..."
              className="flex-1 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2.5 text-xs text-[var(--text-main)]"
            />
            <button
              onClick={async () => {
                if (!newMsgSl.trim()) return;
                await addCustomReminderMessage(newMsgSl.trim(), newMsgEn.trim() || newMsgSl.trim());
                setNewMsgSl('');
                setNewMsgEn('');
              }}
              className="px-4 rounded-xl lbodi-gold-btn text-xs"
            >
              Dodaj
            </button>
          </div>
        </div>

        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {messageLibrary.map((m) => (
            <div
              key={m.id}
              className="p-2.5 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] flex justify-between items-start gap-2 text-xs"
            >
              <div>
                <p className="text-[var(--text-main)]">{lang === 'sl' ? m.textSl : m.textEn}</p>
                {m.scriptureRef && (
                  <span className="text-[10px] text-[var(--accent-gold)]">{m.scriptureRef}</span>
                )}
              </div>
              <button onClick={() => deleteCustomReminderMessage(m.id)} className="text-red-400">
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          ))}
        </div>
      </section>
    </LBODIShell>
  );
}
