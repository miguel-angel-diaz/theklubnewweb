const AUTH_API_BASE = 'https://mydiscordbot-production-3e6a.up.railway.app';
const SESSION_STORAGE_KEY = 'klub_session';
const SESSION_USERNAME_KEY = 'klub_username';   // NUEVO
const DEV_MODE_FAKE_LOGIN = false;

let nombreEnProceso = '';

function abrirLoginModal() {

    if (document.body.classList.contains('is-logged-in')) {
        document.dispatchEvent(new CustomEvent('klub:mostrar-miembro'));
        return;
    }

    const modal = document.querySelector('#login-modal');
    if (!modal) return;

    modal.hidden = false;
    document.body.classList.add('no-scroll');

    setTimeout(() => {
        const primerInput = document.querySelector('#login-nombre');
        if (primerInput) primerInput.focus();
    }, 100);

}

function cerrarLoginModal() {

    const modal = document.querySelector('#login-modal');
    if (!modal) return;

    modal.hidden = true;
    document.body.classList.remove('no-scroll');

    const step1 = document.querySelector('#login-step-1');
    const step2 = document.querySelector('#login-step-2');
    if (step1) step1.hidden = false;
    if (step2) step2.hidden = true;

}

function initLoginModal() {

    const toggleBtn = document.querySelector('#login-toggle');
    const closeBtn = document.querySelector('#login-close');
    const backdrop = document.querySelector('[data-close-login]');
    const modal = document.querySelector('#login-modal');

    if (!toggleBtn || !modal) return;

    toggleBtn.addEventListener('click', abrirLoginModal);

    if (closeBtn) closeBtn.addEventListener('click', cerrarLoginModal);
    if (backdrop) backdrop.addEventListener('click', cerrarLoginModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) {
            cerrarLoginModal();
        }
    });

}

function loginCompletado(sessionToken, username) {

    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionToken);
    sessionStorage.setItem(SESSION_USERNAME_KEY, username);   // NUEVO
    document.body.classList.add('is-logged-in');
    window.klubUsername = username;

    cerrarLoginModal();

    document.dispatchEvent(new CustomEvent('klub:mostrar-miembro'));

}

function initLogin() {

    const step1 = document.querySelector('#login-step-1');
    const step2 = document.querySelector('#login-step-2');
    const nombreInput = document.querySelector('#login-nombre');
    const codigoInput = document.querySelector('#login-codigo');
    const btnSolicitar = document.querySelector('#login-solicitar');
    const btnVerificar = document.querySelector('#login-verificar');
    const status1 = document.querySelector('#login-status-1');
    const status2 = document.querySelector('#login-status-2');

    if (!step1) return;

    btnSolicitar.addEventListener('click', async () => {

        const nombre = nombreInput.value.trim();
        if (!nombre) return;

        btnSolicitar.disabled = true;
        btnSolicitar.textContent = 'Enviando...';
        status1.textContent = '';
        status1.className = 'form-status';

        if (DEV_MODE_FAKE_LOGIN) {
            console.warn('⚠️ DEV_MODE_FAKE_LOGIN activo — no se está llamando al backend real');
            setTimeout(() => {
                nombreEnProceso = nombre;
                step1.hidden = true;
                step2.hidden = false;
                btnSolicitar.disabled = false;
                btnSolicitar.textContent = 'Enviar código';
            }, 300);
            return;
        }

        try {

            const res = await fetch(`${AUTH_API_BASE}/auth/solicitar-codigo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            nombreEnProceso = nombre;
            step1.hidden = true;
            step2.hidden = false;

        } catch (err) {
            status1.textContent = err.message || 'Error al solicitar el código';
            status1.className = 'form-status error';
        } finally {
            btnSolicitar.disabled = false;
            btnSolicitar.textContent = 'Enviar código';
        }

    });

    btnVerificar.addEventListener('click', async () => {

        const codigo = codigoInput.value.trim();
        if (!codigo) return;

        btnVerificar.disabled = true;
        btnVerificar.textContent = 'Verificando...';
        status2.textContent = '';
        status2.className = 'form-status';

        if (DEV_MODE_FAKE_LOGIN) {
            console.warn('⚠️ DEV_MODE_FAKE_LOGIN activo — código aceptado sin verificar');
            setTimeout(() => {
                loginCompletado('dev-fake-session-token', nombreEnProceso || 'Usuario de Prueba');
                btnVerificar.disabled = false;
                btnVerificar.textContent = 'Verificar';
            }, 300);
            return;
        }

        try {

            const res = await fetch(`${AUTH_API_BASE}/auth/verificar-codigo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nombreEnProceso, codigo })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            loginCompletado(data.session, data.username);

        } catch (err) {
            status2.textContent = err.message || 'Código incorrecto';
            status2.className = 'form-status error';
            btnVerificar.disabled = false;
            btnVerificar.textContent = 'Verificar';
        }

    });

}

async function comprobarSesionActiva() {
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) return;

    const usernameGuardado = sessionStorage.getItem(SESSION_USERNAME_KEY);
    if (usernameGuardado) {
        window.klubUsername = usernameGuardado;
        document.body.classList.add('is-logged-in');
    }

    if (DEV_MODE_FAKE_LOGIN && token === 'dev-fake-session-token') {
        window.klubUsername = usernameGuardado || 'Usuario de Prueba';
        window.klubDiscordId = 'dev-fake-discord-id';
        sessionStorage.setItem(SESSION_USERNAME_KEY, window.klubUsername);
        document.body.classList.add('is-logged-in');
        // Disparar evento para mostrar la vista de miembro
        document.dispatchEvent(new CustomEvent('klub:mostrar-miembro'));
        return;
    }

    try {
        const res = await fetch(`${AUTH_API_BASE}/auth/verificar-sesion?session=${token}`);
        const data = await res.json();

        if (data.autenticado) {
            document.body.classList.add('is-logged-in');
            window.klubUsername = data.username;
            window.klubDiscordId = data.discord_id;
            sessionStorage.setItem(SESSION_USERNAME_KEY, data.username);
            // Disparar evento para mostrar la vista de miembro
            document.dispatchEvent(new CustomEvent('klub:mostrar-miembro'));
        } else {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            sessionStorage.removeItem(SESSION_USERNAME_KEY);
            document.body.classList.remove('is-logged-in');
            window.klubUsername = null;
            window.klubDiscordId = null;
        }
    } catch (err) {
        console.error(err);
    }
}

function cerrarSesion() {

    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_USERNAME_KEY);   // NUEVO
    document.body.classList.remove('is-logged-in');
    window.klubUsername = null;

    document.dispatchEvent(new CustomEvent('klub:logout'));

}