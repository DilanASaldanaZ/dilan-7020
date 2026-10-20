/**
 * Acceso a `localStorage`.
 *
 * La aplicación guarda aquí la sesión, el perfil del usuario, el saldo y los
 * datos de la última tarjeta usada, como pide el enunciado.
 *
 * `localStorage` puede lanzar errores (por ejemplo, en modo incógnito de
 * algunos navegadores o si el usuario bloqueó el almacenamiento), por eso
 * todas las operaciones van envueltas en `try/catch`: la app nunca debe
 * romperse por esto.
 */
import type { PublicUser } from '@carrera/shared';

/** Prefijo de todas las claves para no chocar con otras apps del mismo origen. */
const STORAGE_PREFIX = 'carrera:';

/** Claves usadas por la aplicación. */
export const StorageKey = {
  session: 'session',
  user: 'user',
  balance: 'balance',
  card: 'card',
} as const;

/** Sesión guardada en el navegador. */
export interface StoredSession {
  token: string;
  savedAt: string;
}

/** Datos de la última tarjeta usada (siempre ficticios). */
export interface StoredCard {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardHolder: string;
}

function getItem(key: string): string | null {
  try {
    return window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    return null;
  }
}

function setItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, value);
  } catch {
    // Sin almacenamiento disponible: la app sigue funcionando en memoria.
  }
}

function removeItem(key: string): void {
  try {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    // Ignorado a propósito.
  }
}

function readJson<T>(key: string): T | null {
  const raw = getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    // Si el dato guardado está corrupto, lo descartamos.
    removeItem(key);
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    setItem(key, JSON.stringify(value));
  } catch {
    // Ignorado a propósito.
  }
}

/** Fachada con todas las operaciones de almacenamiento de la aplicación. */
export const appStorage = {
  readSession(): StoredSession | null {
    return readJson<StoredSession>(StorageKey.session);
  },

  writeSession(session: StoredSession): void {
    writeJson(StorageKey.session, session);
  },

  readUser(): PublicUser | null {
    return readJson<PublicUser>(StorageKey.user);
  },

  writeUser(user: PublicUser): void {
    writeJson(StorageKey.user, user);
  },

  readBalance(): number | null {
    const value = readJson<number>(StorageKey.balance);
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  },

  writeBalance(balance: number): void {
    writeJson(StorageKey.balance, balance);
  },

  readCard(): StoredCard | null {
    return readJson<StoredCard>(StorageKey.card);
  },

  writeCard(card: StoredCard): void {
    writeJson(StorageKey.card, card);
  },

  /** Borra todos los datos de la aplicación (se usa al cerrar sesión). */
  clear(): void {
    removeItem(StorageKey.session);
    removeItem(StorageKey.user);
    removeItem(StorageKey.balance);
    removeItem(StorageKey.card);
  },
};
