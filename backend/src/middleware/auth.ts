import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'wealth-avatar-demo-secret-key-2026';

export interface AuthRequest extends Request {
  personaId?: string;
}

export function generateToken(personaId: string): string {
  return jwt.sign({ personaId }, JWT_SECRET, { expiresIn: '24h' });
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    _res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { personaId: string };
    req.personaId = decoded.personaId;
    next();
  } catch {
    _res.status(401).json({ error: 'Invalid token' });
    return;
  }
}
