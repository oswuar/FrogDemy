<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class administrador extends Model
{
    protected $table = 'administradores';

    protected $fillable = [
        "usuario_id"
    ];

    public function usuario(){
        return $this->belongsTo(Usuario::class);
    }
}
