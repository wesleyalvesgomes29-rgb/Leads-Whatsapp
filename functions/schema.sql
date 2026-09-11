-- ================================================================
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
CREATE INDEX IF NOT EXISTS idx_leads_timestamp ON leads(timestamp);
