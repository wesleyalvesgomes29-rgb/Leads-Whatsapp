import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  FileCode,
  Terminal,
  Activity,
  PlusCircle,
  ExternalLink,
  MessageSquareCode,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Lead, ActiveTab } from './types';
import { generateInitialLeads, getBrasiliaDateParts } from './data/mockLeads';
import { PROJECT_FILES } from './data/projectFiles';
import { MetricCard } from './components/MetricCard';
import { LeadsTable } from './components/LeadsTable';
import { LeadSimulatorModal } from './components/LeadSimulatorModal';
import { CodeViewer } from './components/CodeViewer';
import { DeployGuide } from './components/DeployGuide';

const LOCAL_STORAGE_KEY = 'inc_leads_data_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao ler localStorage', e);
    }
    return generateInitialLeads();
  });

  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [currentTimeBrasilia, setCurrentTimeBrasilia] = useState('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState('');
  const [currentDateOnly, setCurrentDateOnly] = useState('');

  // Atualiza relógio do Fuso de Brasília a cada segundo
  useEffect(() => {
    const updateTime = () => {
      const { timeOnly, dateFormatted, dateOnly } = getBrasiliaDateParts();
      setCurrentTimeBrasilia(timeOnly);
      setCurrentDateFormatted(dateFormatted);
      setCurrentDateOnly(dateOnly);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Salva leads no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(leads));
    } catch (e) {
      console.error('Erro ao salvar no localStorage', e);
    }
  }, [leads]);

  // Contagem de leads recebidos hoje no fuso de Brasília
  const leadsHoje = leads.filter((l) => l.timestamp.startsWith(currentDateOnly));

  const handleAddLead = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev]);
  };

  const handleDeleteLead = (id: number) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const handleResetSampleData = () => {
    const fresh = generateInitialLeads();
    setLeads(fresh);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Application Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs tracking-wider">
              INC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  Monitor de Leads WhatsApp
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  100% Gratuito
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Operações Internas • INC Empreendimentos • Baileys + Cloudflare D1
              </p>
            </div>
          </div>

          {/* Right Status & Actions */}
          <div className="flex items-center gap-3">
            {/* Live Brasília Clock */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentTimeBrasilia || '--:--:--'} (Brasília)</span>
            </div>

            {/* Quick Test Simulator Button */}
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simular Entrada</span>
              <span className="sm:hidden">Simular</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Dashboard & Leads de Hoje</span>
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              {leadsHoje.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'code'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Arquivos do Projeto (Código Fonte)</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 text-[11px] font-bold">
              {PROJECT_FILES.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Guia de Deploy (Cloudflare & Baileys)</span>
          </button>

          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="py-3 px-3.5 text-xs font-semibold flex items-center gap-2 text-indigo-600 hover:text-indigo-800 border-b-2 border-transparent transition whitespace-nowrap ml-auto"
          >
            <MessageSquareCode className="w-4 h-4" />
            <span>Testador de Regex WhatsApp</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Banner Informativo do Fluxo */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Monitoramento Ativo: Operações Internas - INC Empreendimentos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Padrão esperado:{' '}
                <code className="bg-slate-100 text-emerald-800 px-2 py-0.5 rounded font-mono text-[11px] font-semibold">
                  Smart Link / Lead: [Nome]
                </code>{' '}
                • Resposta automática configurada:{' '}
                <span className="font-semibold text-slate-700">"Integração ok"</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={handleResetSampleData}
              className="text-xs text-slate-500 hover:text-slate-700 underline px-2 py-1"
            >
              Restaurar Dados de Teste
            </button>
          </div>
        </div>

        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <MetricCard
                title="Leads Recebidos Hoje"
                value={leadsHoje.length}
                subtitle="Contagem entre 00:00:00 e 23:59:59"
                icon={Users}
                variant="emerald"
                tag="Destaque Principal"
              />

              <MetricCard
                title="Horário Oficial"
                value={currentDateFormatted || '--/--/----'}
                subtitle={`Fuso Oficial: Brasília (${currentTimeBrasilia || 'GMT-3'})`}
                icon={Clock}
                variant="indigo"
                tag="America/Sao_Paulo"
              />

              <MetricCard
                title="Auto-Resposta Baileys"
                value='"Integração ok"'
                subtitle="Enviada instantaneamente no chat pelo bot"
                icon={CheckCircle2}
                variant="amber"
                tag="100% Gratuito"
              />

              <MetricCard
                title="Total Histórico"
                value={leads.length}
                subtitle="Armazenamento serverless no Cloudflare D1"
                icon={Building2}
                variant="blue"
                tag="SQLite D1"
              />
            </div>

            {/* Leads Table Component */}
            <LeadsTable
              leads={leadsHoje}
              dateFormatted={currentDateFormatted}
              onRefresh={() => {}}
              onDeleteLead={handleDeleteLead}
              onOpenSimulator={() => setIsSimulatorOpen(true)}
            />
          </div>
        )}

        {/* Tab 2: Code Viewer */}
        {activeTab === 'code' && (
          <CodeViewer files={PROJECT_FILES} />
        )}

        {/* Tab 3: Deploy Guide */}
        {activeTab === 'guide' && (
          <DeployGuide />
        )}
      </main>

      {/* Simulator Modal */}
      <LeadSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onAddLead={handleAddLead}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Engenharia de Software • Monitor de Leads WhatsApp • <strong>INC Empreendimentos</strong>
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Node.js Baileys</span>
            <span>•</span>
            <span>Cloudflare Workers</span>
            <span>•</span>
            <span>Cloudflare D1</span>
            <span>•</span>
            <span>Cloudflare Pages</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
