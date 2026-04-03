<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Nota extends Model
{
    protected $table = 'notas';

    protected $fillable = [
        'estudiante_id',
        'periodo_id',
        'codigo_materia',
        'valor'
    ];

    public function estudiante(){

        return $this->belongsTo(Estudiante::class);

    }

    public function materia(){

        return $this->belongsTo(Materia::class, 'codigo_materia', 'codigo_materia');

    }

    public function nota_historica(){

        return $this->hasOne(Notas_Historicas::class);

    }

    public function periodo(){

        return $this->belongsTo(Periodo::Class);


    }
}
