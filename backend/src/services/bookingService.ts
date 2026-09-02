import mongoose, { ClientSession } from 'mongoose';
import { Booking, IBooking } from '../models/Booking';
import { FitnessClass, IFitnessClass } from '../models/FitnessClass';
import { attachAvailability, ClassWithAvailability } from './classService';

export class BookingError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const isTransactionsUnsupportedError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : '';
  return /Transaction numbers|replica set|IllegalOperation/i.test(message);
};

const bookClassWithSession = async (
  userId: string,
  classId: string,
  session?: ClientSession
): Promise<IBooking> => {
  const fitnessClass = await FitnessClass.findOne({ _id: classId, status: 'active' }).session(session ?? null);
  if (!fitnessClass) {
    throw new BookingError('Item not found', 404);
  }

  const existing = await Booking.findOne({ user: userId, fitnessClass: classId }).session(session ?? null);
  if (existing && existing.status === 'booked') {
    throw new BookingError('You have already booked this item', 409);
  }

  const activeCount = await Booking.countDocuments({ fitnessClass: classId, status: 'booked' }).session(
    session ?? null
  );
  if (activeCount >= fitnessClass.capacity) {
    throw new BookingError('This item is full', 409);
  }

  if (existing) {
    existing.status = 'booked';
    existing.bookedAt = new Date();
    await existing.save({ session });
    return existing;
  }

  const [created] = await Booking.create([{ user: userId, fitnessClass: classId }], { session });
  return created;
};

export const createBooking = async (userId: string, classId: string): Promise<IBooking> => {
  const session = await mongoose.startSession();
  try {
    let booking: IBooking | undefined;
    await session.withTransaction(async () => {
      booking = await bookClassWithSession(userId, classId, session);
    });
    return booking as IBooking;
  } catch (error) {
    if (error instanceof BookingError) throw error;
    if (isTransactionsUnsupportedError(error)) {
      // Standalone MongoDB (no replica set): fall back to a best-effort, non-transactional path
      return bookClassWithSession(userId, classId);
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

export const cancelBooking = async (userId: string, classId: string): Promise<void> => {
  const fitnessClass = await FitnessClass.findById(classId);
  if (fitnessClass?.status === 'cancelled') {
    throw new BookingError('Cancelled items cannot have their booking cancelled', 409);
  }
  const booking = await Booking.findOne({ user: userId, fitnessClass: classId, status: 'booked' });
  if (!booking) {
    throw new BookingError('Booking not found', 404);
  }

  booking.status = 'cancelled';
  await booking.save();
};

export interface BookingWithClass {
  _id: unknown;
  user: unknown;
  status: string;
  bookedAt: Date;
  fitnessClass: ClassWithAvailability;
}

// FCBS-18
export const getBookingsForUser = async (userId: string): Promise<BookingWithClass[]> => {
  const bookings = await Booking.find({ user: userId, status: 'booked' })
    .sort({ bookedAt: -1 })
    .populate({
      path: 'fitnessClass',
      populate: { path: 'instructor', select: 'name email' },
    });

  const classes = bookings
    .map((booking) => booking.fitnessClass as unknown as IFitnessClass)
    .filter((fitnessClass): fitnessClass is IFitnessClass => !!fitnessClass);
  const classesWithAvailability = await attachAvailability(classes, userId);
  const availabilityByClassId = new Map(
    classesWithAvailability.map((fitnessClass) => [String(fitnessClass._id), fitnessClass])
  );

  return bookings.map((booking) => {
    const plain = booking.toObject();
    const classId = String((booking.fitnessClass as unknown as IFitnessClass)?._id ?? '');
    return {
      ...plain,
      fitnessClass: availabilityByClassId.get(classId) ?? plain.fitnessClass,
    } as unknown as BookingWithClass;
  });
};
