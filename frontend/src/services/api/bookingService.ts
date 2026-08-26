import { authorizedFetch } from './client';
import { Booking } from '../../types';

// FCBS-18
export const getMyBookings = async (token: string): Promise<Booking[]> => {
  const response = await authorizedFetch('/bookings/me', token);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to load bookings');
  }

  return data.bookings;
};
