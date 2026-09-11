/**
 * Cloudflare Pages Function: Catch-all para rotas /api/*
 * Oferece roteamento dinâmico unificado caso o usuário prefira um único arquivo.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json; charset=utf-8",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Se a rota for raiz de /api
  if (url.pathname === "/api" || url.pathname === "/api/") {
    return new Response(
      JSON.stringify({
        status: "online",
        service: "WhatsApp Leads - Cloudflare Pages Functions API",
        endpoints: {
          post_lead: "POST /api/lead",
          get_relatorio: "GET /api/relatorio",
          get_health: "GET /api/health",
        },
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  return context.next();
}
