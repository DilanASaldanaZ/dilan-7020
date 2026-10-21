import { Doughnut } from 'react-chartjs-2';
import type { TooltipItem } from 'chart.js';
import type { BetSummary } from '@carrera/shared';
import { buildDonutData } from '../charts/chartData';
import { CHART_GRID_COLOR, CHART_TEXT_COLOR } from '../charts/chartSetup';
import './BetDonutChart.css';

export interface BetDonutChartProps {
  summary: BetSummary;
}

/** Gráfica de anillo con las apuestas ganadas y perdidas. */
export function BetDonutChart({ summary }: BetDonutChartProps) {
  const slices = buildDonutData(summary);

  const data = {
    labels: slices.map((slice) => slice.label),
    datasets: [
      {
        data: slices.map((slice) => slice.value),
        backgroundColor: slices.map((slice) => slice.color),
        borderColor: 'rgba(7, 13, 26, 0.9)',
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: CHART_TEXT_COLOR, usePointStyle: true, padding: 16 },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'doughnut'>) =>
            ` ${context.label}: ${context.parsed} apuestas`,
        },
      },
    },
  };

  return (
    <div className="cc-donut">
      <div className="cc-donut__canvas">
        <Doughnut data={data} options={options} aria-label="Gráfica de apuestas ganadas y perdidas" />
        <div className="cc-donut__center">
          <span className="cc-donut__value">{summary.total}</span>
          <span className="cc-donut__label">apuestas</span>
        </div>
      </div>
    </div>
  );
}

/** Estilo de la cuadrícula, reutilizado por otras gráficas. */
export const gridColor = CHART_GRID_COLOR;
