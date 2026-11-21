import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="habits" />
      <Tabs.Screen name="faith" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="more" />
      <Tabs.Screen name="calendar" options={{ href: null }} />
    </Tabs>
  );
}
