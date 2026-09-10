// ========================================================
// CONFIGURAÇÕES GERAIS E SUPABASE (BOYDEGUSTA)
// ========================================================

// Carrega as variáveis de ambiente do window.ENV (definidas em js/env.js)
const env = window.ENV || {};

const APP_CONFIG = {
  // Configuração do Supabase (Carregada via js/env.js)
  SUPABASE_URL: env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || '',

  // Dados Oficiais
  RESTAURANT_NAME: 'BoyDegusta',
  WHATSAPP_NUMBER: '5581992686946',
  INSTAGRAM_HANDLE: '@boydegusta',
  DEFAULT_DELIVERY_FEE: 5.00,
  MIN_ORDER_VALUE: 10.00,
  PICKUP_ADDRESS: 'Avenida Dom Carlos Coelho, 2211 - Lote 92, Jaboatão dos Guararapes - PE',
  OPERATING_HOURS_DESC: 'Todos os dias — 18:00 às 23:00'
};

// Exporta globalmente para o navegador
window.APP_CONFIG = APP_CONFIG;
