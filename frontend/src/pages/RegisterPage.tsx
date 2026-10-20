import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PASSWORD_RULES, validateRegisterInput } from '@carrera/shared';
import type { FieldErrors } from '@carrera/shared';
import { useAuth } from '../hooks/useAuth';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/TextField';
import './AuthPages.css';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const validation = validateRegisterInput({
      fullName,
      email,
      password,
      passwordConfirmation,
    });

    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await register({
        fullName: validation.value!.fullName,
        email: validation.value!.email,
        password: validation.value!.password,
        passwordConfirmation: validation.value!.passwordConfirmation,
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'No pudimos crear tu cuenta. Inténtalo de nuevo.',
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
          <h1 className="cc-auth__title">Crea tu cuenta</h1>
          <p className="cc-auth__subtitle">Regístrate y empieza con $0 de saldo.</p>
        </header>

        <form className="cc-auth__form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Nombre completo"
            autoComplete="name"
            placeholder="Ana Prueba"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            error={fieldErrors.fullName}
          />

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
            autoComplete="new-password"
            placeholder="Crea una contraseña"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            hint={`Debe cumplir: ${PASSWORD_RULES.map((rule) => rule.label.toLowerCase()).join(', ')}.`}
            allowToggle
          />

          <TextField
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            placeholder="Repite tu contraseña"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            error={fieldErrors.passwordConfirmation}
          />

          {formError ? <Alert variant="error">{formError}</Alert> : null}

          <Button type="submit" loading={isSubmitting} disabled={isSubmitting} fullWidth>
            {isSubmitting ? 'Creando cuenta…' : 'Registrarme'}
          </Button>
        </form>

        <p className="cc-auth__footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </section>
    </div>
  );
}
