<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // All instants in UTC. Money in minor units. See database/schema.sql for rationale.
        Schema::create('bookings', function (Blueprint $table) {
            $table->string('id', 40)->primary();
            $table->char('code', 8)->unique();                 // FXB-7QLM
            $table->string('space_id', 40);
            $table->string('location_id', 40);                 // denormalised for the staff board
            $table->string('user_id', 40)->nullable();         // null for walk-in guests
            $table->string('guest_name', 120)->nullable();
            $table->string('guest_email', 191)->nullable();
            $table->string('status', 12)->default('confirmed');
            $table->dateTime('starts_at', 3);
            $table->dateTime('ends_at', 3);
            $table->unsignedBigInteger('subtotal_minor');
            $table->unsignedBigInteger('tax_minor');
            $table->unsignedBigInteger('total_minor');
            $table->char('currency', 3);
            $table->string('tax_label', 16)->nullable();
            $table->unsignedSmallInteger('tax_rate_bp');
            $table->decimal('booked_lat', 9, 6)->nullable();
            $table->decimal('booked_lng', 9, 6)->nullable();
            $table->decimal('booked_distance_km', 8, 2)->nullable();
            $table->boolean('booked_mocked_gps')->default(false);
            $table->dateTime('checked_in_at', 3)->nullable();
            $table->string('checked_in_by', 40)->nullable();
            $table->string('check_in_method', 8)->nullable();
            $table->dateTime('cancelled_at', 3)->nullable();
            $table->timestamps(3);

            $table->index(['space_id', 'starts_at', 'ends_at']); // overlap checks
            $table->index(['location_id', 'starts_at']);         // staff board
            $table->index(['user_id', 'starts_at']);             // my bookings
            $table->index(['status', 'starts_at']);              // no-show sweeper
            $table->foreign('space_id')->references('id')->on('spaces');
            $table->foreign('location_id')->references('id')->on('locations');
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
