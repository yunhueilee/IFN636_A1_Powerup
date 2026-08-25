import { Request, Response } from 'express';
import { loginUser } from '../services/authService';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body ?? {};
    const { user, token } = await loginUser(phone, password);

    res.status(200).json({
      message: 'Login successful',
      user,
      token,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';

    res.status(401).json({ message });
  }
};
