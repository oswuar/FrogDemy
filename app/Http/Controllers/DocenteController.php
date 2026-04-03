<?php

namespace App\Http\Controllers;

use App\Models\Docente;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DocenteController extends Controller
{

    public function index()
    {
        $docentes = DB::table('usuarios')
        ->join('docentes', 'usuarios.id', '=', 'docentes.usuario_id')
        ->join('materias', 'docentes.materia_id', '=', 'materias.id')
        ->where('usuarios.role_id', 2)
        ->select(
            'usuarios.id',
            'usuarios.nombre',
            'usuarios.apellido',
            'usuarios.cedula',
            'materias.nombre_materia'
        )->where('usuarios.estado_de_cuenta', 'activo')
        ->get();

        if ($docentes->isEmpty()){

            return response()->json([
                "mensaje" => "ningun docente ha sido registrado",
                "estatus" => 200
            ], 200);

        }

        return response()->json(["docentes" => $docentes, "estatus" => 200], 200);
    }



    public function crearDocente(Request $request)
    {
        $validator = Validator::make($request->all(), [
            "nombre" => "required|max:255",
            "apellido" => "required|max:255",
            "cedula" => "required|numeric|digits_between:7,8|unique:usuarios,cedula",
            "correo" => "required|unique:usuarios,correo",
            "fecha_de_nacimiento" => "required|date_format:Y-m-d|before:31-12-".(date('Y')-17)."after:1-1-1944",
            "materia" => "required|exists:materias,nombre_materia",
            "hash" => "required|max:255|password:mixed,numbers,symbols"
        ]);

        if ($validator->fails()){

            $errors = json_encode($validator->errors());

            return response()->json([
                "mensaje" => "error en la validacion de datos",
                "error" => $errors,
                "estatus" => 422
            ], 422);

        }

        $materia = DB::table('materias')->select('id')
        ->where('nombre_materia', $request->materia)
        ->first();

        DB::beginTransaction();

        try {

            $docente = Usuario::create([
                "nombre" => $request->nombre,
                "apellido" => $request->apellido,
                "cedula" => $request->cedula,
                "correo" => $request->correo,
                "fecha_de_nacimiento" => $request->fecha_de_nacimiento,
                "role_id" => 2,
                "hash" => $request->hash
            ]);

            $docente->docente()->create([
                "materia_id" => $materia
            ]);

            DB::commit();

        } catch (\Throwable $th) {

            DB::rollback();

            return response()->json([
                "mensaje" => "error en la creacion de docente",
                "error" => $th,
                "estatus" => 500,
            ], 500);
        }

        return response()->json([
            "mensaje" => "docente creado con exito",
            "estatus" => 201
        ], 201);

    }



    public function actualizarDocente(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [

            "nombre" => "required|max:255",
            "apellido" => "required|max:255",
            "cedula" => "required|numeric|digits_between:7,8|unique:usuarios,cedula",
            "correo" => "required|unique:usuarios,correo",
            "fecha_de_nacimiento" => "required|date_format:Y-m-d|before:31-12-".(date('Y')-17)."after:1-1-1944",
            "materia" => "required|exists:materias,nombre_materia",

        ]);

        if ($validator->fails()){

            return response()->json([
                "mensaje" => "error en la validacion de datos",
                "error" => $validator->errors()
            ]);

        }

        $docente = Usuario::with('docente')->find($id);

        if (!$docente){

            return response()->json([
                "mensaje" => "docente no encontrado",
                "estatus" => 404
            ], 404);

        }

        DB::beginTransaction();

        try {
            
            $docente->nombre = ($request->has('nombre')) ? $request->nombre : $docente->nombre;

            if ($request->has('apellido')){
                $docente->apellido = $request->apellido;
            }

            if ($request->has('correo')){
                $docente->correo = $request->correo;
            }
            if ($request->has('edad_de_usuario')){
                $docente->edad_de_usuario = $request->edad_de_usuario;
            }

            $docente->save();
            $docente->docente->save();

            DB::commit();

        } catch (\Throwable $th) {

            DB::rollBack();

            return response()->json([
                "mensaje" => "error al actualizar el docente",
                "estatus" => 500
            ], 500);

        }

        return response()->json([
            "mensaje" => "docente modificado exitosamente",
            "nombre" => $docente->nombre,
            "estatus" => 200
        ], 200);

    }


    public function eliminarDocente($id)
    {
        $docente = DB::table('usuarios')->select()->where('id', $id);

        if (!$docente){

            return response()->json([
                "mensaje" => "docente no encontrado",
                "estatus" => 404
            ], 404);

        }

        $docente->update(['estado_de_cuenta' => 'inactivo']);

        if (!$docente){

            return response()->json([
                "mensaje" => "error en la inhabilitacion de docente",
                "estatus" => 500
            ], 500);

        }

        return response()->json([
            "mensaje" => "docente inhabilitado con exito",
            "docente" => $docente,
            "estatus" => 200
        ], 200);

    }
}
