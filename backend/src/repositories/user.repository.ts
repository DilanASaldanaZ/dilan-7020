/**
 * Repositorio de usuarios.
 *
 * Es una simulación local: los datos viven en memoria (un `Map`). Si el
 * servidor se reinicia, los datos se pierden. La sustitución por una base de
 * datos real es una de las tareas que se documentan en el PDF de respuesta.
 *
 * El repositorio es el único lugar donde se guarda la contraseña (hasheada).
 */
import { randomUUID } from 'node:crypto';
import type { PublicUser, UserId } from '@carrera/shared';
import { normalizeEmail, roundMoney } from '@carrera/shared';
import { ConflictError, NotFoundError } from '../utils/errors.js';

/** Usuario tal como se guarda en el repositorio. */
export interface StoredUser extends PublicUser {
  /** Hash bcrypt de la contraseña. Nunca se devuelve al cliente. */
  passwordHash: string;
}

/** Datos necesarios para crear un usuario. */
export interface CreateUserInput {
  fullName: string;
  email: string;
  passwordHash: string;
}

export class UserRepository {
  private readonly users = new Map<UserId, StoredUser>();

  /** Índice por correo normalizado para buscar rápido y detectar duplicados. */
  private readonly idByEmail = new Map<string, UserId>();

  /**
   * Crea un usuario nuevo con saldo inicial de $0.
   * @throws {ConflictError} si el correo ya está registrado.
   */
  create(input: CreateUserInput): StoredUser {
    const email = normalizeEmail(input.email);

    if (this.idByEmail.has(email)) {
      throw new ConflictError('Ese correo ya está registrado. Intenta iniciar sesión.');
    }

    const user: StoredUser = {
      id: randomUUID(),
      fullName: input.fullName,
      email,
      passwordHash: input.passwordHash,
      balance: 0,
      createdAt: new Date().toISOString(),
    };

    this.users.set(user.id, user);
    this.idByEmail.set(user.email, user.id);
    return user;
  }

  /** Busca un usuario por id. */
  findById(id: UserId): StoredUser | undefined {
    return this.users.get(id);
  }

  /** Busca un usuario por correo (normalizado a minúsculas). */
  findByEmail(email: string): StoredUser | undefined {
    const id = this.idByEmail.get(normalizeEmail(email));
    return id ? this.users.get(id) : undefined;
  }

  /**
   * Suma un monto al saldo del usuario.
   * @throws {NotFoundError} si el usuario no existe.
   * @throws {ConflictError} si el monto no es positivo.
   */
  creditBalance(id: UserId, amount: number): StoredUser {
    const user = this.users.get(id);
    if (!user) throw new NotFoundError('No encontramos al usuario de esta sesión.');

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ConflictError('El monto a acreditar debe ser mayor que cero.');
    }

    user.balance = roundMoney(user.balance + amount);
    return user;
  }

  /** Devuelve la versión pública del usuario (sin hash de contraseña). */
  toPublic(user: StoredUser): PublicUser {
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
  }

  /** Cantidad de usuarios registrados (solo para pruebas). */
  count(): number {
    return this.users.size;
  }
}
