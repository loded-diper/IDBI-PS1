import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';

// ─── Helper to generate dates ───────────────────────────────────────────────
function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Generate transactions for a persona ────────────────────────────────────
interface TxnTemplate {
  category: string;
  descriptions: { desc: string; merchant: string }[];
  minAmt: number;
  maxAmt: number;
  type: 'debit' | 'credit';
  frequency: number; // average per month
}

function generateTransactions(
  personaId: string,
  accountId: string,
  templates: TxnTemplate[],
  months: number = 6
): any[] {
  const txns: any[] = [];
  const now = new Date();

  for (let m = 0; m < months; m++) {
    const year = now.getFullYear();
    const month = now.getMonth() + 1 - m;
    const adjYear = month <= 0 ? year - 1 : year;
    const adjMonth = month <= 0 ? month + 12 : month;
    const daysInMonth = new Date(adjYear, adjMonth, 0).getDate();

    for (const template of templates) {
      const count = Math.max(1, Math.round(template.frequency + (Math.random() - 0.5) * 2));
      for (let i = 0; i < count; i++) {
        const day = Math.min(Math.floor(Math.random() * daysInMonth) + 1, daysInMonth);
        const { desc, merchant } = pickRandom(template.descriptions);
        txns.push({
          id: uuidv4(),
          persona_id: personaId,
          account_id: accountId,
          date: dateStr(adjYear, adjMonth, day),
          amount: randomBetween(template.minAmt, template.maxAmt),
          type: template.type,
          category: template.category,
          description: desc,
          merchant: merchant,
        });
      }
    }
  }

  return txns.sort((a, b) => b.date.localeCompare(a.date));
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSONA 1: Priya Sharma — Young Professional
// ═══════════════════════════════════════════════════════════════════════════════
function seedPriya() {
  const personaId = 'priya-sharma';

  return {
    persona: {
      id: personaId,
      name: 'Priya Sharma',
      age: 29,
      type: 'young_professional',
      description: 'Software engineer at a top tech company in Bangalore. Single, ambitious, aggressive investor. Saving for a house down payment and building emergency fund.',
      avatar_emoji: '👩‍💻',
      risk_profile: 'aggressive',
    },
    accounts: [
      { id: `${personaId}-savings`, persona_id: personaId, type: 'savings', bank_name: 'Apex Bank', account_name: 'Primary Savings', balance: 485000, credit_limit: null, interest_rate: 3.5 },
      { id: `${personaId}-salary`, persona_id: personaId, type: 'savings', bank_name: 'Apex Bank', account_name: 'Salary Account', balance: 142000, credit_limit: null, interest_rate: 3.0 },
      { id: `${personaId}-cc`, persona_id: personaId, type: 'credit_card', bank_name: 'Apex Bank', account_name: 'Platinum Credit Card', balance: -28500, credit_limit: 300000, interest_rate: 36.0 },
    ],
    investments: [
      { id: uuidv4(), persona_id: personaId, type: 'mutual_fund', name: 'Apex Nifty 50 Index Fund', units: 245.5, buy_price: 152.30, current_nav: 178.45, invested_amount: 37389, current_value: 43800 },
      { id: uuidv4(), persona_id: personaId, type: 'mutual_fund', name: 'Axis Bluechip Fund', units: 180.2, buy_price: 48.50, current_nav: 56.20, invested_amount: 87397, current_value: 101272 },
      { id: uuidv4(), persona_id: personaId, type: 'mutual_fund', name: 'Parag Parikh Flexi Cap Fund', units: 310.8, buy_price: 62.10, current_nav: 71.85, invested_amount: 193007, current_value: 223310 },
      { id: uuidv4(), persona_id: personaId, type: 'stock', name: 'Infosys Ltd', units: 50, buy_price: 1580, current_nav: 1720, invested_amount: 79000, current_value: 86000 },
      { id: uuidv4(), persona_id: personaId, type: 'stock', name: 'TCS', units: 25, buy_price: 3400, current_nav: 3890, invested_amount: 85000, current_value: 97250 },
      { id: uuidv4(), persona_id: personaId, type: 'fd', name: 'Apex Bank FD — 1 Year', units: 1, buy_price: 200000, current_nav: 215000, invested_amount: 200000, current_value: 215000 },
    ],
    loans: [],
    insurance: [
      { id: uuidv4(), persona_id: personaId, type: 'health', provider: 'Star Health', premium_annual: 15000, cover_amount: 1000000, expiry_date: '2027-03-15' },
      { id: uuidv4(), persona_id: personaId, type: 'term', provider: 'ICICI Prudential', premium_annual: 8500, cover_amount: 10000000, expiry_date: '2055-06-01' },
    ],
    goals: [
      { id: uuidv4(), persona_id: personaId, name: 'House Down Payment', target_amount: 2000000, current_amount: 766632, target_date: '2028-12-31', category: 'house' },
      { id: uuidv4(), persona_id: personaId, name: 'Emergency Fund', target_amount: 600000, current_amount: 485000, target_date: '2027-06-30', category: 'emergency_fund' },
      { id: uuidv4(), persona_id: personaId, name: 'Europe Trip', target_amount: 350000, current_amount: 95000, target_date: '2027-12-31', category: 'vacation' },
    ],
    transactionTemplates: [
      { category: 'salary', descriptions: [{ desc: 'Monthly Salary Credit', merchant: 'TechCorp India' }], minAmt: 120000, maxAmt: 120000, type: 'credit' as const, frequency: 1 },
      { category: 'rent', descriptions: [{ desc: 'Monthly Rent — Koramangala 2BHK', merchant: 'Landlord — Suresh' }], minAmt: 25000, maxAmt: 25000, type: 'debit' as const, frequency: 1 },
      { category: 'groceries', descriptions: [
        { desc: 'Weekly groceries', merchant: 'BigBasket' },
        { desc: 'Groceries & essentials', merchant: 'Zepto' },
        { desc: 'Monthly supplies', merchant: 'DMart' },
      ], minAmt: 800, maxAmt: 3500, type: 'debit' as const, frequency: 6 },
      { category: 'dining', descriptions: [
        { desc: 'Dinner with friends', merchant: 'The Permit Room' },
        { desc: 'Lunch order', merchant: 'Swiggy' },
        { desc: 'Coffee meeting', merchant: 'Third Wave Coffee' },
        { desc: 'Weekend brunch', merchant: 'Cafe Noir' },
      ], minAmt: 250, maxAmt: 2800, type: 'debit' as const, frequency: 8 },
      { category: 'subscriptions', descriptions: [
        { desc: 'Netflix subscription', merchant: 'Netflix' },
        { desc: 'Spotify Premium', merchant: 'Spotify' },
        { desc: 'YouTube Premium', merchant: 'Google' },
      ], minAmt: 149, maxAmt: 649, type: 'debit' as const, frequency: 3 },
      { category: 'transport', descriptions: [
        { desc: 'Uber ride', merchant: 'Uber India' },
        { desc: 'Ola Auto', merchant: 'Ola Cabs' },
        { desc: 'Metro recharge', merchant: 'Namma Metro' },
      ], minAmt: 80, maxAmt: 650, type: 'debit' as const, frequency: 6 },
      { category: 'utilities', descriptions: [
        { desc: 'Electricity bill', merchant: 'BESCOM' },
        { desc: 'Internet bill', merchant: 'ACT Fibernet' },
        { desc: 'Mobile recharge', merchant: 'Jio' },
      ], minAmt: 399, maxAmt: 2200, type: 'debit' as const, frequency: 3 },
      { category: 'shopping', descriptions: [
        { desc: 'Online purchase', merchant: 'Amazon India' },
        { desc: 'Fashion purchase', merchant: 'Myntra' },
      ], minAmt: 500, maxAmt: 5000, type: 'debit' as const, frequency: 3 },
      { category: 'investment', descriptions: [
        { desc: 'SIP — Nifty 50 Index Fund', merchant: 'Apex MF' },
        { desc: 'SIP — Axis Bluechip', merchant: 'Axis MF' },
        { desc: 'SIP — Parag Parikh Flexi Cap', merchant: 'PPFAS MF' },
      ], minAmt: 5000, maxAmt: 15000, type: 'debit' as const, frequency: 3 },
      { category: 'transfer', descriptions: [
        { desc: 'UPI transfer', merchant: 'UPI — PhonePe' },
        { desc: 'Sent to Mom', merchant: 'UPI — GPay' },
      ], minAmt: 500, maxAmt: 8000, type: 'debit' as const, frequency: 2 },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSONA 2: Rajesh & Meena Gupta — Family Planner
// ═══════════════════════════════════════════════════════════════════════════════
function seedRajesh() {
  const personaId = 'rajesh-gupta';

  return {
    persona: {
      id: personaId,
      name: 'Rajesh & Meena Gupta',
      age: 42,
      type: 'family_planner',
      description: 'Senior bank manager & teacher couple in Pune. 2 children (ages 14, 10). Moderate risk profile. Managing home loan EMI while saving for children\'s education.',
      avatar_emoji: '👨‍👩‍👧‍👦',
      risk_profile: 'moderate',
    },
    accounts: [
      { id: `${personaId}-savings`, persona_id: personaId, type: 'savings', bank_name: 'Apex Bank', account_name: 'Joint Savings', balance: 890000, credit_limit: null, interest_rate: 3.5 },
      { id: `${personaId}-salary-r`, persona_id: personaId, type: 'savings', bank_name: 'Apex Bank', account_name: 'Rajesh Salary', balance: 225000, credit_limit: null, interest_rate: 3.0 },
      { id: `${personaId}-salary-m`, persona_id: personaId, type: 'savings', bank_name: 'Apex Bank', account_name: 'Meena Salary', balance: 85000, credit_limit: null, interest_rate: 3.0 },
      { id: `${personaId}-cc`, persona_id: personaId, type: 'credit_card', bank_name: 'Apex Bank', account_name: 'Family Credit Card', balance: -42000, credit_limit: 500000, interest_rate: 30.0 },
    ],
    investments: [
      { id: uuidv4(), persona_id: personaId, type: 'mutual_fund', name: 'HDFC Balanced Advantage Fund', units: 5200, buy_price: 38.50, current_nav: 44.20, invested_amount: 200200, current_value: 229840 },
      { id: uuidv4(), persona_id: personaId, type: 'mutual_fund', name: 'ICICI Prudential Bluechip Fund', units: 3800, buy_price: 72.40, current_nav: 82.60, invested_amount: 275120, current_value: 313880 },
      { id: uuidv4(), persona_id: personaId, type: 'mutual_fund', name: 'SBI Magnum Children\'s Fund', units: 1500, buy_price: 22.10, current_nav: 28.90, invested_amount: 33150, current_value: 43350 },
      { id: uuidv4(), persona_id: personaId, type: 'fd', name: 'Apex Bank FD — 3 Year', units: 1, buy_price: 500000, current_nav: 548000, invested_amount: 500000, current_value: 548000 },
      { id: uuidv4(), persona_id: personaId, type: 'fd', name: 'PPF Account', units: 1, buy_price: 1200000, current_nav: 1380000, invested_amount: 1200000, current_value: 1380000 },
      { id: uuidv4(), persona_id: personaId, type: 'stock', name: 'Reliance Industries', units: 40, buy_price: 2450, current_nav: 2890, invested_amount: 98000, current_value: 115600 },
    ],
    loans: [
      { id: uuidv4(), persona_id: personaId, type: 'home', lender: 'Apex Bank', principal: 6000000, outstanding: 4200000, emi: 52000, interest_rate: 8.5, tenure_months: 240, remaining_months: 168 },
    ],
    insurance: [
      { id: uuidv4(), persona_id: personaId, type: 'health', provider: 'New India Assurance', premium_annual: 25000, cover_amount: 2000000, expiry_date: '2027-01-15' },
      { id: uuidv4(), persona_id: personaId, type: 'life', provider: 'LIC', premium_annual: 45000, cover_amount: 5000000, expiry_date: '2042-08-20' },
      { id: uuidv4(), persona_id: personaId, type: 'term', provider: 'HDFC Life', premium_annual: 18000, cover_amount: 15000000, expiry_date: '2048-12-01' },
      { id: uuidv4(), persona_id: personaId, type: 'vehicle', provider: 'ICICI Lombard', premium_annual: 12000, cover_amount: 800000, expiry_date: '2027-04-30' },
    ],
    goals: [
      { id: uuidv4(), persona_id: personaId, name: 'Aarav\'s Engineering College', target_amount: 2500000, current_amount: 850000, target_date: '2030-06-30', category: 'education' },
      { id: uuidv4(), persona_id: personaId, name: 'Diya\'s Higher Education', target_amount: 3000000, current_amount: 320000, target_date: '2034-06-30', category: 'education' },
      { id: uuidv4(), persona_id: personaId, name: 'Retirement Corpus', target_amount: 30000000, current_amount: 2630670, target_date: '2043-12-31', category: 'retirement' },
    ],
    transactionTemplates: [
      { category: 'salary', descriptions: [{ desc: 'Rajesh — Monthly Salary', merchant: 'Apex Bank HR' }], minAmt: 135000, maxAmt: 135000, type: 'credit' as const, frequency: 1 },
      { category: 'salary', descriptions: [{ desc: 'Meena — Monthly Salary', merchant: 'KV School Pune' }], minAmt: 65000, maxAmt: 65000, type: 'credit' as const, frequency: 1 },
      { category: 'emi', descriptions: [{ desc: 'Home Loan EMI', merchant: 'Apex Bank Loans' }], minAmt: 52000, maxAmt: 52000, type: 'debit' as const, frequency: 1 },
      { category: 'rent', descriptions: [{ desc: 'Society Maintenance', merchant: 'Green Valley Society' }], minAmt: 5500, maxAmt: 5500, type: 'debit' as const, frequency: 1 },
      { category: 'groceries', descriptions: [
        { desc: 'Monthly groceries', merchant: 'Reliance Fresh' },
        { desc: 'Vegetables & fruits', merchant: 'Local Market' },
        { desc: 'Weekly essentials', merchant: 'BigBasket' },
      ], minAmt: 1200, maxAmt: 5500, type: 'debit' as const, frequency: 8 },
      { category: 'education', descriptions: [
        { desc: 'Aarav school fees', merchant: 'DPS Pune' },
        { desc: 'Diya school fees', merchant: 'DPS Pune' },
        { desc: 'Aarav coaching classes', merchant: 'FIITJEE Pune' },
        { desc: 'Diya dance class', merchant: 'Nritya Academy' },
      ], minAmt: 2000, maxAmt: 18000, type: 'debit' as const, frequency: 4 },
      { category: 'dining', descriptions: [
        { desc: 'Family dinner', merchant: 'Mainland China' },
        { desc: 'Pizza night', merchant: 'Dominos' },
        { desc: 'Weekend outing', merchant: 'Barbeque Nation' },
      ], minAmt: 400, maxAmt: 3500, type: 'debit' as const, frequency: 4 },
      { category: 'utilities', descriptions: [
        { desc: 'Electricity bill', merchant: 'MSEDCL' },
        { desc: 'Gas pipeline', merchant: 'Maharashtra Gas' },
        { desc: 'Internet & cable', merchant: 'Airtel Xstream' },
        { desc: 'Mobile recharge — Rajesh', merchant: 'Airtel' },
        { desc: 'Mobile recharge — Meena', merchant: 'Vodafone' },
      ], minAmt: 350, maxAmt: 3800, type: 'debit' as const, frequency: 5 },
      { category: 'medical', descriptions: [
        { desc: 'Doctor consultation', merchant: 'Ruby Hall Clinic' },
        { desc: 'Medicines', merchant: 'Apollo Pharmacy' },
      ], minAmt: 300, maxAmt: 2500, type: 'debit' as const, frequency: 2 },
      { category: 'transport', descriptions: [
        { desc: 'Petrol', merchant: 'HP Petrol Pump' },
        { desc: 'Car service', merchant: 'Maruti Service Center' },
      ], minAmt: 1500, maxAmt: 4500, type: 'debit' as const, frequency: 3 },
      { category: 'investment', descriptions: [
        { desc: 'SIP — HDFC Balanced', merchant: 'HDFC MF' },
        { desc: 'SIP — ICICI Bluechip', merchant: 'ICICI MF' },
        { desc: 'PPF Deposit', merchant: 'Apex Bank PPF' },
      ], minAmt: 5000, maxAmt: 20000, type: 'debit' as const, frequency: 3 },
      { category: 'insurance', descriptions: [
        { desc: 'LIC premium', merchant: 'LIC India' },
      ], minAmt: 3750, maxAmt: 3750, type: 'debit' as const, frequency: 1 },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSONA 3: Dr. Sunita Rao — Retiree
// ═══════════════════════════════════════════════════════════════════════════════
function seedSunita() {
  const personaId = 'sunita-rao';

  return {
    persona: {
      id: personaId,
      name: 'Dr. Sunita Rao',
      age: 63,
      type: 'retiree',
      description: 'Retired professor from IIT Madras, now in Chennai. Widowed, conservative investor. Focus on capital preservation, pension management, and health coverage.',
      avatar_emoji: '👩‍🏫',
      risk_profile: 'conservative',
    },
    accounts: [
      { id: `${personaId}-savings`, persona_id: personaId, type: 'savings', bank_name: 'Apex Bank', account_name: 'Senior Citizen Savings', balance: 1850000, credit_limit: null, interest_rate: 4.0 },
      { id: `${personaId}-pension`, persona_id: personaId, type: 'savings', bank_name: 'Apex Bank', account_name: 'Pension Account', balance: 320000, credit_limit: null, interest_rate: 3.5 },
      { id: `${personaId}-cc`, persona_id: personaId, type: 'credit_card', bank_name: 'Apex Bank', account_name: 'Classic Credit Card', balance: -8200, credit_limit: 150000, interest_rate: 28.0 },
    ],
    investments: [
      { id: uuidv4(), persona_id: personaId, type: 'fd', name: 'Apex Bank Senior Citizen FD — 5Y', units: 1, buy_price: 3000000, current_nav: 3420000, invested_amount: 3000000, current_value: 3420000 },
      { id: uuidv4(), persona_id: personaId, type: 'fd', name: 'Post Office SCSS', units: 1, buy_price: 1500000, current_nav: 1620000, invested_amount: 1500000, current_value: 1620000 },
      { id: uuidv4(), persona_id: personaId, type: 'mutual_fund', name: 'HDFC Corporate Bond Fund', units: 8500, buy_price: 28.20, current_nav: 30.10, invested_amount: 239700, current_value: 255850 },
      { id: uuidv4(), persona_id: personaId, type: 'mutual_fund', name: 'ICICI Pru Equity & Debt Fund', units: 2200, buy_price: 180.50, current_nav: 198.30, invested_amount: 397100, current_value: 436260 },
      { id: uuidv4(), persona_id: personaId, type: 'stock', name: 'ITC Ltd', units: 200, buy_price: 280, current_nav: 445, invested_amount: 56000, current_value: 89000 },
      { id: uuidv4(), persona_id: personaId, type: 'fd', name: 'RBI Floating Rate Savings Bonds', units: 1, buy_price: 500000, current_nav: 538000, invested_amount: 500000, current_value: 538000 },
    ],
    loans: [],
    insurance: [
      { id: uuidv4(), persona_id: personaId, type: 'health', provider: 'Star Health Senior Citizen', premium_annual: 42000, cover_amount: 1500000, expiry_date: '2027-02-28' },
      { id: uuidv4(), persona_id: personaId, type: 'health', provider: 'Apex Federal Super Top-Up', premium_annual: 8000, cover_amount: 2000000, expiry_date: '2027-02-28' },
    ],
    goals: [
      { id: uuidv4(), persona_id: personaId, name: 'Maintain Retirement Corpus', target_amount: 10000000, current_amount: 8529110, target_date: '2036-12-31', category: 'retirement' },
      { id: uuidv4(), persona_id: personaId, name: 'Grandson\'s Education Fund', target_amount: 1500000, current_amount: 450000, target_date: '2035-06-30', category: 'education' },
      { id: uuidv4(), persona_id: personaId, name: 'Pilgrimage Fund', target_amount: 200000, current_amount: 120000, target_date: '2027-03-31', category: 'vacation' },
    ],
    transactionTemplates: [
      { category: 'pension', descriptions: [{ desc: 'Monthly Pension Credit', merchant: 'Govt of India Pension' }], minAmt: 80000, maxAmt: 80000, type: 'credit' as const, frequency: 1 },
      { category: 'interest', descriptions: [{ desc: 'FD Interest Credit', merchant: 'Apex Bank' }], minAmt: 18000, maxAmt: 22000, type: 'credit' as const, frequency: 1 },
      { category: 'groceries', descriptions: [
        { desc: 'Monthly groceries', merchant: 'Spencer\'s' },
        { desc: 'Vegetables', merchant: 'Local Vegetable Market' },
        { desc: 'Dairy & essentials', merchant: 'Aavin Milk Parlor' },
      ], minAmt: 500, maxAmt: 3000, type: 'debit' as const, frequency: 5 },
      { category: 'medical', descriptions: [
        { desc: 'Monthly medicines', merchant: 'MedPlus Pharmacy' },
        { desc: 'Doctor consultation', merchant: 'Apollo Hospital Chennai' },
        { desc: 'Lab tests', merchant: 'Thyrocare' },
        { desc: 'Specialist consultation', merchant: 'Sankara Nethralaya' },
      ], minAmt: 500, maxAmt: 5000, type: 'debit' as const, frequency: 4 },
      { category: 'utilities', descriptions: [
        { desc: 'Electricity bill', merchant: 'TNEB' },
        { desc: 'Water bill', merchant: 'Chennai Metro Water' },
        { desc: 'Internet', merchant: 'BSNL Fibernet' },
        { desc: 'Mobile recharge', merchant: 'BSNL' },
      ], minAmt: 300, maxAmt: 2500, type: 'debit' as const, frequency: 4 },
      { category: 'dining', descriptions: [
        { desc: 'Lunch with friends', merchant: 'Murugan Idli Shop' },
        { desc: 'Family dinner', merchant: 'Hotel Saravana Bhavan' },
      ], minAmt: 200, maxAmt: 1500, type: 'debit' as const, frequency: 3 },
      { category: 'transport', descriptions: [
        { desc: 'Auto rickshaw', merchant: 'Local Auto' },
        { desc: 'Ola ride', merchant: 'Ola Cabs' },
      ], minAmt: 100, maxAmt: 500, type: 'debit' as const, frequency: 4 },
      { category: 'charity', descriptions: [
        { desc: 'Temple donation', merchant: 'Kapaleeswarar Temple' },
        { desc: 'NGO donation', merchant: 'CRY India' },
      ], minAmt: 500, maxAmt: 5000, type: 'debit' as const, frequency: 2 },
      { category: 'shopping', descriptions: [
        { desc: 'Books purchase', merchant: 'Amazon India' },
        { desc: 'Household items', merchant: 'Flipkart' },
      ], minAmt: 300, maxAmt: 2000, type: 'debit' as const, frequency: 2 },
      { category: 'insurance', descriptions: [
        { desc: 'Health insurance premium', merchant: 'Star Health' },
      ], minAmt: 3500, maxAmt: 3500, type: 'debit' as const, frequency: 1 },
      { category: 'gift', descriptions: [
        { desc: 'Gift to grandson', merchant: 'UPI — GPay' },
        { desc: 'Festival gift', merchant: 'UPI — PhonePe' },
      ], minAmt: 1000, maxAmt: 10000, type: 'debit' as const, frequency: 1 },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEED ALL DATA
// ═══════════════════════════════════════════════════════════════════════════════
export function seedDatabase(): void {
  const db = getDb();
  
  // Check if data already exists
  const count = db.prepare('SELECT COUNT(*) as count FROM personas').get() as any;
  if (count && count.count > 0) {
    console.log('  ℹ️  Database already seeded, skipping...');
    return;
  }

  console.log('  🌱 Seeding database with 3 personas...');

  const personaData = [seedPriya(), seedRajesh(), seedSunita()];

  const insertPersona = db.prepare(`INSERT INTO personas (id, name, age, type, description, avatar_emoji, risk_profile) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const insertAccount = db.prepare(`INSERT INTO accounts (id, persona_id, type, bank_name, account_name, balance, credit_limit, interest_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertTransaction = db.prepare(`INSERT INTO transactions (id, persona_id, account_id, date, amount, type, category, description, merchant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertInvestment = db.prepare(`INSERT INTO investments (id, persona_id, type, name, units, buy_price, current_nav, invested_amount, current_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertLoan = db.prepare(`INSERT INTO loans (id, persona_id, type, lender, principal, outstanding, emi, interest_rate, tenure_months, remaining_months) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertInsurance = db.prepare(`INSERT INTO insurance (id, persona_id, type, provider, premium_annual, cover_amount, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const insertGoal = db.prepare(`INSERT INTO goals (id, persona_id, name, target_amount, current_amount, target_date, category) VALUES (?, ?, ?, ?, ?, ?, ?)`);

  const seedAll = db.transaction(() => {
    for (const data of personaData) {
      const p = data.persona;
      insertPersona.run(p.id, p.name, p.age, p.type, p.description, p.avatar_emoji, p.risk_profile);

      for (const a of data.accounts) {
        insertAccount.run(a.id, a.persona_id, a.type, a.bank_name, a.account_name, a.balance, a.credit_limit, a.interest_rate);
      }

      // Generate transactions using primary savings account
      const primaryAccountId = data.accounts[0].id;
      const transactions = generateTransactions(p.id, primaryAccountId, data.transactionTemplates);
      for (const t of transactions) {
        insertTransaction.run(t.id, t.persona_id, t.account_id, t.date, t.amount, t.type, t.category, t.description, t.merchant);
      }

      for (const inv of data.investments) {
        insertInvestment.run(inv.id, inv.persona_id, inv.type, inv.name, inv.units, inv.buy_price, inv.current_nav, inv.invested_amount, inv.current_value);
      }

      for (const l of data.loans) {
        insertLoan.run(l.id, l.persona_id, l.type, l.lender, l.principal, l.outstanding, l.emi, l.interest_rate, l.tenure_months, l.remaining_months);
      }

      for (const ins of data.insurance) {
        insertInsurance.run(ins.id, ins.persona_id, ins.type, ins.provider, ins.premium_annual, ins.cover_amount, ins.expiry_date);
      }

      for (const g of data.goals) {
        insertGoal.run(g.id, g.persona_id, g.name, g.target_amount, g.current_amount, g.target_date, g.category);
      }

      console.log(`  ✅ Seeded persona: ${p.name} (${transactions.length} transactions)`);
    }
  });

  seedAll();
  console.log('  🎉 Database seeding complete!\n');
}

export function seedNewPersona(params: { name: string; age: number; risk_profile: string; goal: string }) {
  const db = getDb();
  const id = `user-${Math.random().toString(36).substring(2,10)}`;
  const avatar = '👤';
  
  // Generic profile for custom users
  const data = {
    persona: {
      id,
      name: params.name,
      age: params.age,
      type: 'custom',
      description: `New user targeting: ${params.goal}`,
      avatar_emoji: avatar,
      risk_profile: params.risk_profile,
    },
    accounts: [
      { id: `${id}-savings`, persona_id: id, type: 'savings', bank_name: 'Apex Bank', account_name: 'Primary Savings', balance: 50000, credit_limit: null, interest_rate: 3.0 },
      { id: `${id}-cc`, persona_id: id, type: 'credit_card', bank_name: 'Apex Bank', account_name: 'Credit Card', balance: -5000, credit_limit: 100000, interest_rate: 36.0 },
    ],
    investments: [
      { id: uuidv4(), persona_id: id, type: 'mutual_fund', name: 'Index Fund', units: 10, buy_price: 150, current_nav: 152, invested_amount: 1500, current_value: 1520 }
    ],
    loans: [],
    insurance: [],
    goals: [
      { id: uuidv4(), persona_id: id, name: params.goal, target_amount: 1000000, current_amount: 10000, target_date: '2028-01-01', category: 'wealth' }
    ]
  };

  const insertPersona = db.prepare('INSERT OR REPLACE INTO personas (id, name, age, type, description, avatar_emoji, risk_profile) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertPersona.run(data.persona.id, data.persona.name, data.persona.age, data.persona.type, data.persona.description, data.persona.avatar_emoji, data.persona.risk_profile);

  const insertAccount = db.prepare('INSERT OR REPLACE INTO accounts (id, persona_id, type, bank_name, account_name, balance, credit_limit, interest_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  data.accounts.forEach(a => {
    insertAccount.run(a.id, a.persona_id, a.type, a.bank_name, a.account_name, a.balance, a.credit_limit, a.interest_rate);
  });

  const insertTxn = db.prepare('INSERT OR REPLACE INTO transactions (id, persona_id, account_id, date, amount, type, category, description, merchant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const allTxns = [
    ...generateTransactions(id, `${id}-savings`, [
      { category: 'income', descriptions: [{ desc: 'Salary', merchant: 'Employer' }], minAmt: 50000, maxAmt: 50000, type: 'credit', frequency: 1 },
      { category: 'housing', descriptions: [{ desc: 'Rent', merchant: 'Landlord' }], minAmt: 15000, maxAmt: 15000, type: 'debit', frequency: 1 },
    ], 3),
    ...generateTransactions(id, `${id}-cc`, [
      { category: 'food_dining', descriptions: [{ desc: 'Groceries', merchant: 'Supermarket' }], minAmt: 1000, maxAmt: 3000, type: 'debit', frequency: 4 },
      { category: 'shopping', descriptions: [{ desc: 'Amazon', merchant: 'Amazon' }], minAmt: 500, maxAmt: 2000, type: 'debit', frequency: 2 },
    ], 3)
  ];

  allTxns.forEach(t => {
    insertTxn.run(t.id, t.persona_id, t.account_id, t.date, t.amount, t.type, t.category, t.description, t.merchant);
  });

  const insertInvestment = db.prepare('INSERT OR REPLACE INTO investments (id, persona_id, type, name, units, buy_price, current_nav, invested_amount, current_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  data.investments.forEach(i => {
    insertInvestment.run(i.id, i.persona_id, i.type, i.name, i.units, i.buy_price, i.current_nav, i.invested_amount, i.current_value);
  });
  
  const insertGoal = db.prepare('INSERT OR REPLACE INTO goals (id, persona_id, name, target_amount, current_amount, target_date, category) VALUES (?, ?, ?, ?, ?, ?, ?)');
  data.goals.forEach(g => {
    insertGoal.run(g.id, g.persona_id, g.name, g.target_amount, g.current_amount, g.target_date, g.category);
  });

  return data.persona;
}
