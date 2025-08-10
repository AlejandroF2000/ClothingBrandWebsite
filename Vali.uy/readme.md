# Proyecto Final - VĀLI Ecommerce 🛍️

Este es el proyecto final del curso de JavaScript (Coderhouse).  
Consiste en un **Ecommerce funcional** para la marca ficticia **VĀLI**, con catálogo de productos, carrito de compras persistente y proceso de compra simulado.

---

## 📌 Funcionalidades principales

- **Catálogo de productos** con imágenes, precios y botón “+” para agregar al carrito.
- **Carrito lateral** que se abre con un botón de bolsa de compras.
- **Badge dinámico** que muestra la cantidad de ítems en el carrito.
- **Persistencia en LocalStorage**: los productos agregados se mantienen al recargar la página.
- **Controles del carrito**:
  - Aumentar / disminuir cantidad de un producto.
  - Eliminar producto.
  - Vaciar carrito completo con confirmación.
- **Proceso de compra simulado** con formulario y validación usando **SweetAlert2**.
- **Formato de moneda** adaptado a UYU (pesos uruguayos).
- **Accesibilidad básica** (`aria-label`, `aria-live`).

---

## 🛠️ Tecnologías utilizadas

- **HTML5** → Estructura del sitio y contenido.
- **CSS3 + Bootstrap 4** → Estilos y grilla responsive.
- **JavaScript (ES6+)** → Lógica de negocio y manipulación del DOM.
- **SweetAlert2** → Alertas y formularios interactivos.
- **LocalStorage** → Guardado persistente del carrito.
- **Intl.NumberFormat** → Formato de moneda local.

---

## 📂 Estructura del proyecto

``
vali-uy/
│
├── config/ # Archivos SCSS de configuración
│ ├── lazyloading.scss
│ ├── media-queries.scss
│ ├── mixins.scss
│ ├── reset.scss
│ └── var.scss
│
├── css/
│ ├── style.css
│ └── style.css.map
│
├── images/
│ ├── Colecciones/
│ ├── Contactanos/
│ ├── Inicio/
│ ├── Productos/
│ ├── Sobrenosotros/
│ └── vali-logo/
│
├── js/
│ └── main.js # Lógica principal del carrito y productos
│
├── Pages/
│ ├── colecciones.html
│ ├── contactanos.html
│ ├── productos.html
│ └── sobre_nosotros.html
│
├── index.html
└── readme.md
