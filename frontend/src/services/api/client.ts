export { API_URL } from '../../config/env';
import { API_URL } from '../../config/env';

export const authorizedFetch = async (
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> =>
  fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
