<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('horarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('materia_id')->constrained();
            $table->foreignId('docente_id')->constrained();
            $table->foreignId('periodo_id')->constrained();
            $table->string('dia');
            $table->time('hora_de_inicio');
            $table->time('hora_de_cierre');
            $table->text('aula')->nullable();
            $table->integer('seccion');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('horarios');
    }
};
