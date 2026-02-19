import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { TitleItem } from '../types';

export function TitleCard({
  item,
  onPress,
  compact
}: {
  item: TitleItem;
  onPress: () => void;
  compact?: boolean;
}) {
  const hasDirectLink = (item.deepLinks || []).some((link) => link.directApp || link.directWeb);

  return (
    <Pressable style={[styles.card, compact && styles.compact]} onPress={onPress}>
      {item.poster ? (
        <Image source={{ uri: item.poster }} style={[styles.poster, compact && styles.compactPoster]} />
      ) : (
        <View style={[styles.poster, styles.placeholder, compact && styles.compactPoster]}>
          <Text style={styles.placeholderText}>Sem imagem</Text>
        </View>
      )}
      <Text numberOfLines={2} style={styles.title}>
        {item.title}
      </Text>
      <View style={[styles.badge, hasDirectLink ? styles.badgeDirect : styles.badgeSearch]}>
        <Text style={styles.badgeText}>{hasDirectLink ? 'Abre direto' : 'Via busca'}</Text>
      </View>
      <Text numberOfLines={1} style={styles.meta}>
        {item.type.toUpperCase()} • {item.availableOn?.join(', ')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 180,
    marginRight: 12
  },
  compact: {
    width: '48%',
    marginRight: 0,
    marginBottom: 14
  },
  poster: {
    width: '100%',
    height: 230,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#1A243A'
  },
  compactPoster: {
    height: 180
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  placeholderText: {
    color: '#97A3BA'
  },
  title: {
    color: '#E7ECF6',
    fontWeight: '700',
    fontSize: 14
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  badgeDirect: {
    backgroundColor: '#1F3A63'
  },
  badgeSearch: {
    backgroundColor: '#30374A'
  },
  badgeText: {
    color: '#D9E4FA',
    fontSize: 10,
    fontWeight: '700'
  },
  meta: {
    color: '#97A3BA',
    marginTop: 4,
    fontSize: 12
  }
});
