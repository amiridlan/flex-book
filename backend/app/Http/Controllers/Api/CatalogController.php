<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BrandResource;
use App\Http\Resources\CountryResource;
use App\Models\Brand;
use App\Models\Country;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CatalogController extends Controller
{
    public function brands(): AnonymousResourceCollection
    {
        return BrandResource::collection(Brand::query()->orderBy('name')->get());
    }

    public function countries(): AnonymousResourceCollection
    {
        return CountryResource::collection(Country::query()->orderBy('name')->get());
    }
}
