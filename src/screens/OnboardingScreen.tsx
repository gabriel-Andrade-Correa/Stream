import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '../context/AppContext';

export function OnboardingScreen() {
  const { setOnboarded } = useAppContext();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Encontre qualquer filme ou série em segundos</Text>
      <Text style={styles.description}>
        Veja catálogo unificado, descubra tendências e abra o conteúdo direto no app oficial.
      </Text>
      <Pressable style={styles.button} onPress={() => setOnboarded(true)}>
        <Text style={styles.buttonText}>Começar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14',
    justifyContent: 'center',
    padding: 24
  },
  title: {
    color: '#E7ECF6',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38
  },
  description: {
    marginTop: 16,
    color: '#97A3BA',
    fontSize: 16,
    lineHeight: 24
  },
  button: {
    marginTop: 28,
    backgroundColor: '#6D5BFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  }
});
