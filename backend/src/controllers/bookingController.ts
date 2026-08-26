import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { BookingError, cancelBooking, createBooking, getBookingsForUser } from '../services/bookingService';

export const getMyBookings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const bookings = await getBookingsForUser(req.user.id);
    res.status(200).json({ bookings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load bookings';
    res.status(500).json({ message });
  }
};

export const bookClass = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    if (req.user.role !== 'member') {
      res.status(403).json({ message: 'Only members can book classes' });
      return;
    }

    const { classId } = req.body as { classId?: string };
    if (!classId) {
      res.status(400).json({ message: 'classId is required' });
      return;
    }

    const booking = await createBooking(req.user.id, classId);
    res.status(201).json({ booking });
  } catch (error) {
    if (error instanceof BookingError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : 'Unable to book class';
    res.status(500).json({ message });
  }
};

export const cancelClassBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const classId = req.params.classId as string;
    await cancelBooking(req.user.id, classId);
    res.status(200).json({ message: 'Booking cancelled' });
  } catch (error) {
    if (error instanceof BookingError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : 'Unable to cancel booking';
    res.status(500).json({ message });
  }
};
