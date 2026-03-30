# 📧 QuickMail - Servidor de Correo Temporal Anónimo

Bienvenido a **QuickMail**, una aplicación web moderna, ágil y atractiva visualmente que genera de manera instantánea correos electrónicos temporales completamente funcionales para proteger la privacidad del usuario y omitir el temido correo no deseado ("spam").

## 🚀 Funcionalidades

- **Bandeja de Entrada Real:** Los correos que recibas son **reales** y completamente temporales, impulsados por la poderosa API pública de `mail.tm`.
- **Diseño Premium y Responsivo:** Aspecto moderno ("Glassmorphism"), paleta de colores oscuro (Dark Mode), con microinteracciones de interfaz e íconos dinámicos.
- **Multilenguaje Dinámico:** Selector de idioma en tiempo real (Español, Inglés, Francés, Italiano, y Alemán) desde la propia interfaz, sin necesidad de recargar la página.
- **Temporizador Controlado:** Contador de tiempo visible (15 minutos). Al agotarse, se generará una nueva sesión por seguridad y anonimato.
- **Generador de QR Integrado:** Comparte o envía un correo rápidamente a tu dirección temporal escaneando el código QR en pantalla.
- **Cero Dependencias Falsas:** Se han eliminado por completo los datos simulados ("fake mockups"), brindando una experiencia "Product-Ready".

## 📂 Estructura del Proyecto

El proyecto está diseñado para ser desplegado instantáneamente en platafomas estáticas como GitHub Pages:

```text
/QuickMail
├── index.html        # Página principal de la aplicación.
├── style.css         # Hoja de estilos.
├── script.js         # Lógica de la aplicación y la Interfaz usando API REST.
├── /assets/          # Iconos e imágenes (incluye favicon).
├── /lang/            # Archivos locales de idioma (.json).
│   ├── es.json
│   ├── en.json
│   ├── fr.json
│   ├── it.json
│   └── de.json
└── README.md         # Documentación de la app.
```

## 🛠️ Cómo Utilizar

1. **Abre la página web:** QuickMail generará una dirección de correo temporal automáticamente.  
2. **Copia el correo:** Usa el botón de copiado rápido o interactúa con el botón QR para escanearlo.
3. **Regístrate en cualquier servicio:** Proporciona ese correo a las páginas web que te pidan registrarte.
4. **Recibe tu bandeja de entrada en tiempo real:** No necesitas recargar. Las actualizaciones visuales te alertarán a medida que llegue un correo, haz clic en él para leer y acceder a su contenido completo de forma segura.

## ⚙️ Tecnologías

- **Vanilla JavaScript:** Control de asincronía (Promises, Fetch), gestión de DOM y Event Listeners.
- **HTML5 & CSS3:** Flexbox, variables CSS, pseudoelementos y animaciones optimizadas para una fluidez de 60fps.  
- **Mail.tm API:** Manejo de Dominios, Cuentas Temporales y Lectura de Mensajes (Bearer Token, REST JSON).

## ✨ Listo para GitHub Pages

Este proyecto ha sido empaquetado y purgado de datos simulados para ser alojado como un sitio web en producción utilizando **GitHub Pages**, **Vercel**, **Netlify**, o cualquier servidor HTTP estático estándar.
