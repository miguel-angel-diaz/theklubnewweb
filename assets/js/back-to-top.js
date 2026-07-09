/* ==========================================================
   BACK TO TOP
========================================================== */

function initBackToTop() {

    const boton = document.querySelector('#back-to-top');
    if (!boton) return;

    const UMBRAL_SCROLL = 400;

    function actualizarVisibilidad() {

        const debeVerse = window.scrollY > UMBRAL_SCROLL;

        if (debeVerse && boton.hidden) {
            boton.hidden = false;
            requestAnimationFrame(() => {
                boton.classList.add('is-visible');
            });
        } else if (!debeVerse && !boton.hidden) {
            boton.classList.remove('is-visible');
            setTimeout(() => {
                if (!boton.classList.contains('is-visible')) {
                    boton.hidden = true;
                }
            }, 400);
        }

    }

    window.addEventListener('scroll', actualizarVisibilidad, { passive: true });

    boton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    actualizarVisibilidad();

}