const API_URL = `${window.location.origin}/api`;


function getToken() {
    return sessionStorage.getItem('token');
}

// Obtener datos del usuario actual
function getCurrentUser() {
    const userData = sessionStorage.getItem('usuarioData');
    return userData ? JSON.parse(userData) : null;
}

// Cliente HTTP centralizado
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        // Manejo global de 401 (sesión expirada)
        if (response.status === 401) {
            usuario_no_autenticado(); // función global definida en otro lugar
            throw new Error('Sesión expirada');
        }

        return { response, data };
    } catch (error) {
        console.error(`Error en ${endpoint}:`, error);
        notificar("Atención", "No es posible conectar al servidor", "error");
        throw error;
    }
}

// CRUD 
async function crudAction(endpoint, method, body = null, id = null) {
    const url = id ? `${endpoint}/${id}` : endpoint;
    const options = {
        method,
        ...(body && { body: JSON.stringify(body) }),
    };

    try {
        const { response, data } = await apiRequest(url, options);

        // Validación de errores (422, 404, 500, etc.)
        if (response.status === 422) {
            notificar("Error de validación", data.mensaje, "error");
            return false;
        }

        if (response.status === 404) {
            notificar("No encontrado", data.mensaje, "error");
            return false;
        }

        if (response.status === 500) {
            notificar("Error del servidor", data.mensaje || "Error interno", "error");
            return false;
        }

        if (response.status === 201 || response.status === 200) {
            notificar("Éxito", data.mensaje, "success");
            // Recargar o redirigir según contexto
            location.reload();
            return true;
        }

        // Si no se reconoce el estado: mensaje genérico
        if (!response.ok) {
            notificar("Error", data.mensaje || "Error en la solicitud", "error");
            return false;
        }

        return true;
    } catch (error) {
        // apiRequest
        return false;
    }
}

// ========================
// autenticación y perfil
// ========================
async function login(email, password) {
    try {
        const { response, data } = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ correo: email, hash: password })
        });

        if (data.estatus === 200) {
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('usuarioData', JSON.stringify(data.usuario));

            notificar(data.mensaje, "", "success");

            const rol = data.usuario.rol;
            if (rol === 'administrativo') window.location.href = 'admin.html';
            else if (rol === 'docente') window.location.href = 'docente.html';
            else if (rol === 'estudiante') window.location.href = 'estudiante.html';
        } else {
            notificar("Error", data.mensaje, "error");
        }
    } catch (error) {
        // Ya se notifica en apiRequest
    }
}

async function renderizarDashboard() {
    const contenedor = document.getElementById('cuerpo_dashboard');
    contenedor.innerHTML = '';

    try {
        const { response, data } = await apiRequest('/usuario');
        if (response.status === 200) {
            const usuario = data.usuario;

            // Actualizar rol en el header
            const rolSpan = document.getElementById('userRolDisplay');
            if (rolSpan) {
                const rol = usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1);
                rolSpan.textContent = rol;
            }

            // Actualizar nombre en el sidebar
            const nameDisplay = document.getElementById('userNameDisplay');
            if (nameDisplay) {
                nameDisplay.textContent = `${usuario.nombre} ${usuario.apellido}`;
            }

            const campos = [
                { label: 'Nombre', valor: usuario.nombre },
                { label: 'Apellido', valor: usuario.apellido },
                { label: 'Cédula', valor: usuario.cedula },
                { label: 'Fecha de nacimiento', valor: usuario.fecha_de_nacimiento },
                { label: 'Correo', valor: usuario.correo }
            ];

            campos.forEach(campo => {
                const item = document.createElement('div');
                item.className = 'ant-item';
                item.innerHTML = `
                    <span class="ant-label">${campo.label}</span>
                    <span class="ant-value">${campo.valor || '—'}</span>
                `;
                contenedor.appendChild(item);
            });
        } else {
            notificar("Error", "Error al cargar el perfil", "error");
        }
    } catch (error) {
        // Ya manejado
    }
}

// ========================
// Notas
// ========================
async function obtenerMisNotas() {
    const usuario = getCurrentUser();
    if (!usuario) return;

    try {
        const { response, data } = await apiRequest(`/estudiante/${usuario.id_rol_perfil}`);
        if (!data.notas) {
            notificar("Aviso", data.mensaje, "info");
            return;
        }
        renderizarTablaNotas(data.notas, false);
    } catch (error) {
        // Manejado
    }
}

async function obtenerNotasEstudiante(id, id_boton) {
    const usuario = getCurrentUser();
    try {
        const { response, data } = await apiRequest(`/estudiante/${id}`);
        if (!data.notas) {
            notificar("Aviso", data.mensaje, "info");
            return;
        }
        if (usuario?.rol === 'administrativo') {
            document.getElementById('botonBoletin').value = id_boton;
        }
        renderizarTablaNotas(data.notas, true);
    } catch (error) { }
}

async function obtenerNotasEstudiantePorMateria(id) {
    const usuario = getCurrentUser();
    try {
        const { response, data } = await apiRequest('/estudiante-materia/' + id, {
            method: "POST",
            body: JSON.stringify({ materia: usuario?.materia })
        });
        if (!data.notas) {
            notificar("Aviso", data.mensaje, "info");
            return;
        }
        renderizarTablaNotas(data.notas, true);
    } catch (error) { }
}

function renderizarTablaNotas(notas, editable = false) {
    const tabla = document.getElementById('cuerpo_notas');
    tabla.innerHTML = '';

    notas.forEach(nota => {
        const fila = document.createElement('tr');
        let color = '';
        if (nota.valor > 10) color = 'var(--success)';
        else if (nota.valor < 10) color = 'var(--danger)';
        else color = 'var(--acent)';

        let acciones = '';
        if (editable) {
            acciones = `
                <td>
                    <button value="${nota.id}" onclick="
                        document.getElementById('id_edit_nota').value = this.value;
                        showSection('editNota');"
                        class="btn btn-primary">Editar
                    </button>
                    <button onclick="eliminarNota(${nota.id});" class="btn btn-danger">Eliminar</button>
                </td>
            `;
        }

        fila.innerHTML = `
            <td>${nota.nombre_materia}</td>
            <td><span class="data">${nota.codigo_materia}</span></td>
            <td><span class="data">${nota.año}</span></td>
            <td><span class="data">${nota.numero_de_periodo}</span></td>
            <td><span class="data" style="color: ${color}">${nota.valor}</span></td>
            ${acciones}
        `;
        tabla.appendChild(fila);
    });
}

async function crearNota(form) {
    await crudAction('/nota', 'POST', form);
}

async function actualizarNota(form, id) {
    await crudAction('/nota', 'PUT', form, id);
}

async function eliminarNota(id) {
    await crudAction('/nota', 'DELETE', null, id);
}

// ========================
// Materias
// ========================
async function obtenerMaterias() {
    try {
        const { response, data } = await apiRequest('/materia');
        if (!data.materias) {
            notificar("Aviso", data.mensaje, "info");
            return;
        }
        renderizarTablaMaterias(data.materias, true);
    } catch (error) { }
}

async function obtenerMateriasEstudiante() {
    try {
        const { response, data } = await apiRequest('/materia');
        if (!data.materias) {
            notificar("Aviso", data.mensaje, "info");
            return;
        }
        renderizarTablaMaterias(data.materias, true);
    } catch (error) { }
}

function renderizarTablaMaterias(materias, editable = false) {
    const tabla = document.getElementById('cuerpo_materias');
    tabla.innerHTML = '';

    materias.forEach(materia => {
        const fila = document.createElement('tr');
        let colDescripcion = '';
        if (materia.descripcion) {
            colDescripcion = `<td><span class="data">${materia.descripcion}</span></td>`;
        }

        let acciones = '';
        if (editable) {
            acciones = `
                <td>
                    <button value="${materia.id}" onclick="
                        document.getElementById('id_edit_materia').value = this.value;
                        showSection('editMateria');"
                        class="btn btn-primary">Editar
                    </button>
                    <button onclick="eliminarMateria(${materia.id});" class="btn btn-danger">Eliminar</button>
                </td>
            `;
        }

        fila.innerHTML = `
            <td><span class="data">${materia.codigo_materia}</span></td>
            <td><span class="data">${materia.nombre_materia}</span></td>
            ${colDescripcion}
            ${acciones}
        `;
        tabla.appendChild(fila);
    });
}

async function crearMateria(form) {
    await crudAction('/materia', 'POST', form);
}

async function actualizarMateria(form, id) {
    await crudAction('/materia', 'PUT', form, id);
}

async function eliminarMateria(id) {
    await crudAction('/materia', 'DELETE', null, id);
}

// ========================
// Horarios
// ========================
async function obtenerHorarios() {
    try {
        const { response, data } = await apiRequest('/horario');
        if (!data.horarios) {
            notificar("Aviso", data.mensaje, "info");
            return;
        }
        const usuario = getCurrentUser();
        const editable = usuario && (usuario.rol === 'administrativo');
        renderizarTablaHorarios(data.horarios, editable);
    } catch (error) { }
}

function renderizarTablaHorarios(horarios, editable = false) {
    const tabla = document.getElementById('cuerpo_horarios');
    tabla.innerHTML = '';

    horarios.forEach(horario => {
        const fila = document.createElement('tr');
        let acciones = '';
        if (editable) {
            acciones = `
                <td>
                    <button value="${horario.id}" onclick="
                        document.getElementById('id_edit_horario').value = this.value;
                        showSection('editHorario');"
                        class="btn btn-primary">Editar
                    </button>
                    <button onclick="eliminarHorario(${horario.id});" class="btn btn-danger">Eliminar</button>
                </td>
            `;
        }

        fila.innerHTML = `
            <td><span class="data">${horario.nombre_materia}</span></td>
            <td>
                <span class="data">${horario.nombre}</span>
                <span class="data">${horario.apellido}</span>
            </td>
            <td><span class="data">${horario.año}</span></td>
            <td><span class="data">${horario.dia}</span></td>
            <td><span class="data">${horario.hora_de_inicio}</span></td>
            <td><span class="data">${horario.hora_de_cierre}</span></td>
            <td><span class="data">${horario.aula}</span></td>
            ${acciones}
        `;
        tabla.appendChild(fila);
    });
}

async function crearHorario(form) {
    await crudAction('/horario', 'POST', form);
}

async function actualizarHorario(form, id) {
    await crudAction('/horario', 'PUT', form, id);
}

async function eliminarHorario(id) {
    await crudAction('/horario', 'DELETE', null, id);
}

// ========================
// Estudiantes
// ========================
async function obtenerEstudiantes() {
    try {
        const { response, data } = await apiRequest('/estudiante');
        if (!data.estudiantes) {
            notificar("Aviso", data.mensaje, "info");
            return;
        }
        const usuario = getCurrentUser();
        const esDocente = usuario?.rol === 'docente';
        renderizarTablaEstudiantes(data.estudiantes, esDocente);
    } catch (error) { }
}

function renderizarTablaEstudiantes(estudiantes, esDocente) {
    const tabla = document.getElementById('cuerpo_estudiantes');
    tabla.innerHTML = '';

    estudiantes.forEach(estudiante => {
        const fila = document.createElement('tr');
        let acciones = '';

        if (esDocente) {
            acciones = `
                <td>
                    <button value="${estudiante.cedula}" onclick="
                        document.getElementById('cuerpo_notas').innerHTML = '';
                        showSection('notas');
                        obtenerNotasEstudiantePorMateria(${estudiante.id})" 
                        class="btn btn-primary">Notas</button>
                </td>
            `;
        } else {
            acciones = `
                <td>
                    <button value="${estudiante.cedula}" onclick="
                        document.getElementById('cuerpo_notas').innerHTML = '';
                        showSection('notas');
                        obtenerNotasEstudiante(${estudiante.id}, ${estudiante.cedula})" 
                        class="btn btn-primary">Notas</button>
                    <button value="${estudiante.id}" onclick="
                        document.getElementById('id_edit_estudiante').value = this.value;
                        showSection('editEstudiante');" 
                        class="btn btn-primary">Editar</button>
                    <button onclick="eliminarMateria(${estudiante.id});" class="btn btn-danger">Eliminar</button>
                </td>
            `;
        }

        fila.innerHTML = `
            <td><span class="data">${estudiante.cedula}</span></td>
            <td><span class="data">${estudiante.nombre}</span></td>
            <td><span class="data">${estudiante.apellido}</span></td>
            <td><span class="data">${estudiante.numero_de_matricula}</span></td>
            <td><span class="data">${estudiante.año_de_ingreso}</span></td>
            ${acciones}
        `;
        tabla.appendChild(fila);
    });
}

// ========================
// Periodos
// ========================
async function obtenerPeriodos() {
    try {
        const { response, data } = await apiRequest('/periodo');
        if (!data.periodos) {
            notificar("Aviso", data.mensaje, "info");
            return;
        }
        renderizarTablaPeriodos(data.periodos);
    } catch (error) { }
}

function renderizarTablaPeriodos(periodos) {
    const tabla = document.getElementById('cuerpo_periodos');
    tabla.innerHTML = '';

    periodos.forEach(periodo => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><span class="data">${periodo.año}</span></td>
            <td><span class="data">${periodo.numero_de_periodo}</span></td>
            <td><span class="data">${periodo.fecha_de_inicio}</span></td>
            <td><span class="data">${periodo.fecha_de_cierre}</span></td>
            <td>
                <button value="${periodo.id}" onclick="
                    document.getElementById('id_edit_periodo').value = this.value;
                    showSection('editPeriodo');"
                    class="btn btn-primary">Editar</button>
                <button onclick="eliminarPeriodo(${periodo.id});" class="btn btn-danger">Eliminar</button>
            </td>
        `;
        tabla.appendChild(fila);
    });
}

async function crearPeriodo(form) {
    await crudAction('/periodo', 'POST', form);
}

async function actualizarPeriodo(form, id) {
    await crudAction('/periodo', 'PUT', form, id);
}

async function eliminarPeriodo(id) {
    await crudAction('/periodo', 'DELETE', null, id);
}

// ========================
// Docentes
// ========================
async function obtenerDocentes() {
    try {
        const { response, data } = await apiRequest('/docente');
        if (!data.docentes) {
            notificar("Aviso", data.mensaje, "info");
            return;
        }
        renderizarTablaDocentes(data.docentes);
    } catch (error) { }
}

function renderizarTablaDocentes(docentes) {
    const tabla = document.getElementById('cuerpo_docentes');
    tabla.innerHTML = '';

    docentes.forEach(docente => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><span class="data">${docente.cedula}</span></td>
            <td><span class="data">${docente.nombre}</span></td>
            <td><span class="data">${docente.apellido}</span></td>
            <td><span class="data">${docente.nombre_materia}</span></td>
            <td>
                <button value="${docente.id}" onclick="
                    document.getElementById('id_edit_docente').value = this.value;
                    showSection('editDocente');"
                    class="btn btn-primary">Editar</button>
                <button onclick="eliminarDocente(${docente.id});" class="btn btn-danger">Eliminar</button>
            </td>
        `;
        tabla.appendChild(fila);
    });
}

async function crearDocente(form) {
    await crudAction('/docente', 'POST', form);
}

async function actualizarDocente(form, id) {
    await crudAction('/docente', 'PUT', form, id);
}

async function eliminarDocente(id) {
    await crudAction('/docente', 'DELETE', null, id);
}

// ========================
// Boletín
// ========================
async function cargarBoletin(form) {
    try {
        const { response, data } = await apiRequest('/nota/final', {
            method: 'POST',
            body: JSON.stringify(form)
        });

        if (data.estatus === 404) {
            notificar("Aviso", data.mensaje, "info");
            return;
        }

        renderizarBoletin(data.nota, form);
    } catch (error) { }
}

function renderizarBoletin(nota, dataEstudiante) {
    showSection('boletin');

    const tabla = document.getElementById('cuerpo_Boletin');
    tabla.innerHTML = '';

    document.getElementById('pie_Estudiante').innerHTML = `
        <td><span class="data">${nota[0].nombre}</span></td>
        <td><span class="data">${nota[0].apellido}</span></td>
    `;
    document.getElementById('pie_Cedula').innerHTML = `${nota[0].cedula}`;

    nota.forEach(nt => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><span class="data">${nt.codigo_materia}</span></td>
            <td><span class="data">${nt.nombre_materia}</span></td>
            <td><span class="data">${nt.nota}</span></td>
            <td></td>
        `;
        tabla.appendChild(fila);
    });

    cargarBotonImpresion();
}

function cargarBotonImpresion() {
    const div = document.getElementById('boletin');
    if (!document.getElementById('botonImpresion')) {
        const boton = Object.assign(document.createElement("button"), {
            innerHTML: "Imprimir",
            className: "btn btn-primary",
            style: "margin-top: 5px",
            id: "botonImpresion",
            onclick: function() {
                const tabla = document.getElementById('tabla_Boletin');
                tabla.classList.add('pdf');
                const config = {
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, backgroundColor: '#ffffff' },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                html2pdf().set(config).from(tabla).save('Reporte_Boletin_Informativo.pdf').then(() => {
                    tabla.classList.remove('pdf');
                });
            }
        });
        div.appendChild(boton);
    }
}

// ========================
// Inscripciones
// ========================
async function obtenerInscripciones() {
    try {
        const { response, data } = await apiRequest('/inscripcion');
        if (!data.inscripciones) {
            notificar("Aviso", data.mensaje, "info");
            return;
        }
        renderizarTablaInscripciones(data.inscripciones);
    } catch (error) { }
}

function renderizarTablaInscripciones(inscripciones) {
    const tabla = document.getElementById('cuerpo_inscripciones');
    tabla.innerHTML = '';

    inscripciones.forEach(inscripcion => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><span class="data">${inscripcion.cedula}</span></td>
            <td>
                <span class="data">${inscripcion.nombre}</span>
                <span class="data">${inscripcion.apellido}</span>
            </td>
            <td><span class="data">${inscripcion.seccion}</span></td>
            <td><span class="data">${inscripcion.fecha_de_inscripcion}</span></td>
        `;
        tabla.appendChild(fila);
    });
}

async function crearInscripcion(form) {
    await crudAction('/inscripcion', 'POST', form);
}

// ========================
// Filtro de búsqueda
// ========================
function filtrarBusqueda() {
    const input = document.getElementById('buscadorInput');
    const filtro = input.value.toUpperCase();
    const tabla = document.getElementById("tabla_notas");
    const filas = tabla.getElementsByTagName("tr");

    for (let i = 1; i < filas.length; i++) {
        const celdas = filas[i].getElementsByTagName("td");
        let coincide = false;
        for (let j = 0; j < celdas.length; j++) {
            if (celdas[j]) {
                const texto = celdas[j].textContent || celdas[j].innerText;
                if (texto.toUpperCase().indexOf(filtro) > -1) {
                    coincide = true;
                    break;
                }
            }
        }
        filas[i].style.display = coincide ? "" : "none";
    }
}