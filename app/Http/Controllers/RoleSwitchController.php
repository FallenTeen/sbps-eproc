<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class RoleSwitchController extends Controller
{
    public function switch(Request $request)
    {
        $request->validate([
            'role' => 'required|string',
        ]);

        $user = auth()->user();
        $role = $request->input('role');

        if ($user && $user->hasRole($role)) {
            session(['active_role' => $role]);

            return redirect()->back()->with('success', "Role aktif dialihkan ke {$role}.");
        }

        abort(403, 'Anda tidak memiliki role ini.');
    }
}
