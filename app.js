// ESTADO GLOBAL
let citas = JSON.parse(localStorage.getItem('cosmocare_citas')) || [];
let filtroCriterioOrden = 'fecha';
const usuarioActivo = { nombre: "Ana", avatar: "" };

function mostrarSeccion(idSeccion) {
    document.getElementById('sec-landing').classList.add('hidden');
    document.getElementById('sec-reserva').classList.add('hidden');
    document.getElementById('sec-dashboard').classList.add('hidden');
    document.getElementById(`sec-${idSeccion}`).classList.remove('hidden');

    if (idSeccion === 'dashboard') {
        actualizarDashboard();
    }
}

function guardarEnLocalStorage() {
    localStorage.setItem('cosmocare_citas', JSON.stringify(citas));
}

function mostrarNotificacion(mensaje, tipo = 'success') {
    const toast = document.getElementById('toast');
    toast.innerText = mensaje;
    toast.className = `toast ${tipo}`;
    setTimeout(() => { toast.className = 'toast hidden'; }, 3000);
}

// CONTROL DE CARACTERES
const formulario = document.getElementById('form-cita');
const observacionesInput = document.getElementById('observaciones');

observacionesInput.addEventListener('input', (e) => {
    const longitud = e.target.value.length;
    document.getElementById('char-count').innerText = `${longitud} / 200`;
    document.getElementById('char-count').style.color = longitud > 200 ? 'red' : 'var(--texto-secundario)';
});

// FORMULARIO SUBMIT
formulario.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('cita-id').value;
    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    const servicio = document.getElementById('servicio').value;
    const estado = document.getElementById('estado').value;
    const observaciones = observacionesInput.value.trim();

    // Validaciones Obligatorias
    if (!nombre || !telefono || !correo || !fecha || !hora || !servicio) {
        mostrarNotificacion('Todos los campos obligatorios (*) deben ser completados.', 'error');
        return;
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre) || nombre.length < 3) {
        mostrarNotificacion('El nombre debe tener mínimo 3 caracteres y solo letras.', 'error');
        return;
    }
    if (!/^[0-9]+$u/.test(telefono)) { // Expresión corregida y simplificada para evitar fallos
        if (isNaN(telefono)) {
            mostrarNotificacion('El teléfono debe contener únicamente números.', 'error');
            return;
        }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        mostrarNotificacion('Formato de correo electrónico inválido.', 'error');
        return;
    }
    if (fecha < new Date().toISOString().split('T')[0]) {
        mostrarNotificacion('La fecha no puede ser anterior al día de hoy.', 'error');
        return;
    }
    if (hora < "08:00" || hora > "18:00") {
        mostrarNotificacion('Horario permitido: 08:00 AM a 06:00 PM.', 'error');
        return;
    }

    // Cruces y Conflictos
    const otrasCitas = citas.filter(c => c.id !== id);
    if (otrasCitas.some(c => c.fecha === fecha && c.hora === hora)) {
        mostrarNotificacion('Conflicto de Horario: Bloque de tiempo ya reservado.', 'error');
        return;
    }

    // Procesar Cita
    let citaProcesada;
    if (id) {
        if (confirm('¿Desea guardar los cambios importantes de esta cita?')) {
            const index = citas.findIndex(c => c.id === id);
            citas[index] = { id, nombre, telefono, correo, fecha, hora, servicio, estado, observaciones };
            citaProcesada = citas[index];
            mostrarNotificacion('Cita actualizada correctamente.');
        } else { return; }
    } else {
        citaProcesada = {
            id: 'ID-' + Date.now(),
            nombre, telefono, correo, fecha, hora, servicio, estado, observaciones
        };
        citas.push(citaProcesada);
        mostrarNotificacion('Cita registrada correctamente.');

// SIMULACIÓN DE ENVÍO DE CORREO AUTOMÁTICO ---
        dispararSimulacionCorreo(citaProcesada);
    }

    guardarEnLocalStorage();
    limpiarFormulario();
    mostrarSeccion('dashboard');
});

function limpiarFormulario() {
    formulario.reset();
    document.getElementById('cita-id').value = '';
    document.getElementById('char-count').innerText = '0 / 200';
    document.getElementById('btn-guardar').innerText = 'Confirmar Reserva';
}

// ==========================================
// DESAFÍO EXTRA: SIMULAR ENVÍO DE CORREO
// ==========================================
function dispararSimulacionCorreo(cita) {
    const modal = document.getElementById('modal-correo');
    const cuerpo = document.getElementById('correo-cuerpo');

    cuerpo.innerHTML = `
        <p><strong>De:</strong> notificaciones@cosmocare.com</p>
        <p><strong>Para:</s
        1010101111025655646451242124010101100110010100110100101025655410256545410trong> ${cita.correo}</p>
        <p><strong>Asunto:</strong> ¡Tu cita en CosmoCare está Agendada! ✨</p>
        <hr style="margin:1rem 0; border:0; border-top:1px solid #ccc;">
        <p>Hola <strong>${cita.nombre}</strong>,</p>
        <p>Queremos confirmarte que hemos recibido tu solicitud de reserva para el servicio de <strong>${cita.servicio}</strong>.</p>
        <p>📅 <strong>Fecha:</strong> ${cita.fecha}<br>🕒 <strong>Hora:</strong> ${cita.hora}</p>
        <p>Te esperamos en nuestras instalaciones. Si requieres cancelar o reprogramar, comunícate al número ${cita.telefono}.</p>
    `;
    modal.classList.remove('hidden'); // Muestra la simulación en pantalla
}

function cerrarModalCorreo() {
    document.getElementById('modal-correo').classList.add('hidden');
}

// ==========================================
// RENDER DEL DASHBOARD Y FILTRO EN TIEMPO REAL
// ==========================================
function actualizarDashboard() {
    const hoy = new Date().toISOString().split('T')[0];

    // Contadores Automáticos
    document.getElementById('ind-total').innerText = citas.length;
    document.getElementById('ind-pendiente').innerText = citas.filter(c => c.estado === 'Pendiente').length;
    document.getElementById('ind-confirmada').innerText = citas.filter(c => c.estado === 'Confirmada').length;
    document.getElementById('ind-cancelada').innerText = citas.filter(c => c.estado === 'Cancelada').length;
    document.getElementById('ind-finalizada').innerText = citas.filter(c => c.estado === 'Finalizada').length;

    const citasHoy = citas.filter(c => c.fecha === hoy).length;
    document.getElementById('ind-hoy').innerText = citasHoy;

    document.getElementById('saludo-admin').innerHTML = `
        <p>${usuarioActivo.avatar} Bienvenido, ${usuarioActivo.nombre}. Hoy tienes <strong>${citasHoy}</strong> citas programadas.</p>
    `;

    // Barra de Progreso Dinámica
    const porcentaje = Math.min((citasHoy / 10) * 100, 100);
    const barra = document.getElementById('progreso-dia');
    barra.style.width = `${porcentaje}%`;
    barra.innerText = `${Math.round(porcentaje)}% Lleno`;

    filtrarYMostrarCitas();
}

function filtrarYMostrarCitas() {
    const texto = document.getElementById('buscar').value.toLowerCase();
    const estado = document.getElementById('filtro-estado').value;
    const servicio = document.getElementById('filtro-servicio').value;
    const fecha = document.getElementById('filtro-fecha').value;

    // Filtro en tiempo real combinado
    let filtradas = citas.filter(c => {
        const matchTexto = c.nombre.toLowerCase().includes(texto) || c.correo.toLowerCase().includes(texto) || c.telefono.includes(texto);
        const matchEstado = (estado === 'Todos') || (c.estado === estado);
        const matchServicio = (servicio === 'Todos') || (c.servicio === servicio);
        const matchFecha = (!fecha) || (c.fecha === fecha);
        return matchTexto && matchEstado && matchServicio && matchFecha;
    });

    // Ordenamiento Dinámico
    filtradas.sort((a, b) => {
        return filtroCriterioOrden === 'fecha'
            ? (a.fecha + a.hora).localeCompare(b.fecha + b.hora)
            : a.nombre.localeCompare(b.nombre);
    });

    const tbody = document.getElementById('lista-citas');
    tbody.innerHTML = '';

    if (filtradas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay resultados.</td></tr>`;
        return;
    }

    filtradas.forEach(c => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${c.nombre}</strong></td>
            <td>${c.telefono}<br><small>${c.correo}</small></td>
            <td>${c.fecha}<br><small>${c.hora}</small></td>
            <td>${c.servicio}</td>
            <td><span class="badge ${c.estado}">${c.estado}</span></td>
            <td>
                <button class="btn-accion btn-edit" onclick="cargarCitaEdicion('${c.id}')"><span class="material-symbols-outlined" style="font-size:16px;">edit</span></button>
                <button class="btn-accion btn-del" onclick="eliminarCita('${c.id}')"><span class="material-symbols-outlined" style="font-size:16px;">delete</span></button>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

function limpiarFiltros() {
    document.getElementById('buscar').value = '';
    document.getElementById('filtro-estado').value = 'Todos';
    document.getElementById('filtro-servicio').value = 'Todos';
    document.getElementById('filtro-fecha').value = '';
    filtrarYMostrarCitas();
}

function ordenarCitas(criterio) {
    filtroCriterioOrden = criterio;
    filtrarYMostrarCitas();
}

function cargarCitaEdicion(id) {
    const c = citas.find(cita => cita.id === id);
    if (!c) return;

    document.getElementById('cita-id').value = c.id;
    document.getElementById('nombre').value = c.nombre;
    document.getElementById('telefono').value = c.telefono;
    document.getElementById('correo').value = c.correo;
    document.getElementById('fecha').value = c.fecha;
    document.getElementById('hora').value = c.hora;
    document.getElementById('servicio').value = c.servicio;
    document.getElementById('estado').value = c.estado;
    observacionesInput.value = c.observaciones;

    document.getElementById('btn-guardar').innerText = 'Guardar Cambios';
    mostrarSeccion('reserva');
}

function eliminarCita(id) {
    if (confirm('¿Desea eliminar esta cita de forma permanente?')) {
        citas = citas.filter(c => c.id !== id);
        guardarEnLocalStorage();
        actualizarDashboard();
        mostrarNotificacion('Cita eliminada correctamente.', 'error');
    }
}
function filtrarCitasDeHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    // Colocamos de forma automática la fecha de hoy en el input del filtro
    document.getElementById('filtro-fecha').value = hoy;
    // Ejecutamos la función de filtrado que ya tienes hecha
    filtrarYMostrarCitas();
    mostrarNotificacion('Mostrando la agenda del día de hoy.');
}

// ==========================================
// DESAFÍO EXTRA: EXPORTAR CITAS A EXCEL (CSV)
// ==========================================
function exportarExcelCSV() {
    if (citas.length === 0) {
        mostrarNotificacion('No hay registros de citas para exportar.', 'error');
        return;
    }

    // Cabeceras del documento CSV
    let contenidoCsv = "ID,Nombre,Telefono,Correo,Fecha,Hora,Servicio,Estado,Observaciones\n";

    // Recorremos el array y lo agregamos por líneas limpiando saltos de texto
    citas.forEach(c => {
        let fila = `"${c.id}","${c.nombre}","${c.telefono}","${c.correo}","${c.fecha}","${c.hora}","${c.servicio}","${c.estado}","${c.observaciones.replace(/\n/g, ' ')}"`;
        contenidoCsv += fila + "\n";
    });

    // Crear un elemento invisible de descarga nativo del navegador
    const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "Reporte_Citas_CosmoCare.csv");
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click(); // Dispara la descarga del archivo
    document.body.removeChild(link);

    mostrarNotificacion('Reporte exportado exitosamente para Excel.');
}

// TEMA
function alternarTema() {
    const body = document.body;
    const icono = document.getElementById('theme-icon');

    if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        icono.innerText = 'light_mode';
        localStorage.setItem('cosmocare_theme', 'dark');
    } else {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        icono.innerText = 'dark_mode';
        localStorage.setItem('cosmocare_theme', 'light');
    }
}

(function cargarPreferenciasTema() {
    if (localStorage.getItem('cosmocare_theme') === 'dark') {
        document.body.className = 'dark-theme';
        document.getElementById('theme-icon').innerText = 'light_mode';
    }
})();