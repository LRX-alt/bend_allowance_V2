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

    let occupied = [];

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
      occupied.push({ x: rx, y: ry, w: rw, h: rh });
    };

    const drawStack = (ctx, lines, sx, sy, color, bg) => {
      if (!lines.length) return;
      ctx.font = '12px system-ui, Arial';
      const width = Math.max(...lines.map(line => ctx.measureText(line).width));
      const lineH = 16;
      const padX = 8;
      const padY = 7;
      const rx = sx - width / 2 - padX;
      const ry = sy - (lines.length * lineH) / 2 - padY;
      const rw = width + padX * 2;
      const rh = lines.length * lineH + padY * 2;
      const r = 6;
      ctx.beginPath();
      ctx.moveTo(rx + r, ry);
      ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, r);
      ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, r);
      ctx.arcTo(rx, ry + rh, rx, ry, r);
      ctx.arcTo(rx, ry, rx + rw, ry, r);
      ctx.closePath();
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach((line, index) => {
        ctx.fillText(line, sx, ry + padY + lineH * index + lineH / 2);
      });
      return { x: rx, y: ry, w: rw, h: rh };
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
      occupied = [];

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

      if (showRadius.value) {
        const chains = [centerScreen, leftScreen, rightScreen];
        const hitsSheet = rect => {
          for (const chain of chains) {
            for (let i = 0; i < chain.length; i += 1) {
              const a = chain[i];
              const b = chain[Math.min(i + 1, chain.length - 1)];
              for (let step = 0; step <= 8; step += 1) {
                const t = step / 8;
                const x = a.x + (b.x - a.x) * t;
                const y = a.y + (b.y - a.y) * t;
                if (
                  x >= rect.x - 4 &&
                  x <= rect.x + rect.w + 4 &&
                  y >= rect.y - 4 &&
                  y <= rect.y + rect.h + 4
                ) {
                  return true;
                }
              }
            }
          }
          return false;
        };
        const overlaps = rect =>
          occupied.some(
            box =>
              rect.x < box.x + box.w + 8 &&
              rect.x + rect.w + 8 > box.x &&
              rect.y < box.y + box.h + 8 &&
              rect.y + rect.h + 8 > box.y
          );
        for (const bend of bends) {
          drawRadiusQuota(ctx, bend, toScreen, centroid, cssW, cssH, overlaps, hitsSheet);
        }
      }
    };

    const formatMm = value => (Math.round(value * 100) / 100).toFixed(2);

    const drawRadiusQuota = (ctx, bend, toScreen, centroid, cssW, cssH, overlaps, hitsSheet) => {
      if (bend.cx == null) return;
      const lines = [];
      if (bend.arcoInterno > 0.05) lines.push(`Arco interno ${formatMm(bend.arcoInterno)} mm`);
      if (bend.arcoEsterno > 0.05) lines.push(`Arco esterno ${formatMm(bend.arcoEsterno)} mm`);
      if (!lines.length) return;

      ctx.font = '12px system-ui, Arial';
      const width = Math.max(...lines.map(line => ctx.measureText(line).width));
      const rw = width + 16;
      const rh = lines.length * 16 + 14;
      const anchor = toScreen({ x: bend.x, y: bend.y });
      const dirs = Array.from({ length: 16 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 16;
        return { x: Math.cos(angle), y: Math.sin(angle) };
      }).sort((a, b) => {
        const far = (dir, distance) =>
          Math.hypot(anchor.x + dir.x * distance - centroid.x, anchor.y + dir.y * distance - centroid.y);
        return far(b, 90) - far(a, 90);
      });

      let spot = null;
      for (const distance of [78, 108, 140, 172]) {
        for (const dir of dirs) {
          const sx = anchor.x + dir.x * distance;
          const sy = anchor.y + dir.y * distance;
          const rect = { x: sx - rw / 2, y: sy - rh / 2, w: rw, h: rh };
          if (rect.x < 6 || rect.y < 6 || rect.x + rect.w > cssW - 6 || rect.y + rect.h > cssH - 6) {
            continue;
          }
          if (overlaps(rect) || hitsSheet(rect)) continue;
          spot = { sx, sy, rect };
          break;
        }
        if (spot) break;
      }
      if (!spot) {
        spot = {
          sx: Math.min(cssW - rw / 2 - 8, Math.max(rw / 2 + 8, anchor.x)),
          sy: Math.min(cssH - rh / 2 - 8, Math.max(rh / 2 + 8, anchor.y - 88)),
        };
        spot.rect = { x: spot.sx - rw / 2, y: spot.sy - rh / 2, w: rw, h: rh };
      }

      ctx.beginPath();
      ctx.moveTo(anchor.x, anchor.y);
      ctx.lineTo(spot.sx, spot.sy);
      ctx.strokeStyle = '#0e7490';
      ctx.lineWidth = 1;
      ctx.stroke();
      const box = drawStack(ctx, lines, spot.sx, spot.sy, '#0e7490', '#ffffff');
      if (box) occupied.push(box);
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
