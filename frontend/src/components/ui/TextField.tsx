import { useId, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import './TextField.css';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** Mensaje de error. Si existe, el campo se marca como inválido. */
  error?: string;
  /** Texto de ayuda debajo del campo. */
  hint?: string;
  /** Permite mostrar y ocultar el contenido (para contraseñas). */
  allowToggle?: boolean;
}

export function TextField({
  label,
  error,
  hint,
  allowToggle = false,
  type = 'text',
  className = '',
  ...rest
}: TextFieldProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const [isVisible, setIsVisible] = useState(false);

  const resolvedType = allowToggle ? (isVisible ? 'text' : 'password') : type;

  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ');

  return (
    <div className={`cc-field ${error ? 'cc-field--invalid' : ''} ${className}`}>
      <label className="cc-field__label" htmlFor={inputId}>
        {label}
      </label>

      <div className="cc-field__control">
        <input
          id={inputId}
          className="cc-field__input"
          type={resolvedType}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          {...rest}
        />

        {allowToggle ? (
          <button
            type="button"
            className="cc-field__toggle"
            onClick={() => setIsVisible((visible) => !visible)}
            aria-label={isVisible ? 'Ocultar el contenido' : 'Mostrar el contenido'}
          >
            {isVisible ? 'Ocultar' : 'Ver'}
          </button>
        ) : null}
      </div>

      {hint ? (
        <p className="cc-field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p className="cc-field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
