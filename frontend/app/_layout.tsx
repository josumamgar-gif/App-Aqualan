import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from './ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F5F9FC' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="offer" options={{ headerShown: false }} />
      </Stack>
    </ErrorBoundary>
  );
}
