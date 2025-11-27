export interface Option {
  id: string;
  text: string;
  votes: number;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  options: Option[];
  active: boolean;
  createdAt: number;
  deadline?: number; // Timestamp en ms para el límite de tiempo
}

export interface VoteRecord {
  surveyId: string;
  optionId: string;
  voterIp: string; // En este contexto, será un UUID persistente simulando la IP
  timestamp: number;
}

export interface SecurityLogEntry {
  id: string;
  surveyId: string;
  voterIp: string;
  reason: string;
  timestamp: number;
}

export type ViewState = 'landing' | 'login' | 'admin-dashboard' | 'vote';