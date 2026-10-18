/**
 * Servicio de registro e inicio de sesión.
 *
 * Es una simulación local (lo permite el enunciado): no hay base de datos,
 * no hay correo de verificación y no hay recuperación de contraseña.
 *
 * Lo importante desde el punto de vista de seguridad:
 *  - La contraseña se guarda SOLO hasheada con bcrypt.
 *  - El cliente nunca recibe el hash, solo un token de sesión.
 */
import type { AuthResponse, LoginInput, RegisterInput } from '@carrera/shared';
import { validateLoginInput, validateRegisterInput } from '@carrera/shared';
import type { UserRepository } from '../repositories/user.repository.js';
import { UnauthorizedError, ValidationError } from '../utils/errors.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signSessionToken } from '../utils/token.js';

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  /** Registra un usuario nuevo con saldo inicial de $0. */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const validation = validateRegisterInput(input);
    if (!validation.valid || !validation.value) {
      throw new ValidationError('Revisa los datos del formulario.', validation.errors);
    }

    const { fullName, email, password } = validation.value;
    const passwordHash = await hashPassword(password);
    const user = this.users.create({ fullName, email, passwordHash });

    return {
      user: this.users.toPublic(user),
      token: signSessionToken(user.id, user.email),
    };
  }

  /** Inicia sesión con correo y contraseña. */
  async login(input: LoginInput): Promise<AuthResponse> {
    const validation = validateLoginInput(input);
    if (!validation.valid || !validation.value) {
      throw new ValidationError('Revisa los datos del formulario.', validation.errors);
    }

    const { email, password } = validation.value;
    const user = this.users.findByEmail(email);

    // Mismo mensaje para "correo inexistente" y "contraseña incorrecta":
    // así no se revela qué correos están registrados.
    if (!user) {
      throw new UnauthorizedError('El correo o la contraseña no son correctos.');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('El correo o la contraseña no son correctos.');
    }

    return {
      user: this.users.toPublic(user),
      token: signSessionToken(user.id, user.email),
    };
  }
}
