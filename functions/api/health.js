/**
 * Cloudflare Pages Function: GET /api/health
 */

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      status: "online",
      service: "Cloudflare Pages Functions API (WhatsApp Leads)",
      runtime: "edge",
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
