import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation';
import { fetchCatalogByPlatform, fetchMostWatched, fetchRecommendations, fetchTrending } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { SectionHeader } from '../components/SectionHeader';
import { TitleCard } from '../components/TitleCard';
import { TitleItem } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

type PlatformBrand = {
  mark: string;
};

const PLATFORM_BRANDING: Record<string, PlatformBrand> = {
  Netflix: { mark: 'N' },
  'HBO Max': { mark: 'H' },
  'Prime Video': { mark: 'P' },
  'Disney+': { mark: 'D' },
  'Apple TV+': { mark: 'A' }
};

function filterBySelectedPlatforms(items: TitleItem[], selected: string[]) {
  if (!selected.length) return [];
  return (Array.isArray(items) ? items : []).filter((item) =>
    (item.availableOn || []).some((platform) => selected.includes(platform))
  );
}

function dedupeByMediaAndId(items: TitleItem[]) {
  const map = new Map<string, TitleItem>();
  (items || []).forEach((item) => {
    const key = `${item.mediaType || item.type}:${item.id}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  });
  return Array.from(map.values());
}

function normalizePlatformName(name: string) {
  const aliasMap: Record<string, string> = {
    'HBO Max Amazon Channel': 'Prime Video',
    Max: 'HBO Max',
    'Netflix Standard with Ads': 'Netflix',
    'Amazon Prime Video': 'Prime Video',
    'Amazon Prime Video with Ads': 'Prime Video'
  };

  return aliasMap[name] || name;
}

function PlatformPill({ name }: { name: string }) {
  const normalized = normalizePlatformName(name);
  const branding = PLATFORM_BRANDING[normalized] || {
    mark: normalized.charAt(0).toUpperCase()
  };

  return (
    <View style={[styles.platformChip, styles.platformChipActive]}>
      <View style={styles.platformMark}>
        <Text style={styles.platformMarkText}>{branding.mark}</Text>
      </View>
      <Text style={styles.platformChipText}>{normalized}</Text>
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { selectedPlatforms } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [trending, setTrending] = useState<TitleItem[]>([]);
  const [mostWatched, setMostWatched] = useState<TitleItem[]>([]);
  const [recommendations, setRecommendations] = useState<TitleItem[]>([]);
  const [platformCatalog, setPlatformCatalog] = useState<Record<string, TitleItem[]>>({});
  const [catalogPageByPlatform, setCatalogPageByPlatform] = useState<Record<string, number>>({});
  const [catalogLoadingByPlatform, setCatalogLoadingByPlatform] = useState<Record<string, boolean>>({});
  const [catalogHasMoreByPlatform, setCatalogHasMoreByPlatform] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      try {
        const [trendData, mostWatchedData, recData] = await Promise.all([
          fetchTrending(),
          fetchMostWatched(),
          fetchRecommendations()
        ]);

        setTrending(Array.isArray(trendData) ? trendData : []);
        setMostWatched(Array.isArray(mostWatchedData) ? mostWatchedData : []);
        setRecommendations(Array.isArray(recData) ? recData : []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const selected = Array.isArray(selectedPlatforms) ? selectedPlatforms.map(normalizePlatformName) : [];
  const filteredTrending = useMemo(() => filterBySelectedPlatforms(trending, selected), [trending, selected]);
  const filteredMostWatched = useMemo(() => filterBySelectedPlatforms(mostWatched, selected), [mostWatched, selected]);
  const filteredRecommendations = useMemo(
    () => filterBySelectedPlatforms(recommendations, selected),
    [recommendations, selected]
  );

  const spotlight = useMemo(
    () => dedupeByMediaAndId([...filteredTrending, ...filteredMostWatched]).slice(0, 60),
    [filteredTrending, filteredMostWatched]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPlatformCatalog() {
      if (!selected.length) {
        setPlatformCatalog({});
        setCatalogPageByPlatform({});
        setCatalogLoadingByPlatform({});
        setCatalogHasMoreByPlatform({});
        return;
      }

      const entries = await Promise.all(
        selected.map(async (platform) => {
          try {
            const data = await fetchCatalogByPlatform(platform, 2, 220, 1);
            return [platform, Array.isArray(data) ? data : []] as const;
          } catch (error) {
            return [platform, []] as const;
          }
        })
      );

      if (!cancelled) {
        setPlatformCatalog(Object.fromEntries(entries));
        setCatalogPageByPlatform(Object.fromEntries(selected.map((platform) => [platform, 1])));
        setCatalogLoadingByPlatform(Object.fromEntries(selected.map((platform) => [platform, false])));
        setCatalogHasMoreByPlatform(
          Object.fromEntries(
            entries.map(([platform, titles]) => [platform, Array.isArray(titles) && titles.length > 0])
          )
        );
      }
    }

    loadPlatformCatalog();

    return () => {
      cancelled = true;
    };
  }, [selected.join('|')]);

  const catalogByPlatform = useMemo(() => {
    return selected
      .map((platform) => ({
        platform,
        titles: platformCatalog[platform] || []
      }))
      .filter((group) => group.titles.length > 0);
  }, [platformCatalog, selected]);

  async function loadMorePlatformCatalog(platform: string) {
    if (catalogLoadingByPlatform[platform] || catalogHasMoreByPlatform[platform] === false) return;

    const nextPage = (catalogPageByPlatform[platform] || 1) + 1;
    setCatalogLoadingByPlatform((prev) => ({ ...prev, [platform]: true }));

    try {
      const more = await fetchCatalogByPlatform(platform, 1, 180, nextPage);
      const normalizedMore = Array.isArray(more) ? more : [];
      setPlatformCatalog((prev) => ({
        ...prev,
        [platform]: dedupeByMediaAndId([...(prev[platform] || []), ...normalizedMore])
      }));
      if (normalizedMore.length === 0) {
        setCatalogHasMoreByPlatform((prev) => ({ ...prev, [platform]: false }));
      }
      setCatalogPageByPlatform((prev) => ({ ...prev, [platform]: nextPage }));
    } finally {
      setCatalogLoadingByPlatform((prev) => ({ ...prev, [platform]: false }));
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.heroCard, { marginTop: insets.top + 8 }]}> 
        <Text style={styles.heading}>Seu hub de streaming</Text>
        <Text style={styles.subheading}>Tudo que importa em um unico lugar</Text>
        <Text style={styles.metaLine}>Plataformas ativas: {selected.join(', ') || 'Nenhuma selecionada'}</Text>
      </View>

      {loading && <ActivityIndicator color="#6D5BFF" size="large" style={{ marginTop: 24 }} />}

      {!loading && (
        <>
          <SectionHeader title="Seus streamings" />
          <View style={styles.platformRow}>
            {selected.length ? (
              selected.map((name) => <PlatformPill key={`selected-${name}`} name={name} />)
            ) : (
              <Text style={styles.emptyText}>Selecione suas plataformas em Configuracoes para ver o catalogo.</Text>
            )}
          </View>

          {!!selected.length && (
            <>
              <SectionHeader title="Em alta agora" />
              <FlatList
                horizontal
                data={spotlight}
                keyExtractor={(item) => `${item.mediaType || item.type}-${item.id}`}
                renderItem={({ item }) => (
                  <TitleCard item={item} onPress={() => navigation.navigate('Details', { id: item.id, mediaType: item.mediaType })} />
                )}
                showsHorizontalScrollIndicator={false}
              />

              <SectionHeader title="Recomendados para voce" />
              <FlatList
                horizontal
                data={filteredRecommendations.slice(0, 40)}
                keyExtractor={(item) => `rec-${item.mediaType || item.type}-${item.id}`}
                renderItem={({ item }) => (
                  <TitleCard item={item} onPress={() => navigation.navigate('Details', { id: item.id, mediaType: item.mediaType })} />
                )}
                showsHorizontalScrollIndicator={false}
              />

              <SectionHeader title="Catalogo por plataforma" />
              {catalogByPlatform.map((group) => (
                <View key={`catalog-${group.platform}`} style={styles.catalogSection}>
                  <Text style={styles.catalogTitle}>{group.platform}</Text>
                  <FlatList
                    horizontal
                    data={group.titles}
                    keyExtractor={(item) => `${group.platform}-${item.mediaType || item.type}-${item.id}`}
                    renderItem={({ item }) => (
                      <TitleCard item={item} onPress={() => navigation.navigate('Details', { id: item.id, mediaType: item.mediaType })} />
                    )}
                    showsHorizontalScrollIndicator={false}
                    onEndReached={() => loadMorePlatformCatalog(group.platform)}
                    onEndReachedThreshold={0.6}
                  />
                  {catalogLoadingByPlatform[group.platform] && (
                    <ActivityIndicator color="#6D5BFF" style={{ marginTop: 10 }} />
                  )}
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
    backgroundColor: '#030303'
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32
  },
  heroCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12
  },
  heading: {
    color: '#E7ECF6',
    fontSize: 30,
    fontWeight: '800'
  },
  subheading: {
    color: '#B8C2D6',
    marginTop: 6,
    fontSize: 15
  },
  metaLine: {
    color: '#97A3BA',
    marginTop: 10,
    fontSize: 13
  },
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6
  },
  platformChip: {
    backgroundColor: '#0D0D0D',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  platformChipActive: {
    backgroundColor: '#111317'
  },
  platformMark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#080808',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6
  },
  platformMarkText: {
    color: '#E7ECF6',
    fontSize: 10,
    fontWeight: '800'
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
  catalogSection: {
    marginTop: 8
  },
  catalogTitle: {
    color: '#C7D2E9',
    fontWeight: '700',
    marginBottom: 8
  }
});
