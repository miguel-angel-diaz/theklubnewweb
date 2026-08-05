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