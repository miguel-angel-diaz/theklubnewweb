/* ==========================================================
   UTILIDADES COMPARTIDAS
========================================================== */

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