// ==========================================================
// MODAL DE CONFIRMACIÓN PERSONALIZADO
// ==========================================================

const Confirm = {
    /**
     * Muestra un modal de confirmación.
     * @param {string} message - Mensaje de confirmación.
     * @param {string} title - Título del modal (opcional).
     * @param {string} acceptText - Texto del botón aceptar (opcional).
     * @param {string} cancelText - Texto del botón cancelar (opcional).
     * @returns {Promise<boolean>} - Resuelve a true si acepta, false si cancela.
     */
    async show(message, title = 'Confirmar', acceptText = 'Aceptar', cancelText = 'Cancelar') {
        return new Promise((resolve) => {
            const modal = document.querySelector('#confirm-modal');
            const titleEl = modal.querySelector('#confirm-title');
            const messageEl = modal.querySelector('#confirm-message');
            const acceptBtn = modal.querySelector('#confirm-accept');
            const cancelBtn = modal.querySelector('#confirm-cancel');
            const backdrop = modal.querySelector('[data-close-confirm]');

            // Configurar contenido
            titleEl.textContent = title;
            messageEl.textContent = message;
            acceptBtn.textContent = acceptText;
            cancelBtn.textContent = cancelText;

            // Mostrar modal
            modal.hidden = false;
            document.body.classList.add('no-scroll');

            // Limpiar eventos previos (clonar para evitar duplicados)
            const newAccept = acceptBtn.cloneNode(true);
            const newCancel = cancelBtn.cloneNode(true);
            acceptBtn.replaceWith(newAccept);
            cancelBtn.replaceWith(newCancel);

            // Función para cerrar
            const close = (result) => {
                modal.hidden = true;
                document.body.classList.remove('no-scroll');
                resolve(result);
            };

            // Eventos
            newAccept.addEventListener('click', () => close(true));
            newCancel.addEventListener('click', () => close(false));
            backdrop.addEventListener('click', () => close(false));

            // Cerrar con Escape
            const keyHandler = (e) => {
                if (e.key === 'Escape') {
                    close(false);
                    document.removeEventListener('keydown', keyHandler);
                }
            };
            document.addEventListener('keydown', keyHandler);
        });
    }
};