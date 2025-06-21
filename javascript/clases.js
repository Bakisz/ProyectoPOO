class Cita {
  constructor(id, paciente, medico, fecha, hora) {
    this.id = id || Date.now();
    this.paciente = paciente;
    this.medico = medico;
    this.fecha = fecha;
    this.hora = hora;
  }
}

class Paciente {
  constructor(nombre, rut, telefono, username, password) {
    this.nombre = nombre;
    this.rut = rut;
    this.telefono = telefono;
    this.username = username;
    this.password = password;
    this.citas = [];
  }

  agendarCita(medico, fecha, hora) {
    const nuevaCita = new Cita(null, this.nombre, medico.nombre, fecha, hora);
    this.citas.push(nuevaCita);
    medico.recibirCita(nuevaCita);
    medico.reservarHorario(fecha, hora); // ← Nuevo
    this.guardar();
  }

  cancelarCita(idCita) {
    const cita = this.citas.find(c => c.id === idCita);
    if (cita) {
      const medico = Medico.cargar(cita.medico);
      if (medico) {
        medico.liberarHorario(cita.fecha, cita.hora); // ← Nuevo
      }
    }
    this.citas = this.citas.filter(c => c.id !== idCita);
    this.guardar();
  }

  reprogramarCita(idCita, nuevaFecha, nuevaHora) {
    const cita = this.citas.find(c => c.id === idCita);
    if (cita) {
      const medico = Medico.cargar(cita.medico);
      if (medico) {
        medico.liberarHorario(cita.fecha, cita.hora);     // libera anterior
        medico.reservarHorario(nuevaFecha, nuevaHora);    // reserva nuevo
      }
      cita.fecha = nuevaFecha;
      cita.hora = nuevaHora;
      this.guardar();
    }
  }

  guardar() {
    localStorage.setItem(`paciente_${this.rut}`, JSON.stringify(this));
  }

  static cargar(rut) {
    const data = localStorage.getItem(`paciente_${rut}`);
    return data ? Object.assign(new Paciente(), JSON.parse(data)) : null;
  }
}

class Medico {
  constructor(nombre, especialidad, username, password) {
    this.nombre = nombre;
    this.especialidad = especialidad;
    this.username = username;
    this.password = password;
    this.citas = [];
    this.horariosDisponibles = {}; // { "2025-06-21": ["08:00", "09:00", ...] }
  }

  generarHorarios(fecha) {
    if (!this.horariosDisponibles[fecha]) {
      this.horariosDisponibles[fecha] = [];
      for (let h = 8; h <= 16; h++) {
        this.horariosDisponibles[fecha].push((h < 10 ? "0" : "") + h + ":00");
      }
    }
  }

  recibirCita(cita) {
    this.citas.push(cita);
    this.guardar();
  }

  cancelarCita(idCita) {
    this.citas = this.citas.filter(c => c.id !== idCita);
    this.guardar();
  }

  reservarHorario(fecha, hora) {
    this.generarHorarios(fecha);
    this.horariosDisponibles[fecha] = this.horariosDisponibles[fecha].filter(h => h !== hora);
    this.guardar();
  }

  liberarHorario(fecha, hora) {
    this.generarHorarios(fecha);
    if (!this.horariosDisponibles[fecha].includes(hora)) {
      this.horariosDisponibles[fecha].push(hora);
      this.horariosDisponibles[fecha].sort(); // Opcional
    }
    this.guardar();
  }

  reprogramarCita(idCita, nuevaFecha, nuevaHora) {
    const cita = this.citas.find(c => c.id === idCita);
    if (cita) {
      this.liberarHorario(cita.fecha, cita.hora);
      cita.fecha = nuevaFecha;
      cita.hora = nuevaHora;
      this.reservarHorario(nuevaFecha, nuevaHora);
      this.guardar();
    }
  }

  guardar() {
    localStorage.setItem(`medico_${this.nombre}`, JSON.stringify(this));
  }

  static cargar(nombre) {
    const data = localStorage.getItem(`medico_${nombre}`);
    return data ? Object.assign(new Medico(), JSON.parse(data)) : null;
  }
}

class Administrador {
  constructor(nombre, username, password) {
    this.nombre = nombre;
    this.username = username;
    this.password = password;
  }

  registrarMedico(nombre, especialidad, username, password) {
    const nuevoMedico = new Medico(nombre, especialidad, username, password);
    nuevoMedico.guardar();
  }

  obtenerTodosMedicos() {
    const medicos = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("medico_")) {
        const data = JSON.parse(localStorage.getItem(key));
        medicos.push(Object.assign(new Medico(), data));
      }
    }
    return medicos;
  }

  obtenerTodosPacientes() {
    const pacientes = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("paciente_")) {
        const data = JSON.parse(localStorage.getItem(key));
        pacientes.push(Object.assign(new Paciente(), data));
      }
    }
    return pacientes;
  }

  obtenerTodasCitas() {
    const medicos = this.obtenerTodosMedicos();
    return medicos.flatMap(m => m.citas);
  }

  agendarCita(pacienteNombre, medicoNombre, fecha, hora) {
    const pacientes = this.obtenerTodosPacientes();
    const paciente = pacientes.find(p => p.nombre === pacienteNombre);
    const medicos = this.obtenerTodosMedicos();
    const medico = medicos.find(m => m.nombre === medicoNombre);
    if (paciente && medico) {
      paciente.agendarCita(medico, fecha, hora);
    }
  }

  cancelarCita(medicoNombre, idCita) {
    const medicos = this.obtenerTodosMedicos();
    const medico = medicos.find(m => m.nombre === medicoNombre);
    if (medico) {
      const cita = medico.citas.find(c => c.id === idCita);
      if (cita) {
        medico.liberarHorario(cita.fecha, cita.hora); // NUEVO
      }
      medico.cancelarCita(idCita);
    }
    const pacientes = this.obtenerTodosPacientes();
    pacientes.forEach(p => p.cancelarCita(idCita));
  }

  reprogramarCita(medicoNombre, idCita, nuevaFecha, nuevaHora) {
    const medicos = this.obtenerTodosMedicos();
    const medico = medicos.find(m => m.nombre === medicoNombre);
    if (medico) {
      medico.reprogramarCita(idCita, nuevaFecha, nuevaHora);
    }
    const pacientes = this.obtenerTodosPacientes();
    pacientes.forEach(p => {
      const cita = p.citas.find(c => c.id === idCita);
      if (cita) {
        cita.fecha = nuevaFecha;
        cita.hora = nuevaHora;
      }
    });
  }

  guardar() {
    localStorage.setItem("admin", JSON.stringify(this));
  }

  static cargar() {
    const data = localStorage.getItem("admin");
    return data ? Object.assign(new Administrador(), JSON.parse(data)) : null;
  }
}
