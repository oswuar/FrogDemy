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

    public function run(): void
    {
        // Create roles if they don't exist
        Roles::firstOrCreate(['nombre_rol' => 'estudiante']);
        Roles::firstOrCreate(['nombre_rol' => 'docente']);
        Roles::firstOrCreate(['nombre_rol' => 'administrativo']);

        // Create materia if it doesn't exist
        Materia::firstOrCreate(
            ['codigo_materia' => 'mat001'],
            ['nombre_materia' => 'GHC']
        );

        // Create test users if they don't exist
        if (!Usuario::where('correo', 'cesar@gmail.com')->exists()) {
            Usuario::create([
                "nombre" => "cesar",
                "apellido" => "clemente",
                "cedula" => 24445552,
                "correo" => 'cesar@gmail.com',
                "fecha_de_nacimiento" => "1992-12-10",
                "hash" => "cesar",
                "role_id" => 3
            ])->perfil()->create();
        }

        if (!Usuario::where('correo', 'luis@gmail.com')->exists()) {
            Usuario::create([
                "nombre" => "luis",
                "apellido" => "chacon",
                "cedula" => 12225488,
                "correo" => 'luis@gmail.com',
                "fecha_de_nacimiento" => "1950-12-10",
                "hash" => "luis",
                "role_id" => 2
            ])->perfil()->create(["materia_id" => 1]);
        }

        if (!Usuario::where('correo', 'david@gmail.com')->exists()) {
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
        }

        // Create periodo if it doesn't exist
        Periodo::firstOrCreate(
            ['año' => 2024, 'numero_de_periodo' => 1],
            [
                "fecha_de_inicio" => "1999-12-12",
                "fecha_de_cierre" => "2002-12-11"
            ]
        );

        // Create nota if it doesn't exist
        if (!Nota::where('estudiante_id', 1)->where('periodo_id', 1)->exists()) {
            Nota::create([
                "estudiante_id" => 1,
                "periodo_id" => 1,
                "codigo_materia" => "mat001",
                "valor" => 16
            ]);
        }
    }
}
