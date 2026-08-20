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
    mostrarPantallaCarga();
    document.addEventListener('klub:mostrar-miembro', async () => {
        mostrarVistaMiembro(window.klubUsername);
        await cargarMisTorneos();
        await cargarMisDecks();
        await cargarEstadoTorneos();
        await cargarMisPendientes();
        await cargarTodasPartidas();
        initAgendarModal();
        initSessionErrorModal();
        ocultarPantallaCarga();
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
        const res = await fetch(`${AUTH_API_BASE}/api/mis-torneos?session=${token}`);
        const dataFinalizados = await res.json();
        const torneosFinalizados = dataFinalizados.torneos || [];
        if (res.status === 401 || res.status === 502) {
            showSessionErrorModal(); 
            return; // Salimos de la función, no seguimos renderizando
        }

        let todosLosTorneos = [];

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
                tieneDeck: false,
            });
        });

        if (!todosLosTorneos.length) {
            contenedor.innerHTML = '<p class="standings-error">Todavía no has jugado ningún torneo con nosotros.</p>';
            return;
        }

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
                            <button class="tab-btn" data-tab="deck">� Deck</button>
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
        Toast.error('Error al cargar tus torneos. Recarga la página.');
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
    mostrarPantallaCarga();
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
        container.innerHTML = '<p class="empty-state">Debes iniciar sesión.</p>';
        return;
    }

    container.innerHTML = '<p class="standings-loading">Cargando clasificación...</p>';

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/clasificacion-torneo?codigo=${codigo}&session=${token}`);
        if (res.status === 404) {
            container.innerHTML = '<p class="empty-state">Este torneo aún no tiene clasificación.</p>';
            return;
        }
        if (res.status === 401 || res.status === 502) {
            showSessionErrorModal(); 
            return; // Salimos de la función, no seguimos renderizando
        }
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

        let html = `<table><thead><tr><th>#</th><th>Jugador</th><th>Pts</th><th>W-L-D</th></tr></thead><tbody>`;
        const miDiscordId = window.klubDiscordId;
        clasificacion.forEach((j, i) => {
            let esMiFila = false;
            if (miDiscordId && j.discord_id === miDiscordId) {
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
        ocultarPantallaCarga();
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="standings-error">${err.message}</p>`;
        ocultarPantallaCarga();
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
        if (res.status === 401 || res.status === 502) {
            showSessionErrorModal(); 
            return; // Salimos de la función, no seguimos renderizando
        }
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

        let html = `<h4 style="margin:0 0 0.5rem 0;color:#fff;">� ${deck.nombre_deck}</h4>`;
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
    mostrarPantallaCarga();
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
        container.innerHTML = '<p class="empty-state">Debes iniciar sesión.</p>';
        return;
    }

    container.innerHTML = '<p class="standings-loading">Cargando enfrentamientos...</p>';

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/torneo-enfrentamientos?session=${token}&torneo=${codigo}`);
        if (res.status === 401 || res.status === 502) {
            showSessionErrorModal(); 
            return; // Salimos de la función, no seguimos renderizando
        }
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Error al cargar enfrentamientos');
        }

        const data = await res.json();
        const rondas = data.rondas || [];

        // ✅ CORREGIDO: Solo mostramos el mensaje de vacío si NO hay rondas en absoluto.
        // Si hay 1 ronda (aunque esté pendiente), la renderizamos para que el usuario vea su enfrentamiento.
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
                    // Calcular el estado y el texto
                    let estadoTexto = '⏳ Pendiente';
                    let estadoClase = 'estado-pendiente';

                    if (p.resultado) {
                        estadoTexto = p.resultado;
                        estadoClase = 'estado-completado';
                    } else if (p.agendada) {
                        estadoTexto = '📅 Agendada';
                        estadoClase = 'estado-agendada';
                    }

                    const miDiscordId = window.klubDiscordId;
                    const esMiPartida = (p.jugador1_id == miDiscordId || p.jugador2_id == miDiscordId);
                    let botonVerDeck = '';
                    if (esMiPartida) {
                        if (rivalId && rivalId !== 'null' && rivalId !== 'undefined' && r.completa) {
                            botonVerDeck = `
                                <button class="btn btn-sm btn-primary ver-deck-rival" 
                                    data-codigo="${codigo}"
                                    data-rival="${p.jugador1_id == miDiscordId? p.jugador2_id: p.jugador1_id}" 
                                    data-nombre="${p.jugador1_id == miDiscordId? p.jugador2: p.jugador1}">
                                    🎴 Ver deck 
                                </button>
                            `;
                        }
                        html += `
                            <li style="padding: 0.2rem 0; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                <span>
                                    ${p.jugador1} vs ${p.jugador2} — <strong class="${estadoClase}">${estadoTexto}</strong>
                                </span>
                                <span>
                                    ${botonVerDeck}
                                </span>
                            </li>
                        `;
                    }
                }
            });
            html += `
                    </ul>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;

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

        container.querySelectorAll('.ver-deck-rival').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const codigo = this.dataset.codigo;
                const rival = this.dataset.rival;
                const nombre = this.dataset.nombre;
                if (rival && rival !== 'null') {
                    verDeckRival(codigo, rival, nombre);
                }
            });
        });
    ocultarPantallaCarga();
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="standings-error">Error al cargar enfrentamientos: ${err.message}</p>`;
        ocultarPantallaCarga();
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
        if (res.status === 401 || res.status === 502) {
            showSessionErrorModal(); 
            return; // Salimos de la función, no seguimos renderizando
        }
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
            <h4>� ${deck.nombre || 'Deck sin nombre'}</h4>
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
    const submitBtn = form.querySelector('button[type="submit"]');

    const codigo = document.querySelector('#reporte-codigo').value;
    const jugador1_id = document.querySelector('#reporte-j1').value;
    const jugador2_id = document.querySelector('#reporte-j2').value;
    const resultado = document.querySelector('#reporte-resultado').value.trim();

    if (!resultado || !resultado.match(/^\d+-\d+$/)) {
        Toast.error('Formato incorrecto. Usa X-Y (ej: 2-1)');
        return;
    }

    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Reportando...';

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
        if (res.status === 401 || res.status === 502) {
            showSessionErrorModal(); 
            return; // Salimos de la función, no seguimos renderizando
        }
        if (!res.ok) throw new Error(data.error || 'Error al reportar');

        Toast.success(data.mensaje);
        setTimeout(() => {
            cerrarModalReporte();
            cargarMisPendientes();
        }, 1500);

    } catch (err) {
        console.error(err);
        Toast.error('Error al reportar el resultado. Verifica los datos.');
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
        if (res.status === 401 || res.status === 502) {
            showSessionErrorModal(); 
            return; // Salimos de la función, no seguimos renderizando
        }
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
        Toast.error('Error al cargar tus decks.');
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
        if (res.status === 401 || res.status === 502) {
            showSessionErrorModal(); 
            return; // Salimos de la función, no seguimos renderizando
        }
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
            const statusClass = estado === 'abierto' ? 'abierto' : 'desarrollo';
            const statusText = estado === 'abierto' ? '✅ Abierto' : '⚔️ En curso';
            const fecha = t.fecha_inicio || 'Sin fecha';
            const inscritos = `${t.total_inscritos || 0}/${t.total_maximo || '∞'}`;
            const bannerClass = estado === 'abierto' ? 'torneo-abierto' : 'torneo-desarrollo';

            const toggleHtml = `
                <button class="mi-torneo-toggle banner-toggle" aria-label="Ver más" data-torneo="${t.codigo}">
                    <svg class="icon-arrow-down" viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                    </svg>
                </button>
            `;

            html += `
                <div class="torneo-banner ${bannerClass}" data-torneo="${t.codigo}" data-puede-editar="${puedeEditar}" data-tiene-deck="${tieneDeck}" data-inscrito="${inscrito}" data-estado="${estado}">
                    <div class="torneo-banner-header">
                        <div class="torneo-banner-info">
                            <h3>${t.nombre}</h3>
                            <span class="torneo-banner-status ${statusClass}">${statusText}</span>
                            ${tieneDeck ? `<span class="torneo-banner-deck-status">🎴</span>` : ''}
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
        Toast.error('Error al cargar el estado de los torneos.');
    }
}

async function inscribirseEnTorneo(codigoTorneo, btn) {
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
        Toast.error('No hay sesión activa.');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Inscribiendo...';

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/inscribirse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session: token, codigo_torneo: codigoTorneo })
        });

        const data = await res.json();
        if (res.status === 401 || res.status === 502) {
            showSessionErrorModal(); 
            return; // Salimos de la función, no seguimos renderizando
        }
        if (!res.ok) throw new Error(data.error || 'Error al inscribirse');

        Toast.success(data.mensaje || '✅ Inscripción completada');
        cargarEstadoTorneos();

    } catch (err) {
        console.error(err);
        Toast.error('No se pudo completar la inscripción. Inténtalo de nuevo.');
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

async function cargarArquetipos(seleccionado = null) {
    const select = document.querySelector('#deck-archetype');
    if (!select) return;

    select.innerHTML = '<option value="">Cargando arquetipos...</option>';

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/arquetipos`);
        if (res.status === 401 || res.status === 502) {
            showSessionErrorModal(); 
            return; // Salimos de la función, no seguimos renderizando
        }
        if (!res.ok) throw new Error('Error al cargar arquetipos');
        const data = await res.json();
        const arquetipos = data.arquetipos || [];

        select.innerHTML = '';
        if (!arquetipos.length) {
            select.innerHTML = '<option value="">No hay arquetipos disponibles</option>';
            return;
        }

        arquetipos.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a;
            opt.textContent = a;
            if (seleccionado && a === seleccionado) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });

        if (seleccionado) {
            select.value = seleccionado;
        }
    } catch (err) {
        console.error('Error cargando arquetipos:', err);
        select.innerHTML = '<option value="">Error al cargar arquetipos</option>';
    }
}

function initSubirDeckForm() {
    const form = document.querySelector('#subir-deck-form');
    const submitBtn = document.querySelector('#subir-deck-submit');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!token) {
            Toast.error('No hay sesión activa.');
            return;
        }

        const payload = {
            session: token,
            codigo_torneo: form.codigo_torneo.value.trim(),
            nombre_deck: form.nombre_deck.value.trim(),
            archetype: form.archetype.value.trim(),
            decklist: form.decklist.value.trim(),
            sideboard: form.sideboard.value.trim(),
        };

        if (!payload.codigo_torneo || !payload.nombre_deck || !payload.archetype || !payload.decklist) {
            Toast.error('Rellena todos los campos obligatorios.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

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

            Toast.success(esEdicion ? 'Deck actualizado correctamente.' : 'Deck subido correctamente.');

            delete form.dataset.edicion;
            delete form.dataset.codigoDeck;
            submitBtn.textContent = 'Subir Deck';

            setTimeout(() => {
                cerrarDeckModal();
                cargarMisDecks();
                cargarEstadoTorneos();
            }, 1200);

        } catch (err) {
            console.error(err);
            Toast.error('Error al guardar el deck. Revisa los datos.');
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
        if (res.status === 401 || res.status === 502) {
            showSessionErrorModal(); 
            return; // Salimos de la función, no seguimos renderizando
        }
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
            const esMiPartida = (p.jugador1_id == window.klubDiscordId || p.jugador2_id == window.klubDiscordId);
            let accionesHtml = '';
            if (esMiPartida) {
                accionesHtml = `
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
                `;
            } else {
                accionesHtml = `<span style="color: var(--muted); font-size:0.8rem;"></span>`;
            }

            html += `
                <tr>
                    <td><strong>${p.fecha}</strong></td>
                    <td>${p.hora}</td>
                    <td>${p.jugador1}</td>
                    <td>${p.jugador2}</td>
                    <td>${accionesHtml}</td>
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
        contenedor.querySelectorAll('.eliminar-partida-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const fecha = this.dataset.fecha;
                const hora = this.dataset.hora;
                const j1 = this.dataset.j1;
                const j2 = this.dataset.j2;
                const nombre1 = this.dataset.nombre1;
                const nombre2 = this.dataset.nombre2;
              
                eliminarPartida(fecha, hora, j1, j2);
                
            });
        });

    } catch (err) {
        console.error(err);
        contenedor.innerHTML = `<p class="standings-error">Error al cargar partidas: ${err.message}</p>`;
        Toast.error('Error al cargar el listado de partidas.');
    }
}

// ==========================================================
// 15. PARTIDAS PENDIENTES (clickeables para reportar)
// ==========================================================

async function cargarMisPendientes() {
    const contenedor = document.querySelector('#mis-pendientes-container');
    if (!contenedor) return;

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
        if (res.status === 401 || res.status === 502) {
            showSessionErrorModal(); 
            return; // Salimos de la función, no seguimos renderizando
        }
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Error al cargar pendientes');
        }
        const data = await res.json();
        const torneos = data.torneos || [];

        const miDiscordId = window.klubDiscordId;

        const misTorneos = torneos.map(t => {
            const misPendientes = t.pendientes.filter(p => 
                p.jugador1_id == miDiscordId || p.jugador2_id == miDiscordId
            );
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
                    <h4>${t.nombre} — Ronda ${t.ronda}</h4>
                    <div class="partidas-table-wrap">
                        <table class="partidas-table pendientes-table">
                            <thead>
                                <tr>
                                    <th>Jugador 1</th>
                                    <th>Jugador 2</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            t.pendientes.forEach(p => {
                const estaAgendada = p.agendada || false;
                const estado = estaAgendada ? '✅ Agendada' : '⏳ Pendiente';
                const botonAgendar = !estaAgendada ? `
                    <button class="btn btn-sm btn-primary agendar-pendiente" 
                            data-codigo="${t.codigo}" 
                            data-j1="${p.jugador1_id}" 
                            data-j2="${p.jugador2_id}" 
                            data-nombre1="${p.jugador1}" 
                            data-nombre2="${p.jugador2}"
                            data-ronda="${t.ronda}">
                        Agendar
                    </button>
                ` : '';

                if (p.jugador2 === 'BYE') {
                    html += `
                        <tr>
                            <td>${p.jugador1}</td>
                            <td>BYE</td>
                            <td><span style="color: var(--muted);">—</span></td>
                            <td>—</td>
                        </tr>
                    `;
                } else {
                    html += `
                        <tr>
                            <td>${p.jugador1}</td>
                            <td>${p.jugador2}</td>
                            <td>${estado}</td>
                            <td>
                                ${botonAgendar}
                                <button class="btn btn-sm btn-success reportar-pendiente" 
                                        data-codigo="${t.codigo}" 
                                        data-j1="${p.jugador1_id}" 
                                        data-j2="${p.jugador2_id}" 
                                        data-nombre1="${p.jugador1}" 
                                        data-nombre2="${p.jugador2}"
                                        data-ronda="${t.ronda}">
                                    Reportar
                                </button>
                            </td>
                        </tr>
                    `;
                }
            });
            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });

        contenedor.innerHTML = html;

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
        Toast.error('Error al cargar tus partidas pendientes.');
    } finally {
        window._cargandoPendientes = false;
    }
}

// ==========================================================
// 17. FUNCIONES GLOBALES PARA ONCLICK
// ==========================================================

async function desinscribirse(codigo) {
    const confirmado = await Confirm.show(`¿Quieres desinscribirte del torneo ${codigo}?`, 'Desinscripción');
    if (!confirmado) return;

    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
        Toast.error('No hay sesión activa.');
        return;
    }

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/desinscribirse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session: token, codigo_torneo: codigo })
        });
        const data = await res.json();
        if (res.status === 401 || res.status === 502) {
            showSessionErrorModal(); 
            return; // Salimos de la función, no seguimos renderizando
        }
        if (data.ok) {
            Toast.success(data.mensaje);
            cargarEstadoTorneos();
        } else {
            Toast.error('Error al desinscribirte del torneo.');
        }
    } catch (error) {
        console.error(error);
        Toast.error('Error al desinscribirte del torneo.');
    }
}

async function toggleDeckDisplay(codigo, btn) {
    const banner = btn.closest('.torneo-banner');
    const deckDisplay = banner.querySelector('.deck-display');
    if (!deckDisplay) return;

    if (deckDisplay.style.display === 'block') {
        deckDisplay.style.display = 'none';
        btn.textContent = 'Ver deck';
        return;
    }

    deckDisplay.style.display = 'block';
    btn.textContent = 'Ocultar deck';
    deckDisplay.innerHTML = '<p class="standings-loading">Cargando deck...</p>';

    try {
        const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
        const res = await fetch(`${AUTH_API_BASE}/api/mis-decks?session=${token}`);
        const data = await res.json();
        if (res.status === 401 || res.status === 502) {
            showSessionErrorModal(); 
            return; // Salimos de la función, no seguimos renderizando
        }
        if (!res.ok) throw new Error('Error al cargar decks');

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
                <h4>� ${deck.nombre_deck}</h4>
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

async function abrirDeckModal(codigoTorneo = null) {
    const modal = document.querySelector('#deck-modal');
    if (!modal) return;

    const form = document.querySelector('#subir-deck-form');
    const submitBtn = document.querySelector('#subir-deck-submit');
    const toggleBtn = document.querySelector('#deck-modal-title');

    // Resetear los datasets de edición antes de abrir
    delete form.dataset.edicion;
    delete form.dataset.codigoDeck;

    if (!codigoTorneo) {
        modal.hidden = false;
        document.body.classList.add('no-scroll');
        cargarTorneosDisponibles();
        cargarArquetipos();
        if (toggleBtn) toggleBtn.textContent = '+ Subir nuevo deck';
        return;
    }

    modal.hidden = false;
    document.body.classList.add('no-scroll');
    
    await cargarTorneosDisponibles(codigoTorneo);
    await cargarArquetipos();

    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
        Toast.error('No hay sesión activa.');
        return;
    }

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/mis-decks?session=${token}`);
        if (res.status === 401 || res.status === 502) {
            showSessionErrorModal(); 
            return; // Salimos de la función, no seguimos renderizando
        }
        if (!res.ok) throw new Error('Error al obtener tus decks');
        const data = await res.json();
        const decks = data.decks || [];

        let deck = decks.find(d => d.codigo_torneo === codigoTorneo);
        if (!deck) {
            deck = decks.find(d => d.codigo_deck && d.codigo_deck.startsWith(codigoTorneo + '_'));
        }

        if (deck) {
            // 1. Rellenar los datos en el formulario
            document.querySelector('#deck-nombre').value = deck.nombre_deck || '';
            document.querySelector('#deck-archetype').value = deck.archetype || '';
            document.querySelector('#deck-decklist').value = deck.decklist || '';
            document.querySelector('#deck-sideboard').value = deck.sideboard || '';

            // 2. ✅ ESTO ES LO QUE FALTABA: Marcar el formulario como edición y pasar el ID
            form.dataset.edicion = 'true';
            form.dataset.codigoDeck = deck.codigo_deck; // Asegúrate de que 'codigo_deck' sea el campo correcto en tu backend
            if (toggleBtn) toggleBtn.textContent = '✏️ Editar deck';
            // 3. Cambiar el botón a "Actualizar Deck"
            if (submitBtn) submitBtn.textContent = 'Actualizar Deck';
        } else {
            // Modo creación (no tiene deck)
            if (submitBtn) submitBtn.textContent = 'Subir Deck';
             if (toggleBtn) toggleBtn.textContent = '+ Subir nuevo deck';
        }

        const select = document.querySelector('#deck-torneo');
        if (select) select.value = codigoTorneo;

    } catch (err) {
        console.error(err);
        Toast.error('Error al cargar tu deck. Por favor, recarga la página.');
    }
}

async function cargarTorneosDisponibles(seleccionado = null) {
    const select = document.querySelector('#deck-torneo');
    if (!select) return;

    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
        select.innerHTML = '<option value="">No hay sesión</option>';
        return;
    }

    select.innerHTML = '<option value="">Cargando torneos...</option>';

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/torneos-disponibles?session=${token}`);
        if (res.status === 401 || res.status === 502) {
            showSessionErrorModal(); 
            return; // Salimos de la función, no seguimos renderizando
        }
        if (!res.ok) throw new Error('Error al cargar torneos');
        const data = await res.json();
        const torneos = data.torneos || [];

        select.innerHTML = '';
        if (!torneos.length) {
            select.innerHTML = '<option value="">No estás inscrito en ningún torneo</option>';
            return;
        }

        torneos.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.codigo;
            const nombreMostrado = t.nombre;
            opt.textContent = nombreMostrado;
            if (seleccionado && t.codigo === seleccionado) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });

        if (seleccionado) {
            select.value = seleccionado;
        }
    } catch (err) {
        console.error('Error cargando torneos:', err);
        select.innerHTML = '<option value="">Error al cargar torneos</option>';
        Toast.error('Error al cargar la lista de torneos.');
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
        if (estado === 'en desarrollo') {
            const rondaActual = '?'; 

            const panelHtml = `
                <div class="mi-torneo-panel mi-torneo-panel-desarrollo">
                    <div class="mi-torneo-panel-header">
                        <span class="badge-en-curso">⚔️ Torneo en curso</span>
                        <span style="color: var(--muted); font-size: 0.8rem;">Ronda ${rondaActual}</span>
                    </div>
                    <div class="mi-torneo-tabs">
                        <button class="tab-btn active" data-tab="clasificacion">📊 Clasificación</button>
                        <button class="tab-btn" data-tab="deck">� Deck</button>
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

            if (contentDivClasificacion) {
                await cargarClasificacionEnPanel(codigoTorneo, contentDivClasificacion);
            }

            panel.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const tab = this.dataset.tab;
                    panel.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    panel.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    const target = panel.querySelector(`.tab-content[data-tab="${tab}"]`);
                    if (target) target.classList.add('active');

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

            return;
        }

        const res = await fetch(`${AUTH_API_BASE}/api/mis-decks?session=${token}`);
        if (res.status === 401 || res.status === 502) {
            showSessionErrorModal(); 
            return; // Salimos de la función, no seguimos renderizando
        }
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

        if(estado !== 'en desarrollo'){
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
        }

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
                    <h4>� ${deck.nombre_deck}</h4>
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
        Toast.error('Error al cargar el panel del torneo.');
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

    modal.querySelector('.agendar-codigo').textContent = codigo || '';
    modal.querySelector('.agendar-j1').textContent = nombre1;
    modal.querySelector('.agendar-j2').textContent = nombre2;
    modal.querySelector('.agendar-ronda').textContent = ronda || '';
    document.querySelector('#agendar-codigo').value = codigo || '';
    document.querySelector('#agendar-j1').value = j1;
    document.querySelector('#agendar-j2').value = j2;

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
    const submitBtn = form.querySelector('button[type="submit"]');

    const codigo = document.querySelector('#agendar-codigo').value;
    const jugador1_id = document.querySelector('#agendar-j1').value;
    const jugador2_id = document.querySelector('#agendar-j2').value;
    const fecha = document.querySelector('#agendar-fecha').value.trim();
    const hora = document.querySelector('#agendar-hora').value.trim();
    const modo = document.querySelector('#agendar-modo').value;
    const fecha_actual = document.querySelector('#agendar-fecha-actual').value;
    const hora_actual = document.querySelector('#agendar-hora-actual').value;

    if (!fecha || !fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        Toast.error('Fecha inválida. Usa DD/MM/YYYY.');
        return;
    }
    if (!hora || !hora.match(/^\d{2}:\d{2}$/)) {
        Toast.error('Hora inválida. Usa HH:MM.');
        return;
    }

    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
        Toast.error('No hay sesión activa.');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = modo === 'editar' ? 'Guardando...' : 'Agendando...';

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

        Toast.success(data.mensaje);
        setTimeout(() => {
            cerrarModalAgendar();
            cargarTodasPartidas();
        }, 1500);

    } catch (err) {
        console.error(err);
        Toast.error('Error al agendar la partida. Inténtalo de nuevo.');
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
    if (!confirm(`¿Eliminar la partida del ${fecha} a las ${hora}?`)) return;

    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
        Toast.error('No hay sesión activa.');
        return;
    }

    try {
        const res = await fetch(`${AUTH_API_BASE}/api/eliminar-partida`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session: token,
                jugador1_id: j1,
                jugador2_id: j2,
                fecha: fecha,
                hora: hora
            })
        });
        const data = await res.json();
        if (res.status === 401 || res.status === 502) {
            showSessionErrorModal(); 
            return; // Salimos de la función, no seguimos renderizando
        }
        if (!res.ok) throw new Error(data.error || 'Error al eliminar');

        Toast.success(data.mensaje);
        cargarTodasPartidas();
    } catch (err) {
        console.error(err);
        Toast.error('Error al eliminar la partida.');
    }
}
// ==========================================================
// MODAL DE ERROR DE CARGA (401 / 502)
// ==========================================================

function initSessionErrorModal() {
    const modal = document.querySelector('#session-error-modal');
    if (!modal) return;

    const acceptBtn = modal.querySelector('#session-error-accept');
    const backdrop = modal.querySelector('[data-close-session-error]');

    // Función que ejecuta la limpieza total y el cambio de vistas
    const limpiarYSalir = () => {
        // 1. Limpiar TODOS los datos de sesión
        sessionStorage.clear();
        window.klubUsername = null;
        window.klubDiscordId = null;

        // 2. Ocultar la vista de miembro y mostrar la pública
        const publicView = document.querySelector('#public-view');
        const memberView = document.querySelector('#member-view');
        if (publicView) publicView.hidden = false;
        if (memberView) memberView.hidden = true;

        // 3. Cerrar el modal y quitar el bloqueo de scroll
        modal.hidden = true;
        document.body.classList.remove('no-scroll');

        // 4. Aviso opcional (para que sepan que han salido)
        Toast.info('Sesión cerrada por seguridad. Vuelve a iniciar cuando quieras.');
    };

    if (acceptBtn) acceptBtn.addEventListener('click', limpiarYSalir);
    if (backdrop) backdrop.addEventListener('click', limpiarYSalir);

    // Cerrar también con la tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) {
            limpiarYSalir();
        }
    });
}

// Función pública para mostrar el modal desde cualquier parte
function showSessionErrorModal() {
    const modal = document.querySelector('#session-error-modal');
    if (!modal) return;

    modal.hidden = false;
    document.body.classList.add('no-scroll');
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
window.cargarTorneosDisponibles = cargarTorneosDisponibles;