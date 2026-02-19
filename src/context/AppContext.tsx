import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppPreferences, ThemeType } from '../types';
import { fetchPreferences, updatePreferences } from '../services/api';

type ContextData = {
  loading: boolean;
  onboarded: boolean;
  theme: ThemeType;
  favoriteGenre: string;
  selectedPlatforms: string[];
  continueWatching: number[];
  setOnboarded: (value: boolean) => Promise<void>;
  toggleTheme: () => Promise<void>;
  setSelectedPlatforms: (platforms: string[]) => Promise<void>;
  clearPreferences: () => Promise<void>;
};

const AppContext = createContext<ContextData | null>(null);

const ONBOARDING_KEY = '@streamhub:onboarded';
const CONTINUE_KEY = '@streamhub:continue';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboardedState] = useState(false);
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [favoriteGenre, setFavoriteGenre] = useState('Action');
  const [selectedPlatforms, setSelectedPlatformsState] = useState<string[]>([]);
  const [continueWatching, setContinueWatching] = useState<number[]>([]);

  useEffect(() => {
    async function bootstrap() {
      try {
        const [onboardingValue, continueValue] = await Promise.all([
          AsyncStorage.getItem(ONBOARDING_KEY),
          AsyncStorage.getItem(CONTINUE_KEY)
        ]);

        if (onboardingValue === 'true') {
          setOnboardedState(true);
        }

        if (continueValue) {
          setContinueWatching(JSON.parse(continueValue));
        } else {
          const initial = [667538, 603692, 939243];
          setContinueWatching(initial);
          await AsyncStorage.setItem(CONTINUE_KEY, JSON.stringify(initial));
        }

        const remotePrefs = await fetchPreferences();
        setTheme(remotePrefs.theme);
        setFavoriteGenre(remotePrefs.favoriteGenre);

        const savedPlatforms = Array.isArray(remotePrefs.selectedPlatforms)
          ? remotePrefs.selectedPlatforms
          : [];
        setSelectedPlatformsState(savedPlatforms);
      } catch (error) {
        console.log('Erro ao carregar preferencias', error);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  async function setOnboarded(value: boolean) {
    setOnboardedState(value);
    await AsyncStorage.setItem(ONBOARDING_KEY, value ? 'true' : 'false');
  }

  async function toggleTheme() {
    const nextTheme: ThemeType = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      await updatePreferences({ theme: nextTheme });
    } catch (error) {
      // Backend offline; keep local state.
    }
  }

  async function setSelectedPlatforms(platforms: string[]) {
    const normalized = Array.isArray(platforms) ? platforms : [];
    setSelectedPlatformsState(normalized);
    try {
      await updatePreferences({ selectedPlatforms: normalized });
    } catch (error) {
      // Backend offline; keep local state.
    }
  }

  async function clearPreferences() {
    const reset: AppPreferences = {
      favoriteGenre,
      selectedPlatforms: [],
      theme: 'dark'
    };

    setTheme('dark');
    setSelectedPlatformsState([]);
    setOnboardedState(false);

    await AsyncStorage.removeItem(ONBOARDING_KEY);
    try {
      await updatePreferences(reset);
    } catch (error) {
      // Backend offline; keep local state.
    }
  }

  const value = useMemo(
    () => ({
      loading,
      onboarded,
      theme,
      favoriteGenre,
      selectedPlatforms,
      continueWatching,
      setOnboarded,
      toggleTheme,
      setSelectedPlatforms,
      clearPreferences
    }),
    [loading, onboarded, theme, favoriteGenre, selectedPlatforms, continueWatching]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext deve ser usado dentro de AppProvider');
  }
  return context;
}
