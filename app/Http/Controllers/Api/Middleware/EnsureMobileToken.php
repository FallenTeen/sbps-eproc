<?php

namespace App\Http\Controllers\Api\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMobileToken
{
    /**
     * Memastikan request memakai token Sanctum milik mobile app:
     *  1. Token autentikasi valid (auth:sanctum sudah menjamin).
     *  2. Nama token diawali "mobile" (token web tidak lolos).
     *  3. Request berasal dari perangkat mobile (header X-Device-Type / X-Device-Name).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated.',
                'errors' => null,
            ], 401);
        }

        $token = $user->currentAccessToken();

        if ($token && ! str_starts_with((string) $token->name, 'mobile')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Token ini tidak diizinkan untuk aplikasi mobile.',
                'errors' => null,
            ], 403);
        }

        if (! $request->header('X-Device-Type') && ! $request->header('X-Device-Name')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Endpoint mobile hanya bisa diakses dari aplikasi mobile.',
                'errors' => null,
            ], 403);
        }

        return $next($request);
    }
}
