document.addEventListener('DOMContentLoaded', () => {

    const boton = document.querySelector('#back-to-top');
    if (!boton) return;

    const UMBRAL_SCROLL = 400; // píxeles de scroll antes de mostrar el botón

    function actualizarVisibilidad() {
        const debeVerse = window.scrollY > UMBRAL_SCROLL;

        if (debeVerse && boton.hidden) {
            boton.hidden = false;
            requestAnimationFrame(() => {
                boton.classList.add('is-visible');
            });
        } else if (!debeVerse && !boton.hidden) {
            boton.classList.remove('is-visible');
            // Esperamos a que termine la transición antes de ocultar de verdad
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

    actualizarVisibilidad(); // por si la página carga ya scrolleada

});