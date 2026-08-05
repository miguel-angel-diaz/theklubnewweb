// ==========================================================
// TOAST / NOTIFICACIONES
// ==========================================================

const Toast = {
    /**
     * Muestra un toast de notificación.
     * @param {string} message - Texto del mensaje.
     * @param {string} type - 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duración en ms (por defecto 3000ms).
     */
    show(message, type = 'info', duration = 3000) {
        const container = document.querySelector('#toast-container');
        if (!container) return;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
            <span class="toast-content">${message}</span>
            <button class="toast-close" aria-label="Cerrar notificación">✕</button>
        `;

        // Cerrar con botón
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });

        container.appendChild(toast);

        // Eliminar automáticamente después de duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);
    },

    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    },
    error(message, duration = 4000) {
        this.show(message, 'error', duration);
    },
    warning(message, duration = 3500) {
        this.show(message, 'warning', duration);
    },
    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }
};