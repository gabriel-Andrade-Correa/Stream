import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

export function PlatformChip({
  label,
  selected,
  onPress
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, selected && styles.active]} onPress={onPress}>
      <Text style={[styles.text, selected && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#192338',
    borderWidth: 1,
    borderColor: '#2A3550',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8
  },
  active: {
    backgroundColor: '#6D5BFF',
    borderColor: '#9A8EFF'
  },
  text: {
    color: '#E7ECF6',
    fontSize: 13,
    fontWeight: '600'
  },
  activeText: {
    color: '#FFFFFF'
  }
});
