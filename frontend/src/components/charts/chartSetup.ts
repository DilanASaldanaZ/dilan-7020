/**
 * Configuración de Chart.js.
 *
 * Chart.js pide registrar los elementos que se van a usar. Se hace una sola
 * vez, al importar este archivo, para que todos los gráficos usen la misma
 * configuración y no haya que repetirla en cada componente.
 */
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

/** Color del texto dentro de los gráficos (coincide con el tema oscuro). */
export const CHART_TEXT_COLOR = '#97a8c7';

/** Color de la cuadrícula. */
export const CHART_GRID_COLOR = 'rgba(36, 52, 79, 0.55)';
