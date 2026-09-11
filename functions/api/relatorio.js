/**
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

  const dateOnly = `${year}-${month}-${day}`;
  const timeOnly = `${hour}:${minute}:${second}`;
  const full = `${dateOnly} ${timeOnly}`;

  return { full, dateOnly, timeOnly };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { env } = context;

  // Verifica se o D1 Database está vinculado (Binding: DB)
  if (!env.DB) {
    return new Response(
      JSON.stringify({
        error: "Banco Cloudflare D1 não configurado. Adicione o binding D1 com a variável 'DB' no painel do Cloudflare Pages (Settings > Functions > D1 Database Bindings).",
      }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const { dateOnly: hojeBrasilia } = getBrasiliaTimestamp();
    const inicioDia = `${hojeBrasilia} 00:00:00`;
    const fimDia = `${hojeBrasilia} 23:59:59`;

    // 1. Total de leads hoje no fuso de Brasília
    const countResult = await env.DB.prepare(
      `SELECT COUNT(*) as total FROM leads WHERE timestamp >= ? AND timestamp <= ?`
    )
      .bind(inicioDia, fimDia)
      .first();

    const totalHoje = countResult ? countResult.total : 0;

    // 2. Lista de leads hoje em ordem decrescente (mais recentes primeiro)
    const leadsResult = await env.DB.prepare(
      `SELECT id, nome, timestamp, origem FROM leads 
       WHERE timestamp >= ? AND timestamp <= ? 
       ORDER BY timestamp DESC`
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
      JSON.stringify({ error: "Erro interno ao gerar relatório", message: err.message || String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
}
