<?php

use Illuminate\Support\Facades\Route;

// API-only service. The app talks to /api/v1; health check is /up.
Route::get('/', fn () => response()->json([
    'name' => 'FlexiSpace API',
    'docs' => 'docs/openapi.json in the repository',
]));
