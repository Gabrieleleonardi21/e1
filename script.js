// Mini-libreria — Settimana VII Giorno I

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
    this.formato = 'digitale';
    this.dimensioneMb = dimensioneMb;
  }
}

// === Stato (array di libri) ===

function make({ titolo, autore, anno, formato, dimensioneMb = 0, letto = false }) {
  const libro = formato === 'digitale'
    ? new LibroDigitale(titolo, autore, anno, dimensioneMb)
    : new Libro(titolo, autore, anno);
  libro.letto = Boolean(letto);
  return libro;
}

function salva() {
  localStorage.setItem('libreria', JSON.stringify(libri));
}

function caricaDaStorage() {
  const raw = localStorage.getItem('libreria');
  return raw ? JSON.parse(raw).map(make) : null;
}

const libri = caricaDaStorage() || [];

// === Render ===

function render() {
  const lista = document.getElementById('lista-libri');
  document.getElementById('titolo-lista').textContent = `I tuoi libri (${libri.length})`;

  lista.innerHTML = libri.map((libro, i) => {
    const isDigitale = libro instanceof LibroDigitale;
    const borderColor = libro.letto ? '#28a745' : 'hsl(220, 50%, 25%)';

    const formatoBadge = isDigitale
      ? `<span class="badge-formato">digitale (${libro.dimensioneMb} MB)</span>`
      : `<span class="badge-formato">cartaceo</span>`;

    const azione = libro.letto
      ? `<button class="btn btn-sm btn-rimuovi" data-index="${i}">&#10003; letto &times;</button>`
      : `<button class="btn btn-outline-secondary btn-sm btn-segna" data-index="${i}">Segna come letto</button>`;

    return `
      <li class="libro-item" style="border-left-color: ${borderColor}">
        <div class="libro-info">
          <div class="libro-titolo"><strong>${libro.titolo}</strong> ${formatoBadge}</div>
          <div class="libro-meta">${libro.autore} — ${libro.anno}</div>
        </div>
        <div class="libro-azione">${azione}</div>
      </li>`;
  }).join('');
}

// === Avvio: carica JSON di default se localStorage è vuoto ===

if (libri.length === 0) {
  fetch('libri.json')
    .then(r => r.json())
    .then(dati => {
      dati.map(make).forEach(l => libri.push(l));
      salva();
      render();
    });
} else {
  render();
}

// === Eventi ===

document.getElementById('formato').addEventListener('change', function () {
  document.getElementById('campo-dimensione').style.display = this.value === 'digitale' ? '' : 'none';
});

document.getElementById('form-libro').addEventListener('submit', function (e) {
  e.preventDefault();

  const titolo = document.getElementById('titolo').value.trim();
  const autore = document.getElementById('autore').value.trim();
  const anno = parseInt(document.getElementById('anno').value, 10);
  const formato = document.getElementById('formato').value;

  const libro = make({
    titolo, autore, anno, formato,
    dimensioneMb: parseFloat(document.getElementById('dimensione').value) || 0,
  });

  libri.push(libro);
  salva();
  render();
  this.reset();
  document.getElementById('campo-dimensione').style.display = 'none';
});

// Event delegation: segna/rimuovi letto
document.getElementById('lista-libri').addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-segna, .btn-rimuovi');
  if (!btn) return;
  const i = parseInt(btn.dataset.index, 10);
  libri[i].letto = btn.classList.contains('btn-segna');
  salva();
  render();
});
