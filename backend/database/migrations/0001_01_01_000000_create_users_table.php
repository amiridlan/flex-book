<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // String ids: ULIDs for new rows, readable ids for demo fixtures (e.g. usr_member).
        Schema::create('users', function (Blueprint $table) {
            $table->string('id', 40)->primary();
            $table->string('name', 120);
            $table->string('email', 191)->unique();
            $table->string('phone', 32)->nullable();
            $table->string('password');
            $table->string('role', 16)->default('member');
            $table->unsignedTinyInteger('no_show_strikes')->default(0);
            $table->timestamp('email_verified_at', 3)->nullable();
            $table->rememberToken();
            $table->timestamps(3);
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('user_id', 40)->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
