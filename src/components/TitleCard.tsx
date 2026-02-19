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
  meta: {
    color: '#97A3BA',
    marginTop: 4,
    fontSize: 12
  }
});
