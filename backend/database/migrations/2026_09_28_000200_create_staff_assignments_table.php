<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A staff member's scope. location_id NULL = every location of the brand.
        Schema::create('staff_assignments', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 40);
            $table->string('brand_id', 32)->index();
            $table->string('location_id', 40)->nullable();
            $table->timestamp('created_at', 3)->useCurrent();

            $table->unique(['user_id', 'brand_id', 'location_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('brand_id')->references('id')->on('brands');
            $table->foreign('location_id')->references('id')->on('locations')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_assignments');
    }
};
