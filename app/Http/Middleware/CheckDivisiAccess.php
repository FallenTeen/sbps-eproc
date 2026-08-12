<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckDivisiAccess
{
    public function handle(Request $request, Closure $next, ?string $targetDivisi = null): Response
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        // Owner & Admin bypass
        if ($user->hasRole('Owner') || $user->hasRole('Admin') || $user->hasRole('Admin Keuangan')) {
            return $next($request);
        }

        // Cek pencocokan unit_bisnis_id dari request / route jika ada
        $requestedUnitId = $request->input('unit_bisnis_id') 
            ?? $request->route('unit_bisnis') 
            ?? $request->route('unit_bisnis_id');

        if ($requestedUnitId && $user->unit_bisnis_id) {
            if ($user->unit_bisnis_id != $requestedUnitId) {
                abort(403, 'Akses ditolak: Anda hanya memiliki wewenang pada divisi / unit bisnis Anda sendiri.');
            }
        }

        // Cek divisi spesifik jika dintentukan di middleware parameter
        if ($targetDivisi && $user->divisi) {
            if (strtolower($user->divisi) !== strtolower($targetDivisi)) {
                abort(403, "Akses ditolak: Halaman ini khusus untuk divisi {$targetDivisi}.");
            }
        }

        return $next($request);
    }
}
