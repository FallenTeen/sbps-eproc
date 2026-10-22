<?php

namespace App\Http\Controllers;

use App\Domain\HR\Models\Karyawan;
use App\Domain\Shared\Actions\RecordAuditLogAction;
use App\Models\User;
use App\Traits\FilterableTable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserManagementController extends Controller
{
    use FilterableTable;

    public function __construct(private RecordAuditLogAction $recordAuditLog)
    {
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $query = User::with(['roles', 'karyawan:id,user_id,nama,jabatan']);

        $columns = [
            'name' => ['type' => 'like'],
            'email' => ['type' => 'like'],
            'role' => ['type' => 'exact', 'relation' => 'roles', 'column' => 'name'],
            'is_active' => ['type' => 'boolean'],
        ];

        $sort = $this->applyTableQuery($query, $request, $columns, 'name');

        $users = $query->paginate($this->tablePerPage($request))->withQueryString();

        $roles = Role::pluck('name');

        return Inertia::render('UserManagement/Index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->input('filters', []),
            'sort' => $sort['sort'],
            'direction' => $sort['direction'],
        ]);
    }

    /**
     * Show form to create a new user.
     */
    public function create()
    {
        $this->authorize('create', User::class);

        $roles = Role::pluck('name');
        $karyawans = $this->karyawansTanpaAkun();

        return Inertia::render('UserManagement/Create', [
            'roles' => $roles,
            'karyawans' => $karyawans,
        ]);
    }

    /**
     * Store a newly created user, dengan opsi tautan karyawan:
     * pilih karyawan yang sudah ada (belum punya akun) ATAU buat
     * data karyawan baru yang tertaut ke akun ini (boleh dua-duanya kosong).
     */
    public function store(Request $request)
    {
        $validated = $request->validate(array_merge([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|string|exists:roles,name',
            'is_active' => 'sometimes|boolean',
        ], $this->karyawanLinkRules(false)));

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => $request->is_active ?? true,
        ]);

        $user->assignRole($validated['role']);

        $karyawan = $this->resolveKaryawanLink($request, $user);

        $pesan = 'User berhasil dibuat.';
        if ($karyawan) {
            $pesan .= ' Karyawan "'.$karyawan->nama.'" tertaut dengan akun ini.';
        }

        return redirect()->route('users.index')->with('success', $pesan);
    }

    /**
     * Show form to edit a user, termasuk status tautan karyawan.
     */
    public function edit(User $user)
    {
        $this->authorize('update', $user);

        $user->load(['roles', 'karyawan:id,user_id,nama,jabatan,tipe,no_hp']);
        $roles = Role::pluck('name');
        $userRole = $user->roles->first()?->name ?? '';

        return Inertia::render('UserManagement/Edit', [
            'user' => $user,
            'roles' => $roles,
            'userRole' => $userRole,
            'karyawans' => $this->karyawansTanpaAkun(),
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user)
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'role' => 'required|string|exists:roles,name',
            'is_active' => 'sometimes|boolean',
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'is_active' => $request->is_active ?? $user->is_active,
        ]);

        if ($request->filled('password')) {
            $user->update(['password' => Hash::make($request->password)]);
        }

        $user->syncRoles([$validated['role']]);

        return redirect()->route('users.index')
            ->with('success', 'User berhasil diperbarui.');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user)
    {
        $this->authorize('delete', $user);

        if ($user->id === auth()->id()) {
            return back()->with('error', 'Anda tidak dapat menghapus akun sendiri.');
        }

        $user->delete();

        return redirect()->route('users.index')
            ->with('success', 'User berhasil dihapus.');
    }

    /**
     * Tautkan karyawan ke akun user: pakai karyawan yang sudah ada
     * (belum punya akun) atau buat data karyawan baru yang tertaut.
     */
    public function linkKaryawan(Request $request, User $user)
    {
        $this->authorize('update', $user);

        $validated = $request->validate($this->karyawanLinkRules(true));

        $karyawan = $this->resolveKaryawanLink($request, $user);

        return back()->with('success', 'Karyawan "'.$karyawan->nama.'" berhasil tertaut dengan akun "'.$user->email.'".');
    }

    /**
     * Lepas tautan karyawan dari akun user (karyawan datanya tetap ada,
     * hanya tidak lagi memakai akun ini).
     */
    public function unlinkKaryawan(User $user)
    {
        $this->authorize('update', $user);

        $karyawan = $user->karyawan()->first();

        if (! $karyawan) {
            return back()->with('error', 'Akun ini belum tertaut dengan karyawan manapun.');
        }

        $karyawan->update(['user_id' => null]);

        $this->recordAuditLog->execute(
            "Melepas tautan karyawan '{$karyawan->nama}' dari akun '{$user->email}'",
            $user,
            'updated',
            ['user_id' => $user->id, 'karyawan_id' => $karyawan->id],
            'user-management'
        );

        return back()->with('success', 'Tautan karyawan "'.$karyawan->nama.'" berhasil dilepas.');
    }

    /**
     * Assign role to user.
     */
    public function assignRole(Request $request, User $user)
    {
        $this->authorize('assignRole', $user);

        $request->validate([
            'role' => 'required|string|exists:roles,name',
        ]);

        $user->syncRoles([$request->role]);

        return back()->with('success', 'Role berhasil di-assign.');
    }

    /**
     * Remove role from user.
     */
    public function removeRole(Request $request, User $user)
    {
        $this->authorize('removeRole', $user);

        $request->validate([
            'role' => 'required|string|exists:roles,name',
        ]);

        $user->removeRole($request->role);

        return back()->with('success', 'Role berhasil dihapus.');
    }

    /**
     * Toggle user active status.
     */
    public function toggleActive(User $user)
    {
        $this->authorize('toggleActive', $user);

        if ($user->id === auth()->id()) {
            return back()->with('error', 'Anda tidak dapat menonaktifkan akun sendiri.');
        }

        $user->update(['is_active' => ! $user->is_active]);

        return back()->with('success', 'Status user berhasil diubah.');
    }

    /**
     * Daftar karyawan aktif yang belum menaut ke akun manapun.
     */
    protected function karyawansTanpaAkun()
    {
        return Karyawan::whereNull('user_id')
            ->aktif()
            ->orderBy('nama')
            ->get(['id', 'nama', 'tipe', 'jabatan', 'no_hp']);
    }

    /**
     * Patungan validasi untuk pemilihan karyawan (link existing ATAU buat baru).
     * $wajib=true dipakai endpoint link-karyawan: harus memilih salah satu mode.
     */
    protected function karyawanLinkRules(bool $wajib = false): array
    {
        return [
            'karyawan_id' => [
                $wajib ? 'required_without:new_karyawan' : 'nullable',
                Rule::exists('karyawans', 'id'),
            ],
            'new_karyawan' => [
                $wajib ? 'required_without:karyawan_id' : 'nullable',
                'array',
            ],
            'new_karyawan.nama' => ['required_with:new_karyawan', 'string', 'max:255'],
            'new_karyawan.tipe' => ['required_with:new_karyawan', Rule::in(['tetap', 'harian', 'borongan_rit'])],
            'new_karyawan.jabatan' => ['required_with:new_karyawan', 'string', 'max:100'],
            'new_karyawan.no_hp' => ['nullable', 'string', 'max:30'],
            'new_karyawan.alias' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * Terapkan pilihan tautan karyawan ke user:
     * - karyawan_id terisi  → tautkan karyawan existing (harus belum punya akun / sudah milik user ini)
     * - new_karyawan terisi → buat data karyawan baru yang tertaut ke user
     * - keduanya kosong     → kembalikan null (tidak mengubah apa pun)
     */
    protected function resolveKaryawanLink(Request $request, User $user): ?Karyawan
    {
        if ($karyawanId = $request->input('karyawan_id')) {
            $karyawan = Karyawan::findOrFail($karyawanId);

            if ($karyawan->user_id !== null && (string) $karyawan->user_id !== (string) $user->id) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'karyawan_id' => 'Karyawan "'.$karyawan->nama.'" sudah menaungi akun lain.',
                ]);
            }

            $karyawan->update(['user_id' => $user->id]);

            $this->recordAuditLog->execute(
                "Menautkan karyawan '{$karyawan->nama}' ke akun '{$user->email}'",
                $user,
                'updated',
                ['user_id' => $user->id, 'karyawan_id' => $karyawan->id],
                'user-management'
            );

            return $karyawan;
        }

        if ($request->filled('new_karyawan')) {
            $data = $request->validate($this->karyawanNewDataRules())['new_karyawan'];
            $data['user_id'] = $user->id;

            $karyawan = Karyawan::create($data);

            $this->recordAuditLog->execute(
                "Membuat data karyawan '{$karyawan->nama}' tertaut ke akun '{$user->email}'",
                $user,
                'created',
                ['user_id' => $user->id, 'karyawan_id' => $karyawan->id],
                'user-management'
            );

            return $karyawan;
        }

        return null;
    }

    protected function karyawanNewDataRules(): array
    {
        return [
            'new_karyawan.nama' => 'required|string|max:255',
            'new_karyawan.tipe' => ['required', Rule::in(['tetap', 'harian', 'borongan_rit'])],
            'new_karyawan.jabatan' => 'required|string|max:100',
            'new_karyawan.no_hp' => 'nullable|string|max:30',
            'new_karyawan.alias' => 'nullable|string|max:100',
        ];
    }
}
