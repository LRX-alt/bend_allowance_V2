<template>
  <div class="calcolatore">
    <!-- Header principale - solo questo titolo sarà visualizzato in alto -->
    <header>
      <h1>Sviluppo Lamiera</h1>
    </header>

    <!-- Pannello principale con tabs -->
    <div class="main-panel">
      <div class="tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.id" 
          class="tab" 
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </div>
      </div>

      <!-- Tab Parametri -->
      <div v-show="activeTab === 'parameters'" class="tab-content">
        <!-- Parametri Generali - senza titolo aggiuntivo -->
        <section class="parametri">
          <div class="parameters-grid">
            <div class="form-row">
              <label>Spessore lamiera (mm) (T):</label>
              <input v-model.number="spessore" type="number" step="0.1" min="0.1" required @input="validaSpessore" />
              <p v-if="errors.spessore" class="error-message">Il valore dello spessore deve essere maggiore di 0.</p>
            </div>
            
            <div class="form-row">
              <label>Raggio di piega (mm) (R):</label>
              <input v-model.number="raggioPiega" type="number" step="0.1" min="0" required @input="validaRaggioPiega" />
              <p v-if="errors.raggioPiega" class="error-message">Il raggio di piega non può essere negativo.</p>
            </div>
            
            <div class="form-row">
              <label>Materiale:</label>
              <select v-model="materialeSelezionato" @change="aggiornaFattoreK" required>
                <option disabled value="">Seleziona un materiale</option>
                <option v-for="(kValue, mat) in fattoriKMateriali" :key="mat" :value="mat">
                  {{ mat }} (K = {{ kValue }})
                </option>
              </select>
            </div>

            <div class="form-row">
              <label>Fattore K:</label>
              <input v-model.number="fattoreK" type="number" step="0.01" min="0" max="1"/>
              
              <div class="k-factor-options">
                <label title="Se attivo, K viene calcolato in base a R e T">
                  <input type="checkbox" v-model="fattoreKDinamico" />
                  Fattore K Dinamico
                </label>
              </div>
            </div>
          </div>
        </section>

        <!-- Segmenti -->
        <section class="segmenti">
          <h2>Segmenti</h2>
          <div v-for="(segment, index) in segments" :key="index" class="segmento">
            <div class="segment-grid">
              <div class="form-row">
                <label>Lunghezza {{ index + 1 }} (mm):</label>
                <input 
                  v-model.number="segment.length" 
                  type="number" 
                  step="0.1" 
                  min="0.1" 
                  required 
                  @input="validaLunghezza(segment)" 
                />
                <p v-if="segment.errorLength" class="error-message">La lunghezza deve essere maggiore di 0.</p>
              </div>
              
              <div class="form-row">
                <label>Angolo piega (°):</label>
                <input
                  v-model.number="segment.angle"
                  type="number"
                  step="1"
                  min="-180"
                  max="180"
                  @input="validaAngolo(segment)"
                  required
                />
                <p v-if="segment.errorAngle" class="error-message">Angolo non valido! Deve essere tra -180° e 180°.</p>
              </div>
              
              <div class="form-row">
                <label>Tipologia di piega:</label>
                <select v-model="segment.tipoPiega">
                  <option value="su">In su</option>
                  <option value="giu">In giù</option>
                </select>
              </div>
              
              <div class="segment-actions">
                <button type="button" @click="rimuoviLato(index)" class="btn-remove">
                  <span class="icon">×</span> Rimuovi
                </button>
              </div>
            </div>
          </div>
          
          <button type="button" @click="aggiungiLato" class="btn-add">
            <span class="icon">+</span> Aggiungi Segmento
          </button>
        </section>
      </div>

      <!-- Tab Anteprima -->
      <div v-show="activeTab === 'preview'" class="tab-content">
        <!-- Anteprima Grafica - senza titolo aggiuntivo -->
        <section class="anteprima">
          <div class="canvas-wrapper">
            <canvas ref="canvas" width="1500" height="500"></canvas>
          </div>
          <div class="zoom-controls">
            <label>Zoom:</label>
            <input type="range" min="0.5" max="5" step="0.1" v-model.number="scale" @input="disegnaAnteprima" />
            <button type="button" @click="resetView" class="btn-control">Reset View</button>
          </div>
        </section>
      </div>

      <!-- Tab Risultati -->
      <div v-show="activeTab === 'results'" class="tab-content">
        <!-- Risultati - senza titolo ridondante -->
        <section class="risultati" v-if="dettagli && dettagli.length > 0">
          <div class="results-summary">
            <div class="result-card">
              <h3>Lunghezza Totale</h3>
              <div class="result-value">{{ risultato.toFixed(2) }} mm</div>
            </div>
          </div>
          
          <div class="results-details">
            <h3>Dettagli Segmenti</h3>
            <div class="results-grid">
              <div v-for="(dettaglio, index) in dettagli" :key="index" class="result-detail-card">
                <h4>Segmento {{ dettaglio.segmento }}</h4>
                <div class="detail-item">
                  <span>Lunghezza Effettiva:</span>
                  <span>{{ dettaglio.lunghezzaEffettiva.toFixed(2) }} mm</span>
                </div>
                <div class="detail-item" v-if="dettaglio.bendAllowance">
                  <span>Bend Allowance:</span>
                  <span>{{ dettaglio.bendAllowance.toFixed(2) }} mm</span>
                </div>
                <div class="detail-item" v-if="dettaglio.setback">
                  <span>Setback:</span>
                  <span>{{ dettaglio.setback.toFixed(2) }} mm</span>
                </div>
                <div class="detail-item" v-if="dettaglio.bendDeduction">
                  <span>Bend Deduction:</span>
                  <span>{{ dettaglio.bendDeduction.toFixed(2) }} mm</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Riepilogo dimensioni -->
        <section class="riepilogo-dimensioni" v-if="segments.length > 0">
          <h3>Riepilogo Visivo</h3>
          <div class="riepilogo">
            <div class="segment-summary" v-for="(segment, index) in segments" :key="index">
              <div class="segment-number">{{ index + 1 }}</div>
              <div class="segment-details">
                <span class="segment-length">{{ segment.length }} mm</span>
                <span class="segment-angle">{{ segment.angle }}°</span>
                <span class="segment-direction">{{ segment.tipoPiega === 'su' ? '↑' : '↓' }}</span>
              </div>
            </div>
          </div>
        </section>
        
        <!-- Pulsanti di esportazione -->
        <section class="export-section">
          <h3>Esporta</h3>
          <div class="export-buttons">
            <button @click="esportaPDF" class="btn-export">
              <span class="icon">📄</span> PDF
            </button>
            <button @click="esportaDXF" class="btn-export">
              <span class="icon">📐</span> DXF
            </button>
            <button @click="esportaSVG" class="btn-export">
              <span class="icon">🖋️</span> SVG
            </button>
          </div>
        </section>
      </div>

      <!-- Tab Calcoli Avanzati -->
      <div v-show="activeTab === 'advanced'" class="tab-content">
        <section class="advanced-calculations">
          <div class="parameters-advanced">
            <div class="adv-params-grid">
              <div class="form-row">
                <label>Processo di piega:</label>
                <select v-model="processoAvanzato" @change="aggiornaCalcoliAvanzati">
                  <option value="airBend">Air Bending</option>
                  <option value="bottoming">Bottoming</option>
                  <option value="coining">Coining</option>
                </select>
                <span class="info-tooltip" title="Metodo utilizzato per la piegatura">ⓘ</span>
              </div>
              
              <div class="form-row">
                <label>Metodo di calcolo:</label>
                <select v-model="metodoAvanzato" @change="aggiornaCalcoliAvanzati">
                  <option value="standard">Standard</option>
                  <option value="DIN6935">DIN 6935</option>
                  <option value="ANSI">ANSI/ASME</option>
                  <option value="pressbrake">Press Brake</option>
                  <option value="customK">Custom K</option>
                </select>
                <span class="info-tooltip" title="Formula utilizzata per il calcolo">ⓘ</span>
              </div>
              
              <div class="form-row">
                <label>Direzione grana:</label>
                <select v-model="direzioneAvanzata" @change="aggiornaCalcoliAvanzati">
                  <option value="parallelaPiega">Parallela alla piega</option>
                  <option value="perpendicolarePiega">Perpendicolare alla piega</option>
                </select>
                <span class="info-tooltip" title="Orientamento della grana del materiale rispetto alla linea di piega">ⓘ</span>
              </div>
              
              <div class="form-row" v-if="hasBend">
                <label>Larghezza matrice (mm):</label>
                <input v-model.number="larghezzaMatrice" type="number" min="0" step="0.1" @input="aggiornaCalcoliAvanzati" />
                <button @click="calcolaMatriceOttimale" class="btn-small">Auto</button>
              </div>
            </div>
            
            <div class="apply-advanced">
              <button @click="applicaCalcoliAvanzati" class="btn-apply-advanced">
                Applica questi calcoli ai risultati
              </button>
            </div>
          </div>
          
          <div v-if="hasBend && risultatiAvanzati" class="results-advanced">
            <div class="result-card-group">
              <div class="result-card">
                <h3>Bend Allowance</h3>
                <div class="result-value">{{ risultatiAvanzati.bendAllowance.toFixed(2) }} mm</div>
              </div>
              
              <div class="result-card">
                <h3>Springback</h3>
                <div class="result-value">{{ risultatiAvanzati.springback.toFixed(2) }}°</div>
                <div class="result-note">Compensazione necessaria</div>
              </div>
              
              <div class="result-card">
                <h3>Angolo Macchina</h3>
                <div class="result-value">{{ risultatiAvanzati.angoloEffettivo.toFixed(2) }}°</div>
                <div class="result-note">Per ottenere {{ currentBendAngle }}°</div>
              </div>
            </div>
            
            <div class="result-card-group">
              <div class="result-card">
                <h3>Forza Richiesta</h3>
                <div class="result-value">{{ risultatiAvanzati.forzaPiega.forzaTon.toFixed(2) }} t</div>
                <div class="result-note">{{ risultatiAvanzati.forzaPiega.forzaKN.toFixed(2) }} kN</div>
              </div>
              
              <div class="result-card">
                <h3>V-Die Ottimale</h3>
                <div class="result-value">{{ risultatiAvanzati.aperturaMatrice.aperturaOttimale.toFixed(2) }} mm</div>
                <div class="result-note">Range: {{ risultatiAvanzati.aperturaMatrice.rangeConsigliato.min.toFixed(2) }} - {{ risultatiAvanzati.aperturaMatrice.rangeConsigliato.max.toFixed(2) }} mm</div>
              </div>
              
              <div class="result-card" :class="{ warning: !risultatiAvanzati.raggioAdeguato }">
                <h3>Raggio Minimo</h3>
                <div class="result-value">{{ risultatiAvanzati.raggioMinimo.toFixed(2) }} mm</div>
                <div v-if="!risultatiAvanzati.raggioAdeguato" class="result-warning">
                  Raggio attuale troppo piccolo!
                </div>
              </div>
            </div>
          </div>
          
          <div v-else-if="!hasBend" class="no-data-message">
            Aggiungi almeno un segmento con un angolo di piega per visualizzare i calcoli avanzati.
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { calcolaDettagliSegmenti } from '../utils/BendingCalculator.js';
import { calcoliAvanzatiPiegatura, calcolaAperturaMatrice } from '../utils/BendingCalculatorAdvanced.js';

export default {
  name: 'CalcolatoreLamiera',
  data() {
    return {
      // Navigazione
      activeTab: 'parameters',
      tabs: [
        { id: 'parameters', name: 'Parametri' },
        { id: 'preview', name: 'Anteprima' },
        { id: 'results', name: 'Risultati' },
        { id: 'advanced', name: 'Calcoli Avanzati' },
      ],
      
      // Parametri base
      spessore: 2.0,
      raggioPiega: 1.0,
      materialeSelezionato: '',
      fattoreK: 0.33,
      fattoriKMateriali: {
        acciaio: 0.33,
        alluminio: 0.40,
        rame: 0.45,
      },
      fattoreKDinamico: false,
      
      // Parametri avanzati
      processoAvanzato: 'airBend',
      metodoAvanzato: 'standard',
      direzioneAvanzata: 'parallelaPiega',
      larghezzaMatrice: 0,
      risultatiAvanzati: null,
      usaCalcoliAvanzati: false,
      
      // Segmenti
      segments: [],
      
      // Visualizzazione anteprima
      scale: 1,
      panX: 0,
      panY: 0,
      isPanning: false,
      startPan: { x: 0, y: 0 },
      
      // Validazione
      errors: {
        spessore: false,
        raggioPiega: false,
      },
    };
  },
  computed: {
    fattoreKEffettivo() {
      if (this.fattoreKDinamico) {
        // Formula migliorata per K dinamico
        const rapporto = (this.spessore > 0 && this.raggioPiega > 0) 
          ? this.raggioPiega / this.spessore 
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
      return this.fattoreK;
    },
    dettagli() {
      if (this.usaCalcoliAvanzati && this.risultatiAvanzati) {
        // Usa i calcoli avanzati
        const dettagliStandard = calcolaDettagliSegmenti(
          this.segments,
          this.spessore,
          this.raggioPiega,
          this.fattoreKEffettivo
        ).dettagli;
        
        // Modifica i dettagli con i risultati avanzati
        return dettagliStandard.map((det, idx) => {
          if (idx > 0 && this.segments[idx-1].angle !== 0) {
            return {
              ...det,
              bendAllowance: this.risultatiAvanzati.bendAllowance,
              setback: this.risultatiAvanzati.setback,
              bendDeduction: this.risultatiAvanzati.bendDeduction
            };
          }
          return det;
        });
      } else {
        // Usa i calcoli standard
        return calcolaDettagliSegmenti(
          this.segments,
          this.spessore,
          this.raggioPiega,
          this.fattoreKEffettivo
        ).dettagli;
      }
    },
    risultato() {
      if (this.usaCalcoliAvanzati && this.risultatiAvanzati) {
        // Ricalcoliamo manualmente lo sviluppo totale con i valori avanzati
        let sviluppo = 0;
        this.dettagli.forEach(d => {
          sviluppo += d.lunghezzaEffettiva + (d.bendAllowance || 0);
        });
        return sviluppo;
      } else {
        return calcolaDettagliSegmenti(
          this.segments,
          this.spessore,
          this.raggioPiega,
          this.fattoreKEffettivo
        ).sviluppoTotale;
      }
    },
    hasBend() {
      return this.segments.length > 0 && this.segments.some(s => Math.abs(s.angle) > 0);
    },
    currentBendAngle() {
      if (!this.hasBend) return 0;
      
      for (let i = 0; i < this.segments.length; i++) {
        if (Math.abs(this.segments[i].angle) > 0) {
          return Math.abs(this.segments[i].angle);
        }
      }
      return 0;
    },
    currentBendLength() {
      if (!this.hasBend || this.segments.length < 2) return 100;
      
      for (let i = 1; i < this.segments.length; i++) {
        if (Math.abs(this.segments[i-1].angle) > 0) {
          return this.segments[i].length;
        }
      }
      return 100;
    },
  },
  watch: {
    segments: {
      handler() {
        this.disegnaAnteprima();
      },
      deep: true
    },
    spessore() {
      this.aggiornaCalcoliAvanzati();
    },
    raggioPiega() {
      this.aggiornaCalcoliAvanzati();
    },
    fattoreKEffettivo() {
      this.aggiornaCalcoliAvanzati();
    },
    activeTab(newTab) {
      if (newTab === 'preview') {
        this.$nextTick(() => {
          this.disegnaAnteprima();
        });
      } else if (newTab === 'advanced') {
        this.aggiornaCalcoliAvanzati();
      }
    }
  },
  methods: {
    // Metodi per parametri base
    aggiornaFattoreK() {
      if (this.materialeSelezionato && this.fattoriKMateriali[this.materialeSelezionato]) {
        this.fattoreK = this.fattoriKMateriali[this.materialeSelezionato];
      }
    },
    
    // Metodi per segmenti
    aggiungiLato() {
      this.segments.push({ 
        length: 50, 
        angle: 90, 
        tipoPiega: 'su', 
        errorLength: false, 
        errorAngle: false 
      });
      this.$nextTick(() => {
        this.disegnaAnteprima();
        this.aggiornaCalcoliAvanzati();
      });
    },
    rimuoviLato(index) {
      this.segments.splice(index, 1);
      this.$nextTick(() => {
        this.disegnaAnteprima();
        this.aggiornaCalcoliAvanzati();
      });
    },
    
    // Validazione
    validaSpessore() {
      this.errors.spessore = this.spessore <= 0;
    },
    validaRaggioPiega() {
      this.errors.raggioPiega = this.raggioPiega < 0;
    },
    validaLunghezza(segment) {
      segment.errorLength = segment.length <= 0;
    },
    validaAngolo(segment) {
      segment.errorAngle = segment.angle < -180 || segment.angle > 180;
    },
    
    // Anteprima
    disegnaAnteprima() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.scale, this.scale);

      const xStart = canvas.width / 2 / this.scale;
      const yStart = canvas.height / 2 / this.scale;
      let x = xStart;
      let y = yStart;
      let angoloCorrente = 0;

      // Disegna il primo punto di partenza
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#4CAF50';
      ctx.fill();
      
      for (let i = 0; i < this.segments.length; i++) {
        const segmento = this.segments[i];
        const lunghezza = segmento.length;

        const x2 = x + lunghezza * Math.cos((angoloCorrente * Math.PI) / 180);
        const y2 = y - lunghezza * Math.sin((angoloCorrente * Math.PI) / 180);

        // Disegna la linea del segmento
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Disegna il punto di piegatura
        if (i > 0) {
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = '#F44336';
          ctx.fill();
        }

        // Aggiungi etichetta per numero di segmento
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        const xMid = (x + x2) / 2;
        const yMid = (y + y2) / 2;
        const offsetX = 10 * Math.sin((angoloCorrente * Math.PI) / 180);
        const offsetY = 10 * Math.cos((angoloCorrente * Math.PI) / 180);
        ctx.fillText(`${i+1}`, xMid + offsetX, yMid + offsetY);

        x = x2;
        y = y2;

        if (segmento.angle) {
          angoloCorrente += segmento.angle * (segmento.tipoPiega === 'su' ? 1 : -1);
        }
      }
      
      // Disegna l'ultimo punto
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#FF9800';
      ctx.fill();
      
      ctx.restore();
    },
    resetView() {
      this.panX = 0;
      this.panY = 0;
      this.scale = 1;
      this.disegnaAnteprima();
    },
    handleWheel(event) {
      event.preventDefault();
      const scaleAmount = -event.deltaY * 0.001;
      this.scale = Math.min(Math.max(this.scale + scaleAmount, 0.5), 5);
      this.disegnaAnteprima();
    },
    handleMouseDown(event) {
      this.isPanning = true;
      this.startPan = { x: event.clientX - this.panX, y: event.clientY - this.panY };
    },
    handleMouseMove(event) {
      if (!this.isPanning) return;
      this.panX = event.clientX - this.startPan.x;
      this.panY = event.clientY - this.startPan.y;
      this.disegnaAnteprima();
    },
    handleMouseUp() {
      this.isPanning = false;
    },
    
    // Calcoli avanzati
    aggiornaCalcoliAvanzati() {
      if (!this.hasBend) return;
      
      const params = {
        spessore: this.spessore,
        raggioPiega: this.raggioPiega,
        angolo: this.currentBendAngle,
        lunghezzaPiega: this.currentBendLength,
        materiale: this.materialeSelezionato || 'acciaio',
        processo: this.processoAvanzato,
        metodo: this.metodoAvanzato,
        fattoreK: this.fattoreKEffettivo,
        direzione: this.direzioneAvanzata,
        larghezzaMatrice: this.larghezzaMatrice || null
      };
      
      this.risultatiAvanzati = calcoliAvanzatiPiegatura(params);
    },
    calcolaMatriceOttimale() {
      const apertura = calcolaAperturaMatrice(
        this.spessore,
        this.processoAvanzato,
        this.materialeSelezionato || 'acciaio'
      );
      this.larghezzaMatrice = apertura.aperturaOttimale;
      this.aggiornaCalcoliAvanzati();
    },
    applicaCalcoliAvanzati() {
      if (this.risultatiAvanzati) {
        this.usaCalcoliAvanzati = true;
        this.activeTab = 'results';
      }
    },
    
    // Esportazione
    esportaPDF() {
      const doc = new jsPDF();
      doc.text("Calcolatore Sviluppo Lamiera - Risultati", 10, 10);
      doc.text(`Spessore: ${this.spessore} mm`, 10, 20);
      doc.text(`Raggio di piega: ${this.raggioPiega} mm`, 10, 30);
      doc.text(`Fattore K: ${this.fattoreKEffettivo.toFixed(3)}`, 10, 40);
      
      if (this.usaCalcoliAvanzati && this.risultatiAvanzati) {
        doc.text("Calcoli avanzati applicati:", 10, 50);
        doc.text(`Processo: ${this.processoAvanzato}`, 15, 60);
        doc.text(`Metodo: ${this.metodoAvanzato}`, 15, 70);
        doc.text(`Springback: ${this.risultatiAvanzati.springback.toFixed(2)}°`, 15, 80);
      }
      
      doc.text("Segmenti:", 10, 100);
      
      this.segments.forEach((segment, index) => {
        doc.text(
          `Segmento ${index + 1}: Lunghezza: ${segment.length} mm, Angolo: ${segment.angle}°, Tipo di Piega: ${segment.tipoPiega}`,
          15,
          110 + index * 10
        );
      });
      
      doc.text(`Lunghezza totale di taglio: ${this.risultato.toFixed(2)} mm`, 10, 120 + this.segments.length * 10);
      
      doc.save("sviluppo_lamiera.pdf");
    },
    esportaDXF() {
      let dxfContent = "0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nENDSEC\n0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n";
      let x = 0;
      let y = 0;
      let angoloCorrente = 0;

      for (let i = 0; i < this.segments.length; i++) {
        const segmento = this.segments[i];
        const lunghezza = segmento.length;
        const x2 = x + lunghezza * Math.cos((angoloCorrente * Math.PI) / 180);
        const y2 = y + lunghezza * Math.sin((angoloCorrente * Math.PI) / 180);

        dxfContent += `0\nLINE\n8\n0\n10\n${x}\n20\n${y}\n11\n${x2}\n21\n${y2}\n0\n`;

        x = x2;
        y = y2;

        if (segmento.angle) {
          angoloCorrente += segmento.angle * (segmento.tipoPiega === 'su' ? 1 : -1);
        }
      }

      dxfContent += "0\nENDSEC\n0\nSECTION\n2\nEOF\n";

      const blob = new Blob([dxfContent], { type: "application/dxf" });
      saveAs(blob, "sviluppo_lamiera.dxf");
    },
    
    esportaSVG() {
      // Calcola i limiti del disegno
      let minX = 0, minY = 0, maxX = 0, maxY = 0;
      let x = 0, y = 0;
      let angoloCorrente = 0;

      // Prima passata: trova i limiti
      for (let i = 0; i < this.segments.length; i++) {
        const segmento = this.segments[i];
        const lunghezza = segmento.length;
        const x2 = x + lunghezza * Math.cos((angoloCorrente * Math.PI) / 180);
        const y2 = y - lunghezza * Math.sin((angoloCorrente * Math.PI) / 180);

        minX = Math.min(minX, x, x2);
        minY = Math.min(minY, y, y2);
        maxX = Math.max(maxX, x, x2);
        maxY = Math.max(maxY, y, y2);

        x = x2;
        y = y2;

        if (segmento.angle) {
          angoloCorrente += segmento.angle * (segmento.tipoPiega === 'su' ? 1 : -1);
        }
      }

      // Aggiungi margine
      const margin = 10;
      minX -= margin;
      minY -= margin;
      maxX += margin;
      maxY += margin;

      const width = maxX - minX;
      const height = maxY - minY;

      // Crea l'SVG
      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">\n`;
      
      // Aggiungi informazioni
      svgContent += `<text x="${minX + 10}" y="${minY + 20}" font-family="Arial" font-size="12">Spessore: ${this.spessore} mm, Raggio: ${this.raggioPiega} mm, K: ${this.fattoreKEffettivo.toFixed(3)}</text>\n`;
      
      // Aggiungi i segmenti
      x = 0;
      y = 0;
      angoloCorrente = 0;

      // Disegna punto iniziale
      svgContent += `<circle cx="${x}" cy="${y}" r="3" fill="#4CAF50" />\n`;
      
      for (let i = 0; i < this.segments.length; i++) {
        const segmento = this.segments[i];
        const lunghezza = segmento.length;
        const x2 = x + lunghezza * Math.cos((angoloCorrente * Math.PI) / 180);
        const y2 = y - lunghezza * Math.sin((angoloCorrente * Math.PI) / 180);

        // Disegna il segmento
        svgContent += `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="#2196F3" stroke-width="2" />\n`;
        
        // Disegna il punto di piega
        if (i > 0) {
          svgContent += `<circle cx="${x}" cy="${y}" r="2" fill="#F44336" />\n`;
        }
        
        // Aggiungi etichetta per numero di segmento
        const xMid = (x + x2) / 2;
        const yMid = (y + y2) / 2;
        const offsetX = 5 * Math.sin((angoloCorrente * Math.PI) / 180);
        const offsetY = 5 * Math.cos((angoloCorrente * Math.PI) / 180);
        svgContent += `<text x="${xMid + offsetX}" y="${yMid + offsetY}" font-family="Arial" font-size="10" text-anchor="middle">${i+1}</text>\n`;

        x = x2;
        y = y2;

        if (segmento.angle) {
          angoloCorrente += segmento.angle * (segmento.tipoPiega === 'su' ? 1 : -1);
        }
      }
      
      // Disegna punto finale
      svgContent += `<circle cx="${x}" cy="${y}" r="3" fill="#FF9800" />\n`;
      
      svgContent += "</svg>";

      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      saveAs(blob, "sviluppo_lamiera.svg");
    }
  },
  mounted() {
    // Aggiungi un segmento iniziale se la lista è vuota
    if (this.segments.length === 0) {
      this.aggiungiLato();
    }
    
    // Calcola larghezza matrice ottimale iniziale
    this.calcolaMatriceOttimale();
    
    // Gestione del canvas per l'anteprima quando il tab è attivo
    this.$nextTick(() => {
      if (this.activeTab === 'preview') {
        const canvas = this.$refs.canvas;
        if (canvas) {
          canvas.addEventListener("wheel", this.handleWheel);
          canvas.addEventListener("mousedown", this.handleMouseDown);
          window.addEventListener("mousemove", this.handleMouseMove);
          window.addEventListener("mouseup", this.handleMouseUp);
          this.disegnaAnteprima();
        }
      }
    });
  },
  updated() {
    // Aggiorna gli event listener del canvas ogni volta che il componente viene aggiornato
    // e il tab di anteprima è attivo
    if (this.activeTab === 'preview') {
      this.$nextTick(() => {
        const canvas = this.$refs.canvas;
        if (canvas) {
          canvas.removeEventListener("wheel", this.handleWheel);
          canvas.removeEventListener("mousedown", this.handleMouseDown);
          canvas.addEventListener("wheel", this.handleWheel);
          canvas.addEventListener("mousedown", this.handleMouseDown);
          this.disegnaAnteprima();
        }
      });
    }
  },
  beforeUnmount() {
    const canvas = this.$refs.canvas;
    if (canvas) {
      canvas.removeEventListener("wheel", this.handleWheel);
      canvas.removeEventListener("mousedown", this.handleMouseDown);
    }
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("mouseup", this.handleMouseUp);
  }
  }
  </script>

<style scoped>
.calcolatore {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 20px;
}

header h1 {
  color: #2c3e50;
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}

.main-panel {
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Tabs */
.tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #ddd;
}

.tab {
  padding: 15px 20px;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  transition: all 0.2s ease;
  text-align: center;
  flex: 1;
}

.tab:hover {
  background: #f5f5f5;
  color: #333;
}

.tab.active {
  background: #2196F3;
  color: white;
  font-weight: 600;
}

.tab-content {
  padding: 20px;
}

/* Form Elements */
section {
  background: white;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

h2 {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

h3 {
  font-size: 18px;
  font-weight: 500;
  color: #2c3e50;
  margin-top: 5px;
  margin-bottom: 10px;
}

.parameters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.form-row {
  margin-bottom: 10px;
}

.form-row label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #455a64;
}

.form-row input[type="number"],
.form-row select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-row input[type="number"]:focus,
.form-row select:focus {
  border-color: #2196F3;
  outline: none;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.k-factor-options {
  margin-top: 8px;
}

.k-factor-options label {
  display: flex;
  align-items: center;
  font-weight: normal;
  cursor: pointer;
}

.k-factor-options input[type="checkbox"] {
  margin-right: 8px;
}

.error-message {
  color: #f44336;
  font-size: 12px;
  margin-top: 4px;
}

/* Segmenti */
.segmento {
  background: #f5f5f5;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
  border-left: 3px solid #2196F3;
}

.segment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  align-items: start;
}

.segment-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.btn-add, 
.btn-remove,
.btn-control,
.btn-export,
.btn-apply-advanced,
.btn-small {
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
}

.btn-add {
  background: #4CAF50;
  color: white;
  margin-top: 10px;
}

.btn-add:hover {
  background: #43A047;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.btn-remove {
  background: #F44336;
  color: white;
}

.btn-remove:hover {
  background: #E53935;
}

.btn-control {
  background: #607D8B;
  color: white;
}

.btn-control:hover {
  background: #546E7A;
}

.btn-export {
  background: #FF9800;
  color: white;
  margin-right: 10px;
}

.btn-export:hover {
  background: #FB8C00;
}

.btn-apply-advanced {
  background: #9C27B0;
  color: white;
  padding: 10px 15px;
  font-size: 15px;
  margin-top: 15px;
}

.btn-apply-advanced:hover {
  background: #8E24AA;
}

.btn-small {
  background: #2196F3;
  color: white;
  padding: 4px 8px;
  font-size: 12px;
}

.icon {
  margin-right: 5px;
  font-weight: bold;
}

/* Anteprima Canvas */
.canvas-wrapper {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 15px;
  cursor: grab;
  box-shadow: inset 0 0 5px rgba(0,0,0,0.1);
}

canvas {
  display: block;
  max-width: 100%;
  height: auto;
}

.zoom-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.zoom-controls label {
  font-weight: 500;
}

.zoom-controls input[type="range"] {
  width: 200px;
}

/* Risultati */
.results-summary {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.result-card {
  background: #f5f5f5;
  border-radius: 6px;
  padding: 15px;
  flex: 1;
  text-align: center;
  border-top: 3px solid #2196F3;
}

.result-value {
  font-size: 24px;
  font-weight: 700;
  color: #2196F3;
  margin: 10px 0;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 15px;
}

.result-detail-card {
  background: #f5f5f5;
  border-radius: 6px;
  padding: 15px;
  border-left: 3px solid #FF9800;
}

.result-detail-card h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #455a64;
  border-bottom: 1px solid #ddd;
  padding-bottom: 5px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.detail-item span:first-child {
  color: #607D8B;
}

.detail-item span:last-child {
  font-weight: 500;
}

/* Riepilogo */
.riepilogo {
  background: #f5f5f5;
  border-radius: 6px;
  padding: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.segment-summary {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.segment-number {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2196F3;
  color: white;
  font-weight: bold;
}

.segment-details {
  padding: 5px 10px;
  display: flex;
  gap: 10px;
}

.segment-length {
  font-weight: 500;
}

.segment-angle {
  color: #F44336;
}

.segment-direction {
  color: #4CAF50;
  font-weight: bold;
}

/* Export Buttons */
.export-section {
  margin-top: 20px;
}

.export-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* Calcoli Avanzati */
.parameters-advanced {
  margin-bottom: 20px;
}

.adv-params-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.info-tooltip {
  color: #2196F3;
  cursor: help;
  margin-left: 5px;
}

.apply-advanced {
  text-align: center;
  margin-top: 15px;
}

.result-card-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.result-note {
  font-size: 12px;
  color: #607D8B;
}

.warning .result-value {
  color: #F44336;
}

.result-warning {
  color: #F44336;
  font-weight: bold;
  margin-top: 5px;
}

.no-data-message {
  text-align: center;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 6px;
  color: #607D8B;
}

/* Responsive */
@media (max-width: 768px) {
  .parameters-grid,
  .segment-grid,
  .adv-params-grid,
  .results-grid,
  .result-card-group {
    grid-template-columns: 1fr;
  }
  
  .main-panel {
    margin: 0 -15px;
    border-radius: 0;
  }
  
  .tab {
    padding: 10px;
    font-size: 14px;
  }
}
</style>