// ========================================================
// CONFIGURAÇÕES GERAIS (BOYDEGUSTA)
// Credenciais do Supabase removidas do frontend.
// Toda comunicação com o banco ocorre via /.netlify/functions/api
// ========================================================

const APP_CONFIG = {
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

window.DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
window.DAY_NAMES_FULL = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

// Normaliza qualquer formato de dias da semana para um array de números [0..6]
window.normalizePromoDays = function(promoDays, mondayPrice) {
  if (promoDays === null || promoDays === undefined) {
    return (mondayPrice !== null && mondayPrice !== undefined && Number(mondayPrice) > 0) ? [1] : [];
  }
  if (Array.isArray(promoDays)) {
    return promoDays.map(d => Number(d)).filter(d => !isNaN(d) && d >= 0 && d <= 6);
  }
  if (typeof promoDays === 'number' && promoDays >= 0 && promoDays <= 6) {
    return [promoDays];
  }
  if (typeof promoDays === 'string') {
    const trimmed = promoDays.trim();
    if (!trimmed) {
      return (mondayPrice !== null && mondayPrice !== undefined && Number(mondayPrice) > 0) ? [1] : [];
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const arr = JSON.parse(trimmed);
        if (Array.isArray(arr)) {
          return arr.map(d => Number(d)).filter(d => !isNaN(d) && d >= 0 && d <= 6);
        }
      } catch (e) {}
    }
    const cleaned = trimmed.replace(/[{}[\]"]/g, '').trim();
    if (!cleaned) return (mondayPrice !== null && mondayPrice !== undefined && Number(mondayPrice) > 0) ? [1] : [];
    return cleaned.split(',')
      .map(s => Number(s.trim()))
      .filter(d => !isNaN(d) && d >= 0 && d <= 6);
  }
  return (mondayPrice !== null && mondayPrice !== undefined && Number(mondayPrice) > 0) ? [1] : [];
};

// Verifica se um produto ou promoção está com preço promocional ativo no dia especificado (padrão: hoje)
window.isPromoActiveToday = function(product, todayDay) {
  if (!product) return false;
  if (todayDay === undefined || todayDay === null) {
    todayDay = new Date().getDay();
  } else {
    todayDay = Number(todayDay);
  }

  const promoPrice = Number(product.promo_price) || Number(product.monday_price) || 0;
  if (promoPrice <= 0) return false;
  if (product.is_promo === false) return false;

  const promoDays = window.normalizePromoDays(product.promo_days, product.monday_price);
  if (promoDays.length === 0) return false;

  return promoDays.includes(todayDay);
};

// Retorna o preço efetivo do produto considerando o dia da semana atual
window.getProductEffectivePrice = function(product, todayDay) {
  if (!product) return 0;
  if (todayDay === undefined || todayDay === null) {
    todayDay = new Date().getDay();
  } else {
    todayDay = Number(todayDay);
  }

  const regularPrice = (product.price !== null && product.price !== undefined && product.price !== '') ? Number(product.price) : 0;
  const promoPrice = Number(product.promo_price) || Number(product.monday_price) || 0;
  const isTodayPromo = window.isPromoActiveToday(product, todayDay);

  if (isTodayPromo) {
    return promoPrice;
  }
  return regularPrice > 0 ? regularPrice : (promoPrice > 0 ? promoPrice : 0);
};

