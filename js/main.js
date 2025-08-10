// app-productos.js
// =======================================================
// VĀLI | Carrito solo para productos
// Nota: intenté hacerlo simple, entendible y sin cosas raras.
//
// =======================================================

(() => {
  'use strict';

  // -------------------- Config general --------------------
  // Formato de moneda (UYU) -> en algún momento capaz lo paso a USD 😅
  const currency = new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    maximumFractionDigits: 0
  });

  // Clave de localStorage. Le pongo versión por si después cambio el formato.
  const STORAGE_KEY = 'vali.cart.productos';
  const STORAGE_VERSION = 1; // si cambio estructura del objeto, subo este número

  // Selectores (los que están en productos.html)
  const SEL = {
    badge: '#badge',
    btnCarrito: '#btnCarrito',
    panelCarrito: '#carrito',
    cerrarCarrito: '#cerrarCarrito',
    tbody: '#carritoBody',
    total: '#total',
    btnVaciar: '#vaciar',
    btnComprar: '#comprar',
    addBtn: '.add-btn' // los circulitos de +
  };

  // -------------------- Estado --------------------
  // Cada item tiene: { id, nombre, precio, img, cat, cantidad }
  let carrito = [];

  // esto no lo uso pero lo dejo por si después quiero mostrarlo en el header
  let totalItemsCalculado = 0; // (quedó de una prueba, no molesta)

  // -------------------- Helpers --------------------
  const $ = (sel) => document.querySelector(sel);

  // Formatea plata. Si llega NaN o algo raro, muestro $ 0 (mejor que explotar).
  const money = (n) => currency.format(Number(n) || 0);

  // Suma cantidades (para el badge).
  const contar = (items) => items.reduce((acc, it) => acc + it.cantidad, 0);

  // Suma total en $
  const totalizar = (items) => items.reduce((acc, it) => acc + (it.precio * it.cantidad), 0);

  // Intento parsear JSON seguro.
  const safeParseJSON = (txt, fallback) => {
    try { return JSON.parse(txt); } catch { return fallback; }
  };

  // Si el producto ya existe, le subo cantidad; si no, lo agrego.
  function upsertItem(lista, nuevo) {
    const i = lista.findIndex(x => x.id === nuevo.id);
    if (i > -1) {
      // clon “barato” (acá podría usar structuredClone, pero así se entiende)
      const copia = lista.map(x => ({ ...x }));
      copia[i].cantidad += nuevo.cantidad;
      return copia;
    }
    return [...lista, { ...nuevo }];
  }

  // Cambiar cantidad (+1 o -1). Si queda en 0, lo saco.
  function changeQty(lista, id, delta) {
    const copia = lista.map(x => x.id === id ? { ...x, cantidad: x.cantidad + delta } : x);
    return copia.filter(x => x.cantidad > 0);
  }

  // Eliminar por id.
  const deleteById = (lista, id) => lista.filter(x => x.id !== id);

  // -------------------- Storage --------------------
  function loadCart() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = safeParseJSON(raw, null);
    // chequeos medio “manuales”, pero suficientes para esta entrega
    if (!data || typeof data !== 'object') return [];
    if (data.version !== STORAGE_VERSION || !Array.isArray(data.items)) return [];
    return data.items.map(it => ({
      id: String(it.id || ''),
      nombre: String(it.nombre || ''),
      precio: Number(it.precio || 0),
      img: String(it.img || ''),
      cat: String(it.cat || ''),
      cantidad: Math.max(1, Number(it.cantidad || 1))
    })).filter(it => it.id); // por las dudas
  }

  function saveCart(items) {
    // (podría comprimir, pero así queda legible)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: STORAGE_VERSION,
      items
    }));
  }

  // -------------------- Cache de nodos --------------------
  const badgeEl = $(SEL.badge);
  const btnCarritoEl = $(SEL.btnCarrito);
  const panelEl = $(SEL.panelCarrito);
  const cerrarEl = $(SEL.cerrarCarrito);
  const tbodyEl = $(SEL.tbody);
  const totalEl = $(SEL.total);
  const btnVaciarEl = $(SEL.btnVaciar);
  const btnComprarEl = $(SEL.btnComprar);

  // Accesibilidad básica
  badgeEl && badgeEl.setAttribute('aria-live', 'polite');

  // Toasts con SweetAlert2 (queda lindo y no usamos alert/confirm del navegador)
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true
  });

  // -------------------- Render --------------------
  function renderCarrito() {
    if (!badgeEl || !tbodyEl || !totalEl) return; // por si alguien quita el HTML

    // badge
    const cant = contar(carrito);
    badgeEl.textContent = String(cant);
    totalItemsCalculado = cant; // (no lo uso ahora, pero lo dejo)

    // filas
    if (!carrito.length) {
      tbodyEl.innerHTML = `<tr><td colspan="3"><em>Tu carrito está vacío.</em></td></tr>`;
    } else {
      tbodyEl.innerHTML = carrito.map(p => `
        <tr>
          <td>
            <div style="display:flex; gap:.5rem; align-items:center;">
              <img src="${p.img}" alt="${p.nombre}" width="44" height="44"
                   style="width:44px;height:44px;object-fit:cover;border-radius:6px;border:1px solid #eee;">
              <div style="display:flex; flex-direction:column;">
                <strong>${p.nombre}</strong>
                <small style="opacity:.7">${p.cat}</small>
              </div>
            </div>
          </td>
          <td class="acciones">
            <button class="btn-min" data-act="menos" data-id="${p.id}" aria-label="Quitar uno">−</button>
            <span aria-live="polite">${p.cantidad}</span>
            <button class="btn-min" data-act="mas" data-id="${p.id}" aria-label="Agregar uno">+</button>
            <button class="btn-min" data-act="del" data-id="${p.id}" title="Eliminar" aria-label="Eliminar del carrito">🗑️</button>
          </td>
          <td>${money(p.precio * p.cantidad)}</td>
        </tr>
      `).join('');
    }

    // total
    totalEl.textContent = money(totalizar(carrito));
  }

  // -------------------- Acciones principales --------------------
  function agregar(prod) {
    // Normalizo (por si algún data-* viene vacío o texto raro)
    const base = {
      id: String(prod && prod.id || ''),          // si no hay id, no agrego
      nombre: String(prod && prod.nombre || ''),
      precio: Number(prod && prod.precio || 0),
      img: String(prod && prod.img || ''),
      cat: String(prod && prod.cat || ''),
      cantidad: Number(prod && prod.cantidad || 1)
    };
    if (!base.id) {
      // comentario “humano”: sin id no me la juego
      return;
    }
    carrito = upsertItem(carrito, base);
    saveCart(carrito);
    renderCarrito();
    Toast.fire({ icon: 'success', title: 'Agregado al carrito' });
  }

  function qty(id, delta) {
    carrito = changeQty(carrito, id, delta);
    saveCart(carrito);
    renderCarrito();
  }

  function eliminar(id) {
    carrito = deleteById(carrito, id);
    saveCart(carrito);
    renderCarrito();
  }

  async function vaciar() {
    if (!carrito.length) return; // si ya está vacío, nada
    const res = await Swal.fire({
      title: 'Vaciar carrito',
      text: '¿Seguro que querés borrar todo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, vaciar',
      cancelButtonText: 'Cancelar'
    });
    if (res.isConfirmed) {
      carrito = []; // chau
      saveCart(carrito);
      renderCarrito();
      Toast.fire({ icon: 'success', title: 'Carrito vacío' });
    }
  }

  async function comprar() {
    if (!carrito.length) {
      // (queda mejor que un alert nativo)
      Toast.fire({ icon: 'info', title: 'El carrito está vacío' });
      return;
    }

    // Modal simple con datos precargados (la cátedra pide pre-carga 😉)
    const { value: formValues } = await Swal.fire({
      title: 'Finalizar compra',
      html: `
        <input id="swal-nombre" class="swal2-input" placeholder="Nombre y apellido" value="Alejandro">
        <input id="swal-email" class="swal2-input" placeholder="Email" value="alejandro@example.com">
        <input id="swal-dir" class="swal2-input" placeholder="Dirección (opcional)">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const nombre = document.getElementById('swal-nombre')?.value.trim();
        const email  = document.getElementById('swal-email')?.value.trim();
        const dir    = document.getElementById('swal-dir')?.value.trim();
        if (!nombre || !email) {
          Swal.showValidationMessage('Completá nombre y email'); // pequeño validador
          return false;
        }
        return { nombre, email, dir };
      }
    });

    if (!formValues) return; // canceló

    // Fake “procesamiento” (acá podría ir un fetch real si tuviera backend)
    await Swal.fire({
      icon: 'success',
      title: 'Compra realizada',
      text: `¡Gracias, ${formValues.nombre}! Te enviamos el detalle a ${formValues.email}.`
    });

    // Limpio el carrito al final
    carrito = [];
    saveCart(carrito);
    renderCarrito();
  }

  // -------------------- Eventos --------------------
  // Abrir panel
  $(SEL.btnCarrito)?.addEventListener('click', () => {
    $(SEL.panelCarrito)?.classList.add('abierto');
    $(SEL.panelCarrito)?.setAttribute('aria-hidden', 'false');
  });

  // Cerrar panel
  $(SEL.cerrarCarrito)?.addEventListener('click', () => {
    $(SEL.panelCarrito)?.classList.remove('abierto');
    $(SEL.panelCarrito)?.setAttribute('aria-hidden', 'true');
  });

  // Delegación global:
  // - Click en los circulitos + (debajo de las fotos)
  // - Click en los botones dentro de la tabla (mas/menos/del)
  document.addEventListener('click', (ev) => {
    const t = ev.target;

    // 1) botón +
    const addBtn = t.closest && t.closest(SEL.addBtn);
    if (addBtn) {
      const { id, nombre, precio, img, cat } = addBtn.dataset || {};
      agregar({
        id,
        nombre,
        precio: Number(precio), // ojo: viene de dataset, por eso Number()
        img,
        cat,
        cantidad: 1
      });
      return; // corto acá, no sigo evaluando
    }

    // 2) botones dentro del carrito
    const actionBtn = t.closest && t.closest('button[data-act][data-id]');
    const tbody = $(SEL.tbody);
    if (actionBtn && tbody && tbody.contains(actionBtn)) {
      const { act, id } = actionBtn.dataset;
      if (act === 'mas')   qty(id, +1);
      if (act === 'menos') qty(id, -1);
      if (act === 'del')   eliminar(id);
    }
  }, { passive: true });

  // Vaciar / Comprar
  $(SEL.btnVaciar)?.addEventListener('click', () => { /* en teoría podría preguntar de nuevo... */ void vaciar(); });
  $(SEL.btnComprar)?.addEventListener('click', () => { void comprar(); });

  // -------------------- Inicio --------------------
  // Cargo lo guardado (si hay) y dibujo
  carrito = loadCart();
  renderCarrito();

  // mini “detalle”: si algún día necesito resetear manual, puedo descomentar:
  // localStorage.removeItem(STORAGE_KEY);

})();
