<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Materia extends Model
{
    protected $table = 'materias';

    protected $fillable = [
        'codigo_materia',
        'nombre_materia',
        'descripcion'
    ];

    public function nota(){

        return $this->hasMany(Nota::class);

    }

    public function horario(){

        return $this->hasOne(Horario::class);

    }

    public function docente(){

        return $this->hasMany(Docente::class);

    }
}
