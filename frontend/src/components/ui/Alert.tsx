import type { ReactNode } from 'react';
import './Alert.css';

export type AlertVariant = 'success' | 'error' | 'info' | 'warning';

export interface AlertProps {
  variant: AlertVariant;
  title?: string;
  children: ReactNode;
}

export function Alert({ variant, title, children }: AlertProps) {
  return (
    <div className={`cc-alert cc-alert--${variant}`} role={variant === 'error' ? 'alert' : 'status'}>
      {title ? <p className="cc-alert__title">{title}</p> : null}
      <div className="cc-alert__body">{children}</div>
    </div>
  );
}
