/**
 * Manejo de contraseñas.
 *
 * La contraseña NUNCA se guarda en texto plano: se guarda el hash con bcrypt
 * y un "salt" (sal) aleatorio por usuario. El hash no se puede deshacer, así
 * que aunque alguien lea la base de datos no obtiene la contraseña real.
 */
import bcrypt from 'bcryptjs';

/** Coste del hashing. 10 es el valor recomendado por defecto en bcrypt. */
const SALT_ROUNDS = 10;

/** Genera el hash de una contraseña. */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compara una contraseña en texto plano contra su hash.
 * Devuelve `false` si la contraseña no coincide.
 */
export async function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
