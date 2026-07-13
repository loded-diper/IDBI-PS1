# Architecture Overview

## System Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│   Frontend   │◄────►│  Backend API      │◄────►│  SQLite (seed data)  │
│  React+Vite  │      │  Express.js       │      └─────────────────────┘
│  Tailwind    │      │  /auth /dashboard │
│  Recharts    │      │  /personas        │
└─────────────┘      └──────────────────┘
     :5173                  :3001
```

## Data Flow

1. **Login**: User selects a persona → `POST /api/auth/login` → receives JWT token
2. **Dashboard**: Frontend sends authenticated requests → Backend queries SQLite → Computes real analytics → Returns JSON
3. **Health Score**: Computed from 4 weighted components (savings rate, DTI, emergency fund, diversification)

## Analytics Engine

### Financial Health Score (0-100)

| Component | Weight | Scoring |
|-----------|--------|---------|
| Savings Rate | 30% | ≥30% = 100, ≥20% = 80, ≥10% = 60 |
| Debt-to-Income | 25% | ≤10% = 100, ≤20% = 85, ≤30% = 70 |
| Emergency Fund | 25% | ≥6mo = 100, ≥4mo = 80, ≥3mo = 65 |
| Investment Diversification | 20% | ≥3 types & 5+ holdings = 100 |

## Future Phases

- **Phase 1**: Core analytics (spending trends, portfolio view)
- **Phase 2**: AI Chat Avatar (Claude API integration)
- **Phase 3**: Recommendations Engine
- **Phase 4**: What-If Simulator
- **Phase 5**: Polish (multilingual, notifications)
