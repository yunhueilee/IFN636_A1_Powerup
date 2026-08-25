import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface StateViewProps {
  message: string;
}

export const LoadingState = ({ message = 'Loading…' }: Partial<StateViewProps>) => (
  <View style={styles.container}>
    <ActivityIndicator color="#8a2be2" />
    <Text style={styles.text}>{message}</Text>
  </View>
);

export const EmptyState = ({ message }: StateViewProps) => (
  <View style={styles.container}>
    <Text style={styles.text}>{message}</Text>
  </View>
);

export const ErrorState = ({ message }: StateViewProps) => (
  <View style={styles.container}>
    <Text style={[styles.text, styles.errorText]}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  text: {
    marginTop: 8,
    fontSize: 15,
    color: '#6b6b70',
    textAlign: 'center',
  },
  errorText: {
    color: '#c0392b',
  },
});
