/**
 * Catálogo de caracoles que participan en las carreras simuladas.
 * Son datos fijos: el enunciado pide 6 caracoles con nombres libres.
 */
export interface SnailDefinition {
  id: string;
  name: string;
  color: string;
}

export const SNAILS: readonly SnailDefinition[] = [
  { id: 'rizo', name: 'Rizo', color: '#22c55e' },
  { id: 'espiral', name: 'Espiral', color: '#38bdf8' },
  { id: 'turbina', name: 'Turbina', color: '#f59e0b' },
  { id: 'cinta', name: 'Cinta', color: '#a78bfa' },
  { id: 'molinete', name: 'Molinete', color: '#fb7185' },
  { id: 'caracol', name: 'Caracol', color: '#2dd4bf' },
] as const;

/** Número de carreras que se simulan cada día. */
export const RACES_PER_DAY = 6;
