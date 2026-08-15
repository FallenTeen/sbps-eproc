<?php

namespace App\Http\Controllers\Api\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckActiveRole
{
    /**
     * Menetapkan role aktif user (stateless) dari header X-Active-Role,
     * fallback ke role pertama — pola sama dengan SetActiveRole (web)
     * tapi tanpa session.
     *
     * Usage: middleware('active.role') atau middleware('active.role:Kontraktor')
     * untuk memaksa role tertentu.
     */
    public function handle(Request $request, Closure $next, ?string $role = null): Response
    {
        $user = $request->user();

        if ($user) {
            $roles = $user->getRoleNames();
            $activeRole = $request->header('X-Active-Role');

            if (!$activeRole || !$roles->contains($activeRole)) {
                $activeRole = $roles->first();
            }

            $user->active_role = $activeRole;

            if ($role && !$user->hasRole($role)) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Akses ditolak. Dibutuhkan role: {$role}.",
                    'errors' => null,
                ], 403);
            }
        }

        return $next($request);
    }
}
