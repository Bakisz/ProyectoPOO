// === LOGIN ===

const usuarios = [
  {
    usuario: "admin",
    clave: "admin123",
    tipo: "admin",
    instancia: new Administrador("Administrador General", "admin", "admin123")
  },
  {
    usuario: "drlopez",
    clave: "medico123",
    tipo: "medico",
    instancia: new Medico("Dr. López", "Cardiología", "drlopez", "medico123")
  },
  {
    usuario: "drmartin",
    clave: "medico123",
    tipo: "medico",
    instancia: new Medico("Dr. Martin", "Oftamologia", "drmartin", "medico123")
  },
  {
    usuario: "drnicolas",
    clave: "medico123",
    tipo: "medico",
    instancia: new Medico("Dr. Nicolas", "Medicina General", "drnicolas", "medico123")
  },
  {
    usuario: "dramaria",
    clave: "medico123",
    tipo: "medico",
    instancia: new Medico("Dra. Maria", "Dentista", "dramaria", "medico123")
  },
  {
    usuario: "juanperez",
    clave: "paciente123",
    tipo: "paciente",
    instancia: new Paciente("Juan Pérez", "12.345.678-9", "912345678", "juanperez", "paciente123")
  },
  {
    usuario: "lucasrodriguez",
    clave: "paciente123",
    tipo: "paciente",
    instancia: new Paciente("Lucas Rodriguez", "15.542.781-9", "913234571", "lucasrodriguez", "paciente123")
  },
  {
    usuario: "juanadearco",
    clave: "paciente123",
    tipo: "paciente",
    instancia: new Paciente("Juana de Arco", "9.123.456-7", "998767314", "juanadearco", "paciente123")
  },
  {
    usuario: "lionelmessi",
    clave: "paciente123",
    tipo: "paciente",
    instancia: new Paciente("Lionel Messi", "17.143.631-2", "965471242", "lionelmessi", "paciente123")
  },
  {
    usuario: "javierareinaldo",
    clave: "paciente123",
    tipo: "paciente",
    instancia: new Paciente("Javiera Reinaldo", "20.893.113-K", "988318092", "javierareinaldo", "paciente123")
  }
];

// Almacenar el admin y médicos en localStorage para persistencia
usuarios.forEach(u => {
  if (u.tipo === "admin") {
    localStorage.setItem("admin", JSON.stringify(u.instancia));
  } else if (u.tipo === "medico") {
    localStorage.setItem(`medico_${u.instancia.nombre}`, JSON.stringify(u.instancia));
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    const error = document.getElementById("errorMsg");

    const match = usuarios.find(u => u.usuario === user && u.clave === pass);

    if (match) {
      localStorage.setItem("usuario", match.usuario);
      localStorage.setItem("tipo", match.tipo);
      localStorage.setItem("instancia", JSON.stringify(match.instancia));

    if (match.tipo === "paciente") {
      // Intenta recuperar la versión guardada en localStorage si existe
      const stored = localStorage.getItem(`paciente_${match.instancia.rut}`);
      let pacienteReal;
    
      if (stored) {
        pacienteReal = Object.assign(new Paciente(), JSON.parse(stored));
      } else {
        pacienteReal = match.instancia;
        localStorage.setItem(`paciente_${match.instancia.rut}`, JSON.stringify(pacienteReal));
      }
    
      // Guarda la sesión actual con paciente completo
      localStorage.setItem("paciente", JSON.stringify(pacienteReal));
    }

      window.location.href = match.tipo + ".html";
    } else {
      error.textContent = "Credenciales incorrectas.";
    }
  });
});

