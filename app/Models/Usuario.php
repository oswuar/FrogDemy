<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    protected $table =  'usuarios';

    protected $fillable = [
        'nombre',
        'apellido',
        'cedula',
        'correo',
        'fecha_de_nacimiento',
        'role_id',
        'estado_de_cuenta',
        'hash',
        'intentos_de_login_fallidos'
    ];

    public function rol(){

        return $this->belongsTo(Roles::class, 'role_id');

    }

    public function estudiante(){

        return $this->hasOne(Estudiante::class, 'usuario_id');

    }

    public function docente(){

        return $this->hasOne(Docente::class, 'usuario_id');

    }

    public function administrativo(){
        return $this->hasOne(Administrador::class, 'usuario_id');
    }


    public function perfil(){

        if (!$this->rol){
            return null;
        }

        switch ($this->rol->nombre_rol) {
            case 'estudiante':
                return $this->estudiante();
                break;


            case 'docente':
                return $this->docente();
                break;

            case 'administrativo':
                return $this->administrativo();


            default:
                return null;
                break;
        }

    }

    public function obtenerIdRelacional(){
        $perfil = $this->perfil;

        $id_perfil = $perfil->id;

        return $id_perfil;
    }

    public function getAuthPassword(){

        return $this->hash;

    }




    /* *
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'hash',
        'remember_token',
    ];

    /*
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
     protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'hash' => 'hashed',
        ];
    }
}
