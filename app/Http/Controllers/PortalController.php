<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class PortalController extends Controller
{
    /**
     * Portal landing page — card grid pilihan portal.
     */
    public function index(): Response
    {
        $portals = $this->getPortals();

        return Inertia::render('Portal/Index', [
            'portals' => $portals,
        ]);
    }

    /**
     * Login page per portal.
     */
    public function login(string $portal): Response|RedirectResponse
    {
        $config = $this->resolvePortal($portal);

        $colors = config('portals.colors', []);
        $color = $colors[$config['color']] ?? $colors['red'];

        return Inertia::render('Portal/Login', [
            'portal' => [
                'slug' => $portal,
                'name' => $config['name'],
                'description' => $config['description'],
                'icon' => $config['icon'],
                'color' => $config['color'],
                'colorClasses' => $color,
            ],
            'status' => session('status'),
        ]);
    }

    /**
     * Handle login dari portal tertentu.
     */
    public function store(Request $request, string $portal): RedirectResponse
    {
        $config = $this->resolvePortal($portal);

        $loginRequest = app(LoginRequest::class);
        $loginRequest->setContainer(app());
        $loginRequest->setRedirectResolver(function ($message = null) {
            return redirect()->back()->withErrors(['email' => $message]);
        });

        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $request->string('email'))->first();

        if (! $user || ! $user->is_active || ! Hash::check($request->string('password'), $user->password)) {
            return redirect()->back()->withErrors([
                'email' => 'Email atau password salah.',
            ])->onlyInput('email');
        }

        // Cek apakah user punya role yang cocok dengan portal ini
        $portalRoles = $config['roles'];
        $userRoles = $user->getRoleNames()->toArray();
        $matchedRole = null;

        foreach ($portalRoles as $portalRole) {
            if (in_array($portalRole, $userRoles)) {
                $matchedRole = $portalRole;
                break;
            }
        }

        if (! $matchedRole) {
            return redirect()->back()->withErrors([
                'email' => 'Akun Anda tidak memiliki akses ke portal '.$config['name'].'.',
            ])->onlyInput('email');
        }

        Auth::login($user, $request->boolean('remember'));

        $request->session()->regenerate();
        $request->session()->put('active_role', $matchedRole);
        $request->session()->put('portal', $portal);

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Ambil config portal berdasarkan slug, abort 404 jika tidak ada.
     */
    private function resolvePortal(string $slug): array
    {
        $portals = config('portals.portals', []);

        if (! isset($portals[$slug])) {
            abort(404, 'Portal tidak ditemukan.');
        }

        return $portals[$slug];
    }

    /**
     * Format portals untuk frontend (tanpa roles internal).
     */
    private function getPortals(): array
    {
        $portals = config('portals.portals', []);
        $colors = config('portals.colors', []);

        return collect($portals)->map(function ($portal, $slug) use ($colors) {
            $color = $colors[$portal['color']] ?? $colors['red'];

            return [
                'slug' => $slug,
                'name' => $portal['name'],
                'description' => $portal['description'],
                'icon' => $portal['icon'],
                'color' => $portal['color'],
                'colorClasses' => $color,
            ];
        })->values()->toArray();
    }
}
