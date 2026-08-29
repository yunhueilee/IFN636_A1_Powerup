import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen';
import BookingsScreen from '../screens/bookings/BookingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import InstructorClassManagementScreen from '../screens/classes/InstructorClassManagementScreen';
import { useAuth } from '../store';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  AvailableClasses: '📦',
  BookedClasses: '🗓️',
  Profile: '👤',
  ClassManagement: '📦',
};

const AppNavigator = () => {
  const { user } = useAuth();
  const isInstructor = user?.role === 'instructor';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1d1d1f',
        tabBarInactiveTintColor: '#a1a1aa',
        tabBarStyle: styles.tabBar,
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>{TAB_ICONS[route.name]}</Text>,
      })}
    >
      {isInstructor ? (
        <Tab.Screen name="ClassManagement" component={InstructorClassManagementScreen} options={{ tabBarLabel: 'Item Management' }} />
      ) : (
        <>
          <Tab.Screen name="AvailableClasses" component={HomeScreen} options={{ tabBarLabel: 'Available Items' }} />
          <Tab.Screen name="BookedClasses" component={BookingsScreen} options={{ tabBarLabel: 'Booked Items' }} />
        </>
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = {
  tabBar: {
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
  },
};

export default AppNavigator;
