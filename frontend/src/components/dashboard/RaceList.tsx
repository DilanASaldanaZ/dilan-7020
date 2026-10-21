import type { RaceDay } from '@carrera/shared';
import { formatDateTime } from '@carrera/shared';
import './RaceList.css';

export interface RaceListProps {
  raceDay: RaceDay;
}

/** Lista de las carreras simuladas del día. */
export function RaceList({ raceDay }: RaceListProps) {
  return (
    <ul className="cc-races">
      {raceDay.races.map((race) => (
        <li className="cc-races__item" key={race.raceId}>
          <span className="cc-races__number">#{race.raceNumber}</span>
          <span className="cc-races__time">{formatDateTime(race.startedAt)}</span>
          <span className="cc-races__winner">
            Ganó <strong>{race.winnerSnailName}</strong>
          </span>
          <span className="cc-races__duration">{race.durationSeconds} s</span>
        </li>
      ))}
    </ul>
  );
}
