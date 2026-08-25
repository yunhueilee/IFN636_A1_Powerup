import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface WelcomeSectionProps {
  name: string;
}

const WelcomeSection = ({ name }: WelcomeSectionProps) => (
  <View style={styles.container}>
    <Text style={styles.welcomeText}>Welcome, {name}. Nice to see you today!</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
  },
});

export default WelcomeSection;
