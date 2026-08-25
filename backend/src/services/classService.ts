import { FitnessClass, IFitnessClass, ClassVisibility, ClassStatus } from '../models/FitnessClass';
import { Booking } from '../models/Booking';

export interface ClassWithAvailability {
  _id: unknown;
  title: string;
  description: string;
  instructor: unknown;
  scheduledAt: Date;
  durationMinutes: number;
  location: string;
  capacity: number;
  intensity: number;
  visibility: ClassVisibility;
  status: ClassStatus;
  cancellationReason?: string;
  bookedCount: number;
  isBooked: boolean;
}

export const attachAvailability = async (
  classes: IFitnessClass[],
  userId: string
): Promise<ClassWithAvailability[]> => {
  const classIds = classes.map((fitnessClass) => fitnessClass._id);

  const counts = await Booking.aggregate<{ _id: unknown; count: number }>([
    { $match: { fitnessClass: { $in: classIds }, status: 'booked' } },
    { $group: { _id: '$fitnessClass', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((entry) => [entry._id?.toString(), entry.count]));

  const myBookings = await Booking.find({
    user: userId,
    status: 'booked',
    fitnessClass: { $in: classIds },
  }).select('fitnessClass');
  const bookedSet = new Set(myBookings.map((booking) => booking.fitnessClass.toString()));

  return classes.map((fitnessClass) => {
    const plain = fitnessClass.toObject();
    return {
      ...plain,
      bookedCount: countMap.get(fitnessClass._id.toString()) ?? 0,
      isBooked: bookedSet.has(fitnessClass._id.toString()),
    };
  });
};

export const getClassesForMember = async (userId: string): Promise<ClassWithAvailability[]> => {
  const classes = await FitnessClass.find({ visibility: 'public', status: 'active' })
    .sort({ scheduledAt: 1 })
    .populate('instructor', 'name email');
  return attachAvailability(classes, userId);
};

export const getClassesForInstructor = async (instructorId: string): Promise<ClassWithAvailability[]> => {
  const classes = await FitnessClass.find({ instructor: instructorId })
    .sort({ scheduledAt: 1 })
    .populate('instructor', 'name email');
  return attachAvailability(classes, instructorId);
};

export interface ClassInput {
  title?: string;
  description?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  location?: string;
  capacity?: number;
  intensity?: number;
  visibility?: ClassVisibility;
}

const validateClassInput = (input: ClassInput, bookedCount = 0): void => {
  if (!input.title?.trim() || !input.scheduledAt || !input.location?.trim()) {
    throw new Error('Title, date/time, and location are required');
  }
  if (!Number.isFinite(input.durationMinutes) || (input.durationMinutes as number) <= 0) {
    throw new Error('Duration must be greater than zero');
  }
  if (!Number.isInteger(input.capacity) || (input.capacity as number) < 1 || (input.capacity as number) < bookedCount) {
    throw new Error(`Capacity must be at least ${Math.max(1, bookedCount)}`);
  }
  if (!Number.isInteger(input.intensity) || (input.intensity as number) < 1 || (input.intensity as number) > 5) {
    throw new Error('Intensity must be between 1 and 5');
  }
  if (Number.isNaN(new Date(input.scheduledAt).getTime())) {
    throw new Error('Date/time is invalid');
  }
};

export const createClass = async (instructorId: string, input: ClassInput): Promise<ClassWithAvailability> => {
  validateClassInput(input);
  const fitnessClass = await FitnessClass.create({ ...input, instructor: instructorId });
  const [result] = await attachAvailability([fitnessClass], instructorId);
  return result;
};

export const updateClass = async (
  instructorId: string,
  classId: string,
  input: ClassInput
): Promise<ClassWithAvailability> => {
  const fitnessClass = await FitnessClass.findOne({ _id: classId, instructor: instructorId });
  if (!fitnessClass) throw new Error('Class not found');
  const bookedCount = await Booking.countDocuments({ fitnessClass: classId, status: 'booked' });
  validateClassInput({
    title: input.title ?? fitnessClass.title,
    scheduledAt: input.scheduledAt ?? fitnessClass.scheduledAt.toISOString(),
    location: input.location ?? fitnessClass.location,
    durationMinutes: input.durationMinutes ?? fitnessClass.durationMinutes,
    capacity: input.capacity ?? fitnessClass.capacity,
    intensity: input.intensity ?? fitnessClass.intensity,
  }, bookedCount);
  Object.assign(fitnessClass, input);
  await fitnessClass.save();
  const [result] = await attachAvailability([fitnessClass], instructorId);
  return result;
};

export const cancelClass = async (instructorId: string, classId: string, reason: string): Promise<void> => {
  if (!reason?.trim()) throw new Error('Cancellation reason is required');
  const fitnessClass = await FitnessClass.findOne({ _id: classId, instructor: instructorId });
  if (!fitnessClass) throw new Error('Class not found');
  fitnessClass.status = 'cancelled';
  fitnessClass.cancellationReason = reason.trim();
  await fitnessClass.save();
};

export const getClassMembers = async (instructorId: string, classId: string) => {
  const fitnessClass = await FitnessClass.findOne({ _id: classId, instructor: instructorId });
  if (!fitnessClass) throw new Error('Class not found');
  return Booking.find({ fitnessClass: classId, status: 'booked' })
    .populate('user', 'name phone email')
    .select('user status bookedAt');
};

export const getClassesForRole = async (
  userId: string,
  role: string
): Promise<ClassWithAvailability[]> => {
  if (role === 'instructor') {
    return getClassesForInstructor(userId);
  }

  return getClassesForMember(userId);
};
