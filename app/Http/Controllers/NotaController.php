<?php

namespace App\Http\Controllers;

use App\Models\Nota;
use App\Models\Periodo;
use App\Models\Materia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

        $notas = DB::table('notas')
        ->join('estudiantes', 'notas.estudiante_id', '=', 'estudiantes.id')
        ->join('usuarios', 'estudiantes.usuario_id', '=', 'usuarios.id')
        ->join('periodos', 'notas.periodo_id', '=', 'periodos.id')
        ->join('materias', 'notas.codigo_materia', '=', 'materias.codigo_materia')
        ->select(
            'usuarios.cedula',
            'estudiantes.numero_de_matricula',
            'periodos.año',
            'periodos.numero_de_periodo',
            'materias.codigo_materia',
            'materias.nombre_materia',
            'notas.valor'
        )
        ->get();

        if (!$notas){
            return response()->json([
                "mensaje" => "error en la busqueda de notas",
                "estatus" => 500
            ], 500);
        }

        return response()->json([
            "notas" => $notas,
            "estatus" => 200
        ], 200);

    }

    public function mostrarNotasFinales(Request $request)
    {

        $validator = Validator::make($request->all(), [
            "cedula" => "required|exists:usuarios,cedula",
            "año" => "required|numeric|exists:periodos,año"
        ]);

        if ($validator->fails()){

            return response()->json([
                "mensaje" => "error en la validacion de datos",
                "estatus" => 422
            ], 422);

        }

        $nota = DB::table('notas')
        ->join('estudiantes', 'notas.estudiante_id', '=', 'estudiantes.id')
        ->join('usuarios', 'estudiantes.usuario_id', '=', 'usuarios.id')
        ->join('periodos', 'notas.periodo_id', '=', 'periodos.id')
        ->join('materias', 'notas.codigo_materia', '=', 'materias.codigo_materia')
        ->select(
            'usuarios.cedula',
            'usuarios.nombre',
            'usuarios.apellido',
            'materias.codigo_materia',
            'materias.nombre_materia',
            DB::raw('AVG(notas.valor) as nota')
        )->where(['usuarios.cedula' => $request->cedula, 'periodos.año' => $request->año])
        ->groupBy(
            'usuarios.cedula',
            'usuarios.nombre',
            'usuarios.apellido',
            'materias.nombre_materia',
            'materias.codigo_materia',
        )
        ->get();

        if ($nota->isEmpty()){

            return response()->json([
                'mensaje' => "Nota no encontrada.",
                "estatus" => 404
            ], 404);

        }

        return response()->json([
            "nota" => $nota,
            "estatus" => 200
        ], 200);

    }


    public function cargarNota(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'cedula' => 'required|exists:usuarios,cedula',
            'periodo_año' => 'required|exists:periodos,año',
            'periodo_numero' => 'required|exists:periodos,numero_de_periodo',
            'materia' => 'required|exists:materias,nombre_materia',
            'valor' => 'required|numeric|between:1,20'
        ]);

        if ($validator->fails()){

            $errors = $validator->errors();

            return response()->json([
                "mensaje" => "error en la validacion de datos",
                "error" => $errors,
                "estatus" => 422
            ], 422);

        }

        DB::beginTransaction();

        try {
            $obtenerIdEstudiante = DB::table('usuarios')
            ->join('estudiantes', 'usuarios.id', '=', 'estudiantes.usuario_id')
            ->where(['usuarios.cedula' => $request->cedula, 'usuarios.role_id' => 1])
            ->select(
                'estudiantes.id'
            )->first();

            $obtenerPeriodo = Periodo::where(['año' => $request->periodo_año, 'numero_de_periodo' => $request->periodo_numero])->select('periodos.id')->first();

            $obtenerMateria = Materia::where('nombre_materia', $request->materia)->select('materias.codigo_materia')->first();

            $nota = Nota::create([
                'estudiante_id' => $obtenerIdEstudiante->id,
                'periodo_id' => $obtenerPeriodo->id,
                'codigo_materia' => $obtenerMateria->codigo_materia,
                'valor' => $request->valor
            ]);

            DB::commit();

        } catch (\Throwable $th) {
            DB::rollback();
            return response()->json([
                "mensaje" => "error en la creacion de nota",
                "error" => $th,
                "estatus" => 500
            ], 500);
        }

        return response()->json([
            "mensaje" => "nota creada exitosamente",
            "nota" => $nota,
            "estatus" => 201
        ], 201);

    }




    public function mostrarNotaEstudiante(Request $request, $id)
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
            )->where(['notas.estudiante_id' => $id, 'materias.nombre_materia' => $request->materia])
        ->get();

        if ($nota->isEmpty()){
            return response()->json([
                "mensaje" => "El Estudiante no posee notas registradas en ".$request->materia,
                "estatus" => 404
            ], 404);
        }

        return response()->json([
            "notas" => $nota,
            "estatus" => 200
        ], 200);

    }


    public function actualizarNota(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'cedula' => 'sometimes|numeric',
            'periodo_año' => 'sometimes|numeric|exists:periodos,año',
            'periodo_numero' => 'sometimes|numeric|exists:periodos,numero_periodo',
            'materia' => 'sometimes|exists:materias,nombre_materia',
            'valor' => 'sometimes|numeric|between:1,20'
        ]);

        if ($validator->fails()){

            $errors = $validator->errors();

            return response()->json([
                "mensaje" => "error en la validacion de datos",
                "error" => $errors,
                "estatus" => 422
            ], 422);

        }

        $nota = Nota::with(["estudiante", "periodo", "materia"])->find($id);

        if (!$nota){

            return response()->json([
                "mensaje" => "nota no encontrada",
                "estatus" => 404
            ], 404);

        }

        DB::beginTransaction();

        try {

            $nota->valor = $request->valor ?? $nota->valor;

            $nota->save();

            DB::commit();

        } catch (\Throwable $th) {
            DB::rollback();
            return response()->json([
                "mensaje" => "error en la modificacion de nota",
                "error" => $th,
                "estatus" => 500
            ], 500);
        }

        return response()->json([
            "mensaje" => "nota modificada con exito",
            "estatus" => 200
        ], 200);

    }

    public function destroy($id)
    {
        $nota = Nota::find($id);

        if (!$nota){

            return response()->json([
                "mensaje" => "nota no encontrada",
                "estatus" => 404
            ], 404);

        }

        $nota->delete();

        return response()->json([
            "mensaje" => "nota eliminada con exito",
            "estatus" => 200
        ], 200);

    }
}
