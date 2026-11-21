import React, { useState } from 'react';
import { useApp } from '../../src/store/AppContext';
import { PerformanceHQShell } from '../../src/components/PerformanceHQShell';
import {
  clearPinCode,
  exportCompleteBackup,
  importBackupFromFile,
  savePinCode,
} from '../../src/services/securityService';

export default function SettingsModalScreen() {
  const {
    state,
    tr,
    updateSettings,
    replaceFullState,
    lockApp,
  } = useApp();

  const s = state.settings;
  const lang = s.language;

  const [morningTime, setMorningTime] = useState(s.manifestationMorningTime);
  const [afternoonTime, setAfternoonTime] = useState(s.manifestationAfternoonTime);
  const [eveningTime, setEveningTime] = useState(s.manifestationEveningTime);
  const [missedTime, setMissedTime] = useState(s.missedTaskNotificationTime);
  const [activeStart, setActiveStart] = useState(s.activeHoursStart);
  const [activeEnd, setActiveEnd] = useState(s.activeHoursEnd);
  const [physiqueTime, setPhysiqueTime] = useState(s.physiqueReminderTime);
  const [reviewTime, setReviewTime] = useState(s.weeklyReviewTime);
  const [startWeight, setStartWeight] = useState(String(s.startingWeightKg));
  const [goalWeight, setGoalWeight] = useState(String(s.goalWeightKg));

  const [newPin, setNewPin] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSaveSchedules = async () => {
    await updateSettings({
      manifestationMorningTime: morningTime.trim(),
      manifestationAfternoonTime: afternoonTime.trim(),
      manifestationEveningTime: eveningTime.trim(),
      missedTaskNotificationTime: missedTime.trim(),
      activeHoursStart: activeStart.trim(),
      activeHoursEnd: activeEnd.trim(),
      physiqueReminderTime: physiqueTime.trim(),
      weeklyReviewTime: reviewTime.trim(),
      startingWeightKg: parseFloat(startWeight) || s.startingWeightKg,
      goalWeightKg: parseFloat(goalWeight) || s.goalWeightKg,
    });
    setStatusMessage('Configuration saved ✓');
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const handleEnablePin = async () => {
    if (newPin.trim().length < 4) {
      setStatusMessage('PIN must be at least 4 digits.');
      return;
    }
    await savePinCode(newPin.trim());
    await updateSettings({ pinLockEnabled: true });
    setNewPin('');
    setStatusMessage('PIN Lock Enabled ✓');
  };

  const handleDisablePin = async () => {
    await clearPinCode();
    await updateSettings({ pinLockEnabled: false });
    setStatusMessage('PIN Lock Disabled.');
  };

  const handleExport = async () => {
    const res = await exportCompleteBackup(state);
    setStatusMessage(res.message);
  };

  const handleImport = async () => {
    const imported = await importBackupFromFile();
    if (imported) {
      await replaceFullState(imported);
      setStatusMessage('Backup restored ✓');
    }
  };

  return (
    <PerformanceHQShell showBackButton subtitle="System Configuration &amp; Vault">
      {statusMessage && (
        <div className="p-3 rounded-xl bg-surface-container-high border border-primary-container text-primary text-label-md font-bold text-center machined-border">
          {statusMessage}
        </div>
      )}

      {/* Language & Localization */}
      <section className="rounded-xl bg-surface-container p-space-md machined-border thermal-top-edge space-y-3">
        <span className="text-label-sm font-label-sm text-primary uppercase tracking-wider block">
          {tr('languageLabel')}
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateSettings({ language: 'sl' })}
            className={`py-2.5 rounded-lg text-label-md font-label-md machined-border ${
              lang === 'sl'
                ? 'bg-primary-container text-on-primary font-bold'
                : 'bg-surface-container-lowest text-on-surface-variant'
            }`}
          >
            SLOVENŠČINA
          </button>
          <button
            onClick={() => updateSettings({ language: 'en' })}
            className={`py-2.5 rounded-lg text-label-md font-label-md machined-border ${
              lang === 'en'
                ? 'bg-primary-container text-on-primary font-bold'
                : 'bg-surface-container-lowest text-on-surface-variant'
            }`}
          >
            ENGLISH
          </button>
        </div>

        <label className="flex items-center justify-between pt-2 border-t border-surface-variant cursor-pointer">
          <span className="text-body-sm text-white">{tr('preserveEnglishLabel')}</span>
          <input
            type="checkbox"
            checked={s.preserveEnglishQuotes}
            onChange={(e) =>
              updateSettings({ preserveEnglishQuotes: e.target.checked })
            }
            className="w-5 h-5 rounded accent-orange-500"
          />
        </label>
      </section>

      {/* Accountability & Hardcore Mode */}
      <section className="rounded-xl bg-surface-container p-space-md machined-border space-y-3">
        <span className="text-label-sm font-label-sm text-primary uppercase tracking-wider block">
          ACCOUNTABILITY &amp; NOTIFICATIONS
        </span>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-body-sm text-white font-semibold">
              {tr('hardcoreModeLabel')}
            </p>
            <p className="text-label-sm text-on-surface-variant">
              &ldquo;YOU FUCKED UP YESTERDAY. GET BETTER TODAY.&rdquo;
            </p>
          </div>
          <input
            type="checkbox"
            checked={s.hardcoreMode}
            onChange={(e) => updateSettings({ hardcoreMode: e.target.checked })}
            className="w-5 h-5 rounded accent-orange-500"
          />
        </label>

        <label className="flex items-center justify-between pt-2 border-t border-surface-variant cursor-pointer">
          <span className="text-body-sm text-white">
            Priority-Weighted Discipline Score
          </span>
          <input
            type="checkbox"
            checked={s.priorityWeightingEnabled}
            onChange={(e) =>
              updateSettings({ priorityWeightingEnabled: e.target.checked })
            }
            className="w-5 h-5 rounded accent-orange-500"
          />
        </label>
      </section>

      {/* Reminder Schedules */}
      <section className="rounded-xl bg-surface-container p-space-md machined-border space-y-3">
        <span className="text-label-sm font-label-sm text-primary uppercase tracking-wider block">
          REMINDER SCHEDULES &amp; TARGETS
        </span>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-label-sm text-tertiary block mb-1">Morning</label>
            <input
              value={morningTime}
              onChange={(e) => setMorningTime(e.target.value)}
              className="w-full rounded bg-surface-container-lowest border border-outline-variant text-white p-2 text-body-sm"
            />
          </div>
          <div>
            <label className="text-label-sm text-tertiary block mb-1">Midday</label>
            <input
              value={afternoonTime}
              onChange={(e) => setAfternoonTime(e.target.value)}
              className="w-full rounded bg-surface-container-lowest border border-outline-variant text-white p-2 text-body-sm"
            />
          </div>
          <div>
            <label className="text-label-sm text-tertiary block mb-1">Evening</label>
            <input
              value={eveningTime}
              onChange={(e) => setEveningTime(e.target.value)}
              className="w-full rounded bg-surface-container-lowest border border-outline-variant text-white p-2 text-body-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-label-sm text-tertiary block mb-1">
              Missed-Task Alert
            </label>
            <input
              value={missedTime}
              onChange={(e) => setMissedTime(e.target.value)}
              className="w-full rounded bg-surface-container-lowest border border-outline-variant text-white p-2 text-body-sm"
            />
          </div>
          <div>
            <label className="text-label-sm text-tertiary block mb-1">
              Sunday Review
            </label>
            <input
              value={reviewTime}
              onChange={(e) => setReviewTime(e.target.value)}
              className="w-full rounded bg-surface-container-lowest border border-outline-variant text-white p-2 text-body-sm"
            />
          </div>
          <div>
            <label className="text-label-sm text-tertiary block mb-1">
              Start Weight (kg)
            </label>
            <input
              value={startWeight}
              onChange={(e) => setStartWeight(e.target.value)}
              className="w-full rounded bg-surface-container-lowest border border-outline-variant text-white p-2 text-body-sm"
            />
          </div>
          <div>
            <label className="text-label-sm text-tertiary block mb-1">
              Goal Weight (kg)
            </label>
            <input
              value={goalWeight}
              onChange={(e) => setGoalWeight(e.target.value)}
              className="w-full rounded bg-surface-container-lowest border border-outline-variant text-white p-2 text-body-sm"
            />
          </div>
        </div>

        <button
          onClick={handleSaveSchedules}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary-container to-inverse-primary text-on-primary font-bold text-label-md machined-border"
        >
          {tr('save')}
        </button>
      </section>

      {/* PIN Lock, Onboarding Replay & Data Vault */}
      <section className="rounded-xl bg-surface-container-low p-space-md machined-border space-y-3">
        <span className="text-label-sm font-label-sm text-primary uppercase tracking-wider block">
          SECURITY &amp; PRIVATE VAULT BACKUP
        </span>

        <div className="flex gap-2">
          <input
            type="password"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            placeholder="Set 4–8 digit PIN..."
            className="flex-1 rounded-lg bg-surface-container-lowest border border-outline-variant text-white p-2 text-body-sm"
          />
          <button
            onClick={handleEnablePin}
            className="px-3 rounded-lg bg-primary-container text-on-primary font-bold text-label-sm machined-border"
          >
            Set PIN
          </button>
        </div>

        {s.pinLockEnabled && (
          <div className="flex gap-2">
            <button
              onClick={lockApp}
              className="flex-1 py-2 rounded-lg bg-surface-container text-primary text-label-sm machined-border"
            >
              Lock App Now
            </button>
            <button
              onClick={handleDisablePin}
              className="flex-1 py-2 rounded-lg bg-error-container/30 text-error text-label-sm machined-border"
            >
              Disable PIN
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-variant">
          <button
            onClick={handleExport}
            className="py-2.5 px-3 rounded-lg bg-surface-container text-primary text-label-sm font-bold flex items-center justify-center gap-1 machined-border"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleImport}
            className="py-2.5 px-3 rounded-lg bg-surface-container text-white text-label-sm font-bold flex items-center justify-center gap-1 machined-border"
          >
            <span className="material-symbols-outlined text-base">upload</span>
            <span>Import Backup</span>
          </button>
        </div>

        <button
          onClick={() => updateSettings({ onboardingCompleted: false })}
          className="w-full py-2 rounded-lg bg-surface-container text-tertiary hover:text-white text-label-sm machined-border"
        >
          Launch 8-Step Onboarding Wizard
        </button>
      </section>
    </PerformanceHQShell>
  );
}
