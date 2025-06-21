const usuarios = [
  // ADMINISTRADOR
  {
    usuario: "admin",
    clave: "admin123",
    tipo: "admin",
    instancia: new Administrador("Administrador General", "admin", "admin123")
  },
  // MEDICOS
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
  // USUARIOS DE PRUEBA
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

usuarios.forEach(u => {
  if (u.tipo === "admin") {
    localStorage.setItem("admin", JSON.stringify(u.instancia));
  } else if (u.tipo === "medico") {
    localStorage.setItem(`medico_${u.instancia.nombre}`, JSON.stringify(u.instancia));
  } else if (u.tipo === "paciente") {
    localStorage.setItem(`paciente_${u.instancia.rut}`, JSON.stringify(u.instancia));
  }
});

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  const error = document.getElementById("errorMsg");

  const match = usuarios.find(
    u => u.usuario === user && u.clave === pass
  );

  if (match) {
    localStorage.setItem("usuario", match.usuario);
    localStorage.setItem("tipo", match.tipo);
    localStorage.setItem("instancia", JSON.stringify(match.instancia));
    window.location.href = `${match.tipo}.html`;
  } else {
    error.textContent = "Usuario o contraseña incorrectos.";
  }
});

