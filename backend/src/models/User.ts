import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'member' | 'instructor';

export const AUSTRALIAN_MOBILE_PHONE_REGEX = /^04[0-9]{8}$/;

export interface IUser extends Document {
  name: string;
  phone: string;
  email: string;
  dob: Date;
  password: string;
  role: UserRole;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [AUSTRALIAN_MOBILE_PHONE_REGEX, 'Phone number must be a 10-digit Australian mobile number starting with 04'],
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    dob: { type: Date, required: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['member', 'instructor'], required: true },
  },
  { timestamps: true }
);

userSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function (next) {
  const update = this.getUpdate();
  if (!update || Array.isArray(update)) return next();

  const updateDocument = update as { phone?: unknown; $set?: Record<string, unknown> };
  const phone = updateDocument.$set?.phone ?? updateDocument.phone;

  if (phone === undefined) return next();
  if (typeof phone !== 'string' || !AUSTRALIAN_MOBILE_PHONE_REGEX.test(phone.trim())) {
    return next(new Error('Phone number must be a 10-digit Australian mobile number starting with 04'));
  }

  if (typeof updateDocument.$set?.phone === 'string') {
    updateDocument.$set.phone = updateDocument.$set.phone.trim();
  } else if (typeof updateDocument.phone === 'string') {
    updateDocument.phone = updateDocument.phone.trim();
  }

  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>('User', userSchema);
