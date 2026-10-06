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
      <label class="legend-item" for="lunghezza-arco">
        <input id="lunghezza-arco" v-model="showRadius" type="checkbox" />
        Lunghezza arco
      </label>
    </div>

    <div class="zoom-controls">
      <label for="preview-zoom">Zoom</label>
      <input
        id="preview-zoom"
        type="range"
        min="0.3"
        max="4"
        step="0.1"
        v-model.number="zoom"
        @input="drawPreview"
      />
      <span class="zoom-value">{{ Math.round(zoom * 100) }}%</span>
      <button type="button" @click="resetView" class="btn btn-secondary btn-sm">Adatta</button>
    </div>
  </section>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { buildProfileGeometry } from '@/calculator/profileGeometry.js';

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
    const showRadius = ref(true);
    const isPanning = ref(false);
    const startPan = ref({ x: 0, y: 0 });

    const CANVAS_HEIGHT = 360;
    const PADDING = 56; // margine interno (px) per quote/etichette
    const MAX_PX_PER_MM = 9; // evita che parti piccole diventino enormi

    const hasSegments = computed(
      () => Array.isArray(props.segments) && props.segments.some(s => (Number(s.length) || 0) > 0)
    );

    const buildGeometry = () =>
      buildProfileGeometry(props.segments, props.raggioPiega, props.spessore);

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

      const { center, left, right, flanges, bends } = buildGeometry();
      const cloud = [...center, ...left, ...right];
      for (const bend of bends) {
        if (bend.cx != null) cloud.push({ x: bend.cx, y: bend.cy });
      }

      // Bounding box in mondo.
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const p of cloud) {
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
      const centerScreen = center.map(toScreen);
      const leftScreen = left.map(toScreen);
      const rightScreen = right.map(toScreen);

      // Centroide schermo per spingere le etichette verso l'esterno.
      const centroid = centerScreen.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), {
        x: 0,
        y: 0,
      });
      centroid.x /= centerScreen.length;
      centroid.y /= centerScreen.length;

      // Lamiera: lato interno a raggio R, lato esterno a raggio R + spessore.
      ctx.beginPath();
      ctx.moveTo(leftScreen[0].x, leftScreen[0].y);
      for (let i = 1; i < leftScreen.length; i++) ctx.lineTo(leftScreen[i].x, leftScreen[i].y);
      for (let i = rightScreen.length - 1; i >= 0; i--)
        ctx.lineTo(rightScreen[i].x, rightScreen[i].y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(28, 36, 48, 0.16)';
      ctx.fill();
      ctx.strokeStyle = '#1c2430';
      ctx.lineWidth = 1.25;
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerScreen[0].x, centerScreen[0].y);
      for (let i = 1; i < centerScreen.length; i++)
        ctx.lineTo(centerScreen[i].x, centerScreen[i].y);
      ctx.strokeStyle = '#1c2430';
      ctx.lineWidth = 2;
      ctx.stroke();

      for (const flange of flanges) {
        const mid = toScreen(flange.mid);
        let ox = mid.x - centroid.x;
        let oy = mid.y - centroid.y;
        const len = Math.hypot(ox, oy) || 1;
        ox /= len;
        oy /= len;
        drawPill(
          ctx,
          `L${flange.index + 1}: ${flange.length} mm`,
          mid.x + ox * 20,
          mid.y + oy * 20,
          '#1c2430',
          '#eef1f4'
        );
      }

      if (showRadius.value) {
        for (const bend of bends) drawRadiusQuota(ctx, bend, toScreen);
      }

      bends.forEach((piega, index) => {
        const sp = toScreen(piega);

        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#15803d';
        ctx.fill();

        let ox = sp.x - centroid.x;
        let oy = sp.y - centroid.y;
        const len = Math.hypot(ox, oy) || 1;
        ox /= len;
        oy /= len;

        drawPill(ctx, `P${index + 1}`, sp.x + ox * 26, sp.y + oy * 26 - 9, '#15803d', '#dcfce7');
        const dettaglio = `${piega.angolo}° ${piega.tipo}`;
        drawPill(ctx, dettaglio, sp.x + ox * 26, sp.y + oy * 26 + 9, '#495057', '#f1f3f5');
      });

      const start = centerScreen[0];
      ctx.beginPath();
      ctx.arc(start.x, start.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#1d4ed8';
      ctx.fill();
      drawPill(ctx, 'Inizio', start.x, start.y - 16, '#1d4ed8', '#dbeafe');
    };

    const formatMm = value => (Math.round(value * 100) / 100).toFixed(2);

    const drawRadiusQuota = (ctx, bend, toScreen) => {
      if (bend.cx == null || bend.midAngle == null) return;
      const marks = [];
      if (bend.arcoInterno > 0.05) {
        marks.push({
          radius: bend.raggio,
          label: `Int. ${formatMm(bend.arcoInterno)} mm`,
          outward: -1,
        });
      }
      if (bend.arcoEsterno > 0.05) {
        marks.push({
          radius: bend.raggioEsterno,
          label: `Est. ${formatMm(bend.arcoEsterno)} mm`,
          outward: 1,
        });
      }
      if (!marks.length) return;

      const origin = toScreen({ x: bend.cx, y: bend.cy });
      const onInner = toScreen({
        x: bend.cx + Math.cos(bend.midAngle) * Math.max(bend.raggio, 1),
        y: bend.cy + Math.sin(bend.midAngle) * Math.max(bend.raggio, 1),
      });
      const ang = Math.atan2(onInner.y - origin.y, onInner.x - origin.x);
      marks.forEach((mark, index) => {
        const along = 28 + index * 22;
        drawPill(
          ctx,
          mark.label,
          onInner.x - Math.cos(ang) * along,
          onInner.y - Math.sin(ang) * along,
          '#0e7490',
          '#f0fdfa'
        );
      });
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
        showRadius,
      ],
      () => {
        nextTick(() => drawPreview());
      }
    );

    return {
      canvas,
      wrapper,
      zoom,
      showRadius,
      hasSegments,
      drawPreview,
      resetView,
    };
  },
};
</script>

<style scoped>
.preview-section {
  background: var(--steel-50, #f3f5f7);
  border: 1px solid var(--steel-200, #d3dae3);
  border-radius: 12px;
  padding: 14px;
  margin: 0;
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
  height: 440px;
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
  color: var(--gray-600);
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
  color: var(--gray-700);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-item input {
  margin: 0;
}

.swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
}

.swatch-sheet {
  background: rgba(28, 36, 48, 0.16);
  border: 1px solid #1c2430;
}

.swatch-start {
  background: #1d4ed8;
  border-radius: 50%;
}

.swatch-bend {
  background: #15803d;
  border-radius: 50%;
}

.zoom-value {
  font-size: 12px;
  color: var(--gray-600);
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
</style>
