// assets/js/admission.js

const ADMISSION_API_URL = 'https://mydiscordbot-production-3e6a.up.railway.app/api/solicitar-acceso';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#admission-form');
    const submitBtn = document.querySelector('#admission-submit');
    const status = document.querySelector('#form-status');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
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

            status.textContent = '¡Solicitud enviada! Te contactaremos pronto.';
            status.className = 'form-status success';
            form.reset();

        } catch (err) {
            console.error(err);
            status.textContent = 'No se pudo enviar la solicitud. Inténtalo de nuevo más tarde.';
            status.className = 'form-status error';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Solicitar Admisión';
        }
    });
});