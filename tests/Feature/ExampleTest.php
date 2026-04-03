<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Usuario;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        
        $usuario = Usuario::create([
            "nombre" => "pedro",
            "apellido" => "sanchez",
            "cedula" => "32496348",
            "correo" => "pedro@gmail.com",
            "edad_de_usuario" => 48,
            "hash" => "pedro",
        ]);

        return;
        
    }
}
