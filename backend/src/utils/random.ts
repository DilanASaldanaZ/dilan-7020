/**
 * Generación de números aleatorios reproducibles.
 *
 * Los datos simulados del dashboard deben ser los mismos en cada recarga
 * (si no, la gráfica cambiaría sola y se vería raro). Para lograrlo se usa un
 * generador pseudoaleatorio con "semilla": la misma semilla produce siempre
 * la misma secuencia.
 */

/** Convierte cualquier texto en un número de 32 bits (para usarlo como semilla). */
export function hashString(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Generador pseudoaleatorio rápido y determinista (mulberry32).
 * @param seed semilla numérica.
 * @returns función que devuelve números entre 0 (inclusive) y 1 (exclusivo).
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Elige un elemento al azar de una lista usando el generador con semilla. */
export function pickOne<T>(items: readonly T[], random: () => number): T {
  const index = Math.floor(random() * items.length);
  // `items` nunca está vacío en este proyecto, pero TypeScript no lo sabe.
  return items[Math.min(index, items.length - 1)] as T;
}
