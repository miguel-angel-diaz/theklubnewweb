/* ==========================================================
   NAVBAR — Scroll state + Mobile menu
========================================================== */

function initNavbar() {

    const navbar = document.querySelector(".navbar");
    const menuToggle = document.querySelector(".menu-toggle");
    const navbarMenu = document.querySelector(".navbar-menu");

    // Fondo al hacer scroll
    if (navbar) {
        window.addEventListener("scroll", () => {
            navbar.classList.toggle("scrolled", window.scrollY > 40);
        }, { passive: true });
    }

    // Menú móvil
    if (!menuToggle || !navbarMenu) return;

    menuToggle.addEventListener("click", () => {

        const abierto = navbarMenu.classList.toggle("active");

        menuToggle.classList.toggle("active", abierto);
        menuToggle.setAttribute("aria-expanded", String(abierto));

    });

    navbarMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navbarMenu.classList.remove("active");
            menuToggle.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");
        });
    });

}