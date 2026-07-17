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

    // ÚNICA declaración del listener, con TODO junto: audio + cambio de vista
    enterButton.addEventListener("click", () => {

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

        // Decide a qué vista ir, solo aquí, al pulsar ENTER
        if (document.body.classList.contains('is-logged-in')) {
            document.dispatchEvent(new CustomEvent('klub:mostrar-miembro'));
        }

    });

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