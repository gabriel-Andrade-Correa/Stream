import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

export function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 10,
    marginTop: 14
  },
  title: {
    color: '#E7ECF6',
    fontSize: 20,
    fontWeight: '700'
  }
});
