import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { validateLoginInput } from '@carrera/shared';
import type { FieldErrors } from '@carrera/shared';
import { useAuth } from '../hooks/useAuth';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import './AuthPages.css';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const validation = validateLoginInput({ email, password });
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await login(validation.value!.email, validation.value!.password);
      const destination = (location.state as { from?: string } | null)?.from ?? '/dashboard';
      navigate(destination, { replace: true });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'No pudimos iniciar sesión. Inténtalo de nuevo.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cc-auth">
      <section className="cc-auth__card">
        <header className="cc-auth__header">
          <span className="cc-auth__logo" aria-hidden="true">
            🐌
          </span>
          <h1 className="cc-auth__title">Carrera de Caracoles</h1>
          <p className="cc-auth__subtitle">Inicia sesión para ver tu panel de carreras.</p>
        </header>

        <form className="cc-auth__form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            placeholder="nombre@correo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
          />

          <TextField
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            allowToggle
          />

          {formError ? <Alert variant="error">{formError}</Alert> : null}

          <Button type="submit" loading={isSubmitting} disabled={isSubmitting} fullWidth>
            {isSubmitting ? 'Entrando…' : 'Iniciar sesión'}
          </Button>
        </form>

        <p className="cc-auth__footer">
          ¿Todavía no tienes cuenta? <Link to="/register">Regístrate aquí</Link>
        </p>
      </section>
    </div>
  );
}
