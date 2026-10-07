import { onBeforeUnmount, onMounted, ref } from 'vue';
import { flangeQuotes, quoteSpan } from '@/composables/dimensionEdit.js';

const GEOMETRY = '#1c2430';
const BEND = '#15803d';
const SELECT = '#1d4ed8';
const HOLE = '#0f4c5c';
const DIMENSION = '#0e7490';
const PREVIEW = '#6d28d9';
const GHOST = '#94a3b8';
const OPEN = '#c2410c';
const FLANGE_GAP = 14;
const FLANGE_OVER = 6;

export function useEditorViewport(canvas, scene) {
  const view = ref({ x: 40, y: 40, scale: 1 });
  const fitScale = ref(1);
  const dragging = ref(null);
  const moved = ref(false);
  let observer;
  let dimensionHits = [];

  function paint() {
    const surface = canvas.value;
    if (!surface) return;
    const current = scene();
    current.onView?.({ scale: view.value.scale, fitScale: fitScale.value });
    const ctx = surface.getContext('2d');
    const rect = surface.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    surface.width = width * devicePixelRatio;
    surface.height = height * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    dimensionHits = [];
    ctx.save();
    ctx.translate(view.value.x, view.value.y);
    ctx.scale(view.value.scale, -view.value.scale);
    drawOrigin(ctx);
    if (current.ghost) strokePart(ctx, current.ghost, { color: GHOST, dashed: true, bends: false });
    const shown = current.previewPart || current.part;
    if (shown) {
      strokePart(ctx, shown, {
        color: current.previewPart ? PREVIEW : GEOMETRY,
        dashed: Boolean(current.previewPart),
        bends: true,
        dims: current.showDimensions !== false && !current.previewPart,
        quotes: !current.previewPart,
        selectedBendId: current.selectedBendId,
        selectedLoopId: current.selectedLoopId,
      });
    }
    drawMeasure(ctx, current.measure, current.measureText);
    ctx.restore();
  }

  function strokePart(ctx, current, options) {
    const scale = view.value.scale;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash(options.dashed ? [7 / scale, 5 / scale] : []);
    ctx.lineWidth = 1.5 / scale;
    if (current.outer?.curves?.length) {
      ctx.strokeStyle = options.color;
      traceLoop(ctx, current.outer);
      ctx.stroke();
    }
    for (const loop of current.inner || []) {
      const feature = current.features?.find(item => item.loopId === loop.id);
      const selected = options.selectedLoopId && loop.id === options.selectedLoopId;
      ctx.strokeStyle = selected
        ? SELECT
        : feature?.kind === 'hole' || feature?.kind === 'slot'
          ? HOLE
          : options.color;
      ctx.lineWidth = (selected ? 2.6 : 1.35) / scale;
      traceLoop(ctx, loop);
      ctx.stroke();
    }
    for (const loop of current.openPaths || []) {
      ctx.strokeStyle = OPEN;
      ctx.lineWidth = 1.2 / scale;
      ctx.setLineDash([5 / scale, 4 / scale]);
      traceLoop(ctx, loop);
      ctx.stroke();
    }
    ctx.setLineDash(options.dashed ? [7 / scale, 5 / scale] : []);
    if (options.bends) {
      for (const bend of current.bendLines || []) {
        const selected = bend.id === options.selectedBendId;
        if (selected) {
          ctx.strokeStyle = SELECT;
          ctx.lineWidth = 5 / scale;
          ctx.setLineDash([]);
          traceBend(ctx, bend);
          ctx.stroke();
        }
        ctx.strokeStyle = BEND;
        ctx.lineWidth = (selected ? 2.2 : 1.6) / scale;
        ctx.setLineDash(bendDash(bend.direction, scale));
        traceBend(ctx, bend);
        ctx.stroke();
      }
    }
    const flanges = options.dims ? flangeQuotes(current) : [];
    for (const note of current.annotations || []) {
      const label = noteText(note);
      if (label) {
        if (options.dims && isFlangeDuplicate(current, label, flanges)) continue;
        ctx.fillStyle = DIMENSION;
        drawWorldText(ctx, label.text, label.x, label.y);
        if (options.quotes) rememberQuote(ctx, current, label);
        continue;
      }
      if (!note.bbox) continue;
      const x = (note.bbox.minX + note.bbox.maxX) / 2;
      const y = (note.bbox.minY + note.bbox.maxY) / 2;
      ctx.fillStyle = SELECT;
      ctx.fillRect(x - 2.5 / scale, y - 2.5 / scale, 5 / scale, 5 / scale);
    }
    if (options.dims) {
      drawDimensions(ctx, current);
      drawFlangeQuotes(ctx, current, flanges);
    }
    ctx.restore();
  }

  function traceLoop(ctx, loop) {
    ctx.beginPath();
    loop.curves.forEach((curve, index) => drawCurve(ctx, curve, index === 0));
  }

  function traceBend(ctx, bend) {
    ctx.beginPath();
    ctx.moveTo(bend.a.x, bend.a.y);
    ctx.lineTo(bend.b.x, bend.b.y);
  }

  function noteText(note) {
    const raw = note?.raw || {};
    const text = typeof raw.text === 'string' ? raw.text.trim() : '';
    const point = raw.endPoint?.x != null ? raw.endPoint : raw.startPoint;
    if (!text || point?.x == null || point?.y == null) return null;
    return { text, x: point.x, y: point.y };
  }

  function bendDash(direction, scale) {
    if (direction === 'up') return [];
    if (direction === 'down') return [10 / scale, 6 / scale];
    return [2 / scale, 4 / scale];
  }

  function drawCurve(ctx, curve, first) {
    if (curve.kind === 'line') {
      if (first) ctx.moveTo(curve.a.x, curve.a.y);
      ctx.lineTo(curve.b.x, curve.b.y);
      return;
    }
    ctx.arc(curve.c.x, curve.c.y, curve.r, curve.a0, curve.a1, !curve.ccw);
  }

  function drawDimensions(ctx, current) {
    const box = current.outer?.bbox;
    if (!box) return;
    const width = box.maxX - box.minX;
    const height = box.maxY - box.minY;
    if (!(width > 0) || !(height > 0)) return;
    const scale = view.value.scale;
    const gap = 22 / scale;
    const over = 8 / scale;
    const unit = current.units || 'mm';
    ctx.save();
    ctx.strokeStyle = DIMENSION;
    ctx.fillStyle = DIMENSION;
    ctx.lineWidth = 1 / scale;
    ctx.setLineDash([]);
    const y = box.minY - gap;
    ctx.beginPath();
    ctx.moveTo(box.minX, box.minY);
    ctx.lineTo(box.minX, y - over);
    ctx.moveTo(box.maxX, box.minY);
    ctx.lineTo(box.maxX, y - over);
    ctx.moveTo(box.minX, y);
    ctx.lineTo(box.maxX, y);
    ctx.stroke();
    const widthLabel = `${width.toFixed(2)} ${unit}`;
    drawWorldText(ctx, widthLabel, (box.minX + box.maxX) / 2, y - 3 / scale);
    rememberDimension(ctx, widthLabel, (box.minX + box.maxX) / 2, y - 3 / scale, {
      axis: 'x',
      from: box.minX,
      to: box.maxX,
    });
    const x = box.minX - gap;
    ctx.beginPath();
    ctx.moveTo(box.minX, box.minY);
    ctx.lineTo(x - over, box.minY);
    ctx.moveTo(box.minX, box.maxY);
    ctx.lineTo(x - over, box.maxY);
    ctx.moveTo(x, box.minY);
    ctx.lineTo(x, box.maxY);
    ctx.stroke();
    const heightLabel = `${height.toFixed(2)} ${unit}`;
    drawWorldText(ctx, heightLabel, x - 3 / scale, (box.minY + box.maxY) / 2);
    rememberDimension(ctx, heightLabel, x - 3 / scale, (box.minY + box.maxY) / 2, {
      axis: 'y',
      from: box.minY,
      to: box.maxY,
    });
    ctx.restore();
  }

  /** Quote di flangia (bordo -> piega piu' esterna) in seconda fila, piu' vicine al pezzo. */
  function drawFlangeQuotes(ctx, current, flanges) {
    const box = current.outer?.bbox;
    if (!box || !flanges?.length) return;
    const scale = view.value.scale;
    const gap = FLANGE_GAP / scale;
    const over = FLANGE_OVER / scale;
    const unit = current.units || 'mm';
    ctx.save();
    ctx.strokeStyle = DIMENSION;
    ctx.fillStyle = DIMENSION;
    ctx.lineWidth = 1 / scale;
    ctx.setLineDash([]);
    for (const quote of flanges) {
      const length = quote.to - quote.from;
      if (!(length > 0.01)) continue;
      const label = `${length.toFixed(2)} ${unit}`;
      const mid = (quote.from + quote.to) / 2;
      if (quote.axis === 'x') {
        const y = box.minY - gap;
        ctx.beginPath();
        ctx.moveTo(quote.from, box.minY);
        ctx.lineTo(quote.from, y - over);
        ctx.moveTo(quote.to, box.minY);
        ctx.lineTo(quote.to, y - over);
        ctx.moveTo(quote.from, y);
        ctx.lineTo(quote.to, y);
        ctx.stroke();
        drawWorldText(ctx, label, mid, y - 3 / scale);
        rememberDimension(ctx, label, mid, y - 3 / scale, {
          axis: 'x',
          from: quote.from,
          to: quote.to,
        });
      } else {
        const x = box.minX - gap;
        ctx.beginPath();
        ctx.moveTo(box.minX, quote.from);
        ctx.lineTo(x - over, quote.from);
        ctx.moveTo(box.minX, quote.to);
        ctx.lineTo(x - over, quote.to);
        ctx.moveTo(x, quote.from);
        ctx.lineTo(x, quote.to);
        ctx.stroke();
        drawWorldText(ctx, label, x - 3 / scale, mid);
        rememberDimension(ctx, label, x - 3 / scale, mid, {
          axis: 'y',
          from: quote.from,
          to: quote.to,
        });
      }
    }
    ctx.restore();
  }

  /** Vero se un'annotazione DXF «N mm» coincide con una quota di flangia gia' disegnata. */
  function isFlangeDuplicate(part, label, flanges) {
    if (!flanges?.length) return false;
    const match = label.text.match(/^(\d+(?:[.,]\d+)?)\s*mm$/i);
    if (!match) return false;
    const length = Number(match[1].replace(',', '.'));
    const span = quoteSpan(part, label.x, label.y, length);
    if (!span) return false;
    const lo = Math.min(span.from, span.to);
    const hi = Math.max(span.from, span.to);
    return flanges.some(
      quote =>
        quote.axis === span.axis &&
        Math.abs(quote.from - lo) < 0.08 &&
        Math.abs(quote.to - hi) < 0.08
    );
  }

  function screenOf(x, y) {
    return {
      x: view.value.x + x * view.value.scale,
      y: view.value.y - y * view.value.scale,
    };
  }

  function rememberDimension(ctx, text, worldX, worldY, span) {
    ctx.font = '12px IBM Plex Mono, ui-monospace, sans-serif';
    const pad = 8;
    const w = ctx.measureText(text).width + pad;
    const h = 18;
    const screen = screenOf(worldX, worldY);
    dimensionHits.push({
      ...span,
      current: Math.abs(span.to - span.from),
      x: screen.x - w / 2,
      y: screen.y - h / 2,
      w,
      h,
    });
  }

  function rememberQuote(ctx, part, label) {
    const match = label.text.match(/^(\d+(?:[.,]\d+)?)\s*mm$/i);
    if (!match || !part) return;
    const length = Number(match[1].replace(',', '.'));
    const span = quoteSpan(part, label.x, label.y, length);
    if (!span) return;
    rememberDimension(ctx, label.text, label.x, label.y, span);
  }

  function dimensionAt(event) {
    const surface = canvas.value;
    if (!surface) return null;
    const rect = surface.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return (
      dimensionHits.find(
        hit => x >= hit.x && x <= hit.x + hit.w && y >= hit.y && y <= hit.y + hit.h
      ) || null
    );
  }

  function drawWorldText(ctx, text, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1 / view.value.scale, -1 / view.value.scale);
    ctx.font = '12px IBM Plex Mono, ui-monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  function drawMeasure(ctx, points, label) {
    if (!points?.length) return;
    const scale = view.value.scale;
    ctx.save();
    ctx.fillStyle = SELECT;
    ctx.strokeStyle = SELECT;
    ctx.lineWidth = 1.2 / scale;
    ctx.setLineDash([5 / scale, 4 / scale]);
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3.5 / scale, 0, Math.PI * 2);
      ctx.fill();
    });
    if (points.length === 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.stroke();
      if (label) {
        drawWorldText(
          ctx,
          label,
          (points[0].x + points[1].x) / 2,
          (points[0].y + points[1].y) / 2 + 10 / scale
        );
      }
    }
    ctx.restore();
  }

  function drawOrigin(ctx) {
    const size = 10 / view.value.scale;
    ctx.save();
    ctx.strokeStyle = 'rgba(28, 36, 48, 0.28)';
    ctx.lineWidth = 1 / view.value.scale;
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.lineTo(size, 0);
    ctx.moveTo(0, -size);
    ctx.lineTo(0, size);
    ctx.stroke();
    ctx.restore();
  }

  function worldFromEvent(event) {
    const rect = canvas.value.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return { x: (x - view.value.x) / view.value.scale, y: -(y - view.value.y) / view.value.scale };
  }

  function fit(part) {
    const surface = canvas.value;
    if (!part || !surface) return;
    const box = part.outer.bbox;
    const rect = surface.getBoundingClientRect();
    const width = Math.max(box.maxX - box.minX, 1);
    const height = Math.max(box.maxY - box.minY, 1);
    const scale = Math.min((rect.width - 120) / width, (rect.height - 120) / height);
    const next = Number.isFinite(scale) && scale > 0 ? scale : 1;
    fitScale.value = next;
    view.value = {
      scale: next,
      x: (rect.width - (box.minX + box.maxX) * next) / 2,
      y: (rect.height + (box.minY + box.maxY) * next) / 2,
    };
    paint();
  }

  function zoomAt(factor, clientX, clientY) {
    const surface = canvas.value;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const next = Math.min(80, Math.max(0.02, view.value.scale * factor));
    const worldX = (px - view.value.x) / view.value.scale;
    const worldY = -(py - view.value.y) / view.value.scale;
    view.value = { scale: next, x: px - worldX * next, y: py + worldY * next };
    paint();
  }

  function onWheel(event) {
    zoomAt(event.deltaY > 0 ? 0.9 : 1.1, event.clientX, event.clientY);
  }

  function onDown(event) {
    if (event.button === 2) return;
    const tool = scene().tool || 'select';
    const directPan = tool === 'pan' || event.button === 1;
    moved.value = false;
    dragging.value = {
      x: event.clientX,
      y: event.clientY,
      view: { ...view.value },
      pan: directPan,
    };
    if (directPan) surfaceCapture(event);
  }

  function surfaceCapture(event) {
    canvas.value?.setPointerCapture?.(event.pointerId);
  }

  function onMove(event) {
    scene().onCursor?.(worldFromEvent(event));
    if (!dragging.value) return;
    const dx = event.clientX - dragging.value.x;
    const dy = event.clientY - dragging.value.y;
    if (Math.hypot(dx, dy) > 4) {
      moved.value = true;
      if (!dragging.value.pan) {
        dragging.value = { ...dragging.value, pan: true };
        surfaceCapture(event);
      }
    }
    if (!dragging.value.pan) return;
    view.value = {
      ...dragging.value.view,
      x: dragging.value.view.x + dx,
      y: dragging.value.view.y + dy,
    };
    paint();
  }

  function onUp(event, onPoint) {
    const wasDrag = moved.value;
    const tool = scene().tool || 'select';
    dragging.value = null;
    if (wasDrag || tool === 'pan' || event.button !== 0) return;
    onPoint(worldFromEvent(event));
  }

  function zoomBy(factor) {
    const surface = canvas.value;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    zoomAt(factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  onMounted(() => {
    const surface = canvas.value;
    if (!surface) return;
    observer = new ResizeObserver(() => paint());
    observer.observe(surface.parentElement || surface);
    paint();
  });

  onBeforeUnmount(() => observer?.disconnect());

  return {
    view,
    fitScale,
    paint,
    fit,
    onWheel,
    onDown,
    onMove,
    onUp,
    zoomBy,
    worldFromEvent,
    dimensionAt,
  };
}
