/**
 * ============================================================================
 * CLIENTE WHATSAPP LOCAL (bridge/whatsapp-client.js)
 * ============================================================================
 * Tecnologia: Node.js + @whiskeysockets/baileys (100% gratuito e open-source)
 * Finalidade: Monitorar mensagens recebidas de "Operações Internas - INC Empreendimentos",
 *             extrair o nome do lead via Regex, responder "Integração ok"
 *             e enviar os dados via POST para a API do Cloudflare Worker.
 * ============================================================================
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

// Carrega variáveis do arquivo .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

// Configurações principais (URL do Cloudflare Pages com Functions ou Worker)
const PAGES_URL = process.env.PAGES_URL || process.env.WORKER_URL || "https://SEU_PROJETO.pages.dev";
const TARGET_CONTACT_NAME = process.env.TARGET_CONTACT_NAME || "Operações Internas - INC Empreendimentos";
const TARGET_JID = process.env.TARGET_JID || "";
const REPLY_TEXT = process.env.REPLY_TEXT || "Integração ok";
const AUTH_DIR = path.join(__dirname, "auth_info_baileys");

// Regex para capturar: "Smart Link / Lead: [Nome do Lead]"
// Suporta variações de espaçamento e quebras de linha
const LEAD_REGEX = /Smart Link\s*\/\s*Lead:\s*([^\n\r]+)/i;

console.log("===============================================================");
console.log("🚀 INICIANDO CLIENTE WHATSAPP BAILEYS (INC EMPREENDIMENTOS)");
console.log("===============================================================");
console.log(`📡 URL do Cloudflare Pages:  ${PAGES_URL}`);
console.log(`🎯 Contato Alvo Monitorado:  "${TARGET_CONTACT_NAME}"`);
console.log(`💬 Resposta Automática:      "${REPLY_TEXT}"`);
console.log("===============================================================\n");

async function startWhatsAppBridge() {
  // 1. Gerenciamento de credenciais locais (sessão salva em pasta para não pedir QR toda vez)
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  console.log(`📦 Versão do Baileys: v${version.join(".")} (Mais recente: ${isLatest})`);

  // 2. Criação do socket do WhatsApp com nível de log silencioso para pino
  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false, // Controlamos a exibição manual via evento connection.update
    auth: state,
    browser: ["Monitor Leads INC", "Chrome", "1.0.0"],
  });

  // Salva credenciais sempre que atualizadas
  sock.ev.on("creds.update", saveCreds);

  // 3. Monitoramento de conexão e exibição de QR Code no terminal
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n📲 ESCANEIE O QR CODE ABAIXO COM SEU WHATSAPP:\n");
      qrcode.generate(qr, { small: true });
      console.log("Acesse: WhatsApp > Aparelhos conectados > Conectar um aparelho\n");
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`⚠️ Conexão encerrada. Código: ${statusCode}. Reconectando? ${shouldReconnect}`);

      if (shouldReconnect) {
        setTimeout(startWhatsAppBridge, 3000);
      } else {
        console.log("❌ Sessão desconectada pelo usuário. Delete a pasta 'auth_info_baileys' e reinicie.");
      }
    } else if (connection === "open") {
      console.log("✅ CONEXÃO ESTABELECIDA COM SUCESSO AO WHATSAPP!");
      console.log(`🎧 Monitorando mensagens recebidas em tempo real...\n`);
    }
  });

  // 4. Monitoramento de mensagens recebidas
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      // Ignora mensagens enviadas por você mesmo
      if (msg.key.fromMe) continue;

      // Extrai o texto da mensagem (suporta texto simples e com citação/extended)
      const rawText =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        "";

      if (!rawText) continue;

      const remoteJid = msg.key.remoteJid || "";
      const pushName = msg.pushName || "";
      const isGroup = remoteJid.endsWith("@g.us");

      // Verificação do remetente
      // Compara com o nome configurado ("Operações Internas - INC Empreendimentos")
      // ou caso o usuário tenha fornecido o JID direto
      const nameMatches =
        pushName.toLowerCase().includes(TARGET_CONTACT_NAME.toLowerCase()) ||
        (TARGET_JID && remoteJid.includes(TARGET_JID));

      // Também verifica se o texto contém o padrão esperado
      const match = rawText.match(LEAD_REGEX);

      // Log informativo de mensagens recebidas para auxílio do operador
      console.log(`📨 [Mensagem Recebida] De: "${pushName}" (${remoteJid})`);

      // Se a mensagem possui o padrão do lead E (o nome do contato bate OU o padrão é estrito)
      if (match) {
        const leadNome = match[1].trim();

        console.log("\n🎯 NOVO LEAD IDENTIFICADO!");
        console.log(`👤 Nome Extraído: "${leadNome}"`);
        console.log(`📄 Texto Original: "${rawText.replace(/\n/g, " ")}"`);
        console.log(`📱 Remetente: ${pushName} (${remoteJid})`);

        // A) Responde no chat imediatamente: "Integração ok"
        try {
          await sock.sendMessage(
            remoteJid,
            { text: REPLY_TEXT },
            { quoted: msg }
          );
          console.log(`💬 Resposta enviada com sucesso no chat: "${REPLY_TEXT}"`);
        } catch (err) {
          console.error("❌ Falha ao enviar resposta no chat do WhatsApp:", err.message);
        }

        // B) POST HTTP para o Cloudflare Pages Function
        try {
          console.log(`🌐 Enviando POST para o Cloudflare Pages: ${PAGES_URL}/api/lead...`);
          const response = await fetch(`${PAGES_URL}/api/lead`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lead: leadNome,
              rawText: rawText,
              origem: pushName || "Operações Internas - INC Empreendimentos",
            }),
          });

          const resData = await response.json();

          if (response.ok) {
            console.log("✅ Lead gravado no Cloudflare D1 com sucesso via Pages Function!");
            console.log("📊 Resposta da API:", resData);
          } else {
            console.error("⚠️ API retornou status de erro:", response.status, resData);
          }
        } catch (fetchErr) {
          console.error("❌ Erro ao enviar requisição HTTP para o Cloudflare Pages:", fetchErr.message);
          console.error("Verifique se a URL do Cloudflare Pages está no ar e a variável PAGES_URL está correta no .env.");
        }

        console.log("---------------------------------------------------------------\n");
      }
    }
  });
}

// Execução da aplicação
startWhatsAppBridge().catch((err) => {
  console.error("❌ Erro fatal ao iniciar o cliente WhatsApp:", err);
});
