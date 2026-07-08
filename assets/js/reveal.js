/* ==========================================================
   REVEAL ANIMATIONS
========================================================== */

/* ==========================================================
   REVEAL ANIMATIONS
========================================================== */

class Reveal {

    constructor() {

        this.observer = new IntersectionObserver(

            this.handleIntersect.bind(this),

            {
                root: null,
                rootMargin: "0px 0px -10% 0px",
                threshold: 0.15
            }

        );

        this.init();

    }

    init() {

        document.querySelectorAll("[data-reveal]").forEach(element => {
            this.observer.observe(element);
        });

    }

    // NUEVO — permite observar elementos añadidos dinámicamente después
    observeNew(elements) {

        elements.forEach(element => {
            this.observer.observe(element);
        });

    }

    handleIntersect(entries) {

        entries.forEach(entry => {

            if (!entry.isIntersecting) return;

            entry.target.classList.add("is-visible");

            this.observer.unobserve(entry.target);

        });

    }

}

// Guardamos la instancia en window para poder acceder desde otros scripts
window.revealInstance = new Reveal();