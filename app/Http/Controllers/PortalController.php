<?php

namespace App\Http\Controllers;

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
     * Portal landing page - card grid pilihan portal.
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

        // Hitung semua portal yang role user cocok (urut sesuai config).
        $matchedPortals = $this->getMatchedPortals($user->getRoleNames()->toArray());

        if (count($matchedPortals) > 1) {
            return redirect()->route('portal.pilih.index');
        }

        $request->session()->put('active_role', $matchedRole);
        $request->session()->put('portal', $portal);

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Halaman pemilihan portal untuk user multi-role.
     */
    public function pilihIndex(): Response|RedirectResponse
    {
        $matchedPortals = $this->getMatchedPortals(Auth::user()->getRoleNames()->toArray());

        // User ternyata hanya cocok 1 portal → langsung set session & masuk dashboard.
        if (count($matchedPortals) === 1) {
            $matched = $matchedPortals[0];

            session(['active_role' => $matched['matchedRole'], 'portal' => $matched['slug']]);

            return redirect()->route('dashboard');
        }

        return Inertia::render('Portal/Select', [
            'portals' => $matchedPortals,
        ]);
    }

    /**
     * Set session portal & role yang dipilih user.
     */
    public function pilih(Request $request, string $portal): RedirectResponse
    {
        $config = $this->resolvePortal($portal);

        $userRoles = $request->user()->getRoleNames()->toArray();
        $portalRoles = $config['roles'];
        $matchedRole = null;

        foreach ($portalRoles as $portalRole) {
            if (in_array($portalRole, $userRoles)) {
                $matchedRole = $portalRole;
                break;
            }
        }

        if (! $matchedRole) {
            abort(403, 'Akun Anda tidak memiliki akses ke portal '.$config['name'].'.');
        }

        $request->session()->put('active_role', $matchedRole);
        $request->session()->put('portal', $portal);

        return redirect()->route('dashboard');
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

    /**
     * Daftar portal yang punya role cocok dengan role user
     * (slug => role pertama yang match per portal, urut sesuai config).
     */
    private function getMatchedPortals(array $userRoles): array
    {
        $portals = config('portals.portals', []);
        $colors = config('portals.colors', []);
        $matched = [];

        foreach ($portals as $slug => $portal) {
            $matchedRole = null;

            foreach ($portal['roles'] as $portalRole) {
                if (in_array($portalRole, $userRoles)) {
                    $matchedRole = $portalRole;
                    break;
                }
            }

            if ($matchedRole) {
                $color = $colors[$portal['color']] ?? $colors['red'];

                $matched[] = [
                    'slug' => $slug,
                    'name' => $portal['name'],
                    'description' => $portal['description'],
                    'icon' => $portal['icon'],
                    'color' => $portal['color'],
                    'colorClasses' => $color,
                    'matchedRole' => $matchedRole,
                ];
            }
        }

        return $matched;
    }
}
