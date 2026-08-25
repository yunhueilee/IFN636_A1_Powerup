export type UserRole = 'member' | 'instructor';

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
}

export interface FitnessClass {
  _id: string;
  title: string;
  description: string;
  instructor: { _id: string; name: string; email: string } | string;
  scheduledAt: string;
  durationMinutes: number;
  location: string;
  capacity: number;
  intensity: number;
  visibility: 'public' | 'private';
  status: 'active' | 'cancelled';
  cancellationReason?: string;
  bookedCount: number;
  isBooked: boolean;
}

export interface Booking {
  _id: string;
  user: string;
  fitnessClass: FitnessClass;
  status: 'booked' | 'cancelled';
  bookedAt: string;
}

export interface ClassMember {
  _id: string;
  status: 'booked' | 'cancelled';
  bookedAt: string;
  user: { name: string; phone: string; email: string };
}
