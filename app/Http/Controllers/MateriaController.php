<?php

namespace App\Http\Controllers;

use App\Models\Materia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MateriaController extends Controller
{

    public function index()
    {
        $materias = Materia::all();

        if ($materias->isEmpty()){

            return response()->json([
                "mensaje" => "ninguna materia ha sido registrada",
                "estatus" => 200
            ], 200);

        }

        return response()->json([
            "materias" => $materias,
            "estatus" => 200
        ], 200);

    }


    public function crearMateria(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'codigo_materia' => "required|max:255|unique:materias,codigo_materia",
            'nombre_materia' => "required|max:50",
            'descripcion' => "required|max:255"
        ]);

        if ($validator->fails()){

            return response()->json([
                "mensaje" => "error en la validacion de datos",
                "error" => $validator->errors(),
                "estatus" => 422
            ], 422);

        }

        $materia = Materia::create([
            'codigo_materia' => $request->codigo_materia,
            'nombre_materia' => $request->nombre_materia,
            'descripcion' => $request->descripcion
        ]);

        if (!$materia){

            return response()->json([
                "mensaje" => "error en la creacion de materia",
                "estatus" => 500
            ], 500);

        }

        return response()->json([
            "mensaje" => "materia creada con exito",
            "estatus" => 201
        ], 201);


    }


    public function actualizarMateria(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'codigo_materia' => "sometimes",
            'nombre_materia' => "sometimes",
            'descripcion' => "sometimes"
        ]);

        if ($validator->fails()){

            return response()->json([
                "mensaje" => "error en la validacion de datos",
                "error" => $validator->errors(),
                "estatus" => 422
            ], 422);

        }

        $materia = Materia::find($id);

        if (!$materia){

            return response()->json([
                "mensaje" => "materia no encontrada",
                "estatus" => 404
            ], 404);

        }

        if ($request->has('codigo_materia')){

            $materia->codigo_materia = $request->codigo_materia;

        }
        if ($request->has('nombre_materia')){

            $materia->nombre_materia = $request->nombre_materia;

        }
        if ($request->has('descripcion')){

            $materia->descripcion = $request->descripcion;

        }

        $materia->save();

        if (!$materia){

            return response()->json([
                "mensaje" => "error en la modificacion de materia",
                "estatus" => 500
            ], 500);

        }

        return response()->json([
            "mensaje" => "materia actualizada exitosamente",
            "estatus" => 200
        ], 200);

    }


    public function eliminarMateria($id)
    {
        $materia = Materia::find($id);

        if (!$materia){

            return response()->json([
                "mensaje" => "materia no encontrada",
                "estatus" => 404
            ], 404);

        }

        $materia->delete();

        return response()->json([
            "mensaje" => "materia eliminada exitosamente",
            "estatus" => 200
        ], 200);
    }
}
