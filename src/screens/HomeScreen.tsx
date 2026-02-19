import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { fetchPlatforms, fetchRecommendations, fetchTrending } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { SectionHeader } from '../components/SectionHeader';
import { TitleCard } from '../components/TitleCard';
import { StreamingPlatform, TitleItem } from '../types';
import { DEFAULT_PLATFORM_NAMES } from '../data/platforms';

type Props = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

function filterBySelectedPlatforms(items: TitleItem[], selected: string[]) {
  if (!selected.length) return [];
  return (Array.isArray(items) ? items : []).filter((item) =>
    (item.availableOn || []).some((platform) => selected.includes(platform))
  );
}

export function HomeScreen({ navigation }: Props) {
  const { selectedPlatforms, continueWatching } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [trending, setTrending] = useState<TitleItem[]>([]);
  const [recommendations, setRecommendations] = useState<TitleItem[]>([]);
  const [platforms, setPlatforms] = useState<StreamingPlatform[]>(
    DEFAULT_PLATFORM_NAMES.map((name) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name
    }))
  );

  useEffect(() => {
    async function load() {
      try {
        const [trendData, recData, platformData] = await Promise.all([
          fetchTrending(),
          fetchRecommendations(),
          fetchPlatforms().catch(() => [])
        ]);

        setTrending(Array.isArray(trendData) ? trendData : []);
        setRecommendations(Array.isArray(recData) ? recData : []);

        if (Array.isArray(platformData) && platformData.length) {
          setPlatforms(platformData);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const selected = Array.isArray(selectedPlatforms) ? selectedPlatforms : [];
  const filteredTrending = useMemo(() => filterBySelectedPlatforms(trending, selected), [trending, selected]);
  const filteredRecommendations = useMemo(
    () => filterBySelectedPlatforms(recommendations, selected),
    [recommendations, selected]
  );

  const continueItems = useMemo(
    () =>
      filteredTrending
        .filter((item) => (Array.isArray(continueWatching) ? continueWatching : []).includes(item.id))
        .slice(0, 6),
    [filteredTrending, continueWatching]
  );

  const catalogByPlatform = useMemo(() => {
    const source = filteredTrending;
    const map: Record<string, TitleItem[]> = {};

    source.forEach((item) => {
      (item.availableOn || []).forEach((platform) => {
        if (!selected.includes(platform)) return;
        if (!map[platform]) map[platform] = [];
        map[platform].push(item);
      });
    });

    return selected
      .map((platform) => ({
        platform,
        titles: (map[platform] || []).slice(0, 10)
      }))
      .filter((group) => group.titles.length > 0);
  }, [filteredTrending, selected]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Seu hub de streaming</Text>
      <Text style={styles.subheading}>Plataformas ativas: {selected.join(', ') || 'Nenhuma selecionada'}</Text>

      {loading && <ActivityIndicator color="#6D5BFF" size="large" style={{ marginTop: 24 }} />}

      {!loading && (
        <>
          <SectionHeader title="Seus streamings" />
          <View style={styles.platformRow}>
            {selected.length ? (
              selected.map((name) => (
                <View key={`selected-${name}`} style={[styles.platformChip, styles.platformChipActive]}>
                  <Text style={styles.platformChipText}>{name}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Selecione suas plataformas em Configuracoes para ver o catalogo.</Text>
            )}
          </View>

          <SectionHeader title="Plataformas disponiveis" />
          <View style={styles.platformRow}>
            {platforms.map((platform) => {
              const isSelected = selected.includes(platform.name);
              return (
                <View key={platform.id} style={[styles.platformChip, isSelected && styles.platformChipActive]}>
                  <Text style={styles.platformChipText}>{platform.name}</Text>
                </View>
              );
            })}
          </View>

          {!!selected.length && (
            <>
              <SectionHeader title="Em alta" />
              <FlatList
                horizontal
                data={filteredTrending}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TitleCard item={item} onPress={() => navigation.navigate('Details', { id: item.id })} />
                )}
                showsHorizontalScrollIndicator={false}
              />

              <SectionHeader title="Continuar assistindo" />
              <View style={styles.grid}>
                {continueItems.map((item) => (
                  <TitleCard
                    key={item.id}
                    compact
                    item={item}
                    onPress={() => navigation.navigate('Details', { id: item.id })}
                  />
                ))}
              </View>

              <SectionHeader title="Recomendacoes para voce" />
              {filteredRecommendations.slice(0, 5).map((item) => (
                <TouchableOpacity
                  key={`rec-${item.id}`}
                  style={styles.rowCard}
                  onPress={() => navigation.navigate('Details', { id: item.id })}
                >
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowMeta}>{(item.availableOn || []).join(', ')}</Text>
                </TouchableOpacity>
              ))}

              <SectionHeader title="Catalogo por plataforma" />
              {catalogByPlatform.map((group) => (
                <View key={`catalog-${group.platform}`} style={styles.catalogSection}>
                  <Text style={styles.catalogTitle}>{group.platform}</Text>
                  <FlatList
                    horizontal
                    data={group.titles}
                    keyExtractor={(item) => `${group.platform}-${item.id}`}
                    renderItem={({ item }) => (
                      <TitleCard item={item} onPress={() => navigation.navigate('Details', { id: item.id })} />
                    )}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
              ))}
            </>
          )}
        </>
      )}
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
    fontWeight: '800'
  },
  subheading: {
    color: '#97A3BA',
    marginTop: 6,
    marginBottom: 8
  },
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6
  },
  platformChip: {
    backgroundColor: '#192338',
    borderColor: '#2A3550',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8
  },
  platformChipActive: {
    backgroundColor: '#6D5BFF',
    borderColor: '#958AFF'
  },
  platformChipText: {
    color: '#E7ECF6',
    fontWeight: '600',
    fontSize: 12
  },
  emptyText: {
    color: '#97A3BA',
    marginBottom: 8
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  rowCard: {
    backgroundColor: '#121A2B',
    borderColor: '#2A3550',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10
  },
  rowTitle: {
    color: '#E7ECF6',
    fontSize: 15,
    fontWeight: '700'
  },
  rowMeta: {
    color: '#97A3BA',
    marginTop: 4
  },
  catalogSection: {
    marginTop: 8
  },
  catalogTitle: {
    color: '#C7D2E9',
    fontWeight: '700',
    marginBottom: 8
  }
});
