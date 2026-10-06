import { onBeforeUnmount, onMounted, ref } from 'vue';

export function useEditorViewport(canvas, scene) {
  const view = ref({ x: 40, y: 40, scale: 1 });
  const dragging = ref(null);
  const moved = ref(false);
  let observer;

  function paint() {
    const surface = canvas.value;
    if (!surface) return;
    const { part, ghost, previewPart, measure, selectedBendId, selectedLoopId } = scene();
    const ctx = surface.getContext('2d');
    const rect = surface.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    surface.width = width * devicePixelRatio;
    surface.height = height * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(view.value.x, view.value.y);
    ctx.scale(view.value.scale, -view.value.scale);
    if (ghost) strokePart(ctx, ghost, '#9aa8b8');
    const shown = previewPart || part;
    if (shown) strokePart(ctx, shown, '#1c2430', selectedBendId, selectedLoopId);
    drawMeasure(ctx, measure);
    ctx.restore();
  }

  function strokePart(ctx, current, color, selectedBendId, selectedLoopId) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5 / view.value.scale;
    for (const loop of [current.outer, ...current.inner]) {
      ctx.beginPath();
      loop.curves.forEach((curve, index) => drawCurve(ctx, curve, index === 0));
      ctx.stroke();
    }
    if (selectedLoopId) {
      const loop = current.inner.find(item => item.id === selectedLoopId);
      if (loop) {
        ctx.strokeStyle = '#1d4ed8';
        ctx.lineWidth = 2.4 / view.value.scale;
        ctx.beginPath();
        loop.curves.forEach((curve, index) => drawCurve(ctx, curve, index === 0));
        ctx.stroke();
      }
    }
    for (const bend of current.bendLines) {
      ctx.strokeStyle = bend.id === selectedBendId ? '#1d4ed8' : '#c2410c';
      ctx.lineWidth = (bend.id === selectedBendId ? 3 : 1.5) / view.value.scale;
      ctx.beginPath();
      ctx.moveTo(bend.a.x, bend.a.y);
      ctx.lineTo(bend.b.x, bend.b.y);
      ctx.stroke();
    }
  }

  function drawCurve(ctx, curve, first) {
    if (curve.kind === 'line') {
      if (first) ctx.moveTo(curve.a.x, curve.a.y);
      ctx.lineTo(curve.b.x, curve.b.y);
      return;
    }
    ctx.arc(curve.c.x, curve.c.y, curve.r, curve.a0, curve.a1, !curve.ccw);
  }

  function drawMeasure(ctx, points) {
    if (!points?.length) return;
    ctx.fillStyle = '#1d4ed8';
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 1.2 / view.value.scale;
    ctx.setLineDash([5 / view.value.scale, 4 / view.value.scale]);
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4 / view.value.scale, 0, Math.PI * 2);
      ctx.fill();
    });
    if (points.length === 2) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
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
    const scale = Math.min((rect.width - 80) / width, (rect.height - 80) / height);
    view.value = {
      scale: Number.isFinite(scale) && scale > 0 ? scale : 1,
      x: 40 - box.minX * scale,
      y: rect.height - 40 + box.minY * scale,
    };
    paint();
  }

  function onWheel(event) {
    const factor = event.deltaY > 0 ? 0.9 : 1.1;
    view.value = { ...view.value, scale: Math.min(40, Math.max(0.05, view.value.scale * factor)) };
    paint();
  }

  function onDown(event) {
    moved.value = false;
    dragging.value = { x: event.clientX, y: event.clientY, view: { ...view.value } };
  }

  function onMove(event) {
    if (!dragging.value) return;
    const dx = event.clientX - dragging.value.x;
    const dy = event.clientY - dragging.value.y;
    if (Math.hypot(dx, dy) > 4) moved.value = true;
    view.value = {
      ...dragging.value.view,
      x: dragging.value.view.x + dx,
      y: dragging.value.view.y + dy,
    };
    paint();
  }

  function onUp(event, onPoint) {
    const wasDrag = moved.value;
    dragging.value = null;
    if (!wasDrag) onPoint(worldFromEvent(event));
  }

  function zoomBy(factor) {
    view.value = { ...view.value, scale: Math.min(40, Math.max(0.05, view.value.scale * factor)) };
    paint();
  }

  onMounted(() => {
    const surface = canvas.value;
    if (!surface) return;
    observer = new ResizeObserver(() => paint());
    observer.observe(surface.parentElement || surface);
    paint();
  });

  onBeforeUnmount(() => observer?.disconnect());

  return { view, paint, fit, onWheel, onDown, onMove, onUp, zoomBy, worldFromEvent };
}
