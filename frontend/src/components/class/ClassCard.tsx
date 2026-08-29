import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { FitnessClass } from '../../types';

interface ClassCardProps {
  fitnessClass: FitnessClass;
  canBook?: boolean;
  isProcessing?: boolean;
  onBook?: () => void;
  onCancel?: () => void;
  onViewMembers?: () => void;
  onEdit?: () => void;
  onCancelClass?: () => void;
  isEditing?: boolean;
}

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (date: Date): string =>
  date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

const formatTimeRange = (isoDate: string, durationMinutes: number): string => {
  const start = new Date(isoDate);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return `${formatTime(start)} - ${formatTime(end)}`;
};

const renderStars = (intensity: number): string => '★'.repeat(intensity) + '☆'.repeat(5 - intensity);

const ClassCard = ({
  fitnessClass,
  canBook = false,
  isProcessing = false,
  onBook,
  onCancel,
  onViewMembers,
  onEdit,
  onCancelClass,
  isEditing = false,
}: ClassCardProps) => {
  const instructorName =
    typeof fitnessClass.instructor === 'string' ? '' : fitnessClass.instructor?.name;
  const isFull = fitnessClass.bookedCount >= fitnessClass.capacity;

  return (
    <View style={[styles.card, isEditing && styles.editingCard]}>
      <Text style={styles.title}>{fitnessClass.title}</Text>
      {fitnessClass.status === 'cancelled' && (
        <Text style={styles.cancelled}>Item Cancelled{fitnessClass.cancellationReason ? `: ${fitnessClass.cancellationReason}` : ''}</Text>
      )}
      <Text style={styles.meta}>{formatDate(fitnessClass.scheduledAt)}</Text>
      <Text style={styles.meta}>{formatTimeRange(fitnessClass.scheduledAt, fitnessClass.durationMinutes)}</Text>
      {!!fitnessClass.location && <Text style={styles.meta}>{fitnessClass.location}</Text>}
      {!!instructorName && <Text style={styles.meta}>Sharer: {instructorName}</Text>}
      <Text style={styles.meta}>
        Available: {fitnessClass.bookedCount}/{fitnessClass.capacity}
      </Text>
    
      {/* <Text style={styles.meta}>Intensity: {renderStars(fitnessClass.intensity)}</Text> */}
      {!!fitnessClass.description && <Text style={styles.description}>{fitnessClass.description}</Text>}

      {canBook && fitnessClass.status !== 'cancelled' && (
        <Pressable
          style={[
            styles.button,
            fitnessClass.isBooked ? styles.cancelButton : isFull ? styles.disabledButton : styles.bookButton,
          ]}
          disabled={isProcessing || (!fitnessClass.isBooked && isFull)}
          onPress={fitnessClass.isBooked ? onCancel : onBook}
        >
          {isProcessing ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {fitnessClass.isBooked ? 'Cancel Booking' : isFull ? 'Class Full' : 'Book Item'}
            </Text>
          )}
        </Pressable>
      )}
      {!!onViewMembers && (
        <View style={styles.actions}>
          <Pressable style={[styles.actionButton, styles.secondaryButton]} onPress={onViewMembers}>
            <Text style={styles.buttonText}>View Recipients</Text>
          </Pressable>
          {fitnessClass.status === 'active' && (
            <Pressable style={[styles.actionButton, styles.secondaryButton]} onPress={onEdit}>
              <Text style={styles.buttonText}>Edit</Text>
            </Pressable>
          )}
          {fitnessClass.status === 'active' && (
            <Pressable style={[styles.actionButton, styles.cancelButton]} onPress={onCancelClass}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  editingCard: {
    borderWidth: 2,
    borderColor: '#8a2be2',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: '#6b6b70',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: '#3a3a3d',
    marginTop: 6,
  },
  button: {
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButton: {
    backgroundColor: '#8a2be2',
  },
  cancelButton: {
    backgroundColor: '#d64545',
  },
  disabledButton: {
    backgroundColor: '#c7c7cc',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#8a2be2',
  },
  cancelled: {
    color: '#b42318',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
});

export default ClassCard;
