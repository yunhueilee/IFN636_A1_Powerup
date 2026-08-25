import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../store';
import RoleBadge from '../../components/common/RoleBadge';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{user.name}</Text>
        <RoleBadge role={user.role} />
        <Text style={styles.meta}>{user.email}</Text>
        <Text style={styles.meta}>{user.phone}</Text>
      </View>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    color: '#6b6b70',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#8a2be2',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
