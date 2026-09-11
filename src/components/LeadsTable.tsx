import React, { useState } from 'react';
import { Search, Copy, Download, RefreshCw, MessageSquare, Check, Trash2, Eye, ShieldCheck } from 'lucide-react';
import { Lead } from '../types';

interface LeadsTableProps {
  leads: Lead[];
  dateFormatted: string;
  onRefresh: () => void;
  onDeleteLead: (id: number) => void;
  onOpenSimulator: () => void;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  dateFormatted,
  onRefresh,
  onDeleteLead,
  onOpenSimulator,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedRawLead, setSelectedRawLead] = useState<Lead | null>(null);

  const filteredLeads = leads.filter((lead) =>
    lead.nome.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
    lead.hora.includes(searchTerm.trim()) ||
    (lead.rawText && lead.rawText.toLowerCase().includes(searchTerm.toLowerCase().trim()))
  );

  const handleCopyFormattedList = () => {
    if (leads.length === 0) return;

    let text = `*📋 RELATÓRIO DIÁRIO DE LEADS - INC EMPREENDIMENTOS*\n`;
    text += `📅 *Data de Referência:* ${dateFormatted} (Horário de Brasília)\n`;
    text += `📊 *Total de Leads Recebidos Hoje:* ${leads.length}\n\n`;
    text += `*Lista Consolidada:*\n`;

    leads.forEach((lead, index) => {
      text += `${index + 1}. *${lead.nome}* — às ${lead.hora}\n`;
    });

    text += `\n_Automação Baileys (@whiskeysockets/baileys) + Cloudflare Worker D1_`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;

    let csv = 'ID,Nome do Lead,Horario Brasilia,Timestamp Completo,Origem,Status Resposta\n';
    leads.forEach((l) => {
      csv += `"${l.id}","${l.nome.replace(/"/g, '""')}","${l.hora}","${l.timestamp}","${l.origem}","${l.statusResposta}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_leads_inc_${dateFormatted.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Leads Capturados Hoje</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Extração contínua de mensagens recebidas de <strong>Operações Internas - INC Empreendimentos</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCopyFormattedList}
            disabled={leads.length === 0}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition active:scale-95 shadow-xs ${
              copied
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-200 disabled:text-slate-400'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Lista Copiada!' : 'Copiar Lista Formatada'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={leads.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenSimulator}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Simular Lead WhatsApp</span>
          </button>

          <button
            onClick={onRefresh}
            title="Atualizar dados"
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input Filter */}
      <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por nome do lead ou horário..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100/70 text-xs font-semibold uppercase text-slate-600 border-b border-slate-200">
            <tr>
              <th scope="col" className="py-3.5 px-5 w-16"># ID</th>
              <th scope="col" className="py-3.5 px-5">Nome do Lead Extraído</th>
              <th scope="col" className="py-3.5 px-5">Horário de Entrada (Brasília)</th>
              <th scope="col" className="py-3.5 px-5">Origem / Contato</th>
              <th scope="col" className="py-3.5 px-5 text-center">Auto-Resposta</th>
              <th scope="col" className="py-3.5 px-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                  {searchTerm ? 'Nenhum lead encontrado com esse termo.' : 'Nenhum lead recebido hoje até o momento.'}
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-5 font-mono text-xs text-slate-500">
                    #{lead.id}
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="font-semibold text-slate-900 block text-sm">
                      {lead.nome}
                    </span>
                    {lead.rawText && (
                      <span className="text-xs text-slate-400 truncate max-w-xs block mt-0.5">
                        {lead.rawText.slice(0, 48)}...
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-xs">
                      {lead.hora}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-slate-600">
                    {lead.origem}
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>{lead.statusResposta}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="inline-flex items-center gap-1">
                      {lead.rawText && (
                        <button
                          onClick={() => setSelectedRawLead(lead)}
                          title="Ver mensagem bruta do WhatsApp"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteLead(lead.id)}
                        title="Remover lead"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Raw Message Viewer Modal */}
      {selectedRawLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Payload Bruto Recebido do WhatsApp
              </h3>
              <button
                onClick={() => setSelectedRawLead(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p><strong>Nome Extraído:</strong> {selectedRawLead.nome}</p>
                <p><strong>Horário Brasília:</strong> {selectedRawLead.timestamp}</p>
                <p><strong>Remetente:</strong> {selectedRawLead.origem}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">
                  Texto Completo da Mensagem (rawText):
                </span>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {selectedRawLead.rawText}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRawLead(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
