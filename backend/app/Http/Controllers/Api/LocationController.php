<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LocationResource;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LocationController extends Controller
{
    /** Paginated, filtered, and always limited to the caller's scope. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'country' => ['sometimes', 'string', 'size:2'],
            'brand' => ['sometimes', 'string', 'max:32'],
            'per_page' => ['sometimes', 'integer', 'between:1,100'],
        ]);

        $locations = Location::query()
            ->visibleTo($request->user()->load('assignments'))
            ->where('is_active', true)
            ->when($filters['country'] ?? null, fn ($q, $country) => $q->where('country_code', strtoupper($country)))
            ->when($filters['brand'] ?? null, fn ($q, $brand) => $q->where('brand_id', $brand))
            ->with(['openingHours', 'amenities'])
            ->orderBy('country_code')
            ->orderBy('name')
            ->paginate($filters['per_page'] ?? 50);

        return LocationResource::collection($locations);
    }

    /** 404 (not 403) outside the scope, so staff cannot probe other brands. */
    public function show(Request $request, string $id): LocationResource
    {
        $location = Location::query()
            ->visibleTo($request->user()->load('assignments'))
            ->with(['openingHours', 'amenities', 'spaces' => fn ($q) => $q->where('is_active', true)])
            ->findOrFail($id);

        return LocationResource::make($location);
    }
}
