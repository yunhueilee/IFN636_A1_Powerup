import { API_URL } from './client';
import { AuthUser } from '../../types';

export interface LoginResult {
  user: AuthUser;
  token: string;
}

export const loginUser = async (phone: string, password: string): Promise<LoginResult> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  return { user: data.user, token: data.token };
};
