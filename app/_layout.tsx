import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '../src/store/AppContext';
import { PinLockAndOnboardingGate } from '../src/components/PinLockAndOnboardingGate';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" backgroundColor="#0B1220" />
        <PinLockAndOnboardingGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0B1220' },
              animation: 'fade',
              animationDuration: 200,
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="modals/nofap" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/why-i-started" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/manifestation" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/bible" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/weekly-review" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/focus" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/goals" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/journal" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/settings" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/past-self" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/gratitude" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/vision" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/nutrition" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/fitness" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/ai-assistant" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/notifications" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/yearly-review" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/search" options={{ presentation: 'transparentModal', animation: 'fade' }} />
          </Stack>
        </PinLockAndOnboardingGate>
      </AppProvider>
    </SafeAreaProvider>
  );
}
