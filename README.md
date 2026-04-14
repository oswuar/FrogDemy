# FrogDemy - Backend Documentation

## 📋 Project Overview

FrogDemy is a comprehensive educational management system built with **Laravel 12** and **MySQL**. It provides a complete platform for managing students, teachers, courses, schedules, grades, and enrollments.

### Tech Stack
- **Backend**: Laravel 12 (PHP 8.4)
- **Database**: MySQL 9.4
- **Authentication**: Laravel Sanctum (Token-based)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Deployment**: Railway

### Key Features
- ✅ Role-based access control (Admin, Docente, Estudiante)
- ✅ User authentication with token-based sessions
- ✅ Complete CRUD operations for all entities
- ✅ Database seeding with test data
- ✅ RESTful API architecture
- ✅ Middleware-based authorization
- ✅ Account lockout after 3 failed login attempts

---

## 🏗️ Architecture

### Directory Structure
```
FrogDemy/
├── app/
│   ├── Http/
│   │   ├── Controllers/        # API controllers for each entity
│   │   │   ├── UsuarioController.php
│   │   │   ├── EstudianteController.php
│   │   │   ├── DocenteController.php
│   │   │   ├── MateriaController.php
│   │   │   ├── PeriodoController.php
│   │   │   ├── HorarioController.php
│   │   │   ├── NotaController.php
│   │   │   └── InscripcionController.php
│   │   └── Middleware/
│   │       └── verificarAutenticacion.php  # Role-checking middleware (alias: "rol")
│   ├── Models/                 # Eloquent models
│   │   ├── Usuario.php
│   │   ├── Estudiante.php
│   │   ├── Docente.php
│   │   ├── Administrador.php
│   │   ├── Materia.php
│   │   ├── Periodo.php
│   │   ├── Horario.php
│   │   ├── Nota.php
│   │   ├── Inscripcion.php
│   │   └── Roles.php
│   └── Providers/
├── database/
│   ├── migrations/             # Database schema definitions
│   └── seeders/                # Database seeding (test data)
├── routes/
│   ├── api.php                 # API routes with middleware
│   └── web.php                 # Web routes (static HTML serving)
├── public/
│   └── Sistema/                # Frontend HTML pages (login, admin, docente, estudiante)
├── config/
│   ├── database.php            # Database configuration
│   └── auth.php                # Authentication configuration
├── bootstrap/
│   └── app.php                 # Middleware aliases registered here
└── railway.toml                # Railway deployment config
```

### Database Schema

#### Core Tables
- **roles**: User roles (`estudiante`, `docente`, `administrativo`)
- **usuarios**: User accounts — all roles share this table, linked to a role via `role_id`
- **administradores**: Admin profile linked to `usuarios`
- **docentes**: Teacher profile linked to `usuarios` and `materias`
- **estudiantes**: Student profile linked to `usuarios`
- **materias**: Courses/subjects with a unique `codigo_materia`
- **periodos**: Academic periods (up to 2 per year)
- **horarios**: Class schedules linking materia, docente, and periodo
- **notas**: Student grades (scale 1–20) linking estudiante, periodo, and materia
- **inscripciones**: Student enrollments linking estudiante with a section and date

#### Relationships
```
Roles    (1) ──→ (N) Usuario
Usuario  (1) ──→ (1) Administrador
Usuario  (1) ──→ (1) Docente
Usuario  (1) ──→ (1) Estudiante
Docente  (N) ──→ (1) Materia
Horario  (N) ──→ (1) Materia
Horario  (N) ──→ (1) Docente
Horario  (N) ──→ (1) Periodo
Nota     (N) ──→ (1) Estudiante
Nota     (N) ──→ (1) Materia      (via codigo_materia)
Nota     (N) ──→ (1) Periodo
Inscripcion (1) ──→ (1) Estudiante
```

---

## 🔐 Authentication & Authorization

### Authentication Flow

1. **Login Request** (`POST /api/login`)
   - User submits `correo` (email) and `hash` (password)
   - System validates that the email exists in the database
   - Checks if the account is `activo` (not locked)
   - Verifies the password using `Hash::check`
   - On failure, increments `intentos_de_login_fallidos`; account is locked after **3 failed attempts**
   - On success, resets failed attempts, deletes any existing tokens, and issues a new Sanctum token

2. **Token Storage**
   - Token stored in browser `sessionStorage`
   - Sent with every API request in the `Authorization: Bearer {token}` header

3. **Token Validation**
   - The `auth:sanctum` middleware validates the token on every protected route
   - Expired or missing tokens return `401 Unauthorized`

4. **Logout** (`GET /api/logout`)
   - Deletes all tokens for the authenticated user

### Role-Based Access Control

Three user roles with specific permissions:

| Role | Permissions |
|------|------------|
| **administrativo** | Full access — manage all entities |
| **docente** | View students, manage grades, view schedules and subjects |
| **estudiante** | View own grades, view schedules and subjects |

### Middleware

The `verificarAutenticacion` middleware is registered under the alias `rol` in `bootstrap/app.php`. It accepts one or more role names as arguments and rejects requests from users whose role is not in the allowed list.

```php
// bootstrap/app.php
$middleware->alias([
    'rol' => \App\Http\Middleware\verificarAutenticacion::class,
]);
```

Routes are protected by stacking `auth:sanctum` with `rol`:

```php
Route::middleware('auth:sanctum')->group(function () {

    Route::middleware('rol:estudiante,docente,administrativo')->group(function () {
        // All authenticated users
    });

    Route::middleware('rol:docente,administrativo')->group(function () {
        // Teachers and admins only
    });

    Route::middleware('rol:administrativo')->group(function () {
        // Admins only
    });
});
```

---

## 📡 API Endpoints

### Authentication
```
POST   /api/login                       # User login (public)
GET    /api/logout                      # User logout (auth:sanctum)
GET    /api/usuario                     # Get current user info (auth:sanctum)
```

### Estudiantes (Students)
```
GET    /api/estudiante                  # List active students (docente, administrativo)
GET    /api/estudiante/{id}             # View student grades (all roles)
PUT    /api/estudiante/{id}             # Update student (administrativo)
DELETE /api/estudiante/{id}             # Deactivate student (administrativo)
```

### Docentes (Teachers)
```
GET    /api/docente                     # List active teachers (administrativo)
POST   /api/docente                     # Create teacher (administrativo)
PUT    /api/docente/{id}                # Update teacher (administrativo)
DELETE /api/docente/{id}                # Deactivate teacher (administrativo)
```

### Materias (Subjects)
```
GET    /api/materia                     # List all subjects (all roles)
POST   /api/materia                     # Create subject (administrativo)
PUT    /api/materia/{id}                # Update subject (administrativo)
DELETE /api/materia/{id}                # Delete subject (administrativo)
```

### Periodos (Academic Periods)
```
GET    /api/periodo                     # List all periods (administrativo)
POST   /api/periodo                     # Create period (administrativo)
PUT    /api/periodo/{id}                # Update period (administrativo)
DELETE /api/periodo/{id}                # Delete period (administrativo)
```

### Horarios (Schedules)
```
GET    /api/horario                     # List all schedules (all roles)
POST   /api/horario                     # Create schedule (administrativo)
PUT    /api/horario/{id}                # Update schedule (administrativo)
DELETE /api/horario/{id}                # Delete schedule (administrativo)
```

### Notas (Grades)
```
GET    /api/nota                        # List all grades (administrativo)
POST   /api/nota                        # Create grade (docente, administrativo)
PUT    /api/nota/{id}                   # Update grade (docente, administrativo)
DELETE /api/nota/{id}                   # Delete grade (docente, administrativo)
POST   /api/nota/final                  # Get final grade report by cedula + year (administrativo)
POST   /api/estudiante-materia/{id}     # Get a student's grades for a specific subject (docente, administrativo)
```

### Inscripciones (Enrollments)
```
GET    /api/inscripcion                 # List all enrollments (administrativo)
POST   /api/inscripcion                 # Enroll a new student (administrativo)
```

---

## 🔄 Key Processes

### 1. User Login Process

**Request:**
```json
POST /api/login
{
  "correo": "oswuar@gmail.com",
  "hash": "cesar"
}
```

**Response (Success — Administrativo):**
```json
{
  "mensaje": "usuario autenticado con exito",
  "token": "1|abc123...",
  "usuario": {
    "nombre": "oswuar",
    "id": 1,
    "rol": "administrativo",
    "id_rol_perfil": 1
  },
  "estatus": 200
}
```

**Response (Success — Docente):**
```json
{
  "mensaje": "usuario autenticado con exito",
  "token": "2|xyz456...",
  "usuario": {
    "nombre": "daniel",
    "id": 2,
    "rol": "docente",
    "id_rol_perfil": 1,
    "materia": "GHC"
  },
  "estatus": 200
}
```

**Process:**
1. Validate `correo` exists in `usuarios` table
2. Check `estado_de_cuenta` is `activo` (not locked)
3. Verify password with `Hash::check($request->hash, $usuario->hash)`
4. On failure: increment `intentos_de_login_fallidos`; lock account if ≥ 3
5. On success: reset failed attempts, delete old tokens, issue new Sanctum token
6. Return token + user data (docentes also receive their assigned `materia`)
7. Frontend stores token in `sessionStorage`

### 2. Enrolling a New Student (Inscripcion)

**Request:**
```json
POST /api/inscripcion
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "cedula": "12345678",
  "correo": "juan@gmail.com",
  "fecha_de_nacimiento": "2000-05-15",
  "hash": "password123",
  "fecha_de_inscripcion": "2024-01-10",
  "seccion": 1
}
```

**Process:**
1. Validate all required fields (unique `cedula` and `correo`, valid date formats)
2. Create `Usuario` record with `role_id = 1` (estudiante)
3. Generate `numero_de_matricula` as `{año_de_ingreso}-{cedula}`
4. Create `Estudiante` profile linked to the new `Usuario`
5. Create `Inscripcion` record linked to the new `Estudiante`
6. All three inserts run inside a database transaction — rolled back on any failure

### 3. Creating a Teacher (Docente)

**Request:**
```json
POST /api/docente
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "cedula": "12345678",
  "correo": "juan@gmail.com",
  "fecha_de_nacimiento": "1985-05-15",
  "materia": "GHC",
  "hash": "SecurePass1!"
}
```

**Process:**
1. Validate all fields — password must meet mixed/numbers/symbols rules
2. Look up `materia` by `nombre_materia` to get its `id`
3. Create `Usuario` record with `role_id = 2` (docente)
4. Create `Docente` profile linked to the `Usuario` and `materia_id`
5. Both inserts run inside a database transaction

### 4. Recording a Grade (Nota)

**Request:**
```json
POST /api/nota
{
  "cedula": "12254458",
  "periodo_año": 2024,
  "periodo_numero": 1,
  "materia": "GHC",
  "valor": 16
}
```

**Process:**
1. Validate all fields — `valor` must be between 1 and 20
2. Resolve `estudiante_id` by joining `usuarios` and `estudiantes` on `cedula`
3. Resolve `periodo_id` from `año` + `numero_de_periodo`
4. Resolve `codigo_materia` from `nombre_materia`
5. Create `Nota` record — runs inside a transaction

### 5. Deactivating a User (Soft Delete)

**Request:**
```
DELETE /api/docente/{id}
DELETE /api/estudiante/{id}
```

**Process:**
1. Find the `usuarios` record by ID
2. Set `estado_de_cuenta` to `'inactivo'`
3. Save the change — the record is **not** permanently deleted

**Note:** Only `materias`, `periodos`, `horarios`, and `notas` are hard-deleted. User accounts (docentes and estudiantes) are soft-deactivated by setting `estado_de_cuenta = 'inactivo'`.

### 6. Getting Final Grades Report

**Request:**
```json
POST /api/nota/final
{
  "cedula": "12254458",
  "año": 2024
}
```

**Process:**
1. Validate `cedula` exists in `usuarios` and `año` exists in `periodos`
2. Join `notas → estudiantes → usuarios → periodos → materias`
3. Group by student + subject and return `AVG(valor)` per subject

---

## 🗄️ Database Models

### Usuario
```php
// Table: usuarios
// Key fields: nombre, apellido, cedula (unique), correo (unique),
//             fecha_de_nacimiento, role_id (FK → roles),
//             hash (bcrypt password), intentos_de_login_fallidos,
//             estado_de_cuenta (activo | inactivo)

public function rol()         // belongsTo Roles
public function estudiante()  // hasOne Estudiante
public function docente()     // hasOne Docente
public function administrativo() // hasOne Administrador
public function perfil()      // dynamic: returns the correct profile relation based on role
```

### Estudiante
```php
// Table: estudiantes
// Key fields: usuario_id (FK), numero_de_matricula (unique),
//             año_de_ingreso, estado_academico (activo | graduado)

public function usuario()     // belongsTo Usuario
public function inscripcion() // hasOne Inscripcion
public function nota()        // hasMany Nota
```

### Docente
```php
// Table: docentes
// Key fields: usuario_id (FK), materia_id (FK)

public function usuario()     // belongsTo Usuario
public function materia()     // belongsTo Materia
public function horario()     // hasMany Horario
```

### Materia
```php
// Table: materias
// Key fields: codigo_materia (unique), nombre_materia, descripcion

public function nota()        // hasMany Nota
public function horario()     // hasOne Horario
public function docente()     // hasMany Docente
```

### Nota
```php
// Table: notas
// Key fields: estudiante_id (FK), periodo_id (FK),
//             codigo_materia (FK → materias.codigo_materia), valor (float 1–20)

public function estudiante()  // belongsTo Estudiante
public function materia()     // belongsTo Materia (via codigo_materia)
public function periodo()     // belongsTo Periodo
```

### Horario
```php
// Table: horarios
// Key fields: materia_id (FK), docente_id (FK), periodo_id (FK),
//             dia, hora_de_inicio, hora_de_cierre, aula, seccion

public function materia()     // belongsTo Materia
public function docente()     // belongsTo Docente
public function periodo()     // belongsTo Periodo
```

### Inscripcion
```php
// Table: inscripciones
// Key fields: estudiante_id (FK), seccion (1–4), fecha_de_inscripcion

public function estudiante()  // belongsTo Estudiante
```

---

## 🚀 Setup & Deployment

### Environment Variables

Create a `.env` file (copy from `.env.example`) with:

```env
APP_NAME=FrogDemy
APP_ENV=production
APP_DEBUG=false
APP_URL=https://frogdemy-production.up.railway.app

DB_CONNECTION=mysql
DB_HOST=mysql.railway.internal
DB_PORT=3306
DB_DATABASE=railway
DB_USERNAME=root
DB_PASSWORD=your_password

APP_KEY=base64:your_generated_key
```

Generate the app key with:
```bash
php artisan key:generate
```

### Local Setup

Run the full setup in one command (defined in `composer.json`):
```bash
composer run setup
```

This executes:
1. `composer install`
2. Copy `.env.example` → `.env`
3. `php artisan key:generate`
4. `php artisan migrate --force`
5. `npm install && npm run build`

Then seed the database:
```bash
php artisan db:seed --force
```

### Deployment on Railway

The `railway.toml` file handles the full build and deploy lifecycle:

```toml
[build]
builder = "railpack"
buildCommand = "npm run build"

[build.railpack]
phpVersion = "8.4"

[deploy]
preDeployCommand = "php artisan migrate --force && php artisan db:seed --force"
```

Migrations and seeding run automatically before every deploy.

---

## 👥 Test Users

After running the seeder (`php artisan db:seed --force`), the following accounts are available:

| Email | Password | Role |
|-------|----------|------|
| oswuar@gmail.com | cesar | administrativo |
| daniel@gmail.com | daniel | docente |
| david@gmail.com | david | estudiante |

The seeder uses `firstOrCreate` for all records, so re-running it is safe and idempotent.

---

## 📝 Common Tasks

### Add a New Entity

1. Create migration: `php artisan make:migration create_table_name`
2. Create model: `php artisan make:model ModelName`
3. Create controller: `php artisan make:controller ModelNameController`
4. Add routes in `routes/api.php`
5. Wrap routes with the appropriate `rol:` middleware

### Add a New Role

1. Add the role name to the seeder in `database/seeders/DatabaseSeeder.php`
2. Update `verificarAutenticacion` middleware if new logic is needed
3. Protect routes by passing the new role name to the `rol:` middleware alias

### Debug API Issues

1. Check logs: `storage/logs/laravel.log`
2. Verify the `Authorization: Bearer {token}` header is present and valid
3. Confirm the user's `estado_de_cuenta` is `activo`
4. Validate request payload field names match what the controller expects
5. Check database connectivity and that migrations have been run

---

## 🔗 Related Documentation

- [Laravel Documentation](https://laravel.com/docs)
- [Laravel Sanctum](https://laravel.com/docs/sanctum)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Railway Deployment](https://docs.railway.com)

---

**Last Updated:** April 2026
**Version:** 1.0
**Status:** Production Ready
