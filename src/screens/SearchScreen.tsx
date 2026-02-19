import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation';
import { searchTitles } from '../services/api';
import { TitleItem } from '../types';
import { useAppContext } from '../context/AppContext';
import { TitleCard } from '../components/TitleCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

export function SearchScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 390;

  const { selectedPlatforms } = useAppContext();
  const selected = Array.isArray(selectedPlatforms) ? selectedPlatforms : [];
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'filme' | 'serie'>('all');
  const [results, setResults] = useState<TitleItem[]>([]);
  const requestIdRef = useRef(0);

  async function performSearch(rawQuery: string) {
    const normalized = rawQuery.trim();
    if (!normalized) {
      setResults([]);
      setError('');
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError('');
    try {
      const data = await searchTitles(normalized);
      if (requestIdRef.current === requestId) {
        setResults(data);
      }
    } catch (err) {
      if (requestIdRef.current === requestId) {
        setResults([]);
        setError('Nao foi possivel buscar agora. Tente novamente.');
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }

  async function handleSearch() {
    await performSearch(query);
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setError('');
      setLoading(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(trimmed);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const filteredByType = useMemo(
    () => (Array.isArray(results) ? results : []).filter((item) => (filter === 'all' ? true : item.type === filter)),
    [results, filter]
  );

  const filtered = useMemo(() => {
    if (!selected.length) return [];

    return filteredByType.filter((item) =>
      (item.availableOn || []).some((platform) => selected.includes(platform))
    );
  }, [filteredByType, selected]);

  const grouped = useMemo(() => {
    const acc: Record<string, TitleItem[]> = {};
    filtered.forEach((item) => {
      (item.availableOn || [])
        .filter((platform) => !selected.length || selected.includes(platform))
        .forEach((platform) => {
          if (!acc[platform]) acc[platform] = [];
          acc[platform].push(item);
        });
    });
    return acc;
  }, [filtered, selected]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}> 
      <Text style={styles.heading}>Busca global</Text>
      {!!selected.length && <Text style={styles.platformHint}>Filtrando por: {selected.join(', ')}</Text>}

      <View style={[styles.searchRow, compact && styles.searchRowCompact]}>
        <TextInput
          style={[styles.input, compact && styles.inputCompact]}
          placeholder="Ex: The Last of Us"
          placeholderTextColor="#97A3BA"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={[styles.searchBtn, compact && styles.searchBtnCompact]} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        {['all', 'filme', 'serie'].map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.filterBtn, filter === opt && styles.filterBtnActive]}
            onPress={() => setFilter(opt as 'all' | 'filme' | 'serie')}
          >
            <Text style={styles.filterText}>{opt.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <ActivityIndicator color="#6D5BFF" style={{ marginTop: 16 }} />}
      {!!error && <Text style={styles.emptyText}>{error}</Text>}

      <ScrollView contentContainerStyle={styles.results}>
        {Object.entries(grouped).map(([platform, items]) => (
          <View key={platform} style={styles.groupCard}>
            <Text style={styles.groupTitle}>{platform}</Text>
            <FlatList
              horizontal
              data={items.slice(0, 20)}
              keyExtractor={(item) => `${platform}-${item.id}`}
              renderItem={({ item }) => (
                <TitleCard
                  item={item}
                  onPress={() => navigation.navigate('Details', { id: item.id, mediaType: item.mediaType })}
                />
              )}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        ))}
        {!loading && !!query.trim() && Object.keys(grouped).length === 0 && (
          <Text style={styles.emptyText}>Nenhum resultado para as plataformas selecionadas.</Text>
        )}
        {!loading && !selected.length && (
          <Text style={styles.emptyText}>Selecione pelo menos uma plataforma em Configuracoes.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14',
    paddingHorizontal: 16
  },
  heading: {
    color: '#E7ECF6',
    fontSize: 28,
    fontWeight: '800'
  },
  platformHint: {
    color: '#97A3BA',
    marginTop: 6
  },
  searchRow: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center'
  },
  searchRowCompact: {
    flexDirection: 'column',
    alignItems: 'stretch'
  },
  input: {
    flex: 1,
    backgroundColor: '#121A2B',
    borderColor: '#2A3550',
    borderWidth: 1,
    borderRadius: 12,
    color: '#E7ECF6',
    paddingHorizontal: 12,
    height: 48
  },
  inputCompact: {
    width: '100%'
  },
  searchBtn: {
    marginLeft: 10,
    backgroundColor: '#6D5BFF',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 14,
    height: 48
  },
  searchBtnCompact: {
    marginLeft: 0,
    marginTop: 8,
    alignItems: 'center'
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  filters: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 8
  },
  filterBtn: {
    backgroundColor: '#121A2B',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 8
  },
  filterBtnActive: {
    backgroundColor: '#6D5BFF'
  },
  filterText: {
    color: '#E7ECF6',
    fontWeight: '600',
    fontSize: 12
  },
  results: {
    paddingBottom: 32
  },
  groupCard: {
    backgroundColor: '#121A2B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3550',
    padding: 12,
    marginTop: 12
  },
  groupTitle: {
    color: '#6D5BFF',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 10
  },
  emptyText: {
    color: '#97A3BA',
    marginTop: 16
  }
});
