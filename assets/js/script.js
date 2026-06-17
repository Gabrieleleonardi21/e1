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
    })
    .catch((err) => {
      console.error("Errore nel caricamento di libri.json:", err);
      render(); // mostra la lista vuota comunque
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

// === Sezione Cerca ===

/** Mostra lo spinner e nasconde l'area errore */
function mostraSpinner() {
  document.getElementById("spinner").removeAttribute("hidden");
  document.getElementById("errore").setAttribute("hidden", "");
}

/** Nasconde lo spinner */
function nascondiSpinner() {
  document.getElementById("spinner").setAttribute("hidden", "");
}

// Mostra un messaggio di errore nell'area #errore (msg = testo da visualizzare)
function mostraErrore(msg) {
  const el = document.getElementById("errore");
  el.textContent = msg;
  el.removeAttribute("hidden");
}

// Cerca libri su OpenLibrary e popola #risultati (query = testo da cercare); usa debounce per evitare troppe richieste
function cerca(query) {
  mostraSpinner();
  const url = `https://openlibrary.org/search.json?q=${query}&limit=10`;
  fetch(url)
    .then(function (response) {
      if (!response.ok) throw new Error("Errore HTTP " + response.status);
      return response.json();
    })
    .then(function (dati) {
      renderRisultati(dati.docs);
    })
    .catch(function (err) {
      mostraErrore("Impossibile completare la ricerca: " + err.message);
    })
    .finally(function () {
      nascondiSpinner();
    });
}

// Renderizza i risultati in #risultati (docs = array dall'API OpenLibrary); scarta i libri senza autore
function renderRisultati(docs) {
  const lista = document.getElementById("risultati");

  // Scarta i libri senza autore
  const docsFiltrati = docs.filter(function (d) {
    return d.author_name;
  });

  if (docsFiltrati.length === 0) {
    lista.replaceChildren(make("li", { textContent: "Nessun risultato." }));
    return;
  }

  lista.replaceChildren(
    ...docsFiltrati.map(function (d) {
      let autore = "Autore sconosciuto";
      if (d.author_name && d.author_name[0]) {
        autore = d.author_name[0];
      }

      let anno = "?";
      if (d.first_publish_year) {
        anno = d.first_publish_year;
      }

      const titolo = d.title;

      const btnAggiungi = make("button", {
        className: "btn btn-sm btn-libreria",
        textContent: "Aggiungi",
        dataset: { titolo: titolo, autore: autore, anno: String(anno) },
      });

      // Bottone extra: mostra la descrizione del libro via API
      const btnDettagli = make("button", {
        className: "btn btn-sm btn-outline-secondary",
        textContent: "Dettagli",
        dataset: { key: d.key },
      });

      return make(
        "li",
        { className: "risultato-item" },
        make(
          "div",
          { className: "info" },
          make("span", { className: "titolo fw-bold", textContent: titolo }),
          make("div", {
            className: "meta text-muted",
            textContent: autore + " — " + anno,
          }),
        ),
        make("div", { className: "d-flex gap-2" }, btnAggiungi, btnDettagli),
      );
    }),
  );
}

// Variabile per il debounce della ricerca
let timeoutId;

// Listener input su #cerca con debounce (400ms)
document.getElementById("cerca").addEventListener("input", function (e) {
  const query = e.target.value.trim();
  if (query.length < 3) {
    document.getElementById("risultati").replaceChildren();
    return;
  }
  clearTimeout(timeoutId);
  timeoutId = setTimeout(function () {
    cerca(query);
  }, 400);
});

// Event delegation su #risultati: gestisce "Aggiungi" e "Dettagli"
document.getElementById("risultati").addEventListener("click", function (e) {
  const btnAggiungi = e.target.closest("button[data-titolo]");
  if (btnAggiungi) {
    const titolo = btnAggiungi.dataset.titolo;
    const autore = btnAggiungi.dataset.autore;
    const anno = parseInt(btnAggiungi.dataset.anno, 10) || 0;
    libri.push(creaLibro({ titolo, autore, anno, formato: "cartaceo" }));
    salva();
    render();
    btnAggiungi.textContent = "✓ Aggiunto";
    btnAggiungi.setAttribute("disabled", "");
    return;
  }

  // Dettagli: fetch della descrizione del libro singolo
  const btnDettagli = e.target.closest("button[data-key]");
  if (btnDettagli) {
    const key = btnDettagli.dataset.key;
    fetch("https://openlibrary.org" + key + ".json")
      .then(function (r) {
        return r.json();
      })
      .then(function (dati) {
        let descrizione = "nessuna descrizione";
        if (dati.description) {
          if (typeof dati.description === "string") {
            descrizione = dati.description;
          } else if (dati.description.value) {
            descrizione = dati.description.value;
          }
        }
        alert(descrizione);
      })
      .catch(function () {
        alert("nessuna descrizione");
      });
  }
});

