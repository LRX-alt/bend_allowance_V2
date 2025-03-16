<template>
  <div class="calculator-container" :class="{ 'dark-theme': darkMode }">
    <header class="calculator-header">
      <h1>Calcolatore Avanzato Sviluppo Lamiera</h1>
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
        
        <PreviewCanvas 
          :segments="segments"
          :spessore="spessore"
          :raggioPiega="raggioPiega"
          :fattoreK="fattoreKEffettivo"
        />
        
        <ResultsDisplay 
          :dettagli="dettagli"
          :risultato="sviluppoTotale"
          :segments="segments"
          :unitFactor="unitFactor"
          :unitLabel="unitLabel"
        />
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
        />
        
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
import { useBendCalculator } from '@/composables/useBendCalculator';
import { materialsDatabase } from '@/utils/MaterialsDatabase';

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
    
    // Condivisione
    const shareUrl = ref('');
    const shareUrlCopied = ref(false);
    
    // Dati materiali
    const materialsData = ref(materialsDatabase);
    
    // Stato principale
    const spessore = ref(2.0);
    const raggioPiega = ref(1.0);
    const materialeSelezionato = ref('');
    const fattoreK = ref(0.33);
    const fattoreKDinamico = ref(false);
    const metodoDiCalcolo = ref('standard');
    const fattoriKMateriali = ref({
      acciaio: 0.33,
      alluminio: 0.40,
      rame: 0.45,
    });
    const segments = ref([]);
    
    // Computed
    const fattoreKEffettivo = computed(() => {
      if (fattoreKDinamico.value) {
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
      }
      return fattoreK.value;
    });
    
    // Utilizzo del composable
    const { dettagli, sviluppoTotale, lunghezzaLineare } = useBendCalculator(
      segments, 
      spessore, 
      raggioPiega, 
      fattoreKEffettivo,
      metodoDiCalcolo
    );
    
    // Metodi
    const aggiungiLato = () => {
      segments.value = [...segments.value, { 
        length: 50, 
        angle: 90, 
        tipoPiega: 'su', 
        errorLength: false, 
        errorAngle: false 
      }];
    };
    
    const rimuoviLato = (index) => {
      segments.value.splice(index, 1);
    };
    
    const updateFattoriKMateriali = (newValue) => {
      fattoriKMateriali.value = newValue;
    };
    
    const updateFattoreK = (newValue) => {
      fattoreK.value = newValue;
      fattoreKDinamico.value = false; // Disattiva la modalità dinamica quando si applica un fattore K personalizzato
    };
    
    const updateUnits = (unitInfo) => {
      unitFactor.value = unitInfo.factor;
      unitLabel.value = unitInfo.unit;
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
        segments: segments.value
      };
      
      // Recupera progetti esistenti
      const progettiSalvati = JSON.parse(localStorage.getItem('bendingProjects') || '[]');
      progettiSalvati.push(progetto);
      
      // Salva nel localStorage
      localStorage.setItem('bendingProjects', JSON.stringify(progettiSalvati));
      alert(`Progetto "${nomeProg}" salvato con successo!`);
    };
    
    const caricaProgetto = () => {
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
      spessore.value = progetto.spessore;
      raggioPiega.value = progetto.raggioPiega;
      materialeSelezionato.value = progetto.materialeSelezionato;
      fattoreK.value = progetto.fattoreK;
      fattoreKDinamico.value = progetto.fattoreKDinamico || false;
      metodoDiCalcolo.value = progetto.metodoDiCalcolo || 'standard';
      segments.value = progetto.segments || [];
      
      alert(`Progetto "${progetto.nome}" caricato con successo!`);
      
      // Passa alla tab principale
      activeTab.value = 'base';
    };
    
    const nuovoProgetto = () => {
      if (!confirm('Sei sicuro di voler creare un nuovo progetto? I dati non salvati andranno persi.')) {
        return;
      }
      
      // Reset dei valori
      spessore.value = 2.0;
      raggioPiega.value = 1.0;
      materialeSelezionato.value = '';
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
      // Implementazione della generazione di un link di condivisione
      const projectData = {
        v: 1, // versione
        t: spessore.value,
        r: raggioPiega.value,
        k: fattoreK.value,
        m: metodoDiCalcolo.value,
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
    
    // Gestione tema scuro
    watch(darkMode, (newValue) => {
      document.body.classList.toggle('dark-theme', newValue);
      localStorage.setItem('darkMode', newValue);
    });
    
    // Inizializzazione
    onMounted(() => {
      // Carica tema
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      darkMode.value = savedDarkMode;
      
      // Aggiungi un segmento iniziale se non ce ne sono
      if (segments.value.length === 0) {
        aggiungiLato();
      }
      
      // Controlla se c'è un progetto condiviso nell'URL
      const urlParams = new URLSearchParams(window.location.search);
      const encodedProject = urlParams.get('share');
      
      if (encodedProject) {
        try {
          // Decodifica il progetto dall'URL
          const jsonStr = atob(encodedProject);
          const projectData = JSON.parse(jsonStr);
          
          // Carica il progetto
          if (projectData.v === 1) {
            spessore.value = projectData.t;
            raggioPiega.value = projectData.r;
            fattoreK.value = projectData.k;
            metodoDiCalcolo.value = projectData.m || 'standard';
            segments.value = projectData.s.map(s => ({
              length: s[0],
              angle: s[1],
              tipoPiega: s[2] || 'su',
              errorLength: false,
              errorAngle: false
            }));
            
            // Passa alla scheda principale
            activeTab.value = 'base';
          }
        } catch (error) {
          console.error('Errore durante il caricamento del progetto condiviso:', error);
        }
      }
    });
    
    return {
      activeTab,
      tabs,
      darkMode,
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
      sviluppoTotale,
      lunghezzaLineare,
      unitFactor,
      unitLabel,
      materialsData,
      shareUrl,
      shareUrlCopied,
      aggiungiLato,
      rimuoviLato,
      updateFattoriKMateriali,
      updateFattoreK,
      updateUnits,
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

.tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
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
}

.settings-section {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
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

/* Materiali tab */
.materials-reference {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
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

/* Tema scuro */
.dark-theme {
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
.dark-theme .materials-reference {
  background: #333;
  border-color: #444;
  color: #f0f0f0;
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

.dark-theme .btn {
  background: #0066cc;
}

.dark-theme .btn:hover {
  background: #0055aa;
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
}
</style>