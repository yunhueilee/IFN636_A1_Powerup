import React, { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../store';
import { bookClass, cancelBooking, getClasses } from '../../services/api/classService';
import { FitnessClass } from '../../types';
import WelcomeSection from '../../components/common/WelcomeSection';
import RoleBadge from '../../components/common/RoleBadge';
import ClassList from '../../components/class/ClassList';
import { LoadingState, ErrorState } from '../../components/common/StateViews';

const HomeScreen = () => {
  const { user, token } = useAuth();
  const [classes, setClasses] = useState<FitnessClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingClassId, setProcessingClassId] = useState<string | null>(null);

  const fetchClasses = useCallback(
    async (isRefresh = false) => {
      if (!token) return;

      try {
        isRefresh ? setRefreshing(true) : setIsLoading(true);
        setError(null);
        const data = await getClasses(token);
        setClasses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load items');
      } finally {
        isRefresh ? setRefreshing(false) : setIsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useFocusEffect(
    useCallback(() => {
      fetchClasses(true);
    }, [fetchClasses])
  );

  const handleBook = async (classId: string) => {
    if (!token) return;
    try {
      setProcessingClassId(classId);
      await bookClass(token, classId);
      await fetchClasses(true);
    } catch (err) {
      Alert.alert('Booking failed', err instanceof Error ? err.message : 'Unable to book item');
    } finally {
      setProcessingClassId(null);
    }
  };

  const handleCancel = async (classId: string) => {
    if (!token) return;
    try {
      setProcessingClassId(classId);
      await cancelBooking(token, classId);
      await fetchClasses(true);
    } catch (err) {
      Alert.alert('Cancellation failed', err instanceof Error ? err.message : 'Unable to cancel booking');
    } finally {
      setProcessingClassId(null);
    }
  };

  const emptyMessage =
    user?.role === 'instructor'
      ? 'You have no items yet.'
      : 'No items are available to book right now.';

  // Booked items belong in the Booked Items tab, not Available Items
  const availableClasses =
    user?.role === 'member' ? classes.filter((fitnessClass) => !fitnessClass.isBooked) : classes;

  return (
    <SafeAreaView style={styles.container}>
      {!!user && (
        <>
          <WelcomeSection name={user.name} />
          <RoleBadge role={user.role} />
        </>
      )}

      {isLoading ? (
        <LoadingState message="Loading classes…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <ClassList
          classes={availableClasses}
          emptyMessage={emptyMessage}
          refreshing={refreshing}
          onRefresh={() => fetchClasses(true)}
          canBook={user?.role === 'member'}
          processingClassId={processingClassId}
          onBook={handleBook}
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
});

export default HomeScreen;
