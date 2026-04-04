<?php

namespace Database\Seeders;

use App\Models\Roles;
use App\Models\Usuario;
use App\Models\Materia;
use App\Models\Periodo;
use App\Models\Nota;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        Roles::create([
            'nombre_rol' => 'estudiante'
        ]);

        Roles::create([
            'nombre_rol' => 'docente'
        ]);

        Roles::create([
            'nombre_rol' => 'administrativo'
        ]);

        Materia::create([
            "codigo_materia" => "mat001",
            "nombre_materia" => "GHC",
        ]);

        Usuario::create([
            "nombre" => "oswuar",
            "apellido" => "blanco",
            "cedula" => 31855836,
            "correo" => 'oswuar@gmail.com',
            "fecha_de_nacimiento" => "2006-09-23",
            "hash" => "oswuar",
            "role_id" => 3
        ])->perfil()->create();

        Usuario::create([
            "nombre" => "daniel",
            "apellido" => "pacheco",
            "cedula" => 12225488,
            "correo" => 'daniel@gmail.com',
            "fecha_de_nacimiento" => "1950-12-10",
            "hash" => "daniel",
            "role_id" => 2
        ])->perfil()->create(["materia_id" => 1]);

        Usuario::create([
            "nombre" => "david",
            "apellido" => "mendez",
            "cedula" => 12254458,
            "correo" => 'david@gmail.com',
            "fecha_de_nacimiento" => "1999-12-10",
            "hash" => "david",
            "role_id" => 1
        ])->perfil()->create([
            "numero_de_matricula" => "usuario1",
            "año_de_ingreso" => 2024,
        ]);

        Periodo::create([
            "año" => 2024,
            "numero_de_periodo" => 1,
            "fecha_de_inicio" => "1999-12-12",
            "fecha_de_cierre" => "2002-12-11"
        ]);

        Nota::create([
            "estudiante_id" => 1,
            "periodo_id" => 1,
            "codigo_materia" => "mat001",
            "valor" => 16
        ]);

    }
}
