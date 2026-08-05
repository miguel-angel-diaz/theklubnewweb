/* ==========================================================
   INTRO — Fade in + Audio + Botón Enter
========================================================== */

const AUDIO_MUTED_KEY = 'klub_audio_muted';

function obtenerPreferenciaAudio() {
    const valor = localStorage.getItem(AUDIO_MUTED_KEY);
    return valor === 'true';
}

function guardarPreferenciaAudio(muted) {
    localStorage.setItem(AUDIO_MUTED_KEY, String(muted));
}

function fadeAudio(audio) {

    let volume = 0;

    const interval = setInterval(() => {

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

function initIntro() {

    const intro = document.querySelector(".intro");
    const article = document.querySelector(".intro article");
    const enterButton = document.querySelector(".enter-btn");
    const audio = document.querySelector("#theme");
    const soundToggle = document.querySelector("#sound-toggle");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!intro || !article || !enterButton) {
        document.body.classList.remove("no-scroll");
        return;
    }

    // 1️⃣ Si ya se saltó la intro en esta sesión, ocultarla directamente
    if (sessionStorage.getItem('intro_skipped') === 'true') {
        intro.classList.add('intro-hide');
        document.body.classList.remove('no-scroll');
        // Manejamos el audio (si existe)
        if (audio) {
            audio.muted = obtenerPreferenciaAudio();
            if (!audio.muted) {
                audio.volume = 1;
                audio.play().catch(() => {});
            }
        }
        return;
    }

    // 2️⃣ Si no se ha saltado, mostramos la intro normalmente
    document.body.classList.add("no-scroll");

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

    setTimeout(() => {

        article.classList.add("fade-in");

        if (soundToggle) {
            soundToggle.hidden = false;
            requestAnimationFrame(() => {
                soundToggle.classList.add("is-visible");
            });
        }

    }, prefersReducedMotion ? 0 : 300);

    // 3️⃣ Listener del botón "ENTER"
    enterButton.addEventListener("click", () => {
        // Guardar en sesión que ya se saltó la intro
        sessionStorage.setItem('intro_skipped', 'true');
        intro.classList.add("intro-hide");
        document.body.classList.remove("no-scroll");
        document.body.style.top = "";

        if (audio) {

            audio.volume = 0;
            audio.play().catch(() => {});

            if (!audio.muted) {
                fadeAudio(audio);
            }

        }
    });

    // 4️⃣ Listener del botón de sonido (sin cambios)
    if (soundToggle && audio) {

        soundToggle.addEventListener("click", () => {

            audio.muted = !audio.muted;
            guardarPreferenciaAudio(audio.muted);

            soundToggle.setAttribute("aria-pressed", String(audio.muted));
            soundToggle.setAttribute(
                "aria-label",
                audio.muted ? "Activar música" : "Silenciar música"
            );

            if (!audio.muted && audio.volume === 0) {
                audio.volume = 1;
            }

        });

    }

}