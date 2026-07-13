import { Router, Response } from 'express';
import { getDb } from '../db';
import { generateToken, AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/auth/login — Login as a persona
router.post('/login', (req: AuthRequest, res: Response) => {
  const { personaId } = req.body;

  if (!personaId) {
    res.status(400).json({ error: 'personaId is required' });
    return;
  }

  const db = getDb();
  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(personaId) as any;

  if (!persona) {
    res.status(404).json({ error: 'Persona not found' });
    return;
  }

  const token = generateToken(personaId);
  res.json({
    token,
    persona: {
      id: persona.id,
      name: persona.name,
      age: persona.age,
      type: persona.type,
      description: persona.description,
      avatar_emoji: persona.avatar_emoji,
      risk_profile: persona.risk_profile,
    },
  });
});

// GET /api/auth/me — Get current persona from token
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(req.personaId) as any;

  if (!persona) {
    res.status(404).json({ error: 'Persona not found' });
    return;
  }

  res.json({
    id: persona.id,
    name: persona.name,
    age: persona.age,
    type: persona.type,
    description: persona.description,
    avatar_emoji: persona.avatar_emoji,
    risk_profile: persona.risk_profile,
  });
});

// POST /api/auth/register — Create a new persona
import { seedNewPersona } from '../data/seedData';

router.post('/register', (req: AuthRequest, res: Response) => {
  const { name, age, risk_profile, goal } = req.body;
  if (!name || !age || !risk_profile) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  
  try {
    const newPersona = seedNewPersona({ name, age: Number(age), risk_profile, goal: goal || 'General Wealth Building' });
    const token = generateToken(newPersona.id);
    res.json({
      token,
      persona: newPersona
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/me — Update persona settings
router.put('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const { name, risk_profile } = req.body;
  const db = getDb();
  
  try {
    const stmt = db.prepare('UPDATE personas SET name = ?, risk_profile = ? WHERE id = ?');
    stmt.run(name, risk_profile, req.personaId);
    
    const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(req.personaId) as any;
    res.json(persona);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
