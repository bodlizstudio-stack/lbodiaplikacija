import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/store/AppContext';
import { LBODIShell } from '../../src/components/LBODIShell';
import {
  clearPinCode,
  exportCompleteBackup,
  importBackupFromFile,
  savePinCode,
} from '../../src/services/securityService';
import { ThemeMode } from '../../src/types';

export default function SettingsModalScreen() {
  const router = useRouter();
  const {
    state,
    tr,
    updateSettings,
    replaceFullState,
    lockApp,
  } = useApp();

  const s = state.settings;
  const lang = s.language;

  const [timezone, setTimezone] = useState(s.timezone || 'Europe/Ljubljana');
  const [startWeight, setStartWeight] = useState(String(s.startingWeightKg));
  const [goalWeight, setGoalWeight] = useState(String(s.goalWeightKg));
  const [newPin, setNewPin] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSaveGeneral = async () => {
    await updateSettings({
      timezone: timezone.trim() || 'Europe/Ljubljana',
      startingWeightKg: parseFloat(startWeight) || s.startingWeightKg,
      goalWeightKg: parseFloat(goalWeight) || s.goalWeightKg,
    });
    setStatusMessage(lang === 'sl' ? 'Nastavitve shranjene ✓' : 'Settings saved ✓');
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const handleEnablePin = async () => {
    if (newPin.trim().length < 4) {
      setStatusMessage(lang === 'sl' ? 'PIN mora imeti vsaj 4 števke.' : 'PIN must be at least 4 digits.');
      return;
    }
    await savePinCode(newPin.trim());
    await updateSettings({ pinLockEnabled: true });
    setNewPin('');
    setStatusMessage('PIN zaklepanje omogočeno ✓');
  };

  const handleDisablePin = async () => {
    await clearPinCode();
    await updateSettings({ pinLockEnabled: false });
    setStatusMessage('PIN zaklepanje izklopljeno.');
  };

  const handleExport = async () => {
    const res = await exportCompleteBackup(state);
    setStatusMessage(res.message);
  };

  const handleImport = async () => {
    const imported = await importBackupFromFile();
    if (imported) {
      await replaceFullState(imported);
      setStatusMessage('Varnostna kopija obnovljena ✓');
    }
  };

  return (
    <LBODIShell showBackButton subtitle={lang === 'sl' ? 'Nastavitve in zasebnost' : 'Settings & Privacy'}>
      {statusMessage && (
        <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-gold)] text-[var(--accent-gold)] text-xs font-semibold text-center">
          {statusMessage}
        </div>
      )}

      {/* Theme Mode (Dark / Light / System) */}
      <section className="lbodi-card thermal-top-edge p-4 space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)] block">
          {lang === 'sl' ? 'Videz aplikacije' : 'Appearance'}
        </span>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'dark', label: lang === 'sl' ? 'Temni' : 'Dark' },
              { id: 'light', label: lang === 'sl' ? 'Svetli' : 'Light' },
              { id: 'system', label: lang === 'sl' ? 'Sistem' : 'System' },
            ] as { id: ThemeMode; label: string }[]
          ).map((tOpt) => (
            <button
              key={tOpt.id}
              onClick={() => updateSettings({ themeMode: tOpt.id })}
              className={`py-2.5 rounded-xl text-xs font-semibold border ${
                (s.themeMode || 'dark') === tOpt.id
                  ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent'
                  : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
              }`}
            >
              {tOpt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Language & Timezone */}
      <section className="lbodi-card p-4 space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)] block">
          {tr('languageLabel')}
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateSettings({ language: 'sl' })}
            className={`py-2.5 rounded-xl text-xs font-semibold border ${
              lang === 'sl'
                ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent'
                : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
            }`}
          >
            SLOVENŠČINA
          </button>
          <button
            onClick={() => updateSettings({ language: 'en' })}
            className={`py-2.5 rounded-xl text-xs font-semibold border ${
              lang === 'en'
                ? 'bg-[var(--accent-gold)] text-[#0B1220] border-transparent'
                : 'bg-[var(--bg-lowest)] text-[var(--text-muted)] border-[var(--border-subtle)]'
            }`}
          >
            ENGLISH
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <div>
            <label className="text-[10px] text-[var(--text-muted)] block mb-1">Časovni pas</label>
            <input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
            />
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-muted)] block mb-1">Zač. teža (kg)</label>
            <input
              value={startWeight}
              onChange={(e) => setStartWeight(e.target.value)}
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
            />
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-muted)] block mb-1">Ciljna teža (kg)</label>
            <input
              value={goalWeight}
              onChange={(e) => setGoalWeight(e.target.value)}
              className="w-full rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
            />
          </div>
        </div>
        <button onClick={handleSaveGeneral} className="w-full py-2.5 rounded-xl lbodi-gold-btn text-xs">
          {tr('save')}
        </button>
      </section>

      {/* Quick Privacy & Notifications Links */}
      <section className="lbodi-card p-4 space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)] block">
          Opomniki in AI zasebnost
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => router.push('/modals/notifications' as any)}
            className="py-2.5 px-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)]"
          >
            Urnik obvestil →
          </button>
          <button
            onClick={() => router.push('/modals/ai-assistant' as any)}
            className="py-2.5 px-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)]"
          >
            LBODI AI zasebnost →
          </button>
        </div>
      </section>

      {/* PIN Lock & JSON Backup Vault */}
      <section className="lbodi-card p-4 space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)] block">
          Varnost in varnostna kopija
        </span>
        <div className="flex gap-2">
          <input
            type="password"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            placeholder="Nastavi 4–8 mestno PIN kodo..."
            className="flex-1 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-main)]"
          />
          <button onClick={handleEnablePin} className="px-3.5 rounded-xl lbodi-gold-btn text-xs">
            Nastavi PIN
          </button>
        </div>

        {s.pinLockEnabled && (
          <div className="flex gap-2">
            <button
              onClick={lockApp}
              className="flex-1 py-2 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-xs text-[var(--accent-gold)]"
            >
              Zakleni zdaj
            </button>
            <button
              onClick={handleDisablePin}
              className="flex-1 py-2 rounded-xl bg-red-900/25 border border-red-400/30 text-xs text-red-300"
            >
              Izklopi PIN
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <button
            onClick={handleExport}
            className="py-2.5 px-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--accent-gold)]"
          >
            Izvozi vse podatke (JSON)
          </button>
          <button
            onClick={handleImport}
            className="py-2.5 px-3 rounded-xl bg-[var(--bg-lowest)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-main)]"
          >
            Uvozi varnostno kopijo
          </button>
        </div>
      </section>
    </LBODIShell>
  );
}
