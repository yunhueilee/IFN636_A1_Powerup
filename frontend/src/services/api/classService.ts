import { authorizedFetch } from './client';
import { ClassMember, FitnessClass } from '../../types';

export const getClasses = async (token: string): Promise<FitnessClass[]> => {
  const response = await authorizedFetch('/classes', token);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to load items');
  }

  return data.classes;
};

export const bookClass = async (token: string, classId: string): Promise<void> => {
  const response = await authorizedFetch('/bookings', token, {
    method: 'POST',
    body: JSON.stringify({ classId }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to book items');
  }
};

export const cancelBooking = async (token: string, classId: string): Promise<void> => {
  const response = await authorizedFetch(`/bookings/${classId}`, token, {
    method: 'DELETE',
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to cancel booking');
  }
};

export interface ClassPayload {
  title: string;
  description: string;
  scheduledAt: string;
  durationMinutes: number;
  location: string;
  capacity: number;
  intensity: number;
}

const readClassResponse = async (response: Response): Promise<FitnessClass> => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Unable to save item');
  return data.class;
};

export const createClass = async (token: string, payload: ClassPayload): Promise<FitnessClass> =>
  readClassResponse(await authorizedFetch('/classes', token, { method: 'POST', body: JSON.stringify(payload) }));

export const updateClass = async (token: string, classId: string, payload: ClassPayload): Promise<FitnessClass> =>
  readClassResponse(await authorizedFetch(`/classes/${classId}`, token, { method: 'PATCH', body: JSON.stringify(payload) }));

export const cancelClass = async (token: string, classId: string, reason: string): Promise<void> => {
  const response = await authorizedFetch(`/classes/${classId}/cancel`, token, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Unable to cancel item');
};

export const getClassMembers = async (token: string, classId: string): Promise<ClassMember[]> => {
  const response = await authorizedFetch(`/classes/${classId}/members`, token);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Unable to load recipients');
  return data.members;
};
