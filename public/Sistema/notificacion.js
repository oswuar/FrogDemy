let notificacionesActivas = [];

function notificar(titulo, mensaje, tipo = 'info') {
    //  Verificar contenedor
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    //  Crear elemento
    const toast = document.createElement('div');
    toast.className = `toast-card ${tipo}`;

    //  Definir el iconito
    let iconoSVG = '';
    if (tipo === 'success') iconoSVG = '✅'; 
    else if (tipo === 'error') iconoSVG = '❌';
    else iconoSVG = '🔔'; 

    //  HTML saposo
    toast.innerHTML = `
        <div class="toast-icon">${iconoSVG}</div>
        <div class="toast-content">
            <div class="toast-title">${titulo}</div>
            <div class="toast-message">${mensaje}</div>
            <button class="toast-btn">Aceptar</button>
        </div>
    `;

    //  Agregar al DOM
    container.appendChild(toast);

    //  Agregar a la lista de activas
    notificacionesActivas.push(toast);

    // eliminador saposo
    if (notificacionesActivas.length > 3) {
        const primera = notificacionesActivas.shift();
        eliminarNotificacion(primera);
    }

    //  Botón Aceptar
    const btn = toast.querySelector('.toast-btn');
    btn.addEventListener('click', () => {
        const index = notificacionesActivas.indexOf(toast);
        if (index !== -1) notificacionesActivas.splice(index, 1);
        eliminarNotificacion(toast);
    });

    // autoeliminacion de 5 segundos
    setTimeout(() => {
        if (toast.parentNode) {
            const index = notificacionesActivas.indexOf(toast);
            if (index !== -1) {
                notificacionesActivas.splice(index, 1);
                eliminarNotificacion(toast);
            }
        }
    }, 10000);
}

function eliminarNotificacion(toast) {
    toast.classList.add('hide');
    toast.addEventListener('animationend', () => {
        toast.remove();
    }, { once: true });
}