# Calcolatore Sviluppo Lamiera (Bend Allowance)

Applicazione web per il calcolo dello sviluppo lamiera, della bend allowance,
del setback e della bend deduction, con calcoli avanzati per la pressopiegatura
(springback, forza di piega, raggio effettivo da matrice, V-die ottimale).

Stack: **Vue 3** (Composition API) + **Vue Router** + **Vite**. Nessun backend:
i calcoli avvengono interamente nel browser e i progetti sono salvati in
`localStorage`.

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
