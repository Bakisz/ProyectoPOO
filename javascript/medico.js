// ─── VERIFICACIÓN DE ACCESO ─────────────────────────────
const tipo = localStorage.getItem("tipo");
if (tipo !== "medico") {
  alert("Acceso denegado.");
  window.location.href = "index.html";
}

// ─── CARGAR MÉDICO DESDE LOCALSTORAGE ──────────────────
const datosMedico = localStorage.getItem("medico");
if (!datosMedico) {
  alert("No se encontró información del médico.");
  window.location.href = "index.html";
}

// Crear instancia de Medico
const medico = Object.assign(new Medico(), JSON.parse(datosMedico));

// ─── MOSTRAR SALUDO ─────────────────────────────────────
document.getElementById("tituloBienvenida").textContent = `Bienvenido ${medico.nombre || "(Sin nombre)"}`;

// ─── MOSTRAR CITAS ─────────────────────────────────────
const lista = document.getElementById("listaCitas");

function mostrarCitas() {
  lista.innerHTML = "";

  const claveHorarios = `horarios_ocupados_${medico.nombre}`;
  const horariosJSON = localStorage.getItem(claveHorarios);
  const horarios = horariosJSON ? JSON.parse(horariosJSON) : {};

  const citas = [];

  // Recorremos todas las fechas y horas ocupadas
  for (const fecha in horarios) {
    horarios[fecha].forEach(hora => {
      // Buscamos qué paciente tiene esa cita
      let nombrePaciente = "(desconocido)";
      for (let i = 0; i < localStorage.length; i++) {
        const clave = localStorage.key(i);
        if (clave?.startsWith("paciente_")) {
          const paciente = JSON.parse(localStorage.getItem(clave));
          if (!paciente?.citas) continue;

          const tieneCita = paciente.citas.some(c => c.fecha === fecha && c.hora === hora && c.medico === medico.nombre);
          if (tieneCita) {
            nombrePaciente = paciente.nombre;
            break;
          }
        }
      }

      citas.push({ fecha, hora, nombrePaciente });
    });
  }

  if (citas.length === 0) {
    lista.innerHTML = "<p>No hay citas programadas.</p>";
    return;
  }

  citas.forEach((cita, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>Paciente:</strong> ${cita.nombrePaciente}<br>
      <strong>Fecha:</strong> ${cita.fecha} - <strong>Hora:</strong> ${cita.hora}
      <button class="boton-secundario" style="margin-left: 90px;" onclick="cancelarCita('${cita.nombrePaciente}', '${cita.fecha}', '${cita.hora}')">Cancelar</button>
      <button class="boton-secundario" onclick="abrirReprogramacion('${cita.nombrePaciente}', '${cita.fecha}', '${cita.hora}')">Reprogramar</button>
    `;
    lista.appendChild(li);
  });
}



mostrarCitas();

function cancelarCita(nombrePaciente, fecha, hora) {
  const claveHorarios = `horarios_ocupados_${medico.nombre}`;
  const horarios = JSON.parse(localStorage.getItem(claveHorarios) || "{}");

  // ─── LIBERAR HORA DEL MÉDICO ───
  if (horarios[fecha]) {
    horarios[fecha] = horarios[fecha].filter(h => h !== hora);
    if (horarios[fecha].length === 0) delete horarios[fecha];
  }
  localStorage.setItem(claveHorarios, JSON.stringify(horarios));

  // ─── ELIMINAR CITA EN PACIENTE ───
  for (let i = 0; i < localStorage.length; i++) {
    const clave = localStorage.key(i);
    if (clave?.startsWith("paciente_")) {
      const paciente = JSON.parse(localStorage.getItem(clave));
      if (!paciente?.citas) continue;
      if (paciente.nombre !== nombrePaciente) continue;

      const nuevasCitas = paciente.citas.filter(c => {
        return !(c.fecha === fecha && c.hora === hora && c.medico === medico.nombre);
      });

      if (nuevasCitas.length !== paciente.citas.length) {
        paciente.citas = nuevasCitas;
        localStorage.setItem(clave, JSON.stringify(paciente));
      }

      break; // ya lo encontramos, no seguimos iterando
    }
  }

  alert("Cita cancelada.");
  mostrarCitas();
}



// ─── REPROGRAMAR CITA ──────────────────────────────────
let nombrePacienteActual = "";
let fechaOriginal = "";
let horaOriginal = "";

function abrirReprogramacion(nombrePaciente, fecha, hora) {
  nombrePacienteActual = nombrePaciente;
  fechaOriginal = fecha;
  horaOriginal = hora;

  document.getElementById("modalReprogramar").style.display = "flex";

  document.getElementById("fechaNueva").value = fecha;
  document.getElementById("fechaNueva").onchange = cargarHorasDisponibles;

  cargarHorasDisponibles();
}


function cargarHorasDisponibles() {
  const fecha = document.getElementById("fechaNueva").value;
  const select = document.getElementById("horaNueva");

  select.innerHTML = "<option value=''>Selecciona una hora</option>";
  medico.generarHorarios(fecha);

  const disponibles = medico.horariosDisponibles[fecha] || [];
  disponibles.forEach(hora => {
    const opt = document.createElement("option");
    opt.value = hora;
    opt.textContent = hora;
    select.appendChild(opt);
  });
}

function confirmarReprogramacion() {
  const nuevaFecha = document.getElementById("fechaNueva").value;
  const nuevaHora = document.getElementById("horaNueva").value;

  if (!nuevaFecha || !nuevaHora) {
    alert("Debes seleccionar una nueva fecha y hora.");
    return;
  }

  const claveHorarios = `horarios_ocupados_${medico.nombre}`;
  const horarios = JSON.parse(localStorage.getItem(claveHorarios) || "{}");

  // Liberar la hora antigua
  if (horarios[fechaOriginal]) {
    horarios[fechaOriginal] = horarios[fechaOriginal].filter(h => h !== horaOriginal);
    if (horarios[fechaOriginal].length === 0) delete horarios[fechaOriginal];
  }

  // Ocupar la nueva hora
  if (!horarios[nuevaFecha]) horarios[nuevaFecha] = [];
  horarios[nuevaFecha].push(nuevaHora);

  localStorage.setItem(claveHorarios, JSON.stringify(horarios));

  // ─── ACTUALIZAR LA CITA EN EL PACIENTE ───
  for (let i = 0; i < localStorage.length; i++) {
    const clave = localStorage.key(i);
    if (clave?.startsWith("paciente_")) {
      const paciente = JSON.parse(localStorage.getItem(clave));
      if (!paciente?.citas || paciente.nombre !== nombrePacienteActual) continue;

      const cita = paciente.citas.find(c =>
        c.fecha === fechaOriginal &&
        c.hora === horaOriginal &&
        c.medico === medico.nombre
      );

      if (cita) {
        cita.fecha = nuevaFecha;
        cita.hora = nuevaHora;
        localStorage.setItem(clave, JSON.stringify(paciente));
      }

      break;
    }
  }

  alert("Cita reprogramada con éxito.");
  document.getElementById("modalReprogramar").style.display = "none";
  mostrarCitas();
}


function cerrarModal() {
  document.getElementById("modalReprogramar").style.display = "none";
  indexActualReprogramacion = null;
}
