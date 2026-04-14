const API_URL = `${window.location.origin}/api`;


async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            headers: {'Accept': 'application/json'} ,
            body: JSON.stringify({ correo: email, hash: password })
        });

        const data = await response.json();

        if (data.estatus === 200) {

            sessionStorage.setItem('token', data.token);

            sessionStorage.setItem('usuarioData', JSON.stringify(data.usuario));

            notificar('Autenticado.', data.mensaje, "success");

            if (data.usuario.rol === 'administrativo') {
                window.location.href = 'admin.html';
            }
            else if (data.usuario.rol === 'docente') {
                window.location.href = 'docente.html';
            }
            else if (data.usuario.rol === 'estudiante') {
                window.location.href = 'estudiante.html';
            }

            return;

        } else if (data.estatus === 403) {

            notificar('Cuenta inhabilitada', data.mensaje);
            return;

        } else {
            notificar("Error de Autenticacion", data.mensaje, "error");
            console.error(data);
            return;
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        notificar("Error", "No se pudo conectar con el servidor.", "error");
        return;
    }
}


async function renderizarDashboard() {

    const token = sessionStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/usuario`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await response.json();

        if (response.status === 200) {
            const contenedor = document.getElementById('cuerpo_dashboard');

            contenedor.innerHTML = '';

            const usuario = data.usuario;


            const rolSpan = document.getElementById('userRolDisplay');
            if (rolSpan) {

                const rol = JSON.parse(sessionStorage.getItem('usuarioData')).rol.charAt(0).toUpperCase() + JSON.parse(sessionStorage.getItem('usuarioData')).rol.slice(1);
                rolSpan.textContent = rol;
            }

            const campos = [
                { label: 'Nombre', valor: usuario.nombre },
                { label: 'Apellido', valor: usuario.apellido },
                { label: 'Cédula', valor: usuario.cedula },
                { label: 'Fecha de nacimiento', valor: usuario.fecha_de_nacimiento },
                { label: 'Correo', valor: usuario.correo },
            ];

            const nombre_rol = JSON.parse(sessionStorage.getItem('usuarioData')).rol;

            const materia = JSON.parse(sessionStorage.getItem('usuarioData')).materia;

            if (nombre_rol === "docente") {
                const label_materia = { label: 'Materia', valor: materia };
                campos.push(label_materia);
            }

            campos.forEach(campo => {
                const item = document.createElement('div');
                item.className = 'ant-item';

                const labelSpan = document.createElement('span');
                labelSpan.className = 'ant-label';
                labelSpan.textContent = campo.label;

                const valueSpan = document.createElement('span');
                valueSpan.className = 'ant-value';
                valueSpan.textContent = campo.valor || '—';

                item.appendChild(labelSpan);
                item.appendChild(valueSpan);
                contenedor.appendChild(item);
            });

        } else {
            notificar('Error', "Ocurrio un problema al cargar el perfil", "error");
        }

    } catch (error) {
        notificar('Error', "Error de conexion con el servidor", "error");
        console.log(error);
        return
    }


}



async function obtenerMisNotas() {

    try {

        usuario = JSON.parse(sessionStorage.getItem('usuarioData'));

        const response = await fetch(`${API_URL}/estudiante/${usuario.id_rol_perfil}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + sessionStorage.getItem('token')
            }
        });

        const data = await response.json();

        if (!data.notas) {
            console.log("estatus: " + data.estatus);
            return notificar('Atencion!', data.mensaje);
        }

        const notas = data.notas;

        renderizarTablaNotas(notas);

        return;

    } catch (error) {

        console.log(error);

        notificar('Error', "Error de conexion con el servidor", "error");

        return;

    }


}

async function obtenerNotasEstudiante(id, cedula) {

    const usuario = JSON.parse(sessionStorage.getItem('usuarioData'));

    try {

        const response = await fetch(`${API_URL}/estudiante/${id}`, {
            headers: {
                "Authorization": "Bearer " + sessionStorage.getItem('token')
            }
        });

        const data = await response.json();

        if (!data.notas) {
            notificar('Atencion!', data.mensaje);
            console.log(data);
            return;
        }

        const notas = data.notas;

        if (usuario.rol === 'administrativo') {
            document.getElementById('botonBoletin').value = cedula;
        }

        renderizarTablaNotasDocente(notas);

    } catch (error) {

        console.log(error);

        notificar('Error', "Error de conexion con el servidor", "error");

    }


}

async function obtenerNotasEstudiantePorMateria(id) {

    const usuario = JSON.parse(sessionStorage.getItem('usuarioData'));

    try {

        const response = await fetch(`${API_URL}/estudiante-materia/${id}`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + sessionStorage.getItem('token'),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ materia: usuario.materia })
        });

        const data = await response.json();

        if (!data.notas) {
            notificar('Atencion!', data.mensaje);
            console.log(data);
            return;
        }

        const notas = data.notas;

        renderizarTablaNotasDocente(notas);

    } catch (error) {

        console.log(error);

        notificar('Error', "Error de conexion con el servidor", "error");

    }


}


function renderizarTablaNotas(notas) {
    const tabla = document.getElementById('cuerpo_notas');
    tabla.innerHTML = '';

    let color = '';

    notas.forEach(nota => {
        const fila = document.createElement('tr');
        fila.innerHTML = '';

        if (nota.valor > 3) {
            color = 'style="color: var(--success)"';
        }
        else if (nota.valor < 3) {
            color = 'style="color: var(--danger)"';
        }
        else {
            color = 'style="color: var(--warning)"';
        }

        fila.innerHTML = `
            <td>${nota.nombre_materia}</td>
            <td><span class="data">${nota.codigo_materia}</span></td>
            <td><span class="data">${nota.año}</span></td>
            <td><span class="data">${nota.numero_de_periodo}</span></td>
            <td><span class="data" ${color}>${nota.valor}</span></td>
        `;

        tabla.appendChild(fila);
    });
}

function renderizarTablaNotasDocente(notas) {
    const tabla = document.getElementById('cuerpo_notas');
    tabla.innerHTML = '';

    let color = '';

    notas.forEach(nota => {
        const fila = document.createElement('tr');
        fila.innerHTML = '';

        if (nota.valor > 3) {
            color = 'style="color: var(--success)"';
        }
        else if (nota.valor < 3) {
            color = 'style="color: var(--danger)"';
        }
        else {
            color = 'style="color: var(--warning)"';
        }

        fila.innerHTML = `
            <td>${nota.nombre_materia}</td>
            <td><span class="data">${nota.codigo_materia}</span></td>
            <td><span class="data">${nota.año}</span></td>
            <td><span class="data">${nota.numero_de_periodo}</span></td>
            <td><span class="data" ${color}>${nota.valor}</span></td>
            <td>
                <button value="${nota.id}" onclick="
                    document.getElementById('id_edit_nota').value = this.value; showSection('editNota');"
                    class="btn btn-primary">Editar
                </button>
                <button onclick="eliminarNota(${nota.id}, this);" class="btn btn-danger">Eliminar</button>
            </td>
        `;

        tabla.appendChild(fila);
    });
}

async function crearNota(form) {
    const token = sessionStorage.getItem('token');

    try {

        const response = await fetch(`${API_URL}/nota`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: form
        });

        const data = await response.json();

        if (response.status === 401) {
            usuario_no_autenticado();
            return;
        }

        if (response.status === 422) {
            validarErrores('-notaForm', data.error);
            return;
        }

        if (response.status === 500) {
            notificar('Error', data.mensaje, "error");
            return;
        }

        if (response.status === 201) {
            notificar('Operacion exitosa!', data.mensaje, "success");
            NotaForm.reset();
            return;
        }

    } catch (error) {
        notificar('Error', "No fue posible conectarse al servidor", "error");
        console.error(error);
        return;
    }
}

async function actualizarNota(form, id) {

    const token = sessionStorage.getItem('token');

    try {

        const response = await fetch(`${API_URL}/nota/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: form
        });

        const data = await response.json();

        if (response.status === 401) {
            usuario_no_autenticado();
            return;
        }

        if (response.status === 422) {
            validarErrores("-editNota", data.error);
            return;
        }

        if (response.status === 404) {
            notificar('Atencion!', data.mensaje);
            return;
        }

        if (response.status === 500) {
            notificar('Error', data.mensaje, "error");
            return;
        }

        if (response.status === 200) {
            notificar("Operacion exitosa!", data.mensaje, "success");
            NotaEdit.reset();
            return;
        }

    } catch (error) {
        notificar('Error', "Error de conexion con el servidor", "error");
        console.error(error);
    }


}

async function eliminarNota(id, boton) {
    const token = sessionStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/nota/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token
            },
        });

        const data = await response.json();

        if (data.estatus === 404) {
            notificar('Atencion', data.mensaje);
            return;
        }

        if (data.estatus === 500) {
            notificar("Error", data.mensaje, "error");
            return;
        }

        notificar("Operacion exitosa", data.mensaje, "success");

        fila = boton.parentNode.parentNode;

        fila.remove();

        return;

    } catch (error) {

        alert("Error: no se pudo conetar con el servidor");
        console.error("error del servidor " + error);
    }
}


async function obtenerMaterias() {
    const token = sessionStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/materia`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const materias = await response.json();

        if (!materias.materias) {
            notificar("Atencion!", materias.mensaje);
            return;
        }

        /* console.log(materias); */

        renderizarTablaMaterias(materias.materias);

        return;

    } catch (error) {
        notificar("Error", "No fue posible conectarse al servidor.", "error");
        return;
    }
}


function renderizarTablaMaterias(materias) {

    const tabla = document.getElementById('cuerpo_materias');

    tabla.innerHTML = '';

    materias.forEach(materia => {
        const fila = document.createElement('tr');
        if (!materia.descripcion) {
            fila.innerHTML = `
            <td><span class="data">${materia.codigo_materia}</span></td>
            <td><span class="data">${materia.nombre_materia}</span></td>
            `;
        } else {
            fila.innerHTML = `
            <td><span class="data">${materia.codigo_materia}</span></td>
            <td><span class="data">${materia.nombre_materia}</span></td>
            <td><span class="data">${materia.descripcion}</span></td>
            `;
        }

        tabla.appendChild(fila);
    });

}

async function obtenerMateriasEstudiante() {
    const token = sessionStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/materia`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const materias = await response.json();

        if (!materias.materias) {
            notificar("Atencion!", materias.mensaje);
            return;
        }

        renderizarTablaMateriasDocente(materias.materias);

        renderizarSelectMateria(materias.materias);

    } catch (error) {
        notificar("Error", "no fue posible conectarse al servidor", "error");
        return;
    }

}

function renderizarTablaMateriasDocente(materias) {

    const tabla = document.getElementById('cuerpo_materias');

    tabla.innerHTML = '';

    materias.forEach(materia => {
        const fila = document.createElement('tr');
        if (!materia.descripcion) {
            fila.innerHTML = `
            <td><span class="data">${materia.codigo_materia}</span></td>
            <td><span class="data">${materia.nombre_materia}</span></td>
            <td></td>
            <td>
                <button value="${materia.id}" onclick="
                    document.getElementById('id_edit_materia').value = this.value; showSection('editMateria');"
                    class="btn btn-primary">Editar
                </button>
                <button onclick="eliminarMateria(${materia.id}, this);" class="btn btn-danger">Eliminar</button>
            </td>
            `;
        } else {
            fila.innerHTML = `
            <td><span class="data">${materia.codigo_materia}</span></td>
            <td><span class="data">${materia.nombre_materia}</span></td>
            <td><span class="data">${materia.descripcion}</span></td>
            <td>
                <button value="${materia.id}" onclick="
                    document.getElementById('id_edit_materia').value = this.value; showSection('editMateria');"
                    class="btn btn-primary">Editar
                </button>
                <button onclick="eliminarMateria(${materia.id}, this);" class="btn btn-danger">Eliminar</button>
            </td>
            `;
        }

        tabla.appendChild(fila);
    });

}


function renderizarSelectMateria(materias) {

    const selects = document.querySelectorAll('.select_materia');


    selects.forEach(select => {

        select.innerHTML = '';

        select.add(new Option('Seleccione...'));

        materias.forEach(materia => {
            const opcion = document.createElement('option');
            opcion.value = materia.nombre_materia;
            opcion.text = `${materia.nombre_materia}`;
            select.appendChild(opcion);
        });

    });

    return;

}

async function crearMateria(form) {
    const token = sessionStorage.getItem('token');

    try {

        const response = await fetch(`${API_URL}/materia`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: form
        });

        const data = await response.json();

        if (response.status === 401) {
            usuario_no_autenticado();
            return;
        }

        if (response.status === 422) {
            validarErrores("-materiaForm", data.error);
            return;
        }

        if (response.status === 500) {
            notificar("Error", data.mensaje, "error");
            return;
        }

        if (response.status === 201) {
            notificar("Operacion exitosa!", data.mensaje, "success");
            MateriaForm.reset();
            obtenerMateriasEstudiante();
            return;
        }

    } catch (error) {
        notificar("Error", "No fue posible conectarse al servidor");
        console.error(error);
        return;
    }

}

async function actualizarMateria(form, id) {
    const token = sessionStorage.getItem('token');

    try {

        const response = await fetch(`${API_URL}/materia/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: form
        });

        const data = await response.json();

        if (response.status === 401) {
            usuario_no_autenticado();
            return;
        }

        if (response.status === 422) {
            validarErrores("-editMateria", data.error);
            return;
        }

        if (response.status === 500) {
            notificar("Error", data.mensaje, "error");
            return;
        }

        if (response.status === 200) {
            notificar("Operacion exitosa!", data.mensaje, "success");
            MateriaEdit.reset();
            obtenerMateriasEstudiante();
            return;
        }

    } catch (error) {
        notificar("Error", "No fue posible conectarse al servidor", "error");
        console.error(error);
    }
}

async function eliminarMateria(id, boton) {
    const token = sessionStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/materia/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await response.json();

        if (data.estatus === 404) {
            notificar("Atencion!", data.mensaje);
            return;
        }

        if (data.estatus === 409) {
            notificar("Error", data.mensaje);
            return;
        }

        notificar("Operacion exitosa!", data.mensaje, "success");

        fila = boton.parentNode.parentNode;

        fila.remove();

        obtenerMateriasEstudiante();

        return;
    } catch (error) {
        alert("error de conexion con el servidor");
        console.log(error);
    }
}

async function obtenerHorarios() {
    const token = sessionStorage.getItem('token');

    const response = await fetch(`${API_URL}/horario`, {
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    const horarios = await response.json();

    if (!horarios.horarios) {
        notificar("Atencion!", horarios.mensaje);
        return;
    }

    /* console.log(horarios); */

    renderizarTablaHorarios(horarios.horarios);

}

function renderizarTablaHorarios(horarios) {
    const tabla = document.getElementById('cuerpo_horarios');

    tabla.innerHTML = '';

    const usuario = JSON.parse(sessionStorage.getItem('usuarioData'));

    if (usuario.rol === 'docente' | usuario.rol === 'estudiante') {
        horarios.forEach(horario => {
            const fila = document.createElement('tr');

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
            `;

            tabla.appendChild(fila);
        });
        return;
    }

    horarios.forEach(horario => {
        const fila = document.createElement('tr');

        fila.innerHTML = `
        <td><span class="data">${horario.nombre_materia}</span></td>
        <td>
            <span class="data">${horario.nombre}</span>
            <span class="data">${horario.apellido}</span>
        </td>
        <td><span class="data">${horario.año}-${horario.numero_de_periodo}</span></td>
        <td><span class="data">${horario.dia}</span></td>
        <td><span class="data">${horario.hora_de_inicio}</span></td>
        <td><span class="data">${horario.hora_de_cierre}</span></td>
        <td><span class="data">${horario.aula}</span></td>
        <td>
            <button value="${horario.id}" onclick="
                document.getElementById('id_edit_horario').value = this.value; showSection('editHorario');"
                class="btn btn-primary">Editar
            </button>
            <button onclick="eliminarHorario(${horario.id}, this);" class="btn btn-danger">Eliminar</button>
        </td>
        `;

        tabla.appendChild(fila);
    });


}

async function crearHorario(form) {
    const token = sessionStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/horario`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: form
        });

        const data = await response.json();

        if (response.status === 401) {
            usuario_no_autenticado();
            return;
        }

        if (response.status === 422) {
            validarErrores("-horarioForm", data.error);
            return;
        }

        if (response.status === 500) {
            notificar("Error", data.mensaje, "error");
            return;
        }

        if (response.status === 201) {
            notificar("Operacion exitosa!", data.mensaje, "success");
            HorarioForm.reset();
            return;
        }

    } catch (error) {
        notificar("Error", "No fue posible conectarse al servidor", "error");
        console.error(error);
        return;
    }
}

async function actualizarHorario(form, id) {

    const token = sessionStorage.getItem('token');

    try {

        const response = await fetch(`${API_URL}/horario/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: form
        });

        const data = await response.json();

        if (response.status === 401) {
            usuario_no_autenticado();
            return;
        }

        if (response.status === 422) {
            validarErrores("-editHorario")
            return;
        }

        if (response.status === 500) {
            notificar("Error", data.mensaje, "error");
            return;
        }

        if (response.status === 200) {
            notificar("Operacion exitosa!", data.mensaje, "success");
            HorarioEdit.reset();
            return;
        }

    } catch (error) {
        notificar("Error", "No fue posible conectarse al servidor", "error");
        console.error(error);
        return;
    }
}


async function eliminarHorario(id, boton) {
    token = sessionStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/periodo/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token
            },
        });

        const data = await response.json();

        if (data.estatus === 404) {
            notificar("Atencion!", data.mensaje);
            return;
        }

        notificar("Operacion exitosa!", data.mensaje, "success");

        fila = boton.parentNode.parentNode;

        fila.remove();

        return;

    } catch (error) {

        notificar("Error", "No fue posible conectarse al servidor", "error");
        console.error("error de conexion con el servidor");
        return;
    }
}



async function obtenerEstudiantes() {
    const token = sessionStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/estudiante`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });
    
        const estudiantes = await response.json();
    
        if (!estudiantes.estudiantes) {
            notificar("Atencion!", estudiantes.mensaje);
            return;
        }
    
        /* console.log(estudiantes.estudiantes); */
    
        renderizarTablaEstudiantes(estudiantes.estudiantes);
    } catch (error) {
        notificar("Error", "No fue posible conectarse al servidor", "error");
        console.error(error);
        return;
    }

}

function renderizarTablaEstudiantes(estudiantes) {
    const tabla = document.getElementById('cuerpo_estudiantes');

    tabla.innerHTML = '';

    const usuario = JSON.parse(sessionStorage.getItem('usuarioData'));

    if (usuario.rol === 'docente') {

        estudiantes.forEach(estudiante => {
            const fila = document.createElement('tr');

            fila.innerHTML = `
                <td><span class="data">${estudiante.cedula}</span></td>
                <td><span class="data">${estudiante.nombre}</span></td>
                <td><span class="data">${estudiante.apellido}</span></td>
                <td><span class="data">${estudiante.numero_de_matricula}</span></td>
                <td><span class="data">${estudiante.año_de_ingreso}</span></td>
                <td>
                    <button value="${estudiante.cedula}" onclick="
                        document.getElementById('cuerpo_notas').innerHTML = '';
                        showSection('notas');
                        document.getElementById('boton_crear_nota').value = ${estudiante.cedula};
                        obtenerNotasEstudiantePorMateria(${estudiante.id})" class="btn btn-primary";
                    >Notas</button>
                </td>
            `;

            tabla.appendChild(fila);
        });

        return;

    }

    estudiantes.forEach(estudiante => {
        const fila = document.createElement('tr');

        fila.innerHTML = `
            <td><span class="data">${estudiante.cedula}</span></td>
            <td><span class="data">${estudiante.nombre}</span></td>
            <td><span class="data">${estudiante.apellido}</span></td>
            <td><span class="data">${estudiante.numero_de_matricula}</span></td>
            <td><span class="data">${estudiante.año_de_ingreso}</span></td>
            <td>
                <button value="${estudiante.cedula}" onclick="
                    document.getElementById('cuerpo_notas').innerHTML = '';
                    showSection('notas');
                    document.getElementById('boton_crear_nota').value = ${estudiante.cedula};
                    obtenerNotasEstudiante(${estudiante.id}, ${estudiante.cedula})" class="btn btn-primary";
                >Notas</button>
                <button onclick="eliminarEstudiante(${estudiante.id}, this);" class="btn btn-danger">Bloquear</button>
            </td>
        `;

        tabla.appendChild(fila);
    });


    return;
}

function filtrarBusqueda(buscador, tb) {
    const input = document.getElementById(buscador);
    const filtro = input.value.toUpperCase();
    const tabla = document.getElementById(tb);
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
    return;
}





async function actualizarEstudiante(form, id) {
    const token = sessionStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/estudiante/${id}`, {
            method: 'PUT',
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: form
        });

        const data = await response.json();

        switch (response.status) {
            case 401:
                usuario_no_autenticado();
                break;

            case 422:
                validarErrores("-editEstudiante", data.error);
                break;

            case 404:
                notificar('Atencion!', data.mensaje);
                break;

            case 500:
                notificar("Error", data.mensaje, "error");
                break;

            case 200:
                notificar("Operacion exitosa!", data.mensaje, "success");
                break;

            default:
                notificar("Error", "Ha ocurrido un error inesperado", "error");
                break;
        }

        return;

    } catch (error) {
        notificar("Error", "No fue posible conectarse al servidor", "error");
        console.error(error);
        return;
    }
}

async function eliminarEstudiante(id, boton) {
    const token = sessionStorage.getItem('token');

    try {

        const response = await fetch(`${API_URL}/estudiante/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await response.json();

        if (response.status === 404) {
            notificar("Error", data.mensaje);
            return;
        }

        notificar("Operacion Exitosa", data.mensaje, "success");

        fila = boton.parentNode.parentNode;

        fila.remove();

        return;

    } catch (error) {
        notificar('Error', "Error de conexion con el servidor", "error");
    }

}


async function obtenerUsuariosBloqueados() {
    const token = sessionStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/usuario/bloqueado`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });
    
        const usuarios = await response.json();
    
        if (!usuarios.usuarios) {
            notificar("Atencion!", usuarios.mensaje);
            return;
        }
    
        /* console.log(usuarios.usuarios); */
    
        renderizarTablaUsuariosBloqueados(usuarios.usuarios);

        return;

    } catch (error) {
        notificar('Error', "No fue Posible conectarse al servidor", "error");
        console.error(error);
        return;
    }

}

function renderizarTablaUsuariosBloqueados(usuarios) {
    const tabla = document.getElementById('cuerpo_usuarios_bloqueados');
    tabla.innerHTML = '';

    usuarios.forEach(usuario => {
        const fila = document.createElement('tr');

        fila.innerHTML = `
            <td><span class="data">${usuario.cedula}</span></td>
            <td><span class="data">${usuario.nombre}</span></td>
            <td><span class="data">${usuario.apellido}</span></td>
            <td><span class="data">${usuario.rol.nombre_rol}</span></td>
            <td>
                <button onclick="desbloquearUsuario(${usuario.id}, this);" class="btn btn-primary">Desbloquear</button>
            </td>
        `;

        tabla.appendChild(fila);

    });
}


async function desbloquearUsuario(id, boton) {
    const token = sessionStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/usuario/${id}/estado/activo`, {
            method: 'PATCH',
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = response.json();

        switch (response.status) {
            case 404:
                notificar('Atencion!', data.mensaje);
                break;

            case 500:
                notificar('Error', data.mensaje, "error");
                break;

            case 200:
                notificar('Operacion exitosa!', data.mensaje, "success");

                fila = boton.parentNode.parentNode;

                fila.remove();

                break;
        
            default:
                break;
        }

        return;

    } catch (error) {
        notificar('Error', "No fue posible conectarse al servidor", "error");
        console.error(error);
        return;
    }
}


async function obtenerPeriodos() {
    const token = sessionStorage.getItem('token');

    const response = await fetch(`${API_URL}/periodo`, {
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    const periodos = await response.json();

    if (!periodos.periodos) {
        notificar('Atencion!', periodos.mensaje);
        return;
    }

    /* console.log(periodos.periodos); */

    renderizarTablaPeriodos(periodos.periodos);

    return;

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
                    document.getElementById('año_edit_periodo').value = ${periodo.año};
                    document.getElementById('numero_edit_periodo').value = ${periodo.numero_de_periodo};
                    showSection('editPeriodo');"
                    class="btn btn-primary">Editar
                </button>
                <button onclick="eliminarPeriodo(${periodo.id}, this);" class="btn btn-danger">Eliminar</button>
            </td>
        `;

        tabla.appendChild(fila);
    });
}

async function crearPeriodo(form) {

    const token = sessionStorage.getItem('token');

    try {

        const response = await fetch(`${API_URL}/periodo`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: form
        });

        const data = await response.json();

        if (response.status === 401) {
            usuario_no_autenticado();
            return;
        }

        if (response.status === 422) {
            validarErrores("-periodoForm", data.error);
            return;
        }

        if (response.status === 500) {
            notificar("Error", data.error, "error");
            return;
        }

        if (response.status === 201) {
            notificar("Operacion exitosa!", data.mensaje, "success");
            periodoForm.reset();
            return;
        }

    } catch (error) {
        notificar("Error", "No fue posible conectarse al servidor", "error");
        console.error(error);
    }


}


async function actualizarPeriodo(form, id) {

    const token = sessionStorage.getItem('token');

    try {

        const response = await fetch(`${API_URL}/periodo/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: form
        });

        const data = await response.json();

        if (response.status === 401) {
            usuario_no_autenticado();
            return;
        }

        if (response.status === 422) {
            validarErrores("-editPeriodo", data.error);
            return;
        }

        if (response.status === 404) {
            notificar("Atencion!", data.mensaje);
            return;
        }

        if (response.status === 500) {
            notificar("Error", data.mensaje, "error");
            return;
        }

        if (response.status === 200) {
            notificar("Operacion Exitosa!", data.mensaje, "success");
            periodoEdit.reset();
            return;
        }

    } catch (error) {
        notificar("Error", "No fue posible conectarse al servidor", "error");
        console.error(error);
    }


}

async function eliminarPeriodo(id, boton) {

    token = sessionStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/periodo/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token
            },
        });

        const data = await response.json();

        if (data.estatus === 404) {
            notificar('Atencion!', data.mensaje);
            return;
        }

        if (data.estatus === 500) {
            notificar('Error', data.mensaje, "error");
            return;
        }

        notificar("Operacion exitosa!", data.mensaje, "success");

        fila = boton.parentNode.parentNode;

        fila.remove();

        return;

    } catch (error) {

        notificar("Error", "No fue posible conectarse al servidor", "error");
        console.error("error de conexion con el servidor");
        return;
    }

}

async function obtenerDocentes() {
    const token = sessionStorage.getItem('token');

    const response = await fetch(`${API_URL}/docente`, {
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    const docentes = await response.json();

    if (!docentes.docentes) {
        notificar("Atencion!", data.mensaje)
        return;
    }

    /* console.log(docentes.docentes); */

    renderizarTablaDocentes(docentes.docentes);
    return;
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
                <button onclick="eliminarDocente(${docente.id}, this);" class="btn btn-danger">Bloquear</button>
            </td>
        `;
        tabla.appendChild(fila);
    });

    return;
}

async function crearDocente(form) {
    const token = sessionStorage.getItem('token');

    try {

        const response = await fetch(`${API_URL}/docente`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: form
        });

        const data = await response.json();

        if (response.status === 401) {
            usuario_no_autenticado();
            return;
        }

        if (response.status === 422) {
            validarErrores('-docenteForm', data.error);
            return;
        }

        if (response.status === 500) {
            notificar("Error", data.mensaje, "error");
            return;
        }

        if (response.status === 201) {
            notificar('Operacion exitosa!', data.mensaje, "success");
            DocenteForm.reset();
            return;
        }

    } catch (error) {
        notificar("Error", "No fue posible conectarse al servidor", "error");
        console.error(error);
        return;
    }
}

async function actualizarDocente(form, id) {
    const token = sessionStorage.getItem('token');

    try {

        console.log(form);

        const response = await fetch(`${API_URL}/docente/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: form
        });

        const data = await response.json();

        console.log(data);

        if (response.status === 401) {
            usuario_no_autenticado();
            return;
        }

        if (response.status === 422) {
            validarErrores('-editDocente', data.error);
            return;
        }

        if (response.status === 404) {
            notificar("Atencion!", data.mensaje);
            return;
        }

        if (response.status === 500) {
            notificar("Error", data.mensaje, "error");
            return;
        }

        if (response.status === 200) {
            notificar('Operacion exitosa!', data.mensaje, "success");
            DocenteEdit.reset();
            return;
        }

        return;

    } catch (error) {
        notificar("Error", "No fue posible conectarse al servidor", "error");
        console.error(error);
        return;
    }
}

async function eliminarDocente(id, boton) {
    const token = sessionStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/docente/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": "Bearer " + token
            },
        });

        const data = await response.json();

        if (data.estatus === 404) {
            notificar("Atencion!", data.mensaje);
            return;
        }

        if (data.estatus === 500) {
            notificar("Error", data.mensaje, "error");
            return;
        }

        /* console.log(data); */

        notificar('Operacion exitosa!', data.mensaje, "success");

        fila = boton.parentNode.parentNode;

        fila.remove();

        return;

    } catch (error) {

        notificar("Error", "No fue posible conectarse al servidor", "error");
        console.error(error);

        return;
    }

}

async function cargarBoletin(form) {
    const token = sessionStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/nota/final`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: form
        });

        const data = await response.json();

        if (data.estatus === 404) {
            notificar('Atencion!', data.mensaje);
            return;
        }

        /* console.log(data); */

        renderizarBoletin(data.nota, form);
        return;

    } catch (error) {
        notificar("Error", "No fue posible conectarse al servidor", "error");
        console.log(error);
        return;
    }

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

    return;
}

function cargarBotonImpresion() {
    const div = document.getElementById('boletin');

    if (!document.getElementById('botonImpresion')) {
        const boton = Object.assign(document.createElement("button"), {
            innerHTML: "Imprimir",
            className: "btn btn-primary",
            style: "margin-top: 5px",
            id: "botonImpresion",
            onclick: function () {
                const tabla = document.getElementById('tabla_Boletin');

                tabla.classList.add('pdf');

                const config = {
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: {
                        scale: 2,
                        backgroundColor: '#ffffff'
                    },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                html2pdf().set(config).from(tabla).save('Reporte_Boletin_Informativo.pdf').then(() => {
                    tabla.classList.remove('pdf');
                });
            }
        });

        div.appendChild(boton);
    }

    return;

}

async function obtenerInscripciones() {
    const token = sessionStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/inscripcion`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const inscripciones = await response.json();

        if (!inscripciones.inscripciones) {
            notificar('Atencion!', inscripciones.mensaje);
            return;
        }

        renderizarTablaInscripciones(inscripciones.inscripciones);
        return;

    } catch (error) {
        notificar("Error", "No fue posible conectarse al servidor", "error");
        console.error(error);
        return;
    }

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
    try {

        const token = sessionStorage.getItem('token');

        const response = await fetch(`${API_URL}/inscripcion`, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: form
        });

        const data = await response.json();

        if (response.status === 401) {
            usuario_no_autenticado();
            return;
        }

        if (response.status === 400) {
            validarErrores("-inscripcionForm", data.error);
            return;
        }

        if (response.status === 500) {
            notificar("Error", data.mensaje, "error");
            return;
        }

        if (response.status === 201) {
            notificar('Operacion exitosa!', data.mensaje, "success");
            InscripcionForm.reset();
            return;
        }

    } catch (error) {
        notificar("Error", "No fue posible conectarse al servidor", "error");
        console.error(error);
    }
}

function notificar(titulo, mensaje, tipo = 'info') {

    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }


    const toast = document.createElement('div');
    toast.className = `toast-card ${tipo}`;


    let iconoSVG = '';

    if (tipo === 'success') iconoSVG = '✅';
    else if (tipo === 'error') iconoSVG = '❌';
    else iconoSVG = '🔔';


    toast.innerHTML = `
        <div class="toast-icon">${iconoSVG}</div>
        <div class="toast-content">
            <div class="toast-title">${titulo}</div>
            <div class="toast-message">${mensaje}</div>
            <button class="toast-btn">Aceptar</button>
        </div>
    `;


    container.appendChild(toast);


    const btn = toast.querySelector('.toast-btn');
    btn.addEventListener('click', () => {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    });
}


function validarErrores(clase, errores) {

    document.querySelectorAll('.error-div').forEach(div => div.innerHTML = '');

    for (const campo in errores) {

        const error = document.querySelector(`.error-div[data-field=${campo}${clase}]`);

        if (error) {
            error.style.cssText = 'font-size: 0.875rem; color: var(--danger)';
            error.innerHTML = errores[campo].join('<br>');
        }

    }

}
