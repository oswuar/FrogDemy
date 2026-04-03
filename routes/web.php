<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

Route::get('/', function () {
    return File::get(public_path('Sistema/index.html'));
})->header('Content-Type', 'text/html');

Route::get('/login', function () {
    return File::get(public_path('Sistema/login.html'));
})->header('Content-Type', 'text/html');

Route::get('/admin', function () {
    return File::get(public_path('Sistema/admin.html'));
})->header('Content-Type', 'text/html');

Route::get('/docente', function () {
    return File::get(public_path('Sistema/docente.html'));
})->header('Content-Type', 'text/html');

Route::get('/estudiante', function () {
    return File::get(public_path('Sistema/estudiante.html'));
})->header('Content-Type', 'text/html');
