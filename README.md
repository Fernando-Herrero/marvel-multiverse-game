# 🦸 Marvel Combat Game - Proyecto Educativo

Este proyecto es un juego de combate por turnos basado en personajes del universo Marvel, desarrollado como parte de un curso de JavaScript. Utiliza exclusivamente tecnologías web: **HTML**, **CSS** y **JavaScript**.

El juego permite al jugador elegir un personaje (héroe o villano) y enfrentarse a enemigos a lo largo de varios niveles. Las estadísticas y las imágenes de los personajes se obtienen mediante una API externa.

---

## 🎯 Objetivo del proyecto

El objetivo principal es aplicar conocimientos adquiridos durante el curso, tales como:

- Manipulación del DOM.
- Gestión de estado con `localStorage`.
- Consumo de APIs externas.
- Organización modular de código JavaScript.
- Diseño mobile-first.
- Buenas prácticas en HTML, CSS y JavaScript.

Este proyecto **no tiene fines comerciales** y ha sido desarrollado únicamente con fines **educativos y de aprendizaje**.

---

## 🧪 Tecnologías utilizadas

- **HTML5** – Estructura semántica y accesible.
- **CSS3** – Diseño modular dividido en:
  - `/styles/global.css` – Variables, resets y estilos base.
  - `/styles/index.css` – Estilos específicos de las pantallas principales.
  - `/styles/responsive.css` – Media queries para diseño responsive.

- **JavaScript** (ES6) – Código organizado en módulos según funcionalidad:
  - `/js/audio.js` – Control de efectos de sonido y música.
  - `/js/battle.js` – Lógica del sistema de combate.
  - `/js/character.js` – Carga de personajes desde API.
  - `/js/index.js` – Lógica de navegación entre pantallas.
  - `/js/login.js` – Gestión del login y nombre del jugador.
  - `/js/map.js` – Renderización del mapa de niveles.
  - `/js/storage.js` – Utilidades para `localStorage`.
  - `/js/utils.js` – Funciones auxiliares y genéricas.

---

## 🖼️ Recursos

- Las imágenes y estadísticas de los personajes provienen de una API externa (como SuperHero API).
- Los archivos multimedia se organizan dentro de la carpeta `/media`:
  - `/media/background` – Imágenes de fondo de las pantallas.
  - `/media/characters` – Avatares e imágenes de personajes.
  - `/media/icons` – Iconos del juego y elementos UI.
  - Audio del juego también se encuentra en esta carpeta.

---

## 🧠 Buenas prácticas aplicadas

- Uso correcto del flujo de **cascada en CSS** para mantener la jerarquía de estilos clara y ordenada.
- Código **modular** y **legible**, dividiendo responsabilidades por archivo.
- Diseño **mobile-first**, optimizado inicialmente para dispositivos móviles.
- Uso de `localStorage` para persistencia de datos como progreso, selección de personaje, etc.
- Nombres de clases y funciones **autoexplicativos**.
- Separación de lógica, estilos y estructura siguiendo los principios de **separación de preocupaciones**.

---

## ⚠️ Aviso legal

Este proyecto fue desarrollado **exclusivamente con fines educativos**.  
**Todos los personajes, nombres e imágenes pertenecen a Marvel y sus respectivos propietarios.**  
No se reclama ningún derecho sobre los personajes ni se pretende ningún uso comercial.

---

## 🚀 ¿Cómo probar el juego?

Puedes subir el proyecto a [Netlify](https://netlify.com), [Vercel](https://vercel.com), o abrir directamente `index.html` desde tu navegador.  
Se recomienda un entorno moderno y que soporte JavaScript ES6.

---

## 📁 Estructura de carpetas

```bash
📁 /js
├── audio.js
├── battle.js
├── character.js
├── index.js
├── login.js
├── map.js
├── storage.js
└── utils.js

📁 /styles
├── global.css
├── index.css
└── responsive.css

📁 /media
├── background/
├── characters/
├── icons/
└── audio/

📄 index.html

