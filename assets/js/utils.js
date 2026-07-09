/* ==========================================================
   UTILIDADES COMPARTIDAS
========================================================== */

function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha)) return '';
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}