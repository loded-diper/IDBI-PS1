import { getDb } from '../../db';

export function getPersonaContext(personaId: string): string {
  const db = getDb();
  
  // Person
  const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(personaId) as any;
  if (!persona) return "User data not found.";

  // Accounts
  const accounts = db.prepare('SELECT type, account_name, balance FROM accounts WHERE persona_id = ?').all(personaId) as any[];
  
  // Investments
  const investments = db.prepare('SELECT type, name, current_value FROM investments WHERE persona_id = ?').all(personaId) as any[];
  const totalWealth = accounts.reduce((acc, a) => acc + a.balance, 0) + 
                      investments.reduce((acc, i) => acc + i.current_value, 0);

  // Goals
  const goals = db.prepare('SELECT name, target_amount, current_amount FROM goals WHERE persona_id = ?').all(personaId) as any[];

  // Recent spending context
  const recentDebitTotal = db.prepare(`
    SELECT SUM(amount) as total
    FROM transactions
    WHERE persona_id = ? AND type = 'debit'
    AND strftime('%Y-%m', date) = (
      SELECT strftime('%Y-%m', date) FROM transactions 
      WHERE persona_id = ? AND type = 'debit' 
      ORDER BY date DESC LIMIT 1
    )
  `).get(personaId, personaId) as any;

  return `
### USER FINANCIAL CONTEXT
You are WealthAI, a personalized digital wealth advisor for the following user.
Use this context to provide personalized, helpful, and empathetic financial guidance.

**Profile**: ${persona.name} (${persona.age} yrs), ${persona.type.replace('_', ' ')}
**Risk Profile**: ${persona.risk_profile}
**Background**: ${persona.description}

**Net Worth Overview**:
- Total Approximate Wealth: ₹${totalWealth}
- Recent Monthly Expenses: ₹${recentDebitTotal?.total || 0}
- Liquid Cash / Savings: ₹${accounts.filter(a => a.type === 'savings').reduce((acc, a) => acc + a.balance, 0)}

**Key Goals**:
${goals.map(g => `- ${g.name}: Target ₹${g.target_amount} (Current: ₹${g.current_amount})`).join('\n')}

**Investment Highlights**:
${investments.slice(0, 3).map(i => `- ${i.name} (${i.type}): ₹${i.current_value}`).join('\n')}

*Instructions*:
- Maintain a highly professional but warm tone.
- Directly answer questions regarding the user's finances based ONLY on this context. 
- Use markdown for clear formatting (bullet points, bold text).
- Be concise but actionable.
`;
}
