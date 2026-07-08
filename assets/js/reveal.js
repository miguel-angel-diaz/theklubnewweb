/* ==========================================================
   REVEAL ANIMATIONS
========================================================== */

class Reveal {

    constructor() {

        this.elements = document.querySelectorAll("[data-reveal]");

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

        this.elements.forEach(element => {

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

new Reveal();