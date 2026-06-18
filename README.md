# MINI-LIBRERIA — SPIEGAZIONE DEL PROGETTO

## STRUTTURA DEI FILE

index.html → pagina unica dell'app
libri.json → dati di partenza (libri pre-caricati)
assets/css/style.css → tutti gli stili visivi
assets/js/script.js → tutta la logica JavaScript

===========================================
FILE: index.html
===========================================

<header class="site-header">
  Barra in cima alla pagina. Contiene:
  - .header-row: flexbox che divide il contenuto in due colonne
    - a sinistra: il titolo <h1> e il sottotitolo <p>
    - a destra: #auth-box (div vuoto, popolato da JS con il form di
      login oppure con il saluto "Ciao Emily + Esci" se loggato)

<section id="profilo-section" hidden>
  Sezione nascosta per default. Viene mostrata da JS dopo il login.
  Contiene #profilo (div vuoto), popolato da JS con foto, nome, username
  e email dell'utente loggato.

<section class="cerca-section">
  Sezione di ricerca libri su OpenLibrary.
  Contiene:
  - Input #cerca: dove l'utente digita la query
  - #spinner: messaggio "Caricamento in corso..." (nascosto di default)
  - #errore: area rossa per i messaggi di errore (nascosta di default)
  - #risultati <ul>: lista dei risultati della ricerca, popolata da JS

<section class="card"> (form aggiungi libro)
  Form manuale per aggiungere un libro alla propria libreria.
  Campi: titolo, autore, anno, formato (select), dimensione MB
  (visibile solo se si sceglie "digitale").
  In fondo: select per scegliere l'ordinamento della lista.

<section> (lista libri)
  Mostra i libri salvati in localStorage.
  Contiene:
  - #titolo-lista: intestazione con il conteggio totale
  - #btn-svuota: cancella tutti i libri
  - .filtri: tre bottoni (Tutti / Da leggere / Letti)
  - #lista-libri <ul>: lista dei libri, popolata da JS

===========================================
FILE: libri.json
===========================================

Array JSON con i libri pre-caricati la prima volta che l'app viene
aperta (quando localStorage è ancora vuoto). Ogni oggetto ha:

- titolo, autore, anno
- letto (true/false)
- formato ("cartaceo" o "digitale")
- dimensioneMb (numero o null)

===========================================
FILE: assets/js/script.js
===========================================

--- UTILITY DOM ---

make(tag, props, ...children)
Helper per creare elementi DOM senza usare innerHTML.
Accetta il tag, un oggetto di proprietà (className, textContent,
dataset, style, ecc.) e figli opzionali da appendere.
Usato ovunque nel codice per costruire il DOM in modo sicuro (no XSS).

--- CLASSI ---

class Libro
Rappresenta un libro cartaceo.
Proprietà: titolo, autore, anno, letto (false di default).

class LibroDigitale extends Libro
Estende Libro aggiungendo: formato = "digitale", dimensioneMb.

--- STATO GLOBALE ---

libri (array)
Array in memoria che contiene tutti i libri dell'utente.
Viene sincronizzato con localStorage ad ogni modifica.

filtroAttivo (stringa)
Tiene traccia del filtro selezionato: "tutti", "da-leggere", "letti".

ordinamento (stringa)
Tiene traccia del criterio di ordinamento: "titolo", "autore", "anno".

--- FUNZIONI DATI ---

creaLibro(dati)
Factory: riceve un oggetto con i campi del libro e restituisce
un'istanza di Libro o LibroDigitale in base al formato.

chiaveLibreria()
Determina la chiave localStorage da usare: - Se c'è un utente loggato → "libreria-<username>" (es. "libreria-emilys") - Se nessuno è loggato → "libreria" (chiave generica)
In questo modo ogni utente ha la propria libreria isolata.

salva()
Serializza l'array `libri` in JSON e lo salva in localStorage
usando la chiave restituita da chiaveLibreria().

caricaDaStorage()
Legge la chiave corretta (via chiaveLibreria()) da localStorage
e ricostruisce gli oggetti usando creaLibro().
Ritorna null se non c'è nulla salvato.

--- RENDER LISTA LIBRI ---

creaElementoLibro(libro, i)
Costruisce il <li> di un singolo libro con: - info (titolo, badge formato, autore — anno) - bottone "Segna come letto" (diventa "✓ letto ×" se già letto) - bottone "Rimuovi"
Il bordo sinistro è verde se letto, blu scuro se da leggere.

render()
Ricalcola e ridisegna l'intera lista #lista-libri applicando
il filtro e l'ordinamento attivi. Aggiorna anche il contatore
nel titolo e lo stato active sui bottoni filtro.

--- AVVIO ---

renderLibri()
Punto di partenza per la lista libri. - Se `libri` è vuoto E nessuno è loggato: carica libri.json via
fetch (libri di esempio) e poi chiama render(). - Se l'utente è loggato con lista vuota: chiama render() direttamente
(la sua libreria personale è semplicemente vuota, non si carica
il JSON di default). - Se `libri` ha già elementi: chiama render() direttamente.

async avvio()
Funzione principale chiamata al caricamento della pagina.
In ordine: 1. renderLibri() → mostra i libri 2. renderAuthBox() → mostra form login o saluto (se già loggato) 3. mostraProfilo() → mostra il profilo (se c'è un token valido)

--- EVENTI LISTA LIBRI ---

Cambio select #formato
Mostra/nasconde il campo dimensione MB.

Submit #form-libro
Legge i valori dal form, crea un nuovo libro con creaLibro(),
lo aggiunge all'array, salva e richiama render().

Click su #lista-libri (event delegation)
Intercetta i click su "Segna come letto" (toggle letto/non letto)
e su "Rimuovi" (filtra il libro dall'array).

Click su #btn-svuota
Svuota l'array libri, salva e ridisegna.

Click sui .btn-filtro
Aggiorna filtroAttivo e richiama render().

Cambio select #ordinamento
Aggiorna la variabile ordinamento e richiama render().

--- AUTENTICAZIONE ---

getToken()
Legge il JWT da localStorage alla chiave "auth.token".
Ritorna null se non presente.

getUtente()
Legge "auth.user" da localStorage e lo parsa come JSON.
Ritorna null se assente o non valido.

logout()
Rimuove "auth.token" e "auth.user" da localStorage.
Poi ricarica i libri dalla chiave generica "libreria" (quelli
dell'utente anonimo) e ridisegna la lista. Infine nasconde
#profilo-section.

async login(username, password)
Fa una POST a https://dummyjson.com/auth/login con le credenziali.
Se la risposta è ok, salva il token in "auth.token" e i dati
utente in "auth.user" (come JSON). Lancia un errore se le
credenziali sono sbagliate.

async caricaProfilo()
Legge il token; se manca ritorna null.
Altrimenti fa una GET a https://dummyjson.com/auth/me con
l'header Authorization: Bearer <token> e ritorna i dati profilo.

renderAuthBox()
Svuota e ripopola #auth-box in base allo stato di login: - Se loggato: span "Ciao <nome>" + bottone "Esci"
(il bottone chiama logout() + renderAuthBox()) - Se non loggato: form con input username (default "emilys"),
input password (default "emilyspass") e bottone "Accedi"
(il form usa gestisciLogin come handler)

async gestisciLogin(e)
Handler del form di login. Legge username e password, chiama login().
Se va a buon fine: 1. Ricarica `libri` dalla chiave personale dell'utente
(es. "libreria-emilys"), che può essere vuota se è la prima volta. 2. Ridisegna la lista libri. 3. Aggiorna l'auth-box e mostra il profilo.
Se fallisce mostra alert con il messaggio di errore.

async mostraProfilo()
Se non c'è token esce subito. Altrimenti chiama caricaProfilo(),
costruisce il DOM del profilo (foto, nome completo, @username,
email) usando make() e mostra #profilo-section rimuovendo
l'attributo hidden.

--- SEZIONE CERCA ---

mostraSpinner() / nascondiSpinner()
Mostrano e nascondono il div #spinner.

mostraErrore(msg)
Scrive il testo in #errore e lo rende visibile.

async cerca(query)
Chiama l'API OpenLibrary con la query. Usa async/await con
try/catch/finally: - try: fetch → controlla r.ok → parsa JSON → chiama renderRisultati() - catch: mostra l'errore in #errore - finally: nasconde sempre lo spinner

renderRisultati(docs)
Filtra i risultati senza autore, poi per ognuno costruisce un <li>
con titolo, autore, anno, bottone "Aggiungi" e bottone "Dettagli".

Input #cerca (con debounce 400ms)
Aspetta che l'utente smetta di digitare per 400ms prima di
chiamare cerca(). Non parte se la query è < 3 caratteri.

Click su #risultati (event delegation) - Bottone "Aggiungi": crea un Libro cartaceo dai dati del dataset
e lo aggiunge alla libreria. Disabilita il bottone dopo il click. - Bottone "Dettagli": fetcha la descrizione del libro singolo
via OpenLibrary e la mostra in un alert.

===========================================
FILE: assets/css/style.css
===========================================

body / \*
Reset box-sizing, font base, sfondo grigio chiaro.

.container
Limita la larghezza a 720px (centralizzato da Bootstrap).

.site-header
Sfondo blu scuro, testo bianco, padding generoso.

.header-row
Flexbox: spazia titolo (sinistra) e auth-box (destra).

.auth-box / #form-login
Contiene il form di login in linea (flexbox con gap).

.saluto / .btn-logout
Stile del testo "Ciao X" e del bottone Esci nel header.

.profilo-section / .profilo / .profilo-img
Stile della sezione profilo: card con bordo sinistro blu,
layout flex per foto + info testuali, foto circolare 60x60px.

.btn-libreria
Bottone principale blu scuro (usato per Aggiungi e Accedi).

.libro-item
Card di ogni libro in lista, con bordo sinistro colorato.

.badge-formato
Etichetta grigia che indica "cartaceo" o "digitale (X MB)".

.btn-filtro
Bottoni Tutti / Da leggere / Letti con stile outline;
.active li riempie di blu scuro.

.spinner / .risultato-item
Stile del caricamento e dei risultati di ricerca.

===========================================
API ESTERNE USATE
===========================================

https://openlibrary.org/search.json?q=<query>&limit=10
Ricerca libri per keyword. Ritorna un array "docs" con titolo,
autori, anno di prima pubblicazione, chiave univoca del libro.

https://openlibrary.org/<key>.json
Dettaglio di un singolo libro: usato per leggere la descrizione.

https://dummyjson.com/auth/login (POST)
Login con username e password. Ritorna accessToken e dati utente.

https://dummyjson.com/auth/me (GET, con Bearer token)
Dati del profilo dell'utente loggato (firstName, lastName,
username, email, image).

===========================================
DATI IN LOCALSTORAGE
===========================================

"libreria" → libreria generica (utente non loggato)
"libreria-<username>" → libreria personale di ogni utente
(es. "libreria-emilys", "libreria-john")
Ogni utente ha la propria chiave separata,
così le librerie non si sovrascrivono.
"auth.token" → JWT per le chiamate autenticate
"auth.user" → oggetto JSON con i dati dell'utente loggato
