export interface Lead {
  id: number;
  nome: string;
  hora: string;
  timestamp: string; // formato YYYY-MM-DD HH:mm:ss
  origem: string;
  rawText?: string;
  statusResposta: string;
}

export interface RelatorioDiario {
  dataBrasilia: string;
  totalHoje: number;
  leads: Lead[];
}

export type ActiveTab = 'dashboard' | 'simulator' | 'code' | 'guide';

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  language: string;
  description: string;
  content: string;
}
