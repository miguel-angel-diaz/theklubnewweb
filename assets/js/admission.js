// assets/js/admission.js

const ADMISSION_API_URL = 'https://mydiscordbot-production-3e6a.up.railway.app/api/solicitar-acceso';
const STORAGE_KEY = 'klub_admission_attempts';
const MAX_INTENTOS = 2;

function obtenerIntentos() {
    const valor = localStorage.getItem(STORAGE_KEY);
    return valor ? parseInt(valor, 10) : 0;
}

function incrementarIntentos() {
    const actual = obtenerIntentos();
    localStorage.setItem(STORAGE_KEY, String(actual + 1));
    return actual + 1;
}

document.addEventListener('DOMContentLoaded', () => {
    const content = document.querySelector('#admission-content');
    const successBox = document.querySelector('#admission-success');
    const blockedBox = document.querySelector('#admission-blocked');
    const form = document.querySelector('#admission-form');
    const submitBtn = document.querySelector('#admission-submit');
    const status = document.querySelector('#form-status');

    if (!form) return;

   

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
         // Al cargar la página, comprobamos si ya agotó los intentos
        if (obtenerIntentos() >= MAX_INTENTOS) {
            content.hidden = true;
            blockedBox.hidden = false;
            return;
        }
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

            // Éxito — contamos el intento y mostramos el mensaje
            const intentos = incrementarIntentos();

            content.hidden = true;
            successBox.hidden = false;

            // Si este envío fue el último permitido, la próxima vez que
            // cargue la página verá directamente el bloqueo (por el check de arriba)
            if (intentos >= MAX_INTENTOS) {
                // No hace falta hacer nada extra aquí — el próximo DOMContentLoaded lo bloqueará
            }

        } catch (err) {
            console.error(err);
            status.textContent = 'No se pudo enviar la solicitud. Inténtalo de nuevo más tarde.';
            status.className = 'form-status error';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Solicitar Admisión';
        }
    });
});