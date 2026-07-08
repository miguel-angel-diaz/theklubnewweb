/* ==========================================================
   INTRO — Fade in + Audio + Botón Enter
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const intro = document.querySelector(".intro");
    const article = document.querySelector(".intro article");
    const enterButton = document.querySelector(".enter-btn");
    const audio = document.querySelector("#theme");
    const soundToggle = document.querySelector("#sound-toggle");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.body.classList.add("no-scroll");

    // Fade in del contenido (logo con pulso + título + botón)
    setTimeout(() => {

        article.classList.add("fade-in");

        // Mostramos el botón de sonido en el mismo momento
        if (soundToggle) {
            soundToggle.hidden = false;
            requestAnimationFrame(() => {
                soundToggle.classList.add("is-visible");
            });
        }

    }, prefersReducedMotion ? 0 : 300);

    // Botón ENTER — oculta el intro y arranca el audio
    enterButton.addEventListener("click", () => {

        intro.classList.add("intro-hide");

        document.body.classList.remove("no-scroll");

        if (audio) {

            audio.volume = 0;
            audio.play().catch(() => {});
            fadeAudio(audio);

        }

    });

    // Botón de silenciar/activar sonido
    if (soundToggle && audio) {

        soundToggle.addEventListener("click", () => {

            audio.muted = !audio.muted;

            soundToggle.setAttribute("aria-pressed", String(audio.muted));
            soundToggle.setAttribute(
                "aria-label",
                audio.muted ? "Activar música" : "Silenciar música"
            );

        });

    }

});


/* ==========================================================
   AUDIO FADE
========================================================== */

function fadeAudio(audio) {

    let volume = 0;

    const interval = setInterval(() => {

        volume += 0.02;

        audio.volume = Math.min(volume, 1);

        if (volume >= 1) {
            clearInterval(interval);
        }

    }, 100);

}