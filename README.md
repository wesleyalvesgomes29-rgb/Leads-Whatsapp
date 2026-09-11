# 🚀 Monitor de Leads WhatsApp | Cloudflare Pages com Functions + D1 + Baileys

Solução completa, **100% gratuita** e sem custos de mensalidade para monitoramento contínuo de leads recebidos no WhatsApp, resposta automática instantânea (*"Integração ok"*) e contagem diária estruturada no fuso horário oficial de Brasília (GMT-3).

---

## 🛠️ Correção do Deploy no Cloudflare (Wrangler)

Se você executou `npx wrangler deploy` e recebeu o erro:
> `✘ [ERROR] The 'assets' property in your configuration is missing the required 'directory' property.`

**O motivo:** Nas versões recentes do Cloudflare Wrangler, ao utilizar a propriedade `assets` para servir arquivos estáticos junto com a API serverless, é obrigatório definir o subcampo `directory`.

**A solução configurada no `wrangler.toml`:**
```toml
name = "whatsapp-leads-dashboard"
compatibility_date = "2024-03-01"
main = "worker.ts"

[assets]
directory = "./dist"

[[d1_databases]]
binding = "DB"
database_name = "whatsapp-leads-db"
database_id = "SEU_DATABASE_ID_AQUI"
```

Os arquivos estáticos da pasta `public/` são copiados para a pasta `dist/` com o comando `npm run build`, e o Wrangler publica os assets estáticos e a API serverless conectada ao banco Cloudflare D1.

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    WHATSAPP (Remetente)                    │
│        "Operações Internas - INC Empreendimentos"           │
│        "Smart Link / Lead: Carlos Eduardo da Silva"         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│       1. CLIENTE LOCAL WHATSAPP (bridge/whatsapp-client.js) │
│       - Conexão via Baileys (@whiskeysockets/baileys)       │
│       - Sessão persistida em pasta local (auth_info_baileys) │
│       - Extração via Regex: Smart Link / Lead: (.*)         │
│       - Resposta no chat: "Integração ok"                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP POST /api/lead
                               ▼
┌─────────────────────────────────────────────────────────────┐
│         2. CLOUDFLARE PAGES COM FUNCTIONS (functions/api)   │
│       - functions/api/lead.js (POST: Salva no D1)           │
│       - functions/api/relatorio.js (GET: Contagem diária)   │
│       - Fuso horário oficial de Brasília (America/Sao_Paulo)│
│       - Banco SQLite Serverless Cloudflare D1 (binding: DB) │
└──────────────────────────────┬──────────────────────────────┘
                               │ Mesma URL (ex: https://app.pages.dev)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            3. FRONTEND ESTÁTICO (public/index.html)         │
│       - Servido diretamente pela CDN sem build              │
│       - Card de destaque: "Leads Recebidos Hoje"            │
│       - Relógio em tempo real no fuso de Brasília           │
│       - Tabela com horários de entrada e nomes              │
│       - Copiar lista formatada para WhatsApp & Exportar CSV │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Arquivos

```text
.
├── public/
│   └── index.html             # Frontend estático completo (Tailwind CDN, sem compilação)
├── functions/
│   ├── api/
│   │   ├── lead.js            # Pages Function: POST /api/lead (grava lead no D1)
│   │   ├── relatorio.js       # Pages Function: GET /api/relatorio (contagem do dia)
│   │   ├── health.js          # Pages Function: GET /api/health (status da API)
│   │   └── [[route]].js       # Pages Function: Catch-all para rotas /api/*
│   └── schema.sql             # DDL de criação da tabela de leads no D1 (SQLite)
├── bridge/
│   ├── package.json           # Dependências do cliente Baileys (Node.js)
│   ├── whatsapp-client.js     # Script de monitoramento WhatsApp e disparo HTTP
│   └── .env.example           # Variáveis com PAGES_URL e contato alvo
├── package.json               # Configuração leve sem builds complexos
└── README.md                  # Este guia completo
```

---

## 🚀 Passo a Passo para Deploy e Execução

### Passo 1: Criar o Banco D1 e Aplicar o Schema
1. Faça login no Wrangler:
   ```bash
   npx wrangler login
   ```
2. Crie o banco de dados gratuito Cloudflare D1:
   ```bash
   npx wrangler d1 create whatsapp-leads-db
   ```
3. Aplique a tabela de leads no banco remoto:
   ```bash
   npx wrangler d1 execute whatsapp-leads-db --remote --file=./functions/schema.sql
   ```

---

### Passo 2: Fazer Deploy na Cloudflare Pages

#### Opção A (Via Terminal com Wrangler):
Execute o deploy apontando diretamente para a pasta `public`:
```bash
npx wrangler pages deploy public --project-name=whatsapp-leads-dashboard
```
O Wrangler publicará:
- O frontend estático contido em `public/index.html`.
- As serverless functions da pasta `functions/api/`.
- Retornará a URL do projeto (ex: `https://whatsapp-leads-dashboard.pages.dev`).

#### Opção B (Via GitHub no Painel da Cloudflare):
1. Suba o projeto para o seu GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: deploy cloudflare pages com functions"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```
2. No painel da Cloudflare:
   - Vá em **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
   - Selecione seu repositório.
   - **Build command:** *(deixe em branco)*
   - **Build output directory:** `public`
   - Clique em **Save and Deploy**.

---

### Passo 3: Vincular o Banco D1 no Pages
Para que as Pages Functions acessem o banco de dados:
1. No painel da Cloudflare, acesse seu projeto Pages (**whatsapp-leads-dashboard**).
2. Vá na aba **Settings** > **Functions**.
3. Na seção **D1 database bindings**, clique em **Add binding**:
   - **Variable name:** `DB`
   - **D1 database:** selecione `whatsapp-leads-db`
4. Clique em **Save**.

---

### Passo 4: Rodar o Cliente WhatsApp Local (Baileys)
1. Acesse a pasta `bridge`:
   ```bash
   cd bridge
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure o arquivo `.env`:
   ```bash
   cp .env.example .env
   ```
   Abra o `.env` e preencha a URL da Cloudflare Pages:
   ```env
   PAGES_URL=https://whatsapp-leads-dashboard.pages.dev
   TARGET_CONTACT_NAME=Operações Internas - INC Empreendimentos
   REPLY_TEXT=Integração ok
   ```
4. Inicie o cliente:
   ```bash
   npm start
   ```
5. **Escaneie o QR Code:**
   - Abra o WhatsApp no celular > **Aparelhos conectados** > **Conectar um aparelho**.
   - Aponte a câmera para o QR Code gerado no terminal.
   - A sessão fica salva em `bridge/auth_info_baileys/` para não solicitar novo QR Code ao reiniciar.

---

## 🧪 Testando a Integração Manualmente

Você pode testar a rota POST a qualquer momento via terminal com `curl`:

```bash
curl -X POST "https://whatsapp-leads-dashboard.pages.dev/api/lead" \
  -H "Content-Type: application/json" \
  -d '{
    "lead": "Mariana Souza",
    "rawText": "Smart Link / Lead: Mariana Souza",
    "origem": "Operações Internas - INC Empreendimentos"
  }'
```

E consultar o relatório diário no fuso de Brasília:

```bash
curl "https://whatsapp-leads-dashboard.pages.dev/api/relatorio"
```

A contagem e a lista serão atualizadas automaticamente na interface do painel web.
