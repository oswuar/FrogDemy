function obtener_pagina_actual(){
    return window.location.pathname.split('/').pop();
}

function usuario_no_autenticado() {
    sessionStorage.clear();

    window.location.href = 'index.html';
}

async function verificar_token(token_actual) {
    try {
        const response = await fetch(`${API_URL}/usuario`, {
            headers: {
                "Authorization": "Bearer " + token_actual
            }
        });

        if (!response.ok){
            usuario_no_autenticado();
            return
        }

        return;

    } catch (error) {
        console.log(error);
        usuario_no_autenticado();
        return
    }
}


document.addEventListener("DOMContentLoaded", () => {

    const paginas_publicas = ["index.html", "login.html"];

    const pagina_actual = obtener_pagina_actual();

    const rutas_segun_rol = {
        "estudiante": {
            'permitidas': [
                "estudiante.html"
            ],
            "por_defecto": "estudiante.html"
        },
        "docente": {
            'permitidas': [
                "docente.html"
            ],
            'por_defecto': "docente.html"
        },
        "administrativo": {
            'permitidas': [
                'admin.html'
            ],
            'por_defecto': "admin.html"
        }

    }

    const token = sessionStorage.getItem('token');

    verificar_token(token);

    const usuario = JSON.parse(sessionStorage.getItem('usuarioData'));

    if (!usuario || !token) {
        usuario_no_autenticado();
        return;
    }

    if(paginas_publicas.includes(pagina_actual)) {
        return;
    }

    const verificacion_de_rutas = rutas_segun_rol[usuario.rol];

    if (!verificacion_de_rutas){
        usuario_no_autenticado();
        return;
    }


    const verificar_permiso_de_ruta = verificacion_de_rutas.permitidas.some(pagina => pagina_actual.includes(pagina));

    if (!verificar_permiso_de_ruta){
        window.location.href = verificacion_de_rutas.por_defecto;
        return;
    }

    const displayElement = document.getElementById('userNameDisplay');

    if(displayElement) {
        displayElement.innerText = `Hola, ${usuario.nombre}`;
    }

    /* const originalFetch = window.fetch;

    window.fetch = function(...args){
        return originalFetch.apply(this args)
            .then(response => {
                if (response.status === 401){
                    usuario_no_autenticado();
                    throw new error('error de sesion');
                }

                return response;
            })
            .catch(error => {
                console.error('error de peticion');
                trow new error;
            })
    } */

});


async function logout() {
    try {

        const token = sessionStorage.getItem('token');

        const response = await fetch(`${API_URL}/logout`, {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        const data = response.json();

        if (data.estatus === 404){

            alert('token invalido');
            window.location.href = 'index.html';
            return;

        }

        sessionStorage.clear();
        window.location.href = 'index.html';
        return;

    } catch (error) {
        console.error(error);
        return;
    }


}

