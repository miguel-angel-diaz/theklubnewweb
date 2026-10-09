/* ==========================================================
   UTILIDADES COMPARTIDAS
========================================================== */

// ==========================================================
// SEGURIDAD: todo dato de la API que se meta en HTML pasa por aquí
// ==========================================================

/**
 * Escapa un valor para meterlo en HTML, en texto o dentro de un atributo entre comillas.
 * Los nombres de Discord, los decks, los nombres de torneo y los RSS los controlan otros: sin esto,
 * un apodo como <img src=x onerror=...> se ejecutaría en el navegador de quien lo vea y podría robar su sesión.
 */
function escapeHtml(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * URL segura para href/src: solo https (sin javascript:, data:, http...). Si no lo es, devuelve '#'.
 * El resultado ya va escapado para meterlo en un atributo.
 */
function safeUrl(valor) {
    try {
        const url = new URL(String(valor), window.location.href);
        return url.protocol === 'https:' ? escapeHtml(url.href) : '#';
    } catch {
        return '#';
    }
}

function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha)) return '';
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ==========================================================
// CONTROL DE PANTALLA DE CARGA
// ==========================================================

function mostrarPantallaCarga() {
    const loader = document.querySelector('#loading-screen');
    if (loader) {
        loader.classList.remove('hidden');
    }
}

function ocultarPantallaCarga() {
    const loader = document.querySelector('#loading-screen');
    if (loader) {
        loader.classList.add('hidden');
    }
}