const PODCAST_API = 'https://mydiscordbot-production-3e6a.up.railway.app/api/podcast';
const ARTICULOS_API = 'https://mydiscordbot-production-3e6a.up.railway.app/api/articulos';

function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha)) return '';
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function cargarEpisodios() {
    const contenedor = document.querySelector('#podcast-episodios');

    try {
        const res = await fetch(PODCAST_API);
        const data = await res.json();

        if (data.error || !data.episodios.length) {
            contenedor.innerHTML = '<p class="standings-error">No se pudieron cargar los episodios.</p>';
            return;
        }

        contenedor.innerHTML = data.episodios.map(ep => `
            <a href="${ep.enlace}" target="_blank" class="episode-card" data-reveal="left">
                ${ep.imagen ? `<img src="${ep.imagen}" alt="${ep.titulo}">` : ''}
                <h3>${ep.titulo}</h3>
                <p>${ep.descripcion}...</p>
                <span class="card-date">${formatearFecha(ep.fecha)}</span>
            </a>
        `).join('');

    } catch (err) {
        console.error(err);
        contenedor.innerHTML = '<p class="standings-error">No se pudieron cargar los episodios.</p>';
    }
}

async function cargarArticulos() {
    const contenedor = document.querySelector('#articulos-lista');

    try {
        const res = await fetch(ARTICULOS_API);
        const data = await res.json();

        if (data.error || !data.articulos.length) {
            contenedor.innerHTML = '<p class="standings-error">No se pudieron cargar los artículos.</p>';
            return;
        }

        contenedor.innerHTML = data.articulos.map(art => `
            <a href="${art.enlace}" target="_blank" class="article-card" data-reveal="left">
                <h3>${art.titulo}</h3>
                <p>${art.descripcion}...</p>
                <span class="card-date">${formatearFecha(art.fecha)}</span>
            </a>
        `).join('');

    } catch (err) {
        console.error(err);
        contenedor.innerHTML = '<p class="standings-error">No se pudieron cargar los artículos.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarEpisodios();
    cargarArticulos();
});