import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, Sparkles, MessageCircle } from 'lucide-react';
import { Lead } from '../types';
import { getBrasiliaDateParts } from '../data/mockLeads';

interface LeadSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (newLead: Lead) => void;
}

const REGEX_PATTERN = /Smart Link\s*\/\s*Lead:\s*([^\n\r]+)/i;

const PRESETS = [
  'Smart Link / Lead: Ana Beatriz Silveira',
  'Olá equipe! Smart Link / Lead: Gabriel Antunes de Oliveira - Lote 42',
  'Smart Link / Lead: Dra. Camila Sampaio\nInteressada na Casa 12',
  'Mensagem aleatória sem o padrão do lead (teste de descarte)',
];

export const LeadSimulatorModal: React.FC<LeadSimulatorModalProps> = ({
  isOpen,
  onClose,
  onAddLead,
}) => {
  const [senderName, setSenderName] = useState('Operações Internas - INC Empreendimentos');
  const [rawMessage, setRawMessage] = useState('Smart Link / Lead: Ricardo Fonseca Guimarães');
  const [extractedName, setExtractedName] = useState<string | null>(null);
  const [isSuccessFeedback, setIsSuccessFeedback] = useState(false);

  useEffect(() => {
    const match = rawMessage.match(REGEX_PATTERN);
    if (match && match[1]) {
      setExtractedName(match[1].trim());
    } else {
      setExtractedName(null);
    }
  }, [rawMessage]);

  if (!isOpen) return null;

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractedName) return;

    const { dateOnly, timeOnly } = getBrasiliaDateParts();

    const newLead: Lead = {
      id: Date.now(),
      nome: extractedName,
      hora: timeOnly,
      timestamp: `${dateOnly} ${timeOnly}`,
      origem: senderName,
      rawText: rawMessage,
      statusResposta: 'Integração ok',
    };

    onAddLead(newLead);
    setIsSuccessFeedback(true);

    setTimeout(() => {
      setIsSuccessFeedback(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Simulador de Mensagem WhatsApp (Baileys)
              </h3>
              <p className="text-xs text-slate-500">
                Teste o fluxo de recepção, extração de Regex e auto-resposta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {isSuccessFeedback ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-slate-900">
              Fluxo Executado com Sucesso!
            </h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Auto-resposta <strong>"Integração ok"</strong> simulada no chat e lead gravado no banco de dados com fuso de Brasília.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSimulate} className="space-y-4">
            {/* Presets rápidos */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Exemplos Rápidos de Mensagens:</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRawMessage(preset)}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-left truncate max-w-xs"
                  >
                    {preset.slice(0, 32)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Contato Remetente */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contato Remetente (pushName no WhatsApp):
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Texto da Mensagem */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Texto Recebido no WhatsApp (com padrão Smart Link / Lead: [Nome]):
              </label>
              <textarea
                rows={3}
                value={rawMessage}
                onChange={(e) => setRawMessage(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            {/* Diagnóstico da Regex em tempo real */}
            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              extractedName
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/70 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {extractedName ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Regex Correspondida com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Nenhum Lead Detectado pela Regex</span>
                  </>
                )}
              </div>

              {extractedName ? (
                <div className="space-y-1">
                  <p><strong>Nome Capturado:</strong> <span className="underline decoration-emerald-500 decoration-2">{extractedName}</span></p>
                  <p><strong>Resposta Automática no Chat:</strong> "Integração ok"</p>
                  <p className="text-[11px] text-emerald-700">
                    <strong>Payload HTTP enviado:</strong> {JSON.stringify({ lead: extractedName, rawText: rawMessage.slice(0, 30) + '...' })}
                  </p>
                </div>
              ) : (
                <p className="text-rose-700">
                  A mensagem precisa conter o padrão: <code>Smart Link / Lead: [Nome]</code>. O cliente Baileys descartará mensagens sem esse formato.
                </p>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!extractedName}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simular Envio e Gravar no D1</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
