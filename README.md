# Calcolatore Sviluppo Lamiera (Bend Allowance)

Applicazione web per il calcolo dello sviluppo lamiera, della bend allowance,
del setback e della bend deduction, con calcoli avanzati per la pressopiegatura
(springback, forza di piega, raggio effettivo da matrice, V-die ottimale).

Stack: **Vue 3** (Composition API) + **Vue Router** + **Vite** (SSG). I calcoli
avvengono nel browser. I profili del calcolatore restano anche in `localStorage`.
Con Supabase, un account Google salva pezzi DXF e profili su PostgreSQL.

## Requisiti

- Node.js 18+ (consigliato)
- npm

## Installazione e avvio

```bash
npm install      # installa le dipendenze
npm run dev      # avvia il server di sviluppo Vite
npm run build    # build di produzione in dist/
npm run preview  # anteprima della build di produzione
```

## Qualita del codice e test

```bash
npm run test         # esegue i test Vitest
npm run test:rls     # RLS e Storage, solo con .env.test.local
npm run lint         # ESLint con autofix
npm run lint:check   # ESLint senza modifiche
npm run format       # Prettier con scrittura
```

## Architettura dei calcoli

La logica di calcolo e centralizzata in un unico **motore puro** e testabile,
indipendente da Vue.

- `src/utils/bendingEngine.js` — motore unificato:
  - `calcolaPiega({ angolo, T, R, K, metodo })` — BA/SB/BD di una singola piega.
  - `calcolaSviluppo({ segments, T, R, K, metodo })` — sviluppo del profilo
    calcolando **ogni piega singolarmente**.
  - `calcoliAvanzatiPerPiega(input)` — per ogni piega: springback, raggio
    effettivo, BA/SB/BD avanzati; piu aggregati (forza, V-die, raggio minimo).
  - funzioni di supporto: `calcolaSpringback`, `calcolaForzaPiega`,
    `calcolaAperturaMatrice`, `calcolaRaggioEffettivo`, `calcolaRaggioMinimo`,
    `calcolaBendDeductionDiFurio`.
- `src/utils/materials.js` — registry unico dei materiali: riconcilia le chiavi
  della UI (`acciaio`, `inox`, ...) con gli id del database
  (`steel_mild`, ...), e fornisce `risolviFattoreK` (priorita: dinamico >
  manuale > materiale) e `kFactorDynamic` (K da rapporto R/T).
- `src/utils/MaterialsDatabase.js` — database materiali (proprieta fisiche,
  K, raggi minimi, tooling) usato come riferimento.
- `src/utils/BendingCalculator.js` e `src/utils/BendingCalculatorAdvanced.js`
  sono **wrapper di compatibilita** sul motore (mantengono le firme storiche).
- `src/utils/exporters.js` — esportazione in **PDF** (jsPDF), **SVG** e **DXF**.

### Formule principali

Con `angolo` = angolo di piega complementare (90 = piega a squadra), in radianti:

- Bend Allowance: `BA = angolo * (R + K * T)`
- Setback: `SB = (R + T) * tan(angolo / 2)`
- Bend Deduction: `BD = 2 * SB - BA`
- Sviluppo piatto: `L = somma(lunghezze) - somma(BD di ogni piega)`

Casi limite gestiti: angolo 0 (nessuna piega), angoli negativi (si usa la
magnitudine), angoli prossimi a 180 (clamp per evitare la divergenza di `tan`).

Le formule per air bending/bottoming/pressbrake, forza di piega, raggio
effettivo da matrice e springback sono **empiriche** e marcate con `EMPIRICO:`
nel codice: vanno intese come stime, non come valori normativi.

## Struttura del progetto

```
src/
  views/            Calculator.vue (UI principale), Home.vue
  components/
    calculator/     ParametersInput, SegmentsList, ResultsDisplay,
                    PreviewCanvas, AdvancedCalculations,
                    DiFurioCalculator, BendCompensationCalculator
    common/         UnitsSelector
  composables/      useBendCalculator.js
  utils/            bendingEngine.js, materials.js, exporters.js,
                    MaterialsDatabase.js, (wrapper) BendingCalculator*.js
    __tests__/      bendingEngine.test.js, materials.test.js
  router/           index.js
```

## Test

I test (Vitest) coprono casi noti, profili multi-piega con angoli misti e casi
limite del motore, oltre alla risoluzione dei materiali e del fattore K. Vedi
`src/utils/__tests__/`.

```bash
npm run test:rls   # RLS e Storage sul progetto Supabase di sviluppo; saltato senza .env.test.local
```

## Account, progetti e Supabase

Il calcolatore (`/calcolatore-sviluppo-lamiera`) e l’editor (`/editor`) restano
usabili senza account. «Salva progetto» nel calcolatore continua a scrivere in
`localStorage`. «Salva nel tuo account» e «Salva» nell’editor chiedono Google e
poi scrivono su Supabase. I progetti stanno in `/progetti` e si riaprono da
`/progetti/:id`.

Non c’è login con password: solo Google OAuth (PKCE). Nel client entra **solo**
la chiave pubblica (`VITE_SUPABASE_PUBLISHABLE_KEY`). La `service_role` e il
Client Secret di Google non vanno nel frontend, nel repository né in variabili
`VITE_`. `npm run build` esegue `scripts/check-secrets.mjs` e fallisce se il
bundle contiene una service key.

### Dove stanno i dati

- `auth.users`: identità, email, provider Google, metadata del login.
- `public.profiles`: nome visibile e avatar. L’email non viene duplicata.
- `public.projects`: pezzo (`kind = part`) o profilo calcolatore (`kind = profile`).
  `schema_version` è la versione dell’envelope; `revision` cresce a ogni update.
- Storage `project-files` (privato): solo il DXF originale, path
  `{user_id}/{project_id}/source.dxf`. Il DXF modificato si rigenera dal pezzo.

Le policy RLS e del bucket limitano select/insert/update/delete all’utente
autenticato. Un id altrui non restituisce dati (stesso messaggio «non trovato»).

---

### 1. Progetto Supabase

Usa **due progetti** separati se puoi: uno di sviluppo e uno di produzione.
Regione consigliata: **EU Central (Frankfurt)** per restare in UE.

1. Vai su [https://supabase.com/dashboard](https://supabase.com/dashboard) e
   crea un progetto (nome libero, es. `sviluppolamiera-dev`).
2. Annota il **Reference ID** (Settings → General → Reference ID). Serve per
   i link CLI e compare nell’URL
   `https://<project-ref>.supabase.co`.
3. Settings → API:
   - **Project URL** → va in `VITE_SUPABASE_URL`
   - **anon / public** (o publishable) → va in `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **service_role** → **mai** in `VITE_` né in Vercel frontend; serve solo
     per `npm run test:rls` (`.env.test.local`) e viene iniettata
     automaticamente nelle Edge Function da Supabase.

Ripeti per il progetto di produzione quando sei pronto al go-live.

---

### 2. Google Cloud Console (OAuth)

Fai questa configurazione **una volta** per Client ID, poi collega lo stesso
Client ID a entrambi i progetti Supabase (dev e prod) aggiungendo due URI di
callback, oppure crea due Client OAuth distinti (uno per ambiente).

#### 2.1 Progetto Google Cloud

1. Apri [Google Cloud Console](https://console.cloud.google.com/).
2. Crea o seleziona un progetto (es. `SviluppoLamiera`).
3. Nel menu laterale: **APIs & Services** → **OAuth consent screen**.
   - User Type: **External**
   - App name: `SviluppoLamiera`
   - User support email: la tua email
   - App logo: opzionale
   - Application home page: `https://www.sviluppolamiera.it`
   - Authorized domains: aggiungi `sviluppolamiera.it`
     (Google aggiunge da sé i domini Google; il dominio del sito deve essere
     verificato se l’app esce da «Testing»)
   - Developer contact: la tua email
4. Scopes: lascia i default di base (`openid`, `.../auth/userinfo.email`,
   `.../auth/userinfo.profile`). Non serve altro per questo login.
5. Test users (mentre l’app è in **Testing**): aggiungi le email Google che
   possono accedere. In produzione, pubblica l’app OAuth (Review) quando sei
   pronto; fino ad allora solo i test user possono completare il login.

#### 2.2 Credenziale OAuth Client ID

1. **APIs & Services** → **Credentials** → **Create credentials** →
   **OAuth client ID**.
2. Application type: **Web application**.
3. Name: es. `SviluppoLamiera web`.
4. **Authorized JavaScript origins** (esattamente così, senza slash finale):

   | Ambiente   | Origine                         |
   | ---------- | ------------------------------- |
   | Produzione | `https://www.sviluppolamiera.it` |
   | Locale     | `http://localhost:8080`         |

   Se usi preview Vercel, aggiungi anche l’origine della preview
   (`https://….vercel.app`) **solo se** la userai per login Google.
5. **Authorized redirect URIs** — qui va il callback di **Supabase**, non
   quello dell’app Vue:

   ```
   https://<project-ref-dev>.supabase.co/auth/v1/callback
   https://<project-ref-prod>.supabase.co/auth/v1/callback
   ```

   Sostituisci `<project-ref-…>` con i Reference ID dei due progetti.
   Un solo Client ID può elencare entrambi gli URI.
6. Crea e copia subito:
   - **Client ID** (pubblico, tipo `….apps.googleusercontent.com`)
   - **Client Secret** (segreto: solo in Supabase Dashboard, mai nel repo)

Se perdi il secret, generane uno nuovo da Credentials → il Client →
Reset secret, poi aggiornalo in Supabase Auth → Google.

---

### 3. Collegare Google a Supabase Auth

Nel progetto Supabase (ripeti per dev e prod):

1. **Authentication** → **Providers** → **Google** → Enable.
2. Incolla **Client ID** e **Client Secret** di Google → Save.
3. **Authentication** → **URL Configuration**:

   | Campo          | Valore |
   | -------------- | ------ |
   | Site URL       | `https://www.sviluppolamiera.it` (prod) oppure `http://localhost:8080` (solo se lavori solo in locale sul progetto dev) |
   | Redirect URLs  | vedi sotto |

   **Redirect URLs** (una riga per ciascuna; sono i callback **dell’app**, non
   di Google):

   ```
   http://localhost:8080/auth/callback
   https://www.sviluppolamiera.it/auth/callback
   ```

   Opzionale, preview Vercel (wildcard esplicito se lo usi):

   ```
   https://*-tuoteam.vercel.app/auth/callback
   ```

   Sul progetto **dev**, Site URL può restare `http://localhost:8080` finché
   testi in locale; sul progetto **prod** usa sempre
   `https://www.sviluppolamiera.it`.
4. **Authentication** → **Providers** → **Email**: sul progetto **di
   produzione** lascialo disabilitato o con signup chiuso. Sul progetto
   **dev**, per i test RLS, abilita Email ma tieni **disabilitate** le
   iscrizioni pubbliche («Allow new users to sign up» off): i test creano gli
   utenti via Admin API.

Flusso runtime (già implementato nell’app):

1. L’utente clicca «Continua con Google» su `/login`.
2. Supabase apre Google; dopo il consenso Google chiama
   `https://<ref>.supabase.co/auth/v1/callback`.
3. Supabase ridirige a `https://…/auth/callback?next=…` (o localhost).
4. L’app scambia il codice PKCE, valida `next` (solo path interni che iniziano
   con `/`, niente `//` né URL assoluti) e fa `router.replace(next)`.

---

### 4. Schema database, Storage e Edge Function

Dalla root del repo, con [Supabase CLI](https://supabase.com/docs/guides/cli)
via `npx` (non serve Docker per `db push` / `functions deploy`):

```bash
# Login una tantum
npx supabase login

# Collega il progetto (Reference ID da Settings → General)
npx supabase link --project-ref <project-ref>

# Applica le migration in supabase/migrations/
#   0001_profiles.sql  — profilo + trigger su auth.users
#   0002_projects.sql  — projects, revision, RLS
#   0003_storage.sql   — bucket privato project-files + policy
npx supabase db push

# Funzione di eliminazione account (JWT obbligatorio)
npx supabase functions deploy delete-account
```

`delete-account` verifica il JWT del chiamante, cancella ricorsivamente il
prefisso `{user_id}/` nel bucket `project-files`, poi chiama
`auth.admin.deleteUser`. Il cascade elimina `profiles` e `projects`. Se lo
Storage fallisce, **non** cancella l’utente (la funzione è rieseguibile).
`SUPABASE_URL`, anon key e service role sono iniettate da Supabase nell’ambiente
della funzione: non vanno messe a mano nel frontend.

Verifica rapida in Dashboard dopo `db push`:

- Table Editor: tabelle `profiles` e `projects`
- Storage: bucket `project-files` (private)
- Authentication → Policies / oppure SQL: RLS enabled su quelle tabelle

---

### 5. Variabili d’ambiente dell’app

#### Locale

```bash
cp .env.example .env.local
```

Compila:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-o-publishable-key>
```

Riavvia Vite dopo aver modificato `.env.local`
(`npx vite --port 8080` da `apps/web`, oppure `npm run dev` dal root).
Senza queste variabili, `/login` mostra «L’accesso non è ancora configurato»
e il pulsante Google resta disabilitato.

#### Vercel (produzione)

Project Settings → Environment Variables (Production):

| Nome                              | Valore                         |
| --------------------------------- | ------------------------------ |
| `VITE_SUPABASE_URL`               | URL del progetto **prod**      |
| `VITE_SUPABASE_PUBLISHABLE_KEY`   | anon/publishable del **prod**  |

Redeploy dopo averle impostate. Non aggiungere `SERVICE_ROLE` né il Google
Client Secret su Vercel.

#### Test RLS (solo progetto dev)

Crea `.env.test.local` nella root (gitignored, **senza** prefisso `VITE_`):

```bash
SUPABASE_URL=https://<project-ref-dev>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<anon-key-dev>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-dev>
```

Poi:

```bash
npm run test:rls
```

I test creano due utenti A/B, verificano che A non legga/aggiorni/cancelli i
progetti di B, né carichi DXF nel prefisso altrui, e ripuliscono. Senza questo
file i test RLS vengono saltati.

---

### 6. Checklist di verifica (dopo la configurazione)

Ordine consigliato sul progetto **dev** + locale:

1. `npx supabase db push` e `functions deploy delete-account` senza errori.
2. `.env.local` valorizzato; Vite su `http://localhost:8080`.
3. Apri `/login` → il messaggio «non configurato» **non** deve comparire;
   «Continua con Google» è abilitato.
4. Completa il login con un test user Google → torni su
   `/auth/callback` e poi sul `next` richiesto (es. `/progetti`).
5. Header: avatar / menu account (I miei progetti, Account, Esci).
6. Calcolatore → «Salva nel tuo account» → dopo login il profilo compare in
   `/progetti`.
7. Editor → importa un DXF del `corpus/` → Salva → stesso flusso; in Storage
   compare `{user_id}/{project_id}/source.dxf`.
8. Chiudi il browser, riapri, Accedi → `/progetti` → riapri il pezzo: stato
   identico.
9. Con un secondo account Google, aprendo `/progetti/<id-del-primo>` non vedi
   il progetto (messaggio unico «non trovato»).
10. Account → «Scarica i miei dati» (JSON) e, se vuoi, «Elimina account»
    (digitando l’email).
11. `npm run test:rls` verde sul progetto dev.
12. Su **prod**: stessi passi Google/Supabase con Site URL e variabili Vercel
    di produzione; Site URL = `https://www.sviluppolamiera.it`.

Problemi frequenti:

| Sintomo | Cosa controllare |
| ------- | ---------------- |
| «Accesso non configurato» | `.env.local` / env Vercel e restart/redeploy |
| `redirect_uri_mismatch` su Google | URI in Google = esattamente `https://<ref>.supabase.co/auth/v1/callback` |
| Dopo Google torni su Supabase e ti ferma | Redirect URLs in Supabase: manca `/auth/callback` dell’origine usata |
| Login ok solo in Testing | Aggiungi l’email in Test users, oppure pubblica l’app OAuth |
| Pulsante Google ok ma salvataggio fallisce | `db push` non eseguito, o stai puntando al progetto sbagliato |
| Preview Vercel non fa login | Origine JS + Redirect URL della preview non aggiunti |

---

### Privacy

Questa nota non è una privacy policy. Prima della pubblicazione vanno decisi,
con chi segue gli obblighi del titolare: informativa aggiornata (Google come
fornitore di identità; dati trattati: nome, email, avatar, progetti, DXF che
possono contenere disegni dei clienti), DPA con Supabase, regione UE, tempi di
conservazione degli account inattivi, e se il token di sessione in
`localStorage` rientra nei cookie tecnici. In applicazione ci sono già
l’esportazione JSON dei propri dati e l’eliminazione dell’account.
