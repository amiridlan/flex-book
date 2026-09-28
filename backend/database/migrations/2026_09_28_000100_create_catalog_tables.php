<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Brands, markets, locations and spaces. See database/schema.sql for the annotated design. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('brands', function (Blueprint $table) {
            $table->string('id', 32)->primary();
            $table->string('name', 120);
            $table->string('tagline')->default('');
            $table->char('theme_primary', 7);
            $table->char('theme_on_primary', 7);
            $table->char('theme_primary_soft', 7);
            $table->timestamps(3);
        });

        Schema::create('countries', function (Blueprint $table) {
            $table->char('code', 2)->primary();
            $table->string('name', 80);
            $table->char('currency', 3);
            $table->unsignedTinyInteger('currency_exponent');
            $table->string('tax_label', 16)->nullable();
            $table->unsignedSmallInteger('tax_rate_bp')->default(0);
        });

        Schema::create('locations', function (Blueprint $table) {
            $table->string('id', 40)->primary();
            $table->string('brand_id', 32);
            $table->char('country_code', 2);
            $table->string('city', 80);
            $table->string('name', 120);
            $table->string('address');
            $table->decimal('lat', 9, 6);
            $table->decimal('lng', 9, 6);
            $table->string('timezone', 64); // IANA, e.g. Australia/Sydney
            $table->decimal('same_day_radius_km', 6, 2)->default(30);
            $table->unsignedSmallInteger('check_in_radius_m')->default(200);
            $table->boolean('is_active')->default(true);
            $table->timestamps(3);

            $table->index(['country_code', 'brand_id']);
            $table->foreign('brand_id')->references('id')->on('brands');
            $table->foreign('country_code')->references('code')->on('countries');
        });

        Schema::create('location_opening_hours', function (Blueprint $table) {
            $table->id();
            $table->string('location_id', 40);
            $table->unsignedTinyInteger('weekday'); // 0 = Monday … 6 = Sunday
            $table->time('opens');
            $table->time('closes');

            $table->unique(['location_id', 'weekday']);
            $table->foreign('location_id')->references('id')->on('locations')->cascadeOnDelete();
        });

        Schema::create('location_amenities', function (Blueprint $table) {
            $table->id();
            $table->string('location_id', 40);
            $table->string('amenity', 60);

            $table->unique(['location_id', 'amenity']);
            $table->foreign('location_id')->references('id')->on('locations')->cascadeOnDelete();
        });

        Schema::create('spaces', function (Blueprint $table) {
            $table->string('id', 40)->primary();
            $table->string('location_id', 40)->index();
            $table->string('type', 20);
            $table->string('name', 120);
            $table->unsignedSmallInteger('capacity');
            $table->unsignedSmallInteger('seats')->default(1); // hot desks: seats sold per day
            $table->json('amenities');
            $table->string('rate_unit', 8);
            $table->unsignedBigInteger('rate_amount_minor');
            $table->char('rate_currency', 3);
            $table->boolean('is_bookable_online')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps(3);

            $table->foreign('location_id')->references('id')->on('locations');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spaces');
        Schema::dropIfExists('location_amenities');
        Schema::dropIfExists('location_opening_hours');
        Schema::dropIfExists('locations');
        Schema::dropIfExists('countries');
        Schema::dropIfExists('brands');
    }
};
