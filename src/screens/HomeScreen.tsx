import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { fetchRecommendations, fetchTrending } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { SectionHeader } from '../components/SectionHeader';
import { TitleCard } from '../components/TitleCard';
import { TitleItem } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

export function HomeScreen({ navigation }: Props) {
  const { selectedPlatforms, continueWatching } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [trending, setTrending] = useState<TitleItem[]>([]);
  const [recommendations, setRecommendations] = useState<TitleItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [trendData, recData] = await Promise.all([fetchTrending(), fetchRecommendations()]);
        setTrending(trendData);
        setRecommendations(recData);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const continueItems = useMemo(
    () => trending.filter((item) => continueWatching.includes(item.id)).slice(0, 6),
    [trending, continueWatching]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Seu hub de streaming</Text>
      <Text style={styles.subheading}>Plataformas ativas: {selectedPlatforms.join(', ') || 'Nenhuma selecionada'}</Text>

      {loading && <ActivityIndicator color="#6D5BFF" size="large" style={{ marginTop: 24 }} />}

      {!loading && (
        <>
          <SectionHeader title="Em alta" />
          <FlatList
            horizontal
            data={trending}
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

          <SectionHeader title="Recomendações para você" />
          {recommendations.slice(0, 5).map((item) => (
            <TouchableOpacity
              key={`rec-${item.id}`}
              style={styles.rowCard}
              onPress={() => navigation.navigate('Details', { id: item.id })}
            >
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowMeta}>{item.availableOn.join(', ')}</Text>
            </TouchableOpacity>
          ))}
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
  }
});
