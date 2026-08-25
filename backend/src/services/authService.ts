import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { env } from '../config/env';

export type UserLookup = (phone: string) => Promise<IUser | null>;

export interface AuthenticatedUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
}

export const signToken = (user: AuthenticatedUser): string =>
  jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);

export const loginUser = async (
  phone: string,
  password: string,
  userLookup: UserLookup = async (normalizedPhone) => User.findOne({ phone: normalizedPhone })
): Promise<{ user: AuthenticatedUser; token: string }> => {
  const cleanPhone = phone?.trim() ?? '';

  if (!cleanPhone || !password?.trim()) {
    throw new Error('Phone number and password are required');
  }

  const user = await userLookup(cleanPhone);

  if (!user) {
    throw new Error('Invalid phone number or password');
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new Error('Invalid phone number or password');
  }

  const authenticatedUser: AuthenticatedUser = {
    id: String(user._id),
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
  };

  return { user: authenticatedUser, token: signToken(authenticatedUser) };
};
