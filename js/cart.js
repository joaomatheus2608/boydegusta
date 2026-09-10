// ========================================================
// BOYDEGUSTA - GERENCIADOR DE CARRINHO & CHECKOUT
// ========================================================

(function() {
  const CART_KEY = 'boydegusta_cart';

  const cart = {
    items: [],
    deliveryType: 'delivery', // 'delivery' | 'pickup'

    init() {
      try {
        const saved = localStorage.getItem(CART_KEY);
        this.items = saved ? JSON.parse(saved) : [];
      } catch {
        this.items = [];
      }
      this.notifyUpdate();
    },

    save() {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(this.items));
      } catch (e) {
        console.error('Erro ao persistir carrinho:', e);
      }
      this.notifyUpdate();
    },

    notifyUpdate() {
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: this }));
    },

    addItem(product, quantity = 1, optionals = [], notes = '', comboChoices = []) {
      const itemPrice = Number(product.price) || 0;
      const optionalsPrice = optionals.reduce((sum, opt) => sum + (Number(opt.price) || 0), 0);
      const unitTotal = itemPrice + optionalsPrice;
      const cartItemId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

      const cartItem = {
        cartItemId,
        id: product.id,
        name: product.name,
        image_url: product.image_url,
        price: itemPrice,
        unitTotal,
        quantity: Number(quantity) || 1,
        subtotal: unitTotal * (Number(quantity) || 1),
        optionals: optionals || [],
        notes: notes ? notes.trim() : '',
        is_combo: Boolean(product.is_promo || product.promo_id),
        combo_choices: comboChoices || []
      };

      this.items.push(cartItem);
      this.save();
      return cartItem;
    },

    removeItem(cartItemId) {
      this.items = this.items.filter(item => item.cartItemId !== cartItemId);
      this.save();
    },

    updateQuantity(cartItemId, newQty) {
      const qty = Number(newQty);
      if (qty <= 0) {
        this.removeItem(cartItemId);
        return;
      }
      const item = this.items.find(i => i.cartItemId === cartItemId);
      if (item) {
        item.quantity = qty;
        item.subtotal = item.unitTotal * qty;
        this.save();
      }
    },

    clear() {
      this.items = [];
      this.save();
    },

    getCount() {
      return this.items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    },

    getSubtotal() {
      return this.items.reduce((sum, i) => sum + (i.subtotal || 0), 0);
    },

    selectedNeighborhood: null,

    setSelectedNeighborhood(neighborhood) {
      this.selectedNeighborhood = neighborhood;
      this.notifyUpdate();
    },

    async getDeliveryFee() {
      if (this.deliveryType === 'pickup') {
        return 0;
      }
      if (this.selectedNeighborhood && this.selectedNeighborhood.delivery_fee !== undefined) {
        return Number(this.selectedNeighborhood.delivery_fee);
      }
      return 0;
    },

    async getTotal() {
      const sub = this.getSubtotal();
      const fee = await this.getDeliveryFee();
      return sub + fee;
    },

    async isMinOrderMet() {
      const settings = await window.db.getSettings();
      const min = settings ? Number(settings.min_order_value) : 10.00;
      return this.getSubtotal() >= min;
    },

    setDeliveryType(type) {
      this.deliveryType = type;
      this.notifyUpdate();
    },

    // Formata mensagem oficial do WhatsApp exatamente no padrão exigido
    formatWhatsAppMessage({
      orderNumber,
      customerName,
      customerPhone,
      orderType,
      deliveryAddress,
      paymentMethod,
      changeFor,
      generalNotes,
      subtotal,
      deliveryFee,
      total
    }) {
      const orderNumStr = String(orderNumber).padStart(4, '0');
      
      let itemsListText = '';
      this.items.forEach(item => {
        itemsListText += `${item.quantity}x ${item.name} — ${window.formatCurrency(item.unitTotal * item.quantity)}\n`;

        if (item.is_combo && item.combo_choices && item.combo_choices.length > 0) {
          item.combo_choices.forEach(choice => {
            if (choice.qty > 0) {
              itemsListText += `  • ${choice.qty}x ${choice.name}\n`;
            }
          });
        }

        if (item.optionals && item.optionals.length > 0) {
          itemsListText += `  ADICIONAIS:\n`;
          item.optionals.forEach(opt => {
            itemsListText += `  • 1x ${opt.name} — ${window.formatCurrency(opt.price)}\n`;
          });
        }

        if (item.notes) {
          itemsListText += `  OBS: ${item.notes}\n`;
        }
        itemsListText += `\n`;
      });

      let addressText = '';
      if (orderType === 'delivery' && deliveryAddress) {
        addressText = `ENDEREÇO:\n${deliveryAddress.street}, ${deliveryAddress.number}${deliveryAddress.complement ? ` - ${deliveryAddress.complement}` : ''}\nBairro: ${deliveryAddress.neighborhood}\nCidade: ${deliveryAddress.city || 'Jaboatão dos Guararapes'} - ${deliveryAddress.state || 'PE'}${deliveryAddress.reference ? `\nRef: ${deliveryAddress.reference}` : ''}\n\n`;
      }

      let paymentText = `PAGAMENTO:\n${paymentMethod === 'dinheiro' ? 'Dinheiro' : paymentMethod === 'pix' ? 'Pix' : 'Cartão'}\n`;
      if (paymentMethod === 'dinheiro' && changeFor) {
        paymentText += `Troco para:\n${window.formatCurrency(changeFor)}\n`;
      }
      paymentText += `\n`;

      let notesText = '';
      if (generalNotes && generalNotes.trim()) {
        notesText = `OBSERVAÇÃO GERAL:\n${generalNotes.trim()}\n\n`;
      }

      const message = 
`*NOVO PEDIDO — BOYDEGUSTA*
*Pedido #${orderNumStr}*
*Cliente:* ${customerName}
*Telefone:* ${customerPhone}

*ITENS:*
${itemsListText.trim()}

${notesText ? notesText : ''}*TIPO:*
${orderType === 'delivery' ? 'Entrega' : 'Retirar no local'}

${addressText ? addressText : ''}${paymentText}Subtotal: ${window.formatCurrency(subtotal)}
Entrega: ${window.formatCurrency(deliveryFee)}
*TOTAL: ${window.formatCurrency(total)}*`;

      return message;
    }
  };

  cart.init();
  window.cart = cart;
})();
