import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { searchTitles } from '../services/api';
import { TitleItem } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

export function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'filme' | 'serie'>('all');
  const [results, setResults] = useState<TitleItem[]>([]);

  async function handleSearch() {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await searchTitles(query);
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(
    () => results.filter((item) => (filter === 'all' ? true : item.type === filter)),
    [results, filter]
  );

  const grouped = useMemo(() => {
    const acc: Record<string, TitleItem[]> = {};
    filtered.forEach((item) => {
      item.availableOn.forEach((platform) => {
        if (!acc[platform]) acc[platform] = [];
        acc[platform].push(item);
      });
    });
    return acc;
  }, [filtered]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Busca global</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Ex: The Last of Us"
          placeholderTextColor="#97A3BA"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
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

      <ScrollView contentContainerStyle={styles.results}>
        {Object.entries(grouped).map(([platform, items]) => (
          <View key={platform} style={styles.groupCard}>
            <Text style={styles.groupTitle}>{platform}</Text>
            {items.slice(0, 8).map((item) => (
              <TouchableOpacity key={`${platform}-${item.id}`} onPress={() => navigation.navigate('Details', { id: item.id })}>
                <Text style={styles.itemTitle}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14',
    padding: 16
  },
  heading: {
    color: '#E7ECF6',
    fontSize: 28,
    fontWeight: '800'
  },
  searchRow: {
    flexDirection: 'row',
    marginTop: 12
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
  searchBtn: {
    marginLeft: 10,
    backgroundColor: '#6D5BFF',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 14
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
  itemTitle: {
    color: '#E7ECF6',
    paddingVertical: 4
  }
});
