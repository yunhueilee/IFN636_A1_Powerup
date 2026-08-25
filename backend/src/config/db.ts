import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async (): Promise<void> => {
  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI is not set in the environment');
  }

  await mongoose.connect(env.mongodbUri);
  console.log('MongoDB connected');
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};
