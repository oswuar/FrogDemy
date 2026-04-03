<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'token.auth' => \App\Http\Middleware\TokenAuth::class,
            'rol' => \App\Http\Middleware\verificarAutenticacion::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {

        $exceptions->render(function (AuthenticationException $e, Request $request){
            if($request->is('api/*')){
                return response()->json([
                    "mensaje" => "usuario no autenticado",
                    "estatus" => 401
                ], 401);
            }
            
        });
    })->create();
