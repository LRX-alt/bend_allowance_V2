<template>
  <section class="preview-section">
    <h2>Anteprima Grafica</h2>

    <!-- Informazioni di visualizzazione -->
    <div class="preview-info">
      <div class="preview-params">
        <p class="matrix-info">Matrice: {{ tipoMatrice }} ({{ larghezzaMatrice }} mm)</p>
        <p class="radius-info">Raggio: {{ raggioPiega }} mm</p>
        <p class="thickness-info">Spessore: {{ spessore }} mm</p>
      </div>
    </div>

    <div class="canvas-wrapper" ref="wrapper">
      <canvas ref="canvas"></canvas>
      <div v-if="!hasSegments" class="canvas-empty">
        Aggiungi almeno un segmento per vedere l'anteprima.
      </div>
    </div>

    <div class="preview-legend">
      <span class="legend-item"><span class="swatch swatch-sheet"></span> Lamiera</span>
      <span class="legend-item"><span class="swatch swatch-start"></span> Inizio</span>
      <span class="legend-item"><span class="swatch swatch-bend"></span> Piega</span>
    </div>

    <div class="zoom-controls">
      <label>Zoom</label>
      <input type="range" min="0.3" max="4" step="0.1" v-model.number="zoom" @input="drawPreview" />
      <span class="zoom-value">{{ Math.round(zoom * 100) }}%</span>
      <button type="button" @click="resetView" class="btn">Adatta</button>
    </div>
  </section>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';

export default {
  name: 'PreviewCanvas',
  props: {
    segments: {
      type: Array,
      required: true,
    },
    spessore: {
      type: Number,
      required: true,
    },
    raggioPiega: {
      type: Number,
      required: true,
    },
    fattoreK: {
      type: Number,
      required: true,
    },
    processo: {
      type: String,
      default: 'airBend',
    },
    tipoMatrice: {
      type: String,
      required: true,
    },
    larghezzaMatrice: {
      type: Number,
      required: true,
    },
    tipoCava: {
      type: String,
      required: true,
    },
  },
  emits: ['update:raggioPiega', 'update:tipoMatrice', 'update:larghezzaMatrice', 'update:tipoCava'],
  setup(props) {
    const canvas = ref(null);
    const wrapper = ref(null);
    const zoom = ref(1);
    const panX = ref(0);
    const panY = ref(0);
    const isPanning = ref(false);
    const startPan = ref({ x: 0, y: 0 });

    const CANVAS_HEIGHT = 360;
    const PADDING = 56; // margine interno (px) per quote/etichette
    const MAX_PX_PER_MM = 9; // evita che parti piccole diventino enormi

    const hasSegments = computed(
      () => Array.isArray(props.segments) && props.segments.some(s => (Number(s.length) || 0) > 0)
    );

    // Costruisce la polilinea (centro lamiera) in coordinate "mondo" (y verso l'alto).
    // Convenzione: la prima flangia non ha piega in ingresso; l'angolo del
    // segmento i (i>0) e la piega tra il segmento i-1 e i. 'su' = senso antiorario.
    const buildGeometry = () => {
      const segs = props.segments || [];
      const punti = [{ x: 0, y: 0 }];
      const pieghe = [];
      let dir = 0; // radianti

      for (let i = 0; i < segs.length; i++) {
        const L = Number(segs[i].length) || 0;
        if (i > 0 && segs[i].angle) {
          const tipo = segs[i].tipoPiega || 'su';
          const sign = tipo === 'giu' ? -1 : 1;
          dir += ((Number(segs[i].angle) || 0) * sign * Math.PI) / 180;
          pieghe.push({
            indice: pieghe.length + 1,
            puntoIdx: i,
            angolo: Number(segs[i].angle) || 0,
            tipo,
          });
        }
        const prev = punti[punti.length - 1];
        punti.push({ x: prev.x + L * Math.cos(dir), y: prev.y + L * Math.sin(dir) });
      }
      return { punti, pieghe, segs };
    };

    // Disegna un'etichetta con sfondo "pill" centrata su (sx, sy).
    const drawPill = (ctx, text, sx, sy, color, bg) => {
      ctx.font = '12px system-ui, Arial';
      const w = ctx.measureText(text).width;
      const padX = 6;
      const padY = 4;
      const h = 12;
      const rx = sx - w / 2 - padX;
      const ry = sy - h / 2 - padY;
      const rw = w + padX * 2;
      const rh = h + padY * 2;
      const r = 5;
      ctx.beginPath();
      ctx.moveTo(rx + r, ry);
      ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, r);
      ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, r);
      ctx.arcTo(rx, ry + rh, rx, ry, r);
      ctx.arcTo(rx, ry, rx + rw, ry, r);
      ctx.closePath();
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, sx, sy);
    };

    const drawPreview = () => {
      const el = canvas.value;
      if (!el) return;
      const ctx = el.getContext('2d');

      // Dimensiona il canvas in pixel CSS, con DPR per nitidezza.
      const dpr = window.devicePixelRatio || 1;
      const cssW = (wrapper.value ? wrapper.value.clientWidth : 760) || 760;
      const cssH = CANVAS_HEIGHT;
      el.style.width = cssW + 'px';
      el.style.height = cssH + 'px';
      el.width = Math.round(cssW * dpr);
      el.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      // Griglia di sfondo (in pixel, indipendente dallo zoom).
      ctx.strokeStyle = '#eef1f5';
      ctx.lineWidth = 1;
      for (let gx = 0; gx <= cssW; gx += 32) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, cssH);
        ctx.stroke();
      }
      for (let gy = 0; gy <= cssH; gy += 32) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(cssW, gy);
        ctx.stroke();
      }

      if (!hasSegments.value) return;

      const { punti, pieghe, segs } = buildGeometry();

      // Bounding box in mondo.
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const p of punti) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      const bboxW = Math.max(maxX - minX, 1e-6);
      const bboxH = Math.max(maxY - minY, 1e-6);

      // Auto-fit: px per mm per riempire l'area utile, con limite massimo.
      const availW = cssW - PADDING * 2;
      const availH = cssH - PADDING * 2;
      const fit = Math.min(availW / bboxW, availH / bboxH);
      const pxPerMm = Math.min(fit, MAX_PX_PER_MM) * zoom.value;

      const worldCx = (minX + maxX) / 2;
      const worldCy = (minY + maxY) / 2;
      const cx = cssW / 2 + panX.value;
      const cy = cssH / 2 + panY.value;

      // mondo -> schermo (y invertita).
      const toScreen = p => ({
        x: cx + (p.x - worldCx) * pxPerMm,
        y: cy - (p.y - worldCy) * pxPerMm,
      });
      const pts = punti.map(toScreen);

      // Centroide schermo per spingere le etichette verso l'esterno.
      const centroid = pts.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
      centroid.x /= pts.length;
      centroid.y /= pts.length;

      // Spessore reso come banda (larghezza linea), con join arrotondati che
      // approssimano il raggio di piega.
      const bandPx = Math.max(props.spessore * pxPerMm, 4);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.strokeStyle = 'rgba(13, 110, 253, 0.18)';
      ctx.lineWidth = bandPx;
      ctx.stroke();

      // Linea di centro.
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.strokeStyle = '#0d6efd';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Etichette lunghezza segmenti (al centro, spinte verso l'esterno).
      for (let i = 0; i < segs.length; i++) {
        const L = Number(segs[i].length) || 0;
        if (L <= 0) continue;
        const a = pts[i];
        const b = pts[i + 1];
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        let ox = mid.x - centroid.x;
        let oy = mid.y - centroid.y;
        const len = Math.hypot(ox, oy) || 1;
        ox /= len;
        oy /= len;
        const off = 20;
        drawPill(
          ctx,
          `L${i + 1}: ${L} mm`,
          mid.x + ox * off,
          mid.y + oy * off,
          '#0d6efd',
          '#eaf2ff'
        );
      }

      // Pieghe: punto, numero, angolo/tipo e raggio.
      for (const piega of pieghe) {
        const sp = pts[piega.puntoIdx];

        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#dc3545';
        ctx.fill();

        let ox = sp.x - centroid.x;
        let oy = sp.y - centroid.y;
        const len = Math.hypot(ox, oy) || 1;
        ox /= len;
        oy /= len;

        drawPill(ctx, `P${piega.indice}`, sp.x + ox * 26, sp.y + oy * 26 - 9, '#dc3545', '#fdeaec');
        const dettaglio =
          props.raggioPiega > 0
            ? `${piega.angolo}° ${piega.tipo} · R${props.raggioPiega}`
            : `${piega.angolo}° ${piega.tipo}`;
        drawPill(ctx, dettaglio, sp.x + ox * 26, sp.y + oy * 26 + 9, '#495057', '#f1f3f5');
      }

      // Marker di inizio.
      const start = pts[0];
      ctx.beginPath();
      ctx.arc(start.x, start.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#28a745';
      ctx.fill();
      drawPill(ctx, 'Inizio', start.x, start.y - 16, '#1e7e34', '#e6f4ea');
    };

    const resetView = () => {
      panX.value = 0;
      panY.value = 0;
      zoom.value = 1;
      drawPreview();
    };

    const handleWheel = event => {
      event.preventDefault();
      const amount = -event.deltaY * 0.0015;
      zoom.value = Math.min(Math.max(zoom.value + amount, 0.3), 4);
      drawPreview();
    };

    const handleMouseDown = event => {
      isPanning.value = true;
      startPan.value = { x: event.clientX - panX.value, y: event.clientY - panY.value };
    };

    const handleMouseMove = event => {
      if (!isPanning.value) return;
      panX.value = event.clientX - startPan.value.x;
      panY.value = event.clientY - startPan.value.y;
      drawPreview();
    };

    const handleMouseUp = () => {
      isPanning.value = false;
    };

    let resizeObserver = null;

    onMounted(() => {
      if (!canvas.value) return;
      canvas.value.addEventListener('wheel', handleWheel, { passive: false });
      canvas.value.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      if (window.ResizeObserver && wrapper.value) {
        resizeObserver = new ResizeObserver(() => drawPreview());
        resizeObserver.observe(wrapper.value);
      }

      nextTick(() => drawPreview());
    });

    onUnmounted(() => {
      if (canvas.value) {
        canvas.value.removeEventListener('wheel', handleWheel);
        canvas.value.removeEventListener('mousedown', handleMouseDown);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (resizeObserver) resizeObserver.disconnect();
    });

    watch(
      () => props.segments,
      () => {
        nextTick(() => drawPreview());
      },
      { deep: true }
    );

    watch(
      [
        () => props.raggioPiega,
        () => props.spessore,
        () => props.tipoMatrice,
        () => props.larghezzaMatrice,
        () => props.tipoCava,
      ],
      () => {
        nextTick(() => drawPreview());
      }
    );

    return {
      canvas,
      wrapper,
      zoom,
      hasSegments,
      drawPreview,
      resetView,
    };
  },
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
  position: relative;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  width: 100%;
  height: 360px;
  cursor: grab;
}

.canvas-wrapper:active {
  cursor: grabbing;
}

canvas {
  display: block;
  background: white;
}

.canvas-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  font-size: 14px;
  text-align: center;
  padding: 16px;
  pointer-events: none;
}

.preview-legend {
  display: flex;
  justify-content: center;
  gap: 18px;
  margin-top: 10px;
  font-size: 12px;
  color: #495057;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
}

.swatch-sheet {
  background: rgba(13, 110, 253, 0.25);
  border: 1px solid #0d6efd;
}

.swatch-start {
  background: #28a745;
  border-radius: 50%;
}

.swatch-bend {
  background: #dc3545;
  border-radius: 50%;
}

.zoom-value {
  font-size: 12px;
  color: #6c757d;
  min-width: 42px;
  text-align: left;
}

.zoom-controls {
  text-align: center;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn,
.btn-small {
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

.btn:hover,
.btn-small:hover {
  background: #0056b3;
}
</style>
