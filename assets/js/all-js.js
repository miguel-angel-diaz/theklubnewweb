//admission.js

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

//auth.js
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

//back-to-top.js

/* ==========================================================
   BACK TO TOP
========================================================== */

function initBackToTop() {

    const boton = document.querySelector('#back-to-top');
    if (!boton) return;

    const UMBRAL_SCROLL = 400;

    function actualizarVisibilidad() {

        const debeVerse = window.scrollY > UMBRAL_SCROLL;

        if (debeVerse && boton.hidden) {
            boton.hidden = false;
            requestAnimationFrame(() => {
                boton.classList.add('is-visible');
            });
        } else if (!debeVerse && !boton.hidden) {
            boton.classList.remove('is-visible');
            setTimeout(() => {
                if (!boton.classList.contains('is-visible')) {
                    boton.hidden = true;
                }
            }, 400);
        }

    }

    window.addEventListener('scroll', actualizarVisibilidad, { passive: true });

    boton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    actualizarVisibilidad();

}

//broadcast.js
/* ==========================================================
   PODCAST + ARTÍCULOS
========================================================== */

const PODCAST_API = 'https://mydiscordbot-production-3e6a.up.railway.app/api/podcast';
const ARTICULOS_API = 'https://mydiscordbot-production-3e6a.up.railway.app/api/articulos';

function extraerEpisodio(titulo) {
    const match = titulo.match(/^(Temp\.\s*\d+\s*Ep\.\s*\d+)/i);
    return match ? match[1] : null;
}

function limpiarTitulo(titulo) {
    return titulo.replace(/^Temp\.\s*\d+\s*Ep\.\s*\d+\s*-\s*/i, '');
}

async function cargarEpisodios() {

    const contenedor = document.querySelector('#podcast-episodios');
    if (!contenedor) return;

    try {

        const res = await fetch(PODCAST_API);
        const data = await res.json();

        if (data.error || !data.episodios.length) {
            contenedor.innerHTML = '<p class="standings-error">No se pudieron cargar los episodios.</p>';
            return;
        }

        contenedor.innerHTML = data.episodios.map(ep => {

            const etiqueta = extraerEpisodio(ep.titulo);
            const tituloLimpio = limpiarTitulo(ep.titulo);

            return `
                <a href="${ep.enlace}" target="_blank" class="episode-card" data-reveal="left">
                    ${ep.imagen ? `
                        <div class="episode-card-image">
                            <img src="${ep.imagen}" alt="${tituloLimpio}" loading="lazy">
                        </div>
                    ` : ''}
                    ${etiqueta ? `<span class="episode-card-tag">${etiqueta}</span>` : ''}
                    <h3>${tituloLimpio}</h3>
                    <p>${ep.descripcion}...</p>
                    <span class="episode-card-date">${formatearFecha(ep.fecha)}</span>
                </a>
            `;

        }).join('');

        if (window.revealInstance) {
            window.revealInstance.observeNew(contenedor.querySelectorAll('[data-reveal]'));
        }

    } catch (err) {
        console.error(err);
        contenedor.innerHTML = '<p class="standings-error">No se pudieron cargar los episodios.</p>';
    }

}

async function cargarArticulos() {

    const contenedor = document.querySelector('#articulos-lista');
    if (!contenedor) return;

    try {

        const res = await fetch(ARTICULOS_API);
        const data = await res.json();

        if (data.error || !data.articulos.length) {
            contenedor.innerHTML = '<p class="standings-error">No se pudieron cargar los artículos.</p>';
            return;
        }

        contenedor.innerHTML = data.articulos.map(art => `
            <a href="${art.enlace}" target="_blank" class="article-card" data-reveal="left">
                <div class="article-card-icon">✎</div>
                <h3>${art.titulo}</h3>
                <p>${art.descripcion}...</p>
                <span class="article-card-date">${formatearFecha(art.fecha)}</span>
            </a>
        `).join('');

        if (window.revealInstance) {
            window.revealInstance.observeNew(contenedor.querySelectorAll('[data-reveal]'));
        }

    } catch (err) {
        console.error(err);
        contenedor.innerHTML = '<p class="standings-error">No se pudieron cargar los artículos.</p>';
    }

}

function initBroadcast() {
    cargarEpisodios();
    cargarArticulos();
}

//intro.js
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

//member.js
// ==========================================================
// 1. VISTA MIEMBRO
// ==========================================================

function mostrarVistaMiembro(username) {
    const publicView = document.querySelector('#public-view');
    const memberView = document.querySelector('#member-view');
    const welcomeNavbar = document.querySelector('#member-welcome');
    const welcomeHeader = document.querySelector('#member-welcome-name');

    if (publicView) publicView.hidden = true;
    if (memberView) memberView.hidden = false;

    if (welcomeNavbar && username) welcomeNavbar.textContent = `Hola, ${username}`;
    if (welcomeHeader && username) welcomeHeader.textContent = `, ${username}`;
}

function mostrarVistaPublica() {
    const publicView = document.querySelector('#public-view');
    const memberView = document.querySelector('#member-view');

    if (publicView) publicView.hidden = false;
    if (memberView) memberView.hidden = true;
}

// ==========================================================
// 2. TABS PRINCIPALES
// ==========================================================

function initMemberTabs() {
    const tabs = document.querySelectorAll('[data-member-tab]');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = `member-tab-${tab.dataset.memberTab}`;
            document.querySelectorAll('.member-tab-content').forEach(section => {
                section.hidden = section.id !== targetId;
            });
            tabs.forEach(t => t.classList.remove('is-active'));
            tab.classList.add('is-active');
        });
    });
}

// ==========================================================
// 3. LOGOUT
// ==========================================================

function initLogout() {
    const btn = document.querySelector('#logout-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        cerrarSesion(); // definida en auth.js
    });
}

// ==========================================================
// 4. INICIALIZACIÓN PRINCIPAL
// ==========================================================

function initMemberView() {
    document.addEventListener('klub:mostrar-miembro', () => {
        mostrarVistaMiembro(window.klubUsername);
        cargarMisTorneos();
        cargarMisDecks();
        cargarEstadoTorneos();
        cargarMisPendientes();
        cargarTodasPartidas();
        initAgendarModal();
    });

    document.addEventListener('klub:logout', () => {
        mostrarVistaPublica();
    });

    initMemberTabs();
    initLogout();
    initDeckModal();
    initSubirDeckForm();
    initReporteModal();
    initDeckRivalModal();
}

// ==========================================================
// 5. CARGAR MIS TORNEOS
// ==========================================================

async function cargarMisTorneos() {
    const contenedor = document.querySelector('#mis-torneos-lista');
    if (!contenedor) return;

    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) return;

    contenedor.innerHTML = '<p class="standings-loading">Cargando tus torneos...</p>';

    try {
        // 1️⃣ Obtener torneos finalizados (de la caché)
        const resFinalizados = await fetch(`${AUTH_API_BASE}/api/mis-torneos?session=${token}`);
        const dataFinalizados = await resFinalizados.json();
        const torneosFinalizados = dataFinalizados.torneos || [];

        // 3️⃣ Unir ambas listas
        let todosLosTorneos = [];

        // Torneos finalizados: formatear al mismo esquema
        torneosFinalizados.forEach(t => {
            todosLosTorneos.push({
                codigo: t.torneo_codigo,
                nombre: t.torneo_nombre,
                rank: t.rank,
                wins: t.wins,
                losses: t.losses,
                draws: t.draws,
                mp: t.mp,
                total_participantes: t.total_participantes,
                fecha: t.fecha_fin,
                tipo: 'finalizado',
                tieneDeck: false, // no tenemos esa info desde este endpoint, pero se puede ignorar
            });
        });

        if (!todosLosTorneos.length) {
            contenedor.innerHTML = '<p class="standings-error">Todavía no has jugado ningún torneo con nosotros.</p>';
            return;
        }

        // 4️⃣ Renderizar todas las tarjetas (con paneles)
        let html = '';
        todosLosTorneos.forEach(t => {
            const esActivo = t.tipo === 'abierto' || t.tipo === 'en desarrollo';
            const estadoLabel = esActivo ? (t.tipo === 'abierto' ? '✅ Abierto' : '⚔️ En desarrollo') : '🏁 Finalizado';
            const infoLine = esActivo
                ? `Inscrito · ${t.total_participantes} jugadores · ${t.fecha}`
                : `${t.wins}-${t.losses}-${t.draws} · ${t.mp} pts · de ${t.total_participantes} jugadores`;

            html += `
                <div class="mi-torneo-card" data-torneo-codigo="${t.codigo}" data-tipo="${t.tipo}">
                    <div class="mi-torneo-rank">${esActivo ? '📌' : '#' + (t.rank || '—')}</div>
                    <div class="mi-torneo-info">
                        <h3>${t.nombre} <span style="font-size:0.7rem; font-weight:normal; color:var(--text-muted);">${estadoLabel}</span></h3>
                        <p>${infoLine}</p>
                    </div>
                    <div class="mi-torneo-actions">
                        <button class="mi-torneo-toggle" aria-label="Ver más">
                            <svg class="icon-arrow-down" viewBox="0 0 24 24" width="24" height="24">
                                <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="mi-torneo-panel" style="display: none;">
                        <div class="mi-torneo-tabs">
                            <button class="tab-btn active" data-tab="clasificacion">📊 Clasificación</button>
                            <button class="tab-btn" data-tab="deck">🃏 Deck</button>
                            <button class="tab-btn" data-tab="enfrentamientos">⚔️ Enfrentamientos</button>
                        </div>
                        <div class="mi-torneo-panel-content">
                            <div class="tab-content active" data-tab="clasificacion"><p>Cargando...</p></div>
                            <div class="tab-content" data-tab="deck"><p>Cargando...</p></div>
                            <div class="tab-content" data-tab="enfrentamientos"><p>Cargando...</p></div>
                        </div>
                    </div>
                </div>
            `;
        });

        contenedor.innerHTML = html;
        initTorneoMenus();

    } catch (err) {
        console.error(err);
        contenedor.innerHTML = '<p class="standings-error">No se pudieron cargar tus torneos.</p>';
    }
}

// ==========================================================
// 6. MENÚS DESPLEGABLES DE TARJETAS
// ==========================================================

function initTorneoMenus() {
    const lista = document.querySelector('#mis-torneos-lista');
    if (!lista) return;
    lista.removeEventListener('click', handleTorneoClick);
    lista.addEventListener('click', handleTorneoClick);
}

async function handleTorneoClick(e) {
    const toggle = e.target.closest('.mi-torneo-toggle');
    if (toggle) {
        const card = toggle.closest('.mi-torneo-card');
        const panel = card.querySelector('.mi-torneo-panel');
        const isExpanded = panel.style.display === 'block';

        document.querySelectorAll('.mi-torneo-panel').forEach(p => p.style.display = 'none');
        document.querySelectorAll('.mi-torneo-card').forEach(c => c.classList.remove('expanded'));
        document.querySelectorAll('.mi-torneo-toggle').forEach(t => t.classList.remove('open'));

        if (!isExpanded) {
            panel.style.display = 'block';
            card.classList.add('expanded');
            toggle.classList.add('open');
            const activeTab = card.querySelector('.tab-btn.active');
            if (activeTab) {
                await cargarContenidoTab(card, activeTab.dataset.tab);
            }
        }
        e.preventDefault();
        return;
    }

    const tabBtn = e.target.closest('.tab-btn');
    if (tabBtn) {
        const card = tabBtn.closest('.mi-torneo-card');
        const tab = tabBtn.dataset.tab;

        card.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        tabBtn.classList.add('active');

        card.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        const targetContent = card.querySelector(`.tab-content[data-tab="${tab}"]`);
        if (targetContent) targetContent.classList.add('active');

        await cargarContenidoTab(card, tab);
        e.preventDefault();
    }
}

// ==========================================================
// 7. CARGA DE CONTENIDO DE PESTAÑAS
// ==========================================================

async function cargarContenidoTab(card, tab) {
    const codigo = card.dataset.torneoCodigo;
    const contentDiv = card.querySelector(`.tab-content[data-tab="${tab}"]`);
    if (!contentDiv) return;

    contentDiv.innerHTML = '<p class="standings-loading">Cargando...</p>';

    try {
        if (tab === 'clasificacion') {
            await cargarClasificacionEnPanel(codigo, contentDiv);
        } else if (tab === 'deck') {
            await cargarDeckEnPanel(codigo, contentDiv);
        } else if (tab === 'enfrentamientos') {
            await cargarEnfrentamientosEnPanel(codigo, contentDiv);
        }
    } catch (err) {
        console.error(err);
        contentDiv.innerHTML = `<p class="standings-error">Error al cargar datos.</p>`;
    }
}

// ------------------------------------------------------------
// 7a. Clasificación
// ------------------------------------------------------------
async function cargarClasificacionEnPanel(codigo, container) {
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
        container.innerHTML = '<p class="empty-state">Debes iniciar sesión.</p>';
        return;
    }

    container.innerHTML = '<p class="standings-loading">Cargando clasificación...</p>';

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/clasificacion-torneo?codigo=${codigo}&session=${token}`);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Error al cargar clasificación');
        }
        const data = await res.json();
        const clasificacion = data.clasificacion || [];

        if (!clasificacion.length) {
            container.innerHTML = '<p class="empty-state">No hay clasificación disponible para este torneo.</p>';
            return;
        }

        const miDiscordId = window.klubDiscordId || null;
        const miUsername = window.klubUsername || null;

        let html = `<table><thead><tr><th>#</th><th>Jugador</th><th>Pts</th><th>W-L-D</th></tr></thead><tbody>`;
        clasificacion.forEach((j, i) => {
            let esMiFila = false;
            if (miDiscordId && j.discord_id === miDiscordId) {
                esMiFila = true;
            } else if (miUsername && j.nombre.toLowerCase().includes(miUsername.toLowerCase())) {
                esMiFila = true;
            }
            const claseFila = esMiFila ? 'mi-fila' : '';
            html += `<tr class="${claseFila}">
                <td>${j.rank || i+1}</td>
                <td>${esMiFila ? '⭐ ' : ''}${j.nombre}${esMiFila ? ' ⭐' : ''}</td>
                <td>${j.mp}</td>
                <td>${j.wins}-${j.losses}-${j.draws}</td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="standings-error">Error al cargar clasificación: ${err.message}</p>`;
    }
}
// ------------------------------------------------------------
// 7b. Deck
// ------------------------------------------------------------
async function cargarDeckEnPanel(codigo, container) {
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
        container.innerHTML = '<p class="empty-state">Debes iniciar sesión.</p>';
        return;
    }

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/mis-decks?session=${token}`);
        if (!res.ok) throw new Error('Error al obtener decks');
        const data = await res.json();

        let deck = data.decks.find(d => d.codigo_torneo === codigo);
        if (!deck) {
            deck = data.decks.find(d => d.codigo_deck && d.codigo_deck.startsWith(codigo + '_'));
        }
        if (!deck) {
            deck = data.decks.find(d => d.codigo_torneo && d.codigo_torneo.includes(codigo));
        }
        if (!deck) {
            deck = data.decks.find(d => {
                const txt = (d.nombre_deck + ' ' + (d.codigo_torneo || '') + ' ' + (d.codigo_deck || '')).toLowerCase();
                return txt.includes(codigo.toLowerCase());
            });
        }

        if (!deck) {
            container.innerHTML = `<p class="empty-state">No has subido deck para este torneo.</p>`;
            return;
        }

        let html = `<h4 style="margin:0 0 0.5rem 0;color:#fff;">🃏 ${deck.nombre_deck}</h4>`;
        html += `<p><strong>Arquetipo:</strong> ${deck.archetype}</p>`;
        html += `<p><strong>Decklist:</strong></p><pre class="deck-list">${deck.decklist}</pre>`;
        if (deck.sideboard && deck.sideboard !== 'N/A') {
            html += `<p class="deck-sideboard-title">Sideboard</p><pre class="deck-list">${deck.sideboard}</pre>`;
        }
        container.innerHTML = html;
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="empty-state">Error al cargar el deck.</p>';
    }
}

// ------------------------------------------------------------
// 7c. Enfrentamientos (con deck del rival)
// ------------------------------------------------------------
async function cargarEnfrentamientosEnPanel(codigo, container) {
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
        container.innerHTML = '<p class="empty-state">Debes iniciar sesión.</p>';
        return;
    }

    container.innerHTML = '<p class="standings-loading">Cargando enfrentamientos...</p>';

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/torneo-enfrentamientos?session=${token}&torneo=${codigo}`);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Error al cargar enfrentamientos');
        }
        const data = await res.json();
        const rondas = data.rondas || [];

        if (!rondas.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>⚔️ No hay enfrentamientos registrados para este torneo.</p>
                    <p style="font-size:.85rem; color:var(--muted);">Los enfrentamientos aparecerán aquí cuando se generen las rondas.</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="enfrentamientos-container">
                <h4 style="margin: 0 0 1rem 0; color: var(--text);">Todas las rondas</h4>
        `;

        rondas.forEach(r => {
            const rondaNum = r.ronda;
            const completa = r.completa ? '✅ Completada' : '⏳ En curso';
            html += `
                <div class="ronda-block">
                    <h5 style="margin: 0.5rem 0; color: var(--text-muted);">Ronda ${rondaNum} — ${completa}</h5>
                    <ul style="list-style: none; padding-left: 0; margin: 0 0 1rem 0;">
            `;
            r.partidos.forEach(p => {
                if (p.jugador2 === null) {
                    html += `<li style="padding: 0.2rem 0; color: var(--text-muted);">${p.jugador1} → BYE</li>`;
                } else {
                    const resultado = p.resultado || '⏳ Pendiente';
                    const esMiPartida = p.es_mi_partida || false;
                    const esClickable = esMiPartida && !p.resultado; // Solo mi partida y sin resultado

                    // Si es clickeable, añadimos un botón y data attributes
                    let botonAgendar = '';
                    if (esClickable) {
                        botonAgendar = `
                            <button class="btn btn-sm btn-primary agendar-partida" 
                                    data-codigo="${codigo}" 
                                    data-j1="${p.jugador1_id}" 
                                    data-j2="${p.jugador2_id}" 
                                    data-nombre1="${p.jugador1}" 
                                    data-nombre2="${p.jugador2}"
                                    data-ronda="${rondaNum}">
                                Agendar fecha
                            </button>
                        `;
                    }

                    html += `
                        <li style="padding: 0.2rem 0; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                            <span>${p.jugador1} vs ${p.jugador2} — <strong>${resultado}</strong></span>
                            ${botonAgendar}
                        </li>
                    `;
                }
            });
            html += `
                    </ul>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;

        // Asignar evento click a los botones de agendar
        container.querySelectorAll('.agendar-partida').forEach(btn => {
            btn.addEventListener('click', function() {
                const codigo = this.dataset.codigo;
                const j1 = this.dataset.j1;
                const j2 = this.dataset.j2;
                const nombre1 = this.dataset.nombre1;
                const nombre2 = this.dataset.nombre2;
                const ronda = this.dataset.ronda;
                abrirModalAgendar(codigo, nombre1, nombre2, ronda, j1, j2);
            });
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="standings-error">Error al cargar enfrentamientos: ${err.message}</p>`;
    }
}

// ==========================================================
// 8. MODAL PARA VER DECK DEL RIVAL
// ==========================================================

function verDeckRival(codigo, rivalId, rivalNombre) {
    const modal = document.querySelector('#deck-rival-modal');
    if (!modal) return;

    modal.querySelector('.modal-rival-nombre').textContent = rivalNombre;
    modal.querySelector('.modal-deck-content').innerHTML = '<p class="standings-loading">Cargando deck...</p>';
    modal.hidden = false;
    document.body.classList.add('no-scroll');

    cargarDeckRival(codigo, rivalId);
}

async function cargarDeckRival(codigo, rivalId) {
    const container = document.querySelector('.modal-deck-content');
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) return;

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/deck-rival?session=${token}&torneo=${codigo}&rival=${rivalId}`);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Error al cargar deck');
        }
        const data = await res.json();
        const deck = data.deck;

        if (!deck) {
            container.innerHTML = `<p class="empty-state">El rival no tiene deck registrado.</p>`;
            return;
        }

        let html = `
            <h4>🃏 ${deck.nombre || 'Deck sin nombre'}</h4>
            <p><strong>Arquetipo:</strong> ${deck.archetype || 'Desconocido'}</p>
            <p><strong>Decklist:</strong></p>
            <pre class="deck-list">${deck.decklist || 'Vacío'}</pre>
        `;
        if (deck.sideboard && deck.sideboard !== 'N/A') {
            html += `<p class="deck-sideboard-title">Sideboard</p><pre class="deck-list">${deck.sideboard}</pre>`;
        }
        container.innerHTML = html;

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="standings-error">Error al cargar deck: ${err.message}</p>`;
    }
}

function cerrarModalDeckRival() {
    const modal = document.querySelector('#deck-rival-modal');
    if (modal) {
        modal.hidden = true;
        document.body.classList.remove('no-scroll');
    }
}

function initDeckRivalModal() {
    const modal = document.querySelector('#deck-rival-modal');
    if (!modal) return;
    const closeBtn = modal.querySelector('#deck-rival-close');
    const backdrop = modal.querySelector('[data-close-deck-rival]');
    if (closeBtn) closeBtn.addEventListener('click', cerrarModalDeckRival);
    if (backdrop) backdrop.addEventListener('click', cerrarModalDeckRival);
    modal.addEventListener('click', function(e) {
        if (e.target === this) cerrarModalDeckRival();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) cerrarModalDeckRival();
    });
}

// ==========================================================
// 9. MODAL PARA REPORTAR RESULTADO
// ==========================================================

function abrirModalReporte(codigo, nombre1, nombre2, ronda, j1, j2) {
    const modal = document.querySelector('#reporte-modal');
    if (!modal) return;

    modal.querySelector('.modal-codigo').textContent = codigo;
    modal.querySelector('.modal-j1').textContent = nombre1;
    modal.querySelector('.modal-j2').textContent = nombre2;
    modal.querySelector('.modal-ronda').textContent = ronda;
    document.querySelector('#reporte-codigo').value = codigo;
    document.querySelector('#reporte-j1').value = j1;
    document.querySelector('#reporte-j2').value = j2;

    modal.hidden = false;
    document.body.classList.add('no-scroll');
    const status = document.querySelector('#reporte-status');
    if (status) {
        status.textContent = '';
        status.className = 'form-status';
    }
}

function cerrarModalReporte() {
    const modal = document.querySelector('#reporte-modal');
    if (modal) {
        modal.hidden = true;
        document.body.classList.remove('no-scroll');
    }
    const form = document.querySelector('#reporte-form');
    if (form) form.reset();
}

async function reportarResultado(e) {
    e.preventDefault();
    const form = document.querySelector('#reporte-form');
    const status = document.querySelector('#reporte-status');
    const submitBtn = form.querySelector('button[type="submit"]');

    const codigo = document.querySelector('#reporte-codigo').value;
    const jugador1_id = document.querySelector('#reporte-j1').value;
    const jugador2_id = document.querySelector('#reporte-j2').value;
    const resultado = document.querySelector('#reporte-resultado').value.trim();

    if (!resultado || !resultado.match(/^\d+-\d+$/)) {
        status.textContent = 'Formato incorrecto. Usa X-Y (ej: 2-1)';
        status.className = 'form-status error';
        return;
    }

    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Reportando...';
    status.textContent = '';
    status.className = 'form-status';

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/reportar-resultado`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session: token,
                codigo_torneo: codigo,
                jugador1_id: jugador1_id,
                jugador2_id: jugador2_id,
                resultado: resultado
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al reportar');

        status.textContent = '✅ ' + data.mensaje;
        status.className = 'form-status success';
        setTimeout(() => {
            cerrarModalReporte();
            cargarMisPendientes();
        }, 1500);

    } catch (err) {
        status.textContent = '❌ ' + err.message;
        status.className = 'form-status error';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reportar';
    }
}

function initReporteModal() {
    const modal = document.querySelector('#reporte-modal');
    if (!modal) return;
    const closeBtn = modal.querySelector('#reporte-close');
    const backdrop = modal.querySelector('[data-close-reporte]');
    if (closeBtn) closeBtn.addEventListener('click', cerrarModalReporte);
    if (backdrop) backdrop.addEventListener('click', cerrarModalReporte);
    modal.addEventListener('click', function(e) {
        if (e.target === this) cerrarModalReporte();
    });
    const form = document.querySelector('#reporte-form');
    if (form) form.addEventListener('submit', reportarResultado);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) cerrarModalReporte();
    });
}

// ==========================================================
// 10. CARGAR MIS DECKS
// ==========================================================

async function cargarMisDecks() {
    const contenedor = document.querySelector('#mis-decks-lista');
    if (!contenedor) return;

    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) return;

    if (typeof DEV_MODE_FAKE_LOGIN !== 'undefined' && DEV_MODE_FAKE_LOGIN && token === 'dev-fake-session-token') {
        contenedor.innerHTML = `
            <div class="mi-deck-card">
                <h3>FastVourer <span class="deck-archetype">Devourer</span></h3>
                <p class="deck-tournament">Torneo de Prueba (datos simulados)</p>
                <details>
                    <summary>Ver decklist</summary>
                    <pre class="deck-list">4 Phyrexian Devourer\n4 Altar of Dementia\n4 Defense Grid\n...</pre>
                </details>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = '<p class="standings-loading">Cargando tus decks...</p>';

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/mis-decks?session=${token}`);
        const data = await res.json();

        if (!res.ok || !data.decks || !data.decks.length) {
            contenedor.innerHTML = '<p class="standings-error">Todavía no has subido ningún deck.</p>';
            return;
        }

        contenedor.innerHTML = data.decks.map(d => `
            <div class="mi-deck-card">
                <h3>${d.nombre_deck} <span class="deck-archetype">${d.archetype}</span></h3>
                <p class="deck-tournament">${d.codigo_torneo || ''}</p>
                <details>
                    <summary>Ver decklist</summary>
                    <pre class="deck-list">${d.decklist}</pre>
                    ${d.sideboard && d.sideboard !== 'N/A' ? `<p class="deck-sideboard-title">Sideboard</p><pre class="deck-list">${d.sideboard}</pre>` : ''}
                </details>
            </div>
        `).join('');

    } catch (err) {
        console.error(err);
        contenedor.innerHTML = '<p class="standings-error">No se pudieron cargar tus decks.</p>';
    }
}

// ==========================================================
// 11. BANNER DE TORNEOS ACTIVOS
// ==========================================================

async function cargarEstadoTorneos() {
    const contenedor = document.querySelector('#torneo-banner-container');
    if (!contenedor) return;

    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) return;

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/estado-torneos?session=${token}`);
        const data = await res.json();

        if (!res.ok || !data.torneos) {
            contenedor.innerHTML = `
                <div class="torneo-banner torneo-banner-quiet">
                    <div class="torneo-banner-text">
                        <h3>No hay torneos activos ahora mismo</h3>
                        <p>Te avisaremos aquí en cuanto se abra inscripción para el próximo.</p>
                    </div>
                </div>
            `;
            return;
        }

        const torneos = data.torneos.filter(t => t.estado === 'abierto' || t.estado === 'en desarrollo');

        if (!torneos.length) {
            contenedor.innerHTML = `
                <div class="torneo-banner torneo-banner-quiet">
                    <div class="torneo-banner-text">
                        <h3>No hay torneos activos ahora mismo</h3>
                        <p>Te avisaremos aquí en cuanto se abra inscripción para el próximo.</p>
                    </div>
                </div>
            `;
            return;
        }

        let html = '';
        torneos.forEach(t => {
            const inscrito = t.inscrito;
            const tieneDeck = t.tiene_deck;
            const estado = t.estado;
            const deckEdited = t.deck_edited || 0;
            const puedeEditar = estado === 'abierto' || (estado === 'en desarrollo' && deckEdited < 1);
            const statusClass = inscrito ? 'inscrito' : 'no-inscrito';
            const statusText = inscrito ? 'Inscrito' : 'No inscrito';
            const fecha = t.fecha_inicio || 'Sin fecha';
            const inscritos = `${t.total_inscritos || 0}/${t.total_maximo || '∞'}`;

            // 🔥 Toggle de expansión (flecha) - único botón en la cabecera
            const toggleHtml = `
                <button class="mi-torneo-toggle banner-toggle" aria-label="Ver más" data-torneo="${t.codigo}">
                    <svg class="icon-arrow-down" viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor"d="M7 10l5 5 5-5z"></path>
                    </svg>
                </button>
            `;

            html += `
                <div class="torneo-banner" data-torneo="${t.codigo}" data-puede-editar="${puedeEditar}" data-tiene-deck="${tieneDeck}" data-inscrito="${inscrito}" data-estado="${estado}">
                    <div class="torneo-banner-header">
                        <div class="torneo-banner-info">
                            <h3>${t.nombre}</h3>
                            <span class="torneo-banner-status ${statusClass}">${statusText}</span>
                            ${tieneDeck ? `<span class="torneo-banner-deck-status">🃏</span>` : ''}
                            <span class="torneo-banner-meta">📅 ${fecha} · 👥 ${inscritos}</span>
                        </div>
                        <div class="torneo-banner-actions">
                            ${toggleHtml}
                        </div>
                    </div>
                    <div class="torneo-banner-deck" id="deck-${t.codigo}"></div>
                </div>
            `;
        });

        contenedor.innerHTML = html;

        // ============================================================
        // EVENTOS
        // ============================================================
        // 🔥 Toggle de expansión (flecha) - abre/cierra el panel
        contenedor.querySelectorAll('.banner-toggle').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const codigo = this.dataset.torneo;
                const banner = this.closest('.torneo-banner');
                const deckContainer = banner.querySelector('.torneo-banner-deck');
                const toggle = this;

                if (deckContainer.classList.contains('visible')) {
                    deckContainer.classList.remove('visible');
                    deckContainer.innerHTML = '';
                    toggle.classList.remove('open');
                } else {
                    deckContainer.classList.add('visible');
                    toggle.classList.add('open');
                    if (!deckContainer.innerHTML.trim()) {
                        const puedeEditar = banner.dataset.puedeEditar === 'true';
                        const tieneDeck = banner.dataset.tieneDeck === 'true';
                        const inscrito = banner.dataset.inscrito === 'true';
                        const estado = banner.dataset.estado;
                        verMiDeck(codigo, deckContainer, puedeEditar, tieneDeck, inscrito, estado);
                    }
                }
            });
        });

    } catch (err) {
        console.error(err);
        contenedor.innerHTML = '';
    }
}

async function inscribirseEnTorneo(codigoTorneo, btn) {
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) return;

    btn.disabled = true;
    btn.textContent = 'Inscribiendo...';

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/inscribirse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session: token, codigo_torneo: codigoTorneo })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        cargarEstadoTorneos();

    } catch (err) {
        alert(err.message || 'No se pudo completar la inscripción');
        btn.disabled = false;
        btn.textContent = 'Apuntarme';
    }
}

// ==========================================================
// 12. MODAL PARA SUBIR DECK
// ==========================================================

function cerrarDeckModal() {
    const modal = document.querySelector('#deck-modal');
    if (!modal) return;

    modal.hidden = true;
    document.body.classList.remove('no-scroll');

    const form = document.querySelector('#subir-deck-form');
    if (form) form.reset();

    const status = document.querySelector('#subir-deck-status');
    if (status) {
        status.textContent = '';
        status.className = 'form-status';
    }
}

function initDeckModal() {
    const toggleBtn = document.querySelector('#nuevo-deck-toggle');
    const closeBtn = document.querySelector('#deck-modal-close');
    const backdrop = document.querySelector('[data-close-deck-modal]');
    const modal = document.querySelector('#deck-modal');

    if (!toggleBtn || !modal) return;

    toggleBtn.addEventListener('click', () => abrirDeckModal());

    if (closeBtn) closeBtn.addEventListener('click', cerrarDeckModal);
    if (backdrop) backdrop.addEventListener('click', cerrarDeckModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) {
            cerrarDeckModal();
        }
    });
}

async function cargarTodasPartidas() {
    const contenedor = document.querySelector('#todas-partidas-container');
    if (!contenedor) return;

    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
        contenedor.innerHTML = `<p class="empty-state">Debes iniciar sesión.</p>`;
        return;
    }

    contenedor.innerHTML = `<p class="standings-loading">Cargando todas las partidas...</p>`;

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/todas-partidas?session=${token}`);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Error al cargar partidas');
        }
        const data = await res.json();
        const partidas = data.partidas || [];

        if (!partidas.length) {
            contenedor.innerHTML = `
                <div class="partidas-container">
                    <h3>📅 Todas las partidas agendadas</h3>
                    <div class="partidas-empty">
                        <div class="empty-icon">📭</div>
                        <p>No hay partidas agendadas en el servidor.</p>
                    </div>
                </div>
            `;
            return;
        }

        let html = `
            <div class="partidas-container">
                <h3>📅 Todas las partidas agendadas</h3>
                <div class="partidas-table-wrap">
                    <table class="partidas-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Hora</th>
                                <th>Jugador 1</th>
                                <th>Jugador 2</th>
                                <th>Agendado por</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        partidas.forEach(p => {
            html += `
                <tr>
                    <td><strong>${p.fecha}</strong></td>
                    <td>${p.hora}</td>
                    <td>${p.jugador1}</td>
                    <td>${p.jugador2}</td>
                    <td><span style="color:var(--muted); font-size:.85rem;">${p.agendado_por || 'Desconocido'}</span></td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        contenedor.innerHTML = html;
                // ============================================================
        // EVENTOS: Editar partida
        // ============================================================
        contenedor.querySelectorAll('.editar-partida-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const fecha = this.dataset.fecha;
                const hora = this.dataset.hora;
                const j1 = this.dataset.j1;
                const j2 = this.dataset.j2;
                const nombre1 = this.dataset.nombre1;
                const nombre2 = this.dataset.nombre2;
                abrirModalAgendar(null, nombre1, nombre2, null, j1, j2, {
                    modo: 'editar',
                    fecha_actual: fecha,
                    hora_actual: hora
                });
            });
        });

        // ============================================================
        // EVENTOS: Eliminar partida (AÑADIR AQUÍ)
        // ============================================================
        contenedor.querySelectorAll('.eliminar-partida-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const fecha = this.dataset.fecha;
                const hora = this.dataset.hora;
                const j1 = this.dataset.j1;
                const j2 = this.dataset.j2;
                const nombre1 = this.dataset.nombre1;
                const nombre2 = this.dataset.nombre2;
                if (confirm(`¿Eliminar la partida del ${fecha} a las ${hora} entre ${nombre1} y ${nombre2}?`)) {
                    eliminarPartida(fecha, hora, j1, j2);
                }
            });
        });

    } catch (err) {
        console.error(err);
        contenedor.innerHTML = `<p class="standings-error">Error al cargar partidas: ${err.message}</p>`;
    }
}

async function cargarArquetipos() {
    const datalist = document.querySelector('#arquetipos-lista');
    if (!datalist) return;

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/arquetipos`);
        const data = await res.json();

        datalist.innerHTML = (data.arquetipos || [])
            .map(a => `<option value="${a}"></option>`)
            .join('');

    } catch (err) {
        console.error(err);
    }
}

function initSubirDeckForm() {
    const form = document.querySelector('#subir-deck-form');
    const submitBtn = document.querySelector('#subir-deck-submit');
    const status = document.querySelector('#subir-deck-status');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!token) {
            status.textContent = 'No hay sesión activa.';
            status.className = 'form-status error';
            return;
        }

        const payload = {
            session: token,
            codigo_torneo: form.codigo_torneo.value,
            nombre_deck: form.nombre_deck.value.trim(),
            archetype: form.archetype.value.trim(),
            decklist: form.decklist.value.trim(),
            sideboard: form.sideboard.value.trim(),
        };

        if (!payload.codigo_torneo || !payload.nombre_deck || !payload.archetype || !payload.decklist) {
            status.textContent = 'Rellena todos los campos obligatorios.';
            status.className = 'form-status error';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        status.textContent = '';
        status.className = 'form-status';

        const esEdicion = form.dataset.edicion === 'true';

        try {
            let endpoint = `${AUTH_API_BASE}/api/subir-deck`;
            let method = 'POST';

            if (esEdicion) {
                endpoint = `${AUTH_API_BASE}/api/editar-deck`;
                method = 'POST';
                payload.codigo_deck = form.dataset.codigoDeck;
            }

            const res = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            status.textContent = esEdicion ? '✅ Deck actualizado con éxito' : '✅ Deck subido con éxito';
            status.className = 'form-status success';

            // Limpiar estado de edición (si existía)
            delete form.dataset.edicion;
            delete form.dataset.codigoDeck;
            submitBtn.textContent = 'Subir Deck';

            setTimeout(() => {
                cerrarDeckModal();
                cargarMisDecks();
                cargarEstadoTorneos();
            }, 1200);

        } catch (err) {
            status.textContent = '❌ ' + err.message;
            status.className = 'form-status error';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = esEdicion ? 'Actualizar Deck' : 'Subir Deck';
        }
    });
}

async function cargarTodasPartidas() {
    const contenedor = document.querySelector('#todas-partidas-container');
    if (!contenedor) return;
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
        contenedor.innerHTML = `<p class="empty-state">Debes iniciar sesión.</p>`;
        return;
    }
    contenedor.innerHTML = `<p class="standings-loading">Cargando todas las partidas...</p>`;
    try {
        const res = await fetch(`${AUTH_API_BASE}/api/todas-partidas?session=${token}`);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Error al cargar partidas');
        }
        const data = await res.json();
        const partidas = data.partidas || [];
        if (!partidas.length) {
            contenedor.innerHTML = `
                <div class="partidas-container">
                    <h3>📅 Todas las partidas agendadas</h3>
                    <div class="partidas-empty">
                        <div class="empty-icon">📭</div>
                        <p>No hay partidas agendadas en el servidor.</p>
                    </div>
                </div>
            `;
            return;
        }

        let html = `
            <div class="partidas-container">
                <h3>📅 Todas las partidas agendadas</h3>
                <div class="partidas-table-wrap">
                    <table class="partidas-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Hora</th>
                                <th>Jugador 1</th>
                                <th>Jugador 2</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        partidas.forEach(p => {
            const rol = p.jugador1_id == window.klubDiscordId ? 'Jugador 1' : 'Jugador 2';
            const rolClass = rol === 'Jugador 1' ? 'jugador1' : 'jugador2';
            html += `
                <tr>
                    <td><strong>${p.fecha}</strong></td>
                    <td>${p.hora}</td>
                    <td>${p.jugador1}</td>
                    <td>${p.jugador2}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary editar-partida-btn" 
                                data-fecha="${p.fecha}" 
                                data-hora="${p.hora}" 
                                data-j1="${p.jugador1_id}" 
                                data-j2="${p.jugador2_id}"
                                data-nombre1="${p.jugador1}"
                                data-nombre2="${p.jugador2}"
                                title="Editar fecha/hora">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="btn btn-sm btn-danger eliminar-partida-btn" 
                                data-fecha="${p.fecha}" 
                                data-hora="${p.hora}" 
                                data-j1="${p.jugador1_id}" 
                                data-j2="${p.jugador2_id}"
                                data-nombre1="${p.jugador1}"
                                data-nombre2="${p.jugador2}"
                                title="Eliminar partida">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        });

        contenedor.innerHTML = html;
        contenedor.querySelectorAll('.editar-partida-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const fecha = this.dataset.fecha;
                const hora = this.dataset.hora;
                const j1 = this.dataset.j1;
                const j2 = this.dataset.j2;
                const nombre1 = this.dataset.nombre1;
                const nombre2 = this.dataset.nombre2;
                abrirModalAgendar(null, nombre1, nombre2, null, j1, j2, {
                    modo: 'editar',
                    fecha_actual: fecha,
                    hora_actual: hora
                });
            });
        });

    } catch (err) {
        console.error(err);
        contenedor.innerHTML = `<p class="standings-error">Error al cargar partidas: ${err.message}</p>`;
    }
}

// ==========================================================
// 15. PARTIDAS PENDIENTES (clickeables para reportar)
// ==========================================================

async function cargarMisPendientes() {
    const contenedor = document.querySelector('#mis-pendientes-container');
    if (!contenedor) return;

    // Control para evitar múltiples llamadas seguidas
    if (window._cargandoPendientes) return;
    window._cargandoPendientes = true;

    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
        contenedor.innerHTML = `<p class="empty-state">Debes iniciar sesión.</p>`;
        window._cargandoPendientes = false;
        return;
    }

    contenedor.innerHTML = `<p class="standings-loading">Cargando tus partidas pendientes...</p>`;

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/mis-torneos-pendientes?session=${token}`);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Error al cargar pendientes');
        }
        const data = await res.json();
        const torneos = data.torneos || [];

        // ✅ Obtener tu ID de Discord
        const miDiscordId = window.klubDiscordId;

        // Filtrar: solo nos quedamos con los torneos que tengan al menos una partida tuya
        const misTorneos = torneos.map(t => {
            // Filtrar los emparejamientos: solo los que son tuyos
            const misPendientes = t.pendientes.filter(p => 
                p.jugador1_id == miDiscordId || p.jugador2_id == miDiscordId
            );
            // Si no hay partidas tuyas, este torneo no se muestra
            if (misPendientes.length === 0) return null;
            return {
                ...t,
                pendientes: misPendientes
            };
        }).filter(t => t !== null);

        if (!misTorneos.length) {
            contenedor.innerHTML = `
                <div class="empty-state">
                    <p>🎉 No tienes partidas pendientes en ningún torneo.</p>
                    <p style="font-size:.85rem; color:var(--muted);">Todas tus rondas están completadas.</p>
                </div>
            `;
            window._cargandoPendientes = false;
            return;
        }

        let html = `<h3>⚔️ Mis partidas pendientes</h3>`;

        misTorneos.forEach(t => {
            html += `
                <div class="torneo-pendiente-card">
                    <h4>${t.nombre} (${t.codigo}) — Ronda ${t.ronda}</h4>
                    <ul class="pendientes-lista">
            `;
            t.pendientes.forEach(p => {
                // Ya sabemos que es mi partida (porque lo filtramos)
                const esMiPartida = true;
                const dataAttrs = `
                    data-codigo="${t.codigo}"
                    data-j1="${p.jugador1_id}"
                    data-j2="${p.jugador2_id}"
                    data-nombre1="${p.jugador1}"
                    data-nombre2="${p.jugador2}"
                    data-ronda="${t.ronda}"
                    data-es-mi-partida="true"
                `;

                if (p.jugador2 === 'BYE') {
                    html += `<li class="pendiente-bye">${p.jugador1} → BYE</li>`;
                } else {
                    html += `
                        <li class="pendiente-item" ${dataAttrs}>
                            <span>${p.jugador1} vs ${p.jugador2} ⏳</span>
                            <div class="pendiente-actions">
                                <button class="btn btn-sm btn-primary agendar-pendiente" 
                                        data-codigo="${t.codigo}" 
                                        data-j1="${p.jugador1_id}" 
                                        data-j2="${p.jugador2_id}" 
                                        data-nombre1="${p.jugador1}" 
                                        data-nombre2="${p.jugador2}"
                                        data-ronda="${t.ronda}">
                                    Agendar
                                </button>
                                <button class="btn btn-sm btn-success reportar-pendiente" 
                                        data-codigo="${t.codigo}" 
                                        data-j1="${p.jugador1_id}" 
                                        data-j2="${p.jugador2_id}" 
                                        data-nombre1="${p.jugador1}" 
                                        data-nombre2="${p.jugador2}"
                                        data-ronda="${t.ronda}">
                                    Reportar
                                </button>
                            </div>
                        </li>
                    `;
                }
            });
            html += `
                    </ul>
                </div>
            `;
        });

        contenedor.innerHTML = html;

        // Asignar eventos (igual que antes)
        contenedor.querySelectorAll('.agendar-pendiente').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const codigo = this.dataset.codigo;
                const j1 = this.dataset.j1;
                const j2 = this.dataset.j2;
                const nombre1 = this.dataset.nombre1;
                const nombre2 = this.dataset.nombre2;
                const ronda = this.dataset.ronda;
                abrirModalAgendar(codigo, nombre1, nombre2, ronda, j1, j2);
            });
        });

        contenedor.querySelectorAll('.reportar-pendiente').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const codigo = this.dataset.codigo;
                const j1 = this.dataset.j1;
                const j2 = this.dataset.j2;
                const nombre1 = this.dataset.nombre1;
                const nombre2 = this.dataset.nombre2;
                const ronda = this.dataset.ronda;
                abrirModalReporte(codigo, nombre1, nombre2, ronda, j1, j2);
            });
        });

    } catch (err) {
        console.error(err);
        contenedor.innerHTML = `<p class="standings-error">Error al cargar tus pendientes: ${err.message}</p>`;
    } finally {
        window._cargandoPendientes = false;
    }
}

// ==========================================================
// 17. FUNCIONES GLOBALES PARA ONCLICK
// ==========================================================

// Desinscribirse (usada en botones)
async function desinscribirse(codigo) {
    if (!confirm(`¿Quieres desinscribirte del torneo ${codigo}?`)) return;
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) return;
    try {
        const res = await fetch(`${AUTH_API_BASE}/api/desinscribirse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session: token, codigo_torneo: codigo })
        });
        const data = await res.json();
        if (data.ok) {
            alert('✅ ' + data.mensaje);
            cargarEstadoTorneos();
        } else {
            alert('❌ ' + data.error);
        }
    } catch (error) {
        alert('Error al desinscribirse: ' + error.message);
    }
}

async function toggleDeckDisplay(codigo, btn) {
    const banner = btn.closest('.torneo-banner');
    const deckDisplay = banner.querySelector('.deck-display');
    if (!deckDisplay) return;

    // Si ya está visible, lo ocultamos
    if (deckDisplay.style.display === 'block') {
        deckDisplay.style.display = 'none';
        btn.textContent = 'Ver deck';
        return;
    }

    // Mostrar y cargar deck
    deckDisplay.style.display = 'block';
    btn.textContent = 'Ocultar deck';
    deckDisplay.innerHTML = '<p class="standings-loading">Cargando deck...</p>';

    try {
        const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
        const res = await fetch(`${AUTH_API_BASE}/api/mis-decks?session=${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error('Error al cargar decks');

        // Buscar el deck del torneo
        let deck = data.decks.find(d => d.codigo_torneo === codigo);
        if (!deck) {
            deck = data.decks.find(d => d.codigo_deck && d.codigo_deck.startsWith(codigo + '_'));
        }
        if (!deck) {
            deck = data.decks.find(d => d.codigo_torneo && d.codigo_torneo.includes(codigo));
        }

        if (!deck) {
            deckDisplay.innerHTML = '<p class="empty-state">No has subido deck para este torneo.</p>';
            return;
        }

        let html = `
            <div class="deck-card">
                <h4>🃏 ${deck.nombre_deck}</h4>
                <p><strong>Arquetipo:</strong> ${deck.archetype}</p>
                <details>
                    <summary>Ver decklist</summary>
                    <pre class="deck-list">${deck.decklist}</pre>
                </details>
                ${deck.sideboard && deck.sideboard !== 'N/A' ? `
                    <details>
                        <summary>Ver sideboard</summary>
                        <pre class="deck-list">${deck.sideboard}</pre>
                    </details>
                ` : ''}
            </div>
        `;
        deckDisplay.innerHTML = html;

    } catch (err) {
        console.error(err);
        deckDisplay.innerHTML = `<p class="standings-error">Error al cargar deck: ${err.message}</p>`;
    }
}
/**
 * Abre el modal de subir/editar deck.
 * Si se pasa un código de torneo, carga los datos del deck desde el backend
 * y rellena el formulario para editar.
 */
async function abrirDeckModal(codigoTorneo = null) {
    const modal = document.querySelector('#deck-modal');
    if (!modal) return;

    // Resetear el formulario y el status
    const form = document.querySelector('#subir-deck-form');
    const status = document.querySelector('#subir-deck-status');
    if (status) {
        status.textContent = '';
        status.className = 'form-status';
    }

    // Si no hay código, solo abrir el modal vacío para subir nuevo deck
    if (!codigoTorneo) {
        modal.hidden = false;
        document.body.classList.add('no-scroll');
        cargarTorneosDisponibles();
        cargarArquetipos();
        return;
    }

    // Mostrar loading en el modal
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    
    // Cargar torneos disponibles y arquetipos
    await cargarTorneosDisponibles(codigoTorneo);
    await cargarArquetipos();

    // Cargar los decks del usuario para encontrar el de este torneo
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
        status.textContent = 'No hay sesión activa.';
        status.className = 'form-status error';
        return;
    }

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/mis-decks?session=${token}`);
        if (!res.ok) throw new Error('Error al obtener tus decks');
        const data = await res.json();
        const decks = data.decks || [];

        // Buscar el deck para este torneo (por codigo_torneo)
        let deck = decks.find(d => d.codigo_torneo === codigoTorneo);
        if (!deck) {
            // Fallback: buscar por codigo_deck que empiece con el código
            deck = decks.find(d => d.codigo_deck && d.codigo_deck.startsWith(codigoTorneo + '_'));
        }

        if (deck) {
            // Rellenar el formulario con los datos del deck
            document.querySelector('#deck-nombre').value = deck.nombre_deck || '';
            document.querySelector('#deck-archetype').value = deck.archetype || '';
            document.querySelector('#deck-decklist').value = deck.decklist || '';
            document.querySelector('#deck-sideboard').value = deck.sideboard || '';
            
            // Cambiar el texto del botón a "Actualizar Deck"
            const submitBtn = document.querySelector('#subir-deck-submit');
            if (submitBtn) submitBtn.textContent = 'Actualizar Deck';
        } else {
            // No tiene deck, dejamos el formulario vacío para subir
            const submitBtn = document.querySelector('#subir-deck-submit');
            if (submitBtn) submitBtn.textContent = 'Subir Deck';
        }

        // Asegurar que el select de torneo tenga el código seleccionado
        const select = document.querySelector('#deck-torneo');
        if (select) select.value = codigoTorneo;

    } catch (err) {
        console.error(err);
        if (status) {
            status.textContent = 'Error al cargar tu deck: ' + err.message;
            status.className = 'form-status error';
        }
    }
}

async function verMiDeck(codigoTorneo, contenedor, puedeEditar = false, tieneDeck = false, inscrito = false, estado = 'abierto') {
    contenedor.innerHTML = '<p class="standings-loading">Cargando panel...</p>';

    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
        contenedor.innerHTML = '<p class="empty-state">Debes iniciar sesión.</p>';
        return;
    }

    try {
        // 🔥 Si el torneo está EN DESARROLLO → mostrar panel completo con pestañas
        if (estado === 'en desarrollo') {
            // Construir el panel con pestañas
            const panelHtml = `
                <div class="mi-torneo-panel" style="display: block; margin-top: 0.5rem; padding-top: 0;">
                    <div class="mi-torneo-tabs">
                        <button class="tab-btn active" data-tab="clasificacion">📊 Clasificación</button>
                        <button class="tab-btn" data-tab="deck">🃏 Deck</button>
                        <button class="tab-btn" data-tab="enfrentamientos">⚔️ Enfrentamientos</button>
                    </div>
                    <div class="mi-torneo-panel-content">
                        <div class="tab-content active" data-tab="clasificacion"><p class="standings-loading">Cargando clasificación...</p></div>
                        <div class="tab-content" data-tab="deck"><p class="standings-loading">Cargando deck...</p></div>
                        <div class="tab-content" data-tab="enfrentamientos"><p class="standings-loading">Cargando enfrentamientos...</p></div>
                    </div>
                </div>
            `;

            contenedor.innerHTML = panelHtml;

            const panel = contenedor.querySelector('.mi-torneo-panel');
            const contentDivClasificacion = panel.querySelector('.tab-content[data-tab="clasificacion"]');
            const contentDivDeck = panel.querySelector('.tab-content[data-tab="deck"]');
            const contentDivEnfrentamientos = panel.querySelector('.tab-content[data-tab="enfrentamientos"]');

            // Cargar clasificación (activa por defecto)
            if (contentDivClasificacion) {
                await cargarClasificacionEnPanel(codigoTorneo, contentDivClasificacion);
            }

            // Asignar eventos a las pestañas
            panel.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const tab = this.dataset.tab;
                    // Marcar activa
                    panel.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    panel.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    const target = panel.querySelector(`.tab-content[data-tab="${tab}"]`);
                    if (target) target.classList.add('active');

                    // Cargar contenido si no tiene
                    if (target && target.innerHTML.includes('standings-loading')) {
                        if (tab === 'clasificacion') {
                            await cargarClasificacionEnPanel(codigoTorneo, target);
                        } else if (tab === 'deck') {
                            await cargarDeckEnPanel(codigoTorneo, target);
                        } else if (tab === 'enfrentamientos') {
                            await cargarEnfrentamientosEnPanel(codigoTorneo, target);
                        }
                    }
                });
            });

            return; // Salir, ya hemos renderizado todo
        }

        // ============================================================
        // Comportamiento original para torneos ABIERTOS o FINALIZADOS
        // ============================================================
        const res = await fetch(`${AUTH_API_BASE}/api/mis-decks?session=${token}`);
        if (!res.ok) throw new Error('Error al obtener decks');
        const data = await res.json();
        const decks = data.decks || [];

        let deck = decks.find(d => d.codigo_torneo === codigoTorneo);
        if (!deck) {
            deck = decks.find(d => d.codigo_deck && d.codigo_deck.startsWith(codigoTorneo + '_'));
        }

        let botonEditar = '';
        let accionesHtml = '';
        let deckHtml = '';

        // Acciones del torneo
        if (inscrito) {
            if (estado === 'abierto') {
                accionesHtml = `<button class="btn btn-sm btn-danger" data-desinscribir="${codigoTorneo}">Desinscribirme</button>`;
            }
        } else {
            if (estado === 'abierto') {
                accionesHtml = `<button class="btn btn-sm btn-primary" data-inscribir="${codigoTorneo}">Apuntarme</button>`;
            } else {
                accionesHtml = `<button class="btn btn-sm btn-secondary" disabled>Cerrado</button>`;
            }
        }

        // Deck
        if (!deck) {
            deckHtml = `
                <div class="deck-preview">
                    <p class="empty-state">No has subido deck para este torneo.</p>
                </div>
            `;
        } else {
            if (puedeEditar) {
                botonEditar = `<button class="btn btn-sm btn-warning" data-editar-deck="${codigoTorneo}">Editar deck</button>`;
            } else {
                botonEditar = `<button class="btn btn-sm btn-secondary" disabled>Edición única usada</button>`;
            }

            deckHtml = `
                <div class="deck-preview">
                    <h4>🃏 ${deck.nombre_deck}</h4>
                    <p><strong>Arquetipo:</strong> <span class="deck-archetype">${deck.archetype}</span></p>
                    <p><strong>Decklist:</strong></p>
                    <pre class="deck-list">${deck.decklist}</pre>
            `;
            if (deck.sideboard && deck.sideboard !== 'N/A') {
                deckHtml += `<p class="deck-sideboard-title">Sideboard</p><pre class="deck-list">${deck.sideboard}</pre>`;
            }
            deckHtml += `</div>`;
        }

        let buttonsHtml = !deck
            ? `<button class="btn btn-sm btn-primary" data-subir-deck="${codigoTorneo}">Subir deck</button>`
            : botonEditar;

        const html = `
            ${deckHtml}
            <div class="panel-actions" style="margin-bottom: 0.75rem;">
                ${accionesHtml} ${buttonsHtml}
            </div>
        `;

        contenedor.innerHTML = html;

        // Asignar eventos a los botones
        contenedor.querySelectorAll('[data-inscribir]').forEach(btn => {
            btn.addEventListener('click', () => inscribirseEnTorneo(btn.dataset.inscribir, btn));
        });
        contenedor.querySelectorAll('[data-desinscribir]').forEach(btn => {
            btn.addEventListener('click', () => desinscribirse(btn.dataset.desinscribir, btn));
        });
        contenedor.querySelectorAll('[data-subir-deck]').forEach(btn => {
            btn.addEventListener('click', () => abrirDeckModal(btn.dataset.subirDeck));
        });
        contenedor.querySelectorAll('[data-editar-deck]').forEach(btn => {
            btn.addEventListener('click', () => abrirDeckModal(btn.dataset.editarDeck));
        });

    } catch (err) {
        console.error(err);
        contenedor.innerHTML = `<p class="standings-error">Error al cargar panel: ${err.message}</p>`;
    }
}
// ==========================================================
// 13. MODAL PARA AGENDAR PARTIDA
// ==========================================================

function abrirModalAgendar(codigo, nombre1, nombre2, ronda, j1, j2, opciones = {}) {
    const modal = document.querySelector('#agendar-modal');
    if (!modal) {
        console.error('Modal de agendar no encontrado');
        return;
    }

    const esEdicion = opciones.modo === 'editar';
    const fechaActual = opciones.fecha_actual || '';
    const horaActual = opciones.hora_actual || '';

    // Cambiar título y botón según modo
    const titulo = modal.querySelector('h3');
    const submitBtn = modal.querySelector('#agendar-form button[type="submit"]');
    const infoActual = modal.querySelector('.agendar-info-actual');

    if (esEdicion) {
        titulo.textContent = '✏️ Editar partida';
        submitBtn.textContent = 'Guardar cambios';
        if (infoActual) infoActual.textContent = `Fecha actual: ${fechaActual} - Hora: ${horaActual}`;
    } else {
        titulo.textContent = '📅 Agendar partida';
        submitBtn.textContent = 'Agendar';
        if (infoActual) infoActual.textContent = '';
    }

    // Rellenar campos comunes
    modal.querySelector('.agendar-codigo').textContent = codigo || '';
    modal.querySelector('.agendar-j1').textContent = nombre1;
    modal.querySelector('.agendar-j2').textContent = nombre2;
    modal.querySelector('.agendar-ronda').textContent = ronda || '';
    document.querySelector('#agendar-codigo').value = codigo || '';
    document.querySelector('#agendar-j1').value = j1;
    document.querySelector('#agendar-j2').value = j2;

    // Campos de edición
    if (esEdicion) {
        document.querySelector('#agendar-fecha').value = fechaActual;
        document.querySelector('#agendar-hora').value = horaActual;
        document.querySelector('#agendar-fecha-actual').value = fechaActual;
        document.querySelector('#agendar-hora-actual').value = horaActual;
        document.querySelector('#agendar-modo').value = 'editar';
    } else {
        document.querySelector('#agendar-fecha').value = '';
        document.querySelector('#agendar-hora').value = '';
        document.querySelector('#agendar-fecha-actual').value = '';
        document.querySelector('#agendar-hora-actual').value = '';
        document.querySelector('#agendar-modo').value = 'nuevo';
    }

    modal.hidden = false;
    document.body.classList.add('no-scroll');
    const status = document.querySelector('#agendar-status');
    if (status) {
        status.textContent = '';
        status.className = 'form-status';
    }
}


function cerrarModalAgendar() {
    const modal = document.querySelector('#agendar-modal');
    if (modal) {
        modal.hidden = true;
        document.body.classList.remove('no-scroll');
    }
    const form = document.querySelector('#agendar-form');
    if (form) form.reset();
}

async function agendarPartida(e) {
    e.preventDefault();
    const form = document.querySelector('#agendar-form');
    const status = document.querySelector('#agendar-status');
    const submitBtn = form.querySelector('button[type="submit"]');

    const codigo = document.querySelector('#agendar-codigo').value;
    const jugador1_id = document.querySelector('#agendar-j1').value;
    const jugador2_id = document.querySelector('#agendar-j2').value;
    const fecha = document.querySelector('#agendar-fecha').value.trim();
    const hora = document.querySelector('#agendar-hora').value.trim();
    const modo = document.querySelector('#agendar-modo').value;
    const fecha_actual = document.querySelector('#agendar-fecha-actual').value;
    const hora_actual = document.querySelector('#agendar-hora-actual').value;

    // Validaciones comunes
    if (!fecha || !fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        status.textContent = 'Fecha inválida. Usa DD/MM/YYYY.';
        status.className = 'form-status error';
        return;
    }
    if (!hora || !hora.match(/^\d{2}:\d{2}$/)) {
        status.textContent = 'Hora inválida. Usa HH:MM.';
        status.className = 'form-status error';
        return;
    }

    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
        status.textContent = 'No hay sesión activa.';
        status.className = 'form-status error';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = modo === 'editar' ? 'Guardando...' : 'Agendando...';
    status.textContent = '';
    status.className = 'form-status';

    try {
        let endpoint, payload;

        if (modo === 'editar') {
            endpoint = `${AUTH_API_BASE}/api/modificar-partida`;
            payload = {
                session: token,
                jugador1_id: jugador1_id,
                jugador2_id: jugador2_id,
                fecha_actual: fecha_actual,
                hora_actual: hora_actual,
                nueva_fecha: fecha,
                nueva_hora: hora
            };
        } else {
            endpoint = `${AUTH_API_BASE}/api/agendar-partida`;
            payload = {
                session: token,
                codigo_torneo: codigo,
                jugador1_id: jugador1_id,
                jugador2_id: jugador2_id,
                fecha: fecha,
                hora: hora
            };
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al procesar la solicitud');

        status.textContent = '✅ ' + data.mensaje;
        status.className = 'form-status success';

        setTimeout(() => {
            cerrarModalAgendar();
            cargarMisPartidas();   // recargar tabla de mis partidas
            cargarTodasPartidas(); // recargar todas las partidas
        }, 1500);

    } catch (err) {
        status.textContent = '❌ ' + err.message;
        status.className = 'form-status error';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = modo === 'editar' ? 'Guardar cambios' : 'Agendar';
    }
}

function initAgendarModal() {
    const modal = document.querySelector('#agendar-modal');
    if (!modal) return;
    const closeBtn = modal.querySelector('#agendar-close');
    const backdrop = modal.querySelector('[data-close-agendar]');
    if (closeBtn) closeBtn.addEventListener('click', cerrarModalAgendar);
    if (backdrop) backdrop.addEventListener('click', cerrarModalAgendar);
    modal.addEventListener('click', function(e) {
        if (e.target === this) cerrarModalAgendar();
    });
    const form = document.querySelector('#agendar-form');
    if (form) form.addEventListener('submit', agendarPartida);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) cerrarModalAgendar();
    });
}

async function eliminarPartida(fecha, hora, j1, j2) {
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
        alert('No hay sesión activa.');
        return;
    }

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/eliminar-partida`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session: token,
                jugador1_id: parseInt(j1),
                jugador2_id: parseInt(j2),
                fecha: fecha,
                hora: hora
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar');

        alert('✅ ' + data.mensaje);
        cargarMisPartidas();
        cargarTodasPartidas();
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

window.verDeckRival = verDeckRival;
window.cerrarModalDeckRival = cerrarModalDeckRival;
window.abrirModalReporte = abrirModalReporte;
window.cerrarModalReporte = cerrarModalReporte;
window.reportarResultado = reportarResultado;
window.cargarMisPendientes = cargarMisPendientes;
window.cargarTodasPartidas = cargarTodasPartidas;
window.desinscribirse = desinscribirse;
window.abrirDeckModal = abrirDeckModal;
window.abrirModalAgendar = abrirModalAgendar;
window.cerrarModalAgendar = cerrarModalAgendar;
window.eliminarPartida = eliminarPartida;

//navbar.js

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

//reveal.js

/* ==========================================================
   REVEAL ANIMATIONS
========================================================== */

class Reveal {

    constructor() {

        this.observer = new IntersectionObserver(
            this.handleIntersect.bind(this),
            {
                root: null,
                rootMargin: "0px 0px -10% 0px",
                threshold: 0.15
            }
        );

    }

    init() {
        document.querySelectorAll("[data-reveal]").forEach(element => {
            this.observer.observe(element);
        });
    }

    observeNew(elements) {
        elements.forEach(element => {
            this.observer.observe(element);
        });
    }

    handleIntersect(entries) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            this.observer.unobserve(entry.target);
        });
    }

}

function initReveal() {
    window.revealInstance = new Reveal();
    window.revealInstance.init();
}

//smooth-scroll.js 

/* ==========================================================
   SMOOTH SCROLL
========================================================== */

function initSmoothScroll() {

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener("click", function (e) {

            const targetId = this.getAttribute("href");
            if (targetId === "#") return;

            const target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();

            const navbar = document.querySelector(".navbar");
            const offset = navbar ? navbar.offsetHeight : 0;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;

            window.scrollTo({ top, behavior: "smooth" });

        });

    });

}

//standings-slider.js

/* ==========================================================
   SLIDER DE CLASIFICACIONES
========================================================== */


const TORNEOS_API = 'https://mydiscordbot-production-3e6a.up.railway.app/api/torneos';

let torneosOrdenados = [];
let slideActual = 0;

function formatearDiff(diff) {
    const clase = diff > 0 ? 'diff-positive' : diff < 0 ? 'diff-negative' : 'diff-neutral';
    const signo = diff > 0 ? '+' : '';
    return `<span class="${clase}">${signo}${diff}</span>`;
}

function renderSlide(torneo) {

    const filas = torneo.clasificacion.map(p => `
        <tr>
            <td class="standings-rank">${p.rank}</td>
            <td>
                <div class="standings-player">
                    ${p.avatar ? `<img src="${p.avatar}" alt="" class="standings-avatar">` : ''}
                    <span>@${p.nombre}</span>
                </div>
            </td>
            <td>${p.wins}-${p.losses}-${p.draws}</td>
            <td>${p.mp}</td>
            <td>${p.omw.toFixed(3)}</td>
            <td>${p.buchholz.toFixed(5)}</td>
            <td>${formatearDiff(p.diff)}</td>
        </tr>
    `).join('');

    return `
        <div class="slide-header">
            <h3>${torneo.nombre}</h3>
            <span class="slide-meta">${torneo.participantes_count} jugadores · Finalizado el ${formatearFecha(torneo.fecha_fin)}</span>
        </div>
        <div class="standings-table-wrap">
            <table class="standings-table">
                <thead>
                    <tr>
                        <th>Rango</th>
                        <th>Participante</th>
                        <th>G-P-E</th>
                        <th>Pts</th>
                        <th>OMW%</th>
                        <th>Buchholz</th>
                        <th>Dif</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </div>
    `;

}

function renderSlider() {

    const track = document.querySelector('#slider-track');
    const dotsContainer = document.querySelector('#slider-dots');

    track.innerHTML = torneosOrdenados.map((torneo, i) => `
        <div class="standings-slide ${i === slideActual ? 'is-active' : ''}" data-index="${i}">
            ${renderSlide(torneo)}
        </div>
    `).join('');

    dotsContainer.innerHTML = torneosOrdenados.map((_, i) => `
        <button class="slider-dot ${i === slideActual ? 'is-active' : ''}" data-index="${i}" aria-label="Ir al torneo ${i + 1}"></button>
    `).join('');

    document.querySelectorAll('.slider-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            slideActual = parseInt(dot.dataset.index);
            actualizarSlide();
        });
    });

    actualizarBotones();

}

function actualizarSlide() {

    document.querySelectorAll('.standings-slide').forEach((slide, i) => {
        slide.classList.toggle('is-active', i === slideActual);
    });

    document.querySelectorAll('.slider-dot').forEach((dot, i) => {
        dot.classList.toggle('is-active', i === slideActual);
    });

    actualizarBotones();

}

function actualizarBotones() {
    document.querySelector('#slider-prev').disabled = slideActual === 0;
    document.querySelector('#slider-next').disabled = slideActual === torneosOrdenados.length - 1;
}

async function cargarSlider() {

    const track = document.querySelector('#slider-track');
    if (!track) return;

    try {

        const res = await fetch(TORNEOS_API);
        if (!res.ok) throw new Error('Servicio no disponible');

        const data = await res.json();

        if (!data.torneos || !data.torneos.length) {
            track.innerHTML = '<p class="standings-error">Todavía no hay torneos finalizados.</p>';
            return;
        }

        torneosOrdenados = [...data.torneos].sort(
            (a, b) => new Date(b.fecha_fin) - new Date(a.fecha_fin)
        );

        slideActual = 0;
        renderSlider();

    } catch (err) {
        console.error(err);
        track.innerHTML = '<p class="standings-error">No se pudieron cargar las clasificaciones.</p>';
    }

}

function initStandingsSlider() {

    const track = document.querySelector('#slider-track');
    if (!track) return;

    cargarSlider();

    document.querySelector('#slider-prev').addEventListener('click', () => {
        if (slideActual > 0) {
            slideActual--;
            actualizarSlide();
        }
    });

    document.querySelector('#slider-next').addEventListener('click', () => {
        if (slideActual < torneosOrdenados.length - 1) {
            slideActual++;
            actualizarSlide();
        }
    });

}

//utils.js

/* ==========================================================
   UTILIDADES COMPARTIDAS
========================================================== */

function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha)) return '';
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

//app.js

document.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0);

    if (typeof initReveal === 'function') initReveal();
    if (typeof initSmoothScroll === 'function') initSmoothScroll();
    if (typeof initNavbar === 'function') initNavbar();
    if (typeof initLoginModal === 'function') initLoginModal();
    if (typeof initLogin === 'function') initLogin();
    if (typeof comprobarSesionActiva === 'function') comprobarSesionActiva();
    if (typeof initMemberView === 'function') initMemberView();
    if (typeof initIntro === 'function') initIntro();
    if (typeof initBackToTop === 'function') initBackToTop();
    if (typeof initAdmission === 'function') initAdmission();
    if (typeof initBroadcast === 'function') initBroadcast();
    if (typeof initStandingsSlider === 'function') initStandingsSlider();
});