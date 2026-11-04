<?php

namespace App\Domain\HR\Http\Controllers;

use App\Domain\Core\Models\Titik;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Shared\Actions\RecordAuditLogAction;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\FilterableTable;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class KaryawanController extends Controller
{
    use FilterableTable;

    private const ACCOUNT_ROLE_OPTIONS = [
        'user',
        'Admin Keuangan',
        'Ketua Divisi Armada',
        'Ketua Divisi Produksi AMP',
        'Ketua Divisi Produksi CBP',
        'Driver Armada',
        'Koordinator SDM',
        'Kontraktor',
    ];

    public function __construct(private RecordAuditLogAction $recordAuditLog) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Karyawan::class);

        $query = Karyawan::with(['user', 'assignments' => function ($q) {
            $q->where('status', 'aktif')->with('titik');
        }]);

        $columns = [
            'nama' => ['type' => 'like'],
            'jabatan' => ['type' => 'like'],
            'tipe' => ['type' => 'exact'],
            'status' => ['type' => 'exact'],
        ];

        $sort = $this->applyTableQuery($query, $request, $columns, 'nama');

        $karyawans = $query->paginate($this->tablePerPage($request))->withQueryString();

        $user = $request->user();
        $canManageHr = $user && ($user->hasRole(['Owner', 'Koordinator SDM']) || $user->hasPermissionTo('manage hr'));

        // Sembunyikan field gaji untuk role yang tidak berhak
        if (! $canManageHr) {
            $karyawans->getCollection()->transform(function ($karyawan) {
                $karyawan->makeHidden(['rate_gaji_pokok', 'rate_harian', 'npwp', 'no_bpjs_kesehatan', 'no_bpjs_ketenagakerjaan']);

                return $karyawan;
            });
        }

        return Inertia::render('HR/Karyawan/Index', [
            'karyawans' => $karyawans,
            'filters' => $request->input('filters', []),
            'sort' => $sort['sort'],
            'direction' => $sort['direction'],
        ]);
    }

    public function create()
    {
        $this->authorize('create', Karyawan::class);

        $roles = Role::query()
            ->where('guard_name', 'web')
            ->whereIn('name', self::ACCOUNT_ROLE_OPTIONS)
            ->orderBy('name')
            ->pluck('name');

        if (! $roles->contains('user')) {
            $roles->prepend('user');
        }

        return Inertia::render('HR/Karyawan/Create', [
            'roles' => $roles->values(),
            'jabatanOptions' => Karyawan::query()
                ->whereNotNull('jabatan')
                ->where('jabatan', '<>', '')
                ->distinct()
                ->orderBy('jabatan')
                ->pluck('jabatan'),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Karyawan::class);

        $createsAccount = $request->boolean('create_account');
        $rules = [
            'nama' => 'required|string|max:255',
            'tipe' => ['required', Rule::in(['tetap', 'harian', 'borongan_rit'])],
            'jabatan' => 'required|string|max:255',
            'rate_gaji_pokok' => 'nullable|numeric|min:0',
            'rate_harian' => 'nullable|numeric|min:0',
            'npwp' => 'nullable|string|max:50',
            'no_bpjs_kesehatan' => 'nullable|string|max:50',
            'no_bpjs_ketenagakerjaan' => 'nullable|string|max:50',
            'status_ptkp' => 'nullable|string|max:20',
            'no_hp' => 'nullable|string|max:30',
            'alias' => 'nullable|string|max:100',
            'status' => ['required', Rule::in(['aktif', 'nonaktif'])],
        ];

        if ($createsAccount) {
            $roleRules = [
                'required',
                Rule::in(self::ACCOUNT_ROLE_OPTIONS),
            ];
            if ($request->input('account_role') !== 'user') {
                $roleRules[] = Rule::exists('roles', 'name')
                    ->where('guard_name', 'web');
            }

            $rules = array_merge($rules, [
                'account_email' => 'required|email|unique:users,email',
                'account_password' => 'required|string|min:8|confirmed',
                'account_role' => $roleRules,
            ]);
        }

        $validated = $request->validate($rules);

        [$karyawan, $user] = DB::transaction(function () use ($validated, $createsAccount) {
            $karyawan = Karyawan::create(collect($validated)
                ->except(['account_email', 'account_password', 'account_password_confirmation', 'account_role'])
                ->all());

            if (! $createsAccount) {
                return [$karyawan, null];
            }

            $role = $validated['account_role'] === 'user'
                ? Role::firstOrCreate([
                    'name' => 'user',
                    'guard_name' => 'web',
                ])
                : Role::query()
                    ->where('guard_name', 'web')
                    ->where('name', $validated['account_role'])
                    ->firstOrFail();

            if ($validated['account_role'] === 'user') {
                $role->syncPermissions([]);
            }

            $user = User::create([
                'name' => $karyawan->nama,
                'email' => $validated['account_email'],
                'password' => Hash::make($validated['account_password']),
                'is_active' => true,
            ]);
            $user->assignRole($role);

            $karyawan->update(['user_id' => $user->id]);

            $this->recordAuditLog->execute(
                "Membuat akun untuk karyawan '{$karyawan->nama}'",
                $user,
                'created',
                ['user_id' => $user->id, 'karyawan_id' => $karyawan->id],
                'hr'
            );

            return [$karyawan, $user];
        });

        $pesan = $user
            ? 'Data karyawan berhasil ditambahkan dan akun berhasil dibuat.'
            : 'Data karyawan berhasil ditambahkan.';

        return redirect()->route('hr.karyawan.index')
            ->with('success', $pesan);
    }

    public function show(Karyawan $karyawan)
    {
        $this->authorize('view', $karyawan);

        $karyawan->load(['user', 'assignments' => function ($q) {
            $q->with('titik')->orderBy('tanggal_mulai', 'desc');
        }]);

        $user = auth()->user();
        $isSelf = $user && (string) $karyawan->user_id === (string) $user->id;
        $canManageHr = $user && ($user->hasRole(['Owner', 'Koordinator SDM']) || $user->hasPermissionTo('manage hr'));

        if (! $canManageHr && ! $isSelf) {
            $karyawan->makeHidden(['rate_gaji_pokok', 'rate_harian', 'npwp', 'no_bpjs_kesehatan', 'no_bpjs_ketenagakerjaan']);
        }

        return Inertia::render('HR/Karyawan/Show', [
            'karyawan' => $karyawan,
            'titiks' => Titik::aktif()->get(),
        ]);
    }

    public function edit(Karyawan $karyawan)
    {
        $this->authorize('update', $karyawan);

        return Inertia::render('HR/Karyawan/Edit', [
            'karyawan' => $karyawan,
        ]);
    }

    public function update(Request $request, Karyawan $karyawan)
    {
        $this->authorize('update', $karyawan);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'tipe' => ['required', Rule::in(['tetap', 'harian', 'borongan_rit'])],
            'jabatan' => 'required|string|max:255',
            'rate_gaji_pokok' => 'nullable|numeric|min:0',
            'rate_harian' => 'nullable|numeric|min:0',
            'npwp' => 'nullable|string|max:50',
            'no_bpjs_kesehatan' => 'nullable|string|max:50',
            'no_bpjs_ketenagakerjaan' => 'nullable|string|max:50',
            'status_ptkp' => 'nullable|string|max:20',
            'no_hp' => 'nullable|string|max:30',
            'alias' => 'nullable|string|max:100',
            'status' => ['required', Rule::in(['aktif', 'nonaktif'])],
        ]);

        $karyawan->update($validated);

        return redirect()->route('hr.karyawan.index')
            ->with('success', 'Data karyawan berhasil diperbarui.');
    }

    public function destroy(Karyawan $karyawan)
    {
        $this->authorize('delete', $karyawan);

        $karyawan->delete();

        return redirect()->route('hr.karyawan.index')
            ->with('success', 'Data karyawan berhasil dihapus.');
    }

    public function updateStatus(Request $request, Karyawan $karyawan)
    {
        $this->authorize('updateStatus', $karyawan);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['aktif', 'nonaktif'])],
        ]);

        $karyawan->update(['status' => $validated['status']]);

        return back()->with('success', 'Status karyawan diperbarui.');
    }

    public function assignTitik(Request $request, Karyawan $karyawan)
    {
        $this->authorize('assignTitik', $karyawan);

        $request->validate([
            'titik_id' => 'required|exists:titiks,id',
            'tanggal_mulai' => 'required|date',
        ]);

        // Tutup assignment lama yang masih aktif
        $karyawan->assignments()->where('status', 'aktif')->update([
            'status' => 'selesai',
            'tanggal_selesai' => Carbon::parse($request->tanggal_mulai)->subDay(),
        ]);

        // Buat assignment baru
        $karyawan->assignments()->create([
            'titik_id' => $request->titik_id,
            'tanggal_mulai' => $request->tanggal_mulai,
            'status' => 'aktif',
        ]);

        return back()->with('success', 'Karyawan berhasil ditugaskan ke Titik baru.');
    }

    public function removeTitik(Request $request, Karyawan $karyawan)
    {
        $this->authorize('removeTitik', $karyawan);

        $request->validate([
            'assignment_id' => 'required|exists:karyawan_titik_assignments,id',
            'tanggal_selesai' => 'required|date',
        ]);

        $karyawan->assignments()->where('id', $request->assignment_id)->update([
            'status' => 'selesai',
            'tanggal_selesai' => $request->tanggal_selesai,
        ]);

        return back()->with('success', 'Penugasan Titik berhasil diakhiri.');
    }

    /** Link existing User account to existing Karyawan */
    public function linkUser(Request $request, Karyawan $karyawan)
    {
        $this->authorize('update', $karyawan);

        $validated = $request->validate([
            'account_name' => 'required|string|max:255',
            'account_email' => 'required|email|unique:users,email',
            'account_password' => 'required|string|min:8|confirmed',
            'account_role' => 'required|string|exists:roles,name',
        ]);

        // Cek duplikasi email
        $existing = User::where('email', $validated['account_email'])->first();
        if ($existing) {
            return back()->with('error', 'Email '.$validated['account_email'].' sudah terdaftar sebagai akun. Gunakan menu Manajemen User untuk menghubungkan akun yang ada.');
        }

        $user = User::create([
            'name' => $validated['account_name'],
            'email' => $validated['account_email'],
            'password' => Hash::make($validated['account_password']),
            'is_active' => true,
        ]);

        $user->assignRole($validated['account_role']);

        $karyawan->user_id = $user->id;
        $karyawan->save();

        $this->recordAuditLog->execute(
            "Membuat akun untuk karyawan '{$karyawan->nama}'",
            $user,
            'created',
            ['user_id' => $user->id, 'karyawan_id' => $karyawan->id],
            'hr'
        );

        return back()->with('success', 'Akun berhasil dibuat dan tertaut ke karyawan "'.$karyawan->nama.'".');
    }

    /** Unlink User from Karyawan (karyawan tetap ada, hanya akun yang dihapus) */
    public function unlinkUser(Request $request, Karyawan $karyawan)
    {
        $this->authorize('update', $karyawan);

        $user = $karyawan->user;

        if (! $user) {
            return back()->with('error', 'Karyawan ini belum memiliki akun.');
        }

        $this->recordAuditLog->execute(
            "Menghapus akun '{$user->email}' dari karyawan '{$karyawan->nama}'",
            $user,
            'deleted',
            ['user_id' => $user->id, 'karyawan_id' => $karyawan->id],
            'hr'
        );

        $user->delete();

        $karyawan->user_id = null;
        $karyawan->save();

        return back()->with('success', 'Akun karyawan "'.$karyawan->nama.'" berhasil dihapus.');
    }
}
