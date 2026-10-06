const DEG2RAD = Math.PI / 180;

function leftNormal(dir) {
  return { x: -Math.sin(dir), y: Math.cos(dir) };
}

export function lunghezzeArco(angoloDeg, raggio = 0, spessore = 0) {
  const theta = (Math.min(Math.abs(Number(angoloDeg) || 0), 179) * Math.PI) / 180;
  const radius = Math.max(Number(raggio) || 0, 0);
  const thickness = Math.max(Number(spessore) || 0, 0);
  return {
    interno: theta * radius,
    esterno: theta * (radius + thickness),
  };
}

function setback(radius, angleDeg) {
  const magnitude = Math.min(Math.abs(angleDeg), 179);
  if (!magnitude || radius <= 0) return 0;
  return radius * Math.tan((magnitude * DEG2RAD) / 2);
}

/**
 * Profilo piegato in vista laterale.
 * Le lunghezze sono quote esterne fino allo spigolo teorico.
 * Il lato interno della piega ha raggio `raggio`, quello esterno `raggio + spessore`.
 */
export function buildProfileGeometry(segments, raggio = 0, spessore = 0) {
  const list = Array.isArray(segments) ? segments : [];
  const R = Math.max(Number(raggio) || 0, 0);
  const T = Math.max(Number(spessore) || 0, 0);
  const half = T / 2;
  const radius = R + half;
  const outerRadius = R + T;

  let x = 0;
  let y = 0;
  let dir = 0;
  const n0 = leftNormal(0);
  const center = [{ x: 0, y: 0 }];
  const left = [{ x: n0.x * half, y: n0.y * half }];
  const right = [{ x: -n0.x * half, y: -n0.y * half }];
  const flanges = [];
  const bends = [];

  function pushPoint(px, py, direction) {
    const n = leftNormal(direction);
    center.push({ x: px, y: py });
    left.push({ x: px + n.x * half, y: py + n.y * half });
    right.push({ x: px - n.x * half, y: py - n.y * half });
  }

  function addArc(theta, angleDeg, tipo) {
    if (radius <= 1e-6) {
      dir += theta;
      bends.push({ x, y, angolo: angleDeg, tipo, raggio: R });
      return;
    }
    const turn = theta > 0 ? 1 : -1;
    const n = leftNormal(dir);
    const acx = x + n.x * turn * radius;
    const acy = y + n.y * turn * radius;
    const a0 = Math.atan2(y - acy, x - acx);
    const steps = Math.max(2, Math.ceil((Math.abs(theta) * 180) / Math.PI / 3));
    let mid = { x, y };
    for (let step = 1; step <= steps; step += 1) {
      const a = a0 + (theta * step) / steps;
      const radial = { x: Math.cos(a), y: Math.sin(a) };
      const px = acx + radial.x * radius;
      const py = acy + radial.y * radius;
      center.push({ x: px, y: py });
      const inner = { x: acx + radial.x * R, y: acy + radial.y * R };
      const outer = { x: acx + radial.x * outerRadius, y: acy + radial.y * outerRadius };
      if (turn > 0) {
        left.push(inner);
        right.push(outer);
      } else {
        left.push(outer);
        right.push(inner);
      }
      if (step === Math.ceil(steps / 2)) mid = { x: px, y: py };
    }
    x = acx + Math.cos(a0 + theta) * radius;
    y = acy + Math.sin(a0 + theta) * radius;
    dir += theta;
    const archi = lunghezzeArco(angleDeg, R, T);
    bends.push({
      x: mid.x,
      y: mid.y,
      angolo: angleDeg,
      tipo,
      raggio: R,
      raggioEsterno: outerRadius,
      arcoInterno: archi.interno,
      arcoEsterno: archi.esterno,
      cx: acx,
      cy: acy,
      midAngle: a0 + theta / 2,
    });
  }

  for (let i = 0; i < list.length; i += 1) {
    const seg = list[i] || {};
    const length = Number(seg.length) || 0;
    const angle = i > 0 ? Number(seg.angle) || 0 : 0;
    const tipo = (seg.tipoPiega || 'su') === 'giu' ? 'giu' : 'su';
    const signed = angle * (tipo === 'giu' ? -1 : 1);
    if (i > 0 && signed) addArc(signed * DEG2RAD, Math.abs(angle), tipo);

    const before = i > 0 ? setback(outerRadius, signed) : 0;
    const next = list[i + 1];
    const nextAngle = next ? Number(next.angle) || 0 : 0;
    const nextTipo = next && (next.tipoPiega || 'su') === 'giu' ? 'giu' : 'su';
    const nextSigned = nextAngle * (nextTipo === 'giu' ? -1 : 1);
    const after = next ? setback(outerRadius, nextSigned) : 0;
    let straight = length - before - after;
    if (straight < 0) straight = 0;
    const from = { x, y };
    if (straight > 1e-6) {
      x += straight * Math.cos(dir);
      y += straight * Math.sin(dir);
      pushPoint(x, y, dir);
    }
    if (length > 0) {
      flanges.push({
        index: i,
        length,
        mid: { x: (from.x + x) / 2, y: (from.y + y) / 2 },
      });
    }
  }

  return { center, left, right, flanges, bends };
}

/** Contorno chiuso della sezione: lato interno, poi esterno al ritorno. */
export function contornoProfilo(segments, raggio = 0, spessore = 0) {
  const { left, right } = buildProfileGeometry(segments, raggio, spessore);
  const ring = [...left, ...[...right].reverse()];
  const points = [];
  for (const point of ring) {
    const prev = points[points.length - 1];
    if (prev && Math.hypot(point.x - prev.x, point.y - prev.y) < 1e-4) continue;
    points.push({ x: point.x, y: point.y });
  }
  if (points.length > 1) {
    const first = points[0];
    const last = points[points.length - 1];
    if (Math.hypot(first.x - last.x, first.y - last.y) < 1e-4) points.pop();
  }
  return points;
}
