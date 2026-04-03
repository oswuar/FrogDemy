<?php

namespace App\Http\Controllers;

use App\Models\Estudiante;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;


class EstudianteController extends Controller
{

    public function index()
    {

        $estudiantes = DB::table('usuarios')
            ->join('estudiantes', 'usuarios.id', '=', 'estudiantes.usuario_id')
            ->where('usuarios.role_id', 1)
            ->select(
                'usuarios.id',
                'usuarios.cedula',
                'usuarios.nombre',
                'usuarios.apellido',
                'estudiantes.id',
                'estudiantes.numero_de_matricula',
                'estudiantes.año_de_ingreso',
            )->where('usuarios.estado_de_cuenta', 'activo')
            ->get();


        if ($estudiantes->isEmpty()) {

            return response()->json([
                "mensaje" => "ningun estudiante ha sido registrado",
                "estatus" => 200
            ], 200);
        }

        return response()->json(["estudiantes" => $estudiantes, "estatus" => 200], 200);
    }

    public function visualizarNotas($id)
    {

        $nota = DB::table('notas')
            ->join('periodos', 'notas.periodo_id', '=', 'periodos.id')
            ->join('materias', 'notas.codigo_materia', '=', 'materias.codigo_materia')
            ->select(
                'notas.id',
                'materias.nombre_materia',
                'materias.codigo_materia',
                'periodos.año',
                'periodos.numero_de_periodo',
                'notas.valor'
            )->where('notas.estudiante_id', $id)
            ->get();



        if ($nota->isEmpty()) {

            return response()->json([
                'mensaje' => "El Estudiante No Posee Notas Registradas en el Sistema.",
                "estatus" => 404
            ], 404);
        }

        return response()->json([
            "notas" => $nota,
            "estatus" => 200
        ], 200);
    }



    public function actualizarEstudiante(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|max:50',
            'apellido' => 'sometimes|max:50',
            'cedula' => 'sometimes|unique:usuarios,cedula',
            'correo' => 'sometimes|email|unique:usuarios,correo',
            'edad_de_usuario' => 'sometimes|numeric|between:10,65',

            'numero_de_matricula' => 'sometimes',
            'año_de_ingreso' => 'sometimes',
        ]);

        if ($validator->fails()) {

            return response()->json([
                "mensaje" => "error en la validacion de datos",
                "error" => $validator->errors(),
                "estatus" => 422
            ], 422);
        }

        $estudiante = Usuario::find($id)->estudiante;

        if (!$estudiante) {

            return response()->json([
                "mensaje" => "estudiante no encontrado",
                "estatus" => 404
            ], 404);
        }

        if ($request->has('nombre')) {
            $estudiante->nombre = $request->nombre;
        }
        if ($request->has('apellido')) {
            $estudiante->apellido = $request->apellido;
        }
        if ($request->has('cedula')) {
            $estudiante->cedula = $request->cedula;
        }
        if ($request->has('correo')) {
            $estudiante->correo = $request->correo;
        }
        if ($request->has('edad_de_usuario')) {
            $estudiante->edad_de_usuario = $request->edad_de_usuario;
        }
        if ($request->has('numero_de_matricula')) {
            $estudiante->estudiante->numero_de_matricula = $request->numero_de_matricula;
        }
        if ($request->has('año_de_ingreso')) {
            $estudiante->estudiante->año_de_ingreso = $request->año_de_ingreso;
        }

        $estudiante->usuario->save();
        $estudiante->save();

        if (!$estudiante) {

            return response()->json([
                "mensaje" => "error en la modificacion de estudiante",
                "estatus" => 500
            ], 500);
        }

        return response()->json([
            "mensaje" => "usuario modificado con exito",
            "estatus" => 200
        ], 200);
    }


    public function eliminarEstudiante($id)
    {
        $estudiante = Estudiante::with('usuario')->find($id);

        if (!$estudiante) {

            return response()->json([
                "mensaje" => "estudiante no encontrado",
                "estatus" => 404
            ], 404);
            
        }

        $estudiante->usuario->estado_de_cuenta = 'inactivo';

        $estudiante->usuario->save();

        if (!$estudiante) {

            return response()->json([
                "mensaje" => "error en la eliminacion de estudiante",
                "estatus" => 500
            ], 500);
        }

        return response()->json([
            "mensaje" => "estudiante inhabilitado correctamente",
            "estado de estudiante" => $estudiante->usuario->estado_de_cuenta,
            "estatus" => 200
        ], 200);
    }
}
