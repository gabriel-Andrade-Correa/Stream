import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export function SplashScreen() {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 900, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.logo, { opacity: fade }]}>StreamHub</Animated.Text>
      <Text style={styles.subtitle}>Todos os streamings em um só lugar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#070B14'
  },
  logo: {
    color: '#6D5BFF',
    fontSize: 42,
    fontWeight: '800'
  },
  subtitle: {
    marginTop: 8,
    color: '#97A3BA',
    fontSize: 14
  }
});
