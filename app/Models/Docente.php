<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Docente extends Model
{
    protected $table = 'docentes';

    protected $fillable = [
        'usuario_id',
        'materia_id'
    ];

    protected $cast = [

    ];

    public function usuario(){

        return $this->belongsTo(Usuario::class);

    }

    public function horario(){

        return $this->hasMany(Horario::class); 

    }

    public function materia(){
        return $this->BelongsTo(Materia::class);
    }
}
