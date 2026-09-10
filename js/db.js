// ========================================================
// BOYDEGUSTA - CAMADA DE BANCO DE DADOS (SUPABASE + LOCAL)
// ========================================================

(function() {
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
      try {
        return window.crypto.randomUUID();
      } catch {}
    }
    return `${prefix ? prefix + '-' : ''}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Inicializa Supabase se disponível
  let supabaseClient = null;
  const config = window.APP_CONFIG || {};
  const isSupabaseReady = Boolean(
    window.supabase &&
    config.SUPABASE_URL &&
    config.SUPABASE_ANON_KEY &&
    !config.SUPABASE_URL.includes('your-project') &&
    config.SUPABASE_URL.startsWith('https://')
  );

  if (isSupabaseReady) {
    try {
      supabaseClient = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
      console.log('✅ Supabase conectado com sucesso!');
    } catch (err) {
      console.warn('Falha ao conectar com Supabase, usando armazenamento local:', err);
    }
  }

  function getStored(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  }

  function setStored(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn(`[QuotaExceeded] Limite do localStorage atingido ao salvar ${key}. Limpando caches pesados...`);
        try {
          // Se for produtos com fotos base64, remove strings pesadas de imagem do cache local temporário
          if (key === STORAGE_KEYS.PRODUCTS && Array.isArray(data)) {
            const stripped = data.map(p => {
              if (p.image_url && p.image_url.startsWith('data:image')) {
                return { ...p, image_url: 'boylogo.jpg' };
              }
              return p;
            });
            localStorage.setItem(key, JSON.stringify(stripped));
          }
        } catch {}
      } else {
        console.error(`Erro ao gravar ${key}:`, e);
      }
    }
  }

  // Inicialização local
  function initDefaults() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      setStored(STORAGE_KEYS.SETTINGS, window.INITIAL_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HOURS)) {
      setStored(STORAGE_KEYS.HOURS, window.INITIAL_OPERATING_HOURS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      setStored(STORAGE_KEYS.CATEGORIES, window.INITIAL_CATEGORIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      setStored(STORAGE_KEYS.PRODUCTS, window.INITIAL_PRODUCTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.OPTIONALS)) {
      setStored(STORAGE_KEYS.OPTIONALS, window.INITIAL_OPTIONALS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROMOTIONS)) {
      setStored(STORAGE_KEYS.PROMOTIONS, window.INITIAL_PROMOTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NEIGHBORHOODS)) {
      setStored(STORAGE_KEYS.NEIGHBORHOODS, window.INITIAL_NEIGHBORHOODS || []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COURIERS)) {
      setStored(STORAGE_KEYS.COURIERS, window.INITIAL_COURIERS || []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CASH_CLOSINGS)) {
      setStored(STORAGE_KEYS.CASH_CLOSINGS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      setStored(STORAGE_KEYS.ORDERS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      setStored(STORAGE_KEYS.USERS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ADDRESSES)) {
      setStored(STORAGE_KEYS.ADDRESSES, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DAY_PROMOTIONS)) {
      setStored(STORAGE_KEYS.DAY_PROMOTIONS, []);
    }
  }

  initDefaults();

  const db = {
    // ----------------------------------------
    // STORAGE / UPLOAD DE IMAGENS
    // ----------------------------------------
    async uploadImage(file) {
      if (supabaseClient && file) {
        try {
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
          const filePath = `products/${fileName}`;

          const { data, error } = await supabaseClient.storage.from('products').upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

          if (!error && data) {
            const { data: publicData } = supabaseClient.storage.from('products').getPublicUrl(filePath);
            if (publicData?.publicUrl) {
              return publicData.publicUrl;
            }
          }
        } catch (e) {
          console.warn('Erro ao subir imagem no Supabase Storage, usando fallback:', e);
        }
      }
      return null;
    },

    // ----------------------------------------
    // 1. CONFIGURAÇÕES
    // ----------------------------------------
    async getSettings() {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('settings').select('*').limit(1).single();
          if (!error && data) {
            setStored(STORAGE_KEYS.SETTINGS, data);
            return data;
          }
        } catch (e) {
          console.warn('Erro ao buscar settings no Supabase:', e);
        }
      }
      return getStored(STORAGE_KEYS.SETTINGS, window.INITIAL_SETTINGS);
    },

    async updateSettings(newSettings) {
      const current = getStored(STORAGE_KEYS.SETTINGS, window.INITIAL_SETTINGS);
      const updated = { ...current, ...newSettings, updated_at: new Date().toISOString() };
      setStored(STORAGE_KEYS.SETTINGS, updated);

      if (supabaseClient) {
        try {
          if (updated.id && isUuid(updated.id)) {
            await supabaseClient.from('settings').update(newSettings).eq('id', updated.id);
          } else {
            const { data } = await supabaseClient.from('settings').upsert(newSettings).select().single();
            if (data?.id) updated.id = data.id;
          }
        } catch (e) {
          console.warn('Erro ao sincronizar settings no Supabase:', e);
        }
      }
      return updated;
    },

    async verifyAdminPassword(password) {
      if (supabaseClient && password) {
        try {
          const { data, error } = await supabaseClient.rpc('verify_admin_password', {
            input_password: password
          });
          if (!error && typeof data === 'boolean') {
            return data;
          }
        } catch (e) {
          // Fallback se RPC não estiver instalada
        }
      }
      return null;
    },

    // ----------------------------------------
    // 2. HORÁRIOS DE FUNCIONAMENTO
    // ----------------------------------------
    async getOperatingHours() {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('operating_hours').select('*').order('day_of_week');
          if (!error && data && data.length > 0) {
            setStored(STORAGE_KEYS.HOURS, data);
            return data;
          }
        } catch (e) {
          console.warn('Erro ao buscar horários no Supabase:', e);
        }
      }
      return getStored(STORAGE_KEYS.HOURS, window.INITIAL_OPERATING_HOURS);
    },

    async updateOperatingHours(hours) {
      setStored(STORAGE_KEYS.HOURS, hours);
      if (supabaseClient) {
        try {
          await supabaseClient.from('operating_hours').upsert(hours);
        } catch (e) {
          console.warn('Erro ao sincronizar horários no Supabase:', e);
        }
      }
      return hours;
    },

    // ----------------------------------------
    // 3. CATEGORIAS
    // ----------------------------------------
    async getCategories() {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('categories').select('*').order('order_index');
          if (!error && data && data.length > 0) {
            setStored(STORAGE_KEYS.CATEGORIES, data);
            return data;
          }
        } catch (e) {
          console.warn('Erro ao buscar categorias no Supabase:', e);
        }
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
      let updated;
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...saved };
        updated = [...list];
      } else {
        updated = [...list, saved];
      }
      setStored(STORAGE_KEYS.CATEGORIES, updated);

      if (supabaseClient) {
        try {
          const supabasePayload = { ...saved };
          if (!isUuid(supabasePayload.id)) {
            delete supabasePayload.id;
          }
          const { data, error } = isUuid(saved.id)
            ? await supabaseClient.from('categories').upsert(saved).select().single()
            : await supabaseClient.from('categories').insert([supabasePayload]).select().single();

          if (!error && data?.id) {
            saved.id = data.id;
            const finalUpdated = updated.map(c => (c.name === saved.name ? { ...c, id: data.id } : c));
            setStored(STORAGE_KEYS.CATEGORIES, finalUpdated);
          }
        } catch (e) {
          console.warn('Erro ao sincronizar categoria no Supabase:', e);
        }
      }
      return saved;
    },

    async deleteCategory(id) {
      const list = getStored(STORAGE_KEYS.CATEGORIES, window.INITIAL_CATEGORIES);
      const updated = list.filter(c => c.id !== id);
      setStored(STORAGE_KEYS.CATEGORIES, updated);

      if (supabaseClient) {
        try {
          if (isUuid(id)) {
            await supabaseClient.from('categories').delete().eq('id', id);
          } else {
            await supabaseClient.from('categories').delete().eq('name', list.find(c => c.id === id)?.name || '');
          }
        } catch (e) {
          console.warn('Erro ao deletar categoria no Supabase:', e);
        }
      }
      return true;
    },

    // ----------------------------------------
    // 4. PRODUTOS
    // ----------------------------------------
    async getProducts() {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('products').select('*').order('order_index');
          if (!error && data && data.length > 0) {
            setStored(STORAGE_KEYS.PRODUCTS, data);
            return data;
          }
        } catch (e) {
          console.warn('Erro ao buscar produtos no Supabase:', e);
        }
      }
      return getStored(STORAGE_KEYS.PRODUCTS, window.INITIAL_PRODUCTS);
    },

    async saveProduct(prod) {
      const list = getStored(STORAGE_KEYS.PRODUCTS, window.INITIAL_PRODUCTS);
      let saved = { ...prod };

      if (saved.price !== null && saved.price !== undefined && saved.price !== '') {
        saved.price = Number(saved.price);
      } else {
        saved.price = null;
      }

      if (!saved.id) {
        saved.id = generateUuidOrId('prod');
        saved.is_active = saved.is_active !== false;
        saved.is_available = saved.is_available !== false;
        saved.order_index = list.length + 1;
      }

      const idx = list.findIndex(p => p.id === saved.id);
      let updated;
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...saved };
        updated = [...list];
      } else {
        updated = [...list, saved];
      }
      setStored(STORAGE_KEYS.PRODUCTS, updated);

      if (supabaseClient) {
        try {
          const supabasePayload = { ...saved };
          if (!isUuid(supabasePayload.id)) {
            delete supabasePayload.id;
          }
          if (!isUuid(supabasePayload.category_id)) {
            delete supabasePayload.category_id;
          }

          const { data, error } = isUuid(saved.id)
            ? await supabaseClient.from('products').upsert(saved).select().single()
            : await supabaseClient.from('products').insert([supabasePayload]).select().single();

          if (!error && data?.id) {
            saved.id = data.id;
            const finalUpdated = updated.map(p => (p.name === saved.name ? { ...p, id: data.id } : p));
            setStored(STORAGE_KEYS.PRODUCTS, finalUpdated);
          }
        } catch (e) {
          console.warn('Erro ao sincronizar produto no Supabase:', e);
        }
      }
      return saved;
    },

    async deleteProduct(id) {
      const list = getStored(STORAGE_KEYS.PRODUCTS, window.INITIAL_PRODUCTS);
      const updated = list.filter(p => p.id !== id);
      setStored(STORAGE_KEYS.PRODUCTS, updated);

      if (supabaseClient) {
        try {
          if (isUuid(id)) {
            await supabaseClient.from('products').delete().eq('id', id);
          } else {
            await supabaseClient.from('products').delete().eq('name', list.find(p => p.id === id)?.name || '');
          }
        } catch (e) {
          console.warn('Erro ao deletar produto no Supabase:', e);
        }
      }
      return true;
    },

    // ----------------------------------------
    // 5. ADICIONAIS
    // ----------------------------------------
    async getOptionals() {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('optionals').select('*').order('order_index');
          if (!error && data && data.length > 0) {
            setStored(STORAGE_KEYS.OPTIONALS, data);
            return data;
          }
        } catch (e) {
          console.warn('Erro ao buscar adicionais no Supabase:', e);
        }
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
      let updated;
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...saved };
        updated = [...list];
      } else {
        updated = [...list, saved];
      }
      setStored(STORAGE_KEYS.OPTIONALS, updated);

      if (supabaseClient) {
        try {
          const supabasePayload = { ...saved };
          if (!isUuid(supabasePayload.id)) delete supabasePayload.id;
          const { data, error } = isUuid(saved.id)
            ? await supabaseClient.from('optionals').upsert(saved).select().single()
            : await supabaseClient.from('optionals').insert([supabasePayload]).select().single();

          if (!error && data?.id) {
            saved.id = data.id;
            const finalUpdated = updated.map(o => (o.name === saved.name ? { ...o, id: data.id } : o));
            setStored(STORAGE_KEYS.OPTIONALS, finalUpdated);
          }
        } catch (e) {
          console.warn('Erro ao sincronizar adicional no Supabase:', e);
        }
      }
      return saved;
    },

    async deleteOptional(id) {
      const list = getStored(STORAGE_KEYS.OPTIONALS, window.INITIAL_OPTIONALS);
      const updated = list.filter(o => o.id !== id);
      setStored(STORAGE_KEYS.OPTIONALS, updated);

      if (supabaseClient) {
        try {
          if (isUuid(id)) {
            await supabaseClient.from('optionals').delete().eq('id', id);
          } else {
            await supabaseClient.from('optionals').delete().eq('name', list.find(o => o.id === id)?.name || '');
          }
        } catch (e) {
          console.warn('Erro ao deletar adicional no Supabase:', e);
        }
      }
      return true;
    },

    // ----------------------------------------
    // 6. PROMOÇÕES (COMBOS)
    // ----------------------------------------
    async getPromotions() {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('promotions').select('*');
          if (!error && data && data.length > 0) {
            setStored(STORAGE_KEYS.PROMOTIONS, data);
            return data;
          }
        } catch (e) {
          console.warn('Erro ao buscar promoções no Supabase:', e);
        }
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
      let updated;
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...saved };
        updated = [...list];
      } else {
        updated = [...list, saved];
      }
      setStored(STORAGE_KEYS.PROMOTIONS, updated);

      if (supabaseClient) {
        try {
          const supabasePayload = { ...saved };
          if (!isUuid(supabasePayload.id)) delete supabasePayload.id;
          const { data, error } = isUuid(saved.id)
            ? await supabaseClient.from('promotions').upsert(saved).select().single()
            : await supabaseClient.from('promotions').insert([supabasePayload]).select().single();

          if (!error && data?.id) {
            saved.id = data.id;
            const finalUpdated = updated.map(p => (p.name === saved.name ? { ...p, id: data.id } : p));
            setStored(STORAGE_KEYS.PROMOTIONS, finalUpdated);
          }
        } catch (e) {
          console.warn('Erro ao sincronizar promoção no Supabase:', e);
        }
      }
      return saved;
    },

    // ----------------------------------------
    // 7. PEDIDOS
    // ----------------------------------------
    async getOrders() {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('orders')
            .select('*, order_items(*)')
            .order('created_at', { ascending: false });

          if (!error && data) {
            const normalized = data.map(o => ({
              ...o,
              items: o.order_items || o.items || [],
              table_number: o.table_number ? Number(o.table_number) : null
            }));

            setStored(STORAGE_KEYS.ORDERS, normalized);
            return normalized;
          }
        } catch (e) {
          console.warn('Erro ao buscar pedidos no Supabase:', e);
        }
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

      if (supabaseClient) {
        try {
          const { items, id, order_number, ...orderData } = newOrder;
          
          let { data: insertedOrder, error: orderErr } = await supabaseClient
            .from('orders')
            .insert([orderData])
            .select()
            .single();

          if (orderErr) {
            console.warn('Fallback seguro para schema de pedidos:', orderErr.message);
            const fallbackData = { ...orderData };
            if (fallbackData.order_type === 'balcao' || fallbackData.order_type === 'mesa') {
              fallbackData.notes = `[${fallbackData.order_type === 'mesa' ? `MESA ${fallbackData.table_number || '?'}` : 'BALCÃO/VIAGEM'}] ${fallbackData.notes || ''}`.trim();
              fallbackData.order_type = 'pickup';
            }
            if (fallbackData.payment_method === 'pendente') {
              fallbackData.payment_method = 'dinheiro';
            }
            delete fallbackData.table_number;

            const retry = await supabaseClient.from('orders').insert([fallbackData]).select().single();
            if (!retry.error && retry.data) {
              insertedOrder = retry.data;
            }
          }

          if (insertedOrder) {
            newOrder.id = insertedOrder.id;
            newOrder.order_number = insertedOrder.order_number || nextOrderNumber;

            if (items && items.length > 0) {
              const orderItems = items.map(item => ({
                order_id: insertedOrder.id,
                product_id: isUuid(item.id) ? item.id : null,
                product_name: item.name,
                unit_price: Number(item.price) || 0,
                quantity: Number(item.quantity) || 1,
                subtotal: Number(item.subtotal) || ((Number(item.price) || 0) * (Number(item.quantity) || 1)),
                optionals: item.optionals || [],
                notes: item.notes || '',
                is_combo: Boolean(item.is_combo),
                combo_choices: item.combo_choices || []
              }));

              const { data: insertedItems } = await supabaseClient.from('order_items').insert(orderItems).select();
              if (insertedItems) {
                newOrder.items = insertedItems;
                newOrder.order_items = insertedItems;
              }
            }
          }
        } catch (e) {
          console.warn('Erro ao salvar pedido no Supabase:', e);
        }
      }

      // Atualiza armazenamento local substituindo qualquer pedido provisório
      const currentOrders = getStored(STORAGE_KEYS.ORDERS, []);
      const updatedOrders = [newOrder, ...currentOrders.filter(o => o.id !== newOrder.id && o.order_number !== newOrder.order_number)];
      setStored(STORAGE_KEYS.ORDERS, updatedOrders);

      return newOrder;
    },

    async updateOrderStatus(orderId, newStatus, paymentMethod, courierName) {
      const orders = getStored(STORAGE_KEYS.ORDERS, []);
      const updated = orders.map(o => {
        if (o.id === orderId) {
          const u = { 
            ...o, 
            status: newStatus, 
            payment_method: paymentMethod || o.payment_method,
            updated_at: new Date().toISOString() 
          };
          if (courierName !== undefined) {
            u.courier_name = courierName;
          }
          return u;
        }
        return o;
      });
      setStored(STORAGE_KEYS.ORDERS, updated);

      if (supabaseClient) {
        try {
          const updatePayload = { status: newStatus, updated_at: new Date().toISOString() };
          if (paymentMethod) updatePayload.payment_method = paymentMethod;
          if (courierName !== undefined) updatePayload.courier_name = courierName;
          await supabaseClient.from('orders').update(updatePayload).eq('id', orderId);
        } catch (e) {
          console.warn('Erro ao atualizar status do pedido no Supabase:', e);
        }
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
    // 8. BAIRROS E TAXAS DE ENTREGA
    // ----------------------------------------
    async getNeighborhoods() {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('neighborhoods').select('*').order('name');
          if (!error && data && data.length > 0) {
            setStored(STORAGE_KEYS.NEIGHBORHOODS, data);
            return data;
          }
        } catch (e) {
          console.warn('Erro ao buscar bairros no Supabase:', e);
        }
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
      let updated;
      if (idx >= 0) {
        list[idx] = saved;
        updated = [...list];
      } else {
        updated = [...list, saved];
      }
      setStored(STORAGE_KEYS.NEIGHBORHOODS, updated);

      if (supabaseClient) {
        try {
          const supabasePayload = { ...saved };
          if (!isUuid(supabasePayload.id)) delete supabasePayload.id;
          const { data, error } = isUuid(saved.id)
            ? await supabaseClient.from('neighborhoods').upsert(saved).select().single()
            : await supabaseClient.from('neighborhoods').insert([supabasePayload]).select().single();

          if (!error && data?.id) {
            saved.id = data.id;
            const finalUpdated = updated.map(n => (n.name === saved.name ? { ...n, id: data.id } : n));
            setStored(STORAGE_KEYS.NEIGHBORHOODS, finalUpdated);
          }
        } catch (e) {
          console.warn('Erro ao salvar bairro no Supabase:', e);
        }
      }
      return saved;
    },

    async deleteNeighborhood(id) {
      const list = await this.getNeighborhoods();
      const updated = list.filter(n => n.id !== id);
      setStored(STORAGE_KEYS.NEIGHBORHOODS, updated);

      if (supabaseClient) {
        try {
          if (isUuid(id)) {
            await supabaseClient.from('neighborhoods').delete().eq('id', id);
          } else {
            await supabaseClient.from('neighborhoods').delete().eq('name', list.find(n => n.id === id)?.name || '');
          }
        } catch (e) {
          console.warn('Erro ao excluir bairro no Supabase:', e);
        }
      }
      return true;
    },

    // ----------------------------------------
    // 9. ENTREGADORES
    // ----------------------------------------
    async getCouriers() {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('couriers').select('*').order('name');
          if (!error && data && data.length > 0) {
            setStored(STORAGE_KEYS.COURIERS, data);
            return data;
          }
        } catch (e) {
          console.warn('Erro ao buscar entregadores no Supabase:', e);
        }
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
      let updated;
      if (idx >= 0) {
        list[idx] = saved;
        updated = [...list];
      } else {
        updated = [...list, saved];
      }
      setStored(STORAGE_KEYS.COURIERS, updated);

      if (supabaseClient) {
        try {
          const supabasePayload = { ...saved };
          if (!isUuid(supabasePayload.id)) delete supabasePayload.id;
          const { data, error } = isUuid(saved.id)
            ? await supabaseClient.from('couriers').upsert(saved).select().single()
            : await supabaseClient.from('couriers').insert([supabasePayload]).select().single();

          if (!error && data?.id) {
            saved.id = data.id;
            const finalUpdated = updated.map(c => (c.name === saved.name ? { ...c, id: data.id } : c));
            setStored(STORAGE_KEYS.COURIERS, finalUpdated);
          }
        } catch (e) {
          console.warn('Erro ao salvar entregador no Supabase:', e);
        }
      }
      return saved;
    },

    async deleteCourier(id) {
      const list = await this.getCouriers();
      const updated = list.filter(c => c.id !== id);
      setStored(STORAGE_KEYS.COURIERS, updated);

      if (supabaseClient) {
        try {
          if (isUuid(id)) {
            await supabaseClient.from('couriers').delete().eq('id', id);
          } else {
            await supabaseClient.from('couriers').delete().eq('name', list.find(c => c.id === id)?.name || '');
          }
        } catch (e) {
          console.warn('Erro ao excluir entregador no Supabase:', e);
        }
      }
      return true;
    },

    // ----------------------------------------
    // 10. FECHAMENTO DE CAIXA
    // ----------------------------------------
    async getCashClosings() {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('cash_closings').select('*').order('closed_at', { ascending: false });
          if (!error && data) {
            setStored(STORAGE_KEYS.CASH_CLOSINGS, data);
            return data;
          }
        } catch (e) {
          console.warn('Erro ao buscar fechamentos de caixa no Supabase:', e);
        }
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
      const updated = [saved, ...closings.filter(c => (c.closing_date || c.date) !== closingKey)];
      setStored(STORAGE_KEYS.CASH_CLOSINGS, updated);

      if (supabaseClient) {
        try {
          const { id, ...supabaseData } = saved;
          if (id && isUuid(id)) {
            await supabaseClient.from('cash_closings').upsert({ id, ...supabaseData });
          } else {
            await supabaseClient.from('cash_closings').insert([supabaseData]);
          }
        } catch (e) {
          console.warn('Erro ao salvar fechamento no Supabase:', e);
        }
      }
      return saved;
    },

    // ----------------------------------------
    // 11. USUÁRIOS E ENDEREÇOS
    // ----------------------------------------
    async getUserByPhone(phone) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      if (!cleanPhone) return null;

      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('profiles').select('*').eq('phone', cleanPhone).maybeSingle();
          if (!error && data) return data;
        } catch (e) {
          // Tenta buscar no storage local se Supabase não tiver tabela profiles configurada
        }
      }

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
      let updated;

      if (idx >= 0) {
        users[idx] = { ...users[idx], ...saved };
        updated = [...users];
      } else {
        updated = [...users, saved];
      }
      setStored(STORAGE_KEYS.USERS, updated);

      if (supabaseClient) {
        try {
          const supabasePayload = { ...saved };
          if (!isUuid(supabasePayload.id)) delete supabasePayload.id;
          const { data } = isUuid(saved.id)
            ? await supabaseClient.from('profiles').upsert(saved).select().single()
            : await supabaseClient.from('profiles').insert([supabasePayload]).select().single();
          if (data?.id) saved.id = data.id;
        } catch (e) {}
      }
      return saved;
    },

    async getAddresses(userId) {
      if (supabaseClient && isUuid(userId)) {
        try {
          const { data, error } = await supabaseClient.from('customer_addresses').select('*').eq('user_id', userId);
          if (!error && data && data.length > 0) {
            return data;
          }
        } catch (e) {}
      }
      const addrs = getStored(STORAGE_KEYS.ADDRESSES, []);
      return addrs.filter(a => a.user_id === userId);
    },

    async saveAddress(address) {
      const addrs = getStored(STORAGE_KEYS.ADDRESSES, []);
      let saved = { ...address, id: address.id || generateUuidOrId('addr') };
      const idx = addrs.findIndex(a => a.id === saved.id);
      let updated;

      if (idx >= 0) {
        addrs[idx] = saved;
        updated = [...addrs];
      } else {
        updated = [...addrs, saved];
      }
      setStored(STORAGE_KEYS.ADDRESSES, updated);

      if (supabaseClient) {
        try {
          const supabasePayload = { ...saved };
          if (!isUuid(supabasePayload.id)) delete supabasePayload.id;
          if (!isUuid(supabasePayload.user_id)) delete supabasePayload.user_id;
          const { data } = isUuid(saved.id)
            ? await supabaseClient.from('customer_addresses').upsert(saved).select().single()
            : await supabaseClient.from('customer_addresses').insert([supabasePayload]).select().single();
          if (data?.id) saved.id = data.id;
        } catch (e) {}
      }
      return saved;
    },

    async deleteAddress(id) {
      const addrs = getStored(STORAGE_KEYS.ADDRESSES, []);
      const updated = addrs.filter(a => a.id !== id);
      setStored(STORAGE_KEYS.ADDRESSES, updated);

      if (supabaseClient && isUuid(id)) {
        try {
          await supabaseClient.from('customer_addresses').delete().eq('id', id);
        } catch (e) {}
      }
      return true;
    },

    // ----------------------------------------
    // 12. PROMOÇÕES DO DIA
    // ----------------------------------------
    async getDayPromotions() {
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient.from('day_promotions').select('*');
          if (!error && data && data.length > 0) {
            setStored(STORAGE_KEYS.DAY_PROMOTIONS, data);
            return data;
          }
        } catch (e) {}
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
      let updated;
      if (idx >= 0) {
        list[idx] = saved;
        updated = [...list];
      } else {
        updated = [...list, saved];
      }
      setStored(STORAGE_KEYS.DAY_PROMOTIONS, updated);

      if (supabaseClient) {
        try {
          const supabasePayload = { ...saved };
          if (!isUuid(supabasePayload.id)) delete supabasePayload.id;
          const { data } = isUuid(saved.id)
            ? await supabaseClient.from('day_promotions').upsert(saved).select().single()
            : await supabaseClient.from('day_promotions').insert([supabasePayload]).select().single();
          if (data?.id) saved.id = data.id;
        } catch (e) {}
      }
      return saved;
    },

    async deleteDayPromotion(id) {
      const list = getStored(STORAGE_KEYS.DAY_PROMOTIONS, []);
      const updated = list.filter(p => p.id !== id);
      setStored(STORAGE_KEYS.DAY_PROMOTIONS, updated);

      if (supabaseClient && isUuid(id)) {
        try {
          await supabaseClient.from('day_promotions').delete().eq('id', id);
        } catch (e) {}
      }
      return true;
    }
  };

  window.db = db;
})();

