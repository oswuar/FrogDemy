<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Roles extends Model
{
    protected $table = 'roles';

    protected $fillable = [
        'nombre_rol'
    ];

    public function usuario(){

        return $this->hasMany(Usuario::class);

    }
}
