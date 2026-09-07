<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Fleet\Actions\CompleteWorkshopTodoAction;
use App\Domain\Fleet\Actions\RequestSparepartAction;
use App\Domain\Fleet\Actions\StoreWorkshopTodoAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\WorkshopTodo;
use App\Domain\Production\Models\MesinProduksi;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Bagian 21.9 — to-do servis rutin Workshop (terjadwal).
 */
class WorkshopTodoController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', WorkshopTodo::class);

        $query = WorkshopTodo::with(['armada', 'mesin', 'assignedTo', 'createdBy', 'terkaitPengajuanServis']);

        if ($request->filled('status')) {
            if ($request->input('status') === 'selesai') {
                $query->selesai();
            } elseif ($request->input('status') === 'belum') {
                $query->belumSelesai();
            }
        }
        if ($request->filled('q')) {
            $query->where('judul', 'like', '%'.$request->input('q').'%');
        }

        $todos = $query->latest('updated_at')->paginate(15)->withQueryString();

        $user = $request->user();

        return Inertia::render('Fleet/Workshop/Todo', [
            'todos' => $todos,
            'armadas' => Armada::aktif()->orderBy('plat_nomor')->get(['id', 'plat_nomor', 'kode_unit']),
            'mesins' => MesinProduksi::where('status', 'aktif')->orderBy('nama')->get(['id', 'nama', 'jenis']),
            'workshopUsers' => $this->workshopUsers(),
            'filters' => $request->only(['status', 'q']),
            'can' => [
                'manage' => $user->can('manage', WorkshopTodo::class),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('manage', WorkshopTodo::class);

        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'deskripsi' => 'nullable|string|max:2000',
            'jadwal_tipe' => 'required|in:harian,mingguan,bulanan,tanggal_tertentu',
            'jadwal_detail' => [
                Rule::requiredIf(in_array($request->input('jadwal_tipe'), ['mingguan', 'bulanan', 'tanggal_tertentu'], true)),
                function ($attribute, $value, $fail) use ($request) {
                    $tipe = $request->input('jadwal_tipe');
                    if ($tipe === 'mingguan' && ! in_array(strtolower((string) $value), ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'], true)) {
                        $fail('Jadwal mingguan harus berisi hari (senin s/d minggu).');
                    }
                    if ($tipe === 'bulanan' && ((int) $value < 1 || (int) $value > 31)) {
                        $fail('Jadwal bulanan harus berisi angka 1 s/d 31.');
                    }
                    if ($tipe === 'tanggal_tertentu' && strtotime((string) $value) === false) {
                        $fail('Jadwal tanggal tertentu harus berformat tanggal (Y-m-d).');
                    }
                },
            ],
            'armada_id' => 'nullable|exists:armadas,id',
            'mesin_id' => 'nullable|exists:mesin_produksis,id',
            'assigned_to' => 'nullable|exists:users,id',
            'terkait_pengajuan_servis_id' => 'nullable|exists:pengajuan_servis_armadas,id',
            'status' => 'nullable|in:terjadwal,selesai',
        ]);

        app(StoreWorkshopTodoAction::class)->execute($request->user(), $validated);

        return back()->with('success', 'To-do servis rutin dibuat.');
    }

    public function update(Request $request, WorkshopTodo $todo)
    {
        $this->authorize('manage', WorkshopTodo::class);

        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'deskripsi' => 'nullable|string|max:2000',
            'jadwal_tipe' => 'required|in:harian,mingguan,bulanan,tanggal_tertentu',
            'jadwal_detail' => ['nullable'],
            'armada_id' => 'nullable|exists:armadas,id',
            'mesin_id' => 'nullable|exists:mesin_produksis,id',
            'assigned_to' => 'nullable|exists:users,id',
            'status' => 'nullable|in:terjadwal,selesai',
        ]);

        app(StoreWorkshopTodoAction::class)->execute($request->user(), $validated, $todo);

        return back()->with('success', 'To-do servis rutin diperbarui.');
    }

    public function destroy(Request $request, WorkshopTodo $todo)
    {
        $this->authorize('manage', WorkshopTodo::class);

        $todo->delete();

        return back()->with('success', 'To-do servis rutin dihapus.');
    }

    public function complete(Request $request, WorkshopTodo $todo)
    {
        $this->authorize('manage', WorkshopTodo::class);

        app(CompleteWorkshopTodoAction::class)->execute($todo, $request->user());

        return back()->with('success', 'To-do servis rutin selesai.');
    }

    public function requestSparepart(Request $request, WorkshopTodo $todo)
    {
        $this->authorize('manage', WorkshopTodo::class);

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.nama_item' => 'required|string|max:255',
            'items.*.jumlah' => 'nullable|numeric|min:0',
            'items.*.satuan' => 'nullable|string|max:50',
            'items.*.nominal' => 'nullable|numeric|min:0',
        ]);

        app(RequestSparepartAction::class)->execute($request->user(), $validated['items'], null, $todo);

        return back()->with('success', 'Permintaan sparepart dari to-do diajukan ke Inventory.');
    }

    private function workshopUsers(): array
    {
        return User::role(['Owner', 'Workshop', 'Ketua Divisi Armada', 'Koordinator GCS'])
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name])
            ->all();
    }
}