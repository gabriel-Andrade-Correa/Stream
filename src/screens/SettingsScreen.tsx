import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { PlatformChip } from '../components/PlatformChip';
import { useAppContext } from '../context/AppContext';
import { fetchPlatforms } from '../services/api';
import { StreamingPlatform } from '../types';

export function SettingsScreen() {
  const { theme, selectedPlatforms, toggleTheme, setSelectedPlatforms, clearPreferences } = useAppContext();
  const [platforms, setPlatforms] = useState<StreamingPlatform[]>([]);

  useEffect(() => {
    fetchPlatforms().then(setPlatforms).catch(() => setPlatforms([]));
  }, []);

  function togglePlatform(name: string) {
    const exists = selectedPlatforms.includes(name);
    const next = exists
      ? selectedPlatforms.filter((platform) => platform !== name)
      : [...selectedPlatforms, name];

    setSelectedPlatforms(next);
  }

  function handleClear() {
    Alert.alert('Limpar preferências', 'Deseja resetar onboarding, tema e streams selecionados?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: () => clearPreferences() }
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Configurações</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meus streamings</Text>
        <View style={styles.rowWrap}>
          {platforms.map((platform) => (
            <PlatformChip
              key={platform.id}
              label={platform.name}
              selected={selectedPlatforms.includes(platform.name)}
              onPress={() => togglePlatform(platform.name)}
            />
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tema {theme === 'dark' ? 'escuro' : 'claro'}</Text>
        <Switch value={theme === 'dark'} onValueChange={toggleTheme} trackColor={{ false: '#94A3B8', true: '#6D5BFF' }} />
      </View>

      <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
        <Text style={styles.clearBtnText}>Limpar preferências</Text>
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
    padding: 16,
    paddingBottom: 32
  },
  heading: {
    color: '#E7ECF6',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 14
  },
  card: {
    backgroundColor: '#121A2B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A3550',
    padding: 14,
    marginBottom: 14
  },
  cardTitle: {
    color: '#E7ECF6',
    fontWeight: '700',
    marginBottom: 10
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
