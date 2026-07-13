import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { getPersonaContext } from '../services/ai/chatContext';
import { mockGenerateResponse } from '../services/ai/mockClaude';

const router = Router();

router.use(authMiddleware);

router.post('/message', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const personaId = req.personaId!;
    const { message, history } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // 1. Build context
    const context = getPersonaContext(personaId);

    // 2. Generate response (Mocked for Phase 2)
    const reply = await mockGenerateResponse(context, history || [], message);

    res.json({ reply });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

export default router;
