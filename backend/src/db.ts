import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data', 'wealth.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initializeSchema(): void {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS personas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER,
      type TEXT NOT NULL,
      description TEXT,
      avatar_emoji TEXT,
      risk_profile TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      persona_id TEXT NOT NULL REFERENCES personas(id),
      type TEXT NOT NULL,
      bank_name TEXT,
      account_name TEXT,
      balance REAL DEFAULT 0,
      credit_limit REAL,
      interest_rate REAL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      persona_id TEXT NOT NULL REFERENCES personas(id),
      account_id TEXT REFERENCES accounts(id),
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      merchant TEXT
    );

    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY,
      persona_id TEXT NOT NULL REFERENCES personas(id),
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      units REAL,
      buy_price REAL,
      current_nav REAL,
      invested_amount REAL NOT NULL,
      current_value REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      persona_id TEXT NOT NULL REFERENCES personas(id),
      type TEXT NOT NULL,
      lender TEXT,
      principal REAL NOT NULL,
      outstanding REAL NOT NULL,
      emi REAL NOT NULL,
      interest_rate REAL,
      tenure_months INTEGER,
      remaining_months INTEGER
    );

    CREATE TABLE IF NOT EXISTS insurance (
      id TEXT PRIMARY KEY,
      persona_id TEXT NOT NULL REFERENCES personas(id),
      type TEXT NOT NULL,
      provider TEXT,
      premium_annual REAL NOT NULL,
      cover_amount REAL NOT NULL,
      expiry_date TEXT
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      persona_id TEXT NOT NULL REFERENCES personas(id),
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL,
      target_date TEXT NOT NULL,
      category TEXT NOT NULL
    );
  `);
}
