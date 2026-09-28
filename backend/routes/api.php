<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AvailabilityController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\LocationController;
use Illuminate\Support\Facades\Route;

/*
| FlexiSpace API v1. Matches docs/openapi.json, which is generated from the
| app's Zod schemas. Every route except login needs a Sanctum bearer token.
*/
Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);

        Route::get('brands', [CatalogController::class, 'brands']);
        Route::get('countries', [CatalogController::class, 'countries']);

        Route::get('locations', [LocationController::class, 'index']);
        Route::get('locations/{id}', [LocationController::class, 'show']);
        Route::get('spaces/{id}/availability', AvailabilityController::class);

        Route::get('bookings', [BookingController::class, 'index']);
        Route::post('bookings', [BookingController::class, 'store'])->middleware('throttle:30,1');
        Route::get('bookings/{id}', [BookingController::class, 'show']);
        Route::patch('bookings/{id}', [BookingController::class, 'update']);
    });
});
