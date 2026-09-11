/**
 * Cloudflare Pages Function: POST /api/lead
 * Endpoint para salvar lead extraído do WhatsApp no banco Cloudflare D1
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

  const dateOnly = `${year}-${month}-${day}`;
  const timeOnly = `${hour}:${minute}:${second}`;
  const full = `${dateOnly} ${timeOnly}`;

  return { full, dateOnly, timeOnly };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
  const { request, env } = context;

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

    // Insere no banco D1 da Cloudflare
    const result = await env.DB.prepare(
      `INSERT INTO leads (nome, raw_text, origem, timestamp) VALUES (?, ?, ?, ?)`
    )
      .bind(nomeLead, rawText, origem, timestampBrasilia)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Lead registrado com sucesso no Cloudflare D1 via Pages Function!",
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
      JSON.stringify({ error: "Erro interno ao processar lead", message: err.message || String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
}
