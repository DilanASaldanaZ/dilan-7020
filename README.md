# Carrera de Caracoles

Aplicación web de apuestas en carreras de caracoles. Incluye registro e inicio de
sesión, un dashboard con gráficas y un simulador de pasarela de pagos para recargar
saldo.

**Stack:** React + TypeScript (frontend) · Express + TypeScript (backend) · `localStorage` (persistencia).

---

## 1. Requisitos

- Node.js **20.11 o superior** (probado en Node 24).
- npm 10 o superior.

## 2. Instalación

```bash
npm install
```

El comando compila automáticamente el paquete compartido (`shared`), que es la base
de tipos y validaciones que usan el frontend y el backend.

## 3. Cómo ejecutar la aplicación

```bash
npm run dev
```

Ese comando levanta las dos piezas a la vez:

| Servicio  | URL                    | Puerto |
| --------- | ---------------------- | ------ |
| Frontend  | http://localhost:5173  | 5173   |
| Backend   | http://localhost:4000/api | 4000 |

Para levantarlos por separado:

```bash
npm run dev:api    # solo el backend (Express)
npm run dev:web    # solo el frontend (Vite)
```

Variables de entorno opcionales (copia el archivo de ejemplo):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

| Variable (backend)             | Por defecto              | Para qué sirve                              |
| ------------------------------ | ------------------------ | ------------------------------------------- |
| `PORT`                         | `4000`                   | Puerto del servidor                          |
| `JWT_SECRET`                   | secreto de desarrollo    | Firma los tokens de sesión (cámbialo)        |
| `JWT_EXPIRES_IN`               | `2h`                     | Duración de la sesión                        |
| `CORS_ORIGIN`                  | `http://localhost:5173`  | Orígenes permitidos (separados por coma)     |
| `SHELLPAY_TIMEOUT_DELAY_MS`    | `15000`                  | Retraso del escenario de timeout             |

| Variable (frontend) | Por defecto                  | Para qué sirve                  |
| ------------------- | ---------------------------- | ------------------------------- |
| `VITE_API_URL`      | `http://localhost:4000/api`  | URL base de la API              |

### Compilar para producción

```bash
npm run build   # compila shared + backend + frontend
npm start       # arranca el backend con el código compilado
npm run preview # sirve el frontend compilado
```

## 4. Cómo ejecutar las pruebas

```bash
npm test              # corre las pruebas de los tres paquetes
npm run test:api      # solo el backend (Vitest + Supertest)
npm run test:web      # solo el frontend (Vitest + Testing Library)
npm run test:watch    # backend en modo interactivo
```

| Paquete   | Pruebas | Enfoque                                              |
| --------- | ------- | ---------------------------------------------------- |
| `shared`  | 42      | Reglas de validación y formato (se usan en ambos lados) |
| `backend` | 52      | API real con `supertest`: registro, sesión, pagos, dashboard |
| `frontend`| 34      | Componentes con Testing Library y cliente HTTP con `fetch` simulado |

## 5. Recorrido rápido de prueba

1. Abre http://localhost:5173 y crea una cuenta (contraseña con mayúscula, minúscula y número).
2. Entras al dashboard: ves tu nombre, el saldo en `$0.00`, la gráfica de anillo
   (apuestas ganadas y perdidas) y la de barras (victorias de los 6 caracoles).
3. Pulsa **Recargar saldo** y usa los datos de prueba:
   - Tarjeta: `1234123412341234`
   - Vencimiento: `12/26`
   - CVV: `543`
   - Monto: cualquier cantidad mayor que cero (por ejemplo `250`)

   El campo de vencimiento solo acepta números y añade la diagonal solo: al
   escribir `1226` queda `12/26`. Además rechaza las tarjetas vencidas (el mes
   actual todavía se acepta). El número de tarjeta se limita a 16 dígitos, el
   CVV a tres y el nombre del titular solo admite letras y espacios.
4. El saldo sube de inmediato y la operación aparece en el historial.
5. Prueba los escenarios de error con la tarjeta `4000000000000002` (rechazada) o
   marcando la casilla **Simular un error interno de la pasarela**.
6. Cierra sesión, recarga la página: vuelves al login. Inicia sesión de nuevo con el
   mismo correo y contraseña y recuperas tu saldo.

## 6. La pasarela de pagos simulada (`ShellPay`)

`ShellPay` es un simulador local: no se conecta a ningún servicio real ni procesa
información financiera real. Solo decide, de forma determinista, si una operación se
aprueba, se rechaza o falla.

### 6.1 Desde la aplicación

| Escenario            | Cómo reproducirlo                                                | `status`   | HTTP |
| -------------------- | ---------------------------------------------------------------- | ---------- | ---- |
| Cobro aprobado       | Tarjeta `1234123412341234`, vencimiento `12/26`, CVV `543`, monto > 0 | `approved` | 201  |
| Error de transacción | Tarjeta `4000000000000002` (fondos insuficientes)                | `failed`   | 422  |
| Error de transacción | Tarjeta `9999999999999999` (tarjeta bloqueada)                    | `failed`   | 422  |
| Error de transacción | Cualquier otra tarjeta válida                                    | `failed`   | 422  |
| Error de transacción | Datos con formato incorrecto (CVV, vencimiento, monto, titular)  | `failed`   | 422  |
| Error del sistema    | Casilla "Simular un error interno de la pasarela" o cabecera `x-shellpay-mode: system_error` | `error` | 503 |
| Timeout              | Cabecera `x-shellpay-mode: timeout`                               | `approved` | 201 (tras 15 s) |

### 6.2 Desde la API (sin sesión, para reproducir cada respuesta)

```bash
# 1) Cobro aprobado
curl -i -X POST http://localhost:4000/api/shellpay/charge \
  -H "Content-Type: application/json" \
  -d '{
    "cardNumber": "1234123412341234",
    "expiryDate": "12/26",
    "cvv": "543",
    "cardHolder": "Ana Prueba",
    "amount": 250,
    "payerId": "user-demo",
    "payerEmail": "demo@correo.com"
  }'

# 2) Error de transacción (tarjeta rechazada)
curl -i -X POST http://localhost:4000/api/shellpay/charge \
  -H "Content-Type: application/json" \
  -d '{"cardNumber":"4000000000000002","expiryDate":"12/26","cvv":"543","cardHolder":"Ana Prueba","amount":250,"payerId":"user-demo","payerEmail":"demo@correo.com"}'

# 3) Error del sistema
curl -i -X POST http://localhost:4000/api/shellpay/charge \
  -H "Content-Type: application/json" \
  -H "x-shellpay-mode: system_error" \
  -d '{"cardNumber":"1234123412341234","expiryDate":"12/26","cvv":"543","cardHolder":"Ana Prueba","amount":250,"payerId":"user-demo","payerEmail":"demo@correo.com"}'
```

### 6.3 Formato de la respuesta

Todas las respuestas (aprobadas o no) traen los mismos campos:

| Campo                 | Tipo    | Descripción                                                   |
| --------------------- | ------- | ------------------------------------------------------------- |
| `id`                  | string  | Identificador de la operación (`sp_...`)                        |
| `status`              | string  | `approved`, `failed` o `error`                                  |
| `status_detail`       | string  | Detalle legible del resultado (es lo que ve el usuario)        |
| `transaction_amount`  | number  | Monto solicitado                                                |
| `date_created`        | string  | Fecha de creación en ISO 8601                                   |
| `authorization_code`  | string? | Código de autorización; `null` si la operación no fue aprobada  |
| `reference`           | string  | Referencia de la operación (`SP-AAAAMMDD-XXXX`)                |
| `payer_id`            | string  | Identificador del usuario que paga                              |
| `payer_email`         | string  | Correo del usuario que paga                                     |
| `card_number`         | string  | Número de tarjeta ficticio usado                                |
| `card_holder`         | string  | Nombre del titular                                              |
| `expiry_date`         | string  | Fecha de vencimiento usada                                      |
| `cvv`                 | string  | CVV ficticio usado                                              |

> El enunciado pide que el número de tarjeta y el CVV se guarden en `localStorage`.
> Se hace en la clave `carrera:card`. Son datos ficticios de un simulador; en una
> aplicación real nunca se debería almacenar un CVV.

## 7. Endpoints de la API

| Método | Ruta                        | Auth | Descripción                                  |
| ------ | --------------------------- | ---- | -------------------------------------------- |
| `POST` | `/api/auth/register`        | no   | Crea la cuenta y devuelve token + perfil     |
| `POST` | `/api/auth/login`           | no   | Inicia sesión                                |
| `POST` | `/api/auth/logout`          | no   | Cierre de sesión (el token es sin estado)    |
| `GET`  | `/api/auth/me`              | sí   | Perfil del usuario de la sesión              |
| `POST` | `/api/payments/top-up`      | sí   | Recarga de saldo vía `ShellPay`              |
| `GET`  | `/api/dashboard/summary`    | sí   | Apuestas, carreras e historial del dashboard  |
| `POST` | `/api/shellpay/charge`      | no   | Cobro directo contra el simulador             |
| `GET`  | `/api/health`               | no   | Estado del servicio                           |

Las rutas protegidas usan `Authorization: Bearer <token>`.

## 8. Estructura del proyecto

```
.
├── shared/            Tipos, validaciones y formato usados por ambos lados
│   └── src/           types.ts · shellpay.ts · validation.ts · format.ts · snails.ts
├── backend/           API Express
│   ├── src/
│   │   ├── config/    Configuración por variables de entorno
│   │   ├── controllers/  Traducen petición → respuesta
│   │   ├── middleware/   Autenticación, errores, límite de peticiones
│   │   ├── repositories/ "Base de datos" en memoria (usuarios, transacciones, carreras)
│   │   ├── routes/    Definición de rutas
│   │   ├── services/  Lógica de negocio (auth, pagos, dashboard, ShellPay)
│   │   └── utils/     Contraseñas, tokens, logger, errores, aleatoriedad
│   └── tests/         Pruebas con Vitest + Supertest
├── frontend/          SPA de React
│   ├── src/
│   │   ├── components/  UI base, layout y piezas del dashboard
│   │   ├── context/     Estado global de autenticación
│   │   ├── hooks/       `useAuth`, `useAsyncOperation`
│   │   ├── pages/       Login, Registro, Dashboard, 404
│   │   ├── services/    Cliente HTTP y llamadas a la API
│   │   ├── styles/      Sistema de diseño en CSS
│   │   └── utils/       Acceso a `localStorage`
│   └── src/tests/    Pruebas con Vitest + Testing Library
```

## 9. Decisiones de diseño

- **Monorepo con workspaces de npm.** Un solo `npm install` y un solo `npm test`.
  El paquete `shared` evita duplicar tipos y reglas de validación.
- **Contraseñas con bcrypt.** Nunca se guarda la contraseña en texto plano, ni
  siquiera en la simulación en memoria.
- **Token JWT sin estado.** No hay lista de tokens revocados; el cierre de sesión
  consiste en que el cliente borre su token y sus datos locales.
- **El backend es la autoridad del saldo; `localStorage` es la persistencia.**
  El saldo se actualiza en el servidor y se refleja de inmediato en el navegador,
  que lo guarda para sobrevivir a una recarga.
- **Datos simulados deterministas.** Las carreras y el resumen de apuestas se
  generan con una semilla, así la gráfica no cambia sola en cada recarga.
- **Sin dependencias de UI ni de validación.** El diseño es CSS propio con
  variables y las validaciones son funciones puras: menos dependencias, menos
  surprises y mensajes de error idénticos en el formulario y en la API.

## 10. Licencia

MIT.
