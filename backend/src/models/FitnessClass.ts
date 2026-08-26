import { Schema, model, Document, Types } from 'mongoose';

export type ClassVisibility = 'public' | 'private';
export type ClassStatus = 'active' | 'cancelled';

export interface IFitnessClass extends Document {
  title: string;
  description: string;
  instructor: Types.ObjectId;
  scheduledAt: Date;
  durationMinutes: number;
  location: string;
  capacity: number;
  // 1 = easiest ... 5 = very hard
  intensity: number;
  visibility: ClassVisibility;
  status: ClassStatus;
  cancellationReason?: string;
}

// Epic 3: Instructor Class Management
const fitnessClassSchema = new Schema<IFitnessClass>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, default: 60 },
    location: { type: String, default: '', trim: true },
    capacity: { type: Number, required: true, default: 20 },
    intensity: { type: Number, required: true, default: 3, min: 1, max: 5 },
    // 'private' classes are only visible to the owning instructor, not to members
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
    cancellationReason: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

export const FitnessClass = model<IFitnessClass>('FitnessClass', fitnessClassSchema);
