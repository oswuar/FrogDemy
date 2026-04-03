<?php

namespace App\Http\Controllers;

use App\Models\Horario;
use App\Models\Materia;
use App\Models\Usuario;
use App\Models\Periodo;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class HorarioController extends Controller
{

    public function index()
    {
        $horarios = DB::table('horarios')
        ->join('materias', 'horarios.materia_id', '=', 'materias.id')
        ->join('docentes', 'horarios.docente_id', '=', 'docentes.id')
        ->join('usuarios', 'docentes.usuario_id', '=', 'usuarios.id')
        ->join('periodos', 'horarios.periodo_id', '=', 'periodos.id')
        ->select(
            'horarios.id',
            'materias.nombre_materia',
            'usuarios.nombre',
            'usuarios.apellido',
            'periodos.año',
            'horarios.dia',
            'horarios.hora_de_inicio',
            'horarios.hora_de_cierre',
            'horarios.aula'
        )->get();

        if (!$horarios){

            return response()->json([
                "mensaje" => "ningun horario ha sido registrado",
                "estatus" => 200
            ], 200);

        }

        return response()->json([
            "horarios" => $horarios,
            "estatus" => 200
        ], 200);
    }

    public function crearHorario(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'codigo_materia' => "required|exists:materias,codigo_materia",
            'docente_cedula' => "required|exists:usuarios,cedula",
            'periodos_año' => "required|exists:periodos,año",
            'periodos_numero' => "required|exists:periodos,numero_de_periodo",
            'dia' => 'required',
            'hora_de_inicio' => "required",
            'hora_de_cierre' => "required",
            'aula' => "sometimes",
            'seccion' => "required"
        ]);

        if ($validator->fails()){

            return response()->json([
                "mensaje" => "error en la validacion de datos",
                "error" => $validator->errors(),
                "estatus" => 422
            ], 422);

        }

        try{
            $docente = Usuario::with('docente')->where('cedula', $request->docente_cedula)->first();
            $materia = Materia::where('codigo_materia', $request->codigo_materia)->first();
            $periodo = Periodo::where(['año' => $request->periodos_año, 'numero_de_periodo' => $request->periodos_numero])->first();
        }catch(Throwable $th){

            return response()->json([
                "mensaje" => "error en la busqueda de elementos, verifique los datos e intente nuevamente",
                "estatus" => 404
            ], 404);

        }



        $horario = Horario::create([
            'materia_id' => $materia->id,
            'docente_id' => $docente->docente->id,
            'periodo_id' => $periodo->id,
            'dia' => $request->dia,
            'hora_de_inicio' => $request->fecha_de_inicio,
            'hora_de_cierre' => $request->hora_de_cierre,
            'aula' => $request->aula,
            'seccion' => $request->seccion
        ]);

        if (!$horario){

            return response()->json([
                "mensaje" => "error en la creacion de horario",
                "estatus" => 500
            ], 500);

        }

        return response()->json([
            "mensaje" => "horario creado con exito",
            "horario" => $horario,
            "estatus" => 201
        ], 201);

    }


    public function show(Horario $horario)
    {
        //
    }


    public function edit(Horario $horario)
    {
        //
    }


    public function actualizarHorario(Request $request, $id)
    {

        $validator = Validator::make($request->all(), [
            'dia' => 'sometimes',
            'hora_de_inicio' => "sometimes",
            'hora_de_cierre' => "sometimes",
            'aula' => "sometimes",
            'seccion' => "sometimes"
        ]);

        if ($validator->fails()){

            return response()->json([
                "mensaje" => "error en la validacion de datos",
                "error" => $validator->errors(),
                "estatus" => 422
            ], 422);

        }

        $horario = Horario::find($id);

        if (!$horario){
            return response()->json([
                "mensaje" => "horario no encontrado",
                "error" => 404
            ], 404);
        }


        if ($request->has('día')){
            $horario->día = $request->dia;
        }
        if ($request->has('hora_de_inicio')){
            $horario->hora_de_inicio = $request->hora_de_inicio;
        }
        if ($request->has('hora_de_cierre')){
            $horario->hora_de_cierre = $request->hora_de_cierre;
        }

        if ($request->has('aula')){
            $horario->aula = $request->aula;
        }

        if ($request->has('seccion')){
            $horario->seccion = $request->seccion;
        }


        $horario->save();


        if (!$horario){

            return response()->json([
                "mensaje" => "error en la modificacion de horario",
                "estatus" => 500
            ], 500);

        }

        return response()->json([
            "mensaje" => "horario modificado correctamente",
            "estatus" => 200
        ], 200);
    }


    public function eliminarHorario($id)
    {
        $horario = Horario::find($id);

        if (!$horario){

            return response()->json([
                "mensaje" => "horario no encontrado",
                "estatus" => 404
            ], 404);

        }

        $horario->delete();

        return response()->json([
            "mensaje" => "horario eliminado con exito",
            "estatus" => 200
        ], 200);

    }
}
