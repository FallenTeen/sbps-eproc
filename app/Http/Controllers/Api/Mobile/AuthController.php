<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\KaryawanTitikAssignment;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/mobile/login
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'device_name' => 'nullable|string|max:100',
            'device_token' => 'nullable|string|max:255',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return $this->error('Kredensial tidak valid.', 401);
        }

        if (! $user->is_active) {
            return $this->error('Akun Anda dinonaktifkan.', 403);
        }

        if (! empty($validated['device_token'])) {
            $user->forceFill(['device_token' => $validated['device_token']])->save();
        }

        $token = $user->createToken('mobile-'.($validated['device_name'] ?? 'default'));

        return $this->success([
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'user' => $this->userPayload($user->fresh()),
        ], 'Login berhasil.');
    }

    /**
     * POST /api/mobile/register
     */
    public function register(Request $request)
    {
        $allowedRoles = implode(',', config('mobile.registration_roles', []));

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'role' => "nullable|string|in:{$allowedRoles}",
            'device_name' => 'nullable|string|max:100',
            'device_token' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'nama_lengkap' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'phone' => $validated['phone'] ?? null,
        ]);

        $role = $validated['role'] ?? config('mobile.default_register_role', 'SDM Lapangan Kondisional');
        $user->assignRole($role);

        if (! empty($validated['device_token'])) {
            $user->forceFill(['device_token' => $validated['device_token']])->save();
        }

        $token = $user->createToken('mobile-'.($validated['device_name'] ?? 'default'));

        return $this->success([
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'user' => $this->userPayload($user->fresh()),
        ], 'Registrasi berhasil.', 201);
    }

    /**
     * POST /api/mobile/logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success(null, 'Logout berhasil.');
    }

    /**
     * GET /api/mobile/user
     */
    public function user(Request $request)
    {
        return $this->success($this->userPayload($request->user()), 'Data user.');
    }

    /**
     * POST /api/mobile/update-profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        $data = [];
        if (array_key_exists('name', $validated)) {
            $data['name'] = $validated['name'];
            $data['nama_lengkap'] = $validated['name'];
        }
        if (array_key_exists('phone', $validated)) {
            $data['phone'] = $validated['phone'];
        }
        if (array_key_exists('password', $validated)) {
            $data['password'] = $validated['password'];
        }

        if ($data) {
            $user->update($data);
        }

        return $this->success($this->userPayload($user->fresh()), 'Profile berhasil diperbarui.');
    }

    /**
     * GET /api/mobile/assignments
     * Daftar titik yang ditugaskan ke user (karyawan terkait).
     * Filter: ?status=aktif (default) | semua
     */
    public function assignments(Request $request)
    {
        $user = $request->user();
        $karyawan = $user->karyawan;

        if (! $karyawan) {
            return $this->success([
                'items' => [],
            ], 'Akun tidak terhubung ke data karyawan.');
        }

        $validated = $request->validate([
            'status' => 'nullable|string|in:aktif,selesai,semua',
        ]);

        $statusFilter = $validated['status'] ?? 'aktif';

        $query = KaryawanTitikAssignment::with('titik.proyek')
            ->where('karyawan_id', $karyawan->id);

        if ($statusFilter !== 'semua') {
            $query->where('status', $statusFilter);
        }

        $assignments = $query->orderByDesc('tanggal_mulai')->get();

        return $this->success([
            'items' => $assignments->map(fn ($a) => [
                'id' => $a->id,
                'titik_id' => $a->titik_id,
                'titik' => $a->titik?->nama,
                'proyek' => $a->titik?->proyek?->nama,
                'latitude' => (float) ($a->titik?->latitude ?? 0),
                'longitude' => (float) ($a->titik?->longitude ?? 0),
                'tanggal_mulai' => $a->tanggal_mulai?->toDateString(),
                'tanggal_selesai' => $a->tanggal_selesai?->toDateString(),
                'status' => $a->status,
            ]),
        ], 'Daftar penugasan.');
    }

    private function userPayload(User $user): array
    {
        $karyawan = $user->karyawan;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'nama_lengkap' => $user->nama_lengkap,
            'email' => $user->email,
            'phone' => $user->phone,
            'jabatan' => $user->jabatan,
            'unit_bisnis_id' => $user->unit_bisnis_id,
            'divisi' => $user->divisi,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getPermissionNames(),
            'karyawan' => $karyawan ? [
                'id' => $karyawan->id,
                'nama' => $karyawan->nama,
                'tipe' => $karyawan->tipe,
                'jabatan' => $karyawan->jabatan,
            ] : null,
        ];
    }
}
