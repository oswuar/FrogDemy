<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class verificarAutenticacion
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {

        $usuario = $request->user();

        if (!$usuario){

            return response()->json([
                "mensaje" => "usuario no autenticado",
                "usuario" => $usuario,
                "estatus" => 401
            ], 401);

        }

        if (!$usuario->relationLoaded('rol')){
            $usuario->load('rol');
        }


        if (!in_array($usuario->rol->nombre_rol, $roles)){

            return response()->json([
                "mensaje" => "usuario no autorizado",
                "rol_requerido" => $roles,
                "rol_actual" => $usuario->rol,
                "estatus" => 401
            ], 401);

        }


        return $next($request);
    }
}
