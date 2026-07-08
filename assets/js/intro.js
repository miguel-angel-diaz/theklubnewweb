/* ==========================================================
   INTRO — Fade in + Audio + Botón Enter
========================================================== */

const AUDIO_MUTED_KEY = 'klub_audio_muted';

function obtenerPreferenciaAudio() {
    const valor = localStorage.getItem(AUDIO_MUTED_KEY);
    return valor === 'true'; // por defecto (null), no está muteado
}

function guardarPreferenciaAudio(muted) {
    localStorage.setItem(AUDIO_MUTED_KEY, String(muted));
}

document.addEventListener("DOMContentLoaded", () => {

    const intro = document.querySelector(".intro");
    const article = document.querySelector(".intro article");
    const enterButton = document.querySelector(".enter-btn");
    const audio = document.querySelector("#theme");
    const soundToggle = document.querySelector("#sound-toggle");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.body.classList.add("no-scroll");

    // Aplicamos la preferencia guardada antes de que suene nada
    if (audio) {
        audio.muted = obtenerPreferenciaAudio();
    }

    if (soundToggle && audio) {
        soundToggle.setAttribute("aria-pressed", String(audio.muted));
        soundToggle.setAttribute(
            "aria-label",
            audio.muted ? "Activar música" : "Silenciar música"
        );
    }

    // Fade in del contenido (logo con pulso + título + botón)
    setTimeout(() => {

        article.classList.add("fade-in");

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

            const volumenObjetivo = audio.muted ? 0 : 1;

            audio.volume = 0;
            audio.play().catch(() => {});

            // Solo hacemos fade-in de volumen si no está muteado
            if (!audio.muted) {
                fadeAudio(audio);
            }

        }

    });

    // Botón de silenciar/activar sonido
    if (soundToggle && audio) {

        soundToggle.addEventListener("click", () => {

            audio.muted = !audio.muted;

            guardarPreferenciaAudio(audio.muted);

            soundToggle.setAttribute("aria-pressed", String(audio.muted));
            soundToggle.setAttribute(
                "aria-label",
                audio.muted ? "Activar música" : "Silenciar música"
            );

            // Si el usuario reactiva el sonido y el volumen está en 0
            // (por ejemplo, lo silenció antes de que terminara el fade-in),
            // lo subimos directamente para que se oiga ya
            if (!audio.muted && audio.volume === 0) {
                audio.volume = 1;
            }

        });

    }

});


/* ==========================================================
   AUDIO FADE
========================================================== */

function fadeAudio(audio) {

    let volume = 0;

    const interval = setInterval(() => {

        // Si el usuario muteó a media transición, paramos el fade
        if (audio.muted) {
            clearInterval(interval);
            return;
        }

        volume += 0.02;

        audio.volume = Math.min(volume, 1);

        if (volume >= 1) {
            clearInterval(interval);
        }

    }, 100);

}