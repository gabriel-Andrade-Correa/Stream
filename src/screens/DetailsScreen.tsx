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

  const links = useMemo(() => title?.deepLinks || [], [title]);
  const hasAnyDirectLink = useMemo(
    () => links.some((link) => link.directApp || link.directWeb),
    [links]
  );

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
        <Text style={styles.emptyText}>Titulo nao encontrado.</Text>
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
      <Text style={styles.overview}>{title.overview || 'Sem sinopse disponivel.'}</Text>

      <Text style={styles.sectionTitle}>Onde assistir</Text>
      <Text style={styles.linkHint}>
        {hasAnyDirectLink
          ? 'Algumas plataformas abrem direto no titulo.'
          : 'Link direto indisponivel para este titulo. Use a busca por plataforma.'}
      </Text>

      {links.map((link) => {
        const hasDirect = !!(link.directApp || link.directWeb);
        return (
          <View key={`${title.id}-${link.platform}`} style={styles.linkRow}>
            <Text style={styles.linkPlatform}>{link.platform}</Text>
            <Pressable
              style={[styles.button, !hasDirect && styles.secondaryButton, styles.rowButton]}
              onPress={() => (hasDirect ? openStreamingTitle(link) : openStreamingSearch(link))}
            >
              <Text style={styles.buttonText}>{hasDirect ? 'Abrir direto' : 'Buscar no app'}</Text>
            </Pressable>
          </View>
        );
      })}
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
  sectionTitle: {
    color: '#E7ECF6',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 20
  },
  linkHint: {
    color: '#97A3BA',
    marginTop: 6
  },
  linkRow: {
    marginTop: 12,
    backgroundColor: '#101826',
    borderRadius: 12,
    padding: 12
  },
  linkPlatform: {
    color: '#D6DEEE',
    fontWeight: '700',
    marginBottom: 8
  },
  button: {
    backgroundColor: '#6D5BFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22
  },
  rowButton: {
    marginTop: 0
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
