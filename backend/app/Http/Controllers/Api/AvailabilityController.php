<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AvailabilityRequest;
use App\Models\Space;
use App\Services\AvailabilityService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;

class AvailabilityController extends Controller
{
    public function __invoke(AvailabilityRequest $request, string $id, AvailabilityService $availability): JsonResponse
    {
        $space = Space::with('location.openingHours')->findOrFail($id);
        abort_unless($request->user()->load('assignments')->canSeeLocation($space->location), 404);

        return response()->json([
            'data' => $availability->forDate($space, $request->string('date')->toString(), CarbonImmutable::now()),
        ]);
    }
}
