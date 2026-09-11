// ========================================================
// BOYDEGUSTA - NETLIFY FUNCTION (API SERVER-SIDE)
// Todas as chamadas ao Supabase passam por aqui.
// As credenciais NUNCA chegam ao browser.
// ========================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

function supabaseHeaders() {
  return {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

async function supabaseFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...supabaseHeaders(), ...(options.headers || {}) }
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Supabase error ${res.status}`);
  }
  return data;
}

async function supabaseRpc(funcName, params = {}) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${funcName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify(params)
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) throw new Error(data?.message || `RPC error ${res.status}`);
  return data;
}

// Upload de imagem via Supabase Storage
async function uploadToStorage(base64Data, fileName, mimeType) {
  const cleanFileName = String(fileName || '').replace(/^products\//, '').replace(/[^a-zA-Z0-9_.-]/g, '_');
  const url = `${SUPABASE_URL}/storage/v1/object/products/${cleanFileName}`;
  const buffer = Buffer.from(base64Data, 'base64');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': mimeType || 'image/jpeg',
      'x-upsert': 'true'
    },
    body: buffer
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Storage error: ${err}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/products/${cleanFileName}`;
}

const SALT = 'boydegusta_secure_salt_2026_';

async function hashPassword(pass) {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(SALT + pass).digest('hex');
}

async function hashPasswordRaw(pass) {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(pass).digest('hex');
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return respond(200, {});
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return respond(500, { error: 'Variáveis de ambiente do servidor não configuradas.' });
  }

  const method = event.httpMethod;
  const path = event.queryStringParameters?.action || '';
  let body = {};
  try { body = event.body ? JSON.parse(event.body) : {}; } catch {}

  try {
    // -------------------------------------------------------
    // GET SETTINGS
    // -------------------------------------------------------
    if (method === 'GET' && path === 'get-settings') {
      const data = await supabaseFetch('/settings?limit=1');
      return respond(200, { data: Array.isArray(data) ? data[0] : data });
    }

    // -------------------------------------------------------
    // UPDATE SETTINGS
    // -------------------------------------------------------
    if (method === 'POST' && path === 'update-settings') {
      const { id, ...fields } = body;
      fields.updated_at = new Date().toISOString();
      if (id) {
        const data = await supabaseFetch(`/settings?id=eq.${id}`, {
          method: 'PATCH',
          body: JSON.stringify(fields)
        });
        return respond(200, { data });
      } else {
        const data = await supabaseFetch('/settings', {
          method: 'POST',
          body: JSON.stringify(fields)
        });
        return respond(200, { data: Array.isArray(data) ? data[0] : data });
      }
    }

    // -------------------------------------------------------
    // ADMIN LOGIN
    // -------------------------------------------------------
    if (method === 'POST' && path === 'admin-login') {
      const { password } = body;
      if (!password) return respond(400, { error: 'Senha não informada.' });

      // Tenta via RPC primeiro
      try {
        const rpcResult = await supabaseRpc('verify_admin_password', { input_password: password });
        if (typeof rpcResult === 'boolean') {
          if (rpcResult) {
            return respond(200, { success: true });
          } else {
            return respond(401, { error: 'Senha incorreta.' });
          }
        }
      } catch {}

      // Fallback: verifica via coluna admin_password_hash na tabela settings
      const settingsData = await supabaseFetch('/settings?limit=1');
      const settings = Array.isArray(settingsData) ? settingsData[0] : settingsData;
      const storedHash = settings?.admin_password_hash;

      if (!storedHash) {
        return respond(500, { error: 'Senha admin não configurada no banco de dados.' });
      }

      const saltedHash = await hashPassword(password);
      const rawHash = await hashPasswordRaw(password);
      const storedLower = String(storedHash).trim().toLowerCase();

      const isValid = password === storedHash ||
                      rawHash.toLowerCase() === storedLower ||
                      saltedHash.toLowerCase() === storedLower;

      if (isValid) {
        return respond(200, { success: true });
      } else {
        return respond(401, { error: 'Senha incorreta.' });
      }
    }

    // -------------------------------------------------------
    // GET CATEGORIES
    // -------------------------------------------------------
    if (method === 'GET' && path === 'get-categories') {
      const data = await supabaseFetch('/categories?order=order_index');
      return respond(200, { data });
    }

    // -------------------------------------------------------
    // SAVE CATEGORY
    // -------------------------------------------------------
    if (method === 'POST' && path === 'save-category') {
      const cat = body;
      let data;
      if (cat.id && /^[0-9a-f-]{36}$/i.test(cat.id)) {
        data = await supabaseFetch(`/categories?id=eq.${cat.id}`, {
          method: 'PATCH', body: JSON.stringify(cat)
        });
      } else {
        const { id, ...payload } = cat;
        data = await supabaseFetch('/categories', {
          method: 'POST', body: JSON.stringify(payload)
        });
      }
      return respond(200, { data: Array.isArray(data) ? data[0] : data });
    }

    // -------------------------------------------------------
    // DELETE CATEGORY
    // -------------------------------------------------------
    if (method === 'DELETE' && path === 'delete-category') {
      const { id } = body;
      await supabaseFetch(`/categories?id=eq.${id}`, { method: 'DELETE' });
      return respond(200, { success: true });
    }

    // -------------------------------------------------------
    // GET PRODUCTS
    // -------------------------------------------------------
    if (method === 'GET' && path === 'get-products') {
      const data = await supabaseFetch('/products?order=order_index');
      return respond(200, { data });
    }

    // -------------------------------------------------------
    // SAVE PRODUCT
    // -------------------------------------------------------
    if (method === 'POST' && path === 'save-product') {
      const prod = body;
      const isExistingUuid = prod.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prod.id);
      
      // Valida e resolve category_id
      let categoryId = prod.category_id || null;
      if (categoryId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId)) {
        const LEGACY_MAP = {
          'cat-promo': 'promocoes-do-boy',
          'cat-acomp': 'acompanhamentos-do-boy',
          'cat-pao': 'pao-de-alho-do-boy-degusta',
          'cat-adic': 'adicional',
          'cat-burguer': 'boy-degusta-burguer',
          'cat-brasa': 'boy-degusta-na-brasa',
          'cat-beirute': 'beirute-boy-degusta',
          'cat-batata': 'batatas-boy-degusta',
          'cat-bebidas': 'bebidas-do-boy'
        };
        const targetSlug = LEGACY_MAP[categoryId] || categoryId;
        try {
          const cats = await supabaseFetch(`/categories?slug=eq.${targetSlug}&limit=1`);
          if (Array.isArray(cats) && cats[0]?.id) {
            categoryId = cats[0].id;
          } else {
            const allCats = await supabaseFetch('/categories?limit=1');
            categoryId = allCats[0]?.id || null;
          }
        } catch {
          categoryId = null;
        }
      }

      const cleanPayload = {
        name: String(prod.name || '').trim(),
        category_id: categoryId,
        description: prod.description ? String(prod.description).trim() : '',
        price: (prod.price !== null && prod.price !== undefined && prod.price !== '') ? Number(prod.price) : null,
        image_url: prod.image_url ? String(prod.image_url).trim() : null,
        is_available: prod.is_available !== false,
        is_active: prod.is_active !== false,
        is_promo: Boolean(prod.is_promo),
        promo_days: Array.isArray(prod.promo_days) ? prod.promo_days : [],
        promo_price: (prod.promo_price !== null && prod.promo_price !== undefined && prod.promo_price !== '') ? Number(prod.promo_price) : null,
        promo_label: prod.promo_label ? String(prod.promo_label).trim() : null,
        monday_price: (prod.monday_price !== null && prod.monday_price !== undefined && prod.monday_price !== '') ? Number(prod.monday_price) : null,
        order_index: Number(prod.order_index) || 0,
        updated_at: new Date().toISOString()
      };

      let data;
      try {
        if (isExistingUuid) {
          data = await supabaseFetch(`/products?id=eq.${prod.id}`, {
            method: 'PATCH', body: JSON.stringify(cleanPayload)
          });
        } else {
          data = await supabaseFetch('/products', {
            method: 'POST', body: JSON.stringify(cleanPayload)
          });
        }
      } catch (err) {
        console.warn('Falha ao salvar produto completo no Supabase, tentando campos padrão:', err.message);
        const safePayload = {
          name: cleanPayload.name,
          category_id: cleanPayload.category_id,
          description: cleanPayload.description,
          price: cleanPayload.price,
          image_url: cleanPayload.image_url,
          is_available: cleanPayload.is_available,
          is_active: cleanPayload.is_active,
          is_promo: cleanPayload.is_promo,
          order_index: cleanPayload.order_index,
          updated_at: cleanPayload.updated_at
        };
        if (isExistingUuid) {
          data = await supabaseFetch(`/products?id=eq.${prod.id}`, {
            method: 'PATCH', body: JSON.stringify(safePayload)
          });
        } else {
          data = await supabaseFetch('/products', {
            method: 'POST', body: JSON.stringify(safePayload)
          });
        }
      }
      return respond(200, { data: Array.isArray(data) ? data[0] : data });
    }

    // -------------------------------------------------------
    // DELETE PRODUCT
    // -------------------------------------------------------
    if (method === 'DELETE' && path === 'delete-product') {
      const { id } = body;
      await supabaseFetch(`/products?id=eq.${id}`, { method: 'DELETE' });
      return respond(200, { success: true });
    }

    // -------------------------------------------------------
    // GET OPTIONALS
    // -------------------------------------------------------
    if (method === 'GET' && path === 'get-optionals') {
      const data = await supabaseFetch('/optionals?order=order_index');
      return respond(200, { data });
    }

    // -------------------------------------------------------
    // SAVE OPTIONAL
    // -------------------------------------------------------
    if (method === 'POST' && path === 'save-optional') {
      const opt = body;
      let data;
      const isExistingUuid = opt.id && /^[0-9a-f-]{36}$/i.test(opt.id);

      try {
        if (isExistingUuid) {
          data = await supabaseFetch(`/optionals?id=eq.${opt.id}`, {
            method: 'PATCH', body: JSON.stringify(opt)
          });
        } else {
          const { id, ...payload } = opt;
          data = await supabaseFetch('/optionals', {
            method: 'POST', body: JSON.stringify(payload)
          });
        }
      } catch (err) {
        console.warn('Falha ao salvar adicional completo no Supabase, tentando campos padrão:', err.message);
        const safePayload = {
          name: opt.name,
          price: opt.price,
          is_active: opt.is_active !== false,
          order_index: opt.order_index || 0
        };
        if (isExistingUuid) {
          data = await supabaseFetch(`/optionals?id=eq.${opt.id}`, {
            method: 'PATCH', body: JSON.stringify(safePayload)
          });
        } else {
          data = await supabaseFetch('/optionals', {
            method: 'POST', body: JSON.stringify(safePayload)
          });
        }
      }
      return respond(200, { data: Array.isArray(data) ? data[0] : data });
    }

    // -------------------------------------------------------
    // DELETE OPTIONAL
    // -------------------------------------------------------
    if (method === 'DELETE' && path === 'delete-optional') {
      const { id } = body;
      await supabaseFetch(`/optionals?id=eq.${id}`, { method: 'DELETE' });
      return respond(200, { success: true });
    }

    // -------------------------------------------------------
    // GET PROMOTIONS
    // -------------------------------------------------------
    if (method === 'GET' && path === 'get-promotions') {
      const data = await supabaseFetch('/promotions?order=created_at.desc');
      return respond(200, { data });
    }

    // -------------------------------------------------------
    // SAVE PROMOTION
    // -------------------------------------------------------
    if (method === 'POST' && path === 'save-promotion') {
      const promo = body;
      let data;
      if (promo.id && /^[0-9a-f-]{36}$/i.test(promo.id)) {
        data = await supabaseFetch(`/promotions?id=eq.${promo.id}`, {
          method: 'PATCH', body: JSON.stringify(promo)
        });
      } else {
        const { id, ...payload } = promo;
        data = await supabaseFetch('/promotions', {
          method: 'POST', body: JSON.stringify(payload)
        });
      }
      return respond(200, { data: Array.isArray(data) ? data[0] : data });
    }

    // -------------------------------------------------------
    // DELETE PROMOTION
    // -------------------------------------------------------
    if (method === 'DELETE' && path === 'delete-promotion') {
      const { id } = body;
      await supabaseFetch(`/promotions?id=eq.${id}`, { method: 'DELETE' });
      return respond(200, { success: true });
    }

    // -------------------------------------------------------
    // GET ORDERS
    // -------------------------------------------------------
    if (method === 'GET' && path === 'get-orders') {
      const data = await supabaseFetch('/orders?select=*,order_items(*)&order=created_at.desc');
      return respond(200, { data });
    }

    // -------------------------------------------------------
    // CREATE ORDER
    // -------------------------------------------------------
    if (method === 'POST' && path === 'create-order') {
      const { items, ...orderData } = body;

      // Obtém o maior order_number atual no banco para gerar o próximo sequencial único
      try {
        const lastOrders = await supabaseFetch('/orders?select=order_number&order=order_number.desc&limit=1');
        const maxOrderNumber = (Array.isArray(lastOrders) && lastOrders[0]?.order_number) ? Number(lastOrders[0].order_number) : 0;
        orderData.order_number = maxOrderNumber + 1;
      } catch (e) {
        console.warn('Erro ao consultar maior order_number:', e);
        orderData.order_number = Number(orderData.order_number) || 1;
      }

      // Normaliza payment_method para atender ao check constraint do PostgreSQL
      if (orderData.payment_method) {
        const pm = String(orderData.payment_method).toLowerCase().trim();
        if (pm.includes('pix')) orderData.payment_method = 'pix';
        else if (pm.includes('dinheiro')) orderData.payment_method = 'dinheiro';
        else if (pm.includes('credito') || pm.includes('crédito')) orderData.payment_method = 'cartao_credito';
        else if (pm.includes('debito') || pm.includes('débito')) orderData.payment_method = 'cartao_debito';
        else if (pm.includes('cartao') || pm.includes('cartão')) orderData.payment_method = 'cartao';
        else if (pm.includes('pendente')) orderData.payment_method = 'pendente';
        else orderData.payment_method = 'pix';
      } else {
        orderData.payment_method = 'pendente';
      }

      // Normaliza order_type
      if (orderData.order_type) {
        const ot = String(orderData.order_type).toLowerCase().trim();
        if (ot === 'retirada' || ot === 'pickup') orderData.order_type = 'pickup';
        else if (ot === 'mesa') orderData.order_type = 'mesa';
        else if (ot === 'balcao' || ot === 'balcão') orderData.order_type = 'balcao';
        else orderData.order_type = 'delivery';
      } else {
        orderData.order_type = 'delivery';
      }

      // Remove id inválido para o PostgreSQL gerar UUID
      if (orderData.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderData.id)) {
        delete orderData.id;
      }

      const insertedOrders = await supabaseFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      const insertedOrder = Array.isArray(insertedOrders) ? insertedOrders[0] : insertedOrders;

      if (insertedOrder?.id && items?.length > 0) {
        const orderItems = items.map(item => ({
          order_id: insertedOrder.id,
          product_id: /^[0-9a-f-]{36}$/i.test(item.id) ? item.id : null,
          product_name: item.name || item.product_name,
          unit_price: Number(item.price || item.unit_price) || 0,
          quantity: Number(item.quantity) || 1,
          subtotal: Number(item.subtotal) || ((Number(item.price || item.unit_price) || 0) * (Number(item.quantity) || 1)),
          optionals: item.optionals || [],
          notes: item.notes || '',
          is_combo: Boolean(item.is_combo),
          combo_choices: item.combo_choices || []
        }));
        const insertedItems = await supabaseFetch('/order_items', {
          method: 'POST', body: JSON.stringify(orderItems)
        });
        insertedOrder.items = insertedItems || [];
        insertedOrder.order_items = insertedOrder.items;
      }

      return respond(200, { data: insertedOrder });
    }

    // -------------------------------------------------------
    // UPDATE ORDER STATUS
    // -------------------------------------------------------
    if (method === 'POST' && path === 'update-order') {
      const { id, status, payment_method, courier_name } = body;
      const payload = { status, updated_at: new Date().toISOString() };
      if (payment_method) payload.payment_method = payment_method;
      if (courier_name !== undefined) payload.courier_name = courier_name;
      const data = await supabaseFetch(`/orders?id=eq.${id}`, {
        method: 'PATCH', body: JSON.stringify(payload)
      });
      return respond(200, { data: Array.isArray(data) ? data[0] : data });
    }

    // -------------------------------------------------------
    // DELETE ORDERS (limpeza)
    // -------------------------------------------------------
    if (method === 'DELETE' && path === 'delete-orders') {
      const { ids } = body;
      if (ids && ids.length > 0) {
        // Deleta itens dos pedidos primeiro
        await supabaseFetch(`/order_items?order_id=in.(${ids.join(',')})`, { method: 'DELETE' });
        await supabaseFetch(`/orders?id=in.(${ids.join(',')})`, { method: 'DELETE' });
      } else {
        // Deleta todos
        await supabaseFetch('/order_items?id=neq.00000000-0000-0000-0000-000000000000', { method: 'DELETE' });
        await supabaseFetch('/orders?id=neq.00000000-0000-0000-0000-000000000000', { method: 'DELETE' });
      }
      return respond(200, { success: true });
    }

    // -------------------------------------------------------
    // GET NEIGHBORHOODS
    // -------------------------------------------------------
    if (method === 'GET' && path === 'get-neighborhoods') {
      const data = await supabaseFetch('/neighborhoods?order=name');
      return respond(200, { data });
    }

    // -------------------------------------------------------
    // SAVE NEIGHBORHOOD
    // -------------------------------------------------------
    if (method === 'POST' && path === 'save-neighborhood') {
      const n = body;
      let data;
      if (n.id && /^[0-9a-f-]{36}$/i.test(n.id)) {
        data = await supabaseFetch(`/neighborhoods?id=eq.${n.id}`, {
          method: 'PATCH', body: JSON.stringify(n)
        });
      } else {
        const { id, ...payload } = n;
        data = await supabaseFetch('/neighborhoods', {
          method: 'POST', body: JSON.stringify(payload)
        });
      }
      return respond(200, { data: Array.isArray(data) ? data[0] : data });
    }

    // -------------------------------------------------------
    // DELETE NEIGHBORHOOD
    // -------------------------------------------------------
    if (method === 'DELETE' && path === 'delete-neighborhood') {
      const { id } = body;
      await supabaseFetch(`/neighborhoods?id=eq.${id}`, { method: 'DELETE' });
      return respond(200, { success: true });
    }

    // -------------------------------------------------------
    // GET COURIERS
    // -------------------------------------------------------
    if (method === 'GET' && path === 'get-couriers') {
      const data = await supabaseFetch('/couriers?order=name');
      return respond(200, { data });
    }

    // -------------------------------------------------------
    // SAVE COURIER
    // -------------------------------------------------------
    if (method === 'POST' && path === 'save-courier') {
      const c = body;
      let data;
      if (c.id && /^[0-9a-f-]{36}$/i.test(c.id)) {
        data = await supabaseFetch(`/couriers?id=eq.${c.id}`, {
          method: 'PATCH', body: JSON.stringify(c)
        });
      } else {
        const { id, ...payload } = c;
        data = await supabaseFetch('/couriers', {
          method: 'POST', body: JSON.stringify(payload)
        });
      }
      return respond(200, { data: Array.isArray(data) ? data[0] : data });
    }

    // -------------------------------------------------------
    // DELETE COURIER
    // -------------------------------------------------------
    if (method === 'DELETE' && path === 'delete-courier') {
      const { id } = body;
      await supabaseFetch(`/couriers?id=eq.${id}`, { method: 'DELETE' });
      return respond(200, { success: true });
    }

    // -------------------------------------------------------
    // GET CASH CLOSINGS
    // -------------------------------------------------------
    if (method === 'GET' && path === 'get-cash-closings') {
      const data = await supabaseFetch('/cash_closings?order=closed_at.desc');
      return respond(200, { data });
    }

    // -------------------------------------------------------
    // SAVE CASH CLOSING
    // -------------------------------------------------------
    if (method === 'POST' && path === 'save-cash-closing') {
      const c = body;
      let data;
      if (c.id && /^[0-9a-f-]{36}$/i.test(c.id)) {
        data = await supabaseFetch(`/cash_closings?id=eq.${c.id}`, {
          method: 'PATCH', body: JSON.stringify(c)
        });
      } else {
        const { id, ...payload } = c;
        data = await supabaseFetch('/cash_closings', {
          method: 'POST', body: JSON.stringify(payload)
        });
      }
      return respond(200, { data: Array.isArray(data) ? data[0] : data });
    }

    // -------------------------------------------------------
    // GET OPERATING HOURS
    // -------------------------------------------------------
    if (method === 'GET' && path === 'get-hours') {
      const data = await supabaseFetch('/operating_hours?order=day_of_week');
      return respond(200, { data });
    }

    // -------------------------------------------------------
    // UPDATE OPERATING HOURS
    // -------------------------------------------------------
    if (method === 'POST' && path === 'update-hours') {
      const { hours } = body;
      const data = await supabaseFetch('/operating_hours', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(hours)
      });
      return respond(200, { data });
    }

    // -------------------------------------------------------
    // UPLOAD IMAGE
    // -------------------------------------------------------
    if (method === 'POST' && path === 'upload-image') {
      const { base64, fileName, mimeType } = body;
      if (!base64 || !fileName) return respond(400, { error: 'base64 e fileName são obrigatórios.' });
      const publicUrl = await uploadToStorage(base64, fileName, mimeType);
      return respond(200, { url: publicUrl });
    }

    // -------------------------------------------------------
    // GET PROFILES (users)
    // -------------------------------------------------------
    if (method === 'GET' && path === 'get-user-by-phone') {
      const { phone } = event.queryStringParameters || {};
      const data = await supabaseFetch(`/profiles?phone=eq.${phone}&limit=1`);
      return respond(200, { data: Array.isArray(data) ? data[0] : data });
    }

    if (method === 'POST' && path === 'save-user') {
      const user = body;
      let data;
      if (user.id && /^[0-9a-f-]{36}$/i.test(user.id)) {
        data = await supabaseFetch(`/profiles?id=eq.${user.id}`, {
          method: 'PATCH', body: JSON.stringify(user)
        });
      } else {
        const { id, ...payload } = user;
        data = await supabaseFetch('/profiles', {
          method: 'POST', body: JSON.stringify(payload)
        });
      }
      return respond(200, { data: Array.isArray(data) ? data[0] : data });
    }

    // -------------------------------------------------------
    // DAY PROMOTIONS
    // -------------------------------------------------------
    if (method === 'GET' && path === 'get-day-promotions') {
      const data = await supabaseFetch('/day_promotions');
      return respond(200, { data });
    }

    if (method === 'POST' && path === 'save-day-promotion') {
      const promo = body;
      let data;
      if (promo.id && /^[0-9a-f-]{36}$/i.test(promo.id)) {
        data = await supabaseFetch(`/day_promotions?id=eq.${promo.id}`, {
          method: 'PATCH', body: JSON.stringify(promo)
        });
      } else {
        const { id, ...payload } = promo;
        data = await supabaseFetch('/day_promotions', {
          method: 'POST', body: JSON.stringify(payload)
        });
      }
      return respond(200, { data: Array.isArray(data) ? data[0] : data });
    }

    if (method === 'DELETE' && path === 'delete-day-promotion') {
      const { id } = body;
      await supabaseFetch(`/day_promotions?id=eq.${id}`, { method: 'DELETE' });
      return respond(200, { success: true });
    }

    return respond(404, { error: `Ação desconhecida: ${path}` });

  } catch (err) {
    console.error('[API Error]', err);
    return respond(500, { error: err.message || 'Erro interno do servidor.' });
  }
};
