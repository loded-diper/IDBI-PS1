import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { initializeSchema } from './db';
import { seedDatabase } from './data/seedData';
import authRoutes from './routes/auth';
import personasRoutes from './routes/personas';
import dashboardRoutes from './routes/dashboard';
import recommendationsRoutes from './routes/recommendations';
import chatRoutes from './routes/chat';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://idbi-ps-1.vercel.app',
  ],
  credentials: true,
}));
app.use(express.json());

// Initialize database
console.log('\n🏦 Digital Wealth Avatar — Backend Server');
console.log('━'.repeat(50));
console.log('  📂 Initializing database...');
initializeSchema();
seedDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/personas', personasRoutes);
app.use('/api/dashboard/recommendations', recommendationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`  🚀 Server running on http://localhost:${PORT}`);
  console.log(`  📡 API endpoints:`);
  console.log(`     GET  /api/health`);
  console.log(`     GET  /api/personas`);
  console.log(`     POST /api/auth/login`);
  console.log(`     GET  /api/auth/me`);
  console.log(`     GET  /api/dashboard/summary`);
  console.log(`     GET  /api/dashboard/recent-transactions`);
  console.log(`     GET  /api/dashboard/spending-trend`);
  console.log('━'.repeat(50) + '\n');
});
