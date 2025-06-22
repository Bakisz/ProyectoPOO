// === clases.js ===

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

  agendarCita(nombreMedico, fecha, hora) {
    const nuevaCita = {
      paciente: this.nombre,
      medico: nombreMedico,
      fecha,
      hora
    };

    this.citas.push(nuevaCita);

    // Guardar el paciente correctamente
    localStorage.setItem(`paciente_${this.rut}`, JSON.stringify(this));
    localStorage.setItem("paciente", JSON.stringify(this));  // mantener sesión actualizada

    // Guardar al médico
    const medico = Medico.cargar(nombreMedico);
    medico.citas.push(nuevaCita);
    medico.reservarHorario(fecha, hora);
    medico.guardar();

  }

  cancelarCita(idCita) {
    const cita = this.citas.find(c => c.id === idCita);
    if (cita) {
      const medico = Medico.cargar(cita.medico);
      if (medico) {
        medico.liberarHorario(cita.fecha, cita.hora);
        medico.cancelarCita(idCita);
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
        medico.liberarHorario(cita.fecha, cita.hora);
        medico.reservarHorario(nuevaFecha, nuevaHora);
        cita.fecha = nuevaFecha;
        cita.hora = nuevaHora;
      }
      this.guardar();
    }
  }

  guardar() {
    localStorage.setItem(`paciente_${this.rut}`, JSON.stringify(this));
    localStorage.setItem("paciente", JSON.stringify(this)); // Actualiza la sesión activa
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
    this.horariosDisponibles = {};
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
  }

  cancelarCita(idCita) {
    this.citas = this.citas.filter(c => c.id !== idCita);
  }

  reservarHorario(fecha, hora) {
    this.generarHorarios(fecha);
    this.horariosDisponibles[fecha] = this.horariosDisponibles[fecha].filter(h => h !== hora);
  }

  liberarHorario(fecha, hora) {
    this.generarHorarios(fecha);
    if (!this.horariosDisponibles[fecha].includes(hora)) {
      this.horariosDisponibles[fecha].push(hora);
      this.horariosDisponibles[fecha].sort();
    }
  }

  static cargar(nombre) {
    const data = JSON.parse(localStorage.getItem(`medico_${nombre}`));
    if (!data) return null;
    const m = new Medico(data.nombre, data.especialidad, data.usuario, data.clave);
    m.citas = data.citas || [];
    return m;
  }

  guardar() {
    localStorage.setItem(`medico_${this.nombre}`, JSON.stringify(this));
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
    const citas = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key.startsWith("paciente_")) continue;
    
      const paciente = JSON.parse(localStorage.getItem(key));
      if (!paciente?.citas) continue;
    
      paciente.citas.forEach(cita => {
        citas.push({
          paciente: paciente.nombre,
          medico: cita.medico,
          fecha: cita.fecha,
          hora: cita.hora
        });
      });
    }
    return citas;
  }


  guardar() {
    localStorage.setItem("admin", JSON.stringify(this));
  }

  static cargar() {
    const data = localStorage.getItem("admin");
    return data ? Object.assign(new Administrador(), JSON.parse(data)) : null;
  }
}
