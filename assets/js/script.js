// Mini-libreria — Settimana VII Giorno I

// === Utility DOM ===

function make(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  const { dataset: ds, style: st, ...rest } = props;
  Object.assign(el, rest);
  if (ds) Object.assign(el.dataset, ds);
  if (st) Object.assign(el.style, st);
  if (children.length) el.append(...children);
  return el;
}

// === Classi ===

class Libro {
  constructor(titolo, autore, anno) {
    this.titolo = titolo;
    this.autore = autore;
    this.anno = anno;
    this.letto = false;
  }
}

class LibroDigitale extends Libro {
  constructor(titolo, autore, anno, dimensioneMb) {
    super(titolo, autore, anno);
    this.formato = "digitale";
    this.dimensioneMb = dimensioneMb;
  }
}

// === Stato (array di libri) ===

function creaLibro({
  titolo,
  autore,
  anno,
  formato,
  dimensioneMb = 0,
  letto = false,
}) {
  const libro =
    formato === "digitale"
      ? new LibroDigitale(titolo, autore, anno, dimensioneMb)
      : new Libro(titolo, autore, anno);
  libro.letto = Boolean(letto);
  return libro;
}

function salva() {
  localStorage.setItem("libreria", JSON.stringify(libri));
}

function caricaDaStorage() {
  const raw = localStorage.getItem("libreria");
  return raw ? JSON.parse(raw).map(creaLibro) : null;
}

let libri = caricaDaStorage() || [];

// Stato UI: filtro attivo e campo di ordinamento
let filtroAttivo = "tutti"; // "tutti" | "da-leggere" | "letti"
let ordinamento = "titolo"; // "titolo" | "autore" | "anno"

// === Render ===

function creaElementoLibro(libro, i) {
  const isDigitale = libro instanceof LibroDigitale;
  return make(
    "li",
    {
      className: "libro-item",
      style: {
        borderLeftColor: libro.letto ? "#28a745" : "hsl(220, 50%, 25%)",
      },
    },
    make(
      "div",
      { className: "libro-info" },
      make(
        "div",
        { className: "libro-titolo" },
        make("strong", { textContent: libro.titolo }),
        make("span", {
          className: "badge-formato",
          textContent: isDigitale
            ? `digitale (${libro.dimensioneMb} MB)`
            : "cartaceo",
        }),
      ),
      make("div", {
        className: "libro-meta",
        textContent: `${libro.autore} — ${libro.anno}`,
      }),
    ),
    make(
      "div",
      { className: "libro-azione" },
      make("button", {
        className: libro.letto
          ? "btn btn-sm btn-rimuovi"
          : "btn btn-outline-secondary btn-sm btn-segna",
        textContent: libro.letto ? "✓ letto ×" : "Segna come letto",
        dataset: { index: i },
      }),
      make("button", {
        className: "btn btn-sm btn-outline-danger btn-elimina",
        textContent: "Rimuovi",
        dataset: { index: i },
      }),
    ),
  );
}

function render() {
  const lista = document.getElementById("lista-libri");

  // Applica filtro
  const libriFiltrati = libri.filter((l) => {
    if (filtroAttivo === "letti") return l.letto;
    if (filtroAttivo === "da-leggere") return !l.letto;
    return true;
  });

  // Ordina la copia senza mutare l'array originale
  const libriOrdinati = [...libriFiltrati].sort((a, b) =>
    ordinamento === "anno"
      ? a.anno - b.anno
      : a[ordinamento].localeCompare(b[ordinamento]),
  );

  document.getElementById("titolo-lista").textContent =
    `I tuoi libri (${libri.length})`;

  // L'indice passato deve essere quello reale in `libri` (non del sottoinsieme)
  lista.replaceChildren(
    ...libriOrdinati.map((libro) =>
      creaElementoLibro(libro, libri.indexOf(libro)),
    ),
  );

  // Sincronizza lo stato active sui bottoni filtro
  document.querySelectorAll(".btn-filtro").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filtro === filtroAttivo);
  });
}

// === Avvio: carica JSON di default se localStorage è vuoto ===

if (libri.length === 0) {
  fetch("libri.json")
    .then((r) => r.json())
    .then((dati) => {
      dati.map(creaLibro).forEach((l) => libri.push(l));
      salva();
      render();
    });
} else {
  render();
}

// === Eventi ===

document.getElementById("formato").addEventListener("change", function () {
  document.getElementById("campo-dimensione").style.display =
    this.value === "digitale" ? "" : "none";
});

document.getElementById("form-libro").addEventListener("submit", function (e) {
  e.preventDefault();

  const titolo = document.getElementById("titolo").value.trim();
  const autore = document.getElementById("autore").value.trim();
  const anno = parseInt(document.getElementById("anno").value, 10);
  const formato = document.getElementById("formato").value;

  libri.push(
    creaLibro({
      titolo,
      autore,
      anno,
      formato,
      dimensioneMb:
        parseFloat(document.getElementById("dimensione").value) || 0,
    }),
  );

  salva();
  render();
  this.reset();
  document.getElementById("campo-dimensione").style.display = "none";
});

// Event delegation: segna/de-segna letto ed elimina singolo libro
document.getElementById("lista-libri").addEventListener("click", function (e) {
  const btnToggle = e.target.closest(".btn-segna, .btn-rimuovi");
  const btnElimina = e.target.closest(".btn-elimina");

  if (btnToggle) {
    const i = parseInt(btnToggle.dataset.index, 10);
    libri[i].letto = btnToggle.classList.contains("btn-segna");
    salva();
    render();
  } else if (btnElimina) {
    const i = parseInt(btnElimina.dataset.index, 10);
    libri = libri.filter((_, idx) => idx !== i);
    salva();
    render();
  }
});

// Svuota tutti i libri
document.getElementById("btn-svuota").addEventListener("click", function () {
  if (!libri.length) return;
  libri.length = 0;
  salva();
  render();
});

// Filtri: Tutti / Da leggere / Letti
document.querySelector(".filtri").addEventListener("click", function (e) {
  const btn = e.target.closest(".btn-filtro");
  if (!btn) return;
  filtroAttivo = btn.dataset.filtro;
  render();
});

// Ordinamento dalla select nel form
document.getElementById("ordinamento").addEventListener("change", function () {
  ordinamento = this.value;
  render();
});
