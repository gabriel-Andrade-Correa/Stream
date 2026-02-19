import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlatformChip } from '../components/PlatformChip';
import { useAppContext } from '../context/AppContext';
import { fetchPlatforms } from '../services/api';
import { StreamingPlatform } from '../types';
import { DEFAULT_PLATFORM_NAMES } from '../data/platforms';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 390;

  const { theme, selectedPlatforms, toggleTheme, setSelectedPlatforms, clearPreferences } = useAppContext();
  const [platforms, setPlatforms] = useState<StreamingPlatform[]>(
    DEFAULT_PLATFORM_NAMES.map((name) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name
    }))
  );

  useEffect(() => {
    fetchPlatforms().then(setPlatforms).catch(() => {
      // Keep fallback list for manual selection.
    });
  }, []);

  function togglePlatform(name: string) {
    const currentSelected = Array.isArray(selectedPlatforms) ? selectedPlatforms : [];
    const exists = currentSelected.includes(name);
    const next = exists
      ? currentSelected.filter((platform) => platform !== name)
      : [...currentSelected, name];

    setSelectedPlatforms(next);
  }

  function handleClear() {
    Alert.alert('Limpar preferencias', 'Deseja resetar onboarding, tema e streams selecionados?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: () => clearPreferences() }
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}> 
      <Text style={[styles.heading, compact && styles.headingCompact]}>Configuracoes</Text>

      <View style={[styles.card, compact && styles.cardCompact]}>
        <Text style={styles.cardTitle}>Escolha suas plataformas</Text>
        <Text style={styles.cardSubtitle}>Somente os titulos dessas plataformas aparecerao no app.</Text>
        <View style={styles.rowWrap}>
          {platforms.map((platform) => (
            <PlatformChip
              key={platform.id}
              label={platform.name}
              selected={(Array.isArray(selectedPlatforms) ? selectedPlatforms : []).includes(platform.name)}
              onPress={() => togglePlatform(platform.name)}
            />
          ))}
        </View>
      </View>

      <View style={[styles.card, styles.themeCard, compact && styles.cardCompact]}>
        <Text style={styles.cardTitle}>Tema {theme === 'dark' ? 'escuro' : 'claro'}</Text>
        <Switch value={theme === 'dark'} onValueChange={toggleTheme} trackColor={{ false: '#94A3B8', true: '#6D5BFF' }} />
      </View>

      <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
        <Text style={styles.clearBtnText}>Limpar preferencias</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14'
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32
  },
  heading: {
    color: '#E7ECF6',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 14
  },
  headingCompact: {
    fontSize: 24
  },
  card: {
    backgroundColor: '#121A2B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A3550',
    padding: 14,
    marginBottom: 14
  },
  cardCompact: {
    padding: 12
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  cardTitle: {
    color: '#E7ECF6',
    fontWeight: '700',
    marginBottom: 8
  },
  cardSubtitle: {
    color: '#97A3BA',
    marginBottom: 12
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  clearBtn: {
    backgroundColor: '#31203E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  clearBtnText: {
    color: '#FCA5A5',
    fontWeight: '700'
  }
});
