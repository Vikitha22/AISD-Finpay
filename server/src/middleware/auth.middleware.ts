import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  student_id: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required: Missing or invalid Bearer token' });
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string; email: string; student_id: string };
    req.user = {
      id: payload.sub,
      email: payload.email,
      student_id: payload.student_id
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

