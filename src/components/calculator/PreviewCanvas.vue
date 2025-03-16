<template>
  <section class="preview-section">
    <h2>Anteprima Grafica</h2>
    <div class="canvas-wrapper">
      <canvas ref="canvas" width="1500" height="500"></canvas>
    </div>
    <div class="zoom-controls">
      <label>Zoom:</label>
      <input type="range" min="0.5" max="5" step="0.1" v-model.number="scale" @input="drawPreview" />
      <button type="button" @click="resetView" class="btn">Reset View</button>
    </div>
  </section>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';

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
    }
  },
  setup(props) {
    const canvas = ref(null);
    const scale = ref(1);
    const panX = ref(0);
    const panY = ref(0);
    const isPanning = ref(false);
    const startPan = ref({ x: 0, y: 0 });
    
    const drawPreview = () => {
      if (!canvas.value) return;
      
      const ctx = canvas.value.getContext('2d');
      ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

      ctx.save();
      ctx.translate(panX.value, panY.value);
      ctx.scale(scale.value, scale.value);

      const xStart = canvas.value.width / 2 / scale.value;
      const yStart = canvas.value.height / 2 / scale.value;
      let x = xStart;
      let y = yStart;
      let angoloCorrente = 0;

      for (let i = 0; i < props.segments.length; i++) {
        const segmento = props.segments[i];
        const lunghezza = segmento.length;

        const x2 = x + lunghezza * Math.cos((angoloCorrente * Math.PI) / 180);
        const y2 = y - lunghezza * Math.sin((angoloCorrente * Math.PI) / 180);

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (i > 0) {
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = '#dc3545';
          ctx.fill();
        }

        x = x2;
        y = y2;

        if (segmento.angle) {
          angoloCorrente += segmento.angle * (segmento.tipoPiega === 'su' ? 1 : -1);
        }
      }
      ctx.restore();
    };
    
    const resetView = () => {
      panX.value = 0;
      panY.value = 0;
      scale.value = 1;
      drawPreview();
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
        drawPreview();
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
    
    // Ridisegna quando cambiano i segmenti
    watch(() => props.segments, drawPreview, { deep: true });
    
    return {
      canvas,
      scale,
      drawPreview,
      resetView
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
}

.canvas-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
  border: 1px solid #ddd;
  background: #fff;
  margin: 0 auto;
  cursor: grab;
  max-width: 100%;
}

canvas {
  display: block;
}

.zoom-controls {
  text-align: center;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
}
</style>