/**
 * Cloudflare Worker com Assets Estáticos e D1 Database
 * Integração de Leads WhatsApp - INC Empreendimentos
 * Fuso Horário Oficial de Brasília (America/Sao_Paulo / UTC-3)
 */

export interface D1Database {
  prepare: (query: string) => {
    bind: (...args: any[]) => {
      run: () => Promise<any>;
      first: () => Promise<any>;
      all: () => Promise<any>;
    };
  };
}

export interface Env {
  DB: D1Database;
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json; charset=utf-8",
};

/**
 * Retorna data e hora formatados no Fuso Horário Oficial de Brasília
 */
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

    // Tratamento de preflight CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Rota: POST /api/lead
    if (url.pathname === "/api/lead" && request.method === "POST") {
      if (!env.DB) {
        return new Response(
          JSON.stringify({
            error: "Banco D1 não configurado. Certifique-se de vincular a variável 'DB' no wrangler.toml.",
          }),
          { status: 500, headers: corsHeaders }
        );
      }

      try {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return new Response(
            JSON.stringify({ error: "JSON inválido no corpo da requisição." }),
            { status: 400, headers: corsHeaders }
          );
        }

        const nomeLead = body?.lead?.trim();
        const rawText = body?.rawText || "";
        const origem = body?.origem || "Operações Internas - INC Empreendimentos";

        if (!nomeLead) {
          return new Response(
            JSON.stringify({ error: "Campo 'lead' (nome do lead) é obrigatório." }),
            { status: 400, headers: corsHeaders }
          );
        }

        const { full: timestampBrasilia } = getBrasiliaTimestamp();

        const result = await env.DB.prepare(
          `INSERT INTO leads (nome, raw_text, origem, timestamp) VALUES (?, ?, ?, ?)`
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
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: "Erro ao salvar lead no D1", message: err.message || String(err) }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Rota: GET /api/relatorio
    if (url.pathname === "/api/relatorio" && request.method === "GET") {
      if (!env.DB) {
        return new Response(
          JSON.stringify({
            error: "Banco D1 não configurado. Certifique-se de vincular a variável 'DB' no wrangler.toml.",
          }),
          { status: 500, headers: corsHeaders }
        );
      }

      try {
        const { dateOnly: hojeBrasilia } = getBrasiliaTimestamp();
        const inicioDia = `${hojeBrasilia} 00:00:00`;
        const fimDia = `${hojeBrasilia} 23:59:59`;

        const countResult: any = await env.DB.prepare(
          `SELECT COUNT(*) as total FROM leads WHERE timestamp >= ? AND timestamp <= ?`
        )
          .bind(inicioDia, fimDia)
          .first();

        const totalHoje = countResult ? countResult.total : 0;

        const leadsResult: any = await env.DB.prepare(
          `SELECT id, nome, timestamp, origem FROM leads 
           WHERE timestamp >= ? AND timestamp <= ? 
           ORDER BY timestamp DESC`
        )
          .bind(inicioDia, fimDia)
          .all();

        const leadsFormatados = (leadsResult.results || []).map((lead: any) => {
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
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: "Erro ao consultar relatório", message: err.message || String(err) }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Rota: GET /api/health
    if (url.pathname === "/api/health") {
      return new Response(
        JSON.stringify({
          status: "online",
          service: "whatsapp-leads-api",
          fuso: "America/Sao_Paulo (GMT-3)",
          timestamp: getBrasiliaTimestamp().full,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Fallback para Assets Estáticos gerados pelo build (dist/)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  },
};
