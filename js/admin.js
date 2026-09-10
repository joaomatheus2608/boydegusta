// ========================================================
// BOYDEGUSTA - CONTROLADOR DO PAINEL ADMINISTRATIVO COM PDV, MESAS, ENTREGADORES E CAIXA
// ========================================================

document.addEventListener('DOMContentLoaded', async () => {
  let adminState = {
    settings: null,
    orders: [],
    products: [],
    categories: [],
    optionals: [],
    promotions: [],
    neighborhoods: [],
    couriers: [],
    activeTab: 'pos',
    orderFilter: 'all',
    productSearch: '',
    productCategoryFilter: 'all',
    neighborhoodSearch: '',
    selectedCashDate: new Date().toISOString().split('T')[0],
    
    // Estado do PDV / Salão
    posTarget: { type: 'mesa', tableNumber: 1 },
    posCart: [],
    posActiveCategory: 'all',
    posSearch: '',
    posCustomItemState: null,
    activeTableDetailsNum: null,

    // Estado do Pedido WhatsApp
    waOrderType: 'delivery', // 'delivery' | 'pickup'
    waCart: []
  };

  const dom = {
    adminLoginModal: document.getElementById('adminLoginModal'),
    adminLoginForm: document.getElementById('adminLoginForm'),
    adminPasswordInput: document.getElementById('adminPasswordInput'),
    adminApp: document.getElementById('adminApp'),
    btnToggleStoreStatus: document.getElementById('btnToggleStoreStatus'),
    adminStoreStatusText: document.getElementById('adminStoreStatusText'),
    btnQuickOpenStore: document.getElementById('btnQuickOpenStore'),
    btnAdminLogout: document.getElementById('btnAdminLogout'),
    btnQuickPos: document.getElementById('btnQuickPos'),
    btnQuickWhatsapp: document.getElementById('btnQuickWhatsapp'),

    // Tabs
    tabButtons: document.querySelectorAll('.admin-tab-btn'),
    tabContents: document.querySelectorAll('.admin-tab-content'),

    // Salão & PDV (Tab 0)
    posFreeCount: document.getElementById('posFreeCount'),
    posBusyCount: document.getElementById('posBusyCount'),
    btnOpenBalcaoPos: document.getElementById('btnOpenBalcaoPos'),
    btnOpenWhatsappOrder: document.getElementById('btnOpenWhatsappOrder'),
    btnRefreshPos: document.getElementById('btnRefreshPos'),
    posTablesGrid: document.getElementById('posTablesGrid'),

    // Modal PDV Lançador de Pedidos
    posOrderModal: document.getElementById('posOrderModal'),
    posTargetBadge: document.getElementById('posTargetBadge'),
    btnPosModalClose: document.getElementById('btnPosModalClose'),
    posCustomerName: document.getElementById('posCustomerName'),
    posCustomerPhone: document.getElementById('posCustomerPhone'),
    posCategoryFilters: document.getElementById('posCategoryFilters'),
    posSearchProductInput: document.getElementById('posSearchProductInput'),
    posProductsCatalogGrid: document.getElementById('posProductsCatalogGrid'),
    posCartItemsList: document.getElementById('posCartItemsList'),
    btnPosClearCart: document.getElementById('btnPosClearCart'),
    posGeneralNotes: document.getElementById('posGeneralNotes'),
    posPaymentSelect: document.getElementById('posPaymentSelect'),
    posCartTotalValue: document.getElementById('posCartTotalValue'),
    btnSubmitPosOrder: document.getElementById('btnSubmitPosOrder'),

    // Modal Customização de Item PDV
    posItemCustomModal: document.getElementById('posItemCustomModal'),
    posCustomItemTitle: document.getElementById('posCustomItemTitle'),
    btnPosCustomItemClose: document.getElementById('btnPosCustomItemClose'),
    posCustomItemDescription: document.getElementById('posCustomItemDescription'),
    posCustomItemBasePrice: document.getElementById('posCustomItemBasePrice'),
    posCustomComboSection: document.getElementById('posCustomComboSection'),
    posCustomComboChoices: document.getElementById('posCustomComboChoices'),
    posCustomOptionalsSection: document.getElementById('posCustomOptionalsSection'),
    posCustomOptionalsList: document.getElementById('posCustomOptionalsList'),
    posCustomItemNotes: document.getElementById('posCustomItemNotes'),
    btnPosCustomQtyMinus: document.getElementById('btnPosCustomQtyMinus'),
    posCustomItemQty: document.getElementById('posCustomItemQty'),
    btnPosCustomQtyPlus: document.getElementById('btnPosCustomQtyPlus'),
    btnConfirmCustomItem: document.getElementById('btnConfirmCustomItem'),
    posCustomItemSubtotal: document.getElementById('posCustomItemSubtotal'),

    // Modal Extrato da Mesa
    tableDetailsModal: document.getElementById('tableDetailsModal'),
    tableDetailsTitle: document.getElementById('tableDetailsTitle'),
    tableDetailsStatusBadge: document.getElementById('tableDetailsStatusBadge'),
    btnTableDetailsClose: document.getElementById('btnTableDetailsClose'),
    tableDetailsCustomer: document.getElementById('tableDetailsCustomer'),
    tableDetailsTime: document.getElementById('tableDetailsTime'),
    tableDetailsOrdersCount: document.getElementById('tableDetailsOrdersCount'),
    tableDetailsItemsBody: document.getElementById('tableDetailsItemsBody'),
    tableDetailsGrandTotal: document.getElementById('tableDetailsGrandTotal'),
    tableClosePaymentMethod: document.getElementById('tableClosePaymentMethod'),
    tableCloseChangeGroup: document.getElementById('tableCloseChangeGroup'),
    tableCloseChangeFor: document.getElementById('tableCloseChangeFor'),
    btnTableAddMoreItems: document.getElementById('btnTableAddMoreItems'),
    btnTablePrintBill: document.getElementById('btnTablePrintBill'),
    btnTableCloseBill: document.getElementById('btnTableCloseBill'),

    // Dashboard
    statOrdersToday: document.getElementById('statOrdersToday'),
    statRevenueToday: document.getElementById('statRevenueToday'),
    statOrdersOngoing: document.getElementById('statOrdersOngoing'),
    statAverageTicket: document.getElementById('statAverageTicket'),
    topProductsList: document.getElementById('topProductsList'),

    // Pedidos
    btnRefreshOrders: document.getElementById('btnRefreshOrders'),
    orderFilterChips: document.querySelectorAll('.filter-chip'),
    ordersListContainer: document.getElementById('ordersListContainer'),

    // Despacho de Entregador
    dispatchCourierModal: document.getElementById('dispatchCourierModal'),
    dispatchModalSubtitle: document.getElementById('dispatchModalSubtitle'),
    dispatchOrderId: document.getElementById('dispatchOrderId'),
    dispatchCouriersList: document.getElementById('dispatchCouriersList'),
    btnDispatchModalClose: document.getElementById('btnDispatchModalClose'),
    btnConfirmDispatchNoCourier: document.getElementById('btnConfirmDispatchNoCourier'),

    // Produtos
    btnOpenAddProduct: document.getElementById('btnOpenAddProduct'),
    adminSearchProductInput: document.getElementById('adminSearchProductInput'),
    adminFilterCategory: document.getElementById('adminFilterCategory'),
    adminProductsTableBody: document.getElementById('adminProductsTableBody'),
    productEditModal: document.getElementById('productEditModal'),
    productEditModalTitle: document.getElementById('productEditModalTitle'),
    productEditForm: document.getElementById('productEditForm'),
    btnProductEditClose: document.getElementById('btnProductEditClose'),
    btnProductEditCancel: document.getElementById('btnProductEditCancel'),
    editProdId: document.getElementById('editProdId'),
    editProdName: document.getElementById('editProdName'),
    editProdCategory: document.getElementById('editProdCategory'),
    editProdDescription: document.getElementById('editProdDescription'),
    editProdPrice: document.getElementById('editProdPrice'),
    editProdAvailable: document.getElementById('editProdAvailable'),
    editProdImage: document.getElementById('editProdImage'),
    editProdFileInput: document.getElementById('editProdFileInput'),
    editProdImagePreviewWrap: document.getElementById('editProdImagePreviewWrap'),
    editProdImagePreview: document.getElementById('editProdImagePreview'),
    editProdFileName: document.getElementById('editProdFileName'),
    btnRemoveProdImage: document.getElementById('btnRemoveProdImage'),

    // Categorias
    btnOpenAddCategory: document.getElementById('btnOpenAddCategory'),
    adminCategoriesTableBody: document.getElementById('adminCategoriesTableBody'),
    categoryEditModal: document.getElementById('categoryEditModal'),
    categoryModalTitle: document.getElementById('categoryModalTitle'),
    categoryEditForm: document.getElementById('categoryEditForm'),
    btnCategoryModalClose: document.getElementById('btnCategoryModalClose'),
    btnCategoryModalCancel: document.getElementById('btnCategoryModalCancel'),
    editCatId: document.getElementById('editCatId'),
    editCatName: document.getElementById('editCatName'),
    editCatOrder: document.getElementById('editCatOrder'),
    editCatActive: document.getElementById('editCatActive'),

    // Promoções & Adicionais
    adminPromotionsList: document.getElementById('adminPromotionsList'),
    promotionEditModal: document.getElementById('promotionEditModal'),
    promotionModalTitle: document.getElementById('promotionModalTitle'),
    promotionEditForm: document.getElementById('promotionEditForm'),
    btnPromotionModalClose: document.getElementById('btnPromotionModalClose'),
    btnPromotionModalCancel: document.getElementById('btnPromotionModalCancel'),
    editPromoId: document.getElementById('editPromoId'),
    editPromoName: document.getElementById('editPromoName'),
    editPromoPrice: document.getElementById('editPromoPrice'),
    editPromoDescription: document.getElementById('editPromoDescription'),

    btnOpenAddOptional: document.getElementById('btnOpenAddOptional'),
    adminOptionalsTableBody: document.getElementById('adminOptionalsTableBody'),
    optionalEditModal: document.getElementById('optionalEditModal'),
    optionalModalTitle: document.getElementById('optionalModalTitle'),
    optionalEditForm: document.getElementById('optionalEditForm'),
    btnOptionalModalClose: document.getElementById('btnOptionalModalClose'),
    btnOptionalModalCancel: document.getElementById('btnOptionalModalCancel'),
    editOptId: document.getElementById('editOptId'),
    editOptName: document.getElementById('editOptName'),
    editOptPrice: document.getElementById('editOptPrice'),
    editOptActive: document.getElementById('editOptActive'),

    // Bairros & Taxas de Entrega
    btnOpenAddNeighborhood: document.getElementById('btnOpenAddNeighborhood'),
    adminSearchNeighborhoodInput: document.getElementById('adminSearchNeighborhoodInput'),
    adminNeighborhoodsTableBody: document.getElementById('adminNeighborhoodsTableBody'),
    neighborhoodEditModal: document.getElementById('neighborhoodEditModal'),
    neighborhoodModalTitle: document.getElementById('neighborhoodModalTitle'),
    neighborhoodEditForm: document.getElementById('neighborhoodEditForm'),
    btnNeighborhoodModalClose: document.getElementById('btnNeighborhoodModalClose'),
    btnNeighborhoodModalCancel: document.getElementById('btnNeighborhoodModalCancel'),
    editNeighborhoodId: document.getElementById('editNeighborhoodId'),
    editNeighborhoodName: document.getElementById('editNeighborhoodName'),
    editNeighborhoodFee: document.getElementById('editNeighborhoodFee'),
    editNeighborhoodTime: document.getElementById('editNeighborhoodTime'),
    editNeighborhoodActive: document.getElementById('editNeighborhoodActive'),

    // Fechamento de Caixa & Entregadores
    cashReportDatePicker: document.getElementById('cashReportDatePicker'),
    btnCashToday: document.getElementById('btnCashToday'),
    btnCashYesterday: document.getElementById('btnCashYesterday'),
    btnPrintDailyCash: document.getElementById('btnPrintDailyCash'),
    cashStatTotalRevenue: document.getElementById('cashStatTotalRevenue'),
    cashStatCashTotal: document.getElementById('cashStatCashTotal'),
    cashStatPixTotal: document.getElementById('cashStatPixTotal'),
    cashStatCardTotal: document.getElementById('cashStatCardTotal'),
    cashChannelMesa: document.getElementById('cashChannelMesa'),
    cashChannelBalcao: document.getElementById('cashChannelBalcao'),
    cashChannelDelivery: document.getElementById('cashChannelDelivery'),
    cashTotalDeliveryFees: document.getElementById('cashTotalDeliveryFees'),
    couriersReportContainer: document.getElementById('couriersReportContainer'),
    btnOpenManualCashClose: document.getElementById('btnOpenManualCashClose'),
    cashCurrentStatusBadge: document.getElementById('cashCurrentStatusBadge'),
    cashClosingsHistoryTableBody: document.getElementById('cashClosingsHistoryTableBody'),
    manualCashCloseModal: document.getElementById('manualCashCloseModal'),
    btnManualCashCloseModalClose: document.getElementById('btnManualCashCloseModalClose'),
    btnCancelManualCashClose: document.getElementById('btnCancelManualCashClose'),
    btnConfirmManualCashClose: document.getElementById('btnConfirmManualCashClose'),
    closeModalDate: document.getElementById('closeModalDate'),
    closeModalOrdersCount: document.getElementById('closeModalOrdersCount'),
    closeModalCashTotal: document.getElementById('closeModalCashTotal'),
    closeModalPixTotal: document.getElementById('closeModalPixTotal'),
    closeModalCardTotal: document.getElementById('closeModalCardTotal'),
    closeModalDeliveryFeesTotal: document.getElementById('closeModalDeliveryFeesTotal'),
    closeModalGrandTotal: document.getElementById('closeModalGrandTotal'),
    closeModalInitialFund: document.getElementById('closeModalInitialFund'),
    closeModalCountedCash: document.getElementById('closeModalCountedCash'),
    closeModalExpectedCash: document.getElementById('closeModalExpectedCash'),
    closeModalDiffText: document.getElementById('closeModalDiffText'),
    closeModalNotes: document.getElementById('closeModalNotes'),

    // Configurações
    adminSettingsForm: document.getElementById('adminSettingsForm'),
    settingStatusMode: document.getElementById('settingStatusMode'),
    settingClosedMessage: document.getElementById('settingClosedMessage'),
    settingMinOrder: document.getElementById('settingMinOrder'),
    settingWhatsApp: document.getElementById('settingWhatsApp'),
    settingInstagram: document.getElementById('settingInstagram'),
    settingAddress: document.getElementById('settingAddress'),
    settingPixKey: document.getElementById('settingPixKey'),

    // Pedido WhatsApp Modal
    whatsappOrderModal: document.getElementById('whatsappOrderModal'),
    btnWhatsappModalClose: document.getElementById('btnWhatsappModalClose'),
    waBtnDelivery: document.getElementById('waBtnDelivery'),
    waBtnPickup: document.getElementById('waBtnPickup'),
    waCustomerName: document.getElementById('waCustomerName'),
    waCustomerPhone: document.getElementById('waCustomerPhone'),
    waDeliveryAddressSection: document.getElementById('waDeliveryAddressSection'),
    waStreet: document.getElementById('waStreet'),
    waNumber: document.getElementById('waNumber'),
    waNeighborhoodSelect: document.getElementById('waNeighborhoodSelect'),
    waComplement: document.getElementById('waComplement'),
    waReference: document.getElementById('waReference'),
    btnWaAddItem: document.getElementById('btnWaAddItem'),
    waItemsList: document.getElementById('waItemsList'),
    waItemsEmpty: document.getElementById('waItemsEmpty'),
    waSubtotalDisplay: document.getElementById('waSubtotalDisplay'),
    waDeliveryFee: document.getElementById('waDeliveryFee'),
    waPaymentMethod: document.getElementById('waPaymentMethod'),
    waChangeGroup: document.getElementById('waChangeGroup'),
    waChangeFor: document.getElementById('waChangeFor'),
    waGeneralNotes: document.getElementById('waGeneralNotes'),
    waTotalDisplay: document.getElementById('waTotalDisplay'),
    btnSubmitWhatsappOrder: document.getElementById('btnSubmitWhatsappOrder'),
    waProductPickerModal: document.getElementById('waProductPickerModal'),
    btnWaPickerClose: document.getElementById('btnWaPickerClose'),
    waPickerSearch: document.getElementById('waPickerSearch'),
    waPickerProductsList: document.getElementById('waPickerProductsList'),

    // Navegação Mobile & Áudio
    adminSidebar: document.getElementById('adminSidebar'),
    btnToggleMobileNav: document.getElementById('btnToggleMobileNav'),
    btnCloseMobileNav: document.getElementById('btnCloseMobileNav'),
    adminMobileNavBackdrop: document.getElementById('adminMobileNavBackdrop'),
    adminMobileActiveTabLabel: document.getElementById('adminMobileActiveTabLabel'),
    btnSidebarLogout: document.getElementById('btnSidebarLogout'),
    btnToggleSound: document.getElementById('btnToggleSound'),
    soundIcon: document.getElementById('soundIcon'),
    soundText: document.getElementById('soundText')
  };

  // ==========================================
  // AUTENTICAÇÃO
  // ==========================================
  function checkAuth() {
    if (window.auth.isAdminLoggedIn()) {
      dom.adminLoginModal.style.display = 'none';
      dom.adminApp.style.display = 'flex';
      loadAdminData();
    } else {
      dom.adminLoginModal.style.display = 'flex';
      dom.adminApp.style.display = 'none';
    }
  }

  dom.adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = dom.adminPasswordInput.value.trim();
    try {
      await window.auth.loginAdmin(password);
      dom.adminPasswordInput.value = '';
      checkAuth();
    } catch (err) {
      alert(err.message || 'Senha incorreta.');
    }
  });

  const handleLogout = () => {
    window.auth.logoutAdmin();
    checkAuth();
  };

  if (dom.btnAdminLogout) dom.btnAdminLogout.addEventListener('click', handleLogout);
  if (dom.btnSidebarLogout) dom.btnSidebarLogout.addEventListener('click', handleLogout);

  // ==========================================
  // CARREGAMENTO GERAL DE DADOS
  // ==========================================
  async function loadAdminData() {
    try {
      const [settings, orders, products, categories, optionals, promotions, neighborhoods, couriers] = await Promise.all([
        window.db.getSettings(),
        window.db.getOrders(),
        window.db.getProducts(),
        window.db.getCategories(),
        window.db.getOptionals(),
        window.db.getPromotions(),
        window.db.getNeighborhoods(),
        window.db.getCouriers()
      ]);

      adminState.settings = settings;
      adminState.orders = orders;
      adminState.products = products;
      adminState.categories = categories;
      adminState.optionals = optionals;
      adminState.promotions = promotions;
      adminState.neighborhoods = neighborhoods;
      adminState.couriers = couriers;

      updateStatusIndicator();
      renderSalonTables();
      renderDashboard();
      renderOrders();
      renderProducts();
      renderCategories();
      renderOptionals();
      renderPromotions();
      renderNeighborhoods();
      renderCashReport();
      populateSettingsForm();
      populateWaNeighborhoodsSelect();
    } catch (err) {
      console.error('Erro ao carregar dados administrativos:', err);
    }
  }

  function updateStatusIndicator() {
    if (!adminState.settings) return;
    const mode = adminState.settings.store_status_mode || 'auto';
    let isOpen = false;

    if (mode === 'force_open') isOpen = true;
    else if (mode === 'force_closed') isOpen = false;
    else {
      const now = new Date();
      const mins = now.getHours() * 60 + now.getMinutes();
      isOpen = mins >= (18 * 60) && mins <= (23 * 60);
    }

    if (dom.btnToggleStoreStatus) {
      dom.btnToggleStoreStatus.className = `store-status-pill ${isOpen ? 'status-open' : 'status-closed'}`;
      dom.btnToggleStoreStatus.style.borderColor = isOpen ? '#10b981' : '#ef4444';
      
      let shortLabel = isOpen ? 'Aberto' : 'Fechado';
      let fullLabel = '';
      if (mode === 'force_open') fullLabel = 'Aberto Agora (Forçado)';
      else if (mode === 'force_closed') fullLabel = 'Fechado (Forçado)';
      else fullLabel = isOpen ? 'Aberto (18h-23h)' : 'Fechado (18h-23h)';

      dom.btnToggleStoreStatus.innerHTML = `
        <span class="status-indicator-dot"></span>
        <span class="status-text-full"><i class="fi fi-sr-circle" style="color: ${isOpen ? '#10b981' : '#ef4444'}; font-size: 0.8em;"></i> ${fullLabel}</span>
        <span class="status-text-short"><i class="fi fi-sr-circle" style="color: ${isOpen ? '#10b981' : '#ef4444'}; font-size: 0.8em;"></i> ${shortLabel}</span>
      `;
    }

    if (dom.btnQuickOpenStore) {
      if (mode === 'force_open' || isOpen) {
        dom.btnQuickOpenStore.innerHTML = '<i class="fi fi-sr-check-circle"></i> Sistema Aberto (Online)';
        dom.btnQuickOpenStore.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      } else {
        dom.btnQuickOpenStore.innerHTML = '<i class="fi fi-sr-bolt"></i> Abrir Sistema Agora (Cheguei antes das 18h)';
        dom.btnQuickOpenStore.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
      }
    }
  }

  async function openStoreImmediately() {
    try {
      const updated = await window.db.updateSettings({ store_status_mode: 'force_open' });
      adminState.settings = updated;
      updateStatusIndicator();
      populateSettingsForm();
      alert('🟢 SISTEMA ABERTO COM SUCESSO!\n\nA loja agora está ABERTA para pedidos online e no salão, mesmo antes do horário normal (18h).\n\nOs clientes já podem acessar o cardápio e finalizar pedidos!');
    } catch (err) {
      console.error('Erro ao abrir loja:', err);
      alert('Erro ao abrir o sistema. Tente novamente.');
    }
  }

  async function toggleStoreStatusModal() {
    const currentMode = adminState.settings?.store_status_mode || 'auto';
    
    if (currentMode !== 'force_open') {
      const confirmOpen = confirm('🟢 Deseja ABRIR o sistema agora para começar a receber pedidos imediatamente (mesmo antes das 18h)?');
      if (confirmOpen) {
        await openStoreImmediately();
      }
    } else {
      const opt = prompt('O sistema está ABERTO AGORA (Forçado Aberto).\n\nDigite uma opção:\n1 - Voltar para Horário Automático (18:00 às 23:00)\n2 - Fechar Sistema Agora\n0 - Cancelar / Manter Aberto', '1');
      if (opt === '1') {
        const updated = await window.db.updateSettings({ store_status_mode: 'auto' });
        adminState.settings = updated;
        updateStatusIndicator();
        populateSettingsForm();
        alert('⏱️ Sistema configurado para Horário Automático (18:00 às 23:00).');
      } else if (opt === '2') {
        const updated = await window.db.updateSettings({ store_status_mode: 'force_closed' });
        adminState.settings = updated;
        updateStatusIndicator();
        populateSettingsForm();
        alert('🔴 Sistema FECHADO agora.');
      }
    }
  }

  if (dom.btnToggleStoreStatus) {
    dom.btnToggleStoreStatus.addEventListener('click', toggleStoreStatusModal);
  }
  if (dom.btnQuickOpenStore) {
    dom.btnQuickOpenStore.addEventListener('click', async () => {
      const currentMode = adminState.settings?.store_status_mode || 'auto';
      if (currentMode === 'force_open') {
        await toggleStoreStatusModal();
      } else {
        await openStoreImmediately();
      }
    });
  }

  // ==========================================
  // 0. SALÃO & GESTÃO DE 10 MESAS + BALCÃO (PDV)
  // ==========================================
  function getActiveTableOrders(tableNum) {
    const num = Number(tableNum);
    const activeStatuses = ['novo', 'confirmado', 'em_preparo', 'pronto_para_retirada', 'saiu_para_entrega'];
    return adminState.orders.filter(o => {
      const orderTable = Number(o.table_number);
      const isMesa = o.order_type === 'mesa' || (!o.order_type && orderTable > 0) || orderTable === num;
      return isMesa && orderTable === num && activeStatuses.includes(o.status);
    });
  }

  function renderSalonTables() {
    let freeCount = 0;
    let busyCount = 0;
    let gridHtml = '';

    for (let i = 1; i <= 10; i++) {
      const activeOrders = getActiveTableOrders(i);
      const isBusy = activeOrders.length > 0;

      if (isBusy) {
        busyCount++;
        const total = activeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        
        const allItems = [];
        activeOrders.forEach(o => {
          const its = o.items || o.order_items || [];
          its.forEach(it => allItems.push(it));
        });

        const itemsSummary = allItems.slice(0, 3).map(it => `${it.quantity}x ${it.name || it.product_name}`).join(', ') + (allItems.length > 3 ? ` +${allItems.length - 3} itens` : '');
        const firstOrder = activeOrders[activeOrders.length - 1];
        const customerName = firstOrder?.customer_name && !firstOrder.customer_name.startsWith('Mesa ') ? firstOrder.customer_name : 'Cliente no Salão';
        const openTime = firstOrder?.created_at ? new Date(firstOrder.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

        gridHtml += `
          <div class="table-card busy">
            <div class="table-card-top">
              <span class="table-num"><i class="fi fi-sr-utensils"></i> Mesa 0${i}</span>
              <span class="table-status-tag busy"><i class="fi fi-sr-circle" style="font-size: 0.7em;"></i> Ocupada</span>
            </div>

            <div class="table-customer">
              <i class="fi fi-sr-user"></i> ${customerName} <span style="font-size: 0.75rem; color: #64748b; font-weight: normal;">• Desde ${openTime}</span>
            </div>

            <div class="table-amount">
              ${window.formatCurrency(total)}
            </div>

            <div class="table-items-summary">
              ${itemsSummary || 'Itens em preparo'}
            </div>

            <div class="table-card-actions">
              <button type="button" class="btn-ghost-secondary btn-table-add-more" data-table="${i}" style="color: #d97706; font-weight: 700; border-color: #fcd34d;">
                <i class="fi fi-sr-plus-small"></i> + Itens
              </button>
              <button type="button" class="btn-submit-order btn-table-view-bill" data-table="${i}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                <i class="fi fi-sr-document"></i> Comanda
              </button>
            </div>
          </div>
        `;
      } else {
        freeCount++;
        gridHtml += `
          <div class="table-card free">
            <div class="table-card-top">
              <span class="table-num"><i class="fi fi-sr-utensils"></i> Mesa 0${i}</span>
              <span class="table-status-tag free"><i class="fi fi-sr-circle" style="font-size: 0.7em;"></i> Livre</span>
            </div>

            <div style="margin: 14px 0 20px; color: #64748b; font-size: 0.84rem;">
              Pronta para receber clientes
            </div>

            <div class="table-card-actions">
              <button type="button" class="btn-submit-order btn-table-open-order" data-table="${i}">
                <i class="fi fi-sr-plus-small"></i> Abrir Pedido
              </button>
            </div>
          </div>
        `;
      }
    }

    dom.posTablesGrid.innerHTML = gridHtml;
    dom.posFreeCount.textContent = freeCount;
    dom.posBusyCount.textContent = busyCount;

    dom.posTablesGrid.querySelectorAll('.btn-table-open-order').forEach(btn => {
      btn.addEventListener('click', () => {
        const tableNum = Number(btn.getAttribute('data-table'));
        openPosOrderModal({ type: 'mesa', tableNumber: tableNum });
      });
    });

    dom.posTablesGrid.querySelectorAll('.btn-table-add-more').forEach(btn => {
      btn.addEventListener('click', () => {
        const tableNum = Number(btn.getAttribute('data-table'));
        openPosOrderModal({ type: 'mesa', tableNumber: tableNum });
      });
    });

    dom.posTablesGrid.querySelectorAll('.btn-table-view-bill').forEach(btn => {
      btn.addEventListener('click', () => {
        const tableNum = Number(btn.getAttribute('data-table'));
        openTableDetailsModal(tableNum);
      });
    });
  }

  // Abertura do PDV Móvel para Mesa ou Balcão
  function openPosOrderModal({ type = 'mesa', tableNumber = 1 }) {
    adminState.posTarget = { type, tableNumber };
    adminState.posCart = [];
    adminState.posActiveCategory = 'all';
    adminState.posSearch = '';

    dom.posSearchProductInput.value = '';
    dom.posGeneralNotes.value = '';

    if (type === 'mesa') {
      const activeOrders = getActiveTableOrders(tableNumber);
      const existingName = activeOrders.find(o => o.customer_name && !o.customer_name.startsWith('Mesa '))?.customer_name || '';
      dom.posCustomerName.value = existingName;
      dom.posCustomerPhone.value = activeOrders[0]?.customer_phone || '';
      dom.posTargetBadge.innerHTML = `<i class="fi fi-sr-utensils"></i> Mesa 0${tableNumber}`;
      dom.posTargetBadge.style.background = '#d97706';
      dom.posPaymentSelect.value = 'pendente';
      dom.btnSubmitPosOrder.innerHTML = `<i class="fi fi-sr-rocket-lunch"></i> Lançar Pedido na Mesa 0${tableNumber}`;
    } else {
      dom.posCustomerName.value = '';
      dom.posCustomerPhone.value = '';
      dom.posTargetBadge.innerHTML = '<i class="fi fi-sr-shopping-bag"></i> Balcão (Viagem)';
      dom.posTargetBadge.style.background = '#8b5cf6';
      dom.posPaymentSelect.value = 'pix';
      dom.btnSubmitPosOrder.innerHTML = '<i class="fi fi-sr-shopping-bag"></i> Concluir Pedido Balcão';
    }

    renderPosCategories();
    renderPosCatalog();
    renderPosCart();

    dom.posOrderModal.style.display = 'flex';
  }

  function renderPosCategories() {
    let html = `<button type="button" class="pos-cat-chip ${adminState.posActiveCategory === 'all' ? 'active' : ''}" data-cat="all">Todas as Opções</button>`;
    
    if (adminState.promotions && adminState.promotions.length > 0) {
      html += `<button type="button" class="pos-cat-chip ${adminState.posActiveCategory === 'promos' ? 'active' : ''}" data-cat="promos">🔥 Promoções & Combos</button>`;
    }

    adminState.categories.forEach(cat => {
      html += `<button type="button" class="pos-cat-chip ${adminState.posActiveCategory === cat.id ? 'active' : ''}" data-cat="${cat.id}">${cat.name}</button>`;
    });

    dom.posCategoryFilters.innerHTML = html;

    dom.posCategoryFilters.querySelectorAll('.pos-cat-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        adminState.posActiveCategory = btn.getAttribute('data-cat');
        renderPosCategories();
        renderPosCatalog();
      });
    });
  }

  function renderPosCatalog() {
    const query = (adminState.posSearch || '').toLowerCase().trim();
    let items = [];

    if (adminState.posActiveCategory === 'all' || adminState.posActiveCategory === 'promos') {
      (adminState.promotions || []).forEach(promo => {
        if (promo.is_active !== false) {
          items.push({
            id: promo.id,
            name: promo.name,
            description: promo.description || 'Combo Promocional',
            price: Number(promo.price) || 40,
            is_promo: true,
            required_quantity: promo.required_quantity || 3,
            allowed_items: promo.allowed_items || []
          });
        }
      });
    }

    (adminState.products || []).forEach(prod => {
      if (prod.is_active !== false && prod.is_available !== false) {
        if (adminState.posActiveCategory === 'all' || adminState.posActiveCategory === prod.category_id) {
          items.push(prod);
        }
      }
    });

    if (query) {
      items = items.filter(i => (i.name || '').toLowerCase().includes(query) || (i.description || '').toLowerCase().includes(query));
    }

    if (items.length === 0) {
      dom.posProductsCatalogGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #64748b;">
          Nenhum item encontrado nesta categoria.
        </div>
      `;
      return;
    }

    let gridHtml = '';
    items.forEach(it => {
      const priceText = it.price !== null && it.price !== undefined ? window.formatCurrency(it.price) : 'R$ 0,00';
      gridHtml += `
        <div class="pos-prod-card" data-item-id="${it.id}" data-is-promo="${it.is_promo ? 'true' : 'false'}">
          <div class="pos-prod-name">${it.is_promo ? '🔥 ' : ''}${it.name}</div>
          <div class="pos-prod-desc">${it.description || ''}</div>
          <div class="pos-prod-bottom">
            <span class="pos-prod-price">${priceText}</span>
            <button type="button" class="pos-btn-add">
              + Adicionar
            </button>
          </div>
        </div>
      `;
    });

    dom.posProductsCatalogGrid.innerHTML = gridHtml;

    dom.posProductsCatalogGrid.querySelectorAll('.pos-prod-card').forEach(card => {
      card.addEventListener('click', () => {
        const itemId = card.getAttribute('data-item-id');
        const isPromo = card.getAttribute('data-is-promo') === 'true';
        let foundItem;

        if (isPromo) {
          foundItem = adminState.promotions.find(p => p.id === itemId);
          foundItem = foundItem ? { ...foundItem, is_promo: true } : null;
        } else {
          foundItem = adminState.products.find(p => p.id === itemId);
        }

        if (foundItem) {
          openPosItemCustomModal(foundItem);
        }
      });
    });
  }

  function openPosItemCustomModal(product) {
    const isPromo = Boolean(product.is_promo);
    const basePrice = Number(product.price) || 0;

    adminState.posCustomItemState = {
      product,
      isPromo,
      basePrice,
      qty: 1,
      selectedOptionals: [],
      comboChoices: {},
      notes: ''
    };

    dom.posCustomItemTitle.textContent = `${isPromo ? '🔥 ' : ''}${product.name}`;
    dom.posCustomItemDescription.textContent = product.description || '';
    dom.posCustomItemBasePrice.textContent = window.formatCurrency(basePrice);
    dom.posCustomItemNotes.value = '';
    dom.posCustomItemQty.textContent = '1';

    if (isPromo && product.allowed_items && product.allowed_items.length > 0) {
      dom.posCustomComboSection.style.display = 'block';
      const reqQty = product.required_quantity || 3;
      let comboHtml = `<p style="font-size: 0.8rem; color: #92400e; margin-bottom: 8px;">Selecione ${reqQty} itens para este combo:</p>`;
      
      product.allowed_items.forEach(allowedName => {
        comboHtml += `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #fde68a;">
            <span style="font-size: 0.85rem; font-weight: 600;">${allowedName}</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button type="button" class="btn-qty-step btn-combo-minus" data-name="${allowedName}">-</button>
              <span class="combo-qty-count" data-name="${allowedName}" style="font-weight: 800; font-size: 0.9rem; width: 18px; text-align: center;">0</span>
              <button type="button" class="btn-qty-step btn-combo-plus" data-name="${allowedName}">+</button>
            </div>
          </div>
        `;
      });
      dom.posCustomComboChoices.innerHTML = comboHtml;

      dom.posCustomComboChoices.querySelectorAll('.btn-combo-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const name = btn.getAttribute('data-name');
          const currentTotal = Object.values(adminState.posCustomItemState.comboChoices).reduce((a, b) => a + b, 0);
          if (currentTotal < reqQty) {
            adminState.posCustomItemState.comboChoices[name] = (adminState.posCustomItemState.comboChoices[name] || 0) + 1;
            updateComboUI();
          }
        });
      });

      dom.posCustomComboChoices.querySelectorAll('.btn-combo-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const name = btn.getAttribute('data-name');
          if (adminState.posCustomItemState.comboChoices[name] > 0) {
            adminState.posCustomItemState.comboChoices[name]--;
            if (adminState.posCustomItemState.comboChoices[name] === 0) delete adminState.posCustomItemState.comboChoices[name];
            updateComboUI();
          }
        });
      });
    } else {
      dom.posCustomComboSection.style.display = 'none';
    }

    let optHtml = '';
    const activeOptionals = (adminState.optionals || []).filter(o => o.is_active !== false);
    if (activeOptionals.length > 0) {
      dom.posCustomOptionalsSection.style.display = 'block';
      activeOptionals.forEach(opt => {
        const optPrice = Number(opt.price) || 0;
        optHtml += `
          <label style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" class="pos-optional-check" data-id="${opt.id}" data-name="${opt.name}" data-price="${optPrice}" />
              <span style="font-size: 0.85rem; font-weight: 600;">${opt.name}</span>
            </div>
            <span style="font-size: 0.82rem; font-weight: 800; color: #d97706;">+ ${window.formatCurrency(optPrice)}</span>
          </label>
        `;
      });
      dom.posCustomOptionalsList.innerHTML = optHtml;

      dom.posCustomOptionalsList.querySelectorAll('.pos-optional-check').forEach(chk => {
        chk.addEventListener('change', () => {
          updateCustomSubtotal();
        });
      });
    } else {
      dom.posCustomOptionalsSection.style.display = 'none';
    }

    updateCustomSubtotal();
    dom.posItemCustomModal.style.display = 'flex';
  }

  function updateComboUI() {
    dom.posCustomComboChoices.querySelectorAll('.combo-qty-count').forEach(span => {
      const name = span.getAttribute('data-name');
      span.textContent = adminState.posCustomItemState.comboChoices[name] || 0;
    });
  }

  function updateCustomSubtotal() {
    if (!adminState.posCustomItemState) return;
    const base = adminState.posCustomItemState.basePrice;
    
    let extra = 0;
    const checkedOpts = [];
    dom.posCustomOptionalsList.querySelectorAll('.pos-optional-check:checked').forEach(chk => {
      const price = Number(chk.getAttribute('data-price')) || 0;
      const name = chk.getAttribute('data-name');
      const id = chk.getAttribute('data-id');
      extra += price;
      checkedOpts.push({ id, name, price });
    });

    adminState.posCustomItemState.selectedOptionals = checkedOpts;
    const unitTotal = base + extra;
    const grandTotal = unitTotal * adminState.posCustomItemState.qty;

    dom.posCustomItemSubtotal.textContent = window.formatCurrency(grandTotal);
  }

  dom.btnPosCustomQtyMinus.addEventListener('click', () => {
    if (adminState.posCustomItemState && adminState.posCustomItemState.qty > 1) {
      adminState.posCustomItemState.qty--;
      dom.posCustomItemQty.textContent = adminState.posCustomItemState.qty;
      updateCustomSubtotal();
    }
  });

  dom.btnPosCustomQtyPlus.addEventListener('click', () => {
    if (adminState.posCustomItemState) {
      adminState.posCustomItemState.qty++;
      dom.posCustomItemQty.textContent = adminState.posCustomItemState.qty;
      updateCustomSubtotal();
    }
  });

  dom.btnConfirmCustomItem.addEventListener('click', () => {
    if (!adminState.posCustomItemState) return;

    const { product, isPromo, basePrice, qty, selectedOptionals } = adminState.posCustomItemState;
    const notes = dom.posCustomItemNotes.value.trim();

    let comboChoicesList = [];
    if (isPromo && product.allowed_items && product.allowed_items.length > 0) {
      const reqQty = product.required_quantity || 3;
      const totalSelected = Object.values(adminState.posCustomItemState.comboChoices).reduce((a, b) => a + b, 0);
      if (totalSelected < reqQty) {
        alert(`Por favor, selecione os ${reqQty} itens do combo antes de adicionar.`);
        return;
      }
      comboChoicesList = Object.entries(adminState.posCustomItemState.comboChoices).map(([name, count]) => ({
        name,
        qty: count
      }));
    }

    const extraPrice = selectedOptionals.reduce((sum, o) => sum + o.price, 0);
    const unitPrice = basePrice + extraPrice;

    addItemToPosCart({
      id: product.id,
      name: product.name,
      price: unitPrice,
      quantity: qty,
      subtotal: unitPrice * qty,
      optionals: selectedOptionals,
      notes: notes,
      is_combo: isPromo,
      combo_choices: comboChoicesList
    });

    dom.posItemCustomModal.style.display = 'none';
  });

  dom.btnPosCustomItemClose.addEventListener('click', () => {
    dom.posItemCustomModal.style.display = 'none';
  });

  function addItemToPosCart(item) {
    const optKey = (item.optionals || []).map(o => o.name).sort().join('|');
    const comboKey = (item.combo_choices || []).map(c => `${c.qty}x${c.name}`).sort().join('|');
    const fullKey = `${item.id}_${item.notes || ''}_${optKey}_${comboKey}`;

    const existingIndex = adminState.posCart.findIndex(cartIt => {
      const cOptKey = (cartIt.optionals || []).map(o => o.name).sort().join('|');
      const cComboKey = (cartIt.combo_choices || []).map(c => `${c.qty}x${c.name}`).sort().join('|');
      const cFullKey = `${cartIt.id}_${cartIt.notes || ''}_${cOptKey}_${cComboKey}`;
      return cFullKey === fullKey;
    });

    if (existingIndex > -1) {
      adminState.posCart[existingIndex].quantity += item.quantity;
      adminState.posCart[existingIndex].subtotal = adminState.posCart[existingIndex].quantity * adminState.posCart[existingIndex].price;
    } else {
      adminState.posCart.push({ ...item });
    }

    renderPosCart();
  }

  function renderPosCart() {
    if (adminState.posCart.length === 0) {
      dom.posCartItemsList.innerHTML = `
        <div class="pos-cart-empty">
          <span>Nenhum item adicionado</span>
          <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Toque nos produtos ao lado para incluir na comanda.</p>
        </div>
      `;
      dom.posCartTotalValue.textContent = 'R$ 0,00';
      return;
    }

    let html = '';
    let total = 0;

    adminState.posCart.forEach((item, index) => {
      total += item.subtotal;
      let detailsHtml = '';

      if (item.combo_choices && item.combo_choices.length > 0) {
        detailsHtml += `<div>Combo: ${item.combo_choices.map(c => `${c.qty}x ${c.name}`).join(', ')}</div>`;
      }
      if (item.optionals && item.optionals.length > 0) {
        detailsHtml += `<div>+ ${item.optionals.map(o => o.name).join(', ')}</div>`;
      }
      if (item.notes) {
        detailsHtml += `<div style="color: #d97706;">Obs: ${item.notes}</div>`;
      }

      html += `
        <div class="pos-cart-item">
          <div class="pos-cart-item-top">
            <span class="pos-cart-item-name">${item.name}</span>
            <span class="pos-cart-item-subtotal">${window.formatCurrency(item.subtotal)}</span>
          </div>

          ${detailsHtml ? `<div class="pos-cart-item-details">${detailsHtml}</div>` : ''}

          <div class="pos-cart-item-ctrls">
            <div style="display: flex; align-items: center; gap: 8px;">
              <button type="button" class="btn-qty-step btn-pos-cart-minus" data-idx="${index}">-</button>
              <span style="font-weight: 800; font-size: 0.9rem; width: 20px; text-align: center;">${item.quantity}</span>
              <button type="button" class="btn-qty-step btn-pos-cart-plus" data-idx="${index}">+</button>
            </div>
            <button type="button" class="btn-pos-cart-remove" data-idx="${index}" style="background: none; border: none; color: #ef4444; font-size: 0.8rem; cursor: pointer;">
              🗑️ Remover
            </button>
          </div>
        </div>
      `;
    });

    dom.posCartItemsList.innerHTML = html;
    dom.posCartTotalValue.textContent = window.formatCurrency(total);

    dom.posCartItemsList.querySelectorAll('.btn-pos-cart-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        adminState.posCart[idx].quantity++;
        adminState.posCart[idx].subtotal = adminState.posCart[idx].quantity * adminState.posCart[idx].price;
        renderPosCart();
      });
    });

    dom.posCartItemsList.querySelectorAll('.btn-pos-cart-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        if (adminState.posCart[idx].quantity > 1) {
          adminState.posCart[idx].quantity--;
          adminState.posCart[idx].subtotal = adminState.posCart[idx].quantity * adminState.posCart[idx].price;
        } else {
          adminState.posCart.splice(idx, 1);
        }
        renderPosCart();
      });
    });

    dom.posCartItemsList.querySelectorAll('.btn-pos-cart-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        adminState.posCart.splice(idx, 1);
        renderPosCart();
      });
    });
  }

  dom.btnPosClearCart.addEventListener('click', () => {
    adminState.posCart = [];
    renderPosCart();
  });

  dom.posSearchProductInput.addEventListener('input', (e) => {
    adminState.posSearch = e.target.value;
    renderPosCatalog();
  });

  // Envio / Lançamento do Pedido no PDV
  dom.btnSubmitPosOrder.addEventListener('click', async () => {
    if (adminState.posCart.length === 0) {
      alert('Por favor, adicione ao menos um item ao pedido.');
      return;
    }

    const { type, tableNumber } = adminState.posTarget;
    let customerName = dom.posCustomerName.value.trim();
    const customerPhone = dom.posCustomerPhone.value.trim() || '0000000000';
    const generalNotes = dom.posGeneralNotes.value.trim();
    const paymentMethod = dom.posPaymentSelect.value;

    if (!customerName) {
      customerName = type === 'mesa' ? `Mesa 0${tableNumber}` : 'Cliente Balcão';
    }

    const subtotal = adminState.posCart.reduce((sum, it) => sum + it.subtotal, 0);

    const orderPayload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      order_type: type,
      table_number: type === 'mesa' ? tableNumber : null,
      payment_method: paymentMethod,
      subtotal: subtotal,
      delivery_fee: 0.00,
      total: subtotal,
      notes: generalNotes,
      status: 'novo',
      whatsapp_sent: false,
      items: adminState.posCart
    };

    dom.btnSubmitPosOrder.disabled = true;
    dom.btnSubmitPosOrder.textContent = '⏳ Gravando pedido...';

    try {
      await window.db.createOrder(orderPayload);
      dom.posOrderModal.style.display = 'none';
      adminState.posCart = [];
      
      adminState.orders = await window.db.getOrders();
      renderSalonTables();
      renderOrders();
      renderDashboard();
      renderCashReport();

      alert(`✅ Pedido lançado com sucesso ${type === 'mesa' ? `na Mesa 0${tableNumber}` : 'no Balcão'}!`);
    } catch (err) {
      console.error('Erro ao lançar pedido PDV:', err);
      alert('Houve um erro ao lançar o pedido. Tente novamente.');
    } finally {
      dom.btnSubmitPosOrder.disabled = false;
    }
  });

  dom.btnPosModalClose.addEventListener('click', () => {
    dom.posOrderModal.style.display = 'none';
  });

  // Modal de Detalhes da Mesa & Fechamento de Conta
  function openTableDetailsModal(tableNum) {
    adminState.activeTableDetailsNum = tableNum;
    const activeOrders = getActiveTableOrders(tableNum);

    dom.tableDetailsTitle.textContent = `Comanda — Mesa 0${tableNum}`;
    
    if (activeOrders.length === 0) {
      alert(`A Mesa 0${tableNum} está livre no momento.`);
      return;
    }

    const firstOrder = activeOrders[activeOrders.length - 1];
    const customerName = firstOrder?.customer_name && !firstOrder.customer_name.startsWith('Mesa ') ? firstOrder.customer_name : 'Cliente no Salão';
    const openTime = firstOrder?.created_at ? new Date(firstOrder.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
    
    dom.tableDetailsCustomer.textContent = customerName;
    dom.tableDetailsTime.textContent = openTime;
    dom.tableDetailsOrdersCount.textContent = `${activeOrders.length} pedido(s) / rodada(s)`;

    let itemsHtml = '';
    let grandTotal = 0;

    activeOrders.forEach((order, ordIdx) => {
      const ordTime = order.created_at ? new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
      itemsHtml += `
        <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #e2e8f0;">
          <td colspan="2" style="font-size: 0.8rem; color: #64748b;">
            Rodada #${ordIdx + 1} (Pedido #${String(order.order_number).padStart(4, '0')}) • ${ordTime} • <span class="order-type-badge mesa" style="padding: 1px 6px;">${window.escapeHtml(order.status)}</span>
          </td>
        </tr>
      `;

      const orderItems = order.items || order.order_items || [];
      orderItems.forEach(it => {
        grandTotal += Number(it.subtotal) || 0;
        let itNotes = '';
        if (it.combo_choices && it.combo_choices.length > 0) {
          itNotes += `Combos: ${it.combo_choices.map(c => `${c.qty}x ${window.escapeHtml(c.name)}`).join(', ')} `;
        }
        if (it.optionals && it.optionals.length > 0) {
          itNotes += `+ ${it.optionals.map(o => window.escapeHtml(o.name)).join(', ')} `;
        }
        if (it.notes) {
          itNotes += `Obs: ${window.escapeHtml(it.notes)}`;
        }

        itemsHtml += `
          <tr>
            <td>
              <strong>${it.quantity}x</strong> ${window.escapeHtml(it.name || it.product_name)}
              ${itNotes ? `<div style="font-size: 0.75rem; color: #64748b;">${itNotes}</div>` : ''}
            </td>
            <td style="text-align: right; font-weight: 700;">${window.formatCurrency(it.subtotal)}</td>
          </tr>
        `;
      });
    });

    dom.tableDetailsItemsBody.innerHTML = itemsHtml;
    dom.tableDetailsGrandTotal.textContent = window.formatCurrency(grandTotal);

    dom.tableDetailsModal.style.display = 'flex';
  }

  dom.btnTableDetailsClose.addEventListener('click', () => {
    dom.tableDetailsModal.style.display = 'none';
  });

  dom.btnTableAddMoreItems.addEventListener('click', () => {
    dom.tableDetailsModal.style.display = 'none';
    if (adminState.activeTableDetailsNum) {
      openPosOrderModal({ type: 'mesa', tableNumber: adminState.activeTableDetailsNum });
    }
  });

  dom.btnTablePrintBill.addEventListener('click', () => {
    if (!adminState.activeTableDetailsNum) return;
    const tableNum = adminState.activeTableDetailsNum;
    const activeOrders = getActiveTableOrders(tableNum);
    if (activeOrders.length === 0) return;

    const printWin = window.open('', '_blank', 'width=400,height=600');
    let itemsRowsStr = '';
    let total = 0;

    activeOrders.forEach(o => {
      const orderItems = o.items || o.order_items || [];
      orderItems.forEach(it => {
        total += Number(it.subtotal) || 0;
        itemsRowsStr += `<div>${it.quantity}x ${window.escapeHtml(it.name || it.product_name)} - ${window.formatCurrency(it.subtotal)}</div>`;
        if (it.optionals && it.optionals.length > 0) {
          itemsRowsStr += `<div style="font-size: 11px; padding-left: 8px;">+ ${it.optionals.map(op => window.escapeHtml(op.name)).join(', ')}</div>`;
        }
      });
    });

    printWin.document.write(`
      <html>
        <head>
          <title>Prévia da Conta - Mesa ${tableNum}</title>
          <style>
            body { font-family: monospace; font-size: 13px; padding: 12px; }
            h2, h3 { margin: 4px 0; text-align: center; }
            hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
          </style>
        </head>
        <body>
          <h2>BOYDEGUSTA</h2>
          <h3>PRÉVIA DE CONTA — MESA 0${tableNum}</h3>
          <div>${new Date().toLocaleString('pt-BR')}</div>
          <hr />
          ${itemsRowsStr}
          <hr />
          <div style="font-size: 16px; font-weight: bold; text-align: right;">TOTAL: ${window.formatCurrency(total)}</div>
          <div style="text-align: center; margin-top: 16px; font-size: 11px;">Obrigado pela preferência!</div>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    printWin.print();
  });

  dom.btnTableCloseBill.addEventListener('click', async () => {
    if (!adminState.activeTableDetailsNum) return;
    const tableNum = adminState.activeTableDetailsNum;
    const payment = dom.tableClosePaymentMethod.value;
    
    if (confirm(`Deseja confirmar o fechamento da conta da Mesa 0${tableNum} com pagamento em ${payment.toUpperCase()} e liberar a mesa?`)) {
      dom.btnTableCloseBill.disabled = true;
      dom.btnTableCloseBill.textContent = 'Fechando mesa...';

      try {
        await window.db.closeTable(tableNum, payment);
        dom.tableDetailsModal.style.display = 'none';
        adminState.orders = await window.db.getOrders();
        renderSalonTables();
        renderOrders();
        renderDashboard();
        renderCashReport();
        alert(`✅ Mesa 0${tableNum} finalizada e liberada com sucesso!`);
      } catch (err) {
        console.error('Erro ao fechar mesa:', err);
        alert('Erro ao fechar a mesa. Tente novamente.');
      } finally {
        dom.btnTableCloseBill.disabled = false;
        dom.btnTableCloseBill.textContent = '✅ Receber e Liberar Mesa';
      }
    }
  });

  dom.btnOpenBalcaoPos.addEventListener('click', () => {
    openPosOrderModal({ type: 'balcao' });
  });

  dom.btnQuickPos.addEventListener('click', () => {
    openPosOrderModal({ type: 'balcao' });
  });

  dom.btnRefreshPos.addEventListener('click', async () => {
    adminState.orders = await window.db.getOrders();
    renderSalonTables();
    renderOrders();
  });

  // ==========================================
  // 1. DASHBOARD & MÉTRICAS
  // ==========================================
  function renderDashboard() {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = adminState.orders.filter(o => (o.created_at || '').startsWith(todayStr));
    
    const todayRevenue = todayOrders
      .filter(o => o.status !== 'cancelado')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const ongoingStatuses = ['novo', 'confirmado', 'em_preparo', 'saiu_para_entrega', 'pronto_para_retirada'];
    const ongoingOrders = adminState.orders.filter(o => ongoingStatuses.includes(o.status));

    const validOrdersCount = todayOrders.filter(o => o.status !== 'cancelado').length;
    const avgTicket = validOrdersCount > 0 ? (todayRevenue / validOrdersCount) : 0;

    dom.statOrdersToday.textContent = todayOrders.length;
    dom.statRevenueToday.textContent = window.formatCurrency(todayRevenue);
    dom.statOrdersOngoing.textContent = ongoingOrders.length;
    dom.statAverageTicket.textContent = window.formatCurrency(avgTicket);

    const productCounts = {};
    adminState.orders.forEach(order => {
      if (order.status !== 'cancelado') {
        const orderItems = order.items || order.order_items || [];
        orderItems.forEach(item => {
          const name = item.name || item.product_name || 'Produto';
          productCounts[name] = (productCounts[name] || 0) + (item.quantity || 1);
        });
      }
    });

    const sortedProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (sortedProducts.length === 0) {
      dom.topProductsList.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted);">Nenhum pedido finalizado ainda.</p>';
    } else {
      let topHtml = '<div style="display: flex; flex-direction: column; gap: 8px;">';
      sortedProducts.forEach(([name, count], index) => {
        topHtml += `
          <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 0.9rem; font-weight: 700; color: #fff;">
              <span style="color: var(--primary-yellow); margin-right: 8px;">#${index + 1}</span> ${name}
            </div>
            <div style="font-size: 0.85rem; font-weight: 800; color: var(--primary-yellow); background: var(--bg-card); padding: 4px 10px; border-radius: var(--radius-full);">
              ${count} vendidos
            </div>
          </div>
        `;
      });
      topHtml += '</div>';
      dom.topProductsList.innerHTML = topHtml;
    }
  }

  // ==========================================
  // 2. GERENCIAMENTO DE PEDIDOS EM TEMPO REAL & DESPACHO
  // ==========================================
  function renderOrders() {
    let list = adminState.orders;
    if (adminState.orderFilter !== 'all') {
      list = list.filter(o => o.status === adminState.orderFilter);
    }

    if (list.length === 0) {
      dom.ordersListContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <h3>Nenhum pedido encontrado</h3>
        </div>
      `;
      return;
    }

    let html = '';
    list.forEach(order => {
      const orderNum = String(order.order_number || 1).padStart(4, '0');
      const dateStr = order.created_at ? new Date(order.created_at).toLocaleString('pt-BR') : '';

      let itemsRows = '';
      const orderItems = order.items || order.order_items || [];
      if (orderItems.length > 0) {
        orderItems.forEach(item => {
          let customNotes = '';
          if (item.combo_choices && item.combo_choices.length > 0) {
            customNotes += `<div>Combos: ${item.combo_choices.map(c => `${c.qty}x ${window.escapeHtml(c.name)}`).join(', ')}</div>`;
          }
          if (item.optionals && item.optionals.length > 0) {
            customNotes += `<div>Adicionais: ${item.optionals.map(o => window.escapeHtml(o.name)).join(', ')}</div>`;
          }
          if (item.notes) {
            customNotes += `<div>Obs: ${window.escapeHtml(item.notes)}</div>`;
          }

          itemsRows += `
            <tr>
              <td><strong>${item.quantity}x</strong> ${window.escapeHtml(item.name || item.product_name)} ${customNotes ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${customNotes}</div>` : ''}</td>
              <td style="text-align: right;">${window.formatCurrency(item.subtotal || (item.unit_price * item.quantity) || (item.price * item.quantity))}</td>
            </tr>
          `;
        });
      }

      let typeBadge = '';
      let addressDisplay = '';

      if (order.order_type === 'mesa' || order.table_number) {
        typeBadge = `<span class="order-type-badge mesa"><i class="fi fi-sr-utensils"></i> Mesa 0${order.table_number || '?'}</span>`;
        addressDisplay = `Consumo no Local (Mesa 0${order.table_number || '?'})`;
      } else if (order.order_type === 'balcao') {
        typeBadge = `<span class="order-type-badge balcao"><i class="fi fi-sr-shopping-bag"></i> Balcão (Viagem)</span>`;
        addressDisplay = 'Retirada no Balcão';
      } else if (order.order_type === 'delivery') {
        typeBadge = `<span class="order-type-badge delivery"><i class="fi fi-sr-motorcycle"></i> Delivery</span>`;
        if (order.delivery_address) {
          const a = order.delivery_address;
          addressDisplay = `${window.escapeHtml(a.street || '')}, ${window.escapeHtml(String(a.number || ''))}${a.complement ? ` - ${window.escapeHtml(a.complement)}` : ''}, ${window.escapeHtml(a.neighborhood || '')} (Ref: ${window.escapeHtml(a.reference || 'Nenhuma')})`;
        }
      } else {
        typeBadge = `<span class="order-type-badge pickup"><i class="fi fi-sr-shop"></i> Retirada</span>`;
        addressDisplay = 'Retirada no Restaurante';
      }

      const cleanPhone = (order.customer_phone || '').replace(/\D/g, '');

      html += `
        <div class="order-admin-card status-${order.status}" id="order-card-${order.id}">
          <div class="order-card-top">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span class="order-number-title">Pedido #${orderNum}</span>
              ${typeBadge}
              ${order.courier_name ? `<span class="order-type-badge courier btn-change-courier" data-order-id="${order.id}" style="cursor: pointer;" title="Clique para alterar entregador"><i class="fi fi-sr-motorcycle"></i> Entregador: <strong>${window.escapeHtml(order.courier_name)}</strong> <i class="fi fi-sr-pencil"></i></span>` : ''}
              <span style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</span>
            </div>
            
            <div>
              <select class="status-dropdown order-status-select" data-order-id="${order.id}">
                <option value="novo" ${order.status === 'novo' ? 'selected' : ''}>Novo</option>
                <option value="confirmado" ${order.status === 'confirmado' ? 'selected' : ''}>Confirmado</option>
                <option value="em_preparo" ${order.status === 'em_preparo' ? 'selected' : ''}>Em Preparo</option>
                <option value="saiu_para_entrega" ${order.status === 'saiu_para_entrega' ? 'selected' : ''}>Saiu p/ Entrega</option>
                <option value="pronto_para_retirada" ${order.status === 'pronto_para_retirada' ? 'selected' : ''}>Pronto / Servir</option>
                <option value="finalizado" ${order.status === 'finalizado' ? 'selected' : ''}>Finalizado</option>
                <option value="cancelado" ${order.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
              </select>
            </div>
          </div>

          <div class="order-customer-info">
            <strong>Cliente:</strong> ${window.escapeHtml(order.customer_name || 'Cliente')} • <strong>WhatsApp:</strong> ${window.escapeHtml(order.customer_phone || 'Não informado')}<br />
            <strong>Local / Endereço:</strong> ${addressDisplay}<br />
            <strong>Pagamento:</strong> ${window.escapeHtml(order.payment_method || '')} ${order.change_for ? `(Troco para: ${window.formatCurrency(order.change_for)})` : ''}
            ${order.notes ? `<br /><strong>Obs Geral:</strong> <span style="color: #d97706; font-weight: 700;">${window.escapeHtml(order.notes)}</span>` : ''}
          </div>

          <table class="order-items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="order-actions-bar">
            <div style="font-size: 0.95rem; font-weight: 800;">
              Total: <span style="color: #d97706;">${window.formatCurrency(order.total)}</span>
              <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500;">(Sub: ${window.formatCurrency(order.subtotal)} + Taxa: ${window.formatCurrency(order.delivery_fee)})</span>
            </div>

            <div style="display: flex; gap: 8px;">
              ${order.order_type === 'delivery' && order.status !== 'finalizado' && order.status !== 'cancelado' ? `
                <button type="button" class="btn-ghost-secondary btn-assign-courier-action" data-order-id="${order.id}" style="font-size: 0.8rem; border-color: #3b82f6; color: #2563eb;">
                  <i class="fi fi-sr-motorcycle"></i> ${order.courier_name ? `Trocar (${window.escapeHtml(order.courier_name)})` : 'Atribuir Entregador'}
                </button>
              ` : ''}

              ${cleanPhone && cleanPhone !== '0000000000' ? `
                <a href="https://wa.me/55${cleanPhone}" target="_blank" class="btn-ghost-secondary" style="font-size: 0.8rem; background: #25d366; color: #fff;">
                  <i class="fi fi-brands-whatsapp"></i> WhatsApp
                </a>
              ` : ''}
              <button class="btn-ghost-secondary btn-print-order" data-order-id="${order.id}" style="font-size: 0.8rem;">
                <i class="fi fi-sr-print"></i> Imprimir
              </button>
            </div>
          </div>
        </div>
      `;
    });

    dom.ordersListContainer.innerHTML = html;

    dom.ordersListContainer.querySelectorAll('.order-status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const orderId = select.getAttribute('data-order-id');
        const newStatus = e.target.value;
        const order = adminState.orders.find(o => o.id === orderId);

        // Se mudou para saiu_para_entrega e for delivery, abre modal de escolha do entregador
        if (newStatus === 'saiu_para_entrega' && order && order.order_type === 'delivery') {
          openDispatchCourierModal(orderId);
          return;
        }

        await window.db.updateOrderStatus(orderId, newStatus);
        if (order) order.status = newStatus;
        renderSalonTables();
        renderDashboard();
        renderOrders();
        renderCashReport();
      });
    });

    dom.ordersListContainer.querySelectorAll('.btn-assign-courier-action, .btn-change-courier').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-order-id');
        openDispatchCourierModal(orderId);
      });
    });

    dom.ordersListContainer.querySelectorAll('.btn-print-order').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-order-id');
        const order = adminState.orders.find(o => o.id === orderId);
        if (order) printOrderTicket(order);
      });
    });
  }

  // Modal de Despacho de Entregador
  function openDispatchCourierModal(orderId) {
    const order = adminState.orders.find(o => o.id === orderId);
    if (!order) return;

    dom.dispatchOrderId.value = orderId;
    dom.dispatchModalSubtitle.textContent = `Pedido #${String(order.order_number).padStart(4, '0')} — ${order.customer_name} (${order.delivery_address?.neighborhood || 'Delivery'})`;

    let couriersHtml = '';
    const couriers = adminState.couriers || [];
    couriers.forEach(c => {
      if (c.is_active !== false) {
        const isCurrent = order.courier_name === c.name;
        couriersHtml += `
          <div class="courier-pick-btn ${isCurrent ? 'selected' : ''}" data-courier-name="${window.escapeHtml(c.name)}">
            <span style="font-size: 1.8rem;">🛵</span>
            <span class="name">${window.escapeHtml(c.name)}</span>
            <span style="font-size: 0.75rem; color: ${isCurrent ? '#166534' : '#64748b'};">${isCurrent ? '● Atribuído' : 'Selecionar'}</span>
          </div>
        `;
      }
    });

    dom.dispatchCouriersList.innerHTML = couriersHtml;

    dom.dispatchCouriersList.querySelectorAll('.courier-pick-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const courierName = btn.getAttribute('data-courier-name');
        await window.db.updateOrderStatus(orderId, 'saiu_para_entrega', null, courierName);
        order.status = 'saiu_para_entrega';
        order.courier_name = courierName;
        
        dom.dispatchCourierModal.style.display = 'none';
        renderOrders();
        renderCashReport();
        renderDashboard();
      });
    });

    dom.dispatchCourierModal.style.display = 'flex';
  }

  dom.btnDispatchModalClose.addEventListener('click', () => {
    dom.dispatchCourierModal.style.display = 'none';
  });

  dom.btnConfirmDispatchNoCourier.addEventListener('click', async () => {
    const orderId = dom.dispatchOrderId.value;
    const order = adminState.orders.find(o => o.id === orderId);
    if (order) {
      await window.db.updateOrderStatus(orderId, 'saiu_para_entrega');
      order.status = 'saiu_para_entrega';
      dom.dispatchCourierModal.style.display = 'none';
      renderOrders();
      renderCashReport();
    }
  });

  function printOrderTicket(order) {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    let itemsStr = '';
    const orderItems = order.items || order.order_items || [];
    orderItems.forEach(i => {
      itemsStr += `<div>${i.quantity}x ${window.escapeHtml(i.name || i.product_name)} - ${window.formatCurrency(i.subtotal)}</div>`;
      if (i.combo_choices && i.combo_choices.length > 0) {
        itemsStr += `<div style="font-size: 11px; padding-left: 10px;">${i.combo_choices.map(c => `${c.qty}x ${window.escapeHtml(c.name)}`).join(', ')}</div>`;
      }
      if (i.optionals && i.optionals.length > 0) {
        itemsStr += `<div style="font-size: 11px; padding-left: 10px;">${i.optionals.map(o => window.escapeHtml(o.name)).join(', ')}</div>`;
      }
      if (i.notes) {
        itemsStr += `<div style="font-size: 11px; padding-left: 10px; font-weight: bold;">Obs: ${window.escapeHtml(i.notes)}</div>`;
      }
    });

    let typeStr = 'RETIRADA';
    if (order.order_type === 'mesa' || order.table_number) {
      typeStr = `MESA 0${order.table_number || '?'}`;
    } else if (order.order_type === 'balcao') {
      typeStr = 'BALCÃO / VIAGEM';
    } else if (order.order_type === 'delivery') {
      typeStr = 'DELIVERY / ENTREGA';
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Cupom Pedido #${order.order_number}</title>
          <style>
            body { font-family: monospace; font-size: 13px; padding: 10px; color: #000; }
            h2, h3 { margin: 4px 0; text-align: center; }
            hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
          </style>
        </head>
        <body>
          <h2>BOYDEGUSTA</h2>
          <h3>PEDIDO #${String(order.order_number).padStart(4, '0')}</h3>
          <div style="text-align: center; font-weight: bold; font-size: 15px; margin: 4px 0;">[ ${typeStr} ]</div>
          <div style="text-align: center;">${new Date(order.created_at).toLocaleString('pt-BR')}</div>
          ${order.courier_name ? `<div style="text-align: center; font-weight: bold; margin-top: 4px; background: #eee; padding: 2px;">🛵 ENTREGADOR: ${window.escapeHtml(order.courier_name.toUpperCase())}</div>` : ''}
          <hr />
          <div><strong>Cliente:</strong> ${window.escapeHtml(order.customer_name || 'Cliente')}</div>
          <div><strong>Telefone:</strong> ${window.escapeHtml(order.customer_phone || 'Não informado')}</div>
          ${order.delivery_address ? `<div><strong>Endereço:</strong> ${window.escapeHtml(order.delivery_address.street || '')}, ${window.escapeHtml(String(order.delivery_address.number || ''))} - ${window.escapeHtml(order.delivery_address.neighborhood || '')}</div>` : ''}
          <div><strong>Pagamento:</strong> ${window.escapeHtml(order.payment_method || '')} ${order.change_for ? `(Troco: ${window.formatCurrency(order.change_for)})` : ''}</div>
          ${order.notes ? `<div><strong>Obs Geral:</strong> ${window.escapeHtml(order.notes)}</div>` : ''}
          <hr />
          ${itemsStr}
          <hr />
          <div>Subtotal: ${window.formatCurrency(order.subtotal)}</div>
          <div>Taxa Entrega: ${window.formatCurrency(order.delivery_fee)}</div>
          <div style="font-size: 16px; font-weight: bold;">TOTAL: ${window.formatCurrency(order.total)}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  // ==========================================
  // 3. GERENCIAMENTO DE PRODUTOS
  // ==========================================
  function renderProducts() {
    let list = adminState.products;
    const query = adminState.productSearch.toLowerCase();
    const catFilter = adminState.productCategoryFilter;

    if (query) {
      list = list.filter(p => (p.name || '').toLowerCase().includes(query) || (p.description || '').toLowerCase().includes(query));
    }
    if (catFilter !== 'all') {
      list = list.filter(p => p.category_id === catFilter);
    }

    let catOptions = '<option value="all">Todas as categorias</option>';
    adminState.categories.forEach(c => {
      catOptions += `<option value="${c.id}" ${c.id === catFilter ? 'selected' : ''}>${c.name}</option>`;
    });
    dom.adminFilterCategory.innerHTML = catOptions;

    let rowsHtml = '';
    list.forEach(p => {
      const cat = adminState.categories.find(c => c.id === p.category_id);
      const catName = cat ? window.escapeHtml(cat.name) : 'Sem categoria';
      const formattedPrice = p.price !== null && p.price !== undefined ? window.formatCurrency(p.price) : '<span style="color: var(--text-muted); font-style: italic;">A definir</span>';
      const isAvail = p.is_available !== false;
      const isAct = p.is_active !== false;

      rowsHtml += `
        <tr>
          <td>
            <img class="table-img-thumb" src="${p.image_url || 'boylogo.jpg'}" alt="${window.escapeHtml(p.name)}" />
          </td>
          <td>
            <strong>${window.escapeHtml(p.name)}</strong>
            <div style="font-size: 0.75rem; color: #64748b; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${window.escapeHtml(p.description || 'Sem descrição')}
            </div>
          </td>
          <td>${catName}</td>
          <td><strong>${formattedPrice}</strong></td>
          <td>
            <span class="product-status-pill ${isAct ? 'status-active' : 'status-inactive'}">
              ${isAct ? 'Ativo' : 'Oculto'}
            </span>
          </td>
          <td>
            <button class="btn-ghost-secondary btn-toggle-avail" data-prod-id="${p.id}" style="font-size: 0.78rem; padding: 4px 8px;">
              ${isAvail ? '<i class="fi fi-sr-check-circle" style="color: #10b981;"></i> Disponível' : '<i class="fi fi-sr-cross-circle" style="color: #ef4444;"></i> Esgotado'}
            </button>
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn-ghost-secondary btn-edit-product" data-prod-id="${p.id}" style="font-size: 0.78rem;">
                <i class="fi fi-sr-pencil"></i> Editar
              </button>
              <button class="btn-ghost-secondary btn-delete-product" data-prod-id="${p.id}" style="font-size: 0.78rem; color: var(--primary-red);" title="Excluir Produto">
                <i class="fi fi-sr-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    dom.adminProductsTableBody.innerHTML = rowsHtml;

    dom.adminProductsTableBody.querySelectorAll('.btn-toggle-avail').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-prod-id');
        const prod = adminState.products.find(p => p.id === id);
        if (prod) {
          prod.is_available = !prod.is_available;
          await window.db.saveProduct(prod);
          renderProducts();
        }
      });
    });

    dom.adminProductsTableBody.querySelectorAll('.btn-edit-product').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-prod-id');
        openProductModal(id);
      });
    });

    dom.adminProductsTableBody.querySelectorAll('.btn-delete-product').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-prod-id');
        if (confirm('Tem certeza que deseja excluir este produto?')) {
          await window.db.deleteProduct(id);
          adminState.products = adminState.products.filter(p => p.id !== id);
          renderProducts();
        }
      });
    });
  }

  function compressImageFile(file, maxWidth = 500, maxHeight = 500, quality = 0.75) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
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

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Erro ao ler a imagem.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Erro ao carregar o arquivo.'));
      reader.readAsDataURL(file);
    });
  }

  function openProductModal(productId = null) {
    let catOptions = '';
    adminState.categories.forEach(c => {
      catOptions += `<option value="${c.id}">${window.escapeHtml(c.name)}</option>`;
    });
    dom.editProdCategory.innerHTML = catOptions;

    if (dom.editProdFileInput) dom.editProdFileInput.value = '';

    if (productId) {
      const prod = adminState.products.find(p => p.id === productId);
      if (!prod) return;
      dom.productEditModalTitle.textContent = 'Editar Produto';
      dom.editProdId.value = prod.id;
      dom.editProdName.value = prod.name;
      dom.editProdCategory.value = prod.category_id || '';
      dom.editProdDescription.value = prod.description || '';
      dom.editProdPrice.value = prod.price !== null && prod.price !== undefined ? prod.price : '';
      dom.editProdAvailable.value = String(prod.is_available !== false);
      dom.editProdImage.value = prod.image_url || '';

      if (prod.image_url && dom.editProdImagePreviewWrap) {
        dom.editProdImagePreview.src = prod.image_url;
        dom.editProdFileName.textContent = 'Imagem atual cadastrada';
        dom.editProdImagePreviewWrap.style.display = 'flex';
      } else if (dom.editProdImagePreviewWrap) {
        dom.editProdImagePreviewWrap.style.display = 'none';
      }
    } else {
      dom.productEditModalTitle.textContent = 'Novo Produto';
      dom.editProdId.value = '';
      dom.editProdName.value = '';
      dom.editProdCategory.value = adminState.categories[0]?.id || '';
      dom.editProdDescription.value = '';
      dom.editProdPrice.value = '';
      dom.editProdAvailable.value = 'true';
      dom.editProdImage.value = '';
      if (dom.editProdImagePreviewWrap) dom.editProdImagePreviewWrap.style.display = 'none';
    }
    dom.productEditModal.style.display = 'flex';
  }

  if (dom.editProdFileInput) {
    dom.editProdFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          if (dom.editProdFileName) dom.editProdFileName.textContent = 'Enviando imagem...';
          
          let uploadedUrl = null;
          if (window.db && window.db.uploadImage) {
            uploadedUrl = await window.db.uploadImage(file);
          }

          if (uploadedUrl) {
            dom.editProdImage.value = uploadedUrl;
            if (dom.editProdImagePreview) dom.editProdImagePreview.src = uploadedUrl;
            if (dom.editProdFileName) dom.editProdFileName.textContent = `${file.name} (Nuvem)`;
            if (dom.editProdImagePreviewWrap) dom.editProdImagePreviewWrap.style.display = 'flex';
          } else {
            const compressedDataUrl = await compressImageFile(file, 400, 400, 0.7);
            dom.editProdImage.value = compressedDataUrl;
            if (dom.editProdImagePreview) dom.editProdImagePreview.src = compressedDataUrl;
            if (dom.editProdFileName) dom.editProdFileName.textContent = file.name;
            if (dom.editProdImagePreviewWrap) dom.editProdImagePreviewWrap.style.display = 'flex';
          }
        } catch (err) {
          console.error('Erro ao processar imagem:', err);
          alert('Erro ao carregar a imagem. Tente escolher outra foto.');
        }
      }
    });
  }

  if (dom.btnRemoveProdImage) {
    dom.btnRemoveProdImage.addEventListener('click', () => {
      dom.editProdImage.value = '';
      if (dom.editProdFileInput) dom.editProdFileInput.value = '';
      if (dom.editProdImagePreviewWrap) dom.editProdImagePreviewWrap.style.display = 'none';
    });
  }

  dom.btnOpenAddProduct.addEventListener('click', () => openProductModal(null));
  dom.btnProductEditClose.addEventListener('click', () => dom.productEditModal.style.display = 'none');
  dom.btnProductEditCancel.addEventListener('click', () => dom.productEditModal.style.display = 'none');

  dom.productEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = dom.editProdId.value;
    const rawPrice = dom.editProdPrice.value.trim();

    const payload = {
      name: dom.editProdName.value.trim(),
      category_id: dom.editProdCategory.value,
      description: dom.editProdDescription.value.trim(),
      price: rawPrice ? Number(rawPrice) : null,
      is_available: dom.editProdAvailable.value === 'true',
      image_url: dom.editProdImage.value.trim() || null
    };
    if (id) payload.id = id;

    const saved = await window.db.saveProduct(payload);
    if (id) {
      adminState.products = adminState.products.map(p => p.id === id ? saved : p);
    } else {
      adminState.products.push(saved);
    }

    dom.productEditModal.style.display = 'none';
    renderProducts();
  });

  // ==========================================
  // 4. GERENCIAMENTO DE CATEGORIAS
  // ==========================================
  function renderCategories() {
    let html = '';
    adminState.categories.forEach(c => {
      html += `
        <tr>
          <td>${c.order_index || 0}</td>
          <td><strong>${window.escapeHtml(c.name)}</strong></td>
          <td><code style="color: #64748b;">${window.escapeHtml(c.slug || '')}</code></td>
          <td>
            <span class="product-status-pill ${c.is_active !== false ? 'status-active' : 'status-inactive'}">
              ${c.is_active !== false ? 'Ativa' : 'Inativa'}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn-ghost-secondary btn-edit-cat" data-cat-id="${c.id}" style="font-size: 0.78rem;">
                <i class="fi fi-sr-pencil"></i> Editar
              </button>
              <button class="btn-ghost-secondary btn-delete-cat" data-cat-id="${c.id}" style="font-size: 0.78rem; color: var(--primary-red);" title="Excluir Categoria">
                <i class="fi fi-sr-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    dom.adminCategoriesTableBody.innerHTML = html;

    dom.adminCategoriesTableBody.querySelectorAll('.btn-edit-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-cat-id');
        openCategoryModal(id);
      });
    });

    dom.adminCategoriesTableBody.querySelectorAll('.btn-delete-cat').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-cat-id');
        if (confirm('Tem certeza que deseja excluir esta categoria?')) {
          await window.db.deleteCategory(id);
          adminState.categories = adminState.categories.filter(c => c.id !== id);
          renderCategories();
          renderProducts();
        }
      });
    });
  }

  function openCategoryModal(catId = null) {
    if (catId) {
      const cat = adminState.categories.find(c => c.id === catId);
      if (!cat) return;
      dom.categoryModalTitle.textContent = 'Editar Categoria';
      dom.editCatId.value = cat.id;
      dom.editCatName.value = cat.name || '';
      dom.editCatOrder.value = cat.order_index !== undefined ? cat.order_index : 0;
      dom.editCatActive.value = String(cat.is_active !== false);
    } else {
      dom.categoryModalTitle.textContent = 'Nova Categoria';
      dom.editCatId.value = '';
      dom.editCatName.value = '';
      dom.editCatOrder.value = adminState.categories.length + 1;
      dom.editCatActive.value = 'true';
    }
    dom.categoryEditModal.style.display = 'flex';
  }

  if (dom.btnCategoryModalClose) dom.btnCategoryModalClose.addEventListener('click', () => dom.categoryEditModal.style.display = 'none');
  if (dom.btnCategoryModalCancel) dom.btnCategoryModalCancel.addEventListener('click', () => dom.categoryEditModal.style.display = 'none');

  if (dom.categoryEditForm) {
    dom.categoryEditForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = dom.editCatId.value;
      const name = dom.editCatName.value.trim();
      const order_index = Number(dom.editCatOrder.value) || 0;
      const is_active = dom.editCatActive.value === 'true';

      if (!name) return;
      const payload = { name, order_index, is_active };
      if (id) payload.id = id;

      const saved = await window.db.saveCategory(payload);
      if (id) {
        adminState.categories = adminState.categories.map(c => c.id === id ? saved : c);
      } else {
        adminState.categories.push(saved);
      }
      dom.categoryEditModal.style.display = 'none';
      renderCategories();
      renderProducts();
    });
  }

  dom.btnOpenAddCategory.addEventListener('click', () => openCategoryModal(null));

  // ==========================================
  // 5. PROMOÇÕES & COMBOS
  // ==========================================
  function renderPromotions() {
    if (adminState.promotions.length === 0) {
      dom.adminPromotionsList.innerHTML = '<p style="color: var(--text-muted);">Nenhuma promoção cadastrada.</p>';
      return;
    }

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">';
    adminState.promotions.forEach(p => {
      html += `
        <div class="admin-card-container" style="border: 2px solid var(--border-color); margin-bottom: 0;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <h4 style="font-size: 1.05rem; color: #d97706; margin: 0;"><i class="fi fi-sr-flame" style="color: #f97316;"></i> ${window.escapeHtml(p.name)}</h4>
            <span style="font-weight: 800; font-size: 1.1rem; color: #d97706;">${window.formatCurrency(p.price)}</span>
          </div>
          <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 12px;">${window.escapeHtml(p.description || '')}</p>
          <div style="font-size: 0.8rem; color: #475569; background: #f8fafc; padding: 8px 10px; border-radius: 6px; margin-bottom: 10px;">
            <strong>Lanches válidos:</strong> ${p.allowed_items ? window.escapeHtml(p.allowed_items.join(', ')) : 'Todos'}
          </div>
          <div style="display: flex; justify-content: flex-end;">
            <button class="btn-ghost-secondary btn-edit-promo" data-promo-id="${p.id}" style="font-size: 0.8rem;">
              <i class="fi fi-sr-pencil"></i> Editar Promoção
            </button>
          </div>
        </div>
      `;
    });
    html += '</div>';
    dom.adminPromotionsList.innerHTML = html;

    dom.adminPromotionsList.querySelectorAll('.btn-edit-promo').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-promo-id');
        openPromotionModal(id);
      });
    });
  }

  function openPromotionModal(promoId = null) {
    if (promoId) {
      const promo = adminState.promotions.find(p => p.id === promoId);
      if (!promo) return;
      dom.promotionModalTitle.textContent = 'Editar Promoção';
      dom.editPromoId.value = promo.id;
      dom.editPromoName.value = promo.name || '';
      dom.editPromoPrice.value = promo.price !== undefined && promo.price !== null ? promo.price : '';
      dom.editPromoDescription.value = promo.description || '';
    } else {
      dom.promotionModalTitle.textContent = 'Nova Promoção';
      dom.editPromoId.value = '';
      dom.editPromoName.value = '';
      dom.editPromoPrice.value = '';
      dom.editPromoDescription.value = '';
    }
    dom.promotionEditModal.style.display = 'flex';
  }

  if (dom.btnPromotionModalClose) dom.btnPromotionModalClose.addEventListener('click', () => dom.promotionEditModal.style.display = 'none');
  if (dom.btnPromotionModalCancel) dom.btnPromotionModalCancel.addEventListener('click', () => dom.promotionEditModal.style.display = 'none');

  if (dom.promotionEditForm) {
    dom.promotionEditForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = dom.editPromoId.value;
      const name = dom.editPromoName.value.trim();
      const price = Number(dom.editPromoPrice.value) || 0;
      const description = dom.editPromoDescription.value.trim();

      if (!name) return;
      const existing = adminState.promotions.find(p => p.id === id) || {};
      const payload = { ...existing, name, price, description };
      if (id) payload.id = id;

      const saved = await window.db.savePromotion(payload);
      if (id) {
        adminState.promotions = adminState.promotions.map(p => p.id === id ? saved : p);
      } else {
        adminState.promotions.push(saved);
      }
      dom.promotionEditModal.style.display = 'none';
      renderPromotions();
    });
  }

  // ==========================================
  // 6. ADICIONAIS / OPCIONAIS
  // ==========================================
  function renderOptionals() {
    let html = '';
    adminState.optionals.forEach(o => {
      html += `
        <tr>
          <td><strong>${window.escapeHtml(o.name)}</strong></td>
          <td><strong>+ ${window.formatCurrency(o.price)}</strong></td>
          <td>
            <span class="product-status-pill ${o.is_active !== false ? 'status-active' : 'status-inactive'}">
              ${o.is_active !== false ? 'Ativo' : 'Inativo'}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn-ghost-secondary btn-edit-opt" data-opt-id="${o.id}" style="font-size: 0.78rem;">
                <i class="fi fi-sr-pencil"></i> Editar
              </button>
              <button class="btn-ghost-secondary btn-delete-opt" data-opt-id="${o.id}" style="font-size: 0.78rem; color: var(--primary-red);" title="Excluir Adicional">
                <i class="fi fi-sr-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });
    dom.adminOptionalsTableBody.innerHTML = html;

    dom.adminOptionalsTableBody.querySelectorAll('.btn-edit-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-opt-id');
        openOptionalModal(id);
      });
    });

    dom.adminOptionalsTableBody.querySelectorAll('.btn-delete-opt').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-opt-id');
        if (confirm('Deseja excluir este adicional?')) {
          await window.db.deleteOptional(id);
          adminState.optionals = adminState.optionals.filter(o => o.id !== id);
          renderOptionals();
        }
      });
    });
  }

  function openOptionalModal(optId = null) {
    if (optId) {
      const opt = adminState.optionals.find(o => o.id === optId);
      if (!opt) return;
      dom.optionalModalTitle.textContent = 'Editar Adicional';
      dom.editOptId.value = opt.id;
      dom.editOptName.value = opt.name || '';
      dom.editOptPrice.value = opt.price !== undefined && opt.price !== null ? opt.price : '3.00';
      dom.editOptActive.value = String(opt.is_active !== false);
    } else {
      dom.optionalModalTitle.textContent = 'Novo Adicional';
      dom.editOptId.value = '';
      dom.editOptName.value = '';
      dom.editOptPrice.value = '3.00';
      dom.editOptActive.value = 'true';
    }
    dom.optionalEditModal.style.display = 'flex';
  }

  if (dom.btnOptionalModalClose) dom.btnOptionalModalClose.addEventListener('click', () => dom.optionalEditModal.style.display = 'none');
  if (dom.btnOptionalModalCancel) dom.btnOptionalModalCancel.addEventListener('click', () => dom.optionalEditModal.style.display = 'none');

  if (dom.optionalEditForm) {
    dom.optionalEditForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = dom.editOptId.value;
      const name = dom.editOptName.value.trim();
      const price = Number(dom.editOptPrice.value) || 0;
      const is_active = dom.editOptActive.value === 'true';

      if (!name) return;
      const payload = { name, price, is_active };
      if (id) payload.id = id;

      const saved = await window.db.saveOptional(payload);
      if (id) {
        adminState.optionals = adminState.optionals.map(o => o.id === id ? saved : o);
      } else {
        adminState.optionals.push(saved);
      }
      dom.optionalEditModal.style.display = 'none';
      renderOptionals();
    });
  }

  dom.btnOpenAddOptional.addEventListener('click', () => openOptionalModal(null));

  // ==========================================
  // ==========================================
  // 8. GESTÃO DE BAIRROS E TAXAS DE ENTREGA
  // ==========================================
  function renderNeighborhoods() {
    let list = adminState.neighborhoods || [];
    const query = (adminState.neighborhoodSearch || '').toLowerCase().trim();

    if (query) {
      list = list.filter(n => (n.name || '').toLowerCase().includes(query));
    }

    let rowsHtml = '';
    list.forEach(n => {
      const isAct = n.is_active !== false;
      rowsHtml += `
        <tr>
          <td><strong>${n.name}</strong></td>
          <td><span style="font-size: 0.85rem; color: #64748b;">${n.delivery_time_min || 60} min</span></td>
          <td><strong style="color: #d97706; font-size: 1rem;">${window.formatCurrency(n.delivery_fee)}</strong></td>
          <td>
            <span class="product-status-pill ${isAct ? 'status-active' : 'status-inactive'}">
              ${isAct ? 'Ativo' : 'Inativo'}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn-ghost-secondary btn-edit-neighborhood" data-id="${n.id}" style="font-size: 0.78rem;">
                <i class="fi fi-sr-pencil"></i> Editar
              </button>
              <button class="btn-ghost-secondary btn-delete-neighborhood" data-id="${n.id}" style="font-size: 0.78rem; color: var(--primary-red);" title="Excluir Bairro">
                <i class="fi fi-sr-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    dom.adminNeighborhoodsTableBody.innerHTML = rowsHtml || `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">Nenhum bairro encontrado</td></tr>`;

    dom.adminNeighborhoodsTableBody.querySelectorAll('.btn-edit-neighborhood').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openNeighborhoodModal(id);
      });
    });

    dom.adminNeighborhoodsTableBody.querySelectorAll('.btn-delete-neighborhood').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Deseja excluir este bairro?')) {
          await window.db.deleteNeighborhood(id);
          adminState.neighborhoods = adminState.neighborhoods.filter(n => n.id !== id);
          renderNeighborhoods();
          populateWaNeighborhoodsSelect();
        }
      });
    });
  }

  function openNeighborhoodModal(id = null) {
    if (id) {
      const found = (adminState.neighborhoods || []).find(n => n.id === id);
      if (!found) return;
      dom.neighborhoodModalTitle.textContent = 'Editar Bairro';
      dom.editNeighborhoodId.value = found.id;
      dom.editNeighborhoodName.value = found.name;
      dom.editNeighborhoodFee.value = found.delivery_fee;
      dom.editNeighborhoodTime.value = found.delivery_time_min || 60;
      dom.editNeighborhoodActive.value = String(found.is_active !== false);
    } else {
      dom.neighborhoodModalTitle.textContent = 'Novo Bairro';
      dom.editNeighborhoodId.value = '';
      dom.editNeighborhoodName.value = '';
      dom.editNeighborhoodFee.value = '8.00';
      dom.editNeighborhoodTime.value = '60';
      dom.editNeighborhoodActive.value = 'true';
    }
    dom.neighborhoodEditModal.style.display = 'flex';
  }

  dom.btnOpenAddNeighborhood.addEventListener('click', () => openNeighborhoodModal(null));
  dom.btnNeighborhoodModalClose.addEventListener('click', () => { dom.neighborhoodEditModal.style.display = 'none'; });
  dom.btnNeighborhoodModalCancel.addEventListener('click', () => { dom.neighborhoodEditModal.style.display = 'none'; });

  dom.neighborhoodEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = dom.editNeighborhoodId.value;
    const payload = {
      name: dom.editNeighborhoodName.value.trim(),
      delivery_fee: Number(dom.editNeighborhoodFee.value) || 0,
      delivery_time_min: Number(dom.editNeighborhoodTime.value) || 60,
      is_active: dom.editNeighborhoodActive.value === 'true'
    };
    if (id) payload.id = id;

    const saved = await window.db.saveNeighborhood(payload);
    if (id) {
      adminState.neighborhoods = adminState.neighborhoods.map(n => n.id === id ? saved : n);
    } else {
      adminState.neighborhoods.push(saved);
    }

    dom.neighborhoodEditModal.style.display = 'none';
    renderNeighborhoods();
    populateWaNeighborhoodsSelect();
  });

  dom.adminSearchNeighborhoodInput.addEventListener('input', (e) => {
    adminState.neighborhoodSearch = e.target.value;
    renderNeighborhoods();
  });

  // ==========================================
  // 9. FECHAMENTO DE CAIXA DIÁRIO & ACERTO DE ENTREGADORES
  // ==========================================
  function renderCashReport() {
    const reportDate = adminState.selectedCashDate || new Date().toISOString().split('T')[0];
    dom.cashReportDatePicker.value = reportDate;

    // Filtra pedidos do dia que não foram cancelados
    const dayOrders = adminState.orders.filter(o => {
      const oDate = (o.created_at || '').split('T')[0];
      return oDate === reportDate && o.status !== 'cancelado';
    });

    // Totais Gerais
    let totalRevenue = 0;
    let totalCash = 0;
    let totalPix = 0;
    let totalCard = 0;
    let totalDeliveryFees = 0;

    let mesaRev = 0, mesaCount = 0;
    let balcaoRev = 0, balcaoCount = 0;
    let deliveryRev = 0, deliveryCount = 0;

    dayOrders.forEach(o => {
      const ordTotal = Number(o.total) || 0;
      const ordFee = Number(o.delivery_fee) || 0;
      totalRevenue += ordTotal;
      totalDeliveryFees += ordFee;

      const pay = (o.payment_method || '').toLowerCase();
      if (pay === 'dinheiro') totalCash += ordTotal;
      else if (pay === 'pix') totalPix += ordTotal;
      else if (pay === 'cartao') totalCard += ordTotal;
      else if (pay === 'pendente') totalCash += ordTotal; // pendente fechado

      if (o.order_type === 'mesa' || o.table_number) {
        mesaRev += ordTotal;
        mesaCount++;
      } else if (o.order_type === 'balcao') {
        balcaoRev += ordTotal;
        balcaoCount++;
      } else {
        deliveryRev += ordTotal;
        deliveryCount++;
      }
    });

    dom.cashStatTotalRevenue.textContent = window.formatCurrency(totalRevenue);
    dom.cashStatCashTotal.textContent = window.formatCurrency(totalCash);
    dom.cashStatPixTotal.textContent = window.formatCurrency(totalPix);
    dom.cashStatCardTotal.textContent = window.formatCurrency(totalCard);

    dom.cashChannelMesa.textContent = `${window.formatCurrency(mesaRev)} (${mesaCount} pedidos)`;
    dom.cashChannelBalcao.textContent = `${window.formatCurrency(balcaoRev)} (${balcaoCount} pedidos)`;
    dom.cashChannelDelivery.textContent = `${window.formatCurrency(deliveryRev)} (${deliveryCount} pedidos)`;
    dom.cashTotalDeliveryFees.textContent = window.formatCurrency(totalDeliveryFees);

    // Acerto individual dos entregadores
    renderCouriersReport(dayOrders, reportDate);

    // Atualiza status do caixa e histórico
    updateCashStatusBadge(reportDate);
    renderCashClosingsHistory();
  }

  async function updateCashStatusBadge(reportDate) {
    const closings = await window.db.getCashClosings();
    const found = closings.find(c => (c.closing_date || c.date) === reportDate);

    if (found) {
      const closedTime = found.closed_at ? new Date(found.closed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
      dom.cashCurrentStatusBadge.innerHTML = `<i class="fi fi-sr-lock"></i> Caixa Fechado às ${closedTime} (Total: ${window.formatCurrency(found.total_revenue)})`;
      dom.cashCurrentStatusBadge.style.color = '#fbbf24';
      dom.btnOpenManualCashClose.innerHTML = '<i class="fi fi-sr-refresh"></i> Re-Fechar / Atualizar Caixa';
    } else {
      dom.cashCurrentStatusBadge.innerHTML = '<i class="fi fi-sr-circle" style="color: #34d399; font-size: 0.8em;"></i> Caixa Aberto (Expediente em Andamento)';
      dom.cashCurrentStatusBadge.style.color = '#34d399';
      dom.btnOpenManualCashClose.innerHTML = '<i class="fi fi-sr-lock"></i> Fechar Caixa Manualmente';
    }
  }

  async function renderCashClosingsHistory() {
    const closings = await window.db.getCashClosings();
    if (!closings || closings.length === 0) {
      dom.cashClosingsHistoryTableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #94a3b8; padding: 20px;">Nenhum fechamento registrado ainda.</td></tr>`;
      return;
    }

    let rowsHtml = '';
    closings.forEach(c => {
      const dateStr = c.closing_date || c.date || '--/--/----';
      const closedAtStr = c.closed_at ? new Date(c.closed_at).toLocaleString('pt-BR') : '--:--';
      const diffStr = c.difference !== null && c.difference !== undefined 
        ? (c.difference === 0 ? '<span style="color:#10b981;font-weight:700;">Batendo (R$ 0,00)</span>' 
        : c.difference > 0 ? `<span style="color:#2563eb;font-weight:700;">+ Sobra: ${window.formatCurrency(c.difference)}</span>` 
        : `<span style="color:#ef4444;font-weight:700;">- Falta: ${window.formatCurrency(Math.abs(c.difference))}</span>`) 
        : '--';

      rowsHtml += `
        <tr>
          <td><strong>${new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR')}</strong></td>
          <td><span style="font-size: 0.8rem; color: #64748b;">${closedAtStr}</span></td>
          <td><strong>${c.orders_count || 0} ped</strong></td>
          <td><strong style="color: #10b981; font-size: 0.95rem;">${window.formatCurrency(c.total_revenue)}</strong></td>
          <td>${window.formatCurrency(c.total_cash)}</td>
          <td>${window.formatCurrency(c.total_pix)}</td>
          <td>${window.formatCurrency(c.total_card)}</td>
          <td><span style="font-size: 0.78rem; color: #475569;">${c.notes || 'Sem observações'}</span></td>
          <td>
            <button type="button" class="btn-ghost-secondary btn-reprint-closing" data-date="${dateStr}" style="font-size: 0.78rem;">
              <i class="fi fi-sr-print"></i> Cupom
            </button>
          </td>
        </tr>
      `;
    });

    dom.cashClosingsHistoryTableBody.innerHTML = rowsHtml;

    dom.cashClosingsHistoryTableBody.querySelectorAll('.btn-reprint-closing').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = btn.getAttribute('data-date');
        printDailyCashSummary(d);
      });
    });
  }

  // Abertura do Modal de Fechamento Manual
  function openManualCashCloseModal() {
    const reportDate = adminState.selectedCashDate || new Date().toISOString().split('T')[0];
    const dayOrders = adminState.orders.filter(o => {
      const oDate = (o.created_at || '').split('T')[0];
      return oDate === reportDate && o.status !== 'cancelado';
    });

    let totalRevenue = 0;
    let totalCash = 0;
    let totalPix = 0;
    let totalCard = 0;
    let totalDeliveryFees = 0;

    dayOrders.forEach(o => {
      const ordTotal = Number(o.total) || 0;
      const ordFee = Number(o.delivery_fee) || 0;
      totalRevenue += ordTotal;
      totalDeliveryFees += ordFee;

      const pay = (o.payment_method || '').toLowerCase();
      if (pay === 'dinheiro' || pay === 'pendente') totalCash += ordTotal;
      else if (pay === 'pix') totalPix += ordTotal;
      else if (pay === 'cartao') totalCard += ordTotal;
    });

    dom.closeModalDate.textContent = new Date(reportDate + 'T12:00:00').toLocaleDateString('pt-BR');
    dom.closeModalOrdersCount.textContent = `${dayOrders.length} pedidos`;
    dom.closeModalCashTotal.textContent = window.formatCurrency(totalCash);
    dom.closeModalPixTotal.textContent = window.formatCurrency(totalPix);
    dom.closeModalCardTotal.textContent = window.formatCurrency(totalCard);
    dom.closeModalDeliveryFeesTotal.textContent = window.formatCurrency(totalDeliveryFees);
    dom.closeModalGrandTotal.textContent = window.formatCurrency(totalRevenue);

    dom.closeModalInitialFund.value = '0.00';
    dom.closeModalCountedCash.value = totalCash > 0 ? totalCash.toFixed(2) : '0.00';
    dom.closeModalNotes.value = '';

    function recalculateDiff() {
      const fund = Number(dom.closeModalInitialFund.value) || 0;
      const counted = Number(dom.closeModalCountedCash.value) || 0;
      const expected = totalCash + fund;

      dom.closeModalExpectedCash.textContent = window.formatCurrency(expected);
      const diff = counted - expected;

      if (Math.abs(diff) < 0.01) {
        dom.closeModalDiffText.textContent = 'Diferença: R$ 0,00 (Conferência exata ✅)';
        dom.closeModalDiffText.style.color = '#15803d';
      } else if (diff > 0) {
        dom.closeModalDiffText.textContent = `Diferença: + ${window.formatCurrency(diff)} (Sobra em caixa 📈)`;
        dom.closeModalDiffText.style.color = '#1d4ed8';
      } else {
        dom.closeModalDiffText.textContent = `Diferença: - ${window.formatCurrency(Math.abs(diff))} (Falta em caixa ⚠️)`;
        dom.closeModalDiffText.style.color = '#b91c1c';
      }
    }

    dom.closeModalInitialFund.oninput = recalculateDiff;
    dom.closeModalCountedCash.oninput = recalculateDiff;
    recalculateDiff();

    dom.manualCashCloseModal.style.display = 'flex';
  }

  dom.btnOpenManualCashClose.addEventListener('click', openManualCashCloseModal);
  dom.btnManualCashCloseModalClose.addEventListener('click', () => { dom.manualCashCloseModal.style.display = 'none'; });
  dom.btnCancelManualCashClose.addEventListener('click', () => { dom.manualCashCloseModal.style.display = 'none'; });

  dom.btnConfirmManualCashClose.addEventListener('click', async () => {
    const reportDate = adminState.selectedCashDate || new Date().toISOString().split('T')[0];
    const dayOrders = adminState.orders.filter(o => {
      const oDate = (o.created_at || '').split('T')[0];
      return oDate === reportDate && o.status !== 'cancelado';
    });

    let totalRevenue = 0;
    let totalCash = 0;
    let totalPix = 0;
    let totalCard = 0;
    let totalDeliveryFees = 0;

    dayOrders.forEach(o => {
      const ordTotal = Number(o.total) || 0;
      const ordFee = Number(o.delivery_fee) || 0;
      totalRevenue += ordTotal;
      totalDeliveryFees += ordFee;

      const pay = (o.payment_method || '').toLowerCase();
      if (pay === 'dinheiro' || pay === 'pendente') totalCash += ordTotal;
      else if (pay === 'pix') totalPix += ordTotal;
      else if (pay === 'cartao') totalCard += ordTotal;
    });

    const initialFund = Number(dom.closeModalInitialFund.value) || 0;
    const countedCash = Number(dom.closeModalCountedCash.value) || 0;
    const expected = totalCash + initialFund;
    const diff = countedCash - expected;
    const notes = dom.closeModalNotes.value.trim();

    const closingPayload = {
      closing_date: reportDate,
      closed_at: new Date().toISOString(),
      total_revenue: totalRevenue,
      total_cash: totalCash,
      total_pix: totalPix,
      total_card: totalCard,
      total_delivery_fees: totalDeliveryFees,
      initial_fund: initialFund,
      counted_cash: countedCash,
      difference: diff,
      orders_count: dayOrders.length,
      notes: notes
    };

    dom.btnConfirmManualCashClose.disabled = true;
    dom.btnConfirmManualCashClose.textContent = 'Gravando fechamento...';

    try {
      await window.db.saveCashClosing(closingPayload);
      dom.manualCashCloseModal.style.display = 'none';
      
      printDailyCashSummary(reportDate);
      await updateCashStatusBadge(reportDate);
      await renderCashClosingsHistory();

      alert(`✅ Caixa do dia ${new Date(reportDate + 'T12:00:00').toLocaleDateString('pt-BR')} fechado com sucesso!\n\nO cupom oficial de fechamento foi gerado para impressão.`);
    } catch (err) {
      console.error('Erro ao salvar fechamento de caixa:', err);
      alert('Erro ao registrar fechamento. Tente novamente.');
    } finally {
      dom.btnConfirmManualCashClose.disabled = false;
      dom.btnConfirmManualCashClose.textContent = '✅ Confirmar Fechamento e Emitir Cupom';
    }
  });

  function renderCouriersReport(dayOrders, reportDate) {
    const couriers = adminState.couriers || [];
    let html = '';

    couriers.forEach(courier => {
      const courierName = courier.name;
      // Pedidos despachados ou entregues por este motoboy
      const courierOrders = dayOrders.filter(o => o.courier_name && o.courier_name.toLowerCase() === courierName.toLowerCase());
      
      const totalDeliveries = courierOrders.length;
      let totalCollectedCash = 0; // Dinheiro que o motoboy recebeu do cliente
      let totalFees = 0; // Taxas de entrega dos pedidos dele
      let totalOrdersAmount = 0; // Valor somado dos pedidos dele

      let ordersRowsHtml = '';
      courierOrders.forEach(o => {
        const ordTotal = Number(o.total) || 0;
        const ordFee = Number(o.delivery_fee) || 0;
        totalOrdersAmount += ordTotal;
        totalFees += ordFee;

        if (o.payment_method === 'dinheiro') {
          totalCollectedCash += ordTotal;
        }

        const neighborhoodName = o.delivery_address?.neighborhood || 'Entrega';

        ordersRowsHtml += `
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; padding: 4px 0; border-bottom: 1px dashed #e2e8f0;">
            <div>
              <strong>#${String(o.order_number).padStart(4, '0')}</strong> • ${window.escapeHtml(o.customer_name || 'Cliente')} (${window.escapeHtml(neighborhoodName)})
              <div style="font-size: 0.72rem; color: #64748b;">Pagamento: ${window.escapeHtml((o.payment_method || '').toUpperCase())} ${o.change_for ? `(Troco: ${window.formatCurrency(o.change_for)})` : ''}</div>
            </div>
            <div style="text-align: right;">
              <strong style="color: #0f172a;">${window.formatCurrency(ordTotal)}</strong>
              <div style="font-size: 0.72rem; color: #d97706;">Taxa: ${window.formatCurrency(ordFee)}</div>
            </div>
          </div>
        `;
      });

      html += `
        <div class="courier-report-card">
          <div>
            <div class="courier-report-card-header">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.5rem;"><i class="fi fi-sr-motorcycle"></i></span>
                <div>
                  <h4 style="margin: 0; font-size: 1.05rem; font-weight: 800;">${window.escapeHtml(courierName)}</h4>
                  <span style="font-size: 0.76rem; color: #64748b;">Entregador Oficial</span>
                </div>
              </div>
              <span class="order-type-badge delivery" style="font-size: 0.8rem;">${totalDeliveries} entrega(s)</span>
            </div>

            <div class="courier-stat-row">
              <span>Total de Corridas / Entregas:</span>
              <strong>${totalDeliveries}</strong>
            </div>

            <div class="courier-stat-row">
              <span><i class="fi fi-sr-money-bill-wave"></i> Dinheiro Recebido na Entrega (a repassar):</span>
              <strong style="color: #2563eb;">${window.formatCurrency(totalCollectedCash)}</strong>
            </div>

            <div class="courier-stat-row">
              <span><i class="fi fi-sr-motorcycle"></i> Total das Taxas de Entrega:</span>
              <strong style="color: #16a34a;">${window.formatCurrency(totalFees)}</strong>
            </div>

            <div class="courier-stat-row highlight">
              <span>Total dos Pedidos Entregues:</span>
              <strong>${window.formatCurrency(totalOrdersAmount)}</strong>
            </div>

            <div style="margin-top: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; max-height: 140px; overflow-y: auto;">
              <div style="font-size: 0.76rem; font-weight: 700; color: #64748b; margin-bottom: 4px;">Extrato de Entregas:</div>
              ${ordersRowsHtml || '<div style="font-size: 0.78rem; color: #94a3b8; text-align: center; padding: 8px;">Nenhuma entrega atribuída nesta data.</div>'}
            </div>
          </div>

          <div style="margin-top: 14px; display: flex; gap: 8px;">
            <button type="button" class="btn-ghost-secondary btn-print-courier-settlement" data-courier="${window.escapeHtml(courierName)}" style="flex: 1; font-size: 0.8rem; font-weight: 700;">
              <i class="fi fi-sr-print"></i> Imprimir Acerto (${window.escapeHtml(courierName)})
            </button>
          </div>
        </div>
      `;
    });

    dom.couriersReportContainer.innerHTML = html;

    dom.couriersReportContainer.querySelectorAll('.btn-print-courier-settlement').forEach(btn => {
      btn.addEventListener('click', () => {
        const cName = btn.getAttribute('data-courier');
        printCourierSettlement(cName, reportDate);
      });
    });
  }

  // Impressão do Acerto Individual do Entregador
  function printCourierSettlement(courierName, reportDate) {
    const dayOrders = adminState.orders.filter(o => {
      const oDate = (o.created_at || '').split('T')[0];
      return oDate === reportDate && o.status !== 'cancelado' && o.courier_name && o.courier_name.toLowerCase() === courierName.toLowerCase();
    });

    let deliveriesStr = '';
    let totalCash = 0;
    let totalFees = 0;
    let totalOrders = 0;

    dayOrders.forEach((o, idx) => {
      const ordTotal = Number(o.total) || 0;
      const ordFee = Number(o.delivery_fee) || 0;
      totalOrders += ordTotal;
      totalFees += ordFee;
      if (o.payment_method === 'dinheiro') totalCash += ordTotal;

      deliveriesStr += `
        <div>
          ${idx + 1}. Pedido #${String(o.order_number).padStart(4, '0')} - ${window.escapeHtml(o.customer_name || 'Cliente')}<br />
          &nbsp;&nbsp;Bairro: ${window.escapeHtml(o.delivery_address?.neighborhood || 'N/A')}<br />
          &nbsp;&nbsp;Pag: ${window.escapeHtml((o.payment_method || '').toUpperCase())} | Valor: ${window.formatCurrency(ordTotal)} | Taxa: ${window.formatCurrency(ordFee)}
        </div>
        <hr style="border: none; border-top: 1px dotted #ccc; margin: 4px 0;" />
      `;
    });

    const printWin = window.open('', '_blank', 'width=400,height=600');
    printWin.document.write(`
      <html>
        <head>
          <title>Acerto Entregador - ${window.escapeHtml(courierName)}</title>
          <style>
            body { font-family: monospace; font-size: 13px; padding: 12px; }
            h2, h3 { margin: 4px 0; text-align: center; }
            hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
          </style>
        </head>
        <body>
          <h2>BOYDEGUSTA</h2>
          <h3>ACERTO DE ENTREGADOR</h3>
          <div style="text-align: center; font-weight: bold; font-size: 15px;">🛵 ${window.escapeHtml(courierName.toUpperCase())}</div>
          <div style="text-align: center;">Data: ${new Date(reportDate + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
          <hr />
          <div><strong>Total de Entregas:</strong> ${dayOrders.length}</div>
          <div><strong>Dinheiro em Mãos (a repassar):</strong> ${window.formatCurrency(totalCash)}</div>
          <div><strong>Total de Taxas das Corridas:</strong> ${window.formatCurrency(totalFees)}</div>
          <div><strong>Total Geral dos Pedidos:</strong> ${window.formatCurrency(totalOrders)}</div>
          <hr />
          <div style="font-weight: bold; margin-bottom: 6px;">LISTAGEM DAS ENTREGAS:</div>
          ${deliveriesStr || '<div>Nenhuma entrega registrada.</div>'}
          <hr />
          <div style="text-align: center; margin-top: 20px; font-size: 11px;">
            ___________________________<br />
            Assinatura do Entregador
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    printWin.print();
  }

  // Impressão do Fechamento de Caixa Geral do Dia
  function printDailyCashSummary(reportDate) {
    const dayOrders = adminState.orders.filter(o => {
      const oDate = (o.created_at || '').split('T')[0];
      return oDate === reportDate && o.status !== 'cancelado';
    });

    let totalRevenue = 0;
    let totalCash = 0;
    let totalPix = 0;
    let totalCard = 0;
    let totalDeliveryFees = 0;

    let mesaRev = 0, mesaCount = 0;
    let balcaoRev = 0, balcaoCount = 0;
    let deliveryRev = 0, deliveryCount = 0;

    dayOrders.forEach(o => {
      const ordTotal = Number(o.total) || 0;
      const ordFee = Number(o.delivery_fee) || 0;
      totalRevenue += ordTotal;
      totalDeliveryFees += ordFee;

      const pay = (o.payment_method || '').toLowerCase();
      if (pay === 'dinheiro' || pay === 'pendente') totalCash += ordTotal;
      else if (pay === 'pix') totalPix += ordTotal;
      else if (pay === 'cartao') totalCard += ordTotal;

      if (o.order_type === 'mesa' || o.table_number) {
        mesaRev += ordTotal;
        mesaCount++;
      } else if (o.order_type === 'balcao') {
        balcaoRev += ordTotal;
        balcaoCount++;
      } else {
        deliveryRev += ordTotal;
        deliveryCount++;
      }
    });

    // Entregadores
    let couriersStr = '';
    const couriers = adminState.couriers || [];
    couriers.forEach(c => {
      const cOrders = dayOrders.filter(o => o.courier_name && o.courier_name.toLowerCase() === c.name.toLowerCase());
      const cCash = cOrders.filter(o => o.payment_method === 'dinheiro').reduce((s, o) => s + (Number(o.total) || 0), 0);
      const cFees = cOrders.reduce((s, o) => s + (Number(o.delivery_fee) || 0), 0);
      couriersStr += `
        <div>🛵 <strong>${window.escapeHtml(c.name)}:</strong> ${cOrders.length} entregas | Taxas: ${window.formatCurrency(cFees)} | Dinheiro em Mãos: ${window.formatCurrency(cCash)}</div>
      `;
    });

    const printWin = window.open('', '_blank', 'width=400,height=600');
    printWin.document.write(`
      <html>
        <head>
          <title>Fechamento de Caixa - ${reportDate}</title>
          <style>
            body { font-family: monospace; font-size: 13px; padding: 12px; }
            h2, h3 { margin: 4px 0; text-align: center; }
            hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
          </style>
        </head>
        <body>
          <h2>BOYDEGUSTA</h2>
          <h3>FECHAMENTO DE CAIXA DIÁRIO</h3>
          <div style="text-align: center;">Data: ${new Date(reportDate + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
          <div style="text-align: center;">Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
          <hr />
          <div style="font-size: 16px; font-weight: bold;">FATURAMENTO TOTAL: ${window.formatCurrency(totalRevenue)}</div>
          <div>Total de Pedidos: ${dayOrders.length}</div>
          <hr />
          <div><strong>FORMA DE PAGAMENTO:</strong></div>
          <div>💵 Dinheiro: ${window.formatCurrency(totalCash)}</div>
          <div>📱 PIX: ${window.formatCurrency(totalPix)}</div>
          <div>💳 Cartão: ${window.formatCurrency(totalCard)}</div>
          <hr />
          <div><strong>CANAIS DE VENDA:</strong></div>
          <div>🪑 Mesas (Salão): ${window.formatCurrency(mesaRev)} (${mesaCount} ped)</div>
          <div>🥡 Balcão (Viagem): ${window.formatCurrency(balcaoRev)} (${balcaoCount} ped)</div>
          <div>🛵 Delivery: ${window.formatCurrency(deliveryRev)} (${deliveryCount} ped)</div>
          <div>🛵 Total Taxas de Entrega: ${window.formatCurrency(totalDeliveryFees)}</div>
          <hr />
          <div><strong>ENTREGADORES (MOTOBOYS):</strong></div>
          ${couriersStr || '<div>Nenhum entregador atribuído</div>'}
          <hr />
          <div style="text-align: center; margin-top: 16px; font-size: 11px;">Fechamento de Caixa Concluído</div>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    printWin.print();
  }

  dom.cashReportDatePicker.addEventListener('change', (e) => {
    adminState.selectedCashDate = e.target.value;
    renderCashReport();
  });

  dom.btnCashToday.addEventListener('click', () => {
    adminState.selectedCashDate = new Date().toISOString().split('T')[0];
    renderCashReport();
  });

  dom.btnCashYesterday.addEventListener('click', () => {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    adminState.selectedCashDate = yest.toISOString().split('T')[0];
    renderCashReport();
  });

  dom.btnPrintDailyCash.addEventListener('click', () => {
    printDailyCashSummary(adminState.selectedCashDate);
  });

  // ==========================================
  // 7. CONFIGURAÇÕES DO ESTABELECIMENTO
  // ==========================================
  function populateSettingsForm() {
    if (!adminState.settings) return;
    const s = adminState.settings;
    dom.settingStatusMode.value = s.store_status_mode || 'auto';
    dom.settingClosedMessage.value = s.closed_message || '';
    dom.settingMinOrder.value = s.min_order_value !== undefined ? s.min_order_value : 10.00;
    dom.settingWhatsApp.value = s.whatsapp || '5581992686946';
    dom.settingInstagram.value = s.instagram || '@boydegusta';
    dom.settingAddress.value = s.address || '';
    dom.settingPixKey.value = s.pix_key || '';
  }

  dom.adminSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const updatedPayload = {
      store_status_mode: dom.settingStatusMode.value,
      closed_message: dom.settingClosedMessage.value.trim(),
      min_order_value: Number(dom.settingMinOrder.value) || 10.00,
      whatsapp: dom.settingWhatsApp.value.trim(),
      instagram: dom.settingInstagram.value.trim(),
      address: dom.settingAddress.value.trim(),
      pix_key: dom.settingPixKey.value.trim()
    };

    const saved = await window.db.updateSettings(updatedPayload);
    adminState.settings = saved;
    updateStatusIndicator();
    alert('✅ Configurações salvas com sucesso!');
  });

  // ==========================================
  // PEDIDO VIA WHATSAPP COM SELEÇÃO DE BAIRRO
  // ==========================================
  function populateWaNeighborhoodsSelect() {
    const list = (adminState.neighborhoods || []).filter(n => n.is_active !== false);
    let html = '<option value="">Selecione o bairro...</option>';
    list.forEach(n => {
      html += `<option value="${n.name}" data-fee="${n.delivery_fee}">${n.name} — ${window.formatCurrency(n.delivery_fee)} (${n.delivery_time_min || 60} min)</option>`;
    });
    dom.waNeighborhoodSelect.innerHTML = html;

    dom.waNeighborhoodSelect.onchange = () => {
      const selectedName = dom.waNeighborhoodSelect.value;
      const found = list.find(n => n.name === selectedName);
      if (found) {
        dom.waDeliveryFee.value = found.delivery_fee;
      }
      updateWaTotal();
    };
  }

  function openWhatsappOrderModal() {
    adminState.waCart = [];
    adminState.waOrderType = 'delivery';

    dom.waCustomerName.value = '';
    dom.waCustomerPhone.value = '';
    dom.waStreet.value = '';
    dom.waNumber.value = '';
    dom.waNeighborhoodSelect.value = '';
    dom.waComplement.value = '';
    dom.waReference.value = '';
    dom.waGeneralNotes.value = '';
    dom.waChangeFor.value = '';
    dom.waPaymentMethod.value = 'pix';
    dom.waChangeGroup.style.display = 'none';

    populateWaNeighborhoodsSelect();
    dom.waDeliveryFee.value = '0.00';

    dom.waBtnDelivery.style.border = '2px solid #25d366';
    dom.waBtnDelivery.style.background = '#dcfce7';
    dom.waBtnDelivery.style.color = '#166534';
    dom.waBtnPickup.style.border = '2px solid #e2e8f0';
    dom.waBtnPickup.style.background = '#f8fafc';
    dom.waBtnPickup.style.color = '#475569';
    dom.waDeliveryAddressSection.style.display = 'block';

    renderWaCart();
    dom.whatsappOrderModal.style.display = 'flex';
  }

  function setWaOrderType(type) {
    adminState.waOrderType = type;
    if (type === 'delivery') {
      dom.waBtnDelivery.style.border = '2px solid #25d366';
      dom.waBtnDelivery.style.background = '#dcfce7';
      dom.waBtnDelivery.style.color = '#166534';
      dom.waBtnPickup.style.border = '2px solid #e2e8f0';
      dom.waBtnPickup.style.background = '#f8fafc';
      dom.waBtnPickup.style.color = '#475569';
      dom.waDeliveryAddressSection.style.display = 'block';
      
      const selectedName = dom.waNeighborhoodSelect.value;
      const found = (adminState.neighborhoods || []).find(n => n.name === selectedName);
      dom.waDeliveryFee.value = found ? found.delivery_fee : 5.00;
    } else {
      dom.waBtnPickup.style.border = '2px solid #25d366';
      dom.waBtnPickup.style.background = '#dcfce7';
      dom.waBtnPickup.style.color = '#166534';
      dom.waBtnDelivery.style.border = '2px solid #e2e8f0';
      dom.waBtnDelivery.style.background = '#f8fafc';
      dom.waBtnDelivery.style.color = '#475569';
      dom.waDeliveryAddressSection.style.display = 'none';
      dom.waDeliveryFee.value = 0;
    }
    updateWaTotal();
  }

  function updateWaTotal() {
    const subtotal = adminState.waCart.reduce((s, i) => s + i.subtotal, 0);
    const fee = adminState.waOrderType === 'delivery' ? (Number(dom.waDeliveryFee.value) || 0) : 0;
    dom.waSubtotalDisplay.textContent = window.formatCurrency(subtotal);
    dom.waTotalDisplay.textContent = window.formatCurrency(subtotal + fee);
  }

  function renderWaCart() {
    if (adminState.waCart.length === 0) {
      dom.waItemsList.innerHTML = `<div id="waItemsEmpty" style="text-align: center; padding: 16px; color: #94a3b8; font-size: 0.85rem;">Nenhum item adicionado. Clique em + Adicionar Item.</div>`;
      updateWaTotal();
      return;
    }

    let html = '';
    adminState.waCart.forEach((item, idx) => {
      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; gap: 8px;">
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 0.88rem;">${item.name}</div>
            ${item.notes ? `<div style="font-size: 0.75rem; color: #d97706;">Obs: ${item.notes}</div>` : ''}
            <div style="font-size: 0.8rem; color: #64748b;">${window.formatCurrency(item.price)} / un</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button type="button" class="btn-qty-step wa-cart-minus" data-idx="${idx}">-</button>
            <span style="font-weight: 800; width: 20px; text-align: center;">${item.quantity}</span>
            <button type="button" class="btn-qty-step wa-cart-plus" data-idx="${idx}">+</button>
          </div>
          <div style="font-weight: 800; color: #d97706; min-width: 68px; text-align: right; font-size: 0.88rem;">${window.formatCurrency(item.subtotal)}</div>
          <button type="button" class="wa-cart-remove" data-idx="${idx}" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1rem; padding: 0 4px;">✕</button>
        </div>
      `;
    });

    dom.waItemsList.innerHTML = html;
    updateWaTotal();

    dom.waItemsList.querySelectorAll('.wa-cart-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        adminState.waCart[idx].quantity++;
        adminState.waCart[idx].subtotal = adminState.waCart[idx].price * adminState.waCart[idx].quantity;
        renderWaCart();
      });
    });
    dom.waItemsList.querySelectorAll('.wa-cart-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        if (adminState.waCart[idx].quantity > 1) {
          adminState.waCart[idx].quantity--;
          adminState.waCart[idx].subtotal = adminState.waCart[idx].price * adminState.waCart[idx].quantity;
        } else {
          adminState.waCart.splice(idx, 1);
        }
        renderWaCart();
      });
    });
    dom.waItemsList.querySelectorAll('.wa-cart-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        adminState.waCart.splice(idx, 1);
        renderWaCart();
      });
    });
  }

  function openWaProductPicker() {
    dom.waPickerSearch.value = '';
    renderWaPickerList('');
    dom.waProductPickerModal.style.display = 'flex';
  }

  function renderWaPickerList(query) {
    const q = (query || '').toLowerCase().trim();
    let items = [];

    (adminState.promotions || []).forEach(p => {
      if (p.is_active !== false) items.push({ id: p.id, name: `🔥 ${p.name}`, price: Number(p.price) || 0, description: p.description || 'Combo Promocional' });
    });
    (adminState.products || []).forEach(p => {
      if (p.is_active !== false && p.is_available !== false) items.push({ id: p.id, name: p.name, price: Number(p.price) || 0, description: p.description || '' });
    });

    if (q) items = items.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));

    if (items.length === 0) {
      dom.waPickerProductsList.innerHTML = `<div style="text-align:center;padding:20px;color:#94a3b8;">Nenhum produto encontrado.</div>`;
      return;
    }

    let html = '';
    items.forEach(item => {
      html += `
        <div class="wa-picker-item" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}"
          style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer;transition:background 0.15s;">
          <div>
            <div style="font-weight:700;font-size:0.88rem;">${item.name}</div>
            <div style="font-size:0.76rem;color:#64748b;">${item.description}</div>
          </div>
          <span style="font-weight:800;color:#d97706;font-size:0.9rem;">${window.formatCurrency(item.price)}</span>
        </div>
      `;
    });
    dom.waPickerProductsList.innerHTML = html;

    dom.waPickerProductsList.querySelectorAll('.wa-picker-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        const name = el.getAttribute('data-name');
        const price = Number(el.getAttribute('data-price'));
        const obs = prompt(`Observações para "${name}"? (deixe vazio se não houver)`, '');

        const existingIdx = adminState.waCart.findIndex(c => c.id === id && (c.notes || '') === (obs || ''));
        if (existingIdx > -1) {
          adminState.waCart[existingIdx].quantity++;
          adminState.waCart[existingIdx].subtotal = adminState.waCart[existingIdx].price * adminState.waCart[existingIdx].quantity;
        } else {
          adminState.waCart.push({ id, name, price, quantity: 1, subtotal: price, notes: obs || '' });
        }

        dom.waProductPickerModal.style.display = 'none';
        renderWaCart();
      });

      el.addEventListener('mouseenter', () => { el.style.background = '#fffbeb'; });
      el.addEventListener('mouseleave', () => { el.style.background = '#f8fafc'; });
    });
  }

  // Event Listeners do Modal WhatsApp
  dom.btnQuickWhatsapp.addEventListener('click', openWhatsappOrderModal);
  dom.btnOpenWhatsappOrder.addEventListener('click', openWhatsappOrderModal);
  dom.btnWhatsappModalClose.addEventListener('click', () => { dom.whatsappOrderModal.style.display = 'none'; });

  dom.waBtnDelivery.addEventListener('click', () => setWaOrderType('delivery'));
  dom.waBtnPickup.addEventListener('click', () => setWaOrderType('pickup'));

  dom.waDeliveryFee.addEventListener('input', updateWaTotal);

  dom.waPaymentMethod.addEventListener('change', () => {
    dom.waChangeGroup.style.display = dom.waPaymentMethod.value === 'dinheiro' ? 'block' : 'none';
  });

  dom.btnWaAddItem.addEventListener('click', openWaProductPicker);
  dom.btnWaPickerClose.addEventListener('click', () => { dom.waProductPickerModal.style.display = 'none'; });

  dom.waPickerSearch.addEventListener('input', (e) => renderWaPickerList(e.target.value));

  dom.btnSubmitWhatsappOrder.addEventListener('click', async () => {
    const customerName = dom.waCustomerName.value.trim();
    const customerPhone = dom.waCustomerPhone.value.trim();

    if (!customerName || !customerPhone) {
      alert('Por favor, preencha o nome e WhatsApp do cliente.');
      return;
    }
    if (adminState.waCart.length === 0) {
      alert('Adicione ao menos um item ao pedido.');
      return;
    }
    if (adminState.waOrderType === 'delivery') {
      if (!dom.waStreet.value.trim() || !dom.waNumber.value.trim() || !dom.waNeighborhoodSelect.value.trim()) {
        alert('Preencha o endereço de entrega (rua, número e selecione o bairro).');
        return;
      }
    }

    const deliveryFee = adminState.waOrderType === 'delivery' ? (Number(dom.waDeliveryFee.value) || 0) : 0;
    const subtotal = adminState.waCart.reduce((s, i) => s + i.subtotal, 0);
    const total = subtotal + deliveryFee;

    const deliveryAddress = adminState.waOrderType === 'delivery' ? {
      street: dom.waStreet.value.trim(),
      number: dom.waNumber.value.trim(),
      neighborhood: dom.waNeighborhoodSelect.value.trim(),
      complement: dom.waComplement.value.trim(),
      reference: dom.waReference.value.trim()
    } : null;

    const orderPayload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      order_type: adminState.waOrderType,
      table_number: null,
      payment_method: dom.waPaymentMethod.value,
      change_for: dom.waPaymentMethod.value === 'dinheiro' && dom.waChangeFor.value ? Number(dom.waChangeFor.value) : null,
      subtotal: subtotal,
      delivery_fee: deliveryFee,
      total: total,
      notes: dom.waGeneralNotes.value.trim(),
      delivery_address: deliveryAddress,
      status: 'novo',
      whatsapp_sent: true,
      items: adminState.waCart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        notes: item.notes || '',
        optionals: [],
        combo_choices: []
      }))
    };

    dom.btnSubmitWhatsappOrder.disabled = true;
    dom.btnSubmitWhatsappOrder.textContent = '⏳ Registrando pedido...';

    try {
      await window.db.createOrder(orderPayload);
      dom.whatsappOrderModal.style.display = 'none';
      adminState.waCart = [];

      adminState.orders = await window.db.getOrders();
      renderOrders();
      renderDashboard();
      renderCashReport();

      alert(`Pedido de ${customerName} registrado com sucesso!\n\nEle já aparece em Pedidos em Tempo Real.`);
    } catch (err) {
      console.error('Erro ao registrar pedido WhatsApp:', err);
      alert('Erro ao registrar o pedido. Tente novamente.');
    } finally {
      dom.btnSubmitWhatsappOrder.disabled = false;
      dom.btnSubmitWhatsappOrder.innerHTML = '<i class="fi fi-brands-whatsapp"></i> Registrar Pedido WhatsApp';
    }
  });

  // ==========================================
  // NAVEGAÇÃO POR ABAS & MENU MOBILE
  // ==========================================
  function closeMobileNav() {
    if (dom.adminSidebar) dom.adminSidebar.classList.remove('mobile-open');
    if (dom.adminMobileNavBackdrop) dom.adminMobileNavBackdrop.classList.remove('active');
  }

  function openMobileNav() {
    if (dom.adminSidebar) dom.adminSidebar.classList.add('mobile-open');
    if (dom.adminMobileNavBackdrop) dom.adminMobileNavBackdrop.classList.add('active');
  }

  if (dom.btnToggleMobileNav) {
    dom.btnToggleMobileNav.addEventListener('click', () => {
      if (dom.adminSidebar && dom.adminSidebar.classList.contains('mobile-open')) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });
  }

  if (dom.btnCloseMobileNav) {
    dom.btnCloseMobileNav.addEventListener('click', closeMobileNav);
  }

  if (dom.adminMobileNavBackdrop) {
    dom.adminMobileNavBackdrop.addEventListener('click', closeMobileNav);
  }

  dom.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.tabButtons.forEach(b => b.classList.remove('active'));
      dom.tabContents.forEach(c => c.style.display = 'none');

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      const targetContent = document.getElementById(`tab-${tabId}`);
      if (targetContent) targetContent.style.display = 'block';

      // Atualiza o texto do botão de menu mobile
      if (dom.adminMobileActiveTabLabel) {
        dom.adminMobileActiveTabLabel.textContent = btn.textContent.trim();
      }

      // Fecha o menu vertical no mobile ao clicar em qualquer aba
      closeMobileNav();

      if (tabId === 'pos') renderSalonTables();
      if (tabId === 'orders') renderOrders();
      if (tabId === 'dashboard') renderDashboard();
      if (tabId === 'products') renderProducts();
      if (tabId === 'categories') renderCategories();
      if (tabId === 'promotions') renderPromotions();
      if (tabId === 'optionals') renderOptionals();
      if (tabId === 'neighborhoods') renderNeighborhoods();
      if (tabId === 'cash-closing') renderCashReport();
    });
  });

  // Filtros de Pedidos
  dom.orderFilterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      dom.orderFilterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      adminState.orderFilter = chip.getAttribute('data-filter');
      renderOrders();
    });
  });

  dom.btnRefreshOrders.addEventListener('click', async () => {
    adminState.orders = await window.db.getOrders();
    renderSalonTables();
    renderOrders();
    renderDashboard();
    renderCashReport();
  });

  // Filtros de busca de produtos
  dom.adminSearchProductInput.addEventListener('input', (e) => {
    adminState.productSearch = e.target.value;
    renderProducts();
  });

  dom.adminFilterCategory.addEventListener('change', (e) => {
    adminState.productCategoryFilter = e.target.value;
    renderProducts();
  });

  // ==========================================
  // ALERTA SONORO DE NOVO PEDIDO (BIP / CAMPAINHA)
  // ==========================================
  let isSoundEnabled = true;
  let audioCtx = null;
  let knownOrderIds = new Set();
  let isFirstLoad = true;

  function playOrderNotificationSound() {
    if (!isSoundEnabled) return;
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!audioCtx) audioCtx = new AudioCtxClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;

      // Nota 1 (Campainha Ding - Tom Alto)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.4, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.55);

      // Nota 2 (Campainha Dong - Harmônico Ressonante)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.50, now + 0.16); // C6
      gain2.gain.setValueAtTime(0, now + 0.16);
      gain2.gain.linearRampToValueAtTime(0.5, now + 0.20);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.16);
      osc2.stop(now + 1.0);
    } catch (e) {
      console.warn('Falha ao reproduzir alerta sonoro:', e);
    }
  }

  function updateSoundButtonUI() {
    if (!dom.btnToggleSound) return;
    if (isSoundEnabled) {
      if (dom.soundIcon) {
        dom.soundIcon.className = 'fi fi-sr-bell';
        dom.soundIcon.style.color = '#d97706';
      }
      if (dom.soundText) dom.soundText.textContent = 'Som Ativo';
      dom.btnToggleSound.title = 'Campainha de novos pedidos ATIVADA (Clique para silenciar)';
    } else {
      if (dom.soundIcon) {
        dom.soundIcon.className = 'fi fi-sr-bell-slash';
        dom.soundIcon.style.color = '#94a3b8';
      }
      if (dom.soundText) dom.soundText.textContent = 'Som Mudo';
      dom.btnToggleSound.title = 'Campainha de novos pedidos MUTADA (Clique para ativar)';
    }
  }

  if (dom.btnToggleSound) {
    dom.btnToggleSound.addEventListener('click', () => {
      isSoundEnabled = !isSoundEnabled;
      updateSoundButtonUI();
      if (isSoundEnabled) {
        playOrderNotificationSound();
      }
    });
  }

  function checkForNewOrdersAndBeep(ordersList) {
    if (!ordersList || !Array.isArray(ordersList)) return;
    
    if (isFirstLoad) {
      ordersList.forEach(o => { if (o?.id) knownOrderIds.add(String(o.id)); });
      isFirstLoad = false;
      return;
    }

    let hasNewIncomingOrder = false;
    ordersList.forEach(o => {
      const oId = String(o?.id);
      if (o?.status === 'novo' && !knownOrderIds.has(oId)) {
        hasNewIncomingOrder = true;
      }
      if (oId) knownOrderIds.add(oId);
    });

    if (hasNewIncomingOrder) {
      playOrderNotificationSound();
    }
  }

  // Sincronização em tempo real entre abas no mesmo navegador
  window.addEventListener('storage', async (e) => {
    if (e.key === 'boydegusta_orders') {
      const fresh = await window.db.getOrders();
      checkForNewOrdersAndBeep(fresh);
      adminState.orders = fresh;
      renderSalonTables();
      renderOrders();
      renderDashboard();
      renderCashReport();
    }
  });

  // Auto-refresh automático a cada 5 segundos no painel administrativo
  setInterval(async () => {
    try {
      const freshOrders = await window.db.getOrders();
      checkForNewOrdersAndBeep(freshOrders);
      if (JSON.stringify(freshOrders) !== JSON.stringify(adminState.orders)) {
        adminState.orders = freshOrders;
        renderSalonTables();
        renderOrders();
        renderDashboard();
        renderCashReport();
      }
    } catch (err) {
      console.warn('Erro no auto-refresh de pedidos:', err);
    }
  }, 5000);

  // Checa autenticação inicial
  checkAuth();
});
