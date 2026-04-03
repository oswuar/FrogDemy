<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Estudiante extends Model
{
    protected $table = 'estudiantes';

    protected $fillable = [
        'usuario_id',
        'numero_de_matricula',
        'año_de_ingreso',
        'estado_academico'
    ];

    public function usuario(){

        return $this->belongsTo(Usuario::class);

    }

    public function inscripcion(){

        return $this->hasOne(Inscripcion::class);

    }

    public function nota(){

        return $this->hasMany(Nota::class);

    }
}
