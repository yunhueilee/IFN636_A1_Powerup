import { Schema, model, Document, Types } from 'mongoose';

export type BookingStatus = 'booked' | 'cancelled';

export interface IBooking extends Document {
  user: Types.ObjectId;
  fitnessClass: Types.ObjectId;
  status: BookingStatus;
  bookedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fitnessClass: { type: Schema.Types.ObjectId, ref: 'FitnessClass', required: true },
    status: { type: String, enum: ['booked', 'cancelled'], default: 'booked' },
    bookedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One booking document per user/class pair; status is toggled between booked/cancelled
bookingSchema.index({ user: 1, fitnessClass: 1 }, { unique: true });

export const Booking = model<IBooking>('Booking', bookingSchema);
