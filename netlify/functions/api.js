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
  const url = `${SUPABASE_URL}/storage/v1/object/products/${fileName}`;
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
  return `${SUPABASE_URL}/storage/v1/object/public/products/${fileName}`;
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
      let data;
      if (prod.id && /^[0-9a-f-]{36}$/i.test(prod.id)) {
        data = await supabaseFetch(`/products?id=eq.${prod.id}`, {
          method: 'PATCH', body: JSON.stringify(prod)
        });
      } else {
        const { id, ...payload } = prod;
        data = await supabaseFetch('/products', {
          method: 'POST', body: JSON.stringify(payload)
        });
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
      if (opt.id && /^[0-9a-f-]{36}$/i.test(opt.id)) {
        data = await supabaseFetch(`/optionals?id=eq.${opt.id}`, {
          method: 'PATCH', body: JSON.stringify(opt)
        });
      } else {
        const { id, ...payload } = opt;
        data = await supabaseFetch('/optionals', {
          method: 'POST', body: JSON.stringify(payload)
        });
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
      const insertedOrders = await supabaseFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      const insertedOrder = Array.isArray(insertedOrders) ? insertedOrders[0] : insertedOrders;

      if (insertedOrder?.id && items?.length > 0) {
        const orderItems = items.map(item => ({
          order_id: insertedOrder.id,
          product_id: /^[0-9a-f-]{36}$/i.test(item.id) ? item.id : null,
          product_name: item.name,
          unit_price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          subtotal: Number(item.subtotal) || ((Number(item.price) || 0) * (Number(item.quantity) || 1)),
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
