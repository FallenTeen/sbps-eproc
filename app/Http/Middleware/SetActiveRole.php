<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetActiveRole
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            $roles = $user->getRoleNames();

            if ($roles->isEmpty()) {
                return $next($request);
            }

            // Get the active role from session, fallback to first role
            $activeRole = session('active_role');

            // If the stored role is no longer valid for this user, reset
            if (!$activeRole || !$roles->contains($activeRole)) {
                $activeRole = $roles->first();
                session(['active_role' => $activeRole]);
            }

            // Attach the active role to the user object for use in Policies and Middleware
            $user->active_role = $activeRole;

            // Jangan biarkan atribut non-kolom ini ikut tersimpan saat model di-update.
            $user->syncOriginalAttribute('active_role');
        }

        return $next($request);
    }
}
