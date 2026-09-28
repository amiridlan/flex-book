<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BookingController extends Controller
{
    public function __construct(private readonly BookingService $bookings) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return BookingResource::collection(
            Booking::query()
                ->where('user_id', $request->user()->id)
                ->with(['space', 'location'])
                ->orderBy('starts_at')
                ->get(),
        );
    }

    public function store(StoreBookingRequest $request): JsonResponse
    {
        $booking = $this->bookings->create(
            $request->user(),
            $request->string('spaceId')->toString(),
            $request->startsAt(),
            $request->endsAt(),
            $request->device(),
        );

        return BookingResource::make($booking->load(['space', 'location']))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, string $id): BookingResource
    {
        return BookingResource::make($this->ownBooking($request, $id));
    }

    /** PATCH { status: "cancelled" }: the only update members can make. */
    public function update(Request $request, string $id): BookingResource
    {
        $request->validate(['status' => ['required', 'in:cancelled']]);

        return BookingResource::make($this->bookings->cancel($this->ownBooking($request, $id)));
    }

    private function ownBooking(Request $request, string $id): Booking
    {
        return Booking::query()
            ->where('user_id', $request->user()->id)
            ->with(['space', 'location'])
            ->findOrFail($id);
    }
}
