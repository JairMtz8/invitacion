// =====================================================================
//  CONFIGURACIÓN — cambia aquí todos los datos de la invitación
// =====================================================================
const CONFIG = {
  nombre: "Liah",
  apellidos: "Martínez Torres",
  fechaTexto: "Sábado 9 de enero de 2027",
  fechaEvento: "2027-01-09T11:00:00",   // fecha y hora para la cuenta regresiva
  fechaLimite: "26 de diciembre",

  frase: "Hoy recibo el sacramento del bautismo y quiero compartir este día tan especial con las personas que más quiero.",

  papas: "Yulissa Guadalupe Torres Compean\n&\nKevyn Noé Martínez Beltrán",
  padrinosTitulo: "Mi padrino",   // "Mis padrinos" si después se agrega madrina
  padrinos: "Jesús Tadeo Hernández Lucas",

  ceremonia: {
    hora: "11:00 a.m.",
    lugar: "Parroquia de Santa Prisca y San Sebastián",
    direccion: "Plaza Borda 1, Centro, 40200 Taxco de Alarcón, Gro.",
    mapa: "https://www.google.com/maps/search/?api=1&query=Parroquia+de+Santa+Prisca+y+San+Sebasti%C3%A1n%2C+Taxco+de+Alarc%C3%B3n%2C+Gro.",
  },
  recepcion: {
    hora: "3:00 p.m.",
    lugar: "Restaurante Verdelimón",
    direccion: "De Los Plateros 204, Barrio de Fundiciones, 40250 Taxco de Alarcón, Gro.",
    mapa: "https://www.google.com/maps/place/Restaurante+Verdelimon/@18.5564411,-99.5999651,16.5z/data=!4m6!3m5!1s0x85cc4b00122b0277:0xd9295df14742535f!8m2!3d18.5570096!4d-99.599962!16s%2Fg%2F11vm1zy7yr",
  },

  vestimenta: "Formal",

  // URL de la "Aplicación web" de Apps Script (termina en /exec). Ver apps-script/Code.gs
  sheetUrl: "https://script.google.com/macros/s/AKfycbw4C4QZLJonUdyaxbWNiZB0snHti9LLST13TaFZKNPTfP_JjDDqm87eYXAaHdsyecCmTQ/exec",

  maxPersonas: 6, // máximo a elegir cuando entran con el link general (sin código)
};

// =====================================================================
//  Lo de abajo normalmente no necesitas tocarlo
// =====================================================================

const get = (obj, path) => path.split(".").reduce((o, k) => (o ? o[k] : ""), obj);

// Rellenar textos y links
document.querySelectorAll("[data-cfg]").forEach((el) => {
  el.textContent = get(CONFIG, el.dataset.cfg);
});
document.querySelectorAll("[data-cfg-href]").forEach((el) => {
  el.href = get(CONFIG, el.dataset.cfgHref);
});
document.title = `Bautizo de ${CONFIG.nombre}`;

// Pase personalizado: index.html?i=codigo  (el código viene de la hoja "Invitados")
const codigo = new URLSearchParams(location.search).get("i") || "";
const selPersonas = document.getElementById("f-personas");

function llenarPersonas(max, seleccion) {
  selPersonas.innerHTML = "";
  for (let i = 1; i <= max; i++) {
    selPersonas.add(new Option(i === 1 ? "1 persona" : `${i} personas`, i));
  }
  if (seleccion) selPersonas.value = seleccion;
}
llenarPersonas(CONFIG.maxPersonas);

async function cargarInvitado() {
  if (!codigo || !CONFIG.sheetUrl) return;
  try {
    const res = await fetch(`${CONFIG.sheetUrl}?i=${encodeURIComponent(codigo)}`);
    const inv = await res.json();
    if (!inv.ok) return;

    document.getElementById("pase").hidden = false;
    document.getElementById("paseNombre").textContent = inv.nombre;
    document.getElementById("f-nombre").value = inv.nombre;
    if (inv.pases > 0) {
      document.getElementById("paseLugares").textContent =
        inv.pases === 1 ? "1 lugar reservado" : `${inv.pases} lugares reservados`;
      llenarPersonas(inv.pases, inv.pases);
    }
    if (inv.respuesta) {
      document.getElementById("paseEstado").textContent =
        "Ya recibimos tu respuesta. Si necesitas cambiarla, puedes enviarla de nuevo.";
    }
  } catch (err) {
    console.warn("No se pudo cargar el invitado", err);
  }
}
cargarInvitado();

// Cuenta regresiva
const objetivo = new Date(CONFIG.fechaEvento).getTime();
const pad = (n) => String(n).padStart(2, "0");
function tick() {
  const diff = Math.max(0, objetivo - Date.now());
  document.getElementById("cd-dias").textContent = Math.floor(diff / 86400000);
  document.getElementById("cd-horas").textContent = pad(Math.floor(diff / 3600000) % 24);
  document.getElementById("cd-min").textContent = pad(Math.floor(diff / 60000) % 60);
  document.getElementById("cd-seg").textContent = pad(Math.floor(diff / 1000) % 60);
}
tick();
setInterval(tick, 1000);

// Formulario
const form = document.getElementById("rsvp");
const campoPersonas = document.getElementById("campo-personas");
const errorEl = document.getElementById("form-error");

form.addEventListener("change", (e) => {
  if (e.target.name === "asiste") {
    campoPersonas.hidden = e.target.value === "no";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const datos = new FormData(form);
  const nombre = datos.get("nombre").trim();
  const asiste = datos.get("asiste") === "si";

  if (!nombre) {
    errorEl.textContent = "Escribe tu nombre, por favor.";
    form.nombre.focus();
    return;
  }
  if (!CONFIG.sheetUrl) {
    errorEl.textContent = "Falta configurar sheetUrl en script.js.";
    return;
  }
  errorEl.textContent = "";

  const boton = form.querySelector("button[type=submit]");
  boton.disabled = true;
  boton.textContent = "Enviando…";

  try {
    const res = await fetch(CONFIG.sheetUrl, {
      method: "POST",
      body: new URLSearchParams({
        nombre,
        asiste: asiste ? "si" : "no",
        personas: asiste ? datos.get("personas") : "0",
        mensaje: datos.get("mensaje").trim(),
        codigo,
      }),
    });
    const r = await res.json();
    if (!r.ok) throw new Error(r.error || "Error al guardar");
  } catch (err) {
    console.error(err);
    errorEl.textContent = "No pudimos enviar tu confirmación. Revisa tu conexión e inténtalo de nuevo.";
    boton.disabled = false;
    boton.textContent = "Enviar confirmación";
    return;
  }

  form.hidden = true;
  document.getElementById("thanks").hidden = false;
  document.getElementById("thanks-text").textContent = asiste
    ? `Te esperamos con mucho cariño, ${nombre}.`
    : `Te vamos a extrañar, ${nombre}. Gracias por avisarnos.`;
});

// Animación al hacer scroll
const io = new IntersectionObserver(
  (entries) => entries.forEach((en) => {
    if (en.isIntersecting) {
      en.target.classList.add("visible");
      io.unobserve(en.target);
    }
  }),
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
