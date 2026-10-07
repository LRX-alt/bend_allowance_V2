/**
 * Utensili di uso comune in pressopiegatura europea (sistemi Promecam/Euro, Amada e Wila).
 * Il valore usato dal pezzo è il raggio di punta o l'apertura V, non un codice costruttore.
 */
export const PUNZONI = [
  { id: 'dritto-88-02', gruppo: 'Dritto 88°', label: 'R 0,2 mm', radius: 0.2 },
  { id: 'dritto-88-06', gruppo: 'Dritto 88°', label: 'R 0,6 mm', radius: 0.6 },
  { id: 'dritto-88-08', gruppo: 'Dritto 88°', label: 'R 0,8 mm', radius: 0.8 },
  { id: 'dritto-88-10', gruppo: 'Dritto 88°', label: 'R 1 mm', radius: 1 },
  { id: 'dritto-88-15', gruppo: 'Dritto 88°', label: 'R 1,5 mm', radius: 1.5 },
  { id: 'dritto-88-20', gruppo: 'Dritto 88°', label: 'R 2 mm', radius: 2 },
  { id: 'dritto-88-30', gruppo: 'Dritto 88°', label: 'R 3 mm', radius: 3 },
  { id: 'acuto-30-02', gruppo: 'Acuto 30°', label: 'R 0,2 mm', radius: 0.2 },
  { id: 'acuto-30-06', gruppo: 'Acuto 30°', label: 'R 0,6 mm', radius: 0.6 },
  { id: 'cigno-88-08', gruppo: 'Collo di cigno 88°', label: 'R 0,8 mm', radius: 0.8 },
  { id: 'cigno-88-10', gruppo: 'Collo di cigno 88°', label: 'R 1 mm', radius: 1 },
  { id: 'raggio-5', gruppo: 'Punzone a raggio', label: 'R 5 mm', radius: 5 },
  { id: 'raggio-8', gruppo: 'Punzone a raggio', label: 'R 8 mm', radius: 8 },
  { id: 'raggio-10', gruppo: 'Punzone a raggio', label: 'R 10 mm', radius: 10 },
  { id: 'raggio-12', gruppo: 'Punzone a raggio', label: 'R 12,5 mm', radius: 12.5 },
  { id: 'raggio-15', gruppo: 'Punzone a raggio', label: 'R 15 mm', radius: 15 },
  { id: 'raggio-20', gruppo: 'Punzone a raggio', label: 'R 20 mm', radius: 20 },
  { id: 'raggio-25', gruppo: 'Punzone a raggio', label: 'R 25 mm', radius: 25 },
];

export const MATRICI = [
  { id: 'v88-6', gruppo: 'Matrice 88°', label: 'V 6 mm', opening: 6 },
  { id: 'v88-8', gruppo: 'Matrice 88°', label: 'V 8 mm', opening: 8 },
  { id: 'v88-10', gruppo: 'Matrice 88°', label: 'V 10 mm', opening: 10 },
  { id: 'v88-12', gruppo: 'Matrice 88°', label: 'V 12 mm', opening: 12 },
  { id: 'v88-16', gruppo: 'Matrice 88°', label: 'V 16 mm', opening: 16 },
  { id: 'v88-20', gruppo: 'Matrice 88°', label: 'V 20 mm', opening: 20 },
  { id: 'v88-25', gruppo: 'Matrice 88°', label: 'V 25 mm', opening: 25 },
  { id: 'v88-32', gruppo: 'Matrice 88°', label: 'V 32 mm', opening: 32 },
  { id: 'v88-40', gruppo: 'Matrice 88°', label: 'V 40 mm', opening: 40 },
  { id: 'v88-50', gruppo: 'Matrice 88°', label: 'V 50 mm', opening: 50 },
  { id: 'v88-63', gruppo: 'Matrice 88°', label: 'V 63 mm', opening: 63 },
  { id: 'v88-80', gruppo: 'Matrice 88°', label: 'V 80 mm', opening: 80 },
  { id: 'v88-100', gruppo: 'Matrice 88°', label: 'V 100 mm', opening: 100 },
  { id: 'v88-125', gruppo: 'Matrice 88°', label: 'V 125 mm', opening: 125 },
  { id: 'v30-6', gruppo: 'Matrice acuta 30°', label: 'V 6 mm', opening: 6 },
  { id: 'v30-8', gruppo: 'Matrice acuta 30°', label: 'V 8 mm', opening: 8 },
  { id: 'v30-12', gruppo: 'Matrice acuta 30°', label: 'V 12 mm', opening: 12 },
  { id: 'v30-16', gruppo: 'Matrice acuta 30°', label: 'V 16 mm', opening: 16 },
];

export function gruppiDi(items) {
  const groups = [];
  for (const item of items) {
    let group = groups.find(entry => entry.nome === item.gruppo);
    if (!group) {
      group = { nome: item.gruppo, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}
