document.addEventListener('DOMContentLoaded', () => {
  // Enlace con el servidor Backend de Node.js (XAMPP MySQL)
  const API_URL = '/api';
  let usuarioLogueado = null; // Guardará el usuario de la BD
  let cantidadSeleccionada = 1; // Manejo dinámico de cantidad

  // 🌟 FUNCIÓN ÚNICA PARA OBTENER EL ID DE USUARIO
  function obtenerIdUsuarioValido() {
    return (usuarioLogueado && usuarioLogueado.id < 1000000) ? usuarioLogueado.id : 1;
  }

  const appShell = document.getElementById('appShell');
  const roleScreen = document.getElementById('roleScreen');
  const btnRoleUsuario = document.getElementById('btnRoleUsuario');
  const btnRoleAdmin = document.getElementById('btnRoleAdmin');
  const backToRoleLink = document.getElementById('backToRoleLink');
  let rolSeleccionado = null; // 'cliente' | 'negocio', elegido en la pantalla de rol
  const homeScreen = document.querySelector('.home-screen');
  const detailScreen = document.getElementById('detailScreen');
  const confirmationScreen = document.getElementById('confirmationScreen');
  const ticketScreen = document.getElementById('ticketScreen');
  const reservationsScreen = document.getElementById('reservationsScreen');
  const profileScreen = document.getElementById('profileScreen');
  const historyScreen = document.getElementById('historyScreen');
  const adminScreen = document.getElementById('adminScreen');
  const ratingScreen = document.getElementById('ratingScreen'); // <-- AGREGA ESTA
  const helpScreen = document.getElementById('helpScreen');
  const settingsScreen = document.getElementById('settingsScreen');
  const ratingCardsList = document.getElementById('ratingCardsList');
  const loginForm = document.querySelector('.login-form');
  const categoryRow = document.getElementById('categoryRow');
  const filterChips = document.querySelectorAll('.filter-chip');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const searchInput = document.getElementById('searchInput');
  const locationPill = document.getElementById('locationPill');
  const locationLabel = document.getElementById('locationLabel');
  const cardsList = document.getElementById('cardsList');
  const resultsTitle = document.getElementById('resultsTitle');
  const resultsSubtitle = document.getElementById('resultsSubtitle');
  const filtersToggle = document.getElementById('filtersToggle');
  const filterRow = document.getElementById('filterRow');
  const backToHomeBtn = document.getElementById('backToHomeBtn');
  const reserveFooterBtn = document.getElementById('reserveFooterBtn');
  const backToDetailBtn = document.getElementById('backToDetailBtn');
  const confirmTerms = document.getElementById('confirmTerms');
  const confirmReservationBtn = document.getElementById('confirmReservationBtn');
  const ticketQr = document.getElementById('ticketQr');
  const ticketCode = document.getElementById('ticketCode');
  const ticketUser = document.getElementById('ticketUser');
  const ticketBusiness = document.getElementById('ticketBusiness');
  const ticketDate = document.getElementById('ticketDate');
  const ticketLimit = document.getElementById('ticketLimit');
  const ticketLocationBtn = document.getElementById('ticketLocationBtn');
  const ticketShareBtn = document.getElementById('ticketShareBtn');
  const ticketSaveBtn = document.querySelector('.ticket-save-btn');
  const navItems = document.querySelectorAll('.nav-item');
  const profileItems = document.querySelectorAll('.profile-item');

  // Referencias seguras para el selector de cantidad
  const getBtnMinus = () => document.getElementById('btnMinus');
  const getBtnPlus = () => document.getElementById('btnPlus');
  const getQuantityCount = () => document.getElementById('quantityCount');

  // Referencias a botones de Login Social
  const btnGoogle = document.querySelector('.btn-google');
  const btnFacebook = document.querySelector('.btn-facebook');

  const packItems = [
    {
      id: 1,
      business: 'Panadería El Trigo de Oro',
      category: 'Panadería',
      rating: '4.8',
      originalPrice: 35,
      finalPrice: 22.5,
      remainingPacks: 0,
      description: 'Bolsas de pan recién horneado, medialunas y panes integrales listos para disfrutar.',
      schedule: '18:30 - 19:30',
      impact: '0.8kg CO2 evitados',
      address: 'Av. Benavides 210, Miraflores',
      coordinates: '-12.1175,-77.0288',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 2,
      business: 'Café Verde',
      category: 'Cafés',
      rating: '4.7',
      originalPrice: 18,
      finalPrice: 10,
      remainingPacks: 0,
      description: 'Cafés especiales, medialunas y bocaditos perfectos para la tarde.',
      schedule: '16:00 - 19:00',
      impact: '0.4kg CO2 evitados',
      address: 'Jr. de la Unión 145, Centro',
      coordinates: '-12.0464,-77.0428',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 3,
      business: 'Jugo Natural del Barrio',
      category: 'Bebidas',
      rating: '4.9',
      originalPrice: 16,
      finalPrice: 9.5,
      remainingPacks: 0,
      description: 'Jugos frescos, smoothies y bowls de fruta para compartir.',
      schedule: '15:30 - 18:30',
      impact: '0.3kg CO2 evitados',
      address: 'Calle Las Flores 88, Surco',
      coordinates: '-12.1353,-76.9994',
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 4,
      business: 'Sabor de la Casa',
      category: 'Comidas',
      rating: '4.6',
      originalPrice: 28,
      finalPrice: 17.5,
      remainingPacks: 8,
      description: 'Platos preparados con ingredientes del día y acompañamientos caseros.',
      schedule: '20:00 - 22:00',
      impact: '1.1kg CO2 evitados',
      address: 'Av. Brasil 123, Barranco',
      coordinates: '-12.1468,-77.0207',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 5,
      business: 'Dulce Tentación',
      category: 'Postres',
      rating: '4.8',
      originalPrice: 22,
      finalPrice: 13,
      remainingPacks: 0,
      description: 'Postres artesanales y cupcakes recién horneados para llevar.',
      schedule: '17:00 - 20:00',
      impact: '0.5kg CO2 evitados',
      address: 'Pasaje San Martín 44, Pueblo Libre',
      coordinates: '-12.0714,-77.0711',
      image: 'https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?auto=format&fit=crop&w=900&q=80'
    },
    {
      id: 6,
      business: 'Baguettes & Más',
      category: 'Panadería',
      rating: '4.5',
      originalPrice: 20,
      finalPrice: 12,
      remainingPacks: 7,
      description: 'Baguettes, croissants y panes de campo ideales para la hora del té.',
      schedule: '19:00 - 21:00',
      impact: '0.6kg CO2 evitados',
      address: 'Calle Los Pinos 399, San Isidro',
      coordinates: '-12.0997,-77.0357',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80'
    }
  ];

  let activeCategory = 'Todos';
  let searchQuery = '';
  let selectedPack = packItems[0];
  let currentNavView = 'home';

  function gestionarVisibilidadNavbar(view) {
    const bottomNavbar = document.querySelector('.bottom-nav');
    if (!bottomNavbar) return;

    // Se usa una clase (con !important) en vez de style.display inline,
    // porque el CSS del navbar tiene "display: flex !important" y un
    // !important en la hoja de estilos le gana a un estilo inline sin
    // !important: el navbar seguía visible en login aunque JS pusiera 'none'.
    if (view === 'login' || view === 'admin' || !usuarioLogueado) {
      bottomNavbar.classList.add('nav-oculto');
    } else {
      bottomNavbar.classList.remove('nav-oculto');
    }
  }

  function updateBottomNav(view) {
    navItems.forEach((item) => {
      item.classList.toggle('active', item.dataset.view === view);
    });
  }

  // ==========================================================================
  // 🎯 REPARACIÓN DE CONTROL DE VISTAS (LIBERACIÓN DE EVENTOS DE PUNTERO)
  // ==========================================================================
  function setActiveView(view) {
    if (!appShell) return;

    // 1. Limpiar todas las clases de vista del contenedor principal
    appShell.classList.remove('show-login', 'show-home', 'show-detail', 'show-confirmation', 'show-ticket', 'show-reservations', 'show-profile', 'show-history', 'show-admin');
    gestionarVisibilidadNavbar(view);

    // 2. Inyectar la clase exacta para activar opacidad y punteros en CSS
    if (view === 'login') {
      appShell.classList.add('show-login');
    } else if (view === 'home') {
      appShell.classList.add('show-home');
      currentNavView = 'home';
    } else if (view === 'detail') {
      appShell.classList.add('show-detail');
    } else if (view === 'confirmation') {
      appShell.classList.add('show-confirmation');
    } else if (view === 'ticket') {
      appShell.classList.add('show-ticket');
    } else if (view === 'reservations') {
      appShell.classList.add('show-reservations');
      currentNavView = 'reservations';
    } else if (view === 'profile') {
      appShell.classList.add('show-profile');
      currentNavView = 'profile';
    } else if (view === 'history') {
      appShell.classList.add('show-history');
    } else if (view === 'rating') {
      appShell.classList.add('show-profile');
    } else if (view === 'help') {
      appShell.classList.add('show-profile');
    } else if (view === 'settings') {
      appShell.classList.add('show-profile');
    } else if (view === 'admin') {
      appShell.classList.add('show-admin');
    }

    // 3. Forzar desaparición absoluta del Splash
    const splashScreen = document.querySelector('.splash-screen');
    if (splashScreen) {
      if (view !== 'login') {
        splashScreen.style.opacity = '0';
        splashScreen.style.pointerEvents = 'none';
        splashScreen.hidden = true;
      } else {
        splashScreen.hidden = false;
      }
    }

    // 4. Sincronización nativa de visibilidad (Elimina la propiedad hidden en Home para evitar choques)
    if (homeScreen) homeScreen.removeAttribute('hidden'); 
    if (detailScreen) detailScreen.hidden = view !== 'detail';
    if (confirmationScreen) confirmationScreen.hidden = view !== 'confirmation';
    if (ticketScreen) ticketScreen.hidden = view !== 'ticket';
    if (reservationsScreen) reservationsScreen.hidden = view !== 'reservations';
    if (profileScreen) profileScreen.hidden = view !== 'profile';
    if (historyScreen) historyScreen.hidden = view !== 'history';
    if (ratingScreen) ratingScreen.hidden = view !== 'rating';
    if (helpScreen) helpScreen.hidden = view !== 'help';
    if (settingsScreen) settingsScreen.hidden = view !== 'settings';
    if (adminScreen) adminScreen.hidden = view !== 'admin';

    updateBottomNav(currentNavView);
  }
  // 🌟 Muestra la pantalla de "¿Cómo deseas ingresar hoy?" (roleScreen), oculta el splash
  function mostrarPantallaDeRol() {
    if (!appShell) return;
    appShell.classList.remove('show-login');
    const splashScreen = document.querySelector('.splash-screen');
    if (splashScreen) {
      splashScreen.style.opacity = '0';
      splashScreen.style.pointerEvents = 'none';
      splashScreen.hidden = true;
    }
    if (roleScreen) roleScreen.hidden = false;
    rolSeleccionado = null;
    gestionarVisibilidadNavbar('login');
  }

  if (appShell) {
    gestionarVisibilidadNavbar('login');
    window.setTimeout(() => {
      if (roleScreen) {
        mostrarPantallaDeRol();
      } else {
        appShell.classList.add('show-login');
      }
    }, 1800);
  }

  // 🌟 Selección de rol: el cliente y el negocio comparten el mismo formulario de
  // login (el rol real lo decide la BD en /api/login), esta pantalla solo
  // mejora la experiencia y ajusta el mensaje de bienvenida.
  function irALoginComoRol(rol) {
    rolSeleccionado = rol;
    if (roleScreen) roleScreen.hidden = true;
    if (appShell) appShell.classList.add('show-login');
    mostrarCardDeAuth(loginCard);

    const loginTagline = document.querySelector('.login-screen .welcome-text');
    if (loginTagline) {
      loginTagline.textContent = rol === 'negocio'
        ? 'Ingresa con tu cuenta de negocio para gestionar tus SamiPacks.'
        : 'Únete a la comunidad de SamiPacks y salva deliciosa comida hoy.';
    }
  }

  if (btnRoleUsuario) {
    btnRoleUsuario.addEventListener('click', () => irALoginComoRol('cliente'));
  }
  if (btnRoleAdmin) {
    btnRoleAdmin.addEventListener('click', () => irALoginComoRol('negocio'));
  }
  if (backToRoleLink) {
    backToRoleLink.addEventListener('click', (event) => {
      event.preventDefault();
      mostrarPantallaDeRol();
    });
  }

// ==========================================================================
  // 🚀 FUNCIÓN RENDER CARDS CORREGIDA CON DESBLOQUEO DE SCROLL
  // ==========================================================================

  // Quita tildes/mayúsculas para que "cafe" encuentre "Café" y viceversa
  function normalizarTexto(texto) {
    return (texto || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  // ==========================================================================
  // 🎛️ FILTROS AVANZADOS: Distancia, Precio, Descuento, Disponibilidad, Hora máxima
  // ==========================================================================
  const HORA_MAXIMA_FILTRO = '20:00'; // el chip "Hora máxima" muestra packs que cierran a esta hora o antes
  const DESCUENTO_MINIMO_FILTRO = 40; // el chip "Descuento" muestra packs con 40% de descuento o más
  const UBICACION_REFERENCIA = { lat: -12.1191, lon: -77.0292 }; // Miraflores, Lima (respaldo sin geolocalización)
  let userCoords = null; // se completa si el usuario acepta compartir su ubicación

  function obtenerFiltrosActivos() {
    const activos = new Set();
    filterChips.forEach((chip) => {
      if (chip.classList.contains('active') && chip.dataset.filter) {
        activos.add(chip.dataset.filter);
      }
    });
    return activos;
  }

  function calcularDescuentoPorcentaje(item) {
    if (!item.originalPrice) return 0;
    return ((item.originalPrice - item.finalPrice) / item.originalPrice) * 100;
  }

  function minutosDesdeTexto(horaTexto) {
    const [h, m] = (horaTexto || '').split(':').map(Number);
    if (Number.isNaN(h)) return null;
    return h * 60 + (m || 0);
  }

  function horaFinDelPackEnMinutos(schedule) {
    const partes = (schedule || '').split('-');
    return minutosDesdeTexto((partes[1] || '').trim());
  }

  function distanciaKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function distanciaDelPack(item) {
    if (!item.coordinates) return Infinity;
    const [lat, lon] = item.coordinates.split(',').map(Number);
    const origen = userCoords || UBICACION_REFERENCIA;
    return distanciaKm(origen.lat, origen.lon, lat, lon);
  }

  // ==========================================================================
  // 🌐 CONECTAR EL HOME A LA BASE DE DATOS REAL (GET /api/samipacks)
  // ==========================================================================
  // Antes el Home mostraba siempre el arreglo de ejemplo `packItems`. Esta
  // función reemplaza ese contenido con lo que realmente existe en MySQL,
  // conservando la misma referencia del arreglo (packItems.length = 0 + push)
  // para no romper otras partes del código que ya lo usan (selectedPack, etc).
  async function cargarSamipacksDesdeBD() {
    try {
      const response = await fetch(`${API_URL}/samipacks`);
      const data = await response.json();

      if (data.success && Array.isArray(data.packs)) {
        packItems.length = 0;
        data.packs.forEach((row) => {
          packItems.push({
            id: row.id,
            business: row.negocio,
            category: row.category,
            producto: row.producto,
            rating: row.rating || '4.8', // la BD todavía no guarda calificación promedio
            originalPrice: Number(row.originalPrice),
            finalPrice: Number(row.finalPrice),
            remainingPacks: Number(row.remainingPacks),
            description: row.description,
            schedule: row.schedule,
            impact: row.impact || 'Ayudas a reducir el desperdicio de alimentos',
            address: row.address,
            coordinates: row.coordinates,
            image: row.image
          });
        });
      } else {
        console.warn('No se pudieron cargar los SamiPacks desde la BD.');
      }
    } catch (err) {
      console.error('Error conectando al backend para /api/samipacks:', err);
    } finally {
      updateCategoryButtons();
      renderCards();
    }
  }

  function renderCards() {
    const query = normalizarTexto(searchQuery);
    const filtrosActivos = obtenerFiltrosActivos();

    let filteredItems = packItems
      .filter((item) => activeCategory === 'Todos' || item.category === activeCategory)
      .filter((item) => {
        if (!query) return true;
        const texto = normalizarTexto(`${item.business} ${item.category} ${item.producto || ''} ${item.description}`);
        return texto.includes(query);
      });

    // --- Filtros de inclusión ---
    if (filtrosActivos.has('disponibilidad')) {
      filteredItems = filteredItems.filter((item) => item.remainingPacks > 0);
    }
    if (filtrosActivos.has('descuento')) {
      filteredItems = filteredItems.filter((item) => calcularDescuentoPorcentaje(item) >= DESCUENTO_MINIMO_FILTRO);
    }
    if (filtrosActivos.has('hora-maxima')) {
      const limiteMin = minutosDesdeTexto(HORA_MAXIMA_FILTRO);
      filteredItems = filteredItems.filter((item) => {
        const finMin = horaFinDelPackEnMinutos(item.schedule);
        return finMin === null ? true : finMin <= limiteMin;
      });
    }

    // --- Orden: "Precio" manda si está activo; si no, se ordena por "Distancia" ---
    if (filtrosActivos.has('precio')) {
      filteredItems = filteredItems.slice().sort((a, b) => a.finalPrice - b.finalPrice);
    } else if (filtrosActivos.has('distancia')) {
      filteredItems = filteredItems.slice().sort((a, b) => distanciaDelPack(a) - distanciaDelPack(b));
    }

    let countLabel;
    if (query) {
      countLabel = filteredItems.length > 0
        ? `Encontramos ${filteredItems.length} SamiPacks para "${searchQuery}"`
        : `Sin resultados para "${searchQuery}"`;
    } else {
      countLabel = activeCategory === 'Todos'
        ? `Encontramos ${filteredItems.length} SamiPacks deliciosos cerca de ti`
        : `Encontramos ${filteredItems.length} SamiPacks de ${activeCategory.toLowerCase()} cerca de ti`;
    }

    if (resultsTitle) resultsTitle.textContent = countLabel;
    if (resultsSubtitle) {
      if (filteredItems.length > 0) {
        resultsSubtitle.textContent = 'Explora opciones listas para reservar hoy';
      } else if (filtrosActivos.size > 0) {
        resultsSubtitle.textContent = 'Ningún SamiPack cumple con los filtros avanzados seleccionados';
      } else {
        resultsSubtitle.textContent = 'Intenta con otra categoría o palabra de búsqueda';
      }
    }

    // Solo mostrar "Limpiar filtros" cuando realmente hay algo activo que pueda
    // estar ocultando resultados (búsqueda, categoría distinta de "Todos", o un
    // filtro de inclusión como Descuento/Disponibilidad/Hora máxima). "Distancia"
    // y "Precio" no cuentan porque solo ordenan, no ocultan nada.
    if (clearFiltersBtn) {
      const hayFiltroDeInclusion = filtrosActivos.has('descuento') || filtrosActivos.has('disponibilidad') || filtrosActivos.has('hora-maxima');
      const hayAlgoActivo = Boolean(query) || activeCategory !== 'Todos' || hayFiltroDeInclusion;
      clearFiltersBtn.hidden = !hayAlgoActivo;
    }

    if (!cardsList) return;

    // Inyectar las tarjetas en el contenedor
    cardsList.innerHTML = filteredItems.map((item) => {
      const isSoldOut = item.remainingPacks <= 0;
      const isLowStock = !isSoldOut && item.remainingPacks <= 3;
      const stockLabel = isSoldOut ? 'Agotado' : `Quedan ${item.remainingPacks}`;
      const stockClass = isSoldOut ? 'sold-out-pill' : (isLowStock ? 'low-stock' : '');
      const distanciaTexto = distanciaDelPack(item).toFixed(1);

      return `
      <article class="pack-card${isSoldOut ? ' sold-out' : ''}" data-id="${item.id}">
        <img class="pack-image" src="${item.image}" alt="${item.business}" />
        <span class="stock-pill ${stockClass}">
          <span class="material-icons">inventory_2</span>
          ${stockLabel}
        </span>
        <div class="pack-content">
          <div class="card-top">
            <div class="card-top-titles">
              <h4>${item.producto || item.category}</h4>
              <p class="pack-business-name">${item.business}</p>
            </div>
            <div class="rating">
              <span class="material-icons">star</span>
              <span>${item.rating}</span>
            </div>
          </div>
          <div class="pack-meta-row">
            <span class="material-icons">place</span>
            <span>${distanciaTexto} km</span>
            <span class="meta-dot">•</span>
            <span class="material-icons">schedule</span>
            <span>${item.schedule}</span>
          </div>
          <div class="price-row">
            <span class="old-price">S/ ${item.originalPrice.toFixed(2)}</span>
            <span class="new-price">S/ ${item.finalPrice.toFixed(2)}</span>
          </div>
          <button class="reserve-btn" type="button" data-id="${item.id}" ${isSoldOut ? 'disabled' : ''}>
            ${isSoldOut ? 'Agotado' : 'Ver detalles'}
          </button>
        </div>
      </article>
    `;
    }).join('');

    // Asignar listeners individuales a los botones recién generados
    const reserveButtons = cardsList.querySelectorAll('.reserve-btn');
    reserveButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const packId = Number(button.dataset.id);
        const pack = packItems.find((item) => item.id === packId);
        if (pack && pack.remainingPacks > 0) {
          showDetail(pack);
        }
      });
    });

    // 🌟 TRUCO CRÍTICO DE DESBLOQUEO: Fuerza al contenedor a recalcular el scroll
    setTimeout(() => {
      cardsList.scrollTop = 0;
      cardsList.style.display = 'none';
      cardsList.offsetHeight; // Truco de reflujo del navegador (reflow)
      cardsList.style.display = 'grid';
    }, 50);
  }

  function updateCategoryButtons() {
    if (!categoryRow) return;
    const buttons = categoryRow.querySelectorAll('.category-btn');
    buttons.forEach((button) => {
      button.classList.toggle('active', button.dataset.category === activeCategory);
    });
  }

  function showDetail(pack) {
    selectedPack = pack;
    cantidadSeleccionada = 1;

    const detailImage = document.getElementById('detailImage');
    const detailCategory = document.getElementById('detailCategory');
    const detailBusiness = document.getElementById('detailBusiness');
    const detailRating = document.getElementById('detailRating');
    const detailRemaining = document.getElementById('detailRemaining');
    const detailDescription = document.getElementById('detailDescription');
    const detailOriginalPrice = document.getElementById('detailOriginalPrice');
    const detailFinalPrice = document.getElementById('detailFinalPrice');
    const detailSavings = document.getElementById('detailSavings');
    const detailSchedule = document.getElementById('detailSchedule');
    const detailImpact = document.getElementById('detailImpact');
    const detailAddress = document.getElementById('detailAddress');
    const detailMapFrame = document.getElementById('detailMapFrame');
    const detailMapLink = document.getElementById('detailMapLink');

    const isSoldOut = pack.remainingPacks <= 0;

    if (detailImage) detailImage.src = pack.image;
    if (detailCategory) detailCategory.textContent = pack.producto || pack.category;
    if (detailBusiness) detailBusiness.textContent = pack.business;
    if (detailRating) detailRating.textContent = pack.rating;
    if (detailRemaining) {
      detailRemaining.textContent = isSoldOut ? '¡Agotado!' : `¡Quedan ${pack.remainingPacks} packs!`;
      detailRemaining.classList.toggle('sold-out-tag', isSoldOut);
    }
    if (detailDescription) detailDescription.textContent = pack.description;
    if (detailOriginalPrice) detailOriginalPrice.textContent = `S/ ${pack.originalPrice.toFixed(2)}`;
    if (detailFinalPrice) detailFinalPrice.textContent = `S/ ${pack.finalPrice.toFixed(2)}`;
    if (detailSavings) detailSavings.textContent = `Ahorras: S/ ${(pack.originalPrice - pack.finalPrice).toFixed(2)}`;
    if (detailSchedule) detailSchedule.textContent = pack.schedule;
    if (detailImpact) detailImpact.textContent = pack.impact;
    if (detailAddress) detailAddress.textContent = pack.address;
    if (detailMapFrame) detailMapFrame.src = `https://maps.google.com/maps?q=${pack.coordinates}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    if (detailMapLink) detailMapLink.href = `https://maps.google.com/?q=${pack.coordinates}`;

    cantidadSeleccionada = isSoldOut ? 0 : 1;
    const countEl = getQuantityCount();
    if (countEl) countEl.textContent = cantidadSeleccionada;

    if (reserveFooterBtn) {
      reserveFooterBtn.disabled = isSoldOut;
      reserveFooterBtn.innerHTML = isSoldOut
        ? 'SamiPack agotado'
        : `Reservar SamiPack <span class="material-icons">arrow_forward</span>`;
    }

    setActiveView('detail');
    configurarEventosCantidad(); // Vincular eventos al renderizar la pantalla
  }

  function configurarEventosCantidad() {
    const btnMinus = getBtnMinus();
    const btnPlus = getBtnPlus();
    const quantityCount = getQuantityCount();

    if (btnMinus && btnPlus && quantityCount) {
      btnMinus.onclick = () => {
        if (cantidadSeleccionada > 1) {
          cantidadSeleccionada--;
          quantityCount.textContent = cantidadSeleccionada;
        }
      };
      btnPlus.onclick = () => {
        if (cantidadSeleccionada < selectedPack.remainingPacks) {
          cantidadSeleccionada++;
          quantityCount.textContent = cantidadSeleccionada;
        }
      };
    }
  }

  function showConfirmation(pack) {
    selectedPack = pack;
    const totalCalculado = pack.finalPrice * cantidadSeleccionada;

    const summaryImage = document.getElementById('summaryImage');
    const summaryBusiness = document.getElementById('summaryBusiness');
    const summaryAddress = document.getElementById('summaryAddress');
    const summarySchedule = document.getElementById('summarySchedule');
    const summaryOriginal = document.getElementById('summaryOriginal');
    const summaryFinal = document.getElementById('summaryFinal');
    const summaryTotal = document.getElementById('summaryTotal');
    const summaryEco = document.getElementById('summaryEco');

    if (summaryImage) summaryImage.src = pack.image;
    if (summaryBusiness) summaryBusiness.textContent = `${pack.producto || pack.category} · ${pack.business} (${cantidadSeleccionada}x)`;
    if (summaryAddress) summaryAddress.textContent = pack.address;
    if (summarySchedule) summarySchedule.textContent = pack.schedule;
    if (summaryOriginal) summaryOriginal.textContent = `S/ ${(pack.originalPrice * cantidadSeleccionada).toFixed(2)}`;
    if (summaryFinal) summaryFinal.textContent = `S/ ${pack.finalPrice.toFixed(2)} c/u`;
    if (summaryTotal) summaryTotal.textContent = `S/ ${totalCalculado.toFixed(2)}`;
    
    if (summaryEco) {
      const valorImpacto = parseFloat(pack.impact) * cantidadSeleccionada;
      summaryEco.textContent = `Evitarás el desperdicio de ${valorImpacto.toFixed(1)}kg de comida con esta reserva.`;
    }

    if (confirmTerms) confirmTerms.checked = false;
    if (confirmReservationBtn) {
      confirmReservationBtn.disabled = true;
      confirmReservationBtn.innerHTML = `Confirmar reserva <span class="material-icons">arrow_forward</span>`;
    }

    setActiveView('confirmation');
  }
// ====== BUSCA ESTA FUNCIÓN EN TU APP.JS Y REEMPLÁZALA ======
async function registrarReservaEnBaseDatos(pack) {
    const totalCalculado = pack.finalPrice * cantidadSeleccionada;
    const code = 'SP-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const idUsuarioValido = obtenerIdUsuarioValido();

    const payload = {
      usuario_id: idUsuarioValido,
      negocio: pack.business,
      samipack_id: pack.id,
      samipack_nombre: pack.producto || pack.category,
      categoria: pack.category,
      cantidad: cantidadSeleccionada,
      precio_total: totalCalculado,
      codigo_alfanumerico: code,
      qr_data: `SamiPacks-${code}`,
      image: pack.image
    };

    try {
      const response = await fetch(`${API_URL}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.success) {
        pack.remainingPacks = Math.max(0, pack.remainingPacks - cantidadSeleccionada);
        cargarSamipacksDesdeBD(); // refresca el stock real desde MySQL
        cantidadSeleccionada = 1;

        // 🌟 CORRECCIÓN CRÍTICA: Llama a tu función real del script para actualizar el contenedor de reservas
        cargarReservasDesdeBaseDatos();

        if (ticketQr) ticketQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${payload.qr_data}`;
        if (ticketCode) ticketCode.textContent = code;
        if (ticketUser) ticketUser.textContent = usuarioLogueado ? usuarioLogueado.nombre : 'Alex Rivera';
        if (ticketBusiness) ticketBusiness.textContent = pack.business;
        if (ticketDate) ticketDate.textContent = 'Hoy';
        if (ticketLimit) ticketLimit.textContent = `Hoy, ${pack.schedule.split(' - ')[1]}`;

        setActiveView('ticket');
      } else {
        alert('Error al registrar la reserva en MySQL');
      }
    } catch (err) {
      console.error(err);
      alert('Error en el servidor de base de datos.');
    }
}

  // ==========================================================================
  // 🔐 VALIDACIÓN Y ESTADO DE CARGA DEL FORMULARIO DE LOGIN
  // ==========================================================================
  const loginEmailInput = document.getElementById('loginEmail');
  const loginPasswordInput = document.getElementById('loginPassword');
  const emailGroup = document.getElementById('emailGroup');
  const passwordGroup = document.getElementById('passwordGroup');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');

  // ---- Registro (crear cuenta nueva) ----
  const loginCard = document.getElementById('loginCard');
  const registerCard = document.getElementById('registerCard');
  const registerBusinessCard = document.getElementById('registerBusinessCard');
  const goToRegisterLink = document.getElementById('goToRegisterLink');
  const goToLoginLink = document.getElementById('goToLoginLink');
  const registerForm = document.getElementById('registerForm');
  const registerNameInput = document.getElementById('registerName');
  const registerEmailInput = document.getElementById('registerEmail');
  const registerPasswordInput = document.getElementById('registerPassword');
  const registerPasswordConfirmInput = document.getElementById('registerPasswordConfirm');
  const registerNameGroup = document.getElementById('registerNameGroup');
  const registerEmailGroup = document.getElementById('registerEmailGroup');
  const registerPasswordGroup = document.getElementById('registerPasswordGroup');
  const registerPasswordConfirmGroup = document.getElementById('registerPasswordConfirmGroup');
  const registerNameError = document.getElementById('registerNameError');
  const registerEmailError = document.getElementById('registerEmailError');
  const registerPasswordError = document.getElementById('registerPasswordError');
  const registerPasswordConfirmError = document.getElementById('registerPasswordConfirmError');
  const registerSubmitBtn = document.getElementById('registerSubmitBtn');
  const toggleRegisterPasswordBtn = document.getElementById('toggleRegisterPasswordBtn');

  let usuarioPendienteNegocio = null; // cuenta recién creada, en espera de completar los datos del negocio

  function mostrarCardDeAuth(card) {
    [loginCard, registerCard, registerBusinessCard].forEach((c) => { if (c) c.hidden = (c !== card); });
  }

  if (goToRegisterLink) {
    goToRegisterLink.addEventListener('click', (event) => {
      event.preventDefault();
      mostrarCardDeAuth(registerCard);
    });
  }

  if (goToLoginLink) {
    goToLoginLink.addEventListener('click', (event) => {
      event.preventDefault();
      mostrarCardDeAuth(loginCard);
    });
  }

  if (toggleRegisterPasswordBtn && registerPasswordInput) {
    toggleRegisterPasswordBtn.addEventListener('click', () => {
      const oculto = registerPasswordInput.type === 'password';
      registerPasswordInput.type = oculto ? 'text' : 'password';
      toggleRegisterPasswordBtn.setAttribute('aria-pressed', String(oculto));
      toggleRegisterPasswordBtn.querySelector('.material-icons').textContent = oculto ? 'visibility_off' : 'visibility';
    });
  }

  function ponerCargandoRegistro(estaCargando) {
    if (!registerSubmitBtn) return;
    registerSubmitBtn.disabled = estaCargando;
    registerSubmitBtn.innerHTML = estaCargando
      ? '<span class="btn-spinner" aria-hidden="true"></span><span class="btn-label">Creando cuenta…</span>'
      : '<span class="btn-label">Crear cuenta</span><span class="material-icons btn-arrow">arrow_forward</span>';
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const nombre = registerNameInput ? registerNameInput.value.trim() : '';
      const correo = registerEmailInput ? registerEmailInput.value.trim() : '';
      const clave = registerPasswordInput ? registerPasswordInput.value : '';
      const claveConfirm = registerPasswordConfirmInput ? registerPasswordConfirmInput.value : '';

      const nombreValido = nombre.length > 0;
      const correoValido = validarCorreo(correo);
      const claveValida = clave.length >= 6;
      const confirmValida = claveValida && clave === claveConfirm;

      if (registerNameGroup) registerNameGroup.classList.toggle('input-error', !nombreValido);
      if (registerNameError) registerNameError.hidden = nombreValido;
      if (registerEmailGroup) registerEmailGroup.classList.toggle('input-error', !correoValido);
      if (registerEmailError) registerEmailError.hidden = correoValido;
      if (registerPasswordGroup) registerPasswordGroup.classList.toggle('input-error', !claveValida);
      if (registerPasswordError) registerPasswordError.hidden = claveValida;
      if (registerPasswordConfirmGroup) registerPasswordConfirmGroup.classList.toggle('input-error', !confirmValida);
      if (registerPasswordConfirmError) registerPasswordConfirmError.hidden = confirmValida;

      if (!nombreValido || !correoValido || !claveValida || !confirmValida) return;

      ponerCargandoRegistro(true);
      try {
        const response = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre,
            correo,
            contrasena: clave,
            rol: rolSeleccionado || 'cliente'
          })
        });
        const data = await response.json();

        if (!data.success) {
          alert(data.message || 'No se pudo crear la cuenta.');
          return;
        }

        registerForm.reset();

        if (data.user.rol === 'negocio') {
          // Cuenta de negocio: falta completar los datos del negocio antes de entrar al panel.
          usuarioPendienteNegocio = data.user;
          const responsableInput = document.getElementById('registerBusinessResponsible');
          if (responsableInput) responsableInput.value = nombre;
          mostrarCardDeAuth(registerBusinessCard);
        } else {
          mostrarCardDeAuth(loginCard);
          iniciarSesionConDatos(data.user);
        }
      } catch (err) {
        console.error(err);
        alert('Error conectando al servidor backend.');
      } finally {
        ponerCargandoRegistro(false);
      }
    });

    [registerNameInput, registerEmailInput, registerPasswordInput, registerPasswordConfirmInput].forEach((input) => {
      if (!input) return;
      input.addEventListener('input', () => {
        registerNameGroup?.classList.remove('input-error');
        registerEmailGroup?.classList.remove('input-error');
        registerPasswordGroup?.classList.remove('input-error');
        registerPasswordConfirmGroup?.classList.remove('input-error');
        if (registerNameError) registerNameError.hidden = true;
        if (registerEmailError) registerEmailError.hidden = true;
        if (registerPasswordError) registerPasswordError.hidden = true;
        if (registerPasswordConfirmError) registerPasswordConfirmError.hidden = true;
      });
    });
  }

  // ---- Paso 2 del registro de Negocio: datos del negocio ----
  const registerBusinessForm = document.getElementById('registerBusinessForm');
  const registerBusinessNameInput = document.getElementById('registerBusinessName');
  const registerBusinessCategoryInput = document.getElementById('registerBusinessCategory');
  const registerBusinessPhoneInput = document.getElementById('registerBusinessPhone');
  const registerBusinessResponsibleInput = document.getElementById('registerBusinessResponsible');
  const registerBusinessNameGroup = document.getElementById('registerBusinessNameGroup');
  const registerBusinessCategoryGroup = document.getElementById('registerBusinessCategoryGroup');
  const registerBusinessPhoneGroup = document.getElementById('registerBusinessPhoneGroup');
  const registerBusinessResponsibleGroup = document.getElementById('registerBusinessResponsibleGroup');
  const registerBusinessNameError = document.getElementById('registerBusinessNameError');
  const registerBusinessCategoryError = document.getElementById('registerBusinessCategoryError');
  const registerBusinessPhoneError = document.getElementById('registerBusinessPhoneError');
  const registerBusinessResponsibleError = document.getElementById('registerBusinessResponsibleError');
  const registerBusinessSubmitBtn = document.getElementById('registerBusinessSubmitBtn');

  if (registerBusinessForm) {
    registerBusinessForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!usuarioPendienteNegocio) return;

      const negocio = registerBusinessNameInput ? registerBusinessNameInput.value.trim() : '';
      const categoria = registerBusinessCategoryInput ? registerBusinessCategoryInput.value : '';
      const telefono = registerBusinessPhoneInput ? registerBusinessPhoneInput.value.trim() : '';
      const responsable = registerBusinessResponsibleInput ? registerBusinessResponsibleInput.value.trim() : '';

      const negocioValido = negocio.length > 0;
      const categoriaValida = categoria.length > 0;
      const telefonoValido = telefono.length > 0;
      const responsableValido = responsable.length > 0;

      if (registerBusinessNameGroup) registerBusinessNameGroup.classList.toggle('input-error', !negocioValido);
      if (registerBusinessNameError) registerBusinessNameError.hidden = negocioValido;
      if (registerBusinessCategoryGroup) registerBusinessCategoryGroup.classList.toggle('input-error', !categoriaValida);
      if (registerBusinessCategoryError) registerBusinessCategoryError.hidden = categoriaValida;
      if (registerBusinessPhoneGroup) registerBusinessPhoneGroup.classList.toggle('input-error', !telefonoValido);
      if (registerBusinessPhoneError) registerBusinessPhoneError.hidden = telefonoValido;
      if (registerBusinessResponsibleGroup) registerBusinessResponsibleGroup.classList.toggle('input-error', !responsableValido);
      if (registerBusinessResponsibleError) registerBusinessResponsibleError.hidden = responsableValido;

      if (!negocioValido || !categoriaValida || !telefonoValido || !responsableValido) return;

      if (registerBusinessSubmitBtn) registerBusinessSubmitBtn.disabled = true;
      try {
        const response = await fetch(`${API_URL}/usuarios/${usuarioPendienteNegocio.id}/negocio`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: responsable, negocio, categoria_negocio: categoria, telefono })
        });
        const data = await response.json();

        if (!data.success) {
          alert(data.message || 'No se pudieron guardar los datos del negocio.');
          return;
        }

        registerBusinessForm.reset();
        usuarioPendienteNegocio = null;
        mostrarCardDeAuth(loginCard);
        iniciarSesionConDatos(data.user);
      } catch (err) {
        console.error(err);
        alert('Error conectando al servidor backend.');
      } finally {
        if (registerBusinessSubmitBtn) registerBusinessSubmitBtn.disabled = false;
      }
    });

    [registerBusinessNameInput, registerBusinessCategoryInput, registerBusinessPhoneInput, registerBusinessResponsibleInput].forEach((input) => {
      if (!input) return;
      const evento = input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(evento, () => {
        registerBusinessNameGroup?.classList.remove('input-error');
        registerBusinessCategoryGroup?.classList.remove('input-error');
        registerBusinessPhoneGroup?.classList.remove('input-error');
        registerBusinessResponsibleGroup?.classList.remove('input-error');
        if (registerBusinessNameError) registerBusinessNameError.hidden = true;
        if (registerBusinessCategoryError) registerBusinessCategoryError.hidden = true;
        if (registerBusinessPhoneError) registerBusinessPhoneError.hidden = true;
        if (registerBusinessResponsibleError) registerBusinessResponsibleError.hidden = true;
      });
    });
  }

  function validarCorreo(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((correo || '').trim());
  }

  function iniciarSesionConDatos(usuario) {
    usuarioLogueado = usuario;

    // 🏪 Enrutamiento por rol: las cuentas de negocio van al Panel de Admin,
    // el resto de usuarios entra al flujo normal de cliente.
    if (usuario.rol === 'negocio') {
      entrarComoAdmin(usuario);
      return;
    }

    const labelNombre = document.getElementById('perf-nombre');
    const labelCorreo = document.getElementById('perf-correo');
    if (labelNombre) labelNombre.textContent = usuario.nombre;
    if (labelCorreo) labelCorreo.textContent = usuario.correo;

    setActiveView('home');
    cargarSamipacksDesdeBD();
    actualizarUbicacionActual();
  }

  // ==========================================================================
  // 👑 PANEL DE ADMINISTRADOR (cuentas con rol = 'negocio')
  // ==========================================================================
  let reservasAdminActuales = []; // cache de las reservas pendientes del negocio logueado

  function entrarComoAdmin(usuario) {
    const adminWelcomeTitle = document.getElementById('adminWelcomeTitle');
    if (adminWelcomeTitle) {
      adminWelcomeTitle.textContent = usuario.negocio
        ? `Panel de ${usuario.negocio}`
        : 'Panel de Administración';
    }

    const adminBusinessNameInput = document.getElementById('adminBusinessName');
    if (adminBusinessNameInput && !adminBusinessNameInput.value) {
      adminBusinessNameInput.value = usuario.negocio || '';
    }

    mostrarTabAdmin('publicar');
    setActiveView('admin');
  }

  function mostrarTabAdmin(tab) {
    const tabPublicar = document.getElementById('adminTabPublicar');
    const tabReservas = document.getElementById('adminTabReservas');
    const tabHistorial = document.getElementById('adminTabHistorial');
    const tabPerfil = document.getElementById('adminTabPerfil');
    const btnPublicar = document.getElementById('adminTabBtnPublicar');
    const btnReservas = document.getElementById('adminTabBtnReservas');
    const btnHistorial = document.getElementById('adminTabBtnHistorial');
    const btnPerfil = document.getElementById('adminTabBtnPerfil');

    if (tabPublicar) tabPublicar.hidden = tab !== 'publicar';
    if (tabReservas) tabReservas.hidden = tab !== 'reservas';
    if (tabHistorial) tabHistorial.hidden = tab !== 'historial';
    if (tabPerfil) tabPerfil.hidden = tab !== 'perfil';

    [btnPublicar, btnReservas, btnHistorial, btnPerfil].forEach((btn) => btn && btn.classList.remove('active'));
    if (tab === 'publicar' && btnPublicar) btnPublicar.classList.add('active');
    if (tab === 'reservas' && btnReservas) btnReservas.classList.add('active');
    if (tab === 'historial' && btnHistorial) btnHistorial.classList.add('active');
    if (tab === 'perfil' && btnPerfil) btnPerfil.classList.add('active');

    if (tab === 'publicar') cargarMisSamipacksAdmin();
    if (tab === 'reservas') cargarReservasAdmin();
    if (tab === 'historial') cargarHistorialVentasAdmin();
    if (tab === 'perfil') mostrarPerfilAdmin();
  }

  // ---- Perfil del negocio ----
  function mostrarPerfilAdmin() {
    if (!usuarioLogueado) return;
    const negocioEl = document.getElementById('adminPerfilNegocio');
    const nombreEl = document.getElementById('adminPerfilNombre');
    const categoriaEl = document.getElementById('adminPerfilCategoria');
    const correoEl = document.getElementById('adminPerfilCorreo');
    const telefonoEl = document.getElementById('adminPerfilTelefono');
    if (negocioEl) negocioEl.textContent = usuarioLogueado.negocio || 'Negocio sin nombre asignado';
    if (nombreEl) nombreEl.textContent = usuarioLogueado.nombre || '-';
    if (categoriaEl) categoriaEl.textContent = usuarioLogueado.categoria_negocio || '-';
    if (correoEl) correoEl.textContent = usuarioLogueado.correo || '-';
    if (telefonoEl) telefonoEl.textContent = usuarioLogueado.telefono || '-';

    // Siempre que se refresca la vista de lectura, nos asegura salir del modo edición
    cerrarEdicionPerfilAdmin();
  }

  // ---- Edición del perfil del negocio ----
  const adminPerfilVista = document.getElementById('adminPerfilVista');
  const adminPerfilEditForm = document.getElementById('adminPerfilEditForm');
  const btnAdminPerfilEditar = document.getElementById('btnAdminPerfilEditar');
  const btnAdminPerfilCancelar = document.getElementById('btnAdminPerfilCancelar');
  const btnAdminPerfilGuardar = document.getElementById('btnAdminPerfilGuardar');
  const adminPerfilEditNegocioInput = document.getElementById('adminPerfilEditNegocio');
  const adminPerfilEditCategoriaInput = document.getElementById('adminPerfilEditCategoria');
  const adminPerfilEditResponsableInput = document.getElementById('adminPerfilEditResponsable');
  const adminPerfilEditTelefonoInput = document.getElementById('adminPerfilEditTelefono');
  const adminPerfilEditNegocioGroup = document.getElementById('adminPerfilEditNegocioGroup');
  const adminPerfilEditCategoriaGroup = document.getElementById('adminPerfilEditCategoriaGroup');
  const adminPerfilEditResponsableGroup = document.getElementById('adminPerfilEditResponsableGroup');
  const adminPerfilEditTelefonoGroup = document.getElementById('adminPerfilEditTelefonoGroup');
  const adminPerfilEditNegocioError = document.getElementById('adminPerfilEditNegocioError');
  const adminPerfilEditCategoriaError = document.getElementById('adminPerfilEditCategoriaError');
  const adminPerfilEditResponsableError = document.getElementById('adminPerfilEditResponsableError');
  const adminPerfilEditTelefonoError = document.getElementById('adminPerfilEditTelefonoError');

  function abrirEdicionPerfilAdmin() {
    if (!usuarioLogueado) return;
    if (adminPerfilEditNegocioInput) adminPerfilEditNegocioInput.value = usuarioLogueado.negocio || '';
    if (adminPerfilEditCategoriaInput) adminPerfilEditCategoriaInput.value = usuarioLogueado.categoria_negocio || '';
    if (adminPerfilEditResponsableInput) adminPerfilEditResponsableInput.value = usuarioLogueado.nombre || '';
    if (adminPerfilEditTelefonoInput) adminPerfilEditTelefonoInput.value = usuarioLogueado.telefono || '';

    if (adminPerfilVista) adminPerfilVista.hidden = true;
    if (adminPerfilEditForm) adminPerfilEditForm.hidden = false;
    if (btnAdminPerfilEditar) btnAdminPerfilEditar.hidden = true;
  }

  function cerrarEdicionPerfilAdmin() {
    if (adminPerfilVista) adminPerfilVista.hidden = false;
    if (adminPerfilEditForm) adminPerfilEditForm.hidden = true;
    if (btnAdminPerfilEditar) btnAdminPerfilEditar.hidden = false;
    [adminPerfilEditNegocioGroup, adminPerfilEditCategoriaGroup, adminPerfilEditResponsableGroup, adminPerfilEditTelefonoGroup].forEach((g) => g?.classList.remove('input-error'));
    [adminPerfilEditNegocioError, adminPerfilEditCategoriaError, adminPerfilEditResponsableError, adminPerfilEditTelefonoError].forEach((e) => { if (e) e.hidden = true; });
  }

  if (btnAdminPerfilEditar) {
    btnAdminPerfilEditar.addEventListener('click', abrirEdicionPerfilAdmin);
  }
  if (btnAdminPerfilCancelar) {
    btnAdminPerfilCancelar.addEventListener('click', cerrarEdicionPerfilAdmin);
  }

  if (adminPerfilEditForm) {
    adminPerfilEditForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!usuarioLogueado) return;

      const negocio = adminPerfilEditNegocioInput ? adminPerfilEditNegocioInput.value.trim() : '';
      const categoria = adminPerfilEditCategoriaInput ? adminPerfilEditCategoriaInput.value : '';
      const responsable = adminPerfilEditResponsableInput ? adminPerfilEditResponsableInput.value.trim() : '';
      const telefono = adminPerfilEditTelefonoInput ? adminPerfilEditTelefonoInput.value.trim() : '';

      const negocioValido = negocio.length > 0;
      const categoriaValida = categoria.length > 0;
      const responsableValido = responsable.length > 0;
      const telefonoValido = telefono.length > 0;

      if (adminPerfilEditNegocioGroup) adminPerfilEditNegocioGroup.classList.toggle('input-error', !negocioValido);
      if (adminPerfilEditNegocioError) adminPerfilEditNegocioError.hidden = negocioValido;
      if (adminPerfilEditCategoriaGroup) adminPerfilEditCategoriaGroup.classList.toggle('input-error', !categoriaValida);
      if (adminPerfilEditCategoriaError) adminPerfilEditCategoriaError.hidden = categoriaValida;
      if (adminPerfilEditResponsableGroup) adminPerfilEditResponsableGroup.classList.toggle('input-error', !responsableValido);
      if (adminPerfilEditResponsableError) adminPerfilEditResponsableError.hidden = responsableValido;
      if (adminPerfilEditTelefonoGroup) adminPerfilEditTelefonoGroup.classList.toggle('input-error', !telefonoValido);
      if (adminPerfilEditTelefonoError) adminPerfilEditTelefonoError.hidden = telefonoValido;

      if (!negocioValido || !categoriaValida || !responsableValido || !telefonoValido) return;

      if (btnAdminPerfilGuardar) btnAdminPerfilGuardar.disabled = true;
      try {
        const response = await fetch(`${API_URL}/usuarios/${usuarioLogueado.id}/negocio`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: responsable, negocio, categoria_negocio: categoria, telefono })
        });
        const data = await response.json();

        if (!data.success) {
          alert(data.message || 'No se pudieron guardar los cambios.');
          return;
        }

        usuarioLogueado = data.user;

        // Refleja el nuevo nombre de negocio también en el título del panel
        const adminWelcomeTitle = document.getElementById('adminWelcomeTitle');
        if (adminWelcomeTitle) {
          adminWelcomeTitle.textContent = usuarioLogueado.negocio
            ? `Panel de ${usuarioLogueado.negocio}`
            : 'Panel de Administración';
        }
        const adminBusinessNameInput = document.getElementById('adminBusinessName');
        if (adminBusinessNameInput) adminBusinessNameInput.value = usuarioLogueado.negocio || '';

        mostrarPerfilAdmin();
        alert('¡Datos del negocio actualizados exitosamente!');
      } catch (err) {
        console.error(err);
        alert('Error conectando al servidor backend.');
      } finally {
        if (btnAdminPerfilGuardar) btnAdminPerfilGuardar.disabled = false;
      }
    });
  }

  // ---- Mis SamiPacks: listado con Editar / Eliminar (CRUD completo) ----
  let misPacksAdminActuales = [];

  async function cargarMisSamipacksAdmin() {
    const contenedor = document.getElementById('adminMisPacksList');
    if (!contenedor || !usuarioLogueado || !usuarioLogueado.negocio) return;

    contenedor.innerHTML = '<p style="text-align:center; color:#8c8c8c; margin-top:10px;">Cargando tus SamiPacks…</p>';

    try {
      const response = await fetch(`${API_URL}/samipacks/negocio/${encodeURIComponent(usuarioLogueado.negocio)}`);
      const data = await response.json();

      if (!data.success) {
        contenedor.innerHTML = '<p style="text-align:center; color:#c62828;">Error al cargar tus SamiPacks.</p>';
        return;
      }

      misPacksAdminActuales = data.packs;

      if (!data.packs.length) {
        contenedor.innerHTML = '<p style="text-align:center; color:#8c8c8c; margin-top:10px;">Todavía no has publicado ningún SamiPack.</p>';
        return;
      }

      contenedor.innerHTML = data.packs.map((pack) => `
        <div class="history-card-layout" data-id="${pack.id}">
          <img class="history-card-img" src="${pack.image}" alt="${pack.category}">
          <div class="history-card-body">
            <div class="history-card-top">
              <h5>${pack.producto || pack.category}</h5>
              <span class="material-icons" style="font-size:18px; color:#8c8c8c;">inventory_2</span>
            </div>
            <p class="history-card-desc" style="color:#4caf50; font-weight:600;">${pack.category}</p>
            <p class="history-card-desc">${pack.description}</p>
            <p class="history-card-desc">S/ ${Number(pack.finalPrice).toFixed(2)} · Quedan ${pack.remainingPacks} · ${pack.schedule}</p>
            <div class="history-card-meta" style="gap:8px;">
              <button class="secondary-button" type="button" data-action="editar" data-id="${pack.id}" style="padding:6px 14px; font-size:13px;">Editar</button>
              <button class="secondary-button" type="button" data-action="eliminar" data-id="${pack.id}" style="padding:6px 14px; font-size:13px; color:#ef5350;">Eliminar</button>
            </div>
          </div>
        </div>
      `).join('');

      contenedor.querySelectorAll('[data-action="editar"]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const pack = misPacksAdminActuales.find((p) => p.id === Number(btn.dataset.id));
          if (pack) iniciarEdicionSamipack(pack);
        });
      });
      contenedor.querySelectorAll('[data-action="eliminar"]').forEach((btn) => {
        btn.addEventListener('click', () => eliminarSamipackAdmin(Number(btn.dataset.id)));
      });
    } catch (err) {
      console.error('Error al cargar Mis SamiPacks:', err);
      contenedor.innerHTML = '<p style="text-align:center; color:#c62828;">Error conectando al servidor backend.</p>';
    }
  }

  // ---- Selector de imagen: pegar URL o subir foto desde el dispositivo ----
  // Ambos modos terminan escribiendo el mismo valor en el input oculto
  // #adminImage, que es lo único que lee el envío del formulario (línea de
  // más abajo con "payload.image"). Así no hace falta tocar el backend:
  // si es una URL normal, se guarda tal cual; si es una foto subida, se
  // guarda como "data:image/jpeg;base64,..." en el mismo campo de texto.
  const adminImageInput = document.getElementById('adminImage');
  const adminImageUrlInput = document.getElementById('adminImageUrlInput');
  const adminImageFileInput = document.getElementById('adminImageFileInput');
  const adminImageUrlGroup = document.getElementById('adminImageUrlGroup');
  const adminImageFileGroup = document.getElementById('adminImageFileGroup');
  const adminImageModeUrlBtn = document.getElementById('adminImageModeUrlBtn');
  const adminImageModeFileBtn = document.getElementById('adminImageModeFileBtn');
  const adminImagePreview = document.getElementById('adminImagePreview');

  function mostrarVistaPreviaImagen(valor) {
    if (adminImagePreview) {
      if (valor) {
        adminImagePreview.src = valor;
        adminImagePreview.style.display = 'block';
      } else {
        adminImagePreview.src = '';
        adminImagePreview.style.display = 'none';
      }
    }
  }

  function setAdminImageValue(valor, { comoArchivo = false } = {}) {
    if (adminImageInput) adminImageInput.value = valor || '';
    mostrarVistaPreviaImagen(valor);
    if (!comoArchivo && adminImageUrlInput) adminImageUrlInput.value = valor || '';
  }

  function cambiarModoImagen(modo) {
    const esUrl = modo === 'url';
    if (adminImageUrlGroup) adminImageUrlGroup.style.display = esUrl ? 'flex' : 'none';
    if (adminImageFileGroup) adminImageFileGroup.style.display = esUrl ? 'none' : 'flex';
    if (adminImageModeUrlBtn) adminImageModeUrlBtn.classList.toggle('active-toggle', esUrl);
    if (adminImageModeFileBtn) adminImageModeFileBtn.classList.toggle('active-toggle', !esUrl);
  }

  if (adminImageModeUrlBtn) {
    adminImageModeUrlBtn.addEventListener('click', () => cambiarModoImagen('url'));
  }
  if (adminImageModeFileBtn) {
    adminImageModeFileBtn.addEventListener('click', () => cambiarModoImagen('file'));
  }
  if (adminImageUrlInput) {
    adminImageUrlInput.addEventListener('input', () => {
      setAdminImageValue(adminImageUrlInput.value.trim());
    });
  }

  // Reduce el tamaño de la foto antes de convertirla a base64 (una foto de
  // celular sin comprimir puede pesar varios MB; así queda liviana para
  // guardarse en la base de datos y cargar rápido en la app).
  function comprimirImagenArchivo(archivo) {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxAncho = 900;
          const escala = Math.min(1, maxAncho / img.width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * escala);
          canvas.height = Math.round(img.height * escala);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        img.onerror = () => reject(new Error('No se pudo leer la imagen.'));
        img.src = e.target.result;
      };
      lector.onerror = () => reject(new Error('No se pudo leer el archivo.'));
      lector.readAsDataURL(archivo);
    });
  }

  if (adminImageFileInput) {
    adminImageFileInput.addEventListener('change', async () => {
      const archivo = adminImageFileInput.files && adminImageFileInput.files[0];
      if (!archivo) return;
      if (!archivo.type.startsWith('image/')) {
        alert('Selecciona un archivo de imagen (jpg, png, etc.).');
        return;
      }
      try {
        const dataUrl = await comprimirImagenArchivo(archivo);
        setAdminImageValue(dataUrl, { comoArchivo: true });
      } catch (err) {
        console.error('Error comprimiendo imagen:', err);
        alert('No se pudo procesar esa imagen. Intenta con otra.');
      }
    });
  }

  function iniciarEdicionSamipack(pack) {
    document.getElementById('adminEditingId').value = pack.id;
    document.getElementById('adminBusinessName').value = pack.business || (usuarioLogueado ? usuarioLogueado.negocio : '') || '';
    document.getElementById('adminProductName').value = pack.producto || '';
    document.getElementById('adminCategory').value = pack.category || '';
    document.getElementById('adminDescription').value = pack.description || '';
    setAdminImageValue(pack.image || '');
    cambiarModoImagen('url');
    document.getElementById('adminOriginalPrice').value = pack.originalPrice;
    document.getElementById('adminFinalPrice').value = pack.finalPrice;
    document.getElementById('adminRemaining').value = pack.remainingPacks;
    const [horaInicio, horaFin] = (pack.schedule || '').split('-').map((h) => h.trim());
    document.getElementById('adminScheduleStart').value = horaInicio || '';
    document.getElementById('adminScheduleEnd').value = horaFin || '';
    document.getElementById('adminAddress').value = pack.address || '';
    document.getElementById('adminCoordinates').value = pack.coordinates || '';

    const titulo = document.getElementById('adminFormTitulo');
    if (titulo) titulo.textContent = `EDITANDO: ${pack.producto || pack.category}`;
    const submitBtn = document.getElementById('adminFormSubmitBtn');
    if (submitBtn) submitBtn.querySelector('.btn-label').textContent = 'Guardar cambios';
    const cancelBtn = document.getElementById('adminCancelEditBtn');
    if (cancelBtn) cancelBtn.hidden = false;

    document.getElementById('adminProductForm').scrollIntoView({ behavior: 'smooth' });
  }

  // ---- Autocompletar coordenadas a partir de la dirección (Nominatim/OpenStreetMap, gratis, sin API key) ----
  let geocodeTimeoutId = null;
  let geocodeAbortController = null;

  async function buscarEnNominatim(consulta, signal) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=pe&q=${encodeURIComponent(consulta)}`;
    const response = await fetch(url, { signal });
    return response.json();
  }

  async function buscarCoordenadasDesdeDireccion(direccionEscrita) {
    const hint = document.getElementById('adminCoordsHint');
    const coordsInput = document.getElementById('adminCoordinates');
    const direccion = (direccionEscrita || '').trim();

    if (direccion.length < 5) return;

    if (geocodeAbortController) geocodeAbortController.abort();
    geocodeAbortController = new AbortController();
    const { signal } = geocodeAbortController;

    if (hint) hint.textContent = 'Buscando ubicación…';
    coordsInput.placeholder = 'Buscando ubicación…';

    try {
      // Intento 1: la dirección completa tal como la escribió el negocio.
      let resultados = await buscarEnNominatim(`${direccion}, Ayacucho, Perú`, signal);

      // Intento 2: sin el número de puerta (a veces Nominatim no tiene el
      // número exacto registrado, pero sí conoce la calle/jirón).
      if (!resultados.length) {
        const sinNumero = direccion.replace(/\d+\s*$/, '').trim();
        if (sinNumero && sinNumero !== direccion) {
          resultados = await buscarEnNominatim(`${sinNumero}, Ayacucho, Perú`, signal);
        }
      }

      if (resultados && resultados.length > 0) {
        const { lat, lon } = resultados[0];
        coordsInput.value = `${parseFloat(lat).toFixed(6)},${parseFloat(lon).toFixed(6)}`;
        if (hint) mostrarHintConEncontrado(true);
      } else {
        if (hint) mostrarHintConEncontrado(false);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error al geocodificar la dirección:', err);
        if (hint) mostrarHintConEncontrado(false, 'No se pudo buscar automáticamente (sin conexión al servicio de mapas).');
      }
    } finally {
      coordsInput.placeholder = 'Se completa solo al escribir la dirección';
    }
  }

  // Muestra el estado de la búsqueda de ubicación y, si falló, un enlace para
  // ingresarla manualmente (sin necesidad de mostrar el campo de coordenadas
  // de forma permanente en la interfaz).
  function mostrarHintConEncontrado(encontrado, mensajeError) {
    const hint = document.getElementById('adminCoordsHint');
    if (!hint) return;

    if (encontrado) {
      hint.innerHTML = '¡Ubicación encontrada automáticamente!';
      return;
    }

    const mensaje = mensajeError || 'No se encontró la dirección exacta. Prueba ser más específico, o';
    hint.innerHTML = `${mensaje} <a href="#" id="adminIngresoManualLink" style="color: var(--green); font-weight: 600;">ingresa la ubicación manualmente</a>.`;

    const link = document.getElementById('adminIngresoManualLink');
    if (link) {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const actual = document.getElementById('adminCoordinates').value;
        const entrada = window.prompt(
          'Ingresa la ubicación como "latitud,longitud" (ejemplo: -13.158900,-74.223500).\n\nTip: puedes obtenerlas abriendo Google Maps, buscando la dirección, tocando el punto y copiando los dos números que aparecen abajo.',
          actual || ''
        );
        if (entrada === null) return; // el usuario canceló

        const limpio = entrada.trim();
        const esValido = /^-?\d{1,3}(\.\d+)?,\s*-?\d{1,3}(\.\d+)?$/.test(limpio);
        if (!esValido) {
          alert('Formato no reconocido. Debe ser "latitud,longitud", por ejemplo: -13.158900,-74.223500');
          return;
        }

        document.getElementById('adminCoordinates').value = limpio.replace(/\s+/g, '');
        hint.innerHTML = '📍 Ubicación ingresada manualmente.';
      });
    }
  }


  function cancelarEdicionSamipack() {
    document.getElementById('adminProductForm').reset();
    document.getElementById('adminEditingId').value = '';
    setAdminImageValue('');
    cambiarModoImagen('url');
    const adminBusinessNameInput = document.getElementById('adminBusinessName');
    if (adminBusinessNameInput) adminBusinessNameInput.value = (usuarioLogueado && usuarioLogueado.negocio) || '';
    const titulo = document.getElementById('adminFormTitulo');
    if (titulo) titulo.textContent = 'PUBLICAR NUEVA OFERTA EXCEDENTE';
    const submitBtn = document.getElementById('adminFormSubmitBtn');
    if (submitBtn) submitBtn.querySelector('.btn-label').textContent = 'Publicar en SamiPacks';
    const cancelBtn = document.getElementById('adminCancelEditBtn');
    if (cancelBtn) cancelBtn.hidden = true;
    const hint = document.getElementById('adminCoordsHint');
    if (hint) hint.textContent = 'Buscamos la ubicación automáticamente a partir de la dirección.';
  }

  async function eliminarSamipackAdmin(id) {
    if (!confirm('¿Seguro que deseas eliminar este SamiPack? Esta acción no se puede deshacer.')) return;
    try {
      const response = await fetch(`${API_URL}/samipacks/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        cargarMisSamipacksAdmin();
        cargarSamipacksDesdeBD(); // mantiene el Home del cliente sincronizado
      } else {
        alert(data.error || 'No se pudo eliminar el SamiPack.');
      }
    } catch (err) {
      console.error('Error al eliminar SamiPack:', err);
      alert('Error conectando al servidor backend.');
    }
  }

  // ---- Publicar nuevo SamiPack o guardar edición de uno existente ----
  async function publicarSamipackDesdeAdmin(event) {
    event.preventDefault();
    if (!usuarioLogueado || !usuarioLogueado.negocio) {
      alert('Tu cuenta de negocio no tiene un nombre de negocio asignado en la base de datos.');
      return;
    }

    const editingId = document.getElementById('adminEditingId').value;

    const horaInicio = document.getElementById('adminScheduleStart').value;
    const horaFin = document.getElementById('adminScheduleEnd').value;
    if (!horaInicio || !horaFin) {
      alert('Selecciona la hora de inicio y de fin del horario disponible.');
      return;
    }

    // La ubicación (coordenadas) ya no es obligatoria para poder publicar.
    // Si Nominatim no la encontró y el negocio no la ingresó manualmente,
    // se publica igual solo con la dirección escrita; la distancia en el
    // Home del cliente simplemente no se podrá calcular para ese SamiPack.
    const coordinatesValue = document.getElementById('adminCoordinates').value.trim();

    const imagenValor = document.getElementById('adminImage').value.trim();
    if (!imagenValor) {
      alert('Agrega una imagen del producto: pega una URL o sube una foto desde tu dispositivo.');
      return;
    }

    const payload = {
      business: usuarioLogueado.negocio,
      producto: document.getElementById('adminProductName').value.trim(),
      category: document.getElementById('adminCategory').value,
      description: document.getElementById('adminDescription').value.trim(),
      image: document.getElementById('adminImage').value.trim(),
      originalPrice: parseFloat(document.getElementById('adminOriginalPrice').value),
      finalPrice: parseFloat(document.getElementById('adminFinalPrice').value),
      remainingPacks: parseInt(document.getElementById('adminRemaining').value, 10),
      schedule: `${horaInicio}-${horaFin}`,
      address: document.getElementById('adminAddress').value.trim(),
      coordinates: coordinatesValue
    };

    const submitBtn = document.getElementById('adminFormSubmitBtn');
    if (submitBtn) { submitBtn.disabled = true; }

    try {
      const url = editingId ? `${API_URL}/samipacks/${editingId}` : `${API_URL}/samipacks`;
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        alert(editingId ? '¡SamiPack actualizado exitosamente!' : '¡SamiPack publicado exitosamente!');
        cancelarEdicionSamipack();
        cargarMisSamipacksAdmin();
        cargarSamipacksDesdeBD(); // mantiene packItems sincronizado con la BD real
      } else {
        alert(data.error || 'No se pudo guardar el producto.');
      }
    } catch (err) {
      console.error('Error al guardar SamiPack:', err);
      alert('Error conectando al servidor backend.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  // ---- Reservas pendientes del negocio ----
  async function cargarReservasAdmin() {
    const contenedor = document.getElementById('adminReservasList');
    if (!contenedor || !usuarioLogueado || !usuarioLogueado.negocio) return;

    contenedor.innerHTML = '<p style="text-align:center; color:#8c8c8c; margin-top:20px;">Cargando reservas…</p>';

    try {
      const response = await fetch(`${API_URL}/admin/reservas/negocio/${encodeURIComponent(usuarioLogueado.negocio)}`);
      const data = await response.json();

      if (!data.success) {
        contenedor.innerHTML = '<p style="text-align:center; color:#c62828;">Error al cargar las reservas.</p>';
        return;
      }

      reservasAdminActuales = data.reservas.filter((r) => r.estado === 'Pendiente de recoger');

      if (reservasAdminActuales.length === 0) {
        contenedor.innerHTML = `
          <div style="text-align:center; margin-top:30px; color:#8c8c8c;">
            <span class="material-icons" style="font-size:44px;">inbox</span>
            <p>No hay reservas pendientes de recoger en este momento.</p>
          </div>
        `;
        return;
      }

      contenedor.innerHTML = reservasAdminActuales.map((r) => `
        <div class="history-card-layout" style="align-items:center;">
          <div class="history-card-body" style="width:100%;">
            <div class="history-card-top">
              <h5>${r.usuario_nombre}</h5>
              <span class="status-chip yellow">Pendiente</span>
            </div>
            <p class="history-card-desc">${r.samipack_nombre} (${r.cantidad}x) — ${r.usuario_correo}</p>
            <div class="history-card-meta">
              <span class="history-card-price">S/ ${parseFloat(r.precio_total).toFixed(2)}</span>
              <span class="history-card-code">Código: <strong>${r.codigo_alfanumerico}</strong></span>
            </div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Error al cargar reservas del negocio:', err);
      contenedor.innerHTML = '<p style="text-align:center; color:#c62828;">Error conectando al servidor backend.</p>';
    }
  }

  // ---- Confirmar recogida (por input manual o por escaneo de cámara) ----
  async function confirmarRecogidaPorCodigo(codigoCrudo) {
    if (!codigoCrudo || !usuarioLogueado || !usuarioLogueado.negocio) return;
    // Acepta tanto el código solo ("SP-84A9QX") como el contenido completo del QR ("SamiPacks-SP-84A9QX")
    const codigoLimpio = codigoCrudo.replace(/^SamiPacks-/i, '').trim().toUpperCase();
    if (!codigoLimpio) return;

    const btnConfirmar = document.getElementById('adminConfirmarCodigoBtn');
    const inputCodigo = document.getElementById('adminCodigoInput');
    if (btnConfirmar) btnConfirmar.disabled = true;
    if (inputCodigo) inputCodigo.disabled = true;

    try {
      // Búsqueda y actualización atómica en el servidor: no depende de una lista
      // cacheada en el navegador, que podía quedar desactualizada y causar
      // falsos "no se pudo confirmar la recogida".
      const response = await fetch(`${API_URL}/admin/confirmar-recogida-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: codigoLimpio,
          negocio: usuarioLogueado.negocio,
          admin_id: usuarioLogueado.id
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ ¡Recogida confirmada exitosamente!');
        if (inputCodigo) inputCodigo.value = '';
        cargarReservasAdmin();
      } else {
        // Mostramos siempre el detalle real si el backend lo trae (aunque venga
        // en 'error' en vez de 'message'), para no esconder la causa real detrás
        // de un mensaje genérico como pasaba antes.
        console.error('Confirmación de recogida fallida:', data);
        alert(data.message || data.error || 'No se pudo confirmar la recogida.');
      }
    } catch (err) {
      console.error('Error al confirmar recogida:', err);
      alert('Error conectando al servidor backend.');
    } finally {
      if (btnConfirmar) btnConfirmar.disabled = false;
      if (inputCodigo) inputCodigo.disabled = false;
    }
  }

  // ---- Historial de ventas del negocio ----
  async function cargarHistorialVentasAdmin() {
    const contenedor = document.getElementById('adminHistorialList');
    if (!contenedor || !usuarioLogueado) return;

    contenedor.innerHTML = '<p style="text-align:center; color:#8c8c8c; margin-top:20px;">Cargando historial…</p>';

    try {
      const response = await fetch(`${API_URL}/admin/historial-ventas/${usuarioLogueado.id}`);
      const data = await response.json();

      if (!data.success) {
        contenedor.innerHTML = '<p style="text-align:center; color:#c62828;">Error al cargar el historial.</p>';
        return;
      }

      if (data.ventas.length === 0) {
        contenedor.innerHTML = `
          <div style="text-align:center; margin-top:30px; color:#8c8c8c;">
            <span class="material-icons" style="font-size:44px;">receipt_long</span>
            <p>Todavía no has confirmado ninguna recogida.</p>
          </div>
        `;
        return;
      }

      contenedor.innerHTML = data.ventas.map((v) => `
        <div class="history-card-layout" style="align-items:center;">
          <div class="history-card-body" style="width:100%;">
            <div class="history-card-top">
              <h5>${v.usuario_nombre}</h5>
              <span class="status-chip green">Recogido</span>
            </div>
            <p class="history-card-desc">${v.samipack_nombre} (${v.cantidad}x)</p>
            <div class="history-card-meta">
              <span class="history-card-price">S/ ${parseFloat(v.precio_total).toFixed(2)}</span>
              <span class="history-card-code">Código: <strong>${v.codigo_alfanumerico}</strong></span>
            </div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Error al cargar historial de ventas:', err);
      contenedor.innerHTML = '<p style="text-align:center; color:#c62828;">Error conectando al servidor backend.</p>';
    }
  }

  // ---- Escaneo de QR por cámara (usa la librería jsQR cargada en index.html) ----
  let streamCamaraAdmin = null;
  let loopEscaneoActivo = false;

  async function abrirEscanerAdmin() {
    const modal = document.getElementById('adminScannerModal');
    const video = document.getElementById('adminScannerVideo');
    if (!modal || !video) return;

    // Los navegadores solo permiten usar la cámara en HTTPS o en localhost.
    // Si el sitio se abre desde otra IP por http:// o como archivo local,
    // getUserMedia ni siquiera existe y el escaneo no puede funcionar.
    if (!window.isSecureContext) {
      alert('La cámara solo funciona en https:// o en localhost. Si estás probando desde otra IP/dispositivo por http://, usa el código manual mientras tanto.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Tu navegador no permite acceder a la cámara. Usa el código manual en su lugar.');
      return;
    }

    // Mostrar el modal de inmediato: mientras el navegador pide permiso de
    // cámara puede tardar un instante, y antes no se veía ningún cambio en
    // pantalla (parecía que el botón no hacía nada).
    modal.hidden = false;
    modal.style.display = 'flex';

    try {
      streamCamaraAdmin = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = streamCamaraAdmin;
      await video.play();
      loopEscaneoActivo = true;
      requestAnimationFrame(procesarFrameEscaner);
    } catch (err) {
      console.error('No se pudo acceder a la cámara:', err);
      cerrarEscanerAdmin();
      alert('No se pudo acceder a la cámara. Verifica que le hayas dado permiso de cámara a este sitio (icono junto a la barra de direcciones), o usa el código manual.');
    }
  }

  function cerrarEscanerAdmin() {
    loopEscaneoActivo = false;
    const modal = document.getElementById('adminScannerModal');
    if (modal) {
      modal.hidden = true;
      modal.style.display = 'none';
    }
    if (streamCamaraAdmin) {
      streamCamaraAdmin.getTracks().forEach((track) => track.stop());
      streamCamaraAdmin = null;
    }
  }

  function procesarFrameEscaner() {
    if (!loopEscaneoActivo) return;
    const video = document.getElementById('adminScannerVideo');
    const canvas = document.getElementById('adminScannerCanvas');

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && typeof jsQR === 'function') {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const resultado = jsQR(imageData.data, imageData.width, imageData.height);

      if (resultado && resultado.data) {
        cerrarEscanerAdmin();
        confirmarRecogidaPorCodigo(resultado.data);
        return;
      }
    }
    requestAnimationFrame(procesarFrameEscaner);
  }


  function ponerCargando(estaCargando) {
    if (!loginSubmitBtn) return;
    loginSubmitBtn.disabled = estaCargando;
    loginSubmitBtn.innerHTML = estaCargando
      ? '<span class="btn-spinner" aria-hidden="true"></span><span class="btn-label">Ingresando…</span>'
      : '<span class="btn-label">Iniciar sesión</span><span class="material-icons btn-arrow">arrow_forward</span>';
  }

  // Mostrar / ocultar contraseña
  if (togglePasswordBtn && loginPasswordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const oculto = loginPasswordInput.type === 'password';
      loginPasswordInput.type = oculto ? 'text' : 'password';
      togglePasswordBtn.setAttribute('aria-pressed', String(oculto));
      togglePasswordBtn.querySelector('.material-icons').textContent = oculto ? 'visibility_off' : 'visibility';
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const inputEmail = loginEmailInput ? loginEmailInput.value : '';
      const inputPassword = loginPasswordInput ? loginPasswordInput.value : '';

      // Validación en el cliente antes de golpear el backend
      const correoValido = validarCorreo(inputEmail);
      const claveValida = inputPassword.trim().length > 0;

      if (emailGroup) emailGroup.classList.toggle('input-error', !correoValido);
      if (emailError) emailError.hidden = correoValido;
      if (passwordGroup) passwordGroup.classList.toggle('input-error', !claveValida);
      if (passwordError) passwordError.hidden = claveValida;

      if (!correoValido || !claveValida) return;

      ponerCargando(true);
      try {
        const response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo: inputEmail, contrasena: inputPassword })
        });
        const data = await response.json();

        if (data.success) {
          iniciarSesionConDatos(data.user);
        } else {
          alert('Credenciales incorrectas. Intenta con alex.rivera@eco-mail.com y clave 123456');
        }
      } catch (err) {
        console.error(err);
        alert('Error conectando al servidor backend.');
      } finally {
        ponerCargando(false);
      }
    });

    // Limpiar el estado de error apenas la persona vuelve a escribir
    [loginEmailInput, loginPasswordInput].forEach((input) => {
      if (!input) return;
      input.addEventListener('input', () => {
        emailGroup?.classList.remove('input-error');
        passwordGroup?.classList.remove('input-error');
        if (emailError) emailError.hidden = true;
        if (passwordError) passwordError.hidden = true;
      });
    });
  }

  // ==========================================================================
  // 🔗 SIMULACIÓN DE INICIO DE SESIÓN CON GOOGLE / FACEBOOK
  // ==========================================================================
  // No hay backend real de OAuth aquí, así que este bloque simula la
  // experiencia: Google muestra un selector de cuentas guardadas (o permite
  // añadir una nueva) y Facebook pide confirmar la cuenta con la que ya
  // iniciaste sesión antes en el dispositivo. Las cuentas "recordadas" se
  // guardan en localStorage para que la próxima vez aparezcan como ya
  // conocidas, tal como pasaría con cuentas reales del dispositivo.
  const authModalOverlay = document.getElementById('authModalOverlay');
  const authModalLogo = document.getElementById('authModalLogo');
  const authModalTitle = document.getElementById('authModalTitle');
  const authModalSubtitle = document.getElementById('authModalSubtitle');
  const authAccountList = document.getElementById('authAccountList');
  const authFbConfirm = document.getElementById('authFbConfirm');
  const authFbAvatar = document.getElementById('authFbAvatar');
  const authFbName = document.getElementById('authFbName');
  const authFbEmail = document.getElementById('authFbEmail');
  const authFbContinueBtn = document.getElementById('authFbContinueBtn');
  const authFbSwitchBtn = document.getElementById('authFbSwitchBtn');
  const authNewAccountForm = document.getElementById('authNewAccountForm');
  const authNewAccountTitle = document.getElementById('authNewAccountTitle');
  const authNewName = document.getElementById('authNewName');
  const authNewEmail = document.getElementById('authNewEmail');
  const authNewAccountContinueBtn = document.getElementById('authNewAccountContinueBtn');
  const authBackBtn = document.getElementById('authBackBtn');
  const authModalCloseBtn = document.getElementById('authModalCloseBtn');
  const authModalFooterNote = document.getElementById('authModalFooterNote');

  const PROVIDER_CONFIG = {
    google: {
      storageKey: 'samipacks_cuentas_google',
      logoLetter: 'G',
      logoStyle: 'background:#f1f1f1;color:#db4437;',
      title: 'Elige una cuenta',
      subtitle: 'para continuar a SamiPacks',
      footerNote: 'Antes de continuar, SamiPacks accederá a tu nombre, correo y foto de perfil de Google.',
      newAccountTitle: 'Agregar cuenta de Google',
      domainFallback: 'gmail.com',
      seed: [{ nombre: 'Alex Rivera', correo: 'alex.rivera@gmail.com' }]
    },
    facebook: {
      storageKey: 'samipacks_cuentas_facebook',
      logoLetter: 'f',
      logoStyle: 'background:#eef4ff;color:#1877f2;',
      title: 'Continuar con Facebook',
      subtitle: '',
      footerNote: 'SamiPacks recibirá tu nombre y correo de Facebook. Nunca publicaremos nada sin tu permiso.',
      newAccountTitle: 'Iniciar sesión en Facebook',
      domainFallback: 'facebook.com',
      seed: [{ nombre: 'Alex Rivera', correo: 'alex.rivera@facebook.com' }]
    }
  };

  let proveedorActivo = 'google';

  function obtenerCuentasGuardadas(provider) {
    const cfg = PROVIDER_CONFIG[provider];
    try {
      const raw = localStorage.getItem(cfg.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (err) {
      console.warn('No se pudo leer cuentas guardadas', err);
    }
    return cfg.seed.slice();
  }

  function guardarCuenta(provider, cuenta) {
    const cfg = PROVIDER_CONFIG[provider];
    const cuentas = obtenerCuentasGuardadas(provider);
    const yaExiste = cuentas.some((c) => c.correo.toLowerCase() === cuenta.correo.toLowerCase());
    if (!yaExiste) {
      cuentas.unshift(cuenta);
      try {
        localStorage.setItem(cfg.storageKey, JSON.stringify(cuentas));
      } catch (err) {
        console.warn('No se pudo guardar la cuenta', err);
      }
    }
    return cuentas;
  }

  function inicialDe(nombre) {
    return (nombre || '?').trim().charAt(0).toUpperCase();
  }

  function cerrarModalAuth() {
    if (!authModalOverlay) return;
    authModalOverlay.classList.remove('is-open');
    authModalOverlay.setAttribute('aria-hidden', 'true');
  }

  function mostrarVistaListaGoogle() {
    const cfg = PROVIDER_CONFIG.google;
    if (authAccountList) authAccountList.classList.remove('is-hidden');
    if (authFbConfirm) authFbConfirm.hidden = true;
    if (authNewAccountForm) authNewAccountForm.classList.remove('is-open');

    const cuentas = obtenerCuentasGuardadas('google');
    if (authAccountList) {
      authAccountList.innerHTML = cuentas.map((cuenta) => `
        <button class="auth-account-item" type="button" data-correo="${cuenta.correo}">
          <span class="auth-account-avatar">${inicialDe(cuenta.nombre)}</span>
          <span class="auth-account-info">
            <span class="auth-account-name">${cuenta.nombre}</span><br />
            <span class="auth-account-email">${cuenta.correo}</span>
          </span>
        </button>
        `).join('') + `
        <button class="auth-account-item is-new" type="button" id="authAddAccountBtn">
          <span class="auth-account-avatar"><span class="material-icons" style="font-size:18px;">person_add</span></span>
          <span class="auth-account-info">
            <span class="auth-account-name">Usar otra cuenta</span>
          </span>
        </button>
      `;

      authAccountList.querySelectorAll('.auth-account-item[data-correo]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const correo = btn.dataset.correo;
          const cuenta = cuentas.find((c) => c.correo === correo);
          if (cuenta) seleccionarCuenta('google', cuenta);
        });
      });

      const addBtn = document.getElementById('authAddAccountBtn');
      if (addBtn) addBtn.addEventListener('click', () => mostrarVistaNuevaCuenta('google'));
    }

    if (authModalTitle) authModalTitle.textContent = cfg.title;
    if (authModalSubtitle) { authModalSubtitle.textContent = cfg.subtitle; authModalSubtitle.hidden = false; }
  }

  function mostrarVistaConfirmarFacebook() {
    const cfg = PROVIDER_CONFIG.facebook;
    const cuentas = obtenerCuentasGuardadas('facebook');
    const cuentaPrincipal = cuentas[0];

    if (authAccountList) authAccountList.classList.add('is-hidden');
    if (authNewAccountForm) authNewAccountForm.classList.remove('is-open');
    if (authFbConfirm) authFbConfirm.hidden = false;
    if (authModalSubtitle) authModalSubtitle.hidden = true;
    if (authModalTitle) authModalTitle.textContent = cfg.title;

    if (cuentaPrincipal) {
      if (authFbAvatar) authFbAvatar.textContent = inicialDe(cuentaPrincipal.nombre);
      if (authFbName) authFbName.textContent = cuentaPrincipal.nombre;
      if (authFbEmail) authFbEmail.textContent = cuentaPrincipal.correo;
    }

    if (authFbContinueBtn) {
      authFbContinueBtn.textContent = cuentaPrincipal ? `Continuar como ${cuentaPrincipal.nombre.split(' ')[0]}` : 'Continuar';
      authFbContinueBtn.onclick = () => {
        if (cuentaPrincipal) seleccionarCuenta('facebook', cuentaPrincipal);
      };
    }
    if (authFbSwitchBtn) {
      authFbSwitchBtn.onclick = () => mostrarVistaNuevaCuenta('facebook');
    }
  }

  function mostrarVistaNuevaCuenta(provider) {
    const cfg = PROVIDER_CONFIG[provider];
    if (authAccountList) authAccountList.classList.add('is-hidden');
    if (authFbConfirm) authFbConfirm.hidden = true;
    if (authNewAccountForm) authNewAccountForm.classList.add('is-open');
    if (authModalSubtitle) authModalSubtitle.hidden = true;
    if (authModalTitle) authModalTitle.textContent = provider === 'google' ? 'Agregar cuenta' : 'Iniciar sesión';
    if (authNewAccountTitle) authNewAccountTitle.textContent = cfg.newAccountTitle;
    if (authNewName) authNewName.value = '';
    if (authNewEmail) authNewEmail.value = '';
  }

  function seleccionarCuenta(provider, cuenta) {
    guardarCuenta(provider, cuenta);
    cerrarModalAuth();
    iniciarSesionConDatos({ id: Date.now(), nombre: cuenta.nombre, correo: cuenta.correo });
  }

  function abrirModalAuth(provider) {
    proveedorActivo = provider;
    const cfg = PROVIDER_CONFIG[provider];
    if (!authModalOverlay || !cfg) return;

    if (authModalLogo) {
      authModalLogo.textContent = cfg.logoLetter;
      authModalLogo.setAttribute('style', cfg.logoStyle);
    }
    if (authModalFooterNote) authModalFooterNote.textContent = cfg.footerNote;

    if (provider === 'google') {
      mostrarVistaListaGoogle();
    } else {
      mostrarVistaConfirmarFacebook();
    }

    authModalOverlay.classList.add('is-open');
    authModalOverlay.setAttribute('aria-hidden', 'false');
  }

  if (authBackBtn) {
    authBackBtn.addEventListener('click', () => {
      if (proveedorActivo === 'google') mostrarVistaListaGoogle();
      else mostrarVistaConfirmarFacebook();
    });
  }

  if (authNewAccountContinueBtn) {
    authNewAccountContinueBtn.addEventListener('click', () => {
      const cfg = PROVIDER_CONFIG[proveedorActivo];
      const nombre = (authNewName?.value || '').trim();
      let correo = (authNewEmail?.value || '').trim();

      if (!nombre) {
        authNewName?.focus();
        return;
      }
      if (!validarCorreo(correo)) {
        // Si escribió solo el usuario, completar el dominio típico del proveedor
        if (correo && !correo.includes('@')) correo = `${correo}@${cfg.domainFallback}`;
        if (!validarCorreo(correo)) {
          authNewEmail?.focus();
          return;
        }
      }
      seleccionarCuenta(proveedorActivo, { nombre, correo });
    });
  }

  if (authModalCloseBtn) authModalCloseBtn.addEventListener('click', cerrarModalAuth);
  if (authModalOverlay) {
    authModalOverlay.addEventListener('click', (event) => {
      if (event.target === authModalOverlay) cerrarModalAuth();
    });
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && authModalOverlay?.classList.contains('is-open')) {
      cerrarModalAuth();
    }
  });

  if (btnGoogle) {
    btnGoogle.onclick = () => abrirModalAuth('google');
  }
  if (btnFacebook) {
    btnFacebook.onclick = () => abrirModalAuth('facebook');
  }

  // ==========================================================================
  // 👑 LISTENERS DEL PANEL DE ADMIN
  // ==========================================================================
  const adminProductForm = document.getElementById('adminProductForm');
  if (adminProductForm) {
    adminProductForm.addEventListener('submit', publicarSamipackDesdeAdmin);
  }

  // Autocompletar coordenadas: espera 900ms después de que el usuario deja de escribir
  // la dirección (para no llamar al servicio de geocodificación en cada tecla),
  // y también busca de inmediato si el campo pierde el foco.
  const adminAddressInput = document.getElementById('adminAddress');
  if (adminAddressInput) {
    adminAddressInput.addEventListener('input', (e) => {
      clearTimeout(geocodeTimeoutId);
      geocodeTimeoutId = setTimeout(() => buscarCoordenadasDesdeDireccion(e.target.value), 900);
    });
    adminAddressInput.addEventListener('blur', (e) => {
      clearTimeout(geocodeTimeoutId);
      buscarCoordenadasDesdeDireccion(e.target.value);
    });
  }

  const adminBuscarCoordsBtn = document.getElementById('adminBuscarCoordsBtn');
  if (adminBuscarCoordsBtn) {
    adminBuscarCoordsBtn.addEventListener('click', () => {
      buscarCoordenadasDesdeDireccion(document.getElementById('adminAddress').value);
    });
  }

  const adminTabBtnPublicar = document.getElementById('adminTabBtnPublicar');
  const adminTabBtnReservas = document.getElementById('adminTabBtnReservas');
  const adminTabBtnHistorial = document.getElementById('adminTabBtnHistorial');
  const adminTabBtnPerfil = document.getElementById('adminTabBtnPerfil');
  if (adminTabBtnPublicar) adminTabBtnPublicar.addEventListener('click', () => mostrarTabAdmin('publicar'));
  if (adminTabBtnReservas) adminTabBtnReservas.addEventListener('click', () => mostrarTabAdmin('reservas'));
  if (adminTabBtnHistorial) adminTabBtnHistorial.addEventListener('click', () => mostrarTabAdmin('historial'));
  if (adminTabBtnPerfil) adminTabBtnPerfil.addEventListener('click', () => mostrarTabAdmin('perfil'));

  const adminCancelEditBtn = document.getElementById('adminCancelEditBtn');
  if (adminCancelEditBtn) adminCancelEditBtn.addEventListener('click', cancelarEdicionSamipack);

  const adminConfirmarCodigoBtn = document.getElementById('adminConfirmarCodigoBtn');
  const adminCodigoInput = document.getElementById('adminCodigoInput');
  if (adminConfirmarCodigoBtn && adminCodigoInput) {
    adminConfirmarCodigoBtn.addEventListener('click', () => {
      confirmarRecogidaPorCodigo(adminCodigoInput.value);
    });
    adminCodigoInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        confirmarRecogidaPorCodigo(adminCodigoInput.value);
      }
    });
  }

  const adminEscanearBtn = document.getElementById('adminEscanearBtn');
  const adminScannerCloseBtn = document.getElementById('adminScannerCloseBtn');
  if (adminEscanearBtn) adminEscanearBtn.addEventListener('click', abrirEscanerAdmin);
  if (adminScannerCloseBtn) adminScannerCloseBtn.addEventListener('click', cerrarEscanerAdmin);

  function cerrarSesionAdmin() {
    cerrarEscanerAdmin();
    usuarioLogueado = null;
    reservasAdminActuales = [];
    setActiveView('login');
    mostrarPantallaDeRol();
  }

  const btnAdminLogout = document.getElementById('btnAdminLogout');
  if (btnAdminLogout) {
    btnAdminLogout.addEventListener('click', cerrarSesionAdmin);
  }
  const btnAdminLogoutPerfil = document.getElementById('btnAdminLogoutPerfil');
  if (btnAdminLogoutPerfil) {
    btnAdminLogoutPerfil.addEventListener('click', cerrarSesionAdmin);
  }

if (profileItems.length) {
    profileItems.forEach((item) => {
      item.addEventListener('click', () => {
        const target = item.dataset.view;
        
        if (target === 'reservations' || target === 'history') {
          mostrarBotonVolverReservas('profile');
          if (target === 'history') {
            cargarHistorialDesdeBaseDatos();
            setActiveView('reservations');
          } else {
            cargarReservasDesdeBaseDatos();
            setActiveView(target);
          }
        } else if (target === 'rating-module') { // 🌟 NUEVO: Captura el clic y ejecuta la interfaz de estrellas
          cargarPacksParaCalificar();
          setActiveView('rating');
        
        } else if (target === 'help') { // 🌟 ¡ESTA CONDICIÓN ES LA QUE FALTA ENLAZAR!
          setActiveView('help');  

        } else if (target === 'settings') { // 🌟 AGREGA ESTA CONDICIÓN EXACTAMENTE AQUÍ
          setActiveView('settings');  
        
        } else if (target === 'logout') {
          usuarioLogueado = null;
          setActiveView('login');
          mostrarPantallaDeRol();
        } else {
          alert(`Abriendo vista limpia para: ${target.toUpperCase()}. El módulo está conectado.`);
        }
      });
    });
  }

  // ==========================================================================
  // 🔙 FLECHA DE REGRESO EN "MIS RESERVAS" (siempre visible)
  // ==========================================================================
  // "Mis reservas" se abre tanto desde el navbar inferior como desde el
  // Perfil. Se recuerda de dónde vino la persona para que la flecha la
  // regrese al lugar correcto (Perfil u Home) en vez de a un sitio fijo.
  const backFromReservationsBtn = document.getElementById('backFromReservations');
  let origenReservas = 'home';

  function mostrarBotonVolverReservas(origen) {
    origenReservas = origen;
  }

  if (backFromReservationsBtn) {
    backFromReservationsBtn.addEventListener('click', () => {
      setActiveView(origenReservas);
    });
  }

  // Cuando cargarReservasDesdeBaseDatos()/cargarHistorialDesdeBaseDatos()
  // reconstruyen la pantalla con innerHTML, el header original (con la
  // flecha) se pierde. Este helper genera el mismo header con la flecha
  // incluida, y reconectarBotonVolverReservas() vuelve a engancharle el
  // click después de cada reemplazo de innerHTML.
  function headerReservasHTML(subtitulo) {
    return `
      <div class="screen-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <button id="backFromReservations" class="icon-button" type="button" aria-label="Volver">
            <span class="material-icons">arrow_back</span>
          </button>
          <div>
            <h3>Mis reservas</h3>
            <p>${subtitulo}</p>
          </div>
        </div>
      </div>
    `;
  }

  function reconectarBotonVolverReservas() {
    const btn = document.getElementById('backFromReservations');
    if (btn) btn.addEventListener('click', () => setActiveView(origenReservas));
  }

  // ==========================================================================
  // 🔍 BÚSQUEDA POR TECLADO EN TIEMPO REAL
  // ==========================================================================
  if (searchInput) {
    let searchDebounceId = null;

    searchInput.addEventListener('input', (event) => {
      searchQuery = event.target.value;

      // Pequeño debounce para no re-renderizar en cada tecla si la lista crece
      clearTimeout(searchDebounceId);
      searchDebounceId = setTimeout(() => {
        renderCards();
      }, 200);
    });

    // Enter dispara la búsqueda al instante y cierra el teclado en móvil
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        clearTimeout(searchDebounceId);
        renderCards();
        searchInput.blur();
      }
    });
  }

  if (categoryRow) {
    categoryRow.addEventListener('click', (event) => {
      const button = event.target.closest('.category-btn');
      if (!button) return;
      activeCategory = button.dataset.category;
      updateCategoryButtons();
      renderCards();
    });
  }

  if (filtersToggle && filterRow) {
    filtersToggle.addEventListener('click', () => {
      const isOpen = filterRow.classList.toggle('is-open');
      filtersToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      renderCards();
    });
  });

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      activeCategory = 'Todos';
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      updateCategoryButtons();
      filterChips.forEach((chip) => chip.classList.remove('active'));
      renderCards();
    });
  }

  // ==========================================================================
  // 📍 UBICACIÓN ACTUAL DEL DISPOSITIVO
  // ==========================================================================
  async function obtenerNombreDeUbicacion(latitude, longitude) {
    // Nominatim (OpenStreetMap) no requiere API key, ideal para esta versión.
    // Si en producción prefieren más precisión/consistencia, se puede migrar
    // a Google Geocoding API (requiere API key con facturación habilitada).
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
      { headers: { 'Accept-Language': 'es' } }
    );
    if (!response.ok) throw new Error('No se pudo resolver la dirección');
    const data = await response.json();
    const address = data.address || {};
    const distrito = address.suburb || address.neighbourhood || address.city_district
      || address.town || address.village || address.city || 'Tu zona';
    const ciudad = address.city || address.state || 'Lima';
    return `${distrito}, ${ciudad}`;
  }

  function actualizarUbicacionActual() {
    if (!locationLabel) return;

    if (!('geolocation' in navigator)) {
      locationLabel.textContent = 'Ubicación no disponible';
      return;
    }

    locationLabel.textContent = 'Ubicando...';

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        userCoords = { lat: position.coords.latitude, lon: position.coords.longitude };
        try {
          const nombre = await obtenerNombreDeUbicacion(
            position.coords.latitude,
            position.coords.longitude
          );
          locationLabel.textContent = nombre;
        } catch (err) {
          console.error('Error al resolver la dirección:', err);
          locationLabel.textContent = 'Miraflores, Lima';
        }
        renderCards(); // recalcula distancias y el orden del filtro "Distancia" con la ubicación real
      },
      (error) => {
        console.warn('Geolocalización rechazada o no disponible:', error);
        // El usuario no dio permiso o el dispositivo no pudo ubicarlo:
        // dejamos un texto claro e invitamos a reintentar tocando la pastilla.
        locationLabel.textContent = 'Activar ubicación';
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
    );
  }

  if (locationPill) {
    locationPill.addEventListener('click', actualizarUbicacionActual);
  }

  if (backToHomeBtn) {
    backToHomeBtn.addEventListener('click', () => {
      setActiveView('home');
    });
  }

  if (reserveFooterBtn) {
    reserveFooterBtn.onclick = () => {
      showConfirmation(selectedPack);
    };
  }

  if (backToDetailBtn) {
    backToDetailBtn.addEventListener('click', () => {
      setActiveView('detail');
    });
  }

  if (confirmTerms && confirmReservationBtn) {
    confirmTerms.addEventListener('change', () => {
      confirmReservationBtn.disabled = !confirmTerms.checked;
    });
  }

  if (confirmReservationBtn) {
    confirmReservationBtn.addEventListener('click', () => {
      if (!confirmTerms || !confirmTerms.checked) return;
      registrarReservaEnBaseDatos(selectedPack);
    });
  }

  if (ticketLocationBtn) {
    ticketLocationBtn.addEventListener('click', () => {
      if (selectedPack && selectedPack.coordinates) {
        window.open(`https://maps.google.com/?q=${selectedPack.coordinates}`, '_blank', 'noopener,noreferrer');
      }
    });
  }

  if (ticketShareBtn) {
    ticketShareBtn.addEventListener('click', async () => {
      const shareText = `Reserva confirmada en SamiPacks para ${selectedPack.business}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'SamiPacks',
            text: shareText,
            url: window.location.href
          });
        } catch (error) {
          console.log('Compartir cancelado', error);
        }
      } else {
        window.alert(shareText);
      }
    });
  }

  if (ticketSaveBtn) {
    ticketSaveBtn.addEventListener('click', () => {
      ticketSaveBtn.textContent = '✓ Guardado';
      ticketSaveBtn.disabled = true;

      // NUEVO: Al guardar, traemos las reservas actualizadas de la BD y nos mueve a la pestaña de reservas
      mostrarBotonVolverReservas('home');
      cargarReservasDesdeBaseDatos();
      setActiveView('reservations');

    });
  }

if (navItems.length) {
    navItems.forEach((item) => {
      item.addEventListener('click', () => {
        const target = item.dataset.view;
        if (target === 'home' || target === 'reservations' || target === 'profile') {
          if (target === 'reservations') {
            mostrarBotonVolverReservas('home');
            // 🌟 Fuerza la descarga limpia de reservas de MySQL al hacer clic en el menú
            cargarReservasDesdeBaseDatos(); 
          }
          setActiveView(target);
        }
      });
    });
}
async function cargarReservasDesdeBaseDatos() {
    const idUsuario = obtenerIdUsuarioValido();
    const listaReservasContenedor = document.querySelector('.reservations-screen'); 
    
    if (!listaReservasContenedor) return;

    // Diccionario unificado para mapear imágenes según la categoría real de la BD
    const imagenesPorCategoria = {
      'Panadería': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
      'Cafés': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300&q=80',
      'Bebidas': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=300&q=80',
      'Comidas': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80',
      'Postres': 'https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?auto=format&fit=crop&w=300&q=80'
    };

    try {
      const response = await fetch(`${API_URL}/reservas/${idUsuario}`);
      const data = await response.json();

      if (data.success && data.reservas.length > 0) {
        let htmlContent = `
          ${headerReservasHTML('Gestiona tus entregas y revisa tus reservas activas.')}
          <div class="tabs-row">
            <button class="tab-btn active">Activas</button>
            <button class="tab-btn" id="btnTabHistorial">Historial</button>
          </div>
          <div class="cards-list" style="margin-top: 14px;">
            <div class="section-title-row">
              <h4>Próximas entregas</h4>
              <span class="section-badge">${data.reservas.length} pendientes</span>
            </div>
        `;

        // CORRECCIÓN INTERNA: Aplicar las clases .history-card-* para alinear todo perfectamente
        htmlContent += data.reservas.map(reserva => {
          const datosReservaStr = encodeURIComponent(JSON.stringify(reserva));
          
          // Obtener la URL correspondiente o usar una por defecto
          const imgUrl = reserva.image || imagenesPorCategoria[reserva.categoria || reserva.samipack_nombre] || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80';

          return `
            <div class="reservation-card real-db-card history-card-layout" data-reserva="${datosReservaStr}" style="cursor: pointer;">
              <img class="history-card-img" src="${imgUrl}" alt="${reserva.negocio}">
              <div class="history-card-body">
                <div class="history-card-top">
                  <h5>${reserva.negocio}</h5>
                  <span class="status-chip green">Disponible</span>
                </div>
                <p class="history-card-desc">Pack de ${reserva.samipack_nombre.toLowerCase()} (${reserva.cantidad}x)</p>
                <div class="history-card-meta">
                  <span class="history-card-price">S/ ${parseFloat(reserva.precio_total).toFixed(2)}</span>
                  <span class="history-card-code">Código: <strong>${reserva.codigo_alfanumerico}</strong></span>
                </div>
              </div>
            </div>
          `;
        }).join('');

        htmlContent += `</div>`;
        listaReservasContenedor.innerHTML = htmlContent;
        reconectarBotonVolverReservas();

        // Reconectar los clics de la pestaña de historial
        const tabHistorialBtn = document.getElementById('btnTabHistorial');
        if (tabHistorialBtn) {
          tabHistorialBtn.onclick = () => cargarHistorialDesdeBaseDatos();
        }

        // Clics en los recuadros para abrir la boleta con QR correspondiente
        const tarjetasReales = listaReservasContenedor.querySelectorAll('.real-db-card');
        tarjetasReales.forEach(tarjeta => {
          tarjeta.addEventListener('click', () => {
            const reservaObjeto = JSON.parse(decodeURIComponent(tarjeta.dataset.reserva));
            if (ticketCode) ticketCode.textContent = reservaObjeto.codigo_alfanumerico;
            if (ticketBusiness) ticketBusiness.textContent = reservaObjeto.negocio;
            if (ticketUser) ticketUser.textContent = usuarioLogueado ? usuarioLogueado.nombre : 'Alex Rivera';
            if (ticketDate) ticketDate.textContent = 'Hoy';
            if (ticketLimit) ticketLimit.textContent = 'Hoy (Verificar horario)';
            if (ticketQr) {
              ticketQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${reservaObjeto.qr_data}`;
            }
            setActiveView('ticket');
          });
        });

      } else {
        listaReservasContenedor.innerHTML = `
          ${headerReservasHTML('No tienes reservas activas en este momento.')}
          <div class="tabs-row">
            <button class="tab-btn active">Activas</button>
            <button class="tab-btn" id="btnTabHistorial">Historial</button>
          </div>
          <div style="text-align:center; margin-top:40px; color:#8c8c8c;">
            <span class="material-icons" style="font-size:48px;">receipt_long</span>
            <p>¡Explora el Home y salva tu primer SamiPack!</p>
          </div>
        `;
        reconectarBotonVolverReservas();

        const tabHistorialBtn = document.getElementById('btnTabHistorial');
        if (tabHistorialBtn) {
          tabHistorialBtn.onclick = () => cargarHistorialDesdeBaseDatos();
        }
      }
    } catch (err) {
      console.error("Error al cargar reservas:", err);
    }
  }
  
async function cargarHistorialDesdeBaseDatos() {
    const idUsuario = obtenerIdUsuarioValido();
    const listaReservasContenedor = document.querySelector('.reservations-screen');
    
    if (!listaReservasContenedor) return;

    // Diccionario de imágenes dinámicas según la categoría para evitar que se repita la misma foto
    const imagenesPorCategoria = {
      'Panadería': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
      'Cafés': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300&q=80',
      'Bebidas': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=300&q=80',
      'Comidas': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80',
      'Postres': 'https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?auto=format&fit=crop&w=300&q=80'
    };

    try {
      const response = await fetch(`${API_URL}/historial/${idUsuario}`);
      const data = await response.json();

      if (data.success && data.historial.length > 0) {
        let htmlContent = `
          ${headerReservasHTML('Gestiona tus entregas y revisa tus reservas activas.')}
          <div class="tabs-row">
            <button class="tab-btn" id="btnTabActivas">Activas</button>
            <button class="tab-btn active" id="btnTabHistorial">Historial</button>
          </div>
          <div class="cards-list" style="margin-top: 14px;"> <div class="section-title-row">
              <h4>Historial de reservas</h4>
              <span class="section-badge muted">${data.historial.length} eventos</span>
            </div>
        `;

        htmlContent += data.historial.map(item => {
          let classColor = 'gray';
          if (item.estado === 'Recogido') classColor = 'green';
          if (item.estado === 'Cancelado') classColor = 'red';
          if (item.estado === 'Expirado') classColor = 'gray';
          if (item.estado === 'Pendiente de recoger' || item.estado === 'Pendiente') classColor = 'yellow';

          // Seleccionar la imagen correcta o usar una por defecto si no coincide
          const imgUrl = item.image || imagenesPorCategoria[item.categoria || item.samipack_nombre] || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80';

          return `
            <div class="history-card-layout">
              <img class="history-card-img" src="${imgUrl}" alt="${item.negocio}">
              <div class="history-card-body">
                <div class="history-card-top">
                  <h5>${item.negocio}</h5>
                  <span class="status-chip ${classColor}">${item.estado}</span>
                </div>
                <p class="history-card-desc">Pack de ${item.samipack_nombre.toLowerCase()} (${item.cantidad}x)</p>
                <div class="history-card-meta">
                  <span class="history-card-price">S/ ${parseFloat(item.precio_total).toFixed(2)}</span>
                  <span class="history-card-code">Código: <strong>${item.codigo_alfanumerico}</strong></span>
                </div>
              </div>
            </div>
          `;
        }).join('');

        htmlContent += `</div>`;
        listaReservasContenedor.innerHTML = htmlContent;
        reconectarBotonVolverReservas();

        document.getElementById('btnTabActivas').onclick = () => cargarReservasDesdeBaseDatos();

      } else {
        listaReservasContenedor.innerHTML = `
          ${headerReservasHTML('Gestiona tus entregas y revisa tus reservas activas.')}
          <div class="tabs-row">
            <button class="tab-btn" id="btnTabActivas">Activas</button>
            <button class="tab-btn active">Historial</button>
          </div>
          <div style="text-align:center; margin-top:40px; color:#8c8c8c;">
            <span class="material-icons" style="font-size:48px;">history_toggle_off</span>
            <p>Tu historial está limpio en este momento.</p>
          </div>
        `;
        reconectarBotonVolverReservas();
        document.getElementById('btnTabActivas').onclick = () => cargarReservasDesdeBaseDatos();
      }
    } catch (err) {
      console.error("Error al cargar historial:", err);
    }
  }

async function cargarPacksParaCalificar() {
    const idUsuario = obtenerIdUsuarioValido();
    if (!ratingCardsList) return;

    const imagenesPorCategoria = {
      'Panadería': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
      'Cafés': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300&q=80',
      'Bebidas': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=300&q=80',
      'Comidas': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80',
      'Postres': 'https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?auto=format&fit=crop&w=300&q=80'
    };

    try {
      const response = await fetch(`${API_URL}/pendientes-calificar/${idUsuario}`);
      const data = await response.json();

      if (data.success && data.packs.length > 0) {
        ratingCardsList.innerHTML = data.packs.map(pack => {
          const imgUrl = pack.image || imagenesPorCategoria[pack.categoria || pack.samipack_nombre] || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80';
          return `
            <div class="history-card-layout" data-id="${pack.id}">
              <img class="history-card-img" src="${imgUrl}" alt="${pack.negocio}">
              <div class="history-card-body">
                <div class="history-card-top">
                  <h5>${pack.negocio}</h5>
                </div>
                <p class="history-card-desc">Retirado con éxito (${pack.cantidad}x)</p>
                
                <div class="history-card-meta rating-box-container">
                  <div class="star-rating-row" data-id="${pack.id}">
                    <span class="material-icons star-item" data-value="1">star_border</span>
                    <span class="material-icons star-item" data-value="2">star_border</span>
                    <span class="material-icons star-item" data-value="3">star_border</span>
                    <span class="material-icons star-item" data-value="4">star_border</span>
                    <span class="material-icons star-item" data-value="5">star_border</span>
                  </div>
                  <button class="submit-rating-btn" id="btnSubmit-${pack.id}" disabled>Enviar nota</button>
                </div>
              </div>
            </div>
          `;
        }).join('');

        // LOGICA INTERACTIVA DE CLICS EN ESTRELLAS
        const tarjetas = ratingCardsList.querySelectorAll('.history-card-layout');
        tarjetas.forEach(tarjeta => {
          const packId = tarjeta.dataset.id;
          const estrellas = tarjeta.querySelectorAll('.star-item');
          const btnEnviar = tarjeta.querySelector(`.submit-rating-btn`);
          let valorSeleccionado = 0;

          estrellas.forEach(estrella => {
            estrella.addEventListener('click', () => {
              valorSeleccionado = Number(estrella.dataset.value);
              btnEnviar.disabled = false; // Habilitar el botón al marcar estrellas

              // Pintar de dorado las estrellas seleccionadas y limpiar las restantes
              estrellas.forEach(e => {
                const val = Number(e.dataset.value);
                if (val <= valorSeleccionado) {
                  e.textContent = 'star';
                  e.classList.add('selected');
                } else {
                  e.textContent = 'star_border';
                  e.classList.remove('selected');
                }
              });
            });
          });

          // Evento de guardado hacia MySQL
          btnEnviar.onclick = async () => {
            try {
              const res = await fetch(`${API_URL}/guardar-calificacion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reserva_id: packId, estrellas: valorSeleccionado })
              });
              const rData = await res.json();
              if (rData.success) {
                alert('¡Gracias por tu calificación!');
                cargarPacksParaCalificar(); // Refrescar módulo de inmediato
              }
            } catch (err) {
              console.error(err);
            }
          };
        });

      } else {
        ratingCardsList.innerHTML = `
          <div style="text-align:center; margin-top:60px; color:#8c8c8c;">
            <span class="material-icons" style="font-size:54px; color: var(--green);">verified</span>
            <p style="margin-top:10px; font-weight:600;">¡Estás al día!</p>
            <p style="font-size:13px; padding:0 20px;">No tienes ningún SamiPack pendiente de calificar en este momento.</p>
          </div>
        `;
      }
    } catch (err) {
      console.error(err);
    }
  }
  const backToProfileFromRating = document.getElementById('backToProfileFromRating');
  if (backToProfileFromRating) {
    backToProfileFromRating.addEventListener('click', () => {
      setActiveView('profile');
    });
  }
  const backToProfileFromHelp = document.getElementById('backToProfileFromHelp');
  if (backToProfileFromHelp) {
    backToProfileFromHelp.addEventListener('click', () => {
      setActiveView('profile');
    });
  }
  // 🌟 AGREGA ESTE LISTENER AL FINAL DE TU APP.JS (Cerca de los otros botones "Volver")
  const backToHomeFromTicket = document.getElementById('backToHomeFromTicket');
  if (backToHomeFromTicket) {
    backToHomeFromTicket.addEventListener('click', () => {
      setActiveView('home'); // Te lleva de regreso de forma segura a la grilla principal
    });
  }

  // 🌟 CONTROLADOR DINÁMICO DE MODO OSCURO (PERSISTENTE)
  const darkModeToggle = document.getElementById('darkModeToggle');
  
  // Comprobar si el usuario ya tenía activado el modo oscuro anteriormente
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    if (darkModeToggle) darkModeToggle.checked = true;
  }

  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', () => {
      if (darkModeToggle.checked) {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark'); // Guardar preferencia en memoria
      } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
      }
    });
  }

  // BOTÓN VOLVER DE CONFIGURACIÓN
  const backToProfileFromSettings = document.getElementById('backToProfileFromSettings');
  if (backToProfileFromSettings) {
    backToProfileFromSettings.addEventListener('click', () => {
      setActiveView('profile');
    });
  }

  


  cargarSamipacksDesdeBD(); // Reemplaza el arreglo de ejemplo por los SamiPacks reales de MySQL
});