<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Fleet\Actions\ApprovePengajuanServisAction;
use App\Domain\Fleet\Actions\AssignWorkshopPengerjaanAction;
use App\Domain\Fleet\Actions\CompletePengajuanServisAction;
use App\Domain\Fleet\Actions\RejectPengajuanServisAction;
use App\Domain\Fleet\Actions\RequestSparepartAction;
use App\Domain\Fleet\Actions\SubmitPengajuanServisAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaPenanggungJawab;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\WorkshopTodo;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * v6 (21.8) — Sistem Servis Armada (mobile).
 *
 * Bagian 1 (ajuan) bisa diajukan dari mobile oleh PIC/operator/driver melalui
 * armada yang sedang diampu. Status, riwayat, dan approval (Ketua Divisi / Admin)
 * bisa diakses melalui mobile.
 */
class PengajuanServisController extends Controller
{
    use ApiResponse;

    private function activeArmadaIds(Request $request): array
    {
        $karyawan = $request->user()?->karyawan;
        if (! $karyawan) {
            return [];
        }

        return ArmadaPenanggungJawab::where('karyawan_id', $karyawan->id)
            ->whereNull('sampai')
            ->pluck('armada_id')
            ->all();
    }

    /**
     * GET /api/mobile/servis-armada
     * Riwayat seluruh pengajuan servis armada (paginasi & filter status).
     */
    public function index(Request $request)
    {
        $query = PengajuanServisArmada::with(['armada', 'diajukanOleh', 'disetujuiOleh'])
            ->latest('tanggal_ajuan')
            ->latest('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $perPage = min((int) $request->query('per_page', 15), 50);
        $paginated = $query->paginate($perPage);

        return $this->success($paginated, 'Daftar riwayat pengajuan servis armada.');
    }

    /**
     * GET /api/mobile/servis-armada/saya
     * Servis yang diampu user (diajukannya sendiri atau armada yang di-PIC-kan).
     */
    public function saya(Request $request)
    {
        $ids = $this->activeArmadaIds($request);

        $servis = PengajuanServisArmada::with(['armada'])
            ->where('diajukan_oleh', $request->user()->id)
            ->orWhereIn('armada_id', $ids)
            ->latest('tanggal_ajuan')
            ->latest('created_at')
            ->get();

        return $this->success($servis, 'Daftar servis armada.');
    }

    /**
     * POST /api/mobile/servis-armada
     * Ajukan servis (bagian 1).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'armada_id' => 'required|exists:armadas,id',
            'tanggal_ajuan' => 'nullable|date',
            'catatan_ajuan' => 'nullable|string|max:2000',
            'keluhan' => 'nullable|string|max:2000',
            'kategori' => 'nullable|string|max:50',
            'odometer_saat_ajuan' => 'nullable|numeric',
            'jam_operasional_saat_ajuan' => 'nullable|numeric',
        ]);

        if (empty($validated['catatan_ajuan']) && !empty($validated['keluhan'])) {
            $validated['catatan_ajuan'] = $validated['keluhan'];
        }

        $user = $request->user();
        $allowedRoles = [
            'Owner',
            'Admin Keuangan',
            'Kepala Divisi Armada',
            'Ketua Divisi Armada',
            'Ketua Armada',
        ];

        $isRoleAllowed = $user && $user->hasAnyRole($allowedRoles);
        $isPic = in_array($validated['armada_id'], $this->activeArmadaIds($request), true);
        $isDriver = false;

        $karyawan = $user?->karyawan;
        if ($karyawan) {
            $isDriver = \App\Domain\Fleet\Models\ArmadaDriver::where('armada_id', $validated['armada_id'])
                ->where('karyawan_id', $karyawan->id)
                ->where('status', 'aktif')
                ->exists();
        }

        if (! $isRoleAllowed && ! $isPic && ! $isDriver) {
            return $this->error('Anda tidak berhak mengajukan servis untuk armada ini.', 403);
        }

        $pengajuan = app(SubmitPengajuanServisAction::class)->execute($user, $validated);

        return $this->success($pengajuan->load('armada'), 'Ajuan servis armada dibuat.', 201);
    }

    /**
     * GET /api/mobile/servis-armada/{id}
     */
    public function show(Request $request, $id)
    {
        $pengajuan = PengajuanServisArmada::with(['armada', 'diajukanOleh', 'disetujuiOleh', 'personels', 'spareparts', 'workshopTodos'])
            ->findOrFail($id);

        $payload = $pengajuan->toArray();
        $payload['todos'] = $pengajuan->workshopTodos
            ->map(fn (WorkshopTodo $t) => $this->mapTodo($t, $pengajuan->id))
            ->values();

        return $this->success($payload, 'Detail servis armada.');
    }

    /**
     * POST /api/mobile/workshop/job/{id}/todo/{todoId}/toggle
     * Checklist to-do workshop pada job servis terhubung.
     * Body: { is_done: boolean } → status to-do `selesai`/`terjadwal`.
     */
    public function toggleTodo(Request $request, $id, $todoId)
    {
        $validated = $request->validate([
            'is_done' => 'required|boolean',
        ]);

        $pengajuan = PengajuanServisArmada::findOrFail($id);

        $todo = WorkshopTodo::query()
            ->where('id', $todoId)
            ->where('terkait_pengajuan_servis_id', $pengajuan->id)
            ->firstOrFail();

        $todo->update([
            'status' => $validated['is_done'] ? 'selesai' : 'terjadwal',
        ]);

        return $this->success($this->mapTodo($todo->fresh(), $pengajuan->id), 'Checklist to-do diperbarui.');
    }

    /**
     * POST /api/mobile/workshop/job/{id}/todo/{todoId}/photo
     * Upload foto bukti pengerjaan to-do (multipart `photo`).
     */
    public function uploadTodoPhoto(Request $request, $id, $todoId)
    {
        $validated = $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg|max:10240',
        ]);

        $pengajuan = PengajuanServisArmada::findOrFail($id);

        $todo = WorkshopTodo::query()
            ->where('id', $todoId)
            ->where('terkait_pengajuan_servis_id', $pengajuan->id)
            ->firstOrFail();

        // Retry outbox memakai foto yang sama dengan idempotency key yang sama —
        // file lama dibuang dulu supaya tiap retry TIDAK menimbun file yatim
        // di storage (baris DB tetap tunggal: foto_bukti last-write-wins).
        $previous = $todo->foto_bukti;

        $path = $request->file('photo')->store('workshop/todo/'.now()->format('Y/m'), 'public');

        if ($previous) {
            Storage::disk('public')->delete($previous);
        }

        $todo->update(['foto_bukti' => $path]);

        return $this->success($this->mapTodo($todo->fresh(), $pengajuan->id), 'Foto bukti to-do terunggah.');
    }

    /**
     * POST /api/mobile/servis-armada/{id}/approve
     * Bagian 21.8 #2 — ACC ajuan servis oleh Ketua Divisi Armada / Owner / Admin.
     */
    public function approve(Request $request, $id)
    {
        $validated = $request->validate([
            'catatan' => 'nullable|string|max:1000',
        ]);

        $pengajuan = PengajuanServisArmada::findOrFail($id);

        $updated = app(ApprovePengajuanServisAction::class)->execute(
            $pengajuan,
            $request->user(),
            $validated['catatan'] ?? null
        );

        return $this->success($updated->load(['armada', 'disetujuiOleh']), 'Pengajuan servis berhasil disetujui.');
    }

    /**
     * POST /api/mobile/servis-armada/{id}/tolak
     * Bagian 21.8 #2 — Tolak ajuan servis oleh Ketua Divisi Armada / Owner / Admin.
     */
    public function tolak(Request $request, $id)
    {
        $validated = $request->validate([
            'alasan' => 'required|string|max:1000',
        ]);

        $pengajuan = PengajuanServisArmada::findOrFail($id);

        $updated = app(RejectPengajuanServisAction::class)->execute(
            $pengajuan,
            $request->user(),
            $validated['alasan']
        );

        return $this->success($updated->load(['armada', 'disetujuiOleh']), 'Pengajuan servis ditolak.');
    }

    /**
     * POST /api/mobile/servis-armada/{id}/mulai
     * Bagian 21.8 #3 — Workshop mulai mengerjakan servis (menunggu -> dikerjakan).
     */
    public function mulai(Request $request, $id)
    {
        $validated = $request->validate([
            'catatan_pengerjaan' => 'nullable|string|max:2000',
            'butuh_sparepart' => 'nullable|boolean',
            'personels' => 'nullable|array',
            'personels.*.nama_personel' => 'nullable|string|max:255',
            'personels.*.peran' => 'nullable|string|max:255',
        ]);

        $pengajuan = PengajuanServisArmada::findOrFail($id);

        $updated = app(AssignWorkshopPengerjaanAction::class)->execute(
            $pengajuan,
            $request->user(),
            $validated,
        );

        return $this->success($updated->fresh(['armada', 'spareparts']), 'Pengerjaan servis dimulai.');
    }

    /**
     * POST /api/mobile/servis-armada/{id}/selesai
     * Bagian 21.8 #4+ — Tandai servis selesai (dikerjakan/menunggu_sparepart -> selesai).
     */
    public function selesai(Request $request, $id)
    {
        $validated = $request->validate([
            'catatan_workshop' => 'nullable|string|max:2000',
        ]);

        $pengajuan = PengajuanServisArmada::findOrFail($id);

        $updated = app(CompletePengajuanServisAction::class)->execute(
            $pengajuan,
            $request->user(),
            ['catatan_pengerjaan' => $validated['catatan_workshop'] ?? null],
        );

        return $this->success($updated->fresh(['armada', 'spareparts']), 'Servis selesai dikerjakan.');
    }

    /**
     * POST /api/mobile/workshop/job/{id}/request-sparepart
     * Bagian 21.8 #4 — Workshop mengajukan permintaan sparepart ke Inventory.
     * Item dikirim sebagai `nama_barang` (mobile) — dipetakan ke `nama_item`.
     */
    public function requestSparepart(Request $request, $id)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.nama_barang' => 'required|string|max:255',
            'items.*.jumlah' => 'nullable|numeric|min:0',
            'items.*.satuan' => 'nullable|string|max:50',
            'items.*.keterangan' => 'nullable|string|max:1000',
            'catatan' => 'nullable|string|max:1000',
        ]);

        $pengajuan = PengajuanServisArmada::findOrFail($id);

        $items = collect($validated['items'])
            ->map(fn ($item) => [
                'nama_item' => $item['nama_barang'],
                'jumlah' => $item['jumlah'] ?? 1,
                'satuan' => $item['satuan'] ?? null,
                'nominal' => 0,
            ])
            ->all();

        $updated = app(RequestSparepartAction::class)->execute(
            $request->user(),
            $items,
            pengajuan: $pengajuan,
        );

        return $this->success(
            $updated->fresh(['armada', 'spareparts']),
            'Request sparepart dikirim ke inventory.',
            201,
        );
    }

    // ── Helper ──────────────────────────────────────────────────────────────

    /**
     * Map satu to-do workshop ke kontrak checklist mobile
     * (`WorkshopTodoItem` Flutter).
     */
    private function mapTodo(WorkshopTodo $todo, string $jobId): array
    {
        return [
            'id' => $todo->id,
            'jobId' => $jobId,
            'label' => $todo->judul,
            'isDone' => $todo->status === 'selesai',
            'photoPath' => $todo->foto_bukti ? asset('storage/'.$todo->foto_bukti) : null,
        ];
    }
}
