import React, { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../store';
import { getMyBookings } from '../../services/api/bookingService';
import { cancelBooking } from '../../services/api/classService';
import { Booking } from '../../types';
import ClassList from '../../components/class/ClassList';
import { LoadingState, ErrorState } from '../../components/common/StateViews';

const BookingsScreen = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingClassId, setProcessingClassId] = useState<string | null>(null);

  const fetchBookings = useCallback(
    async (isRefresh = false) => {
      if (!token) return;

      try {
        isRefresh ? setRefreshing(true) : setIsLoading(true);
        setError(null);
        const data = await getMyBookings(token);
        setBookings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load items');
      } finally {
        isRefresh ? setRefreshing(false) : setIsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useFocusEffect(
    useCallback(() => {
      fetchBookings(true);
    }, [fetchBookings])
  );

  const handleCancel = async (classId: string) => {
    if (!token) return;
    try {
      setProcessingClassId(classId);
      await cancelBooking(token, classId);
      await fetchBookings(true);
    } catch (err) {
      Alert.alert('Cancellation failed', err instanceof Error ? err.message : 'Unable to cancel booking');
    } finally {
      setProcessingClassId(null);
    }
  };

  const bookedClasses = bookings.map((booking) => booking.fitnessClass);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Booked Items</Text>

      {isLoading ? (
        <LoadingState message="Loading bookings…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <ClassList
          classes={bookedClasses}
          emptyMessage="You haven't booked any items yet."
          refreshing={refreshing}
          onRefresh={() => fetchBookings(true)}
          canBook
          processingClassId={processingClassId}
          onCancel={handleCancel}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    paddingTop: 12,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
});

export default BookingsScreen;
