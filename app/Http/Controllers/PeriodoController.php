<?php

namespace App\Http\Controllers;

use App\Models\Periodo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PeriodoController extends Controller
{

    public function listarPeriodos()
    {
        $periodos = DB::table('periodos')
        ->select('id', 'año', 'numero_de_periodo', 'fecha_de_inicio', 'fecha_de_cierre')
        ->get();

        if ($periodos->isEmpty()){
            return response()->json([
                "mensaje" => "ningun periodo ha sido registrado",
                "estatus" => 200
            ], 200);
        }

        return response()->json([
            "periodos" => $periodos,
            "estatus" => 200
        ], 200);
    }


    public function crearPeriodo(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'año' => "required|numeric|min:1970|max:".date('Y'),
            'numero_de_periodo' => "required|between:1,2",
            'fecha_de_inicio' => "required|date_format:Y-m-d|after:31-12-".($request->año-1)."|before:fecha_de_cierre|before:1-1-".($request->año+1),
            'fecha_de_cierre' => "required|date_format:Y-m-d|after:fecha_de_inicio|before:1-1-".($request->año+1)."|after:31-12-".($request->año-1)
        ]);

        if ($validator->fails()){

            return response()->json([
                "mensaje" => "error en la validacion de datos",
                "error" => $validator->errors(),
                "estatus" => 422
            ], 422);

        }

        $existe = Periodo::where('año', $request->año)->where('numero_de_periodo', $request->numero_de_periodo)->exists();

        if ($existe){
            return response()->json([
                "mensaje" => "ya existe un periodo ".$request->numero_de_periodo." para este ".$request->año,
                "estatus" => 422
            ], 422);
        }

        if ($request->numero_de_periodo == 2){
            $periodo_1 = Periodo::where(['año' => $request->año, 'numero_de_periodo' => 1])->first();
            if (!$periodo_1){
                return response()->json([
                    "numero_de_periodo" => "Periodo #1 no existe. El campo Numero De Periodo no puede ser 2",
                    "estatus" => 422
                ], 422);
            }
        }

        $periodo = Periodo::create([
            'año' => $request->año,
            'numero_de_periodo' => $request->numero_de_periodo,
            'fecha_de_inicio' => $request->fecha_de_inicio,
            'fecha_de_cierre' => $request->fecha_de_cierre,
        ]);

        if (!$periodo){

            return response()->json([
                "mensaje" => "error en la creacion de periodo",
                "estatus" => 500
            ], 500);

        }

        return response()->json([
            "mensaje" => "periodo creado exitosamente",
            "estatus" => 201
        ], 201);

    }


    public function actualizarPeriodo(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'año' => "sometimes|numeric|min:1970|max:".date('Y'),
            'numero_de_periodo' => "sometimes|between:1,2",
            'fecha_de_inicio' => "sometimes|date_format:Y-m-d|after:31-12-".($request->año-1)."|before:fecha_de_cierre|before:1-1-".($request->año+1),
            'fecha_de_cierre' => "sometimes|date_format:Y-m-d|after:fecha_de_inicio|before:1-1-".($request->año+1)."|after:31-12-".($request->año-1)
        ]);

        if ($validator->fails()){

            return response()->json([
                "error" => $validator->errors(),
                "estatus" => 422
            ], 422);

        }

        $periodo = Periodo::find($id);

        if (!$periodo){

            return response()->json([
                "mensaje" => "periodo no encontrado",
                "estatus" => 404
            ], 404);

        }

        if ($request->has('año')){
            $periodo->año = $request->año;
        }
        if ($request->has('numero_de_periodo')){
            $periodo->numero_de_periodo = $request->numero_de_periodo;
        }
        if ($request->has('fecha_de_inicio')){
            $periodo->fecha_de_inicio = $request->fecha_de_inicio;
        }
        if ($request->has('fecha_de_cierre')){
            $periodo->fecha_de_cierre = $request->fecha_de_cierre;
        }

        $periodo->save();

        if (!$periodo){

            return response()->json([
                "mensaje" => "error en la modificacion de periodo",
                "estatus" => 500
            ], 500);

        }

        return response()->json([
            "mensaje" => "periodo modificado exitosamente",
            "estatus" => 200
        ], 200);

    }


    public function eliminarPeriodo($id)
    {
        $periodo = Periodo::find($id);

        if (!$periodo){

            return response()->json([
                "mensaje" => "periodo no encontrado",
                "estatus" => 404
            ], 404);

        }

        DB::beginTransaction();
        try {

            $periodo->delete();

            DB::commit();

            return response()->json([
                "mensaje" => "Periodo Eliminado Exitosamente",
                "estatus" => 200
            ], 200);

        } catch (\Throwable $th) {

            DB::rollback();

            return response()->json([
                "mensaje" => "El Periodo ".$periodo->año."-".$periodo->numero_de_periodo." no puede ser eliminado porque contiene notas registradas.",
                "error" => $th,
                "estatus" => 500
            ], 500);
        }

    }
}
