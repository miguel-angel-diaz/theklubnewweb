/* ==========================================================
   SMOOTH SCROLL
========================================================== */

function initSmoothScroll() {

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener("click", function (e) {

            const targetId = this.getAttribute("href");
            if (targetId === "#") return;

            const target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();

            const navbar = document.querySelector(".navbar");
            const offset = navbar ? navbar.offsetHeight : 0;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;

            window.scrollTo({ top, behavior: "smooth" });

        });

    });

}