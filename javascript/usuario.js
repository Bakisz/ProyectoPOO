const tipo = localStorage.getItem("tipo");
if (tipo !== "paciente") {
  alert("Acceso denegado.");
  window.location.href = "index.html";
}

const admin = Administrador.cargar();
const pacienteLogeado = Object.assign(new Paciente(), JSON.parse(localStorage.getItem("paciente")));

window.addEventListener("DOMContentLoaded", () => {
  if (!pacienteLogeado) {
    alert("Paciente no encontrado en sesión.");
    window.location.href = "index.html";
    return;
  }

  const nombrePacienteSpan = document.getElementById("nombrePaciente");
  if (nombrePacienteSpan) {
    nombrePacienteSpan.textContent = `Bienvenido, ${pacienteLogeado.nombre}`;
  }

  const selectMedico = document.getElementById("medicoSelect");
  const inputFecha = document.getElementById("fechaInput");
  const inputHora = document.getElementById("horaInput");
  const btnAgendar = document.getElementById("btnAgendarCita");
  const contenedorCitas = document.getElementById("misCitas");

  function obtenerHorariosOcupados(nombreMedico) {
    const key = `horarios_ocupados_${nombreMedico}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {};
  }

  function guardarHorarioOcupado(nombreMedico, fecha, hora) {
    const key = `horarios_ocupados_${nombreMedico}`;
    const horarios = obtenerHorariosOcupados(nombreMedico);

    if (!horarios[fecha]) {
      horarios[fecha] = [];
    }

    if (!horarios[fecha].includes(hora)) {
      horarios[fecha].push(hora);
    }

    localStorage.setItem(key, JSON.stringify(horarios));
  }

  function cargarMedicos() {
    const medicos = admin.obtenerTodosMedicos();
    medicos.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.nombre;
      opt.textContent = `${m.nombre} (${m.especialidad})`;
      selectMedico.appendChild(opt);
    });
  }

  function actualizarHorasDisponibles() {
    const nombreMedico = selectMedico.value;
    const fecha = inputFecha.value;
    inputHora.innerHTML = "<option value=''>Selecciona una hora</option>";

    if (!nombreMedico || !fecha) return;

    const todas = [];
    for (let h = 8; h <= 16; h++) {
      todas.push((h < 10 ? "0" : "") + h + ":00");
    }

    const ocupadas = obtenerHorariosOcupados(nombreMedico)[fecha] || [];
    const disponibles = todas.filter(h => !ocupadas.includes(h));

    disponibles.forEach(hora => {
      const opt = document.createElement("option");
      opt.value = hora;
      opt.textContent = hora;
      inputHora.appendChild(opt);
    });
  }

  function agendarCita() {
    const nombreMedico = selectMedico.value;
    const fecha = inputFecha.value;
    const hora = inputHora.value;

    if (!nombreMedico || !fecha || !hora) {
      alert("Completa todos los campos.");
      return;
    }

    const horarios = obtenerHorariosOcupados(nombreMedico);
    if (horarios[fecha]?.includes(hora)) {
      alert("La hora ya está ocupada.");
      return;
    }

    // Guardar cita en paciente
    pacienteLogeado.agendarCita(nombreMedico, fecha, hora);
    pacienteLogeado.guardar();

    // Guardar la hora como ocupada
    guardarHorarioOcupado(nombreMedico, fecha, hora);

    alert("Cita agendada correctamente.");
    location.reload();
  }

  function mostrarMisCitas() {
    const citas = pacienteLogeado.citas || [];
    contenedorCitas.innerHTML = "<h3>Mis Citas</h3>";

    if (citas.length === 0) {
      contenedorCitas.innerHTML += "<p>No tienes citas agendadas.</p>";
      return;
    }

    const ul = document.createElement("ul");
    citas.forEach((cita, index) => {
      const li = document.createElement("li");
      li.textContent = `Con Dra. ${cita.medico} el ${cita.fecha} a las ${cita.hora} `;

      const btnCancelar = document.createElement("button");
      btnCancelar.textContent = "Cancelar";
      btnCancelar.onclick = () => cancelarCita(index);

      li.appendChild(btnCancelar);
      ul.appendChild(li);
    });

    contenedorCitas.appendChild(ul);
  }
  function cancelarCita(index) {
    const cita = pacienteLogeado.citas[index];
    if (!cita) return;

    const medico = Medico.cargar(cita.medico);
    if (medico) {
      medico.liberarHorario(cita.fecha, cita.hora);
      medico.citas = medico.citas.filter(c => c.fecha !== cita.fecha || c.hora !== cita.hora || c.paciente !== pacienteLogeado.nombre);
      medico.guardar();
    }

    pacienteLogeado.citas.splice(index, 1);
    pacienteLogeado.guardar();

    alert("Cita cancelada.");
    location.reload();
  }



  cargarMedicos();
  mostrarMisCitas();
  selectMedico.addEventListener("change", actualizarHorasDisponibles);
  inputFecha.addEventListener("change", actualizarHorasDisponibles);
  btnAgendar.addEventListener("click", agendarCita);
});
