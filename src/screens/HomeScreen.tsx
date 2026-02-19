import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation';
import { fetchCatalogByPlatform, fetchRecommendations, fetchTrending } from '../services/api';
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

const CARD_FULL_WIDTH = 192;

function getCardItemLayout(_: ArrayLike<TitleItem> | null | undefined, index: number) {
  return {
    length: CARD_FULL_WIDTH,
    offset: CARD_FULL_WIDTH * index,
    index
  };
}

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

function StreamLogo() {
  const shineX = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shineX, {
        toValue: 260,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );

    loop.start();
    return () => loop.stop();
  }, [shineX]);

  return (
    <View style={styles.logoShell}>
      <View style={styles.logoWrap}>
        <View style={styles.logoIcon}>
          <View style={styles.logoStrokeTop} />
          <View style={styles.logoStrokeBottom} />
        </View>
        <Text style={styles.logoText}>stream</Text>
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.logoShine,
          {
            transform: [{ translateX: shineX }, { rotate: '18deg' }]
          }
        ]}
      />
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { selectedPlatforms } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [trending, setTrending] = useState<TitleItem[]>([]);
  const [recommendations, setRecommendations] = useState<TitleItem[]>([]);
  const [platformCatalog, setPlatformCatalog] = useState<Record<string, TitleItem[]>>({});
  const [catalogPageByPlatform, setCatalogPageByPlatform] = useState<Record<string, number>>({});
  const [catalogLoadingByPlatform, setCatalogLoadingByPlatform] = useState<Record<string, boolean>>({});
  const [catalogHasMoreByPlatform, setCatalogHasMoreByPlatform] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      try {
        const [trendData, recData] = await Promise.all([fetchTrending(), fetchRecommendations()]);

        setTrending(Array.isArray(trendData) ? trendData : []);
        setRecommendations(Array.isArray(recData) ? recData : []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const selected = Array.isArray(selectedPlatforms) ? selectedPlatforms.map(normalizePlatformName) : [];
  const filteredTrending = useMemo(() => filterBySelectedPlatforms(trending, selected), [trending, selected]);
  const filteredRecommendations = useMemo(
    () => filterBySelectedPlatforms(recommendations, selected),
    [recommendations, selected]
  );

  const spotlight = useMemo(() => dedupeByMediaAndId(filteredTrending).slice(0, 80), [filteredTrending]);

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
            const data = await fetchCatalogByPlatform(platform, 1, 100, 1);
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
      const more = await fetchCatalogByPlatform(platform, 1, 120, nextPage);
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

  const openDetails = useCallback(
    (item: TitleItem) => navigation.navigate('Details', { id: item.id, mediaType: item.mediaType }),
    [navigation]
  );

  const renderTitleCard = useCallback(
    ({ item }: { item: TitleItem }) => <TitleCard item={item} onPress={() => openDetails(item)} />,
    [openDetails]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.brandHeader, { marginTop: insets.top + 10 }]}>
        <StreamLogo />
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
                renderItem={renderTitleCard}
                showsHorizontalScrollIndicator={false}
                removeClippedSubviews
                initialNumToRender={6}
                maxToRenderPerBatch={6}
                windowSize={5}
                getItemLayout={getCardItemLayout}
              />

              <SectionHeader title="Recomendados para voce" />
              <FlatList
                horizontal
                data={filteredRecommendations.slice(0, 40)}
                keyExtractor={(item) => `rec-${item.mediaType || item.type}-${item.id}`}
                renderItem={renderTitleCard}
                showsHorizontalScrollIndicator={false}
                removeClippedSubviews
                initialNumToRender={6}
                maxToRenderPerBatch={6}
                windowSize={5}
                getItemLayout={getCardItemLayout}
              />

              <SectionHeader title="Catalogo por plataforma" />
              {catalogByPlatform.map((group) => (
                <View key={`catalog-${group.platform}`} style={styles.catalogSection}>
                  <Text style={styles.catalogTitle}>{group.platform}</Text>
                  <FlatList
                    horizontal
                    data={group.titles}
                    keyExtractor={(item) => `${group.platform}-${item.mediaType || item.type}-${item.id}`}
                    renderItem={renderTitleCard}
                    showsHorizontalScrollIndicator={false}
                    onEndReached={() => loadMorePlatformCatalog(group.platform)}
                    onEndReachedThreshold={0.6}
                    removeClippedSubviews
                    initialNumToRender={8}
                    maxToRenderPerBatch={8}
                    windowSize={6}
                    getItemLayout={getCardItemLayout}
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
  brandHeader: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoShell: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 14
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4
  },
  logoIcon: {
    width: 28,
    height: 28,
    marginRight: 12,
    justifyContent: 'space-between'
  },
  logoStrokeTop: {
    height: 11,
    borderRadius: 8,
    backgroundColor: '#9BB8FF',
    transform: [{ skewX: '-24deg' }]
  },
  logoStrokeBottom: {
    height: 11,
    borderRadius: 8,
    backgroundColor: '#6D5BFF',
    transform: [{ skewX: '-24deg' }]
  },
  logoText: {
    color: '#F2F6FF',
    fontSize: 33,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'lowercase'
  },
  logoShine: {
    position: 'absolute',
    top: -12,
    bottom: -12,
    width: 34,
    backgroundColor: '#F3D06B',
    opacity: 0.22
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
