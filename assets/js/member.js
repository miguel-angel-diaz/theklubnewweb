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

async function cargarMisTorneos() {

    const contenedor = document.querySelector('#mis-torneos-lista');
    if (!contenedor) return;

    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) return;

    if (typeof DEV_MODE_FAKE_LOGIN !== 'undefined' && DEV_MODE_FAKE_LOGIN && token === 'dev-fake-session-token') {
        contenedor.innerHTML = `
            <div class="mi-torneo-card">
                <div class="mi-torneo-rank">#1</div>
                <div class="mi-torneo-info">
                    <h3>Torneo de Prueba (datos simulados)</h3>
                    <p>3-1-0 · 9 pts · de 12 jugadores</p>
                </div>
            </div>
        `;
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
            <div class="mi-torneo-card">
                <div class="mi-torneo-rank">#${t.rank}</div>
                <div class="mi-torneo-info">
                    <h3>${t.torneo_nombre}</h3>
                    <p>${t.wins}-${t.losses}-${t.draws} · ${t.mp} pts · de ${t.total_participantes} jugadores</p>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error(err);
        contenedor.innerHTML = '<p class="standings-error">No se pudieron cargar tus torneos.</p>';
    }

}

function initLogout() {

    const btn = document.querySelector('#logout-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        cerrarSesion(); // definida en auth.js
    });

}

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
    initDeckModal();       // NUEVO — sustituye la vieja lógica del toggleBtn suelto
    initSubirDeckForm();

}

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

        // Sin torneos activos en absoluto — banner informativo, no vacío
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

                    const codigoTorneo = e.currentTarget.dataset.torneoCodigo;

                    document.querySelector('[data-member-tab="decks"]').click();
                    abrirDeckModal(codigoTorneo);

                });
            } else {
                // Inscrito en todo, con deck subido en todo — todo al día
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

        cargarEstadoTorneos(); // refresca el banner (ahora ya inscrito, quizás sugiere subir deck)

    } catch (err) {
        alert(err.message || 'No se pudo completar la inscripción');
        btn.disabled = false;
        btn.textContent = 'Apuntarme';
    }

}

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