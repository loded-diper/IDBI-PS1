# WealthAI — AI Digital Wealth Management Avatar

> An AI-powered conversational wealth advisor that turns raw financial data into personalized, explainable financial guidance.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite, Tailwind CSS v4 |
| Charts | Recharts |
| Backend | Node.js + Express |
| Database | SQLite (via better-sqlite3) |
| Auth | Mock JWT (demo personas) |

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm

### Setup

```bash
# Clone and install
cd wealth-avatar

# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` with API proxy to backend at `http://localhost:3001`.

## 📁 Project Structure

```
wealth-avatar/
├── frontend/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── api/       # Axios API client
│   │   ├── components/# Reusable UI components
│   │   ├── context/   # Auth context
│   │   ├── pages/     # Login, Dashboard
│   │   └── types/     # TypeScript interfaces
├── backend/           # Express + SQLite
│   ├── src/
│   │   ├── data/      # Seed data generator
│   │   ├── middleware/ # JWT auth
│   │   ├── routes/    # API routes
│   │   └── services/  # Analytics engine
│   └── data/          # SQLite DB (auto-created)
└── docs/              # Documentation
```

## 👤 Demo Personas

| Persona | Type | Risk Profile |
|---------|------|-------------|
| Priya Sharma (29) | Young Professional | Aggressive |
| Rajesh & Meena Gupta (42) | Family Planner | Moderate |
| Dr. Sunita Rao (63) | Retiree | Conservative |

## ⚠️ Disclaimer

All financial data is synthetic. This is a prototype/demo and does not constitute financial advice.
