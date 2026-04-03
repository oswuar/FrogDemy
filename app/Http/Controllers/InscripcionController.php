<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\Inscripcion;
use App\Models\Usuario;
use App\Models\Periodo;
use App\Models\Estudiante;
use Illuminate\Http\Request;

class InscripcionController extends Controller
{

    public function index()
    {
        $inscripciones = DB::table('inscripciones')
        ->join('estudiantes', 'inscripciones.estudiante_id', '=', 'estudiantes.id')
        ->join('usuarios', 'estudiantes.usuario_id', '=', 'usuarios.id')
        ->select(
            'inscripciones.id',
            'usuarios.cedula',
            'usuarios.nombre',
            'usuarios.apellido',
            'inscripciones.seccion',
            'inscripciones.fecha_de_inscripcion'
        )
        ->get();

        if ($inscripciones->isEmpty()){

            return response()->json([
                "mensaje" => "no ha sido registrada ninguna inscripcion",
                "estatus" => 200
            ], 200);

        }

        if (!$inscripciones){

            return response()->json([
                "mensaje" => "error al solicitar la lista de iscripciones",
                "estatus" => 500
            ], 500);

        }

        return response()->json([
            "inscripciones" => $inscripciones,
            "estatus" => 200
        ], 200);


    }

    public function crearInscripcion(Request $request)
    {
        $validator = Validator::make($request->all(), [

            'nombre' => 'required',
            'apellido' => 'required',
            'cedula' => 'required|unique:usuarios,cedula',
            'correo' => 'required|email|unique:usuarios,correo',
            "fecha_de_nacimiento" => "required|date_format:Y-m-d|before:31-12-".(date('Y')-17)."after:1-1-1944",
            'hash' => "required|max:255",

            'fecha_de_inscripcion' => "required|date_format:Y-m-d|after:31-12-1969",
            'seccion' => 'required|numeric|between:1,4'
        ]);

        if ($validator->fails()){
            return response()->json([
                "mensaje" => "error en la validacion de datos",
                "error" => $validator->errors(),
                "estatus" => 400
            ], 400);
        }

        try {

            DB::beginTransaction();

            $usuario = Usuario::create([
                "nombre" => $request->nombre,
                'apellido' => $request->apellido,
                'cedula' => $request->cedula,
                'correo' => $request->correo,
                'fecha_de_nacimiento' => $request->fecha_de_nacimiento,
                'role_id' => 1,
                'hash' => $request->hash
            ]);

            $usuario_id = $usuario->id;

            $año_de_ingreso = date('Y', strtotime($request->fecha_de_inscripcion));

            $matricula = $año_de_ingreso."-".$request->cedula;

            $estudiante = Estudiante::create([
                'usuario_id' => $usuario_id,
                'numero_de_matricula' => $matricula,
                'año_de_ingreso' => $año_de_ingreso
            ]);

            $estudiante_id = $estudiante->id;

            $inscripcion = Inscripcion::create([
                'estudiante_id' => $estudiante_id,
                'seccion' => $request->seccion,
                'fecha_de_inscripcion' => $request->fecha_de_inscripcion
            ]);

            DB::commit();

        } catch (\Throwable $th) {

            DB::rollback();

            return response()->json([
                "mensaje" => "ha ocurrido un error en la incripcion del estudiante",
                "error" => $th,
                "estatus" => 500
            ], 500);

        }




        return response()->json([
            "mensaje" => "el estudiante ha sido creado exitosamente",
            "id_inscripcion" => $inscripcion->id,
            "estatus" => 201
        ], 201);

    }



    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [

            'nombre' => 'required',
            'apellido' => 'required',
            'cedula' => 'required|unique:usuarios,cedula',
            'correo' => 'required|email|unique|usuarios,correo',
            'edad_de_usuario' => 'required|numeric',
            'rol' => 'required|exists:roles,nombre_rol',


            'numero_de_matricula => required',
            'año_de_ingreso' => 'required',


            'año' => 'required|numeric|exist:periodos,año',
            'numero_de_periodo' => 'required|exist:periodos,numero_de_periodo',

            'seccion' => 'required|numeric',
            'fecha_de_inscripcion' => 'required'
        ]);

        if ($validator->fails()){
            return response()->json([
                "mensaje" => "error en la validacion de datos",
                "error" => $validator->errors(),
                "estatus" => 400
            ], 400);
        }



    }

    /**
     * Display the specified resource.
     */
    public function show(Inscripcion $inscripcion)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Inscripcion $inscripcion)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Inscripcion $inscripcion)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Inscripcion $inscripcion)
    {
        //
    }
}
