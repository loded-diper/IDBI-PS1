interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Simulates a response from an LLM like Claude or OpenAI.
 * In a real application, you would initialize the SDK here:
 * 
 * import Anthropic from '@anthropic-ai/sdk';
 * const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 * 
 * export async function generateResponse(...) {
 *    const msg = await anthropic.messages.create({ ... })
 *    return msg.content[0].text;
 * }
 */
export async function mockGenerateResponse(systemContext: string, history: ChatMessage[], newPrompt: string): Promise<string> {
  
  // Simulate network delay of 1.5 - 2.5 seconds
  const delay = Math.floor(Math.random() * 1000) + 1500;
  await new Promise(res => setTimeout(res, delay));

  const lowerPrompt = newPrompt.toLowerCase();
  const lowerContext = systemContext.toLowerCase();

  let response = "";

  // Basic keyword routing for the mock responder
  if (lowerPrompt.includes('spending') || lowerPrompt.includes('expense')) {
     response = `Looking at your recent spending, you've spent around **₹${systemContext.match(/Recent Monthly Expenses: ₹(\d+)/)?.[1] || '...'}** this past month. 

I recommend reviewing your top discretionary categories (like dining or shopping). Since your risk profile is **${systemContext.match(/Risk Profile: (\w+)/)?.[1]}**, you might want to consider redirecting some of those discretionary funds into your main investment portfolio to accelerate your wealth building.`;

  } else if (lowerPrompt.includes('goal') || lowerPrompt.includes('house') || lowerPrompt.includes('education') || lowerPrompt.includes('retirement')) {
     response = `You are doing a solid job working towards your goals! Let's look at your progress:

Here's what I see in your active targets:
${systemContext.split('**Key Goals**:')[1].split('**Investment Highlights**:')[0].trim()}

To reach these goals faster, considering your current liquid savings of **₹${systemContext.match(/Liquid Cash \/ Savings: ₹(\d+)/)?.[1]}**, you could potentially automate a monthly SIP to consistently hit those targets without thinking about it.`;

  } else if (lowerPrompt.includes('invest') || lowerPrompt.includes('portfolio') || lowerPrompt.includes('asset')) {
     response = `Given your **${systemContext.match(/Risk Profile: (\w+)/)?.[1]}** risk profile, your current investment mix looks reasonable. 

Your top holdings currently include:
${systemContext.split('**Investment Highlights**:')[1].split('*Instructions*:')[0].trim()}

Always ensure you are well-diversified. Would you like me to run a simulation on how reallocating 10% of your portfolio to equity might affect your long-term returns?`;

  } else if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
     response = `Hello ${systemContext.match(/Profile: ([\w\s]+) \(\d+/)?.[1] || 'there'}! I am WealthAI, your personal digital wealth advisor. 

I have access to your full financial profile, including your goals, investments, and spending habits. How can I assist you with your financial planning today?`;
     
  } else {
     response = `That's a great question. Based on your profile and current net worth of **₹${systemContext.match(/Total Approximate Wealth: ₹(\d+)/)?.[1]}**, making informed financial decisions is crucial. 

While I can't give specific legal financial advice, I'd suggest we evaluate this in the context of your primary goals. Is there a specific aspect of your portfolio or spending you'd like to dive into regarding this?`;
  }

  return response;
}
