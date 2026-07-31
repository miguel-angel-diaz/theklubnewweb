// ==========================================================
// 1. VISTA MIEMBRO — mostrar/ocultar
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
// 2. TABS PRINCIPALES (Mis torneos, Mis decks, etc.)
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
    });

    document.addEventListener('klub:logout', () => {
        mostrarVistaPublica();
    });

    initMemberTabs();
    initLogout();
    initDeckModal();
    initSubirDeckForm();
    // Los menús de torneos se inicializan dentro de cargarMisTorneos()
}

// ==========================================================
// 5. CARGAR MIS TORNEOS (con panel expandible)
// ==========================================================

async function cargarMisTorneos() {
    const contenedor = document.querySelector('#mis-torneos-lista');
    if (!contenedor) return;

    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) return;

    // Modo desarrollo
    if (typeof DEV_MODE_FAKE_LOGIN !== 'undefined' && DEV_MODE_FAKE_LOGIN && token === 'dev-fake-session-token') {
        contenedor.innerHTML = `
            <div class="mi-torneo-card" data-torneo-codigo="demo">
                <div class="mi-torneo-rank">#1</div>
                <div class="mi-torneo-info">
                    <h3>Torneo de Prueba (datos simulados)</h3>
                    <p>3-1-0 · 9 pts · de 12 jugadores</p>
                </div>
                <div class="mi-torneo-actions">
                    <button class="mi-torneo-toggle" aria-label="Ver más">
                        <svg class="icon-arrow-down" viewBox="0 0 24 24" width="24" height="24">
                            <path d="M7 10l5 5 5-5z"/>
                        </svg>
                    </button>
                </div>
                <div class="mi-torneo-panel">
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
        initTorneoMenus();
        return;
    }

    contenedor.innerHTML = '<p class="standings-loading">Cargando tus resultados...</p>';

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/mis-torneos?session=${token}`);
        const data = await res.json();

        if (!res.ok || !data.torneos || !data.torneos.length) {
            contenedor.innerHTML = '<p class="standings-error">Todavía no has jugado ningún torneo con nosotros.</p>';
            return;
        }

        contenedor.innerHTML = data.torneos.map(t => `
            <div class="mi-torneo-card" data-torneo-codigo="${t.torneo_codigo}">
                <div class="mi-torneo-rank">#${t.rank}</div>
                <div class="mi-torneo-info">
                    <h3>${t.torneo_nombre}</h3>
                    <p>${t.wins}-${t.losses}-${t.draws} · ${t.mp} pts · de ${t.total_participantes} jugadores</p>
                </div>
                <div class="mi-torneo-actions">
                    <button class="mi-torneo-toggle" aria-label="Ver más">
                        <svg class="icon-arrow-down" viewBox="0 0 24 24" width="24" height="24">
                            <path d="M7 10l5 5 5-5z"/>
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
        `).join('');

        // Inicializar eventos de los menús
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

    // Eliminar event listeners antiguos para evitar duplicados
    lista.removeEventListener('click', handleTorneoClick);
    lista.addEventListener('click', handleTorneoClick);
}

async function handleTorneoClick(e) {
    // 1. Botón toggle (flecha)
    const toggle = e.target.closest('.mi-torneo-toggle');
    if (toggle) {
        const card = toggle.closest('.mi-torneo-card');
        const panel = card.querySelector('.mi-torneo-panel');
        const isExpanded = panel.style.display === 'block';

        // Cerrar otros paneles
        document.querySelectorAll('.mi-torneo-panel').forEach(p => p.style.display = 'none');
        document.querySelectorAll('.mi-torneo-card').forEach(c => c.classList.remove('expanded'));
        document.querySelectorAll('.mi-torneo-toggle').forEach(t => t.classList.remove('open'));

        if (!isExpanded) {
            panel.style.display = 'block';
            card.classList.add('expanded');
            toggle.classList.add('open');
            // Cargar la pestaña activa (clasificación por defecto)
            const activeTab = card.querySelector('.tab-btn.active');
            if (activeTab) {
                await cargarContenidoTab(card, activeTab.dataset.tab);
            }
        }
        e.preventDefault();
        return;
    }

    // 2. Clic en pestañas
    const tabBtn = e.target.closest('.tab-btn');
    if (tabBtn) {
        const card = tabBtn.closest('.mi-torneo-card');
        const tab = tabBtn.dataset.tab;

        // Cambiar pestaña activa
        card.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        tabBtn.classList.add('active');

        card.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        const targetContent = card.querySelector(`.tab-content[data-tab="${tab}"]`);
        if (targetContent) targetContent.classList.add('active');

        // Cargar contenido
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
    try {
        const res = await fetch(`${AUTH_API_BASE}/api/torneos`);
        if (!res.ok) throw new Error('Error al obtener torneos');
        const data = await res.json();
        const torneo = data.torneos.find(t => t.codigo === codigo);
        if (!torneo || !torneo.clasificacion || !torneo.clasificacion.length) {
            container.innerHTML = '<p class="empty-state">No hay clasificación disponible.</p>';
            return;
        }

        const miDiscordId = window.klubDiscordId || null;
        const miUsername = window.klubUsername || null;

        // Depuración: mostrar IDs en consola
        console.log('🔍 Mi Discord ID:', miDiscordId);
        console.log('🔍 Mi Username:', miUsername);
        console.log('📊 Clasificación:', torneo.clasificacion);

        let html = `<table><thead><tr><th>#</th><th>Jugador</th><th>Pts</th><th>W-L-D</th></tr></thead><tbody>`;
        torneo.clasificacion.forEach((j, i) => {
            // Comparar por discord_id o por nombre (fallback)
            let esMiFila = false;
            if (miDiscordId && j.discord_id === miDiscordId) {
                esMiFila = true;
            } else if (miUsername && j.nombre.toLowerCase().includes(miUsername.toLowerCase())) {
                esMiFila = true;
            }
            const claseFila = esMiFila ? 'mi-fila' : '';
            html += `<tr class="${claseFila}">
                <td>${i+1}</td>
                <td>${esMiFila ? '⭐ ' : ''}${j.nombre}${esMiFila ? ' ⭐' : ''}</td>
                <td>${j.mp}</td>
                <td>${j.wins}-${j.losses}-${j.draws}</td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="empty-state">Error al cargar clasificación.</p>';
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

        // Depuración: mostrar decks recibidos
        console.log('📦 Decks recibidos:', data.decks);
        console.log('🔍 Buscando deck para torneo (codigo):', codigo);

        // 1. Búsqueda por codigo_torneo exacto
        let deck = data.decks.find(d => d.codigo_torneo === codigo);

        // 2. Si no, buscar por codigo_deck que empiece con el código (formato: codigo_torneo_<id>)
        if (!deck) {
            deck = data.decks.find(d => d.codigo_deck && d.codigo_deck.startsWith(codigo + '_'));
        }

        // 3. Si aún no, buscar por codigo_torneo que contenga el código (más flexible)
        if (!deck) {
            deck = data.decks.find(d => d.codigo_torneo && d.codigo_torneo.includes(codigo));
        }

        // 4. Último intento: buscar en el nombre del deck o en el torneo (por si el código está en otro campo)
        if (!deck) {
            deck = data.decks.find(d => {
                const txt = (d.nombre_deck + ' ' + (d.codigo_torneo || '') + ' ' + (d.codigo_deck || '')).toLowerCase();
                return txt.includes(codigo.toLowerCase());
            });
        }

        console.log('🎯 Deck encontrado:', deck);

        if (!deck) {
            // Mostrar mensaje de ayuda con los códigos disponibles
            const codigosDisponibles = data.decks.map(d => d.codigo_torneo || d.codigo_deck || 'sin código').join(', ');
            container.innerHTML = `
                <p class="empty-state">No has subido deck para este torneo.</p>
                <p style="font-size:.85rem; color:var(--muted);">Códigos de tus decks: ${codigosDisponibles}</p>
                <p style="font-size:.75rem; color:var(--muted);">Asegúrate de que el deck esté vinculado al torneo <strong>${codigo}</strong>.</p>
            `;
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
// 7c. Enfrentamientos (próximamente)
// ------------------------------------------------------------
async function cargarEnfrentamientosEnPanel(codigo, container) {
    // Por ahora, mensaje informativo
    container.innerHTML = `
        <p class="empty-state">⚔️ Próximamente podrás ver aquí tus enfrentamientos ronda a ronda.</p>
        <p style="font-size:.85rem; color:var(--muted);">(Esta funcionalidad está en desarrollo)</p>
    `;

    // Cuando tengas el endpoint, descomenta esto:
    /*
    try {
        const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!token) {
            container.innerHTML = '<p class="empty-state">Debes iniciar sesión.</p>';
            return;
        }
        const res = await fetch(`${AUTH_API_BASE}/api/mis-enfrentamientos?session=${token}&torneo=${codigo}`);
        if (!res.ok) throw new Error('Error al obtener enfrentamientos');
        const data = await res.json();
        if (!data.enfrentamientos || !data.enfrentamientos.length) {
            container.innerHTML = '<p class="empty-state">No hay enfrentamientos registrados para ti.</p>';
            return;
        }
        let html = `<table><thead><tr><th>Ronda</th><th>Oponente</th><th>Resultado</th></tr></thead><tbody>`;
        data.enfrentamientos.forEach(e => {
            html += `<tr><td>${e.ronda}</td><td>${e.oponente}</td><td>${e.resultado}</td></tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="empty-state">Error al cargar enfrentamientos.</p>';
    }
    */
}

// ==========================================================
// 8. MODAL (para otros usos, se mantiene)
// ==========================================================

function mostrarModal(contenidoHTML) {
    const oldModal = document.querySelector('.modal-overlay');
    if (oldModal) oldModal.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" aria-label="Cerrar">&times;</button>
            <div class="modal-body">${contenidoHTML}</div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
    document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', handler);
        }
    });
}

// ==========================================================
// 9. CARGAR MIS DECKS
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
// 10. BANNER DE TORNEOS ACTIVOS
// ==========================================================

async function cargarEstadoTorneos() {
    const contenedor = document.querySelector('#torneo-banner-container');
    if (!contenedor) return;

    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) return;

    if (typeof DEV_MODE_FAKE_LOGIN !== 'undefined' && DEV_MODE_FAKE_LOGIN && token === 'dev-fake-session-token') {
        contenedor.innerHTML = `
            <div class="torneo-banner">
                <div class="torneo-banner-text">
                    <h3>Hay un torneo activo: Torneo de Prueba</h3>
                    <p>Todavía no estás inscrito. ¡No te lo pierdas!</p>
                </div>
                <div class="torneo-banner-actions">
                    <button class="btn btn-primary" data-inscribir="premoderntest_DEMO">Apuntarme</button>
                </div>
            </div>
        `;
        return;
    }

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/estado-torneos?session=${token}`);
        const data = await res.json();

        if (!res.ok) {
            contenedor.innerHTML = '';
            return;
        }

        const torneos = data.torneos || [];

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

        const noInscritos = torneos.filter(t => !t.inscrito);

        if (!noInscritos.length) {
            const sinDeck = torneos.find(t => t.inscrito && !t.deck_subido);
            if (sinDeck) {
                contenedor.innerHTML = `
                    <div class="torneo-banner">
                        <div class="torneo-banner-text">
                            <h3>Estás inscrito en ${sinDeck.codigo}</h3>
                            <p>Todavía no has subido tu deck para este torneo.</p>
                        </div>
                        <div class="torneo-banner-actions">
                            <button class="btn btn-primary" data-ir-a-decks>Subir deck</button>
                        </div>
                    </div>
                `;
                contenedor.querySelector('[data-ir-a-decks]').addEventListener('click', (e) => {
                    document.querySelector('[data-member-tab="decks"]').click();
                    abrirDeckModal();
                });
            } else {
                contenedor.innerHTML = `
                    <div class="torneo-banner torneo-banner-quiet">
                        <div class="torneo-banner-text">
                            <h3>Todo al día</h3>
                            <p>Estás inscrito en todos los torneos activos y tienes tu deck subido.</p>
                        </div>
                    </div>
                `;
            }
            return;
        }

        contenedor.innerHTML = noInscritos.map(t => `
            <div class="torneo-banner">
                <div class="torneo-banner-text">
                    <h3>Hay un torneo activo: ${t.codigo}</h3>
                    <p>
                        Todavía no estás inscrito.
                        ${t.plazas_restantes !== null ? `Quedan ${t.plazas_restantes} plazas.` : ''}
                    </p>
                </div>
                <div class="torneo-banner-actions">
                    <button class="btn btn-primary" data-inscribir="${t.codigo}">Apuntarme</button>
                </div>
            </div>
        `).join('');

        contenedor.querySelectorAll('[data-inscribir]').forEach(btn => {
            btn.addEventListener('click', () => inscribirseEnTorneo(btn.dataset.inscribir, btn));
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

        cargarEstadoTorneos(); // refresca el banner

    } catch (err) {
        alert(err.message || 'No se pudo completar la inscripción');
        btn.disabled = false;
        btn.textContent = 'Apuntarme';
    }
}

// ==========================================================
// 11. MODAL PARA SUBIR DECK
// ==========================================================

function abrirDeckModal(codigoPreseleccionado = null) {
    const modal = document.querySelector('#deck-modal');
    if (!modal) return;

    modal.hidden = false;
    document.body.classList.add('no-scroll');

    cargarTorneosDisponibles(codigoPreseleccionado);
    cargarArquetipos();
}

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

async function cargarTorneosDisponibles(codigoPreseleccionado = null) {
    const select = document.querySelector('#deck-torneo');
    if (!select) return;

    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) return;

    select.innerHTML = '<option value="">Cargando torneos...</option>';

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/torneos-disponibles?session=${token}`);
        const data = await res.json();

        if (!res.ok || !data.torneos || !data.torneos.length) {
            select.innerHTML = '<option value="">No hay torneos disponibles ahora mismo</option>';
            return;
        }

        select.innerHTML = '<option value="">Selecciona un torneo</option>' +
            data.torneos.map(t => `<option value="${t.codigo}">${t.nombre}</option>`).join('');

        if (codigoPreseleccionado) {
            select.value = codigoPreseleccionado;
        }

    } catch (err) {
        console.error(err);
        select.innerHTML = '<option value="">Error al cargar torneos</option>';
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
        if (!token) return;

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
        submitBtn.textContent = 'Subiendo...';
        status.textContent = '';
        status.className = 'form-status';

        try {
            const res = await fetch(`${AUTH_API_BASE}/api/subir-deck`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                let mensaje = data.error || 'Error al subir el deck';
                if (data.sugerencias && data.sugerencias.length) {
                    mensaje += ` — ¿quisiste decir: ${data.sugerencias.join(', ')}?`;
                }
                throw new Error(mensaje);
            }

            status.textContent = '¡Deck subido con éxito!';
            status.className = 'form-status success';

            setTimeout(() => {
                cerrarDeckModal();
                cargarMisDecks();
            }, 1200);

        } catch (err) {
            status.textContent = err.message;
            status.className = 'form-status error';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Subir Deck';
        }
    });
}