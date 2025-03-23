<template>
  <section class="preview-section">
    <h2>Anteprima Grafica</h2>
    
    <!-- Informazioni di visualizzazione -->
    <div class="preview-info">
      <div class="preview-params">
        <p class="matrix-info">
          Matrice: {{ tipoMatrice }} ({{ larghezzaMatrice }}mm)
        </p>
        <p class="radius-info">
          Raggio: {{ raggioPiega }}mm
        </p>
      </div>
    </div>
    
    <div class="canvas-wrapper">
      <canvas ref="canvas" width="800" height="400"></canvas>
    </div>
    <div class="zoom-controls">
      <label>Zoom:</label>
      <input type="range" min="0.5" max="5" step="0.1" v-model.number="scale" @input="drawPreview" />
      <button type="button" @click="resetView" class="btn">Reset View</button>
    </div>
  </section>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';

export default {
  name: 'PreviewCanvas',
  props: {
    segments: {
      type: Array,
      required: true
    },
    spessore: {
      type: Number,
      required: true
    },
    raggioPiega: {
      type: Number,
      required: true
    },
    fattoreK: {
      type: Number,
      required: true
    },
    processo: {
      type: String,
      default: 'airBend'
    },
    tipoMatrice: {
      type: String,
      required: true
    },
    larghezzaMatrice: {
      type: Number,
      required: true
    },
    tipoCava: {
      type: String,
      required: true
    }
  },
  emits: [
    'update:raggioPiega',
    'update:tipoMatrice',
    'update:larghezzaMatrice',
    'update:tipoCava'
  ],
  setup(props, { emit }) {
    const canvas = ref(null);
    const scale = ref(1);
    const panX = ref(0);
    const panY = ref(0);
    const isPanning = ref(false);
    const startPan = ref({ x: 0, y: 0 });
    
    // Funzione per disegnare l'anteprima
    const drawPreview = () => {
      if (!canvas.value) return;
      
      const ctx = canvas.value.getContext('2d');
      const canvasWidth = canvas.value.width;
      const canvasHeight = canvas.value.height;
      
      // Pulisci il canvas
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Applica le trasformazioni (pan e zoom)
      ctx.save();
      ctx.translate(panX.value, panY.value);
      ctx.scale(scale.value, scale.value);

      // Calcola il punto di partenza al centro del canvas
      const xStart = canvasWidth / 2 / scale.value - 100; // Spostato a sinistra di 100px
      const yStart = canvasHeight / 2 / scale.value;
      
      // Inizializza le coordinate correnti e l'angolo
      let x = xStart;
      let y = yStart;
      let angoloCorrente = 0;

      // Disegna una griglia leggera di sfondo
      ctx.strokeStyle = '#e5e5e5';
      ctx.lineWidth = 0.5;
      
      // Griglia orizzontale
      for (let i = -1000; i < 1000; i += 50) {
        ctx.beginPath();
        ctx.moveTo(-1000, yStart + i);
        ctx.lineTo(2000, yStart + i);
        ctx.stroke();
      }
      
      // Griglia verticale
      for (let i = -1000; i < 1000; i += 50) {
        ctx.beginPath();
        ctx.moveTo(xStart + i, -1000);
        ctx.lineTo(xStart + i, 2000);
        ctx.stroke();
      }

      // Se non ci sono segmenti, esci dalla funzione
      if (!props.segments || props.segments.length === 0) {
        ctx.restore();
        return;
      }

      // Disegna il profilo completo della lamiera
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      let puntiPiega = []; // Per memorizzare le coordinate dei punti di piega
      
      for (let i = 0; i < props.segments.length; i++) {
        const segmento = props.segments[i];
        const lunghezza = segmento.length || 0;

        // Se è il primo segmento, non ci sono pieghe precedenti
        if (i > 0 && props.segments[i-1].angle !== 0) {
          // Salva la posizione corrente come punto di piega
          puntiPiega.push({
            x,
            y,
            angolo: angoloCorrente,
            angoloPiega: props.segments[i-1].angle || 0,
            tipoPiega: props.segments[i-1].tipoPiega || 'su'
          });
        }

        // Calcola le coordinate finali del segmento
        const angleRad = (angoloCorrente * Math.PI) / 180;
        const x2 = x + lunghezza * Math.cos(angleRad);
        const y2 = y - lunghezza * Math.sin(angleRad);

        // Disegna il segmento
        ctx.lineTo(x2, y2);

        // Aggiorna le coordinate correnti
        x = x2;
        y = y2;

        // Aggiorna l'angolo per il prossimo segmento (se c'è un angolo di piega)
        if (segmento.angle) {
          const direzione = segmento.tipoPiega === 'su' ? 1 : -1;
          angoloCorrente += segmento.angle * direzione;
        }
      }
      
      // Completa il tracciato e disegna
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Disegna spessore della lamiera
      ctx.save();
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.3;
      
      x = xStart;
      y = yStart;
      angoloCorrente = 0;
      
      ctx.beginPath();
      ctx.moveTo(x, y + props.spessore);
      
      for (let i = 0; i < props.segments.length; i++) {
        const segmento = props.segments[i];
        const lunghezza = segmento.length || 0;

        if (i > 0 && props.segments[i-1].angle !== 0) {
          // Gestisci la piega con spessore
          const piegaAngolo = props.segments[i-1].angle || 0;
          const piegaTipo = props.segments[i-1].tipoPiega || 'su';
          const direzione = piegaTipo === 'su' ? 1 : -1;
          
          // Calcola l'offset dello spessore in base all'angolo corrente
          const offsetX = props.spessore * Math.sin((angoloCorrente * Math.PI) / 180);
          const offsetY = props.spessore * Math.cos((angoloCorrente * Math.PI) / 180);
          
          // Applica l'offset nella direzione corretta
          const x2 = x + offsetX * (direzione === 1 ? -1 : 1);
          const y2 = y + offsetY * (direzione === 1 ? 1 : -1);
          
          ctx.lineTo(x2, y2);
        }
        
        // Calcola le coordinate finali del segmento con lo spessore
        const angleRad = (angoloCorrente * Math.PI) / 180;
        const offsetX = props.spessore * Math.sin(angleRad);
        const offsetY = props.spessore * Math.cos(angleRad);
        
        const x2 = x + lunghezza * Math.cos(angleRad);
        const y2 = y - lunghezza * Math.sin(angleRad);
        
        // Disegna il segmento con lo spessore
        const x2Offset = x2 - offsetX;
        const y2Offset = y2 + offsetY;
        
        ctx.lineTo(x2Offset, y2Offset);
        
        // Aggiorna le coordinate correnti
        x = x2;
        y = y2;
        
        // Aggiorna l'angolo per il prossimo segmento
        if (segmento.angle) {
          const direzione = segmento.tipoPiega === 'su' ? 1 : -1;
          angoloCorrente += segmento.angle * direzione;
        }
      }
      
      ctx.stroke();
      ctx.restore();
      
      // Disegna i punti di piega
      for (const punto of puntiPiega) {
        ctx.save();
        
        // Disegna il punto di piega
        ctx.beginPath();
        ctx.arc(punto.x, punto.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#dc3545';
        ctx.fill();
        
        // Disegna il raggio di piega se è maggiore di 0
        if (props.raggioPiega > 0) {
          const direzione = punto.tipoPiega === 'su' ? 1 : -1;
          const startAngle = ((punto.angolo - 90) * Math.PI) / 180;
          const endAngle = ((punto.angolo - 90 + (punto.angoloPiega * direzione)) * Math.PI) / 180;
          
          // Disegna il raggio interno
          ctx.beginPath();
          ctx.arc(punto.x, punto.y, props.raggioPiega, startAngle, endAngle, direzione !== 1);
          ctx.strokeStyle = '#28a745';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          
          // Visualizza un'annotazione con il valore del raggio
          ctx.font = '12px Arial';
          ctx.fillStyle = '#28a745';
          ctx.fillText(`R${props.raggioPiega}`, punto.x + 10, punto.y - 10);
        }
        
        ctx.restore();
      }
      
      // Ripristina il contesto
      ctx.restore();
    };
    
    const resetView = () => {
      panX.value = 0;
      panY.value = 0;
      scale.value = 1;
      drawPreview();
    };
    
    const calcolaRaggioOttimale = () => {
      // Calcolo semplificato per il raggio ottimale interno
      // basato sullo spessore del materiale
      const raggioOttimale = Math.max(props.spessore / 2, 0.8);
      emit('update:raggioPiega', raggioOttimale);
    };
    
    const handleWheel = (event) => {
      event.preventDefault();
      const scaleAmount = -event.deltaY * 0.001;
      scale.value = Math.min(Math.max(scale.value + scaleAmount, 0.5), 5);
      drawPreview();
    };
    
    const handleMouseDown = (event) => {
      isPanning.value = true;
      startPan.value = { x: event.clientX - panX.value, y: event.clientY - panY.value };
    };
    
    const handleMouseMove = (event) => {
      if (!isPanning.value) return;
      panX.value = event.clientX - startPan.value.x;
      panY.value = event.clientY - startPan.value.y;
      drawPreview();
    };
    
    const handleMouseUp = () => {
      isPanning.value = false;
    };
    
    onMounted(() => {
      if (canvas.value) {
        canvas.value.addEventListener("wheel", handleWheel);
        canvas.value.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        
        // Imposta le dimensioni del canvas per adattarsi al contenitore
        const container = canvas.value.parentElement;
        if (container) {
          canvas.value.width = container.clientWidth * 0.95;
          canvas.value.height = 400;
        }
        
        nextTick(() => {
          drawPreview();
        });
      }
    });
    
    onUnmounted(() => {
      if (canvas.value) {
        canvas.value.removeEventListener("wheel", handleWheel);
        canvas.value.removeEventListener("mousedown", handleMouseDown);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    });
    
    // Ridisegna quando cambiano i segmenti o i parametri
    watch(() => props.segments, () => {
      nextTick(() => {
        drawPreview();
      });
    }, { deep: true });
    
    watch([
      () => props.raggioPiega,
      () => props.spessore,
      () => props.tipoMatrice,
      () => props.larghezzaMatrice,
      () => props.tipoCava
    ], () => {
      nextTick(() => {
        drawPreview();
      });
    });
    
    return {
      canvas,
      scale,
      drawPreview,
      resetView,
      calcolaRaggioOttimale
    };
  }
};
</script>

<style scoped>
.preview-section {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  width: 100%;
  box-sizing: border-box;
}

.preview-info {
  margin-bottom: 15px;
  background: #f0f7ff;
  border: 1px dashed #b8daff;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
}

.preview-params {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.preview-params p {
  margin: 0;
  padding: 5px 10px;
  background: #fff;
  border-radius: 4px;
  font-size: 0.9rem;
}

.canvas-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border: 1px solid #ddd;
  background: #f8f9fa;
  margin: 0 auto;
  cursor: grab;
  max-width: 100%;
  height: 400px;
}

canvas {
  display: block;
  background: white;
}

.zoom-controls {
  text-align: center;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn, .btn-small {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}

.btn:hover, .btn-small:hover {
  background: #0056b3;
}
</style>