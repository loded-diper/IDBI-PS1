import { Router, Response } from 'express';
import { getDb } from '../db';

const router = Router();

// GET /api/personas — List all available personas
router.get('/', (_req, res: Response) => {
  const db = getDb();
  const personas = db.prepare('SELECT * FROM personas').all();
  res.json(personas);
});

export default router;
