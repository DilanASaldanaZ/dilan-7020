import { Link } from 'react-router-dom';
import './NotFoundPage.css';

export function NotFoundPage() {
  return (
    <div className="cc-notfound">
      <p className="cc-notfound__code">404</p>
      <h1 className="cc-notfound__title">Esta página no existe</h1>
      <p className="cc-notfound__text">
        Puede que la dirección esté mal escrita o que la página se haya movido.
      </p>
      <Link className="cc-notfound__link" to="/dashboard">
        Volver al dashboard
      </Link>
    </div>
  );
}
