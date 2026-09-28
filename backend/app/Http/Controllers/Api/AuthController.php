<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** Issues a Sanctum token for the mobile app. Rate limited in routes/api.php. */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::with('assignments')->where('email', $request->string('email')->lower())->first();

        if ($user === null || ! Hash::check($request->string('password')->toString(), $user->password)) {
            // Same message for unknown email and wrong password: no account enumeration.
            throw ValidationException::withMessages(['email' => __('auth.failed')]);
        }

        $token = $user->createToken('mobile-app')->plainTextToken;

        return response()->json(['data' => [
            'token' => $token,
            'user' => UserResource::make($user)->resolve($request),
        ]]);
    }

    public function logout(Request $request): Response
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->noContent();
    }

    public function me(Request $request): UserResource
    {
        return UserResource::make($request->user()->load('assignments'));
    }
}
