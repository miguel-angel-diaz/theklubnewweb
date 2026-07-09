/* ==========================================================
   ADMISSION FORM
========================================================== */

const ADMISSION_API_URL = 'https://mydiscordbot-production-3e6a.up.railway.app/api/solicitar-acceso';
const ADMISSION_STORAGE_KEY = 'klub_admission_attempts';
const ADMISSION_MAX_INTENTOS = 2;

function obtenerIntentosAdmision() {
    const valor = localStorage.getItem(ADMISSION_STORAGE_KEY);
    return valor ? parseInt(valor, 10) : 0;
}

function incrementarIntentosAdmision() {
    const actual = obtenerIntentosAdmision();
    localStorage.setItem(ADMISSION_STORAGE_KEY, String(actual + 1));
    return actual + 1;
}

function initAdmission() {

    const content = document.querySelector('#admission-content');
    const successBox = document.querySelector('#admission-success');
    const blockedBox = document.querySelector('#admission-blocked');
    const form = document.querySelector('#admission-form');
    const submitBtn = document.querySelector('#admission-submit');
    const status = document.querySelector('#form-status');

    if (!form) return;

    // Si ya agotó los intentos, bloqueamos directamente al cargar
    if (obtenerIntentosAdmision() >= ADMISSION_MAX_INTENTOS) {
        if (content) content.hidden = true;
        if (blockedBox) blockedBox.hidden = false;
        return;
    }

    form.addEventListener('submit', async (e) => {
       // Si ya agotó los intentos, bloqueamos directamente al cargar
      if (obtenerIntentosAdmision() >= ADMISSION_MAX_INTENTOS) {
          if (content) content.hidden = true;
          if (blockedBox) blockedBox.hidden = false;
          return;
      }

        e.preventDefault();

        const discordNick = form.discord_nick.value.trim();
        const email = form.email.value.trim();
        const comentario = form.comentario.value.trim();

        if (!discordNick || !email || !comentario) {
            status.textContent = 'Por favor, rellena todos los campos.';
            status.className = 'form-status error';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        status.textContent = '';
        status.className = 'form-status';

        try {

            const res = await fetch(ADMISSION_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discord_nick: discordNick, email, comentario })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al enviar la solicitud');
            }

            incrementarIntentosAdmision();

            content.hidden = true;
            successBox.hidden = false;

        } catch (err) {

            console.error(err);
            status.textContent = 'No se pudo enviar la solicitud. Inténtalo de nuevo más tarde.';
            status.className = 'form-status error';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Solicitar Admisión';

        }

    });

}