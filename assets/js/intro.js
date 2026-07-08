/* ==========================================================
   INTRO
========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const firstLogo = document.querySelector('.intro-logo--first');
  const article = document.querySelector('.intro article');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const showTime = 1500;   // tiempo que se ve el primer logo solo
  const glitchTime = 400;  // duración del glitch

  setTimeout(() => {
    if (!prefersReducedMotion) {
      firstLogo.classList.add('glitching');
    }

    setTimeout(() => {
      firstLogo.classList.add('glitch-out');
      article.classList.add('fade-in');
    }, prefersReducedMotion ? 0 : glitchTime);

  }, showTime);
});

document.addEventListener('DOMContentLoaded', () => {
  const firstLogo = document.querySelector('.intro-logo--first');
  const article = document.querySelector('.intro article');
  const soundToggle = document.querySelector('#sound-toggle');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const showTime = 1500;
  const glitchTime = 400;

  setTimeout(() => {
    if (!prefersReducedMotion) {
      firstLogo.classList.add('glitching');
    }

    setTimeout(() => {
      firstLogo.classList.add('glitch-out');
      article.classList.add('fade-in');

      // Mostramos el botón de sonido en el mismo momento que aparece el contenido
      if (soundToggle) {
        soundToggle.hidden = false;
        requestAnimationFrame(() => {
          soundToggle.classList.add('is-visible');
        });
      }

    }, prefersReducedMotion ? 0 : glitchTime);

  }, showTime);
});


document.addEventListener("DOMContentLoaded", () => {

    const intro = document.querySelector(".intro");
    const enterButton = document.querySelector(".enter-btn");
    const audio = document.querySelector("#theme");
    const soundToggle = document.querySelector("#sound-toggle");

    document.body.classList.add("no-scroll");

    enterButton.addEventListener("click", () => {

        intro.classList.add("intro-hide");

        document.body.classList.remove("no-scroll");

        if(audio){

            audio.volume = 0;

            audio.play().catch(()=>{});

            fadeAudio(audio);

        }

    });

    // NUEVO — control de silencio/sonido
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

function fadeAudio(audio){

    let volume = 0;

    const interval = setInterval(()=>{

        volume += 0.02;

        audio.volume = Math.min(volume,1);

        if(volume >= 1){

            clearInterval(interval);

        }

    },100);

}

document.addEventListener("DOMContentLoaded", () => {

    const intro = document.querySelector(".intro");
    const enterButton = document.querySelector(".enter-btn");
    const audio = document.querySelector("#theme");

    document.body.classList.add("no-scroll");

    enterButton.addEventListener("click", () => {

        intro.classList.add("intro-hide");

        document.body.classList.remove("no-scroll");

        if(audio){

            audio.volume = 0;

            audio.play().catch(()=>{});

            fadeAudio(audio);

        }

    });

});

/* ==========================================================
   AUDIO FADE
========================================================== */

function fadeAudio(audio){

    let volume = 0;

    const interval = setInterval(()=>{

        volume += 0.02;

        audio.volume = Math.min(volume,1);

        if(volume >= 1){

            clearInterval(interval);

        }

    },100);

}