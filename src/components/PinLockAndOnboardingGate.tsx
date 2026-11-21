import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../store/AppContext';
import { COLORS, GRADIENTS, RADIUS, SPACING } from '../theme/tokens';
import { MetallicCard } from './MetallicCard';
import { authenticateWithBiometrics, verifyPinCode } from '../services/securityService';

const LOGO_IMG = require('../../assets/images/get-up-logo.jpg');

export const PinLockAndOnboardingGate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    state,
    isLocked,
    unlockApp,
    updateSettings,
    completeOnboarding,
    togglePauseHabit,
  } = useApp();

  // Splash intro animation state
  const [showSplash, setShowSplash] = useState(false);

  // PIN Lock state
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // 8-Step Onboarding state
  const [step, setStep] = useState(1);
  const [whyText, setWhyText] = useState(state.whyIStarted.disciplineReasons);
  const [morningTime, setMorningTime] = useState(state.settings.manifestationMorningTime);
  const [afternoonTime, setAfternoonTime] = useState(state.settings.manifestationAfternoonTime);
  const [eveningTime, setEveningTime] = useState(state.settings.manifestationEveningTime);
  const [activeStart, setActiveStart] = useState(state.settings.activeHoursStart);
  const [activeEnd, setActiveEnd] = useState(state.settings.activeHoursEnd);
  const [hardcore, setHardcore] = useState(state.settings.hardcoreMode);
  const [nofapDaysAgo, setNofapDaysAgo] = useState('0');
  const [nofapCustomIso, setNofapCustomIso] = useState(
    state.nofapState.startTimestamp.slice(0, 16).replace('T', ' ')
  );
  const [startWeight, setStartWeight] = useState(String(state.settings.startingWeightKg || 82));
  const [goalWeight, setGoalWeight] = useState(String(state.settings.goalWeightKg || 86));

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSplash && isLocked && state.settings.biometricEnabled) {
      authenticateWithBiometrics().then((ok) => {
        if (ok) unlockApp();
      });
    }
  }, [showSplash, isLocked, state.settings.biometricEnabled, unlockApp]);

  const lang = state.settings.language;

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.logoGlowFrame}>
          <Image source={LOGO_IMG} style={styles.splashLogo} resizeMode="cover" />
        </View>
        <Text style={styles.splashTitle}>GET UP. NO EXCUSES.</Text>
        <Text style={styles.splashSub}>
          {lang === 'sl' ? 'Dobrodošel nazaj, Luka.' : 'Welcome back, Luka.'}
        </Text>
        <Text style={styles.splashPhilosophy}>
          &ldquo;DON&apos;T FORGET WHAT YOU&apos;RE HERE FOR, AND WHY YOU STARTED.&rdquo;
        </Text>
      </View>
    );
  }

  if (isLocked) {
    const handleVerifyPin = async () => {
      const valid = await verifyPinCode(pinInput.trim());
      if (valid) {
        setPinInput('');
        setPinError('');
        unlockApp();
      } else {
        setPinError(
          lang === 'sl' ? 'Napačna PIN koda. Poskusi znova.' : 'Incorrect PIN code. Try again.'
        );
      }
    };

    return (
      <View style={styles.lockContainer}>
        <Image source={LOGO_IMG} style={styles.lockLogo} />
        <Text style={styles.lockHeading}>GET UP — ZASEBNI DOSTOP</Text>
        <Text style={styles.lockSub}>
          {lang === 'sl'
            ? 'Vnesi PIN kodo za odklep osebnega sistema Luka Bodlaj'
            : 'Enter your PIN to unlock Luka Bodlaj Personal OS'}
        </Text>

        <TextInput
          value={pinInput}
          onChangeText={(v) => {
            setPinInput(v);
            setPinError('');
          }}
          placeholder="••••"
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry
          keyboardType="numeric"
          maxLength={8}
          style={styles.pinInput}
        />
        {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}

        <Pressable onPress={handleVerifyPin} style={styles.primaryBtnWrapper}>
          <LinearGradient colors={GRADIENTS.orangeButton} style={styles.primaryBtn}>
            <Ionicons name="lock-open" size={18} color={COLORS.textDark} />
            <Text style={styles.primaryBtnText}>
              {lang === 'sl' ? 'ODKLENI APLIKACIJO' : 'UNLOCK GET UP'}
            </Text>
          </LinearGradient>
        </Pressable>

        {state.settings.biometricEnabled && (
          <Pressable
            onPress={async () => {
              const ok = await authenticateWithBiometrics();
              if (ok) unlockApp();
            }}
            style={styles.biometricBtn}
          >
            <Ionicons name="finger-print" size={24} color={COLORS.accentHighlight} />
            <Text style={styles.biometricText}>
              {lang === 'sl' ? 'Odkleni z biometrijo' : 'Unlock with Biometrics'}
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (!state.settings.onboardingCompleted) {
    const finishOnboarding = async () => {
      await updateSettings({
        manifestationMorningTime: morningTime,
        manifestationAfternoonTime: afternoonTime,
        manifestationEveningTime: eveningTime,
        activeHoursStart: activeStart,
        activeHoursEnd: activeEnd,
        hardcoreMode: hardcore,
      });

      let computedNofapIso = state.nofapState.startTimestamp;
      const daysNum = parseFloat(nofapDaysAgo);
      if (!isNaN(daysNum) && daysNum > 0) {
        computedNofapIso = new Date(Date.now() - daysNum * 86400000).toISOString();
      } else if (nofapCustomIso.trim()) {
        const parsed = new Date(nofapCustomIso.trim().replace(' ', 'T'));
        if (!isNaN(parsed.getTime())) {
          computedNofapIso = parsed.toISOString();
        }
      }

      await completeOnboarding({
        reasons: whyText,
        startingWeightKg: parseFloat(startWeight) || 82,
        goalWeightKg: parseFloat(goalWeight) || 86,
        nofapStartIso: computedNofapIso,
      });
    };

    return (
      <View style={styles.onboardingRoot}>
        <ScrollView contentContainerStyle={styles.onboardingScroll}>
          <View style={styles.onboardingTopRow}>
            <Text style={styles.stepIndicator}>
              {lang === 'sl' ? `KORAK ${step} OD 8` : `STEP ${step} OF 8`}
            </Text>
            <Pressable onPress={finishOnboarding} style={styles.skipBtn}>
              <Text style={styles.skipBtnText}>
                {lang === 'sl' ? 'Preskoči uvod →' : 'Skip Onboarding →'}
              </Text>
            </Pressable>
          </View>

          {step === 1 && (
            <MetallicCard glow highlightBorder style={styles.stepCard}>
              <View style={styles.centerBlock}>
                <Image source={LOGO_IMG} style={styles.onboardLogo} />
                <Text style={styles.onboardHeadline}>WELCOME TO GET UP</Text>
                <Text style={styles.onboardWelcome}>
                  {lang === 'sl' ? 'Dobrodošel, Luka Bodlaj.' : 'Welcome, Luka Bodlaj.'}
                </Text>
                <Text style={styles.onboardPhilosophy}>
                  &ldquo;DON&apos;T FORGET WHAT YOU&apos;RE HERE FOR, AND WHY YOU STARTED.&rdquo;
                </Text>
                <Text style={styles.onboardBody}>
                  {lang === 'sl'
                    ? 'To je tvoj zasebni operacijski sistem za nezlomljivo disciplino, telesno preobrazbo, vero, fokus in vsakodnevno odgovornost.'
                    : 'Your private personal operating system for relentless discipline, physique transformation, faith, mental strength, and daily accountability.'}
                </Text>

                <View style={styles.langSwitchRow}>
                  <Pressable
                    onPress={() => updateSettings({ language: 'sl' })}
                    style={[
                      styles.langOption,
                      lang === 'sl' && styles.langOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.langOptionText,
                        lang === 'sl' && styles.langOptionTextActive,
                      ]}
                    >
                      SLOVENŠČINA (Privzeto)
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => updateSettings({ language: 'en' })}
                    style={[
                      styles.langOption,
                      lang === 'en' && styles.langOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.langOptionText,
                        lang === 'en' && styles.langOptionTextActive,
                      ]}
                    >
                      ENGLISH
                    </Text>
                  </Pressable>
                </View>
              </View>
            </MetallicCard>
          )}

          {step === 2 && (
            <MetallicCard highlightBorder style={styles.stepCard}>
              <Text style={styles.onboardHeadline}>WHY ARE YOU HERE?</Text>
              <Text style={styles.onboardBody}>
                {lang === 'sl'
                  ? 'Zapiši svoje najgloblje osebne razloge, zakaj si začel. To se ti bo prikazalo vsakič, ko bo motivacija izginila.'
                  : 'Write your deepest personal reasons for building discipline. This will remind you when motivation disappears.'}
              </Text>
              <TextInput
                value={whyText}
                onChangeText={setWhyText}
                multiline
                style={[styles.textInput, { minHeight: 130, textAlignVertical: 'top' }]}
                placeholder={
                  lang === 'sl'
                    ? 'Zapiši, zakaj si tukaj in kakšen moški postajaš...'
                    : 'Write why you are here and who you are becoming...'
                }
                placeholderTextColor={COLORS.textMuted}
              />
            </MetallicCard>
          )}

          {step === 3 && (
            <MetallicCard highlightBorder style={styles.stepCard}>
              <Text style={styles.onboardHeadline}>
                {lang === 'sl' ? 'TVOJE PRVE NAVADE IN MISIJA' : 'YOUR FIRST HABITS & MISSION'}
              </Text>
              <Text style={styles.onboardBody}>
                {lang === 'sl'
                  ? 'Pripravljene so tvoje ključne vsakodnevne naloge. Vse lahko kadarkoli urediš, dodaš ali začasno ustaviš.'
                  : 'Your core daily habits are ready. Toggle any habit below or customize them anytime.'}
              </Text>
              {state.habits.slice(0, 7).map((h) => (
                <Pressable
                  key={h.id}
                  onPress={() => togglePauseHabit(h.id)}
                  style={styles.habitPreviewRow}
                >
                  <Ionicons
                    name={h.isPaused ? 'square-outline' : 'checkbox'}
                    size={22}
                    color={h.isPaused ? COLORS.textMuted : COLORS.accentPrimary}
                  />
                  <Text style={styles.habitPreviewTitle}>{h.title}</Text>
                </Pressable>
              ))}
            </MetallicCard>
          )}

          {step === 4 && (
            <MetallicCard highlightBorder style={styles.stepCard}>
              <Text style={styles.onboardHeadline}>
                {lang === 'sl'
                  ? '3X DNEVNA MANIFESTACIJA'
                  : '3X DAILY MANIFESTATION REMINDERS'}
              </Text>
              <Text style={styles.onboardBody}>
                {lang === 'sl'
                  ? 'Nastavi ure za jutranjo, popoldansko in večerno hvaležnost ter manifestacijo v sedanjiku.'
                  : 'Configure your Morning, Afternoon, and Evening manifestation & gratitude reminders.'}
              </Text>

              <Text style={styles.fieldLabel}>
                {lang === 'sl' ? 'Jutranja seja (HH:MM)' : 'Morning Session (HH:MM)'}
              </Text>
              <TextInput
                value={morningTime}
                onChangeText={setMorningTime}
                style={styles.textInput}
              />

              <Text style={styles.fieldLabel}>
                {lang === 'sl' ? 'Popoldanska seja (HH:MM)' : 'Afternoon Session (HH:MM)'}
              </Text>
              <TextInput
                value={afternoonTime}
                onChangeText={setAfternoonTime}
                style={styles.textInput}
              />

              <Text style={styles.fieldLabel}>
                {lang === 'sl' ? 'Večerna seja (HH:MM)' : 'Evening Session (HH:MM)'}
              </Text>
              <TextInput
                value={eveningTime}
                onChangeText={setEveningTime}
                style={styles.textInput}
              />
            </MetallicCard>
          )}

          {step === 5 && (
            <MetallicCard highlightBorder style={styles.stepCard}>
              <Text style={styles.onboardHeadline}>
                {lang === 'sl'
                  ? 'OBVESTILA IN HARDCORE NAČIN'
                  : 'ACCOUNTABILITY & HARDCORE MODE'}
              </Text>
              <Text style={styles.onboardBody}>
                {lang === 'sl'
                  ? 'Če prejšnji dan ne opraviš vseh nalog, te aplikacija zjutraj opomni brez olepševanja.'
                  : 'If you leave tasks unfinished, GET UP holds you accountable the next morning.'}
              </Text>

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>HARDCORE MODE</Text>
                  <Text style={styles.switchDesc}>
                    &ldquo;YOU FUCKED UP YESTERDAY. GET BETTER TODAY.&rdquo;
                  </Text>
                </View>
                <Switch
                  value={hardcore}
                  onValueChange={setHardcore}
                  trackColor={{ false: '#333', true: COLORS.accentPrimary }}
                />
              </View>

              <Text style={styles.fieldLabel}>
                {lang === 'sl' ? 'Aktivne ure (Začetek)' : 'Active Hours Start'}
              </Text>
              <TextInput value={activeStart} onChangeText={setActiveStart} style={styles.textInput} />

              <Text style={styles.fieldLabel}>
                {lang === 'sl' ? 'Aktivne ure (Konec)' : 'Active Hours End'}
              </Text>
              <TextInput value={activeEnd} onChangeText={setActiveEnd} style={styles.textInput} />
            </MetallicCard>
          )}

          {step === 6 && (
            <MetallicCard highlightBorder style={styles.stepCard}>
              <Text style={styles.onboardHeadline}>
                {lang === 'sl' ? 'ZAČETEK NO FAP ŠTEVCA' : 'NO FAP STREAK START DATE'}
              </Text>
              <Text style={styles.onboardBody}>
                {lang === 'sl'
                  ? 'Nastavi točen datum in uro začetka svojega trenutnega niza (ali koliko dni nazaj si začel).'
                  : 'Set your exact No Fap starting date & time or how many days ago your current streak started.'}
              </Text>

              <Text style={styles.fieldLabel}>
                {lang === 'sl'
                  ? 'Koliko dni že traja tvoj trenutni niz? (0 = začni zdaj)'
                  : 'How many days into your current streak? (0 = start right now)'}
              </Text>
              <TextInput
                value={nofapDaysAgo}
                onChangeText={setNofapDaysAgo}
                keyboardType="numeric"
                style={styles.textInput}
              />

              <Text style={styles.fieldLabel}>
                {lang === 'sl'
                  ? 'Ali vnesi točen datum in uro (YYYY-MM-DD HH:MM)'
                  : 'Or enter exact date & time (YYYY-MM-DD HH:MM)'}
              </Text>
              <TextInput
                value={nofapCustomIso}
                onChangeText={setNofapCustomIso}
                style={styles.textInput}
              />
            </MetallicCard>
          )}

          {step === 7 && (
            <MetallicCard highlightBorder style={styles.stepCard}>
              <Text style={styles.onboardHeadline}>
                {lang === 'sl' ? 'TELESNA PREOBRAZBA' : 'BODY TRANSFORMATION TARGETS'}
              </Text>
              <Text style={styles.onboardBody}>
                {lang === 'sl'
                  ? 'Nastavi svojo začetno in ciljno telesno težo (v kg) za sledenje napredku.'
                  : 'Set your starting weight and target weight (kg) for your transformation chart.'}
              </Text>

              <Text style={styles.fieldLabel}>
                {lang === 'sl' ? 'Začetna teža (kg)' : 'Starting Weight (kg)'}
              </Text>
              <TextInput
                value={startWeight}
                onChangeText={setStartWeight}
                keyboardType="numeric"
                style={styles.textInput}
              />

              <Text style={styles.fieldLabel}>
                {lang === 'sl' ? 'Ciljna teža (kg)' : 'Goal Weight (kg)'}
              </Text>
              <TextInput
                value={goalWeight}
                onChangeText={setGoalWeight}
                keyboardType="numeric"
                style={styles.textInput}
              />
            </MetallicCard>
          )}

          {step === 8 && (
            <MetallicCard glow highlightBorder style={styles.stepCard}>
              <View style={styles.centerBlock}>
                <Image source={LOGO_IMG} style={styles.onboardLogo} />
                <Text style={styles.onboardHeadline}>GET UP. NO EXCUSES.</Text>
                <Text style={styles.onboardWelcome}>
                  {lang === 'sl'
                    ? 'Tvoj osebni sistem discipline je pripravljen, Luka.'
                    : 'Your personal discipline headquarters is ready, Luka.'}
                </Text>
                <Text style={styles.onboardBody}>
                  {lang === 'sl'
                    ? 'Vsak dan šteje. Drži obljubo samemu sebi.'
                    : 'Every single day counts. Keep your promise to yourself.'}
                </Text>
              </View>
            </MetallicCard>
          )}

          <View style={styles.navButtonsRow}>
            {step > 1 && (
              <Pressable onPress={() => setStep(step - 1)} style={styles.backBtn}>
                <Text style={styles.backBtnText}>
                  {lang === 'sl' ? '← Nazaj' : '← Back'}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                if (step < 8) {
                  setStep(step + 1);
                } else {
                  finishOnboarding();
                }
              }}
              style={[styles.primaryBtnWrapper, { flex: 1 }]}
            >
              <LinearGradient colors={GRADIENTS.orangeButton} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>
                  {step < 8
                    ? lang === 'sl'
                      ? 'NAPREJ →'
                      : 'NEXT STEP →'
                    : lang === 'sl'
                    ? 'VSTOPI V GET UP'
                    : 'ENTER GET UP DASHBOARD'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  logoGlowFrame: {
    width: 150,
    height: 150,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: COLORS.accentHighlight,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
  },
  splashLogo: {
    width: '100%',
    height: '100%',
  },
  splashTitle: {
    color: COLORS.accentPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  splashSub: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  splashPhilosophy: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginTop: SPACING.xl,
    maxWidth: 300,
  },
  lockContainer: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  lockLogo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    marginBottom: SPACING.lg,
  },
  lockHeading: {
    color: COLORS.accentHighlight,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  lockSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: SPACING.xl,
  },
  pinInput: {
    width: 220,
    backgroundColor: COLORS.bgInput,
    borderWidth: 1.5,
    borderColor: COLORS.accentBorder,
    borderRadius: RADIUS.md,
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 12,
    letterSpacing: 8,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.statusRed,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  primaryBtnWrapper: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  primaryBtnText: {
    color: COLORS.textDark,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: SPACING.xl,
    padding: SPACING.md,
  },
  biometricText: {
    color: COLORS.accentHighlight,
    fontSize: 14,
    fontWeight: '700',
  },
  onboardingRoot: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  onboardingScroll: {
    padding: SPACING.lg,
    paddingTop: 48,
    paddingBottom: 60,
  },
  onboardingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  stepIndicator: {
    color: COLORS.accentHighlight,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  skipBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  stepCard: {
    marginBottom: SPACING.xl,
  },
  centerBlock: {
    alignItems: 'center',
  },
  onboardLogo: {
    width: 110,
    height: 110,
    borderRadius: 24,
    marginBottom: SPACING.md,
  },
  onboardHeadline: {
    color: COLORS.accentPrimary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  onboardWelcome: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  onboardPhilosophy: {
    color: COLORS.accentHighlight,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  onboardBody: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  langSwitchRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.md,
    width: '100%',
  },
  langOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgInput,
    alignItems: 'center',
  },
  langOptionActive: {
    borderColor: COLORS.accentPrimary,
    backgroundColor: COLORS.accentSubtle,
  },
  langOptionText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  langOptionTextActive: {
    color: COLORS.accentHighlight,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: SPACING.sm,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: RADIUS.md,
    color: COLORS.textPrimary,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  habitPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  habitPreviewTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgInput,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    marginBottom: SPACING.md,
  },
  switchTitle: {
    color: COLORS.accentPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
  switchDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  navButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgCard,
  },
  backBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
});
