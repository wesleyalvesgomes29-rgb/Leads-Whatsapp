import { ProjectFile } from '../types';

export const PROJECT_FILES: ProjectFile[] = [
  {
    id: 'public-index',
    name: 'public/index.html',
    path: 'public/index.html',
    language: 'html',
    description: 'Frontend estático puro com Tailwind CDN para Cloudflare Pages (sem Vite ou compilação)',
    content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard de Leads WhatsApp | INC Empreendimentos</title>
  <!-- Tailwind CSS CDN para renderização imediata sem compilação -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>body { font-family: 'Plus Jakarta Sans', sans-serif; }</style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen">
  <!-- Top Header -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">INC</div>
        <div>
          <h1 class="text-base sm:text-lg font-bold text-slate-900 leading-tight">Monitor de Leads WhatsApp</h1>
          <p class="text-xs text-slate-500 font-medium">Operações Internas • INC Empreendimentos • Fuso de Brasília</p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <span class="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Pages Functions Ativo
        </span>
      </div>
    </div>
  </header>

  <!-- Conteúdo Principal -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <!-- Grid de Métricas -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <!-- Contagem Diária -->
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Contagem Diária</span>
        <div class="text-4xl font-extrabold text-slate-900 mt-2" id="count-hoje">0</div>
        <p class="text-xs font-medium text-emerald-700 mt-2">Leads Recebidos Hoje • 00:00 às 23:59 (Brasília)</p>
      </div>
      <!-- Fuso Horário de Brasília -->
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Fuso Horário Oficial</span>
        <div class="text-2xl font-bold text-slate-900 mt-2" id="data-hoje-label">--/--/----</div>
        <p class="text-xs text-slate-500 mt-2">Horário de Brasília (America/Sao_Paulo • GMT-3)</p>
      </div>
      <!-- Resposta Automática -->
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Resposta Automática</span>
        <div class="text-2xl font-bold text-slate-900 mt-2">"Integração ok"</div>
        <p class="text-xs text-slate-500 mt-2">Disparada no chat pelo script Baileys</p>
      </div>
    </div>

    <!-- Tabela e Ações -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Leads Capturados Hoje</h2>
          <p class="text-xs text-slate-500">Filtrados via Regex: Smart Link / Lead: [Nome]</p>
        </div>
        <div class="flex gap-2">
          <button id="btn-copiar-lista" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold">📋 Copiar Lista Formatada</button>
          <button id="btn-exportar-csv" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold">📥 Exportar CSV</button>
        </div>
      </div>
      <div class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full text-left text-sm text-slate-600">
          <thead class="bg-slate-100 text-xs font-semibold uppercase text-slate-700 border-b border-slate-200">
            <tr>
              <th class="py-3 px-4"># ID</th>
              <th class="py-3 px-4">Nome do Lead</th>
              <th class="py-3 px-4">Entrada (Brasília)</th>
              <th class="py-3 px-4">Origem</th>
              <th class="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody id="tabela-leads-body" class="divide-y divide-slate-100 bg-white">
            <tr><td colspan="5" class="py-8 text-center text-slate-400">Carregando relatório...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>

  <script>
    async function carregarRelatorio() {
      try {
        const res = await fetch("/api/relatorio");
        const json = await res.json();
        if (json.success && json.data) {
          document.getElementById("count-hoje").textContent = json.data.totalHoje;
          document.getElementById("data-hoje-label").textContent = json.data.dataBrasilia;
          const tbody = document.getElementById("tabela-leads-body");
          const leads = json.data.leads || [];
          if (!leads.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-slate-400">Nenhum lead recebido hoje.</td></tr>';
            return;
          }
          tbody.innerHTML = leads.map(l => \`
            <tr class="hover:bg-slate-50 border-b border-slate-100">
              <td class="py-3 px-4 font-mono text-xs">#\${l.id}</td>
              <td class="py-3 px-4 font-semibold text-slate-900">\${l.nome}</td>
              <td class="py-3 px-4 font-mono text-xs">\${l.hora}</td>
              <td class="py-3 px-4 text-xs text-slate-500">\${l.origem || 'Operações Internas'}</td>
              <td class="py-3 px-4 text-center"><span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">✓ Integração ok</span></td>
            </tr>
          \`).join('');
        }
      } catch (err) {
        console.warn("Aviso ao carregar relatório:", err);
      }
    }
    carregarRelatorio();
    setInterval(carregarRelatorio, 15000);
  </script>
</body>
</html>`
  },
  {
    id: 'function-lead',
    name: 'functions/api/lead.js',
    path: 'functions/api/lead.js',
    language: 'javascript',
    description: 'Cloudflare Pages Function: POST /api/lead para salvar leads no D1 no fuso de Brasília',
    content: `/**
 * Cloudflare Pages Function: POST /api/lead
 * Registra novo lead capturado no WhatsApp no banco Cloudflare D1
 * Fuso horário: Horário Oficial de Brasília (America/Sao_Paulo / UTC-3)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json; charset=utf-8",
};

function getBrasiliaTimestamp(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type) => parts.find((p) => p.type === type)?.value || "00";

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = getPart("hour");
  const minute = getPart("minute");
  const second = getPart("second");

  const dateOnly = \`\${year}-\${month}-\${day}\`;
  const timeOnly = \`\${hour}:\${minute}:\${second}\`;
  const full = \`\${dateOnly} \${timeOnly}\`;

  return { full, dateOnly, timeOnly };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        error: "Banco D1 não configurado. Adicione o binding D1 'DB' no painel do Cloudflare Pages.",
      }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "JSON inválido no corpo da requisição." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const nomeLead = body.lead?.trim();
    const rawText = body.rawText || "";
    const origem = body.origem || "Operações Internas - INC Empreendimentos";

    if (!nomeLead) {
      return new Response(
        JSON.stringify({ error: "Campo 'lead' (nome do lead) é obrigatório." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { full: timestampBrasilia } = getBrasiliaTimestamp();

    const result = await env.DB.prepare(
      \`INSERT INTO leads (nome, raw_text, origem, timestamp) VALUES (?, ?, ?, ?)\`
    )
      .bind(nomeLead, rawText, origem, timestampBrasilia)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Lead registrado com sucesso no D1 via Pages Function!",
        data: {
          id: result.meta?.last_row_id || null,
          lead: nomeLead,
          timestamp: timestampBrasilia,
          fuso: "America/Sao_Paulo (GMT-3)",
        },
      }),
      { status: 201, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno", message: err.message || String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
}`
  },
  {
    id: 'function-relatorio',
    name: 'functions/api/relatorio.js',
    path: 'functions/api/relatorio.js',
    language: 'javascript',
    description: 'Cloudflare Pages Function: GET /api/relatorio para consulta de contagem diária e leads de hoje',
    content: `/**
 * Cloudflare Pages Function: GET /api/relatorio
 * Retorna o total de leads recebidos hoje e a lista detalhada no fuso de Brasília
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json; charset=utf-8",
};

function getBrasiliaTimestamp(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type) => parts.find((p) => p.type === type)?.value || "00";

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = getPart("hour");
  const minute = getPart("minute");
  const second = getPart("second");

  const dateOnly = \`\${year}-\${month}-\${day}\`;
  const timeOnly = \`\${hour}:\${minute}:\${second}\`;
  const full = \`\${dateOnly} \${timeOnly}\`;

  return { full, dateOnly, timeOnly };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { env } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        error: "Banco D1 não configurado. Adicione o binding D1 'DB' no painel do Pages.",
      }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const { dateOnly: hojeBrasilia } = getBrasiliaTimestamp();
    const inicioDia = \`\${hojeBrasilia} 00:00:00\`;
    const fimDia = \`\${hojeBrasilia} 23:59:59\`;

    // Total de leads hoje no fuso de Brasília
    const countResult = await env.DB.prepare(
      \`SELECT COUNT(*) as total FROM leads WHERE timestamp >= ? AND timestamp <= ?\`
    )
      .bind(inicioDia, fimDia)
      .first();

    const totalHoje = countResult ? countResult.total : 0;

    // Lista de leads hoje em ordem decrescente
    const leadsResult = await env.DB.prepare(
      \`SELECT id, nome, timestamp, origem FROM leads 
       WHERE timestamp >= ? AND timestamp <= ? 
       ORDER BY timestamp DESC\`
    )
      .bind(inicioDia, fimDia)
      .all();

    const leadsFormatados = (leadsResult.results || []).map((lead) => {
      const parts = (lead.timestamp || "").split(" ");
      const hora = parts[1] || "";
      return {
        id: lead.id,
        nome: lead.nome,
        hora: hora,
        timestamp: lead.timestamp,
        origem: lead.origem,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          dataBrasilia: hojeBrasilia,
          totalHoje: totalHoje,
          leads: leadsFormatados,
        },
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno", message: err.message || String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
}`
  },
  {
    id: 'schema',
    name: 'functions/schema.sql',
    path: 'functions/schema.sql',
    language: 'sql',
    description: 'Script DDL para criação da tabela de leads e índices de busca no Cloudflare D1',
    content: `-- ================================================================
-- Schema D1 Database (Cloudflare SQLite Serverless)
-- Monitoramento e Armazenamento de Leads do WhatsApp
-- ================================================================

CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    raw_text TEXT,
    origem TEXT DEFAULT 'Operações Internas - INC Empreendimentos',
    timestamp DATETIME DEFAULT (datetime('now', '-3 hours'))
);

-- Índice para acelerar consultas por data/fuso de Brasília
CREATE INDEX IF NOT EXISTS idx_leads_timestamp ON leads(timestamp);`
  },
  {
    id: 'whatsapp-client',
    name: 'bridge/whatsapp-client.js',
    path: 'bridge/whatsapp-client.js',
    language: 'javascript',
    description: 'Cliente local Baileys em Node.js com QR Code no terminal, regex e envio para Cloudflare Pages',
    content: `/**
 * CLIENTE WHATSAPP LOCAL (bridge/whatsapp-client.js)
 * Baileys (@whiskeysockets/baileys) - 100% gratuito, sem mensalidade
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import pino from "pino";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

// URL da sua Cloudflare Pages (ex: https://whatsapp-leads-dashboard.pages.dev)
const PAGES_URL = process.env.PAGES_URL || process.env.WORKER_URL || "https://SEU_PROJETO.pages.dev";
const TARGET_CONTACT_NAME = process.env.TARGET_CONTACT_NAME || "Operações Internas - INC Empreendimentos";
const TARGET_JID = process.env.TARGET_JID || "";
const REPLY_TEXT = process.env.REPLY_TEXT || "Integração ok";
const AUTH_DIR = path.join(__dirname, "auth_info_baileys");

// Regex para capturar: "Smart Link / Lead: [Nome do Lead]"
const LEAD_REGEX = /Smart Link\\s*\\/\\s*Lead:\\s*([^\\n\\r]+)/i;

async function startWhatsAppBridge() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  console.log(\`📦 Baileys v\${version.join(".")} (Mais recente: \${isLatest})\`);

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ["Monitor Leads INC", "Chrome", "1.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\\n📲 ESCANEIE O QR CODE NO TERMINAL:\\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) setTimeout(startWhatsAppBridge, 3000);
    } else if (connection === "open") {
      console.log("✅ CONEXÃO ESTABELECIDA COM SUCESSO!");
      console.log(\`🎧 Monitorando contato: "\${TARGET_CONTACT_NAME}"\`);
      console.log(\`🌐 Apontando para Cloudflare Pages: \${PAGES_URL}\`);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue;

      const rawText =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        "";

      if (!rawText) continue;

      const remoteJid = msg.key.remoteJid || "";
      const pushName = msg.pushName || "";

      // Verifica o padrão da mensagem
      const match = rawText.match(LEAD_REGEX);

      if (match) {
        const leadNome = match[1].trim();
        console.log(\`\\n🎯 NOVO LEAD IDENTIFICADO: "\${leadNome}"\`);

        // 1. Envia resposta no chat do WhatsApp: "Integração ok"
        try {
          await sock.sendMessage(remoteJid, { text: REPLY_TEXT }, { quoted: msg });
          console.log(\`💬 Resposta enviada com sucesso: "\${REPLY_TEXT}"\`);
        } catch (err) {
          console.error("❌ Falha ao responder no chat:", err.message);
        }

        // 2. Envia POST HTTP para o Cloudflare Pages Function
        try {
          const response = await fetch(\`\${PAGES_URL}/api/lead\`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lead: leadNome,
              rawText: rawText,
              origem: pushName || "Operações Internas - INC Empreendimentos",
            }),
          });
          const resData = await response.json();
          console.log("✅ Lead gravado no Cloudflare D1 via Pages Function:", resData);
        } catch (fetchErr) {
          console.error("❌ Erro no POST HTTP:", fetchErr.message);
        }
      }
    }
  });
}

startWhatsAppBridge();`
  },
  {
    id: 'bridge-package',
    name: 'bridge/package.json',
    path: 'bridge/package.json',
    language: 'json',
    description: 'Manifesto de dependências do cliente Node.js com Baileys e QRCode',
    content: `{
  "name": "whatsapp-leads-bridge",
  "version": "1.0.0",
  "description": "Cliente WhatsApp Local gratuito com Baileys para monitoramento de leads INC Empreendimentos",
  "main": "whatsapp-client.js",
  "type": "module",
  "scripts": {
    "start": "node whatsapp-client.js",
    "dev": "node --watch whatsapp-client.js"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.7.12",
    "dotenv": "^16.4.7",
    "pino": "^9.6.0",
    "qrcode-terminal": "^0.12.0"
  }
}`
  },
  {
    id: 'env-example',
    name: 'bridge/.env.example',
    path: 'bridge/.env.example',
    language: 'env',
    description: 'Variáveis de ambiente do script local com a URL da Cloudflare Pages',
    content: `# URL do seu projeto no Cloudflare Pages (ex: https://whatsapp-leads-dashboard.pages.dev)
PAGES_URL=https://SEU_PROJETO.pages.dev

# Nome exato do contato no WhatsApp a monitorar
TARGET_CONTACT_NAME=Operações Internas - INC Empreendimentos

# Resposta padrão enviada no chat
REPLY_TEXT=Integração ok`
  }
];
