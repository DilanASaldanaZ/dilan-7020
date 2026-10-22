import type { ReactNode } from 'react';
import './Card.css';

export interface CardProps {
  title?: string;
  /** Texto corto a la derecha del título. */
  subtitle?: string;
  /** Contenido opcional a la derecha (botones, por ejemplo). */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Card({ title, subtitle, action, className = '', children }: CardProps) {
  return (
    <section className={`cc-card ${className}`}>
      {title || action ? (
        <header className="cc-card__header">
          <div>
            {title ? <h2 className="cc-card__title">{title}</h2> : null}
            {subtitle ? <p className="cc-card__subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div className="cc-card__action">{action}</div> : null}
        </header>
      ) : null}

      <div className="cc-card__body">{children}</div>
    </section>
  );
}
