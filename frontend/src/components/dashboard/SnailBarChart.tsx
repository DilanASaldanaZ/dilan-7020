import { Bar } from 'react-chartjs-2';
import type { TooltipItem } from 'chart.js';
import type { RaceDay } from '@carrera/shared';
import { buildSnailBarData } from '../charts/chartData';
import { CHART_GRID_COLOR, CHART_TEXT_COLOR } from '../charts/chartSetup';
import './SnailBarChart.css';

export interface SnailBarChartProps {
  raceDay: RaceDay;
}

/** Gráfica de barras con las victorias de cada caracol. */
export function SnailBarChart({ raceDay }: SnailBarChartProps) {
  const bars = buildSnailBarData(raceDay);

  const data = {
    labels: bars.map((bar) => bar.label),
    datasets: [
      {
        label: 'Victorias',
        data: bars.map((bar) => bar.victories),
        backgroundColor: bars.map((bar) => bar.color),
        borderRadius: 8,
        maxBarThickness: 46,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => ` Victorias: ${context.parsed.y ?? 0}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: CHART_TEXT_COLOR },
      },
      y: {
        beginAtZero: true,
        ticks: { color: CHART_TEXT_COLOR, stepSize: 1, precision: 0 },
        grid: { color: CHART_GRID_COLOR },
      },
    },
  };

  return (
    <div className="cc-bars">
      <Bar data={data} options={options} aria-label="Gráfica de victorias de los caracoles" />
    </div>
  );
}
