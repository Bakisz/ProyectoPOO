// === js/admin.js ===

if (!localStorage.getItem("admin")) {
  const admin = new Administrador("Administrador General", "admin", "admin123");
  localStorage.setItem("admin", JSON.stringify(admin));
}
const admin = Administrador.cargar();

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

function agendarCita() {
  const pacienteNombre = document.getElementById("pacienteCita").value;
  const medicoNombre = document.getElementById("medicoCita").value;
  const fecha = document.getElementById("fechaCita").value;
  const hora = document.getElementById("horaCita").value;
  if (pacienteNombre && medicoNombre && fecha && hora) {
    admin.agendarCita(pacienteNombre, medicoNombre, fecha, hora);
    alert("Cita agendada exitosamente.");
  } else {
    alert("Complete todos los campos para agendar la cita.");
  }
}

function cancelarCita() {
  const medicoNombre = document.getElementById("medicoCancelar").value;
  const idCita = parseInt(document.getElementById("idCitaCancelar").value);
  if (medicoNombre && idCita) {
    admin.cancelarCita(medicoNombre, idCita);
    alert("Cita cancelada.");
  } else {
    alert("Seleccione un médico y una cita válida.");
  }
}

function reprogramarCita() {
  const medicoNombre = document.getElementById("medicoReprogramar").value;
  const idCita = parseInt(document.getElementById("idCitaReprogramar").value);
  const nuevaFecha = document.getElementById("nuevaFecha").value;
  const nuevaHora = document.getElementById("nuevaHora").value;
  if (medicoNombre && idCita && nuevaFecha && nuevaHora) {
    admin.reprogramarCita(medicoNombre, idCita, nuevaFecha, nuevaHora);
    alert("Cita reprogramada.");
  } else {
    alert("Complete todos los campos para reprogramar.");
  }
}

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
  mostrarResultados(citas.map(c => `ID: ${c.id}, ${c.paciente} con ${c.medico} el ${c.fecha} a las ${c.hora}`));
}

function verHorariosDisponibles() {
  const nombre = document.getElementById("selectNombreMedico").value;
  const fecha = document.getElementById("inputFecha").value;
  const resultado = document.getElementById("resultadoDisponibilidad");

  if (!nombre || !fecha) {
    resultado.innerHTML = "<span style='color: orange'>⚠️ Ingrese nombre del médico y fecha.</span>";
    return;
  }

  const medico = admin.obtenerTodosMedicos().find(m => m.nombre === nombre);
  if (!medico) {
    resultado.innerHTML = "<span style='color: red'>❌ Médico no encontrado.</span>";
    return;
  }

  const ocupadas = medico.citas
    .filter(c => c.fecha === fecha)
    .map(c => c.hora);

  let contenido = "";
  for (let h = 8; h <= 17; h++) {
    const horaStr = h.toString().padStart(2, "0") + ":00";
    if (ocupadas.includes(horaStr)) {
      contenido += `<li>${horaStr} <span style="color: red">(no disponible)</span></li>`;
    } else {
      contenido += `<li>${horaStr} <span style="color: green">(disponible)</span></li>`;
    }
  }

  resultado.innerHTML = "<ul>" + contenido + "</ul>";
}



function mostrarResultados(lista) {
  const contenedor = document.getElementById("listadoResultados");
  contenedor.innerHTML = "<ul>" + lista.map(i => `<li>${i}</li>`).join("") + "</ul>";
}

window.addEventListener("DOMContentLoaded", () => {
  const tipo = localStorage.getItem("tipo");
  if (tipo !== "admin") {
    alert("Acceso denegado.");
    window.location.href = "index.html";
    return;
  }

  const admin = Administrador.cargar();

  if (!admin) {
    alert("Administrador no encontrado en localStorage.");
    return;
  }

  const pacientes = admin.obtenerTodosPacientes();
  const medicos = admin.obtenerTodosMedicos();

  const pacienteSelect = document.getElementById("pacienteCita");
  const medicoSelect = document.getElementById("medicoCita");
  const medicoCancelar = document.getElementById("medicoCancelar");
  const medicoReprogramar = document.getElementById("medicoReprogramar");

  pacientes.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.nombre;
    opt.textContent = p.nombre;
    pacienteSelect.appendChild(opt);
  });

  [medicoSelect, medicoCancelar, medicoReprogramar].forEach(select => {
    medicos.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.nombre;
      opt.textContent = `${m.nombre} (${m.especialidad})`;
      select.appendChild(opt);
    });
  });
  const selectNombreMedico = document.getElementById("selectNombreMedico");
  if (selectNombreMedico) {
    medicos.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.nombre;
      opt.textContent = `${m.nombre} (${m.especialidad})`;
      selectNombreMedico.appendChild(opt);
    });

    // 👉 Cuando se cambia de médico, se limpia el resultado anterior
    selectNombreMedico.addEventListener("change", () => {
      const resultado = document.getElementById("resultadoDisponibilidad");
      if (resultado) resultado.innerHTML = "";
    });
    inputFecha.addEventListener("change", () => {
      const resultado = document.getElementById("resultadoDisponibilidad");
      if (resultado) resultado.innerHTML = "";
    });
  }


  const btnVerHorarios = document.getElementById("btnVerHorarios");
  if (btnVerHorarios) {
    btnVerHorarios.addEventListener("click", verHorariosDisponibles);
  }


});


