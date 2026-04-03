<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\InscripcionController;
use App\Http\Controllers\HorarioController;
use App\Http\Controllers\MateriaController;
use App\Http\Controllers\PeriodoController;
use App\Http\Controllers\EstudianteController;
use App\Http\Controllers\DocenteController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\NotaController;

Route::get('/usuario', function (Request $request) {
    return response()
    ->json([
        "usuario" => $request->user()
    ], 200);
})->middleware('auth:sanctum');




Route::post('/login', [UsuarioController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/logout', [UsuarioController::class, 'logout']);

    Route::middleware('rol:estudiante,docente,administrativo')->group(function (){
        Route::get('/estudiante/{id}', [EstudianteController::class, 'visualizarNotas']);
        Route::get('/horario', [HorarioController::class, 'index']);
        Route::get('/materia', [MateriaController::class, 'index']);
    });


    Route::middleware('rol:docente,administrativo')->group(function (){

        Route::post('/estudiante-materia/{id}', [NotaController::class, 'mostrarNotaEstudiante']);

        Route::get('/estudiante', [EstudianteController::class, 'index']);
        

        Route::post('/nota', [NotaController::class, 'cargarNota']);

        Route::put('/nota/{id}', [NotaController::class, 'actualizarNota']);
        Route::delete('/nota/{id}', [NotaController::class, 'destroy']);


    });


    Route::middleware('rol:administrativo')->group(function (){

        Route::post('/materia', [MateriaController::class, 'crearMateria']);
        Route::put('/materia/{id}', [MateriaController::class, 'actualizarMateria']);
        Route::delete('/materia/{id}', [MateriaController::class, 'eliminarMateria']);
        Route::get('/periodo', [PeriodoController::class, 'listarPeriodos']);
        Route::post('/periodo', [PeriodoController::class, 'crearPeriodo']);
        Route::put('/periodo/{id}', [PeriodoController::class, 'actualizarPeriodo']);
        Route::delete('/periodo/{id}', [PeriodoController::class, 'eliminarPeriodo']);
        Route::get('/nota', [NotaController::class, 'index']);
        Route::post('/nota/final', [NotaController::class, 'mostrarNotasFinales']);
        Route::get('/inscripcion', [InscripcionController::class, 'index']);
        Route::post('/horario', [HorarioController::class, 'crearHorario']);
        Route::put('/horario/{id}', [HorarioController::class, 'actualizarHorario']);
        Route::delete('horario/{id}', [HorarioController::class, 'eliminarHorario']);
        Route::post('/inscripcion', [InscripcionController::class, 'crearInscripcion']);
        Route::put('/estudiante/{id}', [EstudianteController::class, 'actualizarEstudiante']);
        Route::delete('estudiante/{id}', [EstudianteController::class, 'eliminarEstudiante']);
        Route::get('/docente', [DocenteController::class, 'index']);
        Route::post('/docente', [DocenteController::class, 'crearDocente']);
        Route::put('/docente/{id}', [DocenteController::class, 'actualizarDocente']);
        Route::delete('docente/{id}', [DocenteController::class, 'eliminarDocente']);

    });


});







