<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UsuarioController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }


    public function login(Request $request)
    {

        $validator = Validator::make($request->all(), [
            "correo" => "required|email|exists:usuarios,correo",
            "hash" => "required"
        ]);

        if ($validator->fails()){

            return response()->json([
                "mensaje" => "error en la validacion de correo electronico",
                "error" => $validator->errors(),
                "estatus" => 422
            ], 422);

        }

        $usuario = Usuario::with('rol')->where('correo', $request->correo)->first();

        if ($usuario->estado_de_cuenta === 'inactivo'){

            return response()->json([
                "mensaje" => "Su cuenta se encuentra bloqueada. comuniquese con el administrador del sistema",
                "estatus" => 403
            ], 403);

        }

        if (!Hash::check($request->hash, $usuario->hash)){

            $usuario->intentos_de_login_fallidos += 1;

            $usuario->estado_de_cuenta = ($usuario->intentos_de_login_fallidos >= 3) ? 'inactivo' : 'activo';

            $usuario->save();

            return response()->json([
                "mensaje" => "contraseña incorrecta. numero de intentos fallidos: ".$usuario->intentos_de_login_fallidos,
                "estatus" => 403
            ], 403);

        }

        $usuario->intentos_de_login_fallidos = 0; 
        $usuario->save();

        $usuario->tokens()->delete();

        $perfil = $usuario->perfil->id;

        if ($usuario->rol->nombre_rol === "docente"){
            return response()->json([
                "mensaje" => "usuario autenticado con exito",
                "token" => $usuario->createToken('token_de_autenticacion')->plainTextToken,
                "usuario" => [
                    "nombre" => $usuario->nombre,
                    "id" => $usuario->id,
                    "rol" => $usuario->rol->nombre_rol,
                    "id_rol_perfil" => $perfil,
                    "materia" => $usuario->docente->materia->nombre_materia
                ],
                "estatus" => 200
            ], 200);
        }

        return response()->json([
            "mensaje" => "usuario autenticado con exito",
            "token" => $usuario->createToken('token_de_autenticacion')->plainTextToken,
            "usuario" => [
                "nombre" => $usuario->nombre,
                "id" => $usuario->id,
                "rol" => $usuario->rol->nombre_rol,
                "id_rol_perfil" => $perfil
            ],
            "estatus" => 200
        ], 200);

    }


    public function logout(Request $request)
    {
        try {
            $usuario = $request->user();

            $usuario->tokens()->delete();

            return response()->json([
                "mensaje" => "Logout Exitoso",
                "estatus" => 200
            ], 200);

        } catch (\Throwable $th) {
            return response()->json([
                "mensaje" => "error en el cierre de sesion",
                "estatus" => 400
            ], 400);
        }



    }
}
