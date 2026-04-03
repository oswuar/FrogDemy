<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

Route::get('/', function () {
    return response(File::get(public_path('Sistema/index.html')), 200, ['Content-Type' => 'text/html']);
});

Route::get('/login', function () {
    return response(File::get(public_path('Sistema/login.html')), 200, ['Content-Type' => 'text/html']);
});

Route::get('/admin', function () {
    return response(File::get(public_path('Sistema/admin.html')), 200, ['Content-Type' => 'text/html']);
});

Route::get('/docente', function () {
    return response(File::get(public_path('Sistema/docente.html')), 200, ['Content-Type' => 'text/html']);
});

Route::get('/estudiante', function () {
    return response(File::get(public_path('Sistema/estudiante.html')), 200, ['Content-Type' => 'text/html']);
});
