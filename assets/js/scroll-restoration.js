// Que el navegador no restaure el scroll al recargar (la web gestiona su propio scroll).
// Va en un fichero y no inline en index.html para que la CSP pueda prohibir los scripts inline (script-src 'self').
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
