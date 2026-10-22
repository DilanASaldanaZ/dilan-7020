import './Spinner.css';

export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <span className="cc-spinner" role="status" aria-live="polite">
      <span className="cc-spinner__circle" aria-hidden="true" />
      <span className="u-visually-hidden">{label}</span>
    </span>
  );
}

/** Indicador de carga para toda la pantalla. */
export function PageLoader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="cc-page-loader">
      <span className="cc-spinner__circle cc-spinner__circle--lg" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
