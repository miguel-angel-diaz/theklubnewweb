/* ==========================================================
   PODCAST + ARTÍCULOS
========================================================== */

const PODCAST_API = 'https://mydiscordbot-production-3e6a.up.railway.app/api/podcast';
const ARTICULOS_API = 'https://mydiscordbot-production-3e6a.up.railway.app/api/articulos';

function extraerEpisodio(titulo) {
    const match = String(titulo || '').match(/^(Temp\.\s*\d+\s*Ep\.\s*\d+)/i);
    return match ? match[1] : null;
}

function limpiarTitulo(titulo) {
    return String(titulo || '').replace(/^Temp\.\s*\d+\s*Ep\.\s*\d+\s*-\s*/i, '');
}

// Los RSS (iVoox, Medium) traen HTML que no controlamos: se pasa a texto plano (DOMParser no ejecuta nada)
// y luego se escapa. Así tampoco quedan etiquetas cortadas por el recorte a 200 caracteres.
function textoPlano(html) {
    const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
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
                <a href="${safeUrl(ep.enlace)}" target="_blank" rel="noopener noreferrer" class="episode-card" data-reveal="left">
                    ${ep.imagen ? `
                        <div class="episode-card-image">
                            <img src="${safeUrl(ep.imagen)}" alt="${escapeHtml(textoPlano(tituloLimpio))}" loading="lazy">
                        </div>
                    ` : ''}
                    ${etiqueta ? `<span class="episode-card-tag">${escapeHtml(etiqueta)}</span>` : ''}
                    <h3>${escapeHtml(textoPlano(tituloLimpio))}</h3>
                    <p>${escapeHtml(textoPlano(ep.descripcion))}...</p>
                    <span class="episode-card-date">${escapeHtml(formatearFecha(ep.fecha))}</span>
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
            <a href="${safeUrl(art.enlace)}" target="_blank" rel="noopener noreferrer" class="article-card" data-reveal="left">
                <div class="article-card-icon">✎</div>
                <h3>${escapeHtml(textoPlano(art.titulo))}</h3>
                <p>${escapeHtml(textoPlano(art.descripcion))}...</p>
                <span class="article-card-date">${escapeHtml(formatearFecha(art.fecha))}</span>
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