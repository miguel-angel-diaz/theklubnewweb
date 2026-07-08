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

          // NUEVO — le decimos al observer que mire estas tarjetas recién creadas
        if (window.revealInstance) {
            const nuevasTarjetas = contenedor.querySelectorAll('[data-reveal]');
            window.revealInstance.observeNew(nuevasTarjetas);
        }

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
                <div class="article-card-icon">✎</div>
                <h3>${art.titulo}</h3>
                <p>${art.descripcion}...</p>
                <span class="article-card-date">${formatearFecha(art.fecha)}</span>
            </a>
        `).join('');

        // Igual que hicimos con podcast — reactivamos el reveal para las tarjetas nuevas
        if (window.revealInstance) {
            const nuevasTarjetas = contenedor.querySelectorAll('[data-reveal]');
            window.revealInstance.observeNew(nuevasTarjetas);
        }
     } catch (err) {
        console.error(err);
        contenedor.innerHTML = '<p class="standings-error">No se pudieron cargar los artículos.</p>';
    }
}



function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha)) return '';
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function extraerEpisodio(titulo) {
    // Busca patrón "Temp. 01 Ep. 23" al inicio del título
    const match = titulo.match(/^(Temp\.\s*\d+\s*Ep\.\s*\d+)/i);
    return match ? match[1] : null;
}

function limpiarTitulo(titulo) {
    // Quita el prefijo "Temp. 01 Ep. 23 - " dejando solo el nombre del episodio
    return titulo.replace(/^Temp\.\s*\d+\s*Ep\.\s*\d+\s*-\s*/i, '');
}

document.addEventListener('DOMContentLoaded', () => {
    cargarEpisodios();
    cargarArticulos();
});