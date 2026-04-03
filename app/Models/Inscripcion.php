<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inscripcion extends Model
{
    protected $table = 'inscripciones';

    protected $fillable = [
        'estudiante_id',
        'seccion',
        'fecha_de_inscripcion'
    ];

    public function estudiante(){

        return $this->belongsTo(Estudiante::class);

    }

    
}
