import axios from 'axios';
import type { Persona, AuthResponse, DashboardSummary, Transaction, SpendingTrend, SpendingAnalytics, PortfolioAnalytics, GoalProjected, Recommendation, CashFlowAnalytics } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export async function login(personaId: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { personaId });
  localStorage.setItem('token', data.token);
  localStorage.setItem('persona', JSON.stringify(data.persona));
  return data;
}

export async function register(payload: { name: string; age: number; risk_profile: string; goal: string }): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  localStorage.setItem('token', data.token);
  localStorage.setItem('persona', JSON.stringify(data.persona));
  return data;
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('persona');
}

export async function getMe(): Promise<Persona> {
  const { data } = await api.get<Persona>('/auth/me');
  return data;
}

export async function updateMe(payload: { name: string; risk_profile: string }): Promise<Persona> {
  const { data } = await api.put<Persona>('/auth/me', payload);
  localStorage.setItem('persona', JSON.stringify(data));
  return data;
}

// Personas
export async function getPersonas(): Promise<Persona[]> {
  const { data } = await api.get<Persona[]>('/personas');
  return data;
}

// Dashboard


export async function getRecommendations(): Promise<Recommendation[]> {
  const { data } = await api.get<Recommendation[]>('/dashboard/recommendations');
  return data;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>('/dashboard/summary');
  return data;
}

export async function getRecentTransactions(): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>('/dashboard/recent-transactions');
  return data;
}

export async function getSpendingTrend(): Promise<SpendingTrend[]> {
  const { data } = await api.get<SpendingTrend[]>('/dashboard/spending-trend');
  return data;
}

// Phase 1 Analytics
export async function getSpendingAnalytics(): Promise<SpendingAnalytics> {
  const { data } = await api.get<SpendingAnalytics>('/dashboard/spending');
  return data;
}

export async function getPortfolioAnalytics(): Promise<PortfolioAnalytics> {
  const { data } = await api.get<PortfolioAnalytics>('/dashboard/portfolio');
  return data;
}

export async function getGoalAnalytics(): Promise<GoalProjected[]> {
  const { data } = await api.get<GoalProjected[]>('/dashboard/goals');
  return data;
}

// Cash Flow
export async function getCashFlowAnalytics(): Promise<CashFlowAnalytics> {
  const { data } = await api.get<CashFlowAnalytics>('/dashboard/cashflow');
  return data;
}

export async function sendChatMessage(message: string, history: any[]): Promise<{reply: string}> {
  const { data } = await api.post<{reply: string}>('/chat/message', { message, history });
  return data;
}

export default api;
