import React, { useState } from 'react';
import { Terminal, Check, Copy, ExternalLink, Cloud, Server, Database, Smartphone, GitBranch } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  badge: string;
  icon: any;
  description: string;
  commands?: string[];
  details: string[];
}

export const DeployGuide: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps: Step[] = [
    {
      id: 'step-1',
      title: 'Passo 1: Criar o Banco Cloudflare D1 (100% Gratuito)',
      badge: 'Cloudflare D1',
      icon: Database,
      description: 'O Cloudflare D1 é um banco relacional SQLite serverless, distribuído globalmente e gratuito.',
      commands: [
        '# 1. Login na sua conta Cloudflare pelo terminal',
        'npx wrangler login',
        '',
        '# 2. Criação do banco D1',
        'npx wrangler d1 create whatsapp-leads-db',
      ],
      details: [
        'O terminal retornará o database_id. Abra o arquivo wrangler.toml e cole o ID gerado.',
        'Em seguida, execute as migrações com o schema SQL fornecido.',
      ],
    },
    {
      id: 'step-2',
      title: 'Passo 2: Executar o Schema SQL no Banco D1',
      badge: 'Migrations',
      icon: Server,
      description: 'Cria a tabela leads com suporte ao fuso horário de Brasília e índices.',
      commands: [
        '# Aplica a tabela leads no banco remoto de produção',
        'npx wrangler d1 execute whatsapp-leads-db --remote --file=./functions/schema.sql',
      ],
      details: [
        'A tabela terá os campos: id, nome, raw_text, origem e timestamp.',
        'O fuso de Brasília (America/Sao_Paulo) é registrado automaticamente a cada POST.',
      ],
    },
    {
      id: 'step-3',
      title: 'Passo 3: Deploy com Assets Estáticos e D1',
      badge: 'Cloudflare Deploy',
      icon: Cloud,
      description: 'Publica a API Serverless com os assets estáticos gerados em dist/ e o banco D1.',
      commands: [
        '# 1. Gerar os assets para a pasta dist',
        'npm run build',
        '',
        '# 2. Executar o deploy via Wrangler',
        'npx wrangler deploy',
      ],
      details: [
        'Resolve o erro: "The `assets` property in your configuration is missing the required `directory` property", pois o wrangler.toml agora possui [assets] directory = "./dist"!',
        'As rotas /api/lead e /api/relatorio rodam no Worker com acesso ao banco D1.',
        'O terminal retornará a URL oficial da aplicação.',
      ],
    },
    {
      id: 'step-4',
      title: 'Passo 4: Vincular o Banco D1 nas Configurações do Pages',
      badge: 'Binding D1',
      icon: Database,
      description: 'Conecta o banco de dados criado às Pages Functions para persistência dos leads.',
      commands: [
        '# Pelo Dashboard da Cloudflare:',
        '# 1. Acesse Workers & Pages > whatsapp-leads-dashboard > Settings',
        '# 2. Vá em Functions > D1 database bindings > Add binding',
        '# 3. Variable name: DB',
        '# 4. D1 database: whatsapp-leads-db',
      ],
      details: [
        'Isso permite que context.env.DB acesse o banco SQLite em produção gratuitamente.',
        'Para testar localmente antes do deploy: npx wrangler pages dev public --d1=DB=whatsapp-leads-db',
      ],
    },
    {
      id: 'step-5',
      title: 'Passo 5: Rodar o Cliente WhatsApp Local (Baileys)',
      badge: 'Node.js Baileys',
      icon: Smartphone,
      description: 'Conecta ao WhatsApp Web sem custos de mensalidade e monitora as mensagens.',
      commands: [
        '# 1. Acesse a pasta bridge',
        'cd bridge',
        '',
        '# 2. Instale as dependências',
        'npm install',
        '',
        '# 3. Configure a URL do Pages no .env',
        'cp .env.example .env',
        '# Edite o .env colocando PAGES_URL=https://whatsapp-leads-dashboard.pages.dev',
        '',
        '# 4. Inicie o cliente e escaneie o QR Code no terminal',
        'npm start',
      ],
      details: [
        'Escaneie o QR Code impresso no terminal pelo seu aplicativo do WhatsApp.',
        'A sessão é salva na pasta auth_info_baileys para que você não precise escanear novamente.',
        'Ao receber mensagem com Smart Link / Lead: [Nome], o bot responde "Integração ok" e grava no D1.',
      ],
    },
    {
      id: 'step-6',
      title: 'Passo 6: Deploy Contínuo via GitHub (Recomendado)',
      badge: 'Git & GitHub',
      icon: GitBranch,
      description: 'Conecte seu repositório GitHub ao Cloudflare Pages para deploys automáticos a cada push.',
      commands: [
        'git init',
        'git add .',
        'git commit -m "feat: deploy direto cloudflare pages com functions e d1"',
        'git branch -M main',
        'git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git',
        'git push -u origin main',
      ],
      details: [
        'No painel da Cloudflare Pages, selecione o repositório GitHub.',
        'Configurações de Build no Cloudflare Pages: Build output directory: public | Build command: (deixe em branco)',
        'O .gitignore já está pré-configurado para ignorar a pasta auth_info_baileys/ e arquivos .env.',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-600" />
          <span>Guia Passo a Passo: Execução Local e Deploy na Cloudflare</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Siga estas 6 etapas simples para colocar a solução 100% gratuita no ar em menos de 10 minutos.
        </p>

        <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <span className="text-emerald-700 text-lg">💡</span>
          <div className="text-xs text-emerald-900 leading-relaxed">
            <strong className="font-semibold block mb-0.5">Configuração de Assets Corrigida no wrangler.toml:</strong>
            Adicionada a propriedade <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">[assets] directory = "./dist"</code> exigida pelo Cloudflare Wrangler.
            Para o deploy, basta rodar <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">npm run build && npx wrangler deploy</code> (ou <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">npm run deploy</code>).
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const fullCmd = step.commands ? step.commands.join('\n') : '';

          return (
            <div key={step.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-500">{step.description}</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold self-start sm:self-auto">
                  {step.badge}
                </span>
              </div>

              {step.commands && step.commands.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => copyToClipboard(fullCmd, step.id)}
                    className="absolute right-3 top-3 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                    title="Copiar comandos"
                  >
                    {copiedIndex === step.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
                    {fullCmd}
                  </pre>
                </div>
              )}

              <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                {step.details.map((d, i) => (
                  <li key={i} className="leading-relaxed">
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};
