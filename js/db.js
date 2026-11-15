// ========================================================
// BOYDEGUSTA - CAMADA DE DADOS (via Netlify Functions)
// NENHUMA credencial do Supabase chega ao browser.
// Todas as chamadas passam pelo servidor /.netlify/functions/api
// ========================================================

(function() {
  const API = '/.netlify/functions/api';

  const STORAGE_KEYS = {
    SETTINGS: 'boydegusta_settings',
    HOURS: 'boydegusta_hours',
    CATEGORIES: 'boydegusta_categories',
    PRODUCTS: 'boydegusta_products',
    OPTIONALS: 'boydegusta_optionals',
    PROMOTIONS: 'boydegusta_promotions',
    ORDERS: 'boydegusta_orders',
    USERS: 'boydegusta_users',
    ADDRESSES: 'boydegusta_addresses',
    NEIGHBORHOODS: 'boydegusta_neighborhoods',
    COURIERS: 'boydegusta_couriers',
    CASH_CLOSINGS: 'boydegusta_cash_closings',
    DAY_PROMOTIONS: 'boydegusta_day_promotions'
  };

  function getCurrentStoreId() {
    if (window.BOYDEGUSTA_STORE_ID) return window.BOYDEGUSTA_STORE_ID;
    try {
      const p = new URLSearchParams(window.location.search).get('loja');
      if (p === 'vilarica') return 'vilarica';
      if (p === 'lote92') return 'lote92';
    } catch {}
    if (window.location.pathname.includes('admin.html')) {
      const savedAdminStore = localStorage.getItem('boydegusta_admin_store');
      if (savedAdminStore === 'vilarica') return 'vilarica';
    }
    return 'lote92';
  }
  window.getCurrentStoreId = getCurrentStoreId;

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function isUuid(id) {
    return Boolean(id && typeof id === 'string' && UUID_REGEX.test(id));
  }

  function generateUuidOrId(prefix = '') {
    if (window.crypto && window.crypto.randomUUID) {
      try { return window.crypto.randomUUID(); } catch {}
    }
    return `${prefix ? prefix + '-' : ''}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  function getStored(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch { return fallback; }
  }

  function setStored(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.number === -2147024882) {
        console.warn(`[QuotaExceeded] Limite do localStorage atingido ao salvar ${key}. Liberando espaço...`);
        try {
          // Se for ORDERS, mantém apenas os 50 mais recentes
          if (key === STORAGE_KEYS.ORDERS && Array.isArray(data)) {
            const trimmed = data.slice(0, 50);
            localStorage.setItem(key, JSON.stringify(trimmed));
            return;
          }
          // Se for CASH_CLOSINGS, mantém os 30 mais recentes
          if (key === STORAGE_KEYS.CASH_CLOSINGS && Array.isArray(data)) {
            const trimmed = data.slice(0, 30);
            localStorage.setItem(key, JSON.stringify(trimmed));
            return;
          }
          // Se for PRODUCTS, remove imagens base64 pesadas
          if (key === STORAGE_KEYS.PRODUCTS && Array.isArray(data)) {
            const stripped = data.map(p =>
              (p.image_url && p.image_url.startsWith('data:image')) ? { ...p, image_url: 'boylogo.jpg' } : p
            );
            localStorage.setItem(key, JSON.stringify(stripped));
            return;
          }
        } catch (innerErr) {
          console.error('[setStored] Falha ao recuperar cota do localStorage:', innerErr);
        }
      }
    }
  }

  // Chamada genérica ao servidor
  async function api(action, method = 'GET', body = null) {
    const url = `${API}?action=${action}`;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    const res = await fetch(url, options);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `Erro ${res.status}`);
    return json;
  }

  // Funções utilitárias de limpeza e segurança de dados por loja
  function getLoteCategories() {
    const local = getStored(STORAGE_KEYS.CATEGORIES, window.INITIAL_CATEGORIES) || [];
    const filtered = local.filter(c => c.store_id !== 'vilarica' && !String(c.id).startsWith('cat-vr-') && !String(c.slug || '').endsWith('-vr'));
    if (filtered.length === 0) {
      setStored(STORAGE_KEYS.CATEGORIES, window.INITIAL_CATEGORIES);
      return window.INITIAL_CATEGORIES;
    }
    return filtered;
  }

  function getLoteProducts() {
    const local = getStored(STORAGE_KEYS.PRODUCTS, window.INITIAL_PRODUCTS) || [];
    const filtered = local.filter(p => p.store_id !== 'vilarica' && !String(p.id).startsWith('prod-vr-') && p.category_id !== 'cat-vr-brasa' && !String(p.category_id || '').endsWith('-vr'));
    if (filtered.length === 0) {
      setStored(STORAGE_KEYS.PRODUCTS, window.INITIAL_PRODUCTS);
      return window.INITIAL_PRODUCTS;
    }
    return filtered;
  }

  function getLoteOptionals() {
    const local = getStored(STORAGE_KEYS.OPTIONALS, window.INITIAL_OPTIONALS) || [];
    const filtered = local.filter(o => o.store_id !== 'vilarica' && !String(o.id).startsWith('opt-vr-'));
    if (filtered.length === 0) {
      setStored(STORAGE_KEYS.OPTIONALS, window.INITIAL_OPTIONALS);
      return window.INITIAL_OPTIONALS;
    }
    return filtered;
  }

  // Inicialização dos defaults locais
  function initDefaults() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) setStored(STORAGE_KEYS.SETTINGS, window.INITIAL_SETTINGS);
    if (!localStorage.getItem(STORAGE_KEYS.HOURS)) setStored(STORAGE_KEYS.HOURS, window.INITIAL_OPERATING_HOURS);
    
    // Auto-recuperação: se o localStorage foi poluído com produtos de Vila Rica, restaura o Lote 92
    try {
      const storedProds = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
      const hasLoteProds = Array.isArray(storedProds) && storedProds.some(p => p.store_id !== 'vilarica' && !String(p.id).startsWith('prod-vr-'));
      if (!hasLoteProds) {
        setStored(STORAGE_KEYS.PRODUCTS, window.INITIAL_PRODUCTS);
      }
    } catch {
      setStored(STORAGE_KEYS.PRODUCTS, window.INITIAL_PRODUCTS);
    }

    try {
      const storedCats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES) || '[]');
      const hasLoteCats = Array.isArray(storedCats) && storedCats.some(c => c.store_id !== 'vilarica' && !String(c.id).startsWith('cat-vr-'));
      if (!hasLoteCats) {
        setStored(STORAGE_KEYS.CATEGORIES, window.INITIAL_CATEGORIES);
      }
    } catch {
      setStored(STORAGE_KEYS.CATEGORIES, window.INITIAL_CATEGORIES);
    }

    try {
      const storedOpts = JSON.parse(localStorage.getItem(STORAGE_KEYS.OPTIONALS) || '[]');
      const hasLoteOpts = Array.isArray(storedOpts) && storedOpts.some(o => o.store_id !== 'vilarica' && !String(o.id).startsWith('opt-vr-'));
      if (!hasLoteOpts) {
        setStored(STORAGE_KEYS.OPTIONALS, window.INITIAL_OPTIONALS);
      }
    } catch {
      setStored(STORAGE_KEYS.OPTIONALS, window.INITIAL_OPTIONALS);
    }

    if (!localStorage.getItem(STORAGE_KEYS.PROMOTIONS)) setStored(STORAGE_KEYS.PROMOTIONS, window.INITIAL_PROMOTIONS);
    if (!localStorage.getItem(STORAGE_KEYS.NEIGHBORHOODS)) setStored(STORAGE_KEYS.NEIGHBORHOODS, window.INITIAL_NEIGHBORHOODS || []);
    if (!localStorage.getItem(STORAGE_KEYS.COURIERS)) setStored(STORAGE_KEYS.COURIERS, window.INITIAL_COURIERS || []);
    if (!localStorage.getItem(STORAGE_KEYS.CASH_CLOSINGS)) setStored(STORAGE_KEYS.CASH_CLOSINGS, []);
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) setStored(STORAGE_KEYS.ORDERS, []);
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) setStored(STORAGE_KEYS.USERS, []);
    if (!localStorage.getItem(STORAGE_KEYS.ADDRESSES)) setStored(STORAGE_KEYS.ADDRESSES, []);
    if (!localStorage.getItem(STORAGE_KEYS.DAY_PROMOTIONS)) setStored(STORAGE_KEYS.DAY_PROMOTIONS, []);
  }

  initDefaults();

  const db = {

    // ----------------------------------------
    // UPLOAD & COMPRESSÃO DE IMAGEM
    // ----------------------------------------
    // Reduz fotos pesadas de celulares (5MB-10MB) para ~50KB em WebP/JPEG
    async compressImageFile(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
      return new Promise((resolve) => {
        if (!file || !file.type || !file.type.startsWith('image/')) {
          return resolve(null);
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
              if (width > height) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Exporta preferencialmente em WebP (90% menor) com fallback para JPEG
            let dataUrl = canvas.toDataURL('image/webp', quality);
            let mimeType = 'image/webp';
            let ext = 'webp';

            if (!dataUrl.startsWith('data:image/webp')) {
              dataUrl = canvas.toDataURL('image/jpeg', quality);
              mimeType = 'image/jpeg';
              ext = 'jpg';
            }

            const base64 = dataUrl.split(',')[1];
            resolve({ base64, mimeType, ext });
          };
          img.onerror = () => {
            const base64 = (e.target.result || '').split(',')[1];
            resolve({ base64, mimeType: file.type || 'image/jpeg', ext: 'jpg' });
          };
          img.src = e.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    },

    async uploadImage(file) {
      if (!file) return null;
      try {
        const compressed = await this.compressImageFile(file, 800, 800, 0.8);
        if (!compressed || !compressed.base64) return null;

        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${compressed.ext}`;
        const result = await api('upload-image', 'POST', {
          base64: compressed.base64,
          fileName,
          mimeType: compressed.mimeType
        });
        return result?.url || null;
      } catch (e) {
        console.warn('Erro ao subir imagem otimizada:', e);
        return null;
      }
    },

    // ----------------------------------------
    // 0. BOOTSTRAP UNIFICADO (1 requisição para tudo)
    // ----------------------------------------
    async getBootstrap(requestedStoreId) {
      const activeStore = requestedStoreId || getCurrentStoreId();
      if (activeStore === 'vilarica') {
        const vrSettings = getStored('boydegusta_vr_settings', window.INITIAL_SETTINGS_VILARICA);
        const vrCategories = getStored('boydegusta_vr_categories', window.INITIAL_CATEGORIES_VILARICA || []);
        const vrProductsRaw = getStored('boydegusta_vr_products', window.INITIAL_PRODUCTS_VILARICA || []);
        // Migração: substituir URLs Unsplash/wsrv por boylogo.jpg
        const vrProducts = vrProductsRaw.map(p => ({
          ...p,
          image_url: (p.image_url && (p.image_url.startsWith('https://images.unsplash') || p.image_url.startsWith('https://wsrv'))) ? 'boylogo.jpg' : (p.image_url || 'boylogo.jpg')
        }));
        setStored('boydegusta_vr_products', vrProducts);
        const vrOptionals = getStored('boydegusta_vr_optionals', window.INITIAL_OPTIONALS_VILARICA || []);
        const vrHours = getStored('boydegusta_vr_hours', window.INITIAL_OPERATING_HOURS);
        const vrNeighborhoods = getStored('boydegusta_vr_neighborhoods', window.INITIAL_NEIGHBORHOODS || []);
        const vrCouriers = getStored('boydegusta_vr_couriers', window.INITIAL_COURIERS || []);
        return {
          settings: vrSettings,
          hours: vrHours,
          categories: vrCategories,
          products: vrProducts,
          optionals: vrOptionals,
          promotions: [],
          neighborhoods: vrNeighborhoods,
          couriers: vrCouriers
        };
      }

      try {
        const result = await api('get-bootstrap&store=lote92', 'GET');
        if (result && result.data) {
          const d = result.data;
          if (d.settings) setStored(STORAGE_KEYS.SETTINGS, d.settings);
          if (d.hours && Array.isArray(d.hours)) setStored(STORAGE_KEYS.HOURS, d.hours);

          // Filtra estritamente categorias de Lote 92
          const remoteCats = Array.isArray(d.categories) ? d.categories : [];
          const loteCats = remoteCats.filter(c => c.store_id !== 'vilarica' && !String(c.id).startsWith('cat-vr-') && !String(c.slug || '').endsWith('-vr'));
          d.categories = loteCats.length > 0 ? loteCats : window.INITIAL_CATEGORIES;
          setStored(STORAGE_KEYS.CATEGORIES, d.categories);

          // Filtra estritamente produtos de Lote 92
          const remoteProds = Array.isArray(d.products) ? d.products : [];
          const loteProds = remoteProds.filter(p => p.store_id !== 'vilarica' && !String(p.id).startsWith('prod-vr-') && p.category_id !== 'cat-vr-brasa' && !String(p.category_id || '').endsWith('-vr'));
          d.products = loteProds.length > 0 ? loteProds : window.INITIAL_PRODUCTS;
          setStored(STORAGE_KEYS.PRODUCTS, d.products);

          // Filtra estritamente adicionais de Lote 92
          const remoteOpts = Array.isArray(d.optionals) ? d.optionals : [];
          const loteOpts = remoteOpts.filter(o => o.store_id !== 'vilarica' && !String(o.id).startsWith('opt-vr-'));
          d.optionals = loteOpts.length > 0 ? loteOpts : window.INITIAL_OPTIONALS;
          setStored(STORAGE_KEYS.OPTIONALS, d.optionals);

          // SEMPRE sincroniza promoções do servidor, mesmo se vier vazio — evita que promoções
          // deletadas no admin continuem aparecendo para clientes com cache antigo no localStorage.
          if (Array.isArray(d.promotions)) setStored(STORAGE_KEYS.PROMOTIONS, d.promotions);
          if (d.neighborhoods && Array.isArray(d.neighborhoods)) setStored(STORAGE_KEYS.NEIGHBORHOODS, d.neighborhoods);

          // Garante que entregadores nunca fiquem vazios mesclando remotos com seed e local
          const seedCouriers = window.INITIAL_COURIERS || [];
          const remoteCouriers = Array.isArray(d.couriers) ? d.couriers : [];
          const localCouriers = getStored(STORAGE_KEYS.COURIERS, []);
          const mergedCouriersMap = new Map();
          seedCouriers.forEach(c => {
            const k = (c.name || '').trim().toLowerCase();
            if (k) mergedCouriersMap.set(k, { ...c });
          });
          localCouriers.forEach(c => {
            const k = (c.name || '').trim().toLowerCase();
            if (k) {
              const existing = mergedCouriersMap.get(k) || {};
              mergedCouriersMap.set(k, { ...existing, ...c });
            }
          });
          remoteCouriers.forEach(c => {
            const k = (c.name || '').trim().toLowerCase();
            if (k) {
              const existing = mergedCouriersMap.get(k) || {};
              mergedCouriersMap.set(k, { ...existing, ...c });
            }
          });
          const finalCouriers = Array.from(mergedCouriersMap.values());
          d.couriers = finalCouriers;
          setStored(STORAGE_KEYS.COURIERS, finalCouriers);

          return d;
        }
      } catch (e) {
        console.warn('Erro ao carregar bootstrap unificado via API:', e);
      }
      return {
        settings: getStored(STORAGE_KEYS.SETTINGS, window.INITIAL_SETTINGS),
        hours: getStored(STORAGE_KEYS.HOURS, window.INITIAL_OPERATING_HOURS),
        categories: getLoteCategories(),
        products: getLoteProducts(),
        optionals: getLoteOptionals(),
        promotions: getStored(STORAGE_KEYS.PROMOTIONS, window.INITIAL_PROMOTIONS),
        neighborhoods: getStored(STORAGE_KEYS.NEIGHBORHOODS, window.INITIAL_NEIGHBORHOODS || []),
        couriers: getStored(STORAGE_KEYS.COURIERS, window.INITIAL_COURIERS || [])
      };
    },

    // ----------------------------------------
    // 1. CONFIGURAÇÕES
    // ----------------------------------------
    async getSettings(requestedStoreId) {
      const activeStore = requestedStoreId || getCurrentStoreId();
      if (activeStore === 'vilarica') {
        return getStored('boydegusta_vr_settings', window.INITIAL_SETTINGS_VILARICA);
      }
      try {
        const result = await api('get-settings', 'GET');
        if (result.data) {
          setStored(STORAGE_KEYS.SETTINGS, result.data);
          return result.data;
        }
      } catch (e) {
        console.warn('Erro ao buscar settings via API:', e);
      }
      return getStored(STORAGE_KEYS.SETTINGS, window.INITIAL_SETTINGS);
    },

    async updateSettings(newSettings, requestedStoreId) {
      const activeStore = requestedStoreId || getCurrentStoreId();
      if (activeStore === 'vilarica') {
        const current = getStored('boydegusta_vr_settings', window.INITIAL_SETTINGS_VILARICA);
        const updated = { ...current, ...newSettings, updated_at: new Date().toISOString() };
        setStored('boydegusta_vr_settings', updated);
        return updated;
      }
      const current = getStored(STORAGE_KEYS.SETTINGS, window.INITIAL_SETTINGS);
      const updated = { ...current, ...newSettings, updated_at: new Date().toISOString() };
      setStored(STORAGE_KEYS.SETTINGS, updated);
      try {
        await api('update-settings', 'POST', updated);
      } catch (e) {
        console.warn('Erro ao salvar settings via API:', e);
      }
      return updated;
    },

    async verifyAdminPassword(password) {
      try {
        const result = await api('admin-login', 'POST', { password });
        return result.success === true;
      } catch (e) {
        if (e.message && e.message.includes('incorreta')) return false;
        return null;
      }
    },

    // ----------------------------------------
    // 2. HORÁRIOS DE FUNCIONAMENTO
    // ----------------------------------------
    async getOperatingHours() {
      try {
        const result = await api('get-hours', 'GET');
        if (result.data && result.data.length > 0) {
          setStored(STORAGE_KEYS.HOURS, result.data);
          return result.data;
        }
      } catch (e) {
        console.warn('Erro ao buscar horários via API:', e);
      }
      return getStored(STORAGE_KEYS.HOURS, window.INITIAL_OPERATING_HOURS);
    },

    async updateOperatingHours(hours) {
      setStored(STORAGE_KEYS.HOURS, hours);
      try {
        await api('update-hours', 'POST', { hours });
      } catch (e) {
        console.warn('Erro ao salvar horários via API:', e);
      }
      return hours;
    },

    // ----------------------------------------
    // 3. CATEGORIAS
    // ----------------------------------------
    async getCategories(requestedStoreId) {
      const activeStore = requestedStoreId || getCurrentStoreId();
      if (activeStore === 'vilarica') {
        return getStored('boydegusta_vr_categories', window.INITIAL_CATEGORIES_VILARICA || []);
      }
      try {
        const result = await api('get-categories&store=lote92', 'GET');
        if (result.data && Array.isArray(result.data)) {
          const lote = result.data.filter(c => c.store_id !== 'vilarica' && !String(c.id).startsWith('cat-vr-') && !String(c.slug || '').endsWith('-vr'));
          const finalCats = lote.length > 0 ? lote : window.INITIAL_CATEGORIES;
          setStored(STORAGE_KEYS.CATEGORIES, finalCats);
          return finalCats;
        }
      } catch (e) {
        console.warn('Erro ao buscar categorias via API:', e);
      }
      return getLoteCategories();
    },

    async saveCategory(cat, requestedStoreId) {
      const activeStore = requestedStoreId || getCurrentStoreId();
      if (activeStore === 'vilarica') {
        const list = getStored('boydegusta_vr_categories', window.INITIAL_CATEGORIES_VILARICA || []);
        const idx = list.findIndex(c => c.id === cat.id);
        if (idx >= 0) list[idx] = cat;
        else list.push(cat);
        setStored('boydegusta_vr_categories', list);
        return cat;
      }
      const result = await api('save-category', 'POST', cat);
      const saved = result?.data || cat;
      const list = getStored(STORAGE_KEYS.CATEGORIES, window.INITIAL_CATEGORIES);
      const idx = list.findIndex(c => c.id === cat.id || c.id === saved.id);
      if (idx >= 0) list[idx] = saved;
      else list.push(saved);
      setStored(STORAGE_KEYS.CATEGORIES, list);
      return saved;
    },

    async deleteCategory(id, requestedStoreId) {
      const activeStore = requestedStoreId || getCurrentStoreId();
      if (activeStore === 'vilarica') {
        const list = getStored('boydegusta_vr_categories', window.INITIAL_CATEGORIES_VILARICA || []);
        setStored('boydegusta_vr_categories', list.filter(c => c.id !== id));
        return true;
      }
      await api('delete-category', 'DELETE', { id });
      const list = getStored(STORAGE_KEYS.CATEGORIES, window.INITIAL_CATEGORIES);
      setStored(STORAGE_KEYS.CATEGORIES, list.filter(c => c.id !== id));
      return true;
    },

    // ----------------------------------------
    // 4. PRODUTOS
    // ----------------------------------------
    async getProducts(requestedStoreId) {
      const activeStore = requestedStoreId || getCurrentStoreId();
      if (activeStore === 'vilarica') {
        const localVr = getStored('boydegusta_vr_products', window.INITIAL_PRODUCTS_VILARICA || []);
        return localVr.map(p => ({
          ...p,
          promo_days: window.normalizePromoDays ? window.normalizePromoDays(p.promo_days, p.monday_price) : (Array.isArray(p.promo_days) ? p.promo_days : [])
        }));
      }
      try {
        const result = await api('get-products&store=lote92', 'GET');
        if (Array.isArray(result.data)) {
          const lote = result.data.filter(p => p.store_id !== 'vilarica' && !String(p.id).startsWith('prod-vr-') && p.category_id !== 'cat-vr-brasa' && !String(p.category_id || '').endsWith('-vr'));
          const finalProds = lote.length > 0 ? lote : window.INITIAL_PRODUCTS;
          const normalized = finalProds.map(p => ({
            ...p,
            promo_days: window.normalizePromoDays ? window.normalizePromoDays(p.promo_days, p.monday_price) : (Array.isArray(p.promo_days) ? p.promo_days : [])
          }));
          setStored(STORAGE_KEYS.PRODUCTS, normalized);
          return normalized;
        }
      } catch (e) {
        console.warn('Erro ao buscar produtos via API:', e);
      }
      const local = getLoteProducts();
      return local.map(p => ({
        ...p,
        promo_days: window.normalizePromoDays ? window.normalizePromoDays(p.promo_days, p.monday_price) : (Array.isArray(p.promo_days) ? p.promo_days : [])
      }));
    },

    async saveProduct(prod, requestedStoreId) {
      const activeStore = requestedStoreId || prod.store_id || getCurrentStoreId();
      const normalizedDays = window.normalizePromoDays ? window.normalizePromoDays(prod.promo_days, prod.monday_price) : (Array.isArray(prod.promo_days) ? prod.promo_days : []);
      const rawPromoPrice = (prod.promo_price !== null && prod.promo_price !== undefined && prod.promo_price !== '') ? Number(prod.promo_price) : null;
      
      const payload = {
        ...prod,
        store_id: activeStore,
        price: (prod.price !== null && prod.price !== undefined && prod.price !== '') ? Number(prod.price) : null,
        promo_price: rawPromoPrice,
        promo_days: normalizedDays,
        promo_label: prod.promo_label ? String(prod.promo_label).trim() : null,
        is_promo: Boolean(prod.is_promo || (normalizedDays.length > 0 && rawPromoPrice > 0)),
        monday_price: (normalizedDays.includes(1) && rawPromoPrice) ? rawPromoPrice : (prod.monday_price ? Number(prod.monday_price) : null)
      };

      if (activeStore === 'vilarica') {
        const list = getStored('boydegusta_vr_products', window.INITIAL_PRODUCTS_VILARICA || []);
        const idx = list.findIndex(p => p.id === prod.id);
        if (idx >= 0) list[idx] = payload;
        else list.push(payload);
        setStored('boydegusta_vr_products', list);
        return payload;
      }

      const result = await api('save-product', 'POST', payload);
      const saved = result?.data || payload;

      const list = getStored(STORAGE_KEYS.PRODUCTS, window.INITIAL_PRODUCTS);
      const idx = list.findIndex(p => p.id === prod.id || p.id === saved.id);
      if (idx >= 0) list[idx] = saved;
      else list.push(saved);
      setStored(STORAGE_KEYS.PRODUCTS, list);

      return saved;
    },

    async deleteProduct(id, requestedStoreId) {
      const activeStore = requestedStoreId || getCurrentStoreId();
      if (activeStore === 'vilarica') {
        const list = getStored('boydegusta_vr_products', window.INITIAL_PRODUCTS_VILARICA || []);
        setStored('boydegusta_vr_products', list.filter(p => p.id !== id));
        return true;
      }
      await api('delete-product', 'DELETE', { id });
      const list = getStored(STORAGE_KEYS.PRODUCTS, window.INITIAL_PRODUCTS);
      setStored(STORAGE_KEYS.PRODUCTS, list.filter(p => p.id !== id));
      return true;
    },

    // ----------------------------------------
    // 5. ADICIONAIS
    // ----------------------------------------
    async getOptionals(requestedStoreId) {
      const activeStore = requestedStoreId || getCurrentStoreId();
      if (activeStore === 'vilarica') {
        return getStored('boydegusta_vr_optionals', window.INITIAL_OPTIONALS_VILARICA || []);
      }
      try {
        const result = await api('get-optionals&store=lote92', 'GET');
        if (Array.isArray(result.data)) {
          const lote = result.data.filter(o => o.store_id !== 'vilarica' && !String(o.id).startsWith('opt-vr-'));
          const finalOpts = lote.length > 0 ? lote : window.INITIAL_OPTIONALS;
          setStored(STORAGE_KEYS.OPTIONALS, finalOpts);
          return finalOpts;
        }
      } catch (e) {
        console.warn('Erro ao buscar adicionais via API:', e);
      }
      return getLoteOptionals();
    },

    async saveOptional(opt, requestedStoreId) {
      const activeStore = requestedStoreId || opt.store_id || getCurrentStoreId();
      const payload = { ...opt, store_id: activeStore, price: Number(opt.price) || 0 };

      if (activeStore === 'vilarica') {
        const list = getStored('boydegusta_vr_optionals', window.INITIAL_OPTIONALS_VILARICA || []);
        const idx = list.findIndex(o => o.id === opt.id);
        if (idx >= 0) list[idx] = payload;
        else list.push(payload);
        setStored('boydegusta_vr_optionals', list);
        return payload;
      }

      const result = await api('save-optional', 'POST', payload);
      const saved = result?.data || payload;

      const list = getStored(STORAGE_KEYS.OPTIONALS, window.INITIAL_OPTIONALS);
      const idx = list.findIndex(o => o.id === opt.id || o.id === saved.id);
      if (idx >= 0) list[idx] = saved;
      else list.push(saved);
      setStored(STORAGE_KEYS.OPTIONALS, list);

      return saved;
    },

    async deleteOptional(id, requestedStoreId) {
      const activeStore = requestedStoreId || getCurrentStoreId();
      if (activeStore === 'vilarica') {
        const list = getStored('boydegusta_vr_optionals', window.INITIAL_OPTIONALS_VILARICA || []);
        setStored('boydegusta_vr_optionals', list.filter(o => o.id !== id));
        return true;
      }
      await api('delete-optional', 'DELETE', { id });
      const list = getStored(STORAGE_KEYS.OPTIONALS, window.INITIAL_OPTIONALS);
      setStored(STORAGE_KEYS.OPTIONALS, list.filter(o => o.id !== id));
      return true;
    },

    // ----------------------------------------
    // 6. PROMOÇÕES (COMBOS)
    // ----------------------------------------
    async getPromotions() {
      try {
        const result = await api('get-promotions', 'GET');
        if (Array.isArray(result.data)) {
          setStored(STORAGE_KEYS.PROMOTIONS, result.data);
          return result.data;
        }
      } catch (e) {
        console.warn('Erro ao buscar promoções via API:', e);
      }
      return getStored(STORAGE_KEYS.PROMOTIONS, window.INITIAL_PROMOTIONS);
    },

    async savePromotion(promo) {
      const payload = { ...promo, price: Number(promo.price) || 40 };
      const result = await api('save-promotion', 'POST', payload);
      const saved = result?.data || payload;

      const list = getStored(STORAGE_KEYS.PROMOTIONS, window.INITIAL_PROMOTIONS);
      const idx = list.findIndex(p => p.id === promo.id || p.id === saved.id);
      if (idx >= 0) list[idx] = saved;
      else list.push(saved);
      setStored(STORAGE_KEYS.PROMOTIONS, list);

      return saved;
    },

    async deletePromotion(id) {
      await api('delete-promotion', 'DELETE', { id });
      const list = getStored(STORAGE_KEYS.PROMOTIONS, window.INITIAL_PROMOTIONS);
      setStored(STORAGE_KEYS.PROMOTIONS, list.filter(p => p.id !== id));
      return true;
    },

    // ----------------------------------------
    // 7. PEDIDOS
    // ----------------------------------------
    async getOrders(requestedStoreId) {
      const activeStore = requestedStoreId || getCurrentStoreId();
      if (activeStore === 'vilarica') {
        const localVr = getStored('boydegusta_vr_orders', []);
        return localVr.map(o => ({
          ...o,
          items: o.items || o.order_items || [],
          table_number: o.table_number ? Number(o.table_number) : null
        }));
      }
      try {
        const result = await api('get-orders', 'GET');
        if (result.data) {
          const normalized = result.data.map(o => ({
            ...o,
            items: o.order_items || o.items || [],
            table_number: o.table_number ? Number(o.table_number) : null
          }));
          setStored(STORAGE_KEYS.ORDERS, normalized);
          return normalized;
        }
      } catch (e) {
        console.warn('Erro ao buscar pedidos via API:', e);
      }
      const local = getStored(STORAGE_KEYS.ORDERS, []);
      return local.map(o => ({
        ...o,
        items: o.items || o.order_items || [],
        table_number: o.table_number ? Number(o.table_number) : null
      }));
    },

    async createOrder(orderPayload, requestedStoreId) {
      const activeStore = requestedStoreId || orderPayload.store_id || getCurrentStoreId();
      let newOrder = {
        ...orderPayload,
        store_id: activeStore,
        status: orderPayload.status || 'novo',
        table_number: (orderPayload.table_number !== null && orderPayload.table_number !== undefined && orderPayload.table_number !== '') ? Number(orderPayload.table_number) : null,
        whatsapp_sent: orderPayload.whatsapp_sent !== false,
        created_at: orderPayload.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: orderPayload.items || []
      };

      if (activeStore === 'vilarica') {
        const currentVrOrders = getStored('boydegusta_vr_orders', []);
        const maxNum = currentVrOrders.reduce((m, o) => Math.max(m, Number(o.order_number) || 0), 1000);
        newOrder.id = newOrder.id || generateUuidOrId('order_vr');
        newOrder.order_number = maxNum + 1;
        setStored('boydegusta_vr_orders', [newOrder, ...currentVrOrders]);
        return newOrder;
      }

      const apiPayload = { ...newOrder };
      // Se user_id não for UUID válido, remove do payload da API
      if (apiPayload.user_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(apiPayload.user_id)) {
        delete apiPayload.user_id;
      }
      if (apiPayload.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(apiPayload.id)) {
        delete apiPayload.id;
      }

      // Executa com até 3 tentativas para contornar instabilidade momentânea ou cold-start do servidor
      let lastErr = null;
      let result = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          result = await api('create-order', 'POST', apiPayload);
          // CRÍTICO: valida que a resposta contém um order_number válido (> 0).
          // Se vier sem order_number, o WhatsApp abriria com #0000 ou número antigo do localStorage.
          if (result?.data && Number(result.data.order_number) > 0) break;
          if (result?.data) {
            console.warn(`[db.createOrder] Tentativa ${attempt}/3: servidor retornou pedido sem order_number válido (${result.data.order_number}). Descartando e tentando novamente...`);
            lastErr = new Error('Servidor retornou pedido sem número de comanda válido.');
            result = null;
          }
        } catch (e) {
          lastErr = e;
          console.warn(`[db.createOrder] Tentativa ${attempt}/3 falhou:`, e);
        }
        if (attempt < 3) await new Promise(res => setTimeout(res, 500 * attempt));
      }

      if (result?.data && Number(result.data.order_number) > 0) {
        newOrder = { ...newOrder, ...result.data, items: result.data.items || result.data.order_items || newOrder.items };
        const currentOrders = getStored(STORAGE_KEYS.ORDERS, []);
        setStored(STORAGE_KEYS.ORDERS, [newOrder, ...currentOrders.filter(o => o.id !== newOrder.id)]);
        return newOrder;
      }

      // Se falhar após todas as tentativas, lança erro para alertar a interface e não gerar comanda fake repetida #0001
      console.error('Falha definitiva ao criar pedido via API:', lastErr);
      throw new Error(lastErr?.message || 'Não foi possível salvar o pedido no sistema. Verifique sua conexão e tente novamente.');
    },

    async updateOrderStatus(orderId, newStatus, paymentMethod, courierName, requestedStoreId) {
      const activeStore = requestedStoreId || getCurrentStoreId();
      const storageKey = activeStore === 'vilarica' ? 'boydegusta_vr_orders' : STORAGE_KEYS.ORDERS;
      const orders = getStored(storageKey, []);
      const updated = orders.map(o => {
        if (o.id === orderId) {
          const u = { ...o, status: newStatus, payment_method: paymentMethod || o.payment_method, updated_at: new Date().toISOString() };
          if (courierName !== undefined) u.courier_name = courierName;
          return u;
        }
        return o;
      });
      setStored(storageKey, updated);
      if (activeStore !== 'vilarica') {
        try {
          await api('update-order', 'POST', { id: orderId, status: newStatus, payment_method: paymentMethod, courier_name: courierName });
        } catch (e) {
          console.warn('Erro ao atualizar pedido via API:', e);
        }
      }
      return updated.find(o => o.id === orderId);
    },

    async assignCourierToOrder(orderId, courierName) {
      return this.updateOrderStatus(orderId, 'saiu_para_entrega', null, courierName);
    },

    async getTableActiveOrders(tableNumber) {
      const num = Number(tableNumber);
      if (isNaN(num) || num <= 0) return [];
      const orders = await this.getOrders();
      const activeStatuses = ['novo', 'confirmado', 'em_preparo', 'pronto_para_retirada', 'saiu_para_entrega'];
      return orders.filter(o =>
        Number(o.table_number) === num &&
        activeStatuses.includes(o.status)
      );
    },

    async closeTable(tableNumber, paymentMethod = 'dinheiro') {
      const activeOrders = await this.getTableActiveOrders(tableNumber);
      if (activeOrders.length === 0) return true;
      const results = await Promise.allSettled(
        activeOrders.map(order => this.updateOrderStatus(order.id, 'finalizado', paymentMethod))
      );
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.warn(`[closeTable] ${failures.length} pedido(s) falharam na sincronização remota, mantidos sincronizados localmente.`);
      }
      return true;
    },

    // ----------------------------------------
    // 8. BAIRROS E TAXAS
    // ----------------------------------------
    async getNeighborhoods() {
      let remote = [];
      try {
        const result = await api('get-neighborhoods', 'GET');
        if (result && Array.isArray(result.data)) {
          remote = result.data;
        }
      } catch (e) {
        console.warn('Erro ao buscar bairros via API:', e);
      }

      const seed = window.INITIAL_NEIGHBORHOODS || [];
      const local = getStored(STORAGE_KEYS.NEIGHBORHOODS, []);

      // Mescla todos os bairros: padrões (seed), locais e remotos (Supabase)
      const mergedMap = new Map();

      seed.forEach(n => {
        const key = (n.name || '').trim().toLowerCase();
        if (key) mergedMap.set(key, { ...n });
      });

      local.forEach(n => {
        const key = (n.name || '').trim().toLowerCase();
        if (key) {
          const existing = mergedMap.get(key) || {};
          mergedMap.set(key, { ...existing, ...n });
        }
      });

      remote.forEach(n => {
        const key = (n.name || '').trim().toLowerCase();
        if (key) {
          const existing = mergedMap.get(key) || {};
          mergedMap.set(key, { ...existing, ...n });
        }
      });

      const merged = Array.from(mergedMap.values()).sort((a, b) => 
        (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' })
      );

      setStored(STORAGE_KEYS.NEIGHBORHOODS, merged);

      // Se o Supabase ainda não tem os 24 bairros padrões, faz o sync em background
      if (remote.length < 5 && seed.length > 0) {
        this.seedInitialNeighborhoodsToSupabase(seed, remote).catch(() => {});
      }

      return merged;
    },

    async seedInitialNeighborhoodsToSupabase(seedList, currentRemote) {
      const existingNames = new Set((currentRemote || []).map(r => (r.name || '').trim().toLowerCase()));
      const toInsert = seedList.filter(s => !existingNames.has((s.name || '').trim().toLowerCase()));
      for (const s of toInsert) {
        try {
          await api('save-neighborhood', 'POST', {
            name: s.name,
            delivery_fee: Number(s.delivery_fee) || 0,
            delivery_time_min: Number(s.delivery_time_min) || 60,
            is_active: s.is_active !== false
          });
        } catch {}
      }
    },

    async saveNeighborhood(neighborhood) {
      let saved = {
        ...neighborhood,
        name: String(neighborhood.name || '').trim(),
        delivery_fee: Number(neighborhood.delivery_fee) || 0,
        delivery_time_min: Number(neighborhood.delivery_time_min) || 60,
        is_active: neighborhood.is_active !== false
      };

      const isRealUuid = isUuid(saved.id);
      const payloadToSend = isRealUuid ? saved : { ...saved, id: undefined };

      try {
        const result = await api('save-neighborhood', 'POST', payloadToSend);
        if (result && result.data && result.data.id) {
          saved = { ...saved, ...result.data };
        }
      } catch (e) {
        console.warn('Erro ao salvar bairro via API:', e);
        if (!saved.id) saved.id = generateUuidOrId('bairro');
      }

      const list = getStored(STORAGE_KEYS.NEIGHBORHOODS, window.INITIAL_NEIGHBORHOODS || []);
      const idx = list.findIndex(n => (saved.id && n.id === saved.id) || (n.name && n.name.toLowerCase() === (saved.name || '').toLowerCase()));
      const updated = idx >= 0 ? list.map((n, i) => i === idx ? saved : n) : [...list, saved];
      setStored(STORAGE_KEYS.NEIGHBORHOODS, updated);

      return saved;
    },

    async deleteNeighborhood(id) {
      const list = getStored(STORAGE_KEYS.NEIGHBORHOODS, window.INITIAL_NEIGHBORHOODS || []);
      setStored(STORAGE_KEYS.NEIGHBORHOODS, list.filter(n => n.id !== id));
      try {
        await api('delete-neighborhood', 'DELETE', { id });
      } catch (e) {
        console.warn('Erro ao deletar bairro via API:', e);
      }
      return true;
    },

    // ----------------------------------------
    // 9. ENTREGADORES
    // ----------------------------------------
    async getCouriers() {
      let remote = [];
      try {
        const result = await api('get-couriers', 'GET');
        if (result && Array.isArray(result.data)) {
          remote = result.data;
        }
      } catch (e) {
        console.warn('Erro ao buscar entregadores via API:', e);
      }

      const seed = window.INITIAL_COURIERS || [];
      const local = getStored(STORAGE_KEYS.COURIERS, []);

      const mergedMap = new Map();
      seed.forEach(c => {
        const key = (c.name || '').trim().toLowerCase();
        if (key) mergedMap.set(key, { ...c });
      });
      local.forEach(c => {
        const key = (c.name || '').trim().toLowerCase();
        if (key) {
          const existing = mergedMap.get(key) || {};
          mergedMap.set(key, { ...existing, ...c });
        }
      });
      remote.forEach(c => {
        const key = (c.name || '').trim().toLowerCase();
        if (key) {
          const existing = mergedMap.get(key) || {};
          mergedMap.set(key, { ...existing, ...c });
        }
      });

      const merged = Array.from(mergedMap.values());
      setStored(STORAGE_KEYS.COURIERS, merged);
      return merged;
    },

    async saveCourier(courier) {
      const list = await this.getCouriers();
      let saved = {
        ...courier,
        id: courier.id || generateUuidOrId('courier'),
        name: courier.name.trim(),
        phone: (courier.phone || '').trim(),
        is_active: courier.is_active !== false
      };
      const idx = list.findIndex(c => c.id === saved.id);
      const updated = idx >= 0 ? list.map((c, i) => i === idx ? saved : c) : [...list, saved];
      setStored(STORAGE_KEYS.COURIERS, updated);
      try {
        const result = await api('save-courier', 'POST', saved);
        if (result.data?.id) saved.id = result.data.id;
      } catch (e) {
        console.warn('Erro ao salvar entregador via API:', e);
      }
      return saved;
    },

    async deleteCourier(id) {
      const list = await this.getCouriers();
      setStored(STORAGE_KEYS.COURIERS, list.filter(c => c.id !== id));
      try {
        await api('delete-courier', 'DELETE', { id });
      } catch (e) {
        console.warn('Erro ao deletar entregador via API:', e);
      }
      return true;
    },

    // ----------------------------------------
    // 10. FECHAMENTO DE CAIXA
    // ----------------------------------------
    async getCashClosings(requestedStoreId) {
      const activeStore = requestedStoreId || getCurrentStoreId();
      if (activeStore === 'vilarica') {
        return getStored('boydegusta_vr_cash_closings', []);
      }
      try {
        const result = await api('get-cash-closings', 'GET');
        if (result.data) {
          setStored(STORAGE_KEYS.CASH_CLOSINGS, result.data);
          return result.data;
        }
      } catch (e) {
        console.warn('Erro ao buscar fechamentos via API:', e);
      }
      return getStored(STORAGE_KEYS.CASH_CLOSINGS, []);
    },

    async saveCashClosing(closing, requestedStoreId) {
      const activeStore = requestedStoreId || getCurrentStoreId();
      if (activeStore === 'vilarica') {
        const closings = getStored('boydegusta_vr_cash_closings', []);
        const saved = {
          ...closing,
          store_id: 'vilarica',
          id: closing.id || generateUuidOrId('closing_vr'),
          closed_at: closing.closed_at || new Date().toISOString()
        };
        const closingKey = saved.closing_date || saved.date;
        setStored('boydegusta_vr_cash_closings', [saved, ...closings.filter(c => (c.closing_date || c.date) !== closingKey)]);
        return saved;
      }
      const closings = getStored(STORAGE_KEYS.CASH_CLOSINGS, []);
      const saved = {
        ...closing,
        id: closing.id || generateUuidOrId('closing'),
        closed_at: closing.closed_at || new Date().toISOString()
      };
      const closingKey = saved.closing_date || saved.date;
      setStored(STORAGE_KEYS.CASH_CLOSINGS, [saved, ...closings.filter(c => (c.closing_date || c.date) !== closingKey)]);
      try {
        await api('save-cash-closing', 'POST', saved);
      } catch (e) {
        console.warn('Erro ao salvar fechamento via API:', e);
      }
      return saved;
    },

    // ----------------------------------------
    // 11. USUÁRIOS E ENDEREÇOS (localStorage)
    // ----------------------------------------
    async getUserByPhone(phone) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      if (!cleanPhone) return null;
      try {
        const result = await api(`get-user-by-phone&phone=${cleanPhone}`, 'GET');
        if (result.data) return result.data;
      } catch {}
      const users = getStored(STORAGE_KEYS.USERS, []);
      return users.find(u => u.phone === cleanPhone) || null;
    },

    async getUsers() {
      return getStored(STORAGE_KEYS.USERS, []);
    },

    async saveUser(user) {
      const users = getStored(STORAGE_KEYS.USERS, []);
      let saved = { ...user, id: user.id || generateUuidOrId('user') };
      const idx = users.findIndex(u => u.phone === user.phone);
      const updated = idx >= 0 ? users.map((u, i) => i === idx ? { ...u, ...saved } : u) : [...users, saved];
      setStored(STORAGE_KEYS.USERS, updated);
      try {
        const result = await api('save-user', 'POST', saved);
        if (result.data?.id) saved.id = result.data.id;
      } catch {}
      return saved;
    },

    async getAddresses(userId) {
      const addrs = getStored(STORAGE_KEYS.ADDRESSES, []);
      return addrs.filter(a => a.user_id === userId);
    },

    async saveAddress(address) {
      const addrs = getStored(STORAGE_KEYS.ADDRESSES, []);
      let saved = { ...address, id: address.id || generateUuidOrId('addr') };
      const idx = addrs.findIndex(a => a.id === saved.id);
      const updated = idx >= 0 ? addrs.map((a, i) => i === idx ? saved : a) : [...addrs, saved];
      setStored(STORAGE_KEYS.ADDRESSES, updated);
      return saved;
    },

    async deleteAddress(id) {
      const addrs = getStored(STORAGE_KEYS.ADDRESSES, []);
      setStored(STORAGE_KEYS.ADDRESSES, addrs.filter(a => a.id !== id));
      return true;
    },

    // ----------------------------------------
    // 12. PROMOÇÕES DO DIA
    // ----------------------------------------
    async getDayPromotions() {
      try {
        const result = await api('get-day-promotions', 'GET');
        if (result.data && result.data.length > 0) {
          setStored(STORAGE_KEYS.DAY_PROMOTIONS, result.data);
          return result.data;
        }
      } catch (e) {
        console.warn('Erro ao buscar promoções do dia via API:', e);
      }
      return getStored(STORAGE_KEYS.DAY_PROMOTIONS, []);
    },

    async saveDayPromotion(promo) {
      const list = getStored(STORAGE_KEYS.DAY_PROMOTIONS, []);
      const saved = {
        ...promo,
        id: promo.id || generateUuidOrId('daypromo'),
        weekdays: promo.weekdays || [],
        discount_type: promo.discount_type || 'none',
        discount_value: Number(promo.discount_value) || 0,
        is_active: promo.is_active !== false
      };
      const idx = list.findIndex(p => p.id === saved.id);
      const updated = idx >= 0 ? list.map((p, i) => i === idx ? saved : p) : [...list, saved];
      setStored(STORAGE_KEYS.DAY_PROMOTIONS, updated);
      try {
        const result = await api('save-day-promotion', 'POST', saved);
        if (result.data?.id) saved.id = result.data.id;
      } catch (e) {
        console.warn('Erro ao salvar promoção do dia via API:', e);
      }
      return saved;
    },

    async deleteDayPromotion(id) {
      const list = getStored(STORAGE_KEYS.DAY_PROMOTIONS, []);
      setStored(STORAGE_KEYS.DAY_PROMOTIONS, list.filter(p => p.id !== id));
      try {
        await api('delete-day-promotion', 'DELETE', { id });
      } catch (e) {
        console.warn('Erro ao deletar promoção do dia via API:', e);
      }
      return true;
    }
  };

  window.db = db;
  console.log('✅ DB inicializado via Netlify Functions (modo seguro)');
})();
