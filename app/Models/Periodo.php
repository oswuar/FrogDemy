<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Periodo extends Model
{
    protected $table = 'periodos';

    protected $fillable = [
        'año',
        'numero_de_periodo',
        'fecha_de_inicio',
        'fecha_de_cierre',
    ];

    public function notas(){

        return $this->hasMany(Notas::class);

    }

    public function horario(){

        return $this->hasMany(Horario::class);

    }
}
