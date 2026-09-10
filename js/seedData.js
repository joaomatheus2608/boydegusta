// ========================================================
// BOYDEGUSTA - DADOS OFICIAIS INICIAIS DO CARDÁPIO
// ========================================================

const INITIAL_SETTINGS = {
  id: 'store-settings',
  name: 'BoyDegusta',
  address: 'Avenida Dom Carlos Coelho, 2211 - Lote 92, Jaboatão dos Guararapes - PE',
  whatsapp: '5581992686946',
  instagram: '@boydegusta',
  delivery_fee: 5.00,
  min_order_value: 10.00,
  store_status_mode: 'auto', // 'auto', 'force_open', 'force_closed'
  closed_message: 'Estamos fechados no momento. Nosso horário de funcionamento é das 18:00 às 23:00.',
  admin_password_hash: null, // Definido via banco de dados Supabase
  pix_key: '5581992686946',
  pix_type: 'Telefone',
  pix_beneficiary: 'BoyDegusta'
};

const INITIAL_OPERATING_HOURS = [
  { day_of_week: 0, day_name: 'Domingo', open_time: '18:00', close_time: '23:00', is_open: true },
  { day_of_week: 1, day_name: 'Segunda-feira', open_time: '18:00', close_time: '23:00', is_open: true },
  { day_of_week: 2, day_name: 'Terça-feira', open_time: '18:00', close_time: '23:00', is_open: true },
  { day_of_week: 3, day_name: 'Quarta-feira', open_time: '18:00', close_time: '23:00', is_open: true },
  { day_of_week: 4, day_name: 'Quinta-feira', open_time: '18:00', close_time: '23:00', is_open: true },
  { day_of_week: 5, day_name: 'Sexta-feira', open_time: '18:00', close_time: '23:00', is_open: true },
  { day_of_week: 6, day_name: 'Sábado', open_time: '18:00', close_time: '23:00', is_open: true }
];

const INITIAL_OPTIONALS = [
  { id: 'opt-1', name: 'Adicional creme cheese', price: 3.00, is_active: true, order_index: 1 },
  { id: 'opt-2', name: 'Adicional Ovo', price: 2.00, is_active: true, order_index: 2 },
  { id: 'opt-3', name: 'Adicional Carne', price: 5.00, is_active: true, order_index: 3 },
  { id: 'opt-4', name: 'Adicional Bacon', price: 3.00, is_active: true, order_index: 4 },
  { id: 'opt-5', name: 'Adicional maionese', price: 3.00, is_active: true, order_index: 5 },
  { id: 'opt-6', name: 'GELEIA DE PIMENTA', price: 3.00, is_active: true, order_index: 6 }
];

const INITIAL_PROMOTIONS = [
  {
    id: 'promo-1',
    name: 'Combo 3 Hambúrgueres por 40,00',
    description: 'Escolha 3 burguers por apenas R$ 40,00',
    price: 40.00,
    required_quantity: 3,
    allowed_items: [
      'Burguer Calabresa e Coalho',
      'Burguer Cheddar e Bacon',
      'Burguer Creme Cheese'
    ],
    is_active: true
  },
  {
    id: 'promo-2',
    name: 'Promoção 2 Beirute por 40,00',
    description: 'Escolha 2 beirutes por apenas R$ 40,00',
    price: 40.00,
    required_quantity: 2,
    allowed_items: [
      '1 Beirute Maminha',
      '1 Beirute Sol',
      '1 Beirute Camarão 3 Queijos'
    ],
    is_active: true
  }
];

const INITIAL_CATEGORIES = [
  { id: 'cat-promo', name: 'Promoções do Boy', slug: 'promocoes-do-boy', order_index: 1, is_active: true },
  { id: 'cat-acomp', name: 'Acompanhamentos do Boy', slug: 'acompanhamentos-do-boy', order_index: 2, is_active: true },
  { id: 'cat-pao', name: 'Pão de Alho do Boy Degusta', slug: 'pao-de-alho-do-boy-degusta', order_index: 3, is_active: true },
  { id: 'cat-adic', name: 'Adicional', slug: 'adicional', order_index: 4, is_active: true },
  { id: 'cat-burguer', name: 'Boy Degusta Burguer', slug: 'boy-degusta-burguer', order_index: 5, is_active: true },
  { id: 'cat-brasa', name: 'Boy Degusta na Brasa', slug: 'boy-degusta-na-brasa', order_index: 6, is_active: true },
  { id: 'cat-beirute', name: 'Beirute Boy Degusta', slug: 'beirute-boy-degusta', order_index: 7, is_active: true },
  { id: 'cat-batata', name: 'Batatas Boy Degusta', slug: 'batatas-boy-degusta', order_index: 8, is_active: true },
  { id: 'cat-bebidas', name: 'Bebidas do Boy', slug: 'bebidas-do-boy', order_index: 9, is_active: true }
];

const INITIAL_PRODUCTS = [
  // 1. Promoções do Boy
  {
    id: 'prod-promo-1',
    category_id: 'cat-promo',
    name: 'Combo 3 Hambúrgueres por 40,00',
    description: 'Escolha 3 burguers por apenas R$ 40,00. Opções: Burguer Calabresa e Coalho, Burguer Cheddar e Bacon, Burguer Creme Cheese.',
    price: 40.00,
    image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
    is_promo: true,
    is_active: true,
    is_available: true,
    promo_id: 'promo-1',
    order_index: 1
  },
  {
    id: 'prod-promo-2',
    category_id: 'cat-promo',
    name: 'Promoção 2 Beirute por 40,00',
    description: 'Escolha 2 beirutes por apenas R$ 40,00. Opções: 1 Beirute Maminha, 1 Beirute Sol, 1 Beirute Camarão 3 Queijos.',
    price: 40.00,
    image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
    is_promo: true,
    is_active: true,
    is_available: true,
    promo_id: 'promo-2',
    order_index: 2
  },

  // 2. Acompanhamentos do Boy
  {
    id: 'prod-acomp-1',
    category_id: 'cat-acomp',
    name: 'Porção Nuggets com fritas',
    description: 'Porção crocante de nuggets de frango acompanhados de batatas fritas.',
    price: 20.00,
    image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 1
  },
  {
    id: 'prod-acomp-2',
    category_id: 'cat-acomp',
    name: 'Anéis de Cebola com fritas',
    description: 'Porção de deliciosos anéis de cebola empanados acompanhados de batatas fritas.',
    price: 20.00,
    image_url: 'https://images.unsplash.com/photo-1639024471287-0351860db52e?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 2
  },

  // 3. Pão de Alho do Boy Degusta
  {
    id: 'prod-pao-1',
    category_id: 'cat-pao',
    name: 'Pão com cupim',
    description: 'Pão bola, cupim desfiado, creme cheese, mussarela, maionese de alho.',
    price: 15.00,
    image_url: 'https://images.unsplash.com/photo-1619860860774-1e2e17343432?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 1
  },
  {
    id: 'prod-pao-2',
    category_id: 'cat-pao',
    name: 'Pão com camarão',
    description: 'Pão bola, file camarão, creme cheese, mussarela, maionese de alho.',
    price: 15.00,
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 2
  },
  {
    id: 'prod-pao-3',
    category_id: 'cat-pao',
    name: 'Pão com maminha',
    description: 'Pão bola, maminha em tiras, creme cheese, mussarela, maionese de alho.',
    price: 15.00,
    image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 3
  },

  // 4. Adicional
  {
    id: 'prod-adic-1',
    category_id: 'cat-adic',
    name: 'Adicional creme cheese',
    description: 'Adicional de creme cheese especial.',
    price: 3.00,
    image_url: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 1
  },
  {
    id: 'prod-adic-2',
    category_id: 'cat-adic',
    name: 'Adicional Ovo',
    description: 'Adicional de ovo frito na chapa.',
    price: 2.00,
    image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 2
  },
  {
    id: 'prod-adic-3',
    category_id: 'cat-adic',
    name: 'Adicional Carne',
    description: 'Adicional de hambúrguer de carne 100% bovina.',
    price: 5.00,
    image_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 3
  },
  {
    id: 'prod-adic-4',
    category_id: 'cat-adic',
    name: 'Adicional Bacon',
    description: 'Adicional de tiras de bacon crocante.',
    price: 3.00,
    image_url: 'https://images.unsplash.com/photo-1606851094655-b2593a9af63f?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 4
  },
  {
    id: 'prod-adic-5',
    category_id: 'cat-adic',
    name: 'Adicional maionese',
    description: 'Adicional de maionese artesanal da casa.',
    price: 3.00,
    image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 5
  },
  {
    id: 'prod-adic-6',
    category_id: 'cat-adic',
    name: 'GELEIA DE PIMENTA',
    description: 'Adicional de geleia de pimenta agridoce especial.',
    price: 3.00,
    image_url: 'https://images.unsplash.com/photo-1590759668628-05b0fc34bb70?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 6
  },

  // 5. Boy Degusta Burguer (Preços a definir no painel)
  {
    id: 'prod-burguer-1',
    category_id: 'cat-burguer',
    name: 'X Burguer',
    description: 'Pão bola, burguer, queijo cheddar, coalho, tomate, cebola caramelizada, maionese artesanal.',
    price: null,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 1
  },
  {
    id: 'prod-burguer-2',
    category_id: 'cat-burguer',
    name: 'X Egg',
    description: 'Pão bola, burguer, ovo, coalho, tomate, cebola caramelizada, maionese artesanal.',
    price: null,
    image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 2
  },
  {
    id: 'prod-burguer-3',
    category_id: 'cat-burguer',
    name: 'Burguer Calabresa e Coalho',
    description: 'Pão bola, burguer, calabresa, coalho, tomate, cebola caramelizada, maionese artesanal.',
    price: null,
    image_url: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 3
  },
  {
    id: 'prod-burguer-4',
    category_id: 'cat-burguer',
    name: 'Burguer Cheddar e Bacon',
    description: 'Pão bola, burguer, queijo cheddar, bacon, tomate, cebola caramelizada, maionese artesanal.',
    price: null,
    image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 4
  },
  {
    id: 'prod-burguer-5',
    category_id: 'cat-burguer',
    name: 'Burguer Creme Cheese',
    description: 'Pão bola, burguer, creme cheese, bacon, tomate, cebola caramelizada, maionese artesanal.',
    price: null,
    image_url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 5
  },

  // 6. Boy Degusta na Brasa (Preços a definir no painel)
  {
    id: 'prod-brasa-1',
    category_id: 'cat-brasa',
    name: 'Burguer Maminha',
    description: 'Pão bola, burguer na brasa, porção maminha em tiras, queijo mussarela, bacon, creme cheese, tomate, cebola caramelizada, maionese artesanal.',
    price: null,
    image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 1
  },
  {
    id: 'prod-brasa-2',
    category_id: 'cat-brasa',
    name: 'Burguer Camarão',
    description: 'Pão bola, burguer na brasa, file de camarão, queijo mussarela, creme cheese, tomate, cebola caramelizada, maionese artesanal.',
    price: null,
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 2
  },
  {
    id: 'prod-brasa-3',
    category_id: 'cat-brasa',
    name: 'Brasa com geleia de bacon',
    description: 'Pão bola, burguer na brasa, mussarela, cheddar, geleia de bacon, anéis de cebola, tomate, cebola caramelizada e maionese artesanal.',
    price: null,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 3
  },
  {
    id: 'prod-brasa-4',
    category_id: 'cat-brasa',
    name: 'Brasa Cupim e Geleia de Pimenta',
    description: 'Pão bola, burguer na brasa, mussarela, creme cheese, cupim desfiado, geleia pimenta, tomate, cebola caramelizada e maionese artesanal.',
    price: null,
    image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 4
  },
  {
    id: 'prod-brasa-5',
    category_id: 'cat-brasa',
    name: 'Burguer Romeu e Julieta',
    description: 'Pão bola, burguer na brasa, mussarela, queijo coalho, geleia de goiabada, bacon, tomate, cebola caramelizada e maionese artesanal.',
    price: null,
    image_url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 5
  },

  // 7. Beirute Boy Degusta
  {
    id: 'prod-beirute-1',
    category_id: 'cat-beirute',
    name: '1 Beirute Maminha',
    description: 'Pão sírio, maminha, bacon, queijo cheddar, creme cheese, calabresa, ovo, tomate, cebola caramelizada, maionese artesanal, acompanha fritas.',
    price: 28.00,
    image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 1
  },
  {
    id: 'prod-beirute-2',
    category_id: 'cat-beirute',
    name: '1 Beirute Sol',
    description: 'Pão sírio, carne de sol, queijo cheddar, queijo coalho, calabresa, ovo, tomate, cebola caramelizada, maionese artesanal, acompanha fritas.',
    price: 28.00,
    image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 2
  },
  {
    id: 'prod-beirute-3',
    category_id: 'cat-beirute',
    name: '1 Beirute Camarão 3 Queijos',
    description: 'Pão抗 sírio, camarão, queijo cheddar, queijo coalho, creme cheese, tomate, cebola caramelizada, maionese artesanal, acompanha fritas.',
    price: 28.00,
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 3
  },

  // 8. Batatas Boy Degusta
  {
    id: 'prod-batata-1',
    category_id: 'cat-batata',
    name: 'Batata Tradicional',
    description: 'Batata 300g, queijo ralado, maionese artesanal.',
    price: 12.00,
    image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 1
  },
  {
    id: 'prod-batata-2',
    category_id: 'cat-batata',
    name: 'Batata Cheddar com Bacon',
    description: 'Batata 300g, bacon recheado com cheddar e maionese artesanal.',
    price: 18.00,
    image_url: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 2
  },
  {
    id: 'prod-batata-3',
    category_id: 'cat-batata',
    name: 'Batata Creme Chesse com Camarão',
    description: 'Batata 300g, recheada com bastante cheese e camarão.',
    price: 22.00,
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 3
  },
  {
    id: 'prod-batata-4',
    category_id: 'cat-batata',
    name: 'Batata Carne de Sol com Coalho',
    description: 'Batata 300g, recheada com queijo coalho e carne de sol.',
    price: 22.00,
    image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 4
  },

  // 9. Bebidas do Boy
  {
    id: 'prod-bebida-1',
    category_id: 'cat-bebidas',
    name: 'Coca-cola lata 350 ml',
    description: 'Refrigerante Coca-cola lata 350ml gelada.',
    price: 7.00,
    image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 1
  },
  {
    id: 'prod-bebida-2',
    category_id: 'cat-bebidas',
    name: 'Antártica lata 350 ml',
    description: 'Refrigerante Guaraná Antártica lata 350ml gelada.',
    price: 7.00,
    image_url: 'https://images.unsplash.com/photo-1581098365948-6a5a912b7a49?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 2
  },
  {
    id: 'prod-bebida-3',
    category_id: 'cat-bebidas',
    name: 'Antártica 1 litro',
    description: 'Refrigerante Guaraná Antártica garrafa 1L gelada.',
    price: 10.00,
    image_url: 'https://images.unsplash.com/photo-1581098365948-6a5a912b7a49?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 3
  },
  {
    id: 'prod-bebida-4',
    category_id: 'cat-bebidas',
    name: 'Água sem Gás',
    description: 'Água mineral sem gás 500ml.',
    price: 3.00,
    image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 4
  },
  {
    id: 'prod-bebida-5',
    category_id: 'cat-bebidas',
    name: 'H2o Limoneto',
    description: 'Bebida levemente gaseificada sabor limoneto 500ml.',
    price: 8.00,
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 5
  },
  {
    id: 'prod-bebida-6',
    category_id: 'cat-bebidas',
    name: 'Schweppes',
    description: 'Refrigerante Schweppes Citrus lata 350ml.',
    price: 8.00,
    image_url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 6
  },
  {
    id: 'prod-bebida-7',
    category_id: 'cat-bebidas',
    name: 'Sucos',
    description: 'Copo de suco natural da fruta gelado.',
    price: 7.00,
    image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 7
  },
  {
    id: 'prod-bebida-8',
    category_id: 'cat-bebidas',
    name: 'Pepsi Lata 350 ml',
    description: 'Refrigerante Pepsi lata 350ml gelada.',
    price: 7.00,
    image_url: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 8
  },
  {
    id: 'prod-bebida-9',
    category_id: 'cat-bebidas',
    name: 'Coca-Zero lata 350 ml',
    description: 'Refrigerante Coca-cola Zero açúcar lata 350ml gelada.',
    price: 7.00,
    image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 9
  },
  {
    id: 'prod-bebida-10',
    category_id: 'cat-bebidas',
    name: 'Pepsi 1 litro',
    description: 'Refrigerante Pepsi garrafa 1L gelada.',
    price: 10.00,
    image_url: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 10
  },
  {
    id: 'prod-bebida-11',
    category_id: 'cat-bebidas',
    name: 'JARRA SUCO',
    description: 'Jarra de suco natural da fruta 1 Litro.',
    price: 15.00,
    image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
    is_promo: false,
    is_active: true,
    is_available: true,
    order_index: 11
  }
];

// 10. Bairros e Taxas de Entrega Cadastrados (Conforme fotos SweetPDV)
const INITIAL_NEIGHBORHOODS = [
  { id: 'bairro-1', name: 'Lote 23', delivery_fee: 13.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-2', name: 'Lote 56', delivery_fee: 10.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-3', name: 'Lote 92', delivery_fee: 5.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-4', name: 'Malvina', delivery_fee: 10.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-5', name: 'Manassu', delivery_fee: 13.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-6', name: 'Moenda de Bronze', delivery_fee: 7.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-7', name: 'Padre Roma', delivery_fee: 10.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-8', name: 'Quadro', delivery_fee: 10.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-9', name: 'Rocha Negra', delivery_fee: 8.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-10', name: 'Santo Aleixo', delivery_fee: 10.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-11', name: 'Santo Antonio', delivery_fee: 7.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-12', name: 'Socorro', delivery_fee: 13.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-13', name: 'Suassuna', delivery_fee: 10.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-14', name: 'Sucupira', delivery_fee: 15.00, delivery_time_min: 90, is_active: true },
  { id: 'bairro-15', name: 'Vila Natal', delivery_fee: 10.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-16', name: 'Vila Piedade', delivery_fee: 13.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-17', name: 'Vila Rica', delivery_fee: 6.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-18', name: 'Vila Rica / Boa Esperança', delivery_fee: 8.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-19', name: 'Vista Alegre', delivery_fee: 10.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-20', name: 'Centro', delivery_fee: 8.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-21', name: 'Cavaleiro', delivery_fee: 12.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-22', name: 'Curado', delivery_fee: 15.00, delivery_time_min: 90, is_active: true },
  { id: 'bairro-23', name: 'Floriano', delivery_fee: 10.00, delivery_time_min: 60, is_active: true },
  { id: 'bairro-24', name: 'Bulhões', delivery_fee: 10.00, delivery_time_min: 60, is_active: true }
];

// 11. Entregadores Oficiais Cadastrados
const INITIAL_COURIERS = [
  { id: 'courier-1', name: 'Paulo', phone: '', is_active: true },
  { id: 'courier-2', name: 'Marcos', phone: '', is_active: true },
  { id: 'courier-3', name: 'Hernandes', phone: '', is_active: true }
];

// Formatador de Moeda Brasileira
function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value) || value === '') {
    return 'Consulte';
  }
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

// Sanitização e Proteção contra XSS
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Exporta globalmente
window.INITIAL_SETTINGS = INITIAL_SETTINGS;
window.INITIAL_OPERATING_HOURS = INITIAL_OPERATING_HOURS;
window.INITIAL_OPTIONALS = INITIAL_OPTIONALS;
window.INITIAL_PROMOTIONS = INITIAL_PROMOTIONS;
window.INITIAL_CATEGORIES = INITIAL_CATEGORIES;
window.INITIAL_PRODUCTS = INITIAL_PRODUCTS;
window.INITIAL_NEIGHBORHOODS = INITIAL_NEIGHBORHOODS;
window.INITIAL_COURIERS = INITIAL_COURIERS;
window.formatCurrency = formatCurrency;
window.escapeHtml = escapeHtml;


