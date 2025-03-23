<template>
  <div class="calculator-container" :class="{ 'dark-theme': darkMode }">
    <header class="calculator-header">
      <!-- Titolo semplificato -->
      <h1>Sviluppo Lamiera</h1>
      <UnitsSelector @update:unit="updateUnits" />
    </header>
    
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-btn', activeTab === tab.id ? 'active' : '']"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>
    
    <div class="tab-content">
      <!-- Tab Calcolatore Base -->
      <div v-if="activeTab === 'base'" class="tab-pane">
        <div class="main-calculator-layout">
          <div class="left-column">
            <ParametersInput 
              v-model:spessore="spessore"
              v-model:raggioPiega="raggioPiega"
              v-model:materialeSelezionato="materialeSelezionato"
              v-model:fattoreK="fattoreK"
              v-model:fattoreKDinamico="fattoreKDinamico"
              v-model:metodoDiCalcolo="metodoDiCalcolo"
              :fattoriKMateriali="fattoriKMateriali"
              @update:fattoriKMateriali="updateFattoriKMateriali"
              :unitFactor="unitFactor"
            />
            
            <SegmentsList 
              v-model="segments"
              @add="aggiungiLato"
              @remove="rimuoviLato"
              :unitFactor="unitFactor"
              :unitLabel="unitLabel"
            />
          </div>
          
          <div class="right-column">
            <PreviewCanvas 
              :segments="segments"
              :spessore="spessore"
              v-model:raggioPiega="raggioPiega"
              :fattoreK="fattoreKEffettivo"
              :processo="processo"
              v-model:tipoMatrice="tipoMatrice"
              v-model:larghezzaMatrice="larghezzaMatrice"
              v-model:tipoCava="tipoCava"
            />
            
            <!-- Parametri di piegatura migliorati con integrazione calcoli avanzati -->
            <div class="bend-parameters-card">
              <h3>Parametri di Piegatura 
                <span v-if="usaCalcoliAvanzati" class="badge-small advanced-badge">Avanzati</span>
              </h3>
              
              <!-- Parametri base sempre visibili -->
              <div class="parameters-grid">
                <div class="form-row">
                  <label>Processo di piega:</label>
                  <select v-model="processo" @change="aggiornaCalcoliAvanzati">
                    <option value="airBend">Air Bending</option>
                    <option value="bottoming">Bottoming</option>
                    <option value="coining">Coining</option>
                  </select>
                  <i class="info-icon" title="Metodo utilizzato per la piegatura">i</i>
                </div>
                
                <div class="form-row">
                  <label>Direzione grana:</label>
                  <select v-model="direzione" @change="aggiornaCalcoliAvanzati">
                    <option value="parallelaPiega">Parallela alla piega</option>
                    <option value="perpendicolarePiega">Perpendicolare alla piega</option>
                  </select>
                  <i class="info-icon" title="Orientamento della grana del materiale rispetto alla linea di piega">i</i>
                </div>
              </div>
              
              <!-- Toggle per modalità avanzata/standard -->
              <div class="calculation-mode-toggle" v-if="hasBendAndAdvanced">
                <label class="toggle-label">
                  <span class="mode-text">Modalità di calcolo:</span>
                  <span class="toggle-switch">
                    <input type="checkbox" v-model="usaCalcoliAvanzati" @change="toggleCalcoliAvanzati">
                    <span class="slider"></span>
                  </span>
                  <span class="mode-text">{{ usaCalcoliAvanzati ? 'Avanzata' : 'Standard' }}</span>
                </label>
                <i class="info-icon" title="La modalità avanzata considera più parametri per calcoli più precisi">i</i>
              </div>
              
              <!-- Parametri aggiuntivi visibili solo in modalità avanzata -->
              <div v-if="usaCalcoliAvanzati && hasBendAndAdvanced" class="advanced-params">
                <h4>Parametri Avanzati</h4>
                <div class="parameters-grid">
                  <div class="form-row">
                    <label>Tipo di matrice:</label>
                    <select v-model="tipoMatrice" @change="aggiornaCalcoliAvanzati">
                      <option value="vDie">V-Die</option>
                      <option value="gooseneck">Gooseneck</option>
                      <option value="offset">Offset</option>
                      <option value="zDie">Z-Die</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  
                  <div class="form-row">
                    <label>Larghezza matrice (mm):</label>
                    <input v-model.number="larghezzaMatrice" type="number" min="0" step="0.1" @change="aggiornaCalcoliAvanzati" />
                    <button @click="calcolaMatriceOttimale" class="btn-small">Auto</button>
                  </div>
                </div>
              </div>
              
              <!-- Indicatore di stato dei calcoli -->
              <div v-if="hasBendAndAdvanced" class="calculation-status" :class="{ 'active': usaCalcoliAvanzati }">
                <div class="status-icon">
                  <span class="icon-circle"></span>
                </div>
                <div class="status-text">
                  {{ usaCalcoliAvanzati ? 'Calcoli avanzati attivi' : 'Calcoli standard' }}
                </div>
              </div>
            </div>
            
            <ResultsDisplay 
              :dettagli="dettagli"
              :risultato="sviluppoTotale"
              :segments="segments"
              :unitFactor="unitFactor"
              :unitLabel="unitLabel"
              :usaCalcoliAvanzati="usaCalcoliAvanzati"
              :risultatiAvanzati="risultatiAvanzati"
              :dettagliStandard="dettagliStandard"
              :isAdvancedRecommended="isAdvancedRecommended"
            />
            
            <!-- Sezione di confronto calcoli standard vs avanzati -->
            <div class="comparison-section" v-if="risultatiAvanzati && dettagliStandard.length > 1 && hasBend">
              <h3>Confronto Calcoli</h3>
              <div class="comparison-grid">
                <div class="comparison-row header">
                  <div class="comparison-cell">Parametro</div>
                  <div class="comparison-cell">Standard</div>
                  <div class="comparison-cell">Avanzato</div>
                  <div class="comparison-cell">Differenza</div>
                </div>
                
                <div class="comparison-row">
                  <div class="comparison-cell">Bend Allowance</div>
                  <div class="comparison-cell">{{ dettagliStandard[1]?.bendAllowance?.toFixed(2) || '-' }} mm</div>
                  <div class="comparison-cell">{{ risultatiAvanzati.bendAllowance?.toFixed(2) || '-' }} mm</div>
                  <div class="comparison-cell" :class="{ significant: isDifferenceSignificant(dettagliStandard[1]?.bendAllowance, risultatiAvanzati.bendAllowance) }">
                    {{ calculateDifference(dettagliStandard[1]?.bendAllowance, risultatiAvanzati.bendAllowance) }}
                  </div>
                </div>
                
                <div class="comparison-row">
                  <div class="comparison-cell">Setback</div>
                  <div class="comparison-cell">{{ dettagliStandard[1]?.setback?.toFixed(2) || '-' }} mm</div>
                  <div class="comparison-cell">{{ risultatiAvanzati.setback?.toFixed(2) || '-' }} mm</div>
                  <div class="comparison-cell" :class="{ significant: isDifferenceSignificant(dettagliStandard[1]?.setback, risultatiAvanzati.setback) }">
                    {{ calculateDifference(dettagliStandard[1]?.setback, risultatiAvanzati.setback) }}
                  </div>
                </div>
                
                <div class="comparison-row">
                  <div class="comparison-cell">Bend Deduction</div>
                  <div class="comparison-cell">{{ dettagliStandard[1]?.bendDeduction?.toFixed(2) || '-' }} mm</div>
                  <div class="comparison-cell">{{ risultatiAvanzati.bendDeduction?.toFixed(2) || '-' }} mm</div>
                  <div class="comparison-cell" :class="{ significant: isDifferenceSignificant(dettagliStandard[1]?.bendDeduction, risultatiAvanzati.bendDeduction) }">
                    {{ calculateDifference(dettagliStandard[1]?.bendDeduction, risultatiAvanzati.bendDeduction) }}
                  </div>
                </div>
              </div>
              
              <div class="recommendation" v-if="isAdvancedRecommended">
                <p><strong>Consiglio:</strong> In base ai parametri attuali, è consigliabile utilizzare i calcoli avanzati per risultati più precisi.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tab Calcoli Avanzati -->
      <div v-if="activeTab === 'advanced'" class="tab-pane">
        <AdvancedCalculations 
          :spessore="spessore"
          :raggioPiega="raggioPiega"
          :segments="segments"
          :fattoreK="fattoreKEffettivo"
          :unitFactor="unitFactor"
          :unitLabel="unitLabel"
          :processo="processo"
          :direzione="direzione"
          :tipoMatrice="tipoMatrice"
          :larghezzaMatrice="larghezzaMatrice"
          :tipoCava="tipoCava"
          v-model:risultatiAvanzati="risultatiAvanzati"
          @update:risultatiAvanzati="updateRisultatiAvanzati"
        />
        
        <div class="apply-advanced-section" v-if="hasBendAndAdvanced">
          <div class="apply-status">
            <span class="status-label">Stato calcoli avanzati:</span>
            <span class="status-value" :class="{ 'active': usaCalcoliAvanzati }">
              {{ usaCalcoliAvanzati ? 'Attivi' : 'Non attivi' }}
            </span>
          </div>
          <button @click="applicaCalcoliAvanzati" class="btn-apply-advanced">
            {{ usaCalcoliAvanzati ? 'Aggiorna calcoli avanzati' : 'Applica calcoli avanzati' }}
          </button>
          <button v-if="usaCalcoliAvanzati" @click="disattivaCalcoliAvanzati" class="btn-reset">
            Torna a calcoli standard
          </button>
        </div>
        
        <BendCompensationCalculator
          @update:fattoreK="updateFattoreK"
          :unitFactor="unitFactor"
          :unitLabel="unitLabel"
        />
      </div>
      
      <!-- Tab Guida ai Materiali -->
      <div v-if="activeTab === 'materials'" class="tab-pane">
        <section class="materials-reference">
          <h2>Guida ai Materiali</h2>
          
          <table class="materials-table">
            <thead>
              <tr>
                <th>Materiale</th>
                <th>Fattore K</th>
                <th>Raggio Minimo (x T)</th>
                <th>Springback</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(mat, index) in materialsData" :key="index">
                <td>{{ mat.name }}</td>
                <td>{{ mat.bending.kFactor }}</td>
                <td>{{ mat.bending.minRadiusParallel }}T</td>
                <td>{{ (mat.bending.springback * 100).toFixed(0) }}%</td>
                <td>{{ mat.notes }}</td>
              </tr>
            </tbody>
          </table>
          
          <h3>Formule di Riferimento</h3>
          <div class="formulas-reference">
            <div class="formula-card">
              <h4>Bend Allowance (BA)</h4>
              <div class="formula">BA = α × (R + K × T)</div>
              <p>Dove:<br>
                α = angolo in radianti<br>
                R = raggio interno<br>
                K = fattore K<br>
                T = spessore
              </p>
            </div>
            
            <div class="formula-card">
              <h4>Setback (SB)</h4>
              <div class="formula">SB = (R + T) × tan(α/2)</div>
              <p>Dove:<br>
                α = angolo in radianti<br>
                R = raggio interno<br>
                T = spessore
              </p>
            </div>
            
            <div class="formula-card">
              <h4>Bend Deduction (BD)</h4>
              <div class="formula">BD = 2 × SB - BA</div>
              <p>Dove:<br>
                SB = setback<br>
                BA = bend allowance
              </p>
            </div>
            
            <div class="formula-card">
              <h4>Forza di Piegatura</h4>
              <div class="formula">F = (K × S × T² × L) / V</div>
              <p>Dove:<br>
                K = coefficiente (~ 1.33)<br>
                S = resistenza materiale<br>
                T = spessore<br>
                L = lunghezza piega<br>
                V = apertura matrice
              </p>
            </div>
          </div>
        </section>
      </div>
      
      <!-- Tab Impostazioni -->
      <div v-if="activeTab === 'settings'" class="tab-pane">
        <h2>Impostazioni</h2>
        
        <div class="settings-section">
          <h3>Gestione Progetti</h3>
          <div class="button-group">
            <button @click="salvaProgetto" class="btn">Salva Progetto</button>
            <button @click="caricaProgetto" class="btn">Carica Progetto</button>
            <button @click="nuovoProgetto" class="btn">Nuovo Progetto</button>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>Esportazione</h3>
          <div class="button-group">
            <button @click="esportaPDF" class="btn">Esporta PDF</button>
            <button @click="esportaDXF" class="btn">Esporta DXF</button>
            <button @click="esportaSVG" class="btn">Esporta SVG</button>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>Personalizzazione</h3>
          <div class="form-row">
            <label>
              <input type="checkbox" v-model="darkMode" />
              Modalità Scura
            </label>
          </div>
          
          <div class="form-row">
            <label>Modalità di calcolo predefinita:</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="calcoliAvanzatiDefault" :value="false">
                Standard
              </label>
              <label class="radio-label">
                <input type="radio" v-model="calcoliAvanzatiDefault" :value="true">
                Avanzata
              </label>
            </div>
          </div>
        </div>
        
        <div class="settings-section">
          <h3>Condivisione Progetto</h3>
          <p>Genera un link per condividere questo progetto con altri utenti.</p>
          <div class="sharing-controls">
            <button @click="generateShareLink" class="btn">Genera Link di Condivisione</button>
            <div v-if="shareUrl" class="share-url-container">
              <input type="text" readonly v-model="shareUrl" class="share-url-input" />
              <button @click="copyShareUrl" class="btn-copy">Copia</button>
            </div>
            <p v-if="shareUrlCopied" class="success-message">Link copiato negli appunti!</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import ParametersInput from '@/components/calculator/ParametersInput.vue';
import SegmentsList from '@/components/calculator/SegmentsList.vue';
import PreviewCanvas from '@/components/calculator/PreviewCanvas.vue';
import ResultsDisplay from '@/components/calculator/ResultsDisplay.vue';
import AdvancedCalculations from '@/components/calculator/AdvancedCalculations.vue';
import BendCompensationCalculator from '@/components/calculator/BendCompensationCalculator.vue';
import UnitsSelector from '@/components/common/UnitsSelector.vue';
import { calcolaDettagliSegmenti } from '@/utils/BendingCalculator.js';
import { useBendCalculator } from '@/composables/useBendCalculator';
import { materialsDatabase } from '@/utils/MaterialsDatabase';
import { calcoliAvanzatiPiegatura, calcolaAperturaMatrice } from '@/utils/BendingCalculatorAdvanced.js';

export default {
  name: 'CalculatorView',
  components: {
    ParametersInput,
    SegmentsList,
    PreviewCanvas,
    ResultsDisplay,
    AdvancedCalculations,
    BendCompensationCalculator,
    UnitsSelector
  },
  setup() {
    // Tabs
    const activeTab = ref('base');
    const tabs = [
      { id: 'base', label: 'Calcolatore' },
      { id: 'advanced', label: 'Calcoli Avanzati' },
      { id: 'materials', label: 'Guida Materiali' },
      { id: 'settings', label: 'Impostazioni' }
    ];
    
    // Unità di misura
    const unitFactor = ref(1); // 1 per mm (default)
    const unitLabel = ref('mm');
    
    // Tema
    const darkMode = ref(false);
    
    // Preferenze utente
    const calcoliAvanzatiDefault = ref(false);
    
    // Condivisione
    const shareUrl = ref('');
    const shareUrlCopied = ref(false);
    
    // Dati materiali
    const materialsData = ref(materialsDatabase);
    
    // Stato principale
    const spessore = ref(2.0);
    const raggioPiega = ref(1.0);
    const materialeSelezionato = ref('acciaio');
    const fattoreK = ref(0.33);
    const fattoreKDinamico = ref(false);
    const metodoDiCalcolo = ref('standard');
    const fattoriKMateriali = ref({
      acciaio: 0.33,
      alluminio: 0.40,
      rame: 0.45,
      ottone: 0.42,
      inox: 0.38,
      titanio: 0.35
    });
    
    // Nuovi parametri per la piegatura
    const processo = ref('airBend');
    const direzione = ref('parallelaPiega');
    const tipoMatrice = ref('vDie');
    const larghezzaMatrice = ref(8 * spessore.value); // Valore iniziale basato sullo spessore
    const tipoCava = ref('standard');
    
    // Segmenti
    const segments = ref([]);
    
    // Risultati avanzati e flag per l'uso
    const risultatiAvanzati = ref(null);
    const usaCalcoliAvanzati = ref(calcoliAvanzatiDefault.value);
    
    // Computed con protezione per null/undefined
    const fattoreKEffettivo = computed(() => {
      if (!fattoreKDinamico.value) {
        return fattoreK.value || 0.33;
      }
      
      // Formula migliorata per K dinamico
      const rapporto = (spessore.value > 0 && raggioPiega.value > 0) 
        ? raggioPiega.value / spessore.value 
        : 0;
          
      if (rapporto < 1) {
        return 0.33; // Per rapporti molto bassi
      } else if (rapporto < 2) {
        return 0.35; // Per rapporti bassi
      } else if (rapporto < 4) {
        return 0.38; // Per rapporti medi
      } else if (rapporto < 8) {
        return 0.40; // Per rapporti alti
      } else {
        return 0.42; // Per rapporti molto alti
      }
    });
    
    // Computed per verificare se ci sono pieghe e calcoli avanzati con protezione
    const hasBend = computed(() => {
      if (!segments.value || segments.value.length === 0) {
        return false;
      }
      return segments.value.some(s => s && typeof s.angle === 'number' && Math.abs(s.angle) > 0);
    });
    
    const hasBendAndAdvanced = computed(() => {
      return hasBend.value && risultatiAvanzati.value !== null;
    });
    
    const currentBendAngle = computed(() => {
      if (!hasBend.value || !segments.value) {
        return 0;
      }
      
      for (let i = 0; i < segments.value.length; i++) {
        const segment = segments.value[i];
        if (segment && typeof segment.angle === 'number' && Math.abs(segment.angle) > 0) {
          return Math.abs(segment.angle);
        }
      }
      return 0;
    });
    
    const currentBendLength = computed(() => {
      if (!hasBend.value || !segments.value || segments.value.length < 2) {
        return 100;
      }
      
      for (let i = 1; i < segments.value.length; i++) {
        const prevSegment = segments.value[i-1];
        const currSegment = segments.value[i];
        
        if (prevSegment && currSegment && 
            typeof prevSegment.angle === 'number' && 
            typeof currSegment.length === 'number' && 
            Math.abs(prevSegment.angle) > 0) {
          return currSegment.length;
        }
      }
      return 100;
    });
    
    // Calcoli protetti usando try-catch
    const bendCalculatorResult = computed(() => {
  if (!segments.value || segments.value.length === 0) {
    return { dettagli: [], sviluppoTotale: 0 };
  }
  
  try {
    return calcolaDettagliSegmenti(
      segments.value,
      spessore.value || 0,
      raggioPiega.value || 0,
      fattoreKEffettivo.value || 0.33,
      metodoDiCalcolo.value || 'standard'
    );
  } catch (error) {
    console.error("Errore nel calcolo dettagli:", error);
    return { dettagli: [], sviluppoTotale: 0 };
  }
});
    
    const dettagliStandard = computed(() => bendCalculatorResult.value?.dettagli || []);
    const sviluppoTotaleStandard = computed(() => bendCalculatorResult.value?.sviluppoTotale || 0);
    
    // Metodi per confrontare calcoli standard e avanzati
    const calculateDifference = (standard, advanced) => {
      if (!standard || !advanced) return '-';
      const diff = ((advanced - standard) / standard * 100).toFixed(1);
      return `${diff}%`;
    };
    
    const isDifferenceSignificant = (standard, advanced) => {
      if (!standard || !advanced) return false;
      return Math.abs((advanced - standard) / standard * 100) > 5;
    };
    
    // Computed per determinare se consigliare la modalità avanzata
    const isAdvancedRecommended = computed(() => {
      if (!risultatiAvanzati.value || !dettagliStandard.value || dettagliStandard.value.length <= 1) {
        return false;
      }
      
      // Controlla se ci sono differenze significative in uno qualsiasi dei parametri chiave
      const standardBA = dettagliStandard.value[1]?.bendAllowance || 0;
      const advancedBA = risultatiAvanzati.value.bendAllowance || 0;
      
      return isDifferenceSignificant(standardBA, advancedBA);
    });
    
    // Computed per dettagli che considera i calcoli avanzati con protezione
    const dettagli = computed(() => {
      // Se non abbiamo dettagli di base, restituisci un array vuoto
      if (!dettagliStandard.value || dettagliStandard.value.length === 0) {
        return [];
      }
      
      if (usaCalcoliAvanzati.value && risultatiAvanzati.value) {
        // Modifica i dettagli con i risultati avanzati
        return dettagliStandard.value.map((det, idx) => {
          if (idx > 0 && segments.value && 
              segments.value[idx-1] && 
              typeof segments.value[idx-1].angle === 'number' && 
              segments.value[idx-1].angle !== 0) {
            return {
              ...det,
              bendAllowance: risultatiAvanzati.value.bendAllowance,
              setback: risultatiAvanzati.value.setback,
              bendDeduction: risultatiAvanzati.value.bendDeduction,
              calcoliAvanzati: true // Aggiungiamo un flag per sapere se usiamo calcoli avanzati
            };
          }
          return {
            ...det,
            calcoliAvanzati: false
          };
        });
      } else {
        // Usa i calcoli standard
        return dettagliStandard.value.map(det => ({
          ...det,
          calcoliAvanzati: false // Aggiungiamo un flag per sapere che usiamo calcoli standard
        }));
      }
    });
    
    // Computed per sviluppo totale che considera i calcoli avanzati con protezione
    const sviluppoTotale = computed(() => {
  if (usaCalcoliAvanzati.value && risultatiAvanzati.value && dettagli.value && dettagli.value.length > 0) {
    try {
      // Ricalcoliamo manualmente lo sviluppo totale con i valori avanzati
      let sviluppo = 0;
      dettagli.value.forEach(d => {
        if (d && typeof d.lunghezzaEffettiva === 'number') {
          sviluppo += d.lunghezzaEffettiva + (d.bendAllowance || 0);
        }
      });
      return sviluppo;
    } catch (error) {
      console.error("Errore nel calcolo sviluppo avanzato:", error);
      return sviluppoTotaleStandard.value || 0;
    }
  } else {
    return sviluppoTotaleStandard.value || 0;
  }
});
    
    // Metodi per calcoli avanzati con protezione
    const aggiornaCalcoliAvanzati = () => {
  if (!hasBend.value) {
    return;
  }
  
  try {
    const params = {
      spessore: spessore.value || 0,
      raggioPiega: raggioPiega.value || 0,
      angolo: currentBendAngle.value || 0,
      lunghezzaPiega: currentBendLength.value || 100,
      materiale: materialeSelezionato.value || 'acciaio',
      processo: processo.value || 'airBend',
      metodo: metodoDiCalcolo.value || 'standard',
      fattoreK: fattoreKEffettivo.value || 0.33,
      direzione: direzione.value || 'parallelaPiega',
      larghezzaMatrice: larghezzaMatrice.value || null
    };
    
    const nuoviRisultati = calcoliAvanzatiPiegatura(params);
    risultatiAvanzati.value = {...nuoviRisultati};
  } catch (error) {
    console.error("Errore nell'aggiornamento calcoli avanzati:", error);
    // Non aggiornare risultatiAvanzati.value in caso di errore
  }
};
    
    // Nuovo metodo per gestire il toggle tra modalità standard e avanzata
    const toggleCalcoliAvanzati = () => {
    // Aggiorna i calcoli se necessario (potremmo voler fare ulteriori elaborazioni qui)
      if (usaCalcoliAvanzati.value && !risultatiAvanzati.value) {
        aggiornaCalcoliAvanzati();
      }
      
      // Salva la preferenza dell'utente
      localStorage.setItem('calcoliAvanzatiDefault', usaCalcoliAvanzati.value);
    };
    
    const calcolaMatriceOttimale = () => {
      try {
        const apertura = calcolaAperturaMatrice(
          spessore.value || 0,
          processo.value || 'airBend',
          materialeSelezionato.value || 'acciaio'
        );
        larghezzaMatrice.value = apertura.aperturaOttimale;
        aggiornaCalcoliAvanzati();
      } catch (error) {
        console.error("Errore nel calcolo matrice ottimale:", error);
      }
    };
    
    const applicaCalcoliAvanzati = () => {
      if (risultatiAvanzati.value) {
        usaCalcoliAvanzati.value = true;
        localStorage.setItem('calcoliAvanzatiDefault', 'true');
      }
    };
    
    const disattivaCalcoliAvanzati = () => {
      usaCalcoliAvanzati.value = false;
      localStorage.setItem('calcoliAvanzatiDefault', 'false');
    };
    
    // Metodi
    const aggiungiLato = () => {
      segments.value = [...segments.value, { 
        length: 50, 
        angle: 90, 
        tipoPiega: 'su', 
        errorLength: false, 
        errorAngle: false 
      }];
      
      // Aggiorna i calcoli avanzati quando si aggiunge un lato
      aggiornaCalcoliAvanzati();
    };
    
    const rimuoviLato = (index) => {
      if (segments.value && segments.value.length > index) {
        segments.value.splice(index, 1);
        // Aggiorna i calcoli avanzati quando si rimuove un lato
        aggiornaCalcoliAvanzati();
      }
    };
    
    const updateFattoriKMateriali = (newValue) => {
      if (newValue) {
        fattoriKMateriali.value = newValue;
      }
    };
    
    const updateFattoreK = (newValue) => {
      if (typeof newValue === 'number') {
        fattoreK.value = newValue;
        fattoreKDinamico.value = false; // Disattiva la modalità dinamica quando si applica un fattore K personalizzato
        aggiornaCalcoliAvanzati();
      }
    };
    
    const updateUnits = (unitInfo) => {
      if (unitInfo) {
        unitFactor.value = unitInfo.factor || 1;
        unitLabel.value = unitInfo.unit || 'mm';
      }
    };
    
    // Gestione progetti
    const salvaProgetto = () => {
      const nomeProg = prompt('Inserisci un nome per il progetto:');
      if (!nomeProg) return;
      
      const progetto = {
        nome: nomeProg,
        data: new Date().toISOString(),
        spessore: spessore.value,
        raggioPiega: raggioPiega.value,
        materialeSelezionato: materialeSelezionato.value,
        fattoreK: fattoreK.value,
        fattoreKDinamico: fattoreKDinamico.value,
        metodoDiCalcolo: metodoDiCalcolo.value,
        segments: segments.value,
        // Aggiungi i nuovi parametri di piegatura
        processo: processo.value,
        direzione: direzione.value,
        tipoMatrice: tipoMatrice.value,
        larghezzaMatrice: larghezzaMatrice.value,
        tipoCava: tipoCava.value,
        // Salva anche lo stato dei calcoli avanzati
        usaCalcoliAvanzati: usaCalcoliAvanzati.value
      };
      
      try {
        // Recupera progetti esistenti
        const progettiSalvati = JSON.parse(localStorage.getItem('bendingProjects') || '[]');
        progettiSalvati.push(progetto);
        
        // Salva nel localStorage
        localStorage.setItem('bendingProjects', JSON.stringify(progettiSalvati));
        alert(`Progetto "${nomeProg}" salvato con successo!`);
      } catch (error) {
        console.error("Errore nel salvataggio del progetto:", error);
        alert("Si è verificato un errore durante il salvataggio del progetto.");
      }
    };
    
    const caricaProgetto = () => {
      try {
        const progettiSalvati = JSON.parse(localStorage.getItem('bendingProjects') || '[]');
        if (progettiSalvati.length === 0) {
          alert('Nessun progetto salvato trovato.');
          return;
        }
        
        const options = progettiSalvati.map((p, i) => 
          `${i+1}: ${p.nome} (${new Date(p.data).toLocaleDateString()})`
        ).join('\n');
        
        const selection = prompt(`Seleziona un progetto da caricare:\n${options}`);
        if (!selection) return;
        
        const index = parseInt(selection) - 1;
        if (isNaN(index) || index < 0 || index >= progettiSalvati.length) {
          alert('Selezione non valida.');
          return;
        }
        
        const progetto = progettiSalvati[index];
        
        // Carica i dati del progetto
        spessore.value = progetto.spessore || 2.0;
        raggioPiega.value = progetto.raggioPiega || 1.0;
        materialeSelezionato.value = progetto.materialeSelezionato || 'acciaio';
        fattoreK.value = progetto.fattoreK || 0.33;
        fattoreKDinamico.value = progetto.fattoreKDinamico || false;
        metodoDiCalcolo.value = progetto.metodoDiCalcolo || 'standard';
        segments.value = progetto.segments || [];
        
        // Carica i nuovi parametri di piegatura
        if (progetto.processo) processo.value = progetto.processo;
        if (progetto.direzione) direzione.value = progetto.direzione;
        if (progetto.tipoMatrice) tipoMatrice.value = progetto.tipoMatrice;
        if (progetto.larghezzaMatrice) larghezzaMatrice.value = progetto.larghezzaMatrice;
        if (progetto.tipoCava) tipoCava.value = progetto.tipoCava;
        
        // Carica lo stato dei calcoli avanzati
        if (progetto.usaCalcoliAvanzati !== undefined) {
          usaCalcoliAvanzati.value = progetto.usaCalcoliAvanzati;
        }
        
        // Aggiorna i calcoli avanzati
        aggiornaCalcoliAvanzati();
        
        alert(`Progetto "${progetto.nome}" caricato con successo!`);
        
        // Passa alla tab principale
        activeTab.value = 'base';
      } catch (error) {
        console.error("Errore durante il caricamento del progetto:", error);
        alert("Si è verificato un errore durante il caricamento del progetto.");
      }
    };
    
    const nuovoProgetto = () => {
      if (!confirm('Sei sicuro di voler creare un nuovo progetto? I dati non salvati andranno persi.')) {
        return;
      }
      
      // Reset dei valori
      spessore.value = 2.0;
      raggioPiega.value = 1.0;
      materialeSelezionato.value = 'acciaio';
      fattoreK.value = 0.33;
      fattoreKDinamico.value = false;
      metodoDiCalcolo.value = 'standard';
      segments.value = [{ 
        length: 50, 
        angle: 90, 
        tipoPiega: 'su', 
        errorLength: false, 
        errorAngle: false 
      }];
      
      // Reset dei nuovi parametri
      processo.value = 'airBend';
      direzione.value = 'parallelaPiega';
      tipoMatrice.value = 'vDie';
      larghezzaMatrice.value = 8 * spessore.value;
      tipoCava.value = 'standard';
      
      // Reset dei calcoli avanzati ma mantiene la preferenza dell'utente
      risultatiAvanzati.value = null;
      
      // Aggiorna i calcoli avanzati
      aggiornaCalcoliAvanzati();
    };
    
    // Funzioni di esportazione
    const esportaPDF = () => {
      // Implementazione dell'esportazione PDF
      alert('Funzionalità di esportazione PDF in implementazione.');
    };
    
    const esportaDXF = () => {
      // Implementazione dell'esportazione DXF
      alert('Funzionalità di esportazione DXF in implementazione.');
    };
    
    const esportaSVG = () => {
      // Implementazione dell'esportazione SVG
      alert('Funzionalità di esportazione SVG in implementazione.');
    };
    
    // Condivisione
    const generateShareLink = () => {
      try {
        // Implementazione della generazione di un link di condivisione
        const projectData = {
          v: 1, // versione
          t: spessore.value,
          r: raggioPiega.value,
          k: fattoreK.value,
          m: metodoDiCalcolo.value,
          // Aggiungi i nuovi parametri di piegatura
          p: processo.value,
          d: direzione.value,
          mt: tipoMatrice.value,
          lm: larghezzaMatrice.value,
          tc: tipoCava.value,
          ua: usaCalcoliAvanzati.value, // Aggiungi lo stato dei calcoli avanzati
          s: segments.value.map(seg => [
            seg.length,
            seg.angle,
            seg.tipoPiega
          ])
        };
        
        // Codifica in base64
        const jsonStr = JSON.stringify(projectData);
        const encoded = btoa(jsonStr);
        
        // Genera URL
        shareUrl.value = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
        shareUrlCopied.value = false;
      } catch (error) {
        console.error("Errore nella generazione del link di condivisione:", error);
        alert("Si è verificato un errore durante la generazione del link di condivisione.");
      }
    };
    
    const copyShareUrl = () => {
      if (!shareUrl.value) return;
      
      navigator.clipboard.writeText(shareUrl.value)
        .then(() => {
          shareUrlCopied.value = true;
          setTimeout(() => {
            shareUrlCopied.value = false;
          }, 3000);
        })
        .catch(err => {
          console.error('Impossibile copiare il link: ', err);
        });
    };
    
    // Gestione tema scuro e preferenze
    watch(darkMode, (newValue) => {
      document.body.classList.toggle('dark-theme', newValue);
      localStorage.setItem('darkMode', newValue);
    });
    
    watch(calcoliAvanzatiDefault, (newValue) => {
      localStorage.setItem('calcoliAvanzatiDefault', newValue);
    });
    
    // Watch per parametri che influiscono sui calcoli avanzati
    watch([spessore, raggioPiega, direzione, processo, materialeSelezionato], () => {
      aggiornaCalcoliAvanzati();
    });
    
    // Inizializzazione
    onMounted(() => {
      // Carica tema e preferenze
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      darkMode.value = savedDarkMode;
      
      // Carica preferenza per calcoli avanzati
      const savedCalcoliAvanzati = localStorage.getItem('calcoliAvanzatiDefault') === 'true';
      calcoliAvanzatiDefault.value = savedCalcoliAvanzati;
      usaCalcoliAvanzati.value = savedCalcoliAvanzati;
      
      // Aggiungi un segmento iniziale se non ce ne sono
      if (!segments.value || segments.value.length === 0) {
        aggiungiLato();
      }
      
      // Calcola i valori avanzati iniziali
      aggiornaCalcoliAvanzati();
      
      // Calcola valore iniziale per la larghezza matrice
      calcolaMatriceOttimale();
      
      // Controlla se c'è un progetto condiviso nell'URL
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedProject = urlParams.get('share');
        
        if (encodedProject) {
          // Decodifica il progetto dall'URL
          const jsonStr = atob(encodedProject);
          const projectData = JSON.parse(jsonStr);
          
          // Carica il progetto
          if (projectData.v === 1) {
            spessore.value = projectData.t || 2.0;
            raggioPiega.value = projectData.r || 1.0;
            fattoreK.value = projectData.k || 0.33;
            metodoDiCalcolo.value = projectData.m || 'standard';
            
            // Carica i nuovi parametri di piegatura
            if (projectData.p) processo.value = projectData.p;
            if (projectData.d) direzione.value = projectData.d;
            if (projectData.mt) tipoMatrice.value = projectData.mt;
            if (projectData.lm) larghezzaMatrice.value = projectData.lm;
            if (projectData.tc) tipoCava.value = projectData.tc;
            
            // Carica lo stato dei calcoli avanzati
            if (projectData.ua !== undefined) {
              usaCalcoliAvanzati.value = projectData.ua;
            }
            
            if (projectData.s && Array.isArray(projectData.s)) {
              segments.value = projectData.s.map(s => ({
                length: s[0] || 0,
                angle: s[1] || 0,
                tipoPiega: s[2] || 'su',
                errorLength: false,
                errorAngle: false
              }));
            }
            
            // Aggiorna i calcoli avanzati
            aggiornaCalcoliAvanzati();
            
            // Passa alla scheda principale
            activeTab.value = 'base';
          }
        }
      } catch (error) {
        console.error('Errore durante il caricamento del progetto condiviso:', error);
      }
    });
    
    return {
      activeTab,
      tabs,
      darkMode,
      calcoliAvanzatiDefault,
      spessore,
      raggioPiega,
      materialeSelezionato,
      fattoreK,
      fattoreKDinamico,
      metodoDiCalcolo,
      fattoriKMateriali,
      segments,
      fattoreKEffettivo,
      dettagli,
      dettagliStandard,
      sviluppoTotale,
      unitFactor,
      unitLabel,
      materialsData,
      shareUrl,
      shareUrlCopied,
      // Parametri di piegatura
      processo,
      direzione,
      tipoMatrice,
      larghezzaMatrice,
      tipoCava,
      // Calcoli avanzati
      risultatiAvanzati,
      usaCalcoliAvanzati,
      hasBend,
      hasBendAndAdvanced,
      isAdvancedRecommended,
      // Metodi
      aggiungiLato,
      rimuoviLato,
      updateFattoriKMateriali,
      updateFattoreK,
      updateUnits,
      aggiornaCalcoliAvanzati,
      updateRisultatiAvanzati,
      calcolaMatriceOttimale,
      applicaCalcoliAvanzati,
      disattivaCalcoliAvanzati,
      toggleCalcoliAvanzati,
      calculateDifference,
      isDifferenceSignificant,
      salvaProgetto,
      caricaProgetto,
      nuovoProgetto,
      esportaPDF,
      esportaDXF,
      esportaSVG,
      generateShareLink,
      copyShareUrl
    };
  }
};
</script>

<style scoped>
.calculator-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.calculator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* Layout migliorato per la visualizzazione fianco a fianco */
.main-calculator-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  width: 100%; /* Assicura che occupi tutta la larghezza disponibile */
}

.left-column, .right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%; /* Assicura che ogni colonna utilizzi tutta la larghezza disponibile */
}

.bend-parameters-card {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  width: 100%; /* Assicura che il riquadro utilizzi tutta la larghezza disponibile */
  box-sizing: border-box; /* Include padding e bordo nella larghezza */
}

.parameters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-row label {
  min-width: 150px;
}

.info-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  background: #007bff;
  color: white;
  border-radius: 50%;
  text-align: center;
  line-height: 16px;
  font-size: 12px;
  cursor: help;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
  width: 100%; /* Assicura che utilizzi tutta la larghezza disponibile */
}

.tab-btn {
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.tab-btn.active {
  border-bottom-color: #007bff;
  font-weight: bold;
}

.tab-pane {
  margin-bottom: 30px;
  width: 100%; /* Assicura che utilizzi tutta la larghezza disponibile */
}

.settings-section {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  width: 100%; /* Assicura che utilizzi tutta la larghezza disponibile */
  box-sizing: border-box;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn:hover {
  background: #0056b3;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-small:hover {
  background: #0056b3;
}

/* Materiali tab */
.materials-reference {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  width: 100%;
  box-sizing: border-box;
}

.materials-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.materials-table th, .materials-table td {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.materials-table th {
  background-color: #f2f2f2;
  font-weight: bold;
}

.materials-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.formulas-reference {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.formula-card {
  background: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 15px;
}

.formula {
  background: #eaf4ff;
  padding: 10px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  margin: 10px 0;
  font-weight: bold;
  text-align: center;
}

/* Condivisione */
.sharing-controls {
  margin-top: 10px;
}

.share-url-container {
  display: flex;
  margin-top: 10px;
}

.share-url-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 14px;
}

.btn-copy {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

.success-message {
  color: #28a745;
  margin-top: 5px;
}

/* Nuovi stili per i calcoli avanzati */
.apply-advanced-section {
  background: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.apply-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.status-label {
  font-weight: 600;
}

.status-value {
  padding: 4px 10px;
  border-radius: 15px;
  background: #f0f0f0;
  font-size: 14px;
}

.status-value.active {
  background: #d4edda;
  color: #155724;
}

.btn-apply-advanced {
  background: #9C27B0;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  min-width: 250px;
}

.btn-apply-advanced:hover {
  background: #8E24AA;
}

.btn-reset {
  background: #6c757d;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-reset:hover {
  background: #5a6268;
}

.apply-advanced-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.btn-apply-compact {
  background: #9C27B0;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.success-badge {
  background: #d4edda;
  color: #155724;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}

/* Stili per l'integrazione calcoli avanzati */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  margin: 0 10px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #9C27B0;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.toggle-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.mode-text {
  font-size: 14px;
  font-weight: 500;
}

.calculation-mode-toggle {
  margin: 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 8px;
}

.badge-small {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 8px;
}

.advanced-params {
  margin-top: 15px;
  padding: 15px;
  background: #f0f7ff;
  border: 1px dashed #b8daff;
  border-radius: 8px;
}

.advanced-params h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #0056b3;
}

.calculation-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 14px;
}

.calculation-status.active {
  background: #d4edda;
}

.icon-circle {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #6c757d;
}

.active .icon-circle {
  background: #28a745;
}

.status-text {
  font-weight: 500;
}

.comparison-section {
  margin-top: 20px;
  padding: 15px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.comparison-grid {
  display: table;
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.comparison-row {
  display: table-row;
}

.comparison-row.header {
  font-weight: bold;
  background: #f2f2f2;
}

.comparison-cell {
  display: table-cell;
  padding: 8px 12px;
  border: 1px solid #ddd;
  text-align: center;
}

.comparison-cell:first-child {
  text-align: left;
  font-weight: 500;
}

.significant {
  color: #dc3545;
  font-weight: bold;
}

.recommendation {
  margin-top: 15px;
  padding: 10px;
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
}

.radio-group {
  display: flex;
  gap: 15px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

/* Stili per il badge */
.advanced-active {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
  text-align: center;
}

.advanced-badge {
  background: #d4edda;
  color: #155724;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 14px;
  font-weight: bold;
  display: inline-block;
}

.dark-theme .advanced-badge {
  background: #1d4b2a;
  color: #d4edda;
}

background-color: #2a2a2a;
  color: #f0f0f0;
}

.dark-theme .tab-btn {
  color: #f0f0f0;
}

.dark-theme .tab-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dark-theme .settings-section,
.dark-theme .materials-reference,
.dark-theme .bend-parameters-card,
.dark-theme .apply-advanced-section,
.dark-theme .comparison-section {
  background: #333;
  border-color: #444;
  color: #f0f0f0;
}

.dark-theme .calculation-status {
  background: #444;
}

.dark-theme .calculation-status.active {
  background: #1d4b2a;
  color: #f0f0f0;
}

.dark-theme .calculation-mode-toggle {
  background: #444;
  border-color: #555;
}

.dark-theme .advanced-params {
  background: #2a3f5f;
  border-color: #4682b4;
}

.dark-theme .advanced-params h4 {
  color: #82b1ff;
}

.dark-theme .status-value {
  background: #444;
  color: #f0f0f0;
}

.dark-theme .status-value.active {
  background: #1d4b2a;
  color: #d4edda;
}

.dark-theme .materials-table th {
  background-color: #444;
  color: #f0f0f0;
}

.dark-theme .materials-table td {
  border-color: #555;
}

.dark-theme .formula-card {
  background: #444;
  border-color: #555;
}

.dark-theme .formula {
  background: #1a3a5f;
  color: #f0f0f0;
}

.dark-theme .comparison-row.header {
  background: #444;
}

.dark-theme .comparison-cell {
  border-color: #555;
}

.dark-theme .recommendation {
  background: #1d4b2a;
  color: #d4edda;
  border-color: #28a745;
}

.dark-theme .btn {
  background: #0066cc;
}

.dark-theme .btn:hover {
  background: #0055aa;
}

.dark-theme .btn-small {
  background: #0066cc;
}

.dark-theme .btn-small:hover {
  background: #0055aa;
}

.dark-theme .slider {
  background-color: #555;
}

.dark-theme input:checked + .slider {
  background-color: #9C27B0;
}

@media (max-width: 768px) {
  .tabs {
    flex-wrap: wrap;
  }
  
  .tab-btn {
    flex: 1 0 auto;
    text-align: center;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  /* Adatta il layout per visualizzazione mobile */
  .main-calculator-layout {
    grid-template-columns: 1fr;
  }
  
  .comparison-grid {
    font-size: 14px;
  }
  
  .comparison-cell {
    padding: 6px 8px;
  }
  
  .calculation-mode-toggle {
    flex-direction: column;
    gap: 10px;
  }
  
  .parameters-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .comparison-grid {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
  
  .form-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .form-row label {
    min-width: auto;
    margin-bottom: 5px;
  }
  
  .btn, .btn-small {
    width: 100%;
    margin-top: 5px;
  }
}
</style>

/* Tema scuro */
.dark-theme {
  background-color: #2a2a2a;
  color: #f0f0f0;
}