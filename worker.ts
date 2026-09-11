/**
 * Cloudflare Worker: Backend Serverless para Monitoramento de Leads WhatsApp
 * Stack: Cloudflare Workers + D1 Database (SQLite serverless)
 * Fuso horário: Horário Oficial de Brasília (America/Sao_Paulo / UTC-3)
 */

// Declaração dos tipos do Cloudflare D1 Database (@cloudflare/workers-types)
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta?: { last_row_id?: number; changes?: number; duration?: number };
  error?: string;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

export interface Env {
  DB: D1Database;
}

// Utilitário para cabeçalhos CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json; charset=utf-8",
};

/**
 * Retorna a data e hora atual no fuso horário oficial de Brasília (America/Sao_Paulo)
 * Formato retornado: 'YYYY-MM-DD HH:mm:ss'
 */
function getBrasiliaTimestamp(date = new Date()): { full: string; dateOnly: string; timeOnly: string } {
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
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "00";

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = getPart("hour");
  const minute = getPart("minute");
  const second = getPart("second");

  const dateOnly = `${year}-${month}-${day}`;
  const timeOnly = `${hour}:${minute}:${second}`;
  const full = `${dateOnly} ${timeOnly}`;

  return { full, dateOnly, timeOnly };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Tratamento de preflight CORS (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      // -------------------------------------------------------------
      // 1. ROTA POST /api/lead: Registra novo lead capturado no WhatsApp
      // -------------------------------------------------------------
      if (request.method === "POST" && url.pathname === "/api/lead") {
        let body: { lead?: string; rawText?: string; origem?: string };
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

        // Timestamp oficial de Brasília
        const { full: timestampBrasilia } = getBrasiliaTimestamp();

        // Inserção no Cloudflare D1
        const result = await env.DB.prepare(
          `INSERT INTO leads (nome, raw_text, origem, timestamp) 
           VALUES (?, ?, ?, ?)`
        )
          .bind(nomeLead, rawText, origem, timestampBrasilia)
          .run();

        return new Response(
          JSON.stringify({
            success: true,
            message: "Lead registrado com sucesso no D1!",
            data: {
              id: result.meta?.last_row_id || null,
              lead: nomeLead,
              timestamp: timestampBrasilia,
              fuso: "America/Sao_Paulo (GMT-3)",
            },
          }),
          { status: 201, headers: corsHeaders }
        );
      }

      // -------------------------------------------------------------
      // 2. ROTA GET /api/relatorio: Contagem de hoje e lista do dia
      // -------------------------------------------------------------
      if (request.method === "GET" && url.pathname === "/api/relatorio") {
        const { dateOnly: hojeBrasilia } = getBrasiliaTimestamp();
        const inicioDia = `${hojeBrasilia} 00:00:00`;
        const fimDia = `${hojeBrasilia} 23:59:59`;

        // Total de leads hoje no fuso de Brasília
        const countResult = await env.DB.prepare(
          `SELECT COUNT(*) as total FROM leads 
           WHERE timestamp >= ? AND timestamp <= ?`
        )
          .bind(inicioDia, fimDia)
          .first<{ total: number }>();

        const totalHoje = countResult ? countResult.total : 0;

        // Lista de leads hoje em ordem decrescente
        const leadsResult = await env.DB.prepare(
          `SELECT id, nome, timestamp, origem FROM leads 
           WHERE timestamp >= ? AND timestamp <= ? 
           ORDER BY timestamp DESC`
        )
          .bind(inicioDia, fimDia)
          .all<{ id: number; nome: string; timestamp: string; origem: string }>();

        // Formata a hora para exibição direta
        const leadsFormatados = (leadsResult.results || []).map((lead) => {
          const parts = lead.timestamp.split(" ");
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
      }

      // -------------------------------------------------------------
      // 3. ROTA GET /api/health: Verificação de saúde da API
      // -------------------------------------------------------------
      if (request.method === "GET" && (url.pathname === "/api/health" || url.pathname === "/")) {
        const { full: nowBrasilia } = getBrasiliaTimestamp();
        return new Response(
          JSON.stringify({
            status: "online",
            service: "WhatsApp Leads Worker",
            timeBrasilia: nowBrasilia,
            endpoints: ["POST /api/lead", "GET /api/relatorio", "GET /api/health"],
          }),
          { status: 200, headers: corsHeaders }
        );
      }

      // 404 para rotas desconhecidas
      return new Response(
        JSON.stringify({ error: "Rota não encontrada", pathname: url.pathname }),
        { status: 404, headers: corsHeaders }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({
          error: "Erro interno no processamento do Worker",
          message: err.message || String(err),
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
