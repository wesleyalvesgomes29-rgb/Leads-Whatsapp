import React, { useState } from 'react';
import { Copy, Check, FileCode, Terminal, Download, ExternalLink } from 'lucide-react';
import { ProjectFile } from '../types';

interface CodeViewerProps {
  files: ProjectFile[];
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ files }) => {
  const [activeFileId, setActiveFileId] = useState<string>(files[0]?.id || '');
  const [copied, setCopied] = useState(false);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  const handleCopyCode = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileCode className="w-5 h-5 text-indigo-600" />
              <span>Repositório de Arquivos & Código Completo</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Todos os arquivos prontos para estruturar seu repositório Git e deploy na Cloudflare
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadFile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Arquivo</span>
            </button>
            <button
              onClick={handleCopyCode}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 shadow-xs ${
                copied
                  ? 'bg-emerald-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Código Copiado!' : 'Copiar Arquivo'}</span>
            </button>
          </div>
        </div>

        {/* File Tabs List */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 no-scrollbar">
          {files.map((file) => (
            <button
              key={file.id}
              onClick={() => {
                setActiveFileId(file.id);
                setCopied(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                activeFileId === file.id
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100'
              }`}
            >
              <span className="font-mono">{file.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active File Info Bar */}
      {activeFile && (
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 font-mono">{activeFile.path}</span>
            <span className="text-slate-400">•</span>
            <span>{activeFile.description}</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
            <span className="px-2 py-0.5 bg-slate-200 rounded uppercase font-bold">
              {activeFile.language}
            </span>
            <span>{activeFile.content.split('\n').length} linhas</span>
          </div>
        </div>
      )}

      {/* Code Display Area with Syntax Styling */}
      <div className="relative bg-slate-950 p-4 sm:p-6 overflow-x-auto max-h-[580px] font-mono text-xs leading-relaxed text-slate-200">
        <pre className="selection:bg-indigo-500/30 whitespace-pre">
          {activeFile?.content}
        </pre>
      </div>
    </div>
  );
};
