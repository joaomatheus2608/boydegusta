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
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn(`[QuotaExceeded] Limite do localStorage atingido ao salvar ${key}.`);
        if (key === STORAGE_KEYS.PRODUCTS && Array.isArray(data)) {
          const stripped = data.map(p =>
            (p.image_url && p.image_url.startsWith('data:image')) ? { ...p, image_url: 'boylogo.jpg' } : p
          );
          try { localStorage.setItem(key, JSON.stringify(stripped)); } catch {}
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

  // Inicialização dos defaults locais
  function initDefaults() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) setStored(STORAGE_KEYS.SETTINGS, window.INITIAL_SETTINGS);
    if (!localStorage.getItem(STORAGE_KEYS.HOURS)) setStored(STORAGE_KEYS.HOURS, window.INITIAL_OPERATING_HOURS);
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) setStored(STORAGE_KEYS.CATEGORIES, window.INITIAL_CATEGORIES);
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) setStored(STORAGE_KEYS.PRODUCTS, window.INITIAL_PRODUCTS);
    if (!localStorage.getItem(STORAGE_KEYS.OPTIONALS)) setStored(STORAGE_KEYS.OPTIONALS, window.INITIAL_OPTIONALS);
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
    // UPLOAD DE IMAGEM (via servidor)
    // ----------------------------------------
    async uploadImage(file) {
      if (!file) return null;
      try {
        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
          reader.onload = e => resolve(e.target.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const result = await api('upload-image', 'POST', { base64, fileName, mimeType: file.type || 'image/jpeg' });
        return result?.url || null;
      } catch (e) {
        console.warn('Erro ao subir imagem:', e);
        return null;
      }
    },

    // ----------------------------------------
    // 1. CONFIGURAÇÕES
    // ----------------------------------------
    async getSettings() {
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

    async updateSettings(newSettings) {
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
    async getCategories() {
      try {
        const result = await api('get-categories', 'GET');
        if (result.data && result.data.length > 0) {
          setStored(STORAGE_KEYS.CATEGORIES, result.data);
          return result.data;
        }
      } catch (e) {
        console.warn('Erro ao buscar categorias via API:', e);
      }
      return getStored(STORAGE_KEYS.CATEGORIES, window.INITIAL_CATEGORIES);
    },

    async saveCategory(cat) {
      const list = getStored(STORAGE_KEYS.CATEGORIES, window.INITIAL_CATEGORIES);
      let saved = { ...cat };
      if (!saved.id) {
        saved.id = generateUuidOrId('cat');
        saved.slug = saved.slug || saved.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        saved.order_index = (cat.order_index !== undefined) ? Number(cat.order_index) : list.length + 1;
        saved.is_active = saved.is_active !== false;
      }
      const idx = list.findIndex(c => c.id === saved.id);
      const updated = idx >= 0 ? list.map((c, i) => i === idx ? { ...c, ...saved } : c) : [...list, saved];
      setStored(STORAGE_KEYS.CATEGORIES, updated);
      try {
        const result = await api('save-category', 'POST', saved);
        if (result.data?.id) saved.id = result.data.id;
      } catch (e) {
        console.warn('Erro ao salvar categoria via API:', e);
      }
      return saved;
    },

    async deleteCategory(id) {
      const list = getStored(STORAGE_KEYS.CATEGORIES, window.INITIAL_CATEGORIES);
      setStored(STORAGE_KEYS.CATEGORIES, list.filter(c => c.id !== id));
      try {
        await api('delete-category', 'DELETE', { id });
      } catch (e) {
        console.warn('Erro ao deletar categoria via API:', e);
      }
      return true;
    },

    // ----------------------------------------
    // 4. PRODUTOS
    // ----------------------------------------
    async getProducts() {
      try {
        const result = await api('get-products', 'GET');
        if (result.data && result.data.length > 0) {
          const normalized = result.data.map(p => ({
            ...p,
            promo_days: window.normalizePromoDays ? window.normalizePromoDays(p.promo_days, p.monday_price) : (Array.isArray(p.promo_days) ? p.promo_days : [])
          }));
          setStored(STORAGE_KEYS.PRODUCTS, normalized);
          return normalized;
        }
      } catch (e) {
        console.warn('Erro ao buscar produtos via API:', e);
      }
      const local = getStored(STORAGE_KEYS.PRODUCTS, window.INITIAL_PRODUCTS);
      return local.map(p => ({
        ...p,
        promo_days: window.normalizePromoDays ? window.normalizePromoDays(p.promo_days, p.monday_price) : (Array.isArray(p.promo_days) ? p.promo_days : [])
      }));
    },

    async saveProduct(prod) {
      const list = getStored(STORAGE_KEYS.PRODUCTS, window.INITIAL_PRODUCTS);
      const normalizedDays = window.normalizePromoDays ? window.normalizePromoDays(prod.promo_days, prod.monday_price) : (Array.isArray(prod.promo_days) ? prod.promo_days : []);
      const rawPromoPrice = (prod.promo_price !== null && prod.promo_price !== undefined && prod.promo_price !== '') ? Number(prod.promo_price) : null;
      
      let saved = {
        ...prod,
        price: (prod.price !== null && prod.price !== undefined && prod.price !== '') ? Number(prod.price) : null,
        promo_price: rawPromoPrice,
        promo_days: normalizedDays,
        promo_label: prod.promo_label ? String(prod.promo_label).trim() : null,
        is_promo: Boolean(prod.is_promo || (normalizedDays.length > 0 && rawPromoPrice > 0)),
        monday_price: (normalizedDays.includes(1) && rawPromoPrice) ? rawPromoPrice : (prod.monday_price ? Number(prod.monday_price) : null)
      };

      const oldId = saved.id;
      if (!saved.id) {
        saved.id = generateUuidOrId('prod');
        saved.is_active = saved.is_active !== false;
        saved.is_available = saved.is_available !== false;
        saved.order_index = list.length + 1;
      }
      const idx = list.findIndex(p => p.id === saved.id || (oldId && p.id === oldId));
      let updated = idx >= 0 ? list.map((p, i) => i === idx ? { ...p, ...saved } : p) : [...list, saved];
      setStored(STORAGE_KEYS.PRODUCTS, updated);

      try {
        const result = await api('save-product', 'POST', saved);
        if (result.data?.id && result.data.id !== saved.id) {
          const newId = result.data.id;
          saved.id = newId;
          const currentList = getStored(STORAGE_KEYS.PRODUCTS, window.INITIAL_PRODUCTS);
          const currentIdx = currentList.findIndex(p => p.id === oldId || p.id === saved.id);
          if (currentIdx >= 0) {
            currentList[currentIdx] = saved;
            setStored(STORAGE_KEYS.PRODUCTS, currentList);
          }
        }
      } catch (e) {
        console.warn('Erro ao salvar produto via API:', e);
      }
      return saved;
    },

    async deleteProduct(id) {
      const list = getStored(STORAGE_KEYS.PRODUCTS, window.INITIAL_PRODUCTS);
      setStored(STORAGE_KEYS.PRODUCTS, list.filter(p => p.id !== id));
      try {
        await api('delete-product', 'DELETE', { id });
      } catch (e) {
        console.warn('Erro ao deletar produto via API:', e);
      }
      return true;
    },

    // ----------------------------------------
    // 5. ADICIONAIS
    // ----------------------------------------
    async getOptionals() {
      try {
        const result = await api('get-optionals', 'GET');
        if (result.data && result.data.length > 0) {
          setStored(STORAGE_KEYS.OPTIONALS, result.data);
          return result.data;
        }
      } catch (e) {
        console.warn('Erro ao buscar adicionais via API:', e);
      }
      return getStored(STORAGE_KEYS.OPTIONALS, window.INITIAL_OPTIONALS);
    },

    async saveOptional(opt) {
      const list = getStored(STORAGE_KEYS.OPTIONALS, window.INITIAL_OPTIONALS);
      let saved = { ...opt, price: Number(opt.price) || 0 };
      if (!saved.id) {
        saved.id = generateUuidOrId('opt');
        saved.is_active = saved.is_active !== false;
        saved.order_index = list.length + 1;
      }
      const idx = list.findIndex(o => o.id === saved.id);
      const updated = idx >= 0 ? list.map((o, i) => i === idx ? { ...o, ...saved } : o) : [...list, saved];
      setStored(STORAGE_KEYS.OPTIONALS, updated);
      try {
        const result = await api('save-optional', 'POST', saved);
        if (result.data?.id) saved.id = result.data.id;
      } catch (e) {
        console.warn('Erro ao salvar adicional via API:', e);
      }
      return saved;
    },

    async deleteOptional(id) {
      const list = getStored(STORAGE_KEYS.OPTIONALS, window.INITIAL_OPTIONALS);
      setStored(STORAGE_KEYS.OPTIONALS, list.filter(o => o.id !== id));
      try {
        await api('delete-optional', 'DELETE', { id });
      } catch (e) {
        console.warn('Erro ao deletar adicional via API:', e);
      }
      return true;
    },

    // ----------------------------------------
    // 6. PROMOÇÕES (COMBOS)
    // ----------------------------------------
    async getPromotions() {
      try {
        const result = await api('get-promotions', 'GET');
        if (result.data && result.data.length > 0) {
          setStored(STORAGE_KEYS.PROMOTIONS, result.data);
          return result.data;
        }
      } catch (e) {
        console.warn('Erro ao buscar promoções via API:', e);
      }
      return getStored(STORAGE_KEYS.PROMOTIONS, window.INITIAL_PROMOTIONS);
    },

    async savePromotion(promo) {
      const list = getStored(STORAGE_KEYS.PROMOTIONS, window.INITIAL_PROMOTIONS);
      let saved = { ...promo, price: Number(promo.price) || 40 };
      if (!saved.id) {
        saved.id = generateUuidOrId('promo');
        saved.is_active = saved.is_active !== false;
      }
      const idx = list.findIndex(p => p.id === saved.id);
      const updated = idx >= 0 ? list.map((p, i) => i === idx ? { ...p, ...saved } : p) : [...list, saved];
      setStored(STORAGE_KEYS.PROMOTIONS, updated);
      try {
        const result = await api('save-promotion', 'POST', saved);
        if (result.data?.id) saved.id = result.data.id;
      } catch (e) {
        console.warn('Erro ao salvar promoção via API:', e);
      }
      return saved;
    },

    async deletePromotion(id) {
      const list = getStored(STORAGE_KEYS.PROMOTIONS, window.INITIAL_PROMOTIONS);
      setStored(STORAGE_KEYS.PROMOTIONS, list.filter(p => p.id !== id));
      try {
        await api('delete-promotion', 'DELETE', { id });
      } catch (e) {
        console.warn('Erro ao excluir promoção via API:', e);
      }
      return true;
    },

    // ----------------------------------------
    // 7. PEDIDOS
    // ----------------------------------------
    async getOrders() {
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

    async createOrder(orderPayload) {
      const orders = getStored(STORAGE_KEYS.ORDERS, []);
      const nextOrderNumber = orders.length > 0
        ? Math.max(...orders.map(o => Number(o.order_number) || 0)) + 1
        : 1;

      let newOrder = {
        ...orderPayload,
        id: generateUuidOrId('order'),
        order_number: nextOrderNumber,
        status: orderPayload.status || 'novo',
        table_number: orderPayload.table_number ? Number(orderPayload.table_number) : null,
        whatsapp_sent: orderPayload.whatsapp_sent !== false,
        created_at: orderPayload.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: orderPayload.items || []
      };

      try {
        const result = await api('create-order', 'POST', newOrder);
        if (result.data) {
          newOrder = { ...newOrder, ...result.data, items: result.data.items || result.data.order_items || newOrder.items };
        }
      } catch (e) {
        console.warn('Erro ao criar pedido via API:', e);
      }

      const currentOrders = getStored(STORAGE_KEYS.ORDERS, []);
      setStored(STORAGE_KEYS.ORDERS, [newOrder, ...currentOrders.filter(o => o.id !== newOrder.id)]);
      return newOrder;
    },

    async updateOrderStatus(orderId, newStatus, paymentMethod, courierName) {
      const orders = getStored(STORAGE_KEYS.ORDERS, []);
      const updated = orders.map(o => {
        if (o.id === orderId) {
          const u = { ...o, status: newStatus, payment_method: paymentMethod || o.payment_method, updated_at: new Date().toISOString() };
          if (courierName !== undefined) u.courier_name = courierName;
          return u;
        }
        return o;
      });
      setStored(STORAGE_KEYS.ORDERS, updated);
      try {
        await api('update-order', 'POST', { id: orderId, status: newStatus, payment_method: paymentMethod, courier_name: courierName });
      } catch (e) {
        console.warn('Erro ao atualizar pedido via API:', e);
      }
      return updated.find(o => o.id === orderId);
    },

    async assignCourierToOrder(orderId, courierName) {
      return this.updateOrderStatus(orderId, 'saiu_para_entrega', null, courierName);
    },

    async getTableActiveOrders(tableNumber) {
      const num = Number(tableNumber);
      const orders = await this.getOrders();
      const activeStatuses = ['novo', 'confirmado', 'em_preparo', 'pronto_para_retirada', 'saiu_para_entrega'];
      return orders.filter(o =>
        (o.order_type === 'mesa' || o.table_number === num) &&
        Number(o.table_number) === num &&
        activeStatuses.includes(o.status)
      );
    },

    async closeTable(tableNumber, paymentMethod = 'dinheiro') {
      const activeOrders = await this.getTableActiveOrders(tableNumber);
      for (const order of activeOrders) {
        await this.updateOrderStatus(order.id, 'finalizado', paymentMethod);
      }
      return true;
    },

    // ----------------------------------------
    // 8. BAIRROS E TAXAS
    // ----------------------------------------
    async getNeighborhoods() {
      try {
        const result = await api('get-neighborhoods', 'GET');
        if (result.data && result.data.length > 0) {
          setStored(STORAGE_KEYS.NEIGHBORHOODS, result.data);
          return result.data;
        }
      } catch (e) {
        console.warn('Erro ao buscar bairros via API:', e);
      }
      const local = getStored(STORAGE_KEYS.NEIGHBORHOODS, []);
      if (!local || local.length === 0) {
        const seed = window.INITIAL_NEIGHBORHOODS || [];
        setStored(STORAGE_KEYS.NEIGHBORHOODS, seed);
        return seed;
      }
      return local;
    },

    async saveNeighborhood(neighborhood) {
      const list = await this.getNeighborhoods();
      let saved = {
        ...neighborhood,
        id: neighborhood.id || generateUuidOrId('bairro'),
        delivery_fee: Number(neighborhood.delivery_fee) || 0,
        delivery_time_min: Number(neighborhood.delivery_time_min) || 60,
        is_active: neighborhood.is_active !== false
      };
      const idx = list.findIndex(n => n.id === saved.id);
      const updated = idx >= 0 ? list.map((n, i) => i === idx ? saved : n) : [...list, saved];
      setStored(STORAGE_KEYS.NEIGHBORHOODS, updated);
      try {
        const result = await api('save-neighborhood', 'POST', saved);
        if (result.data?.id) saved.id = result.data.id;
      } catch (e) {
        console.warn('Erro ao salvar bairro via API:', e);
      }
      return saved;
    },

    async deleteNeighborhood(id) {
      const list = await this.getNeighborhoods();
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
      try {
        const result = await api('get-couriers', 'GET');
        if (result.data && result.data.length > 0) {
          setStored(STORAGE_KEYS.COURIERS, result.data);
          return result.data;
        }
      } catch (e) {
        console.warn('Erro ao buscar entregadores via API:', e);
      }
      const local = getStored(STORAGE_KEYS.COURIERS, []);
      if (!local || local.length === 0) {
        const seed = window.INITIAL_COURIERS || [];
        setStored(STORAGE_KEYS.COURIERS, seed);
        return seed;
      }
      return local;
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
    async getCashClosings() {
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

    async saveCashClosing(closing) {
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
