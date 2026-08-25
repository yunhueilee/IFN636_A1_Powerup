import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { ClassInput, cancelClass, createClass, getClassMembers, getClassesForRole, updateClass } from '../services/classService';

export const getClasses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const classes = await getClassesForRole(req.user.id, req.user.role);
    res.status(200).json({ classes });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load classes';
    res.status(500).json({ message });
  }
};

const requireInstructor = (req: AuthenticatedRequest, res: Response): string | null => {
  if (!req.user) { res.status(401).json({ message: 'Not authorized' }); return null; }
  if (req.user.role !== 'instructor') { res.status(403).json({ message: 'Instructor access required' }); return null; }
  return req.user.id;
};

export const createInstructorClass = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const instructorId = requireInstructor(req, res);
  if (!instructorId) return;
  try { res.status(201).json({ class: await createClass(instructorId, req.body as ClassInput) }); }
  catch (error) { res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to create class' }); }
};

export const updateInstructorClass = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const instructorId = requireInstructor(req, res);
  if (!instructorId) return;
  try { res.status(200).json({ class: await updateClass(instructorId, String(req.params.classId), req.body as ClassInput) }); }
  catch (error) { res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to update class' }); }
};

export const cancelInstructorClass = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const instructorId = requireInstructor(req, res);
  if (!instructorId) return;
  try { await cancelClass(instructorId, String(req.params.classId), req.body?.reason); res.status(200).json({ message: 'Class cancelled' }); }
  catch (error) { res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to cancel class' }); }
};

export const getInstructorClassMembers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const instructorId = requireInstructor(req, res);
  if (!instructorId) return;
  try { res.status(200).json({ members: await getClassMembers(instructorId, String(req.params.classId)) }); }
  catch (error) { res.status(404).json({ message: error instanceof Error ? error.message : 'Unable to load members' }); }
};
