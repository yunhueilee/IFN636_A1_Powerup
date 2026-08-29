import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserRole } from '../../types';

interface RoleBadgeProps {
  role: UserRole;
}

const ROLE_LABELS: Record<UserRole, string> = {
  member: 'Recipient',
  instructor: 'Sharer',
};

const RoleBadge = ({ role }: RoleBadgeProps) => (
  <View style={styles.container}>
    <Text style={styles.roleText}>Role: {ROLE_LABELS[role]}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 2,
  },
  roleText: {
    fontSize: 15,
    color: '#4b4b52',
    fontWeight: '500',
  },
});

export default RoleBadge;
