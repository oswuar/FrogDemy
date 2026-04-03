<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Horario extends Model
{
    protected $table = 'horarios';

    protected $fillable = [
        'materia_id',
        'docente_id',
        'periodo_id',
        'dia',
        'hora_de_inicio',
        'hora_de_cierre',
        'aula',
        'seccion'
    ];

    public function materia(){

        return $this->belongsTo(Materia::class);

    }

    public function docente(){

        return $this->belongsTo(Docente::class);

    }

    public function periodo(){

        return $this->belongsTo(Periodo::class);

    }
}
