// === admin.js ===

if (!localStorage.getItem("admin")) {
  const admin = new Administrador("Administrador General", "admin", "admin123");
  localStorage.setItem("admin", JSON.stringify(admin));
}
const admin = Administrador.cargar();

// ─── REGISTRAR MÉDICO ────────────────────────────────
function registrarMedico() {
  const nombre = document.getElementById("nombreMedico").value;
  const especialidad = document.getElementById("especialidadMedico").value;
  const username = document.getElementById("usernameMedico").value;
  const password = document.getElementById("passwordMedico").value;

  if (nombre && especialidad && username && password) {
    admin.registrarMedico(nombre, especialidad, username, password);
    alert("Médico registrado exitosamente.");
    location.reload();
  } else {
    alert("Por favor, complete todos los campos.");
  }
}

// ─── AGENDAR CITA ─────────────────────────────────────
function agendarCita() {
  const pacienteNombre = document.getElementById("pacienteCita").value;
  const medicoNombre = document.getElementById("medicoCita").value;
  const fecha = document.getElementById("fechaCita").value;
  const hora = document.getElementById("horaCita").value;

  if (!pacienteNombre || !medicoNombre || !fecha || !hora) {
    alert("Complete todos los campos para agendar la cita.");
    return;
  }

  const horarios = obtenerHorariosOcupados(medicoNombre);
  if (horarios[fecha]?.includes(hora)) {
    alert("La hora ya está ocupada para el médico seleccionado.");
    return;
  }

  const pacienteClave = Object.keys(localStorage).find(
    key => key.startsWith("paciente_") && JSON.parse(localStorage.getItem(key)).nombre === pacienteNombre
  );

  if (!pacienteClave) {
    alert("Paciente no encontrado.");
    return;
  }

  const paciente = JSON.parse(localStorage.getItem(pacienteClave));
  paciente.citas = paciente.citas || [];
  paciente.citas.push({ fecha, hora, medico: medicoNombre });
  localStorage.setItem(pacienteClave, JSON.stringify(paciente));

  guardarHorarioOcupado(medicoNombre, fecha, hora);
  alert("Cita agendada correctamente.");
  location.reload();
}

function obtenerHorariosOcupados(nombreMedico) {
  const clave = `horarios_ocupados_${nombreMedico}`;
  return JSON.parse(localStorage.getItem(clave) || "{}");
}

function guardarHorarioOcupado(nombreMedico, fecha, hora) {
  const clave = `horarios_ocupados_${nombreMedico}`;
  const horarios = obtenerHorariosOcupados(nombreMedico);
  if (!horarios[fecha]) horarios[fecha] = [];
  horarios[fecha].push(hora);
  localStorage.setItem(clave, JSON.stringify(horarios));
}

// ─── CANCELAR CITA (USANDO LISTA) ─────────────────────
function mostrarCitasDelMedico() {
  const nombreMedico = document.getElementById("medicoCancelar").value;
  const lista = document.getElementById("listaCitas");
  lista.innerHTML = "";

  if (!nombreMedico) return;

  const horarios = obtenerHorariosOcupados(nombreMedico);
  const citas = [];

  for (const fecha in horarios) {
    horarios[fecha].forEach(hora => {
      let nombrePaciente = "(desconocido)";
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("paciente_")) {
          const paciente = JSON.parse(localStorage.getItem(key));
          if (!paciente?.citas) continue;
          const tieneCita = paciente.citas.some(c =>
            c.fecha === fecha && c.hora === hora && c.medico === nombreMedico
          );
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
    lista.innerHTML = "<p>No hay citas para este médico.</p>";
    return;
  }

  citas.forEach((cita) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>Paciente:</strong> ${cita.nombrePaciente}<br>
      <strong>Fecha:</strong> ${cita.fecha} - <strong>Hora:</strong> ${cita.hora}
      <button onclick="cancelarCitaAdmin('${nombreMedico}', '${cita.nombrePaciente}', '${cita.fecha}', '${cita.hora}')">Cancelar</button>
    `;
    lista.appendChild(li);
  });
}

function cancelarCitaAdmin(nombreMedico, nombrePaciente, fecha, hora) {
  const horarios = obtenerHorariosOcupados(nombreMedico);
  if (horarios[fecha]) {
    horarios[fecha] = horarios[fecha].filter(h => h !== hora);
    if (horarios[fecha].length === 0) delete horarios[fecha];
    localStorage.setItem(`horarios_ocupados_${nombreMedico}`, JSON.stringify(horarios));
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key.startsWith("paciente_")) continue;
    const paciente = JSON.parse(localStorage.getItem(key));
    if (paciente.nombre !== nombrePaciente) continue;
    paciente.citas = paciente.citas.filter(c =>
      !(c.fecha === fecha && c.hora === hora && c.medico === nombreMedico)
    );
    localStorage.setItem(key, JSON.stringify(paciente));
    break;
  }

  alert("Cita cancelada correctamente.");
  mostrarCitasDelMedico();
}

// ─── VER DATOS ────────────────────────────────────────
function verMedicos() {
  const medicos = admin.obtenerTodosMedicos();
  mostrarResultados(medicos.map(m => `${m.nombre} - ${m.especialidad}`));
}

function verPacientes() {
  const pacientes = admin.obtenerTodosPacientes();
  mostrarResultados(pacientes.map(p => `${p.nombre} (${p.rut}) - ${p.telefono}`));
}

function verCitas() {
  const citas = admin.obtenerTodasCitas();
  mostrarResultados(citas.map((c, i) => `${c.paciente} con ${c.medico} el ${c.fecha} a las ${c.hora}`));
}

function mostrarResultados(lista) {
  const contenedor = document.getElementById("listadoResultados");
  contenedor.innerHTML = "<ul>" + lista.map(i => `<li>${i}</li>`).join("") + "</ul>";
}

// ─── INICIALIZAR ──────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("tipo") !== "admin") {
    alert("Acceso denegado.");
    window.location.href = "index.html";
    return;
  }

  const pacientes = admin.obtenerTodosPacientes();
  const medicos = admin.obtenerTodosMedicos();

  pacientes.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.nombre;
    opt.textContent = p.nombre;
    document.getElementById("pacienteCita").appendChild(opt);
  });

  const medicoSelects = [
    "medicoCita", "medicoCancelar"
  ].map(id => document.getElementById(id)).filter(Boolean);

  medicoSelects.forEach(select => {
    medicos.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.nombre;
      opt.textContent = `${m.nombre} (${m.especialidad})`;
      select.appendChild(opt);
    });
  });

  // Horarios disponibles para agendar
  const horaCitaSelect = document.getElementById("horaCita");
  function actualizarHorasDisponiblesAdmin() {
    const medicoNombre = document.getElementById("medicoCita").value;
    const fecha = document.getElementById("fechaCita").value;
    horaCitaSelect.innerHTML = '<option value="">Seleccione hora</option>';

    if (!medicoNombre || !fecha) return;

    const horarios = obtenerHorariosOcupados(medicoNombre);
    const ocupadas = horarios[fecha] || [];

    for (let h = 8; h <= 17; h++) {
      const horaStr = h.toString().padStart(2, "0") + ":00";
      if (!ocupadas.includes(horaStr)) {
        const opt = document.createElement("option");
        opt.value = horaStr;
        opt.textContent = horaStr;
        horaCitaSelect.appendChild(opt);
      }
    }
  }

  document.getElementById("medicoCita").addEventListener("change", actualizarHorasDisponiblesAdmin);
  document.getElementById("fechaCita").addEventListener("change", actualizarHorasDisponiblesAdmin);
  document.getElementById("medicoCancelar").addEventListener("change", mostrarCitasDelMedico);
});
