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
    if (!contenedor) return;

    contenedor.innerHTML = '';

    try {
        const usuario = getCurrentUser();

        if (!usuario) {
            notificar("Error", "No hay datos de usuario", "error");
            return;
        }

        // Actualizar rol en el header
        const rolSpan = document.getElementById('userRolDisplay');
        if (rolSpan) {
            const rol = usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1);
            rolSpan.textContent = rol;
        }

        // Actualizar nombre en el sidebar
        const nameDisplay = document.getElementById('userNameDisplay');
        if (nameDisplay) {
            nameDisplay.textContent = `Hola, ${usuario.nombre}`;
        }

        const campos = [
            { label: 'Nombre', valor: usuario.nombre },
            { label: 'ID', valor: usuario.id },
            { label: 'Rol', valor: usuario.rol },
            { label: 'Perfil ID', valor: usuario.id_rol_perfil || '—' }
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
    } catch (error) {
        console.error('Error loading dashboard:', error);
        notificar("Error", "Error al cargar el perfil", "error");
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
                    <button value="${materia.id}" onclick="obtenerMateriaParaEditar(${materia.id})"
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

async function obtenerMateriaParaEditar(id) {
    try {
        const { response, data } = await apiRequest(`/materia/${id}`);
        if (response.status === 200) {
            document.getElementById('id_edit_materia').value = id;
            if (data.materia) {
                const m = data.materia;
                const form = document.getElementById('editMateriaForm');
                if (form.codigo_materia) form.codigo_materia.value = m.codigo_materia || '';
                if (form.nombre_materia) form.nombre_materia.value = m.nombre_materia || '';
                if (form.descripcion) form.descripcion.value = m.descripcion || '';
            }
            showSection('editMateria');
        }
    } catch (error) {
        notificar("Error", "No se pudo cargar la materia", "error");
    }
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
                    <button value="${horario.id}" onclick="obtenerHorarioParaEditar(${horario.id})"
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

async function obtenerHorarioParaEditar(id) {

    try {
        const { response, data } = await apiRequest(`/horario/${id}`);
        if (response.status === 200) {
            document.getElementById('id_edit_horario').value = id;
            if (data.horario) {
                const h = data.horario;
                const form = document.getElementById('editHorarioForm');
                if (form.codigo_materia) form.codigo_materia.value = h.codigo_materia || '';
                if (form.docente_cedula) form.docente_cedula.value = h.docente_cedula || '';
                if (form.periodos_año) form.periodos_año.value = h.año || '';
                if (form.periodos_numero) form.periodos_numero.value = h.numero_de_periodo || '';
                if (form.dia) form.dia.value = h.dia || '';
                if (form.hora_de_inicio) form.hora_de_inicio.value = h.hora_de_inicio || '';
                if (form.hora_de_cierre) form.hora_de_cierre.value = h.hora_de_cierre || '';
                if (form.aula) form.aula.value = h.aula || '';
                if (form.seccions) form.seccions.value = h.seccions || '';
            }
            showSection('editHorario');
        }
    } catch (error) {
        notificar("Error", "No se pudo cargar el horario", "error");
    }
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
                    <button value="${estudiante.id}" onclick="obtenerEstudianteParaEditar(${estudiante.id})" 
                        class="btn btn-primary">Editar</button>
                    <button onclick="eliminarEstudiante(${estudiante.id});" class="btn btn-danger">Eliminar</button>
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
// Estudiantes CRUD
// ========================
async function crearEstudiante(form) {
    await crudAction('/estudiante', 'POST', form);
}

async function actualizarEstudiante(form, id) {
    await crudAction('/estudiante', 'PUT', form, id);
}

async function eliminarEstudiante(id) {
    await crudAction('/estudiante', 'DELETE', null, id);
}

async function obtenerEstudianteParaEditar(id) {
    try {
        const { response, data } = await apiRequest(`/estudiante/${id}`);
        if (response.status === 200) {
            document.getElementById('id_edit_estudiante').value = id;
            if (data.estudiante) {
                const s = data.estudiante;
                const form = document.getElementById('editEstudianteForm');
                if (form.nombre) form.nombre.value = s.nombre || '';
                if (form.apellido) form.apellido.value = s.apellido || '';
                if (form.cedula) form.cedula.value = s.cedula || '';
                if (form.correo) form.correo.value = s.correo || '';
                if (form.seccion) form.seccion.value = s.seccion || '';
            }
            showSection('editEstudiante');
        }
    } catch (error) {
        notificar("Error", "No se pudo cargar el estudiante", "error");
    }
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
                <button value="${periodo.id}" onclick="obtenerPeriodoParaEditar(${periodo.id})"
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

async function obtenerPeriodoParaEditar(id) {
    try {
        const { response, data } = await apiRequest(`/periodo/${id}`);
        if (response.status === 200) {
            document.getElementById('id_edit_periodo').value = id;
            if (data.periodo) {
                const p = data.periodo;
                const form = document.getElementById('editPeriodoForm');
                if (form.año) form.año.value = p.año || '';
                if (form.numero_de_periodo) form.numero_de_periodo.value = p.numero_de_periodo || '';
                if (form.fecha_de_inicio) form.fecha_de_inicio.value = p.fecha_de_inicio || '';
                if (form.fecha_de_cierre) form.fecha_de_cierre.value = p.fecha_de_cierre || '';
            }
            showSection('editPeriodo');
        }
    } catch (error) {
        notificar("Error", "No se pudo cargar el periodo", "error");
    }
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
                <button value="${docente.id}" onclick="obtenerDocenteParaEditar(${docente.id})"
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


async function obtenerDocenteParaEditar(id) {
    try {
        const { response, data } = await apiRequest(`/docente/${id}`);
        if (response.status === 200) {
            document.getElementById('id_edit_docente').value = id;
            if (data.docente) {
                const d = data.docente;
                const form = document.getElementById('editDocenteForm');
                if (form.nombre) form.nombre.value = d.nombre || '';
                if (form.apellido) form.apellido.value = d.apellido || '';
                if (form.cedula) form.cedula.value = d.cedula || '';
                if (form.correo) form.correo.value = d.correo || '';
                if (form.materia) form.materia.value = d.materia || '';
                if (form.fecha_de_nacimiento) form.fecha_de_nacimiento.value = d.fecha_de_nacimiento || '';
            }
            showSection('editDocente');
        }
    } catch (error) {
        notificar("Error", "No se pudo cargar el docente", "error");
    }
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
    const tabla = document.getElementById("tabla_estudiantes");
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