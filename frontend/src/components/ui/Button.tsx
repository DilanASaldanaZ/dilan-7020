import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Muestra un indicador de carga y desactiva el botón. */
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const classes = [
    'cc-button',
    `cc-button--${variant}`,
    fullWidth ? 'cc-button--full' : '',
    loading ? 'cc-button--loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <span className="cc-button__spinner" aria-hidden="true" /> : null}
      <span className="cc-button__label">{children}</span>
    </button>
  );
}
