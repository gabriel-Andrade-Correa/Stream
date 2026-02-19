import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { fetchTitle } from '../services/api';
import { TitleItem } from '../types';
import { openStreamingSearch, openStreamingTitle } from '../utils/deeplink';

type Props = NativeStackScreenProps<RootStackParamList, 'Details'>;

export function DetailsScreen({ route }: Props) {
  const { id, mediaType } = route.params;
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState<TitleItem | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchTitle(id, mediaType);
        setTitle(data);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, mediaType]);

  const firstLink = useMemo(() => title?.deepLinks?.[0], [title]);
  const hasDirectLink = !!(firstLink?.directApp || firstLink?.directWeb);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6D5BFF" />
      </View>
    );
  }

  if (!title) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Título não encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {title.poster ? (
        <Image source={{ uri: title.poster }} style={styles.poster} />
      ) : (
        <View style={[styles.poster, styles.posterPlaceholder]}>
          <Text style={styles.emptyText}>Sem imagem</Text>
        </View>
      )}

      <Text style={styles.title}>{title.title}</Text>
      <Text style={styles.meta}>{title.type.toUpperCase()} • {(title.availableOn || []).join(', ')}</Text>
      <Text style={styles.overview}>{title.overview || 'Sem sinopse disponível.'}</Text>

      {!!firstLink && hasDirectLink && (
        <Pressable style={styles.button} onPress={() => openStreamingTitle(firstLink)}>
          <Text style={styles.buttonText}>Abrir titulo no streaming</Text>
        </Pressable>
      )}

      {!!firstLink && (
        <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => openStreamingSearch(firstLink)}>
          <Text style={styles.buttonText}>Buscar no streaming</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14',
    padding: 16
  },
  center: {
    flex: 1,
    backgroundColor: '#070B14',
    alignItems: 'center',
    justifyContent: 'center'
  },
  poster: {
    width: '100%',
    height: 420,
    borderRadius: 16,
    backgroundColor: '#121A2B'
  },
  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    color: '#E7ECF6',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 16
  },
  meta: {
    color: '#97A3BA',
    marginTop: 8
  },
  overview: {
    color: '#D6DEEE',
    lineHeight: 22,
    marginTop: 16
  },
  button: {
    backgroundColor: '#6D5BFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22
  },
  secondaryButton: {
    backgroundColor: '#243654',
    marginTop: 10
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  emptyText: {
    color: '#97A3BA'
  }
});
