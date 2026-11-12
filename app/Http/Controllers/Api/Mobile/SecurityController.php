<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RitaseVerifikasi;
use App\Domain\Security\Models\BukuTamu;
use App\Domain\Security\Models\SecurityChecklistRun;
use App\Domain\Security\Models\SecurityLaporanDarurat;
use App\Http\Controllers\Api\ApiResponse;
use App\Http\Controllers\Controller;
use App\Support\KaryawanTitikScope;
use Illuminate\Http\Request;

class SecurityController extends Controller
{
    use ApiResponse;

    // ── 1. Buku Tamu (TD-F2) ────────────────────────────────────────────────

    public function bukuTamuHariIni(Request $request)
    {
        $titikIds = KaryawanTitikScope::activeTitikIds($request->user());

        $tamus = BukuTamu::whereDate('waktu_masuk', now()->toDateString())
            ->when($titikIds, fn ($q, $ids) => $q->where(
                fn ($w) => $w->whereIn('titik_id', $ids)->orWhereNull('titik_id')
            ))
            ->latest('waktu_masuk')
            ->get();

        $items = $tamus->map(fn (BukuTamu $t) => [
            'id' => $t->id,
            'nama' => $t->nama,
            'jumlah_orang' => $t->jumlah_orang,
            'asal' => $t->asal,
            'nomor_telepon' => $t->nomor_telepon,
            'kendaraan' => $t->kendaraan,
            'plat_nomor' => $t->plat_nomor,
            'foto_url' => $t->foto_url,
            'waktu_masuk' => $t->waktu_masuk?->toIso8601String(),
            'waktu_keluar' => $t->waktu_keluar?->toIso8601String(),
            'is_sudah_keluar' => $t->waktu_keluar !== null,
            'catatan' => $t->catatan,
        ]);

        return $this->success(['items' => $items], 'Daftar buku tamu hari ini.');
    }

    public function storeBukuTamu(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'jumlah_orang' => 'nullable|integer|min:1',
            'asal' => 'required|string|max:255',
            'nomor_telepon' => 'nullable|string|max:50',
            'kendaraan' => 'required|string|in:tanpa_kendaraan,motor,mobil,truk,lainnya',
            'plat_nomor' => 'nullable|string|max:50',
            'catatan' => 'nullable|string|max:1000',
            'foto' => 'nullable|image|max:10240',
        ]);

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('security/tamu/'.now()->format('Y/m'), 'public');
        }

        $tamu = BukuTamu::create([
            'nama' => $validated['nama'],
            'jumlah_orang' => $validated['jumlah_orang'] ?? 1,
            'asal' => $validated['asal'],
            'nomor_telepon' => $validated['nomor_telepon'] ?? null,
            'kendaraan' => $validated['kendaraan'],
            'plat_nomor' => isset($validated['plat_nomor']) ? strtoupper($validated['plat_nomor']) : null,
            'foto' => $fotoPath,
            'waktu_masuk' => now(),
            'catatan' => $validated['catatan'] ?? null,
            'dicatat_oleh' => $request->user()->id,
            'titik_id' => $this->titikAktifKaryawan($request->user()),
        ]);

        return $this->success($tamu, 'Buku tamu berhasil dicatat.', 201);
    }

    public function keluarBukuTamu(Request $request)
    {
        $validated = $request->validate([
            'tamu_id' => 'required|exists:buku_tamus,id',
        ]);

        $tamu = BukuTamu::findOrFail($validated['tamu_id']);
        $tamu->update(['waktu_keluar' => now()]);

        return $this->success($tamu->fresh(), 'Tamu ditandai keluar.');
    }

    // ── 2. Checklist Kantor (TD-F3) ─────────────────────────────────────────

    public function submitChecklist(Request $request)
    {
        $validated = $request->validate([
            'periode' => 'required|string|max:50',
            'jam_pantau' => 'nullable|string|max:50',
            'items' => 'required',
            'catatan' => 'nullable|string|max:2000',
            'foto.*' => 'nullable|image|max:10240',
        ]);

        $items = $validated['items'];
        if (is_string($items)) {
            $items = json_decode($items, true) ?? [];
        }

        $run = SecurityChecklistRun::create([
            'periode' => $validated['periode'],
            'jam_pantau' => $validated['jam_pantau'] ?? now()->format('H:i'),
            'tanggal' => now()->toDateString(),
            'items' => $items,
            'catatan' => $validated['catatan'] ?? null,
            'security_id' => $request->user()->id,
            'titik_id' => $this->titikAktifKaryawan($request->user()),
        ]);

        if ($request->hasFile('foto')) {
            foreach ($request->file('foto') as $file) {
                $run->addMedia($file)->toMediaCollection('foto_pantau');
            }
        }

        return $this->success($run, 'Checklist pemantauan kantor berhasil disimpan.', 201);
    }

    // ── 3. Laporan Darurat (TD-F4) ──────────────────────────────────────────

    public function submitDarurat(Request $request)
    {
        $validated = $request->validate([
            'kategori' => 'required|string|max:100',
            'judul' => 'required|string|max:255',
            'deskripsi' => 'required|string|max:3000',
            'lokasi_ruangan' => 'required|string|max:255',
            'tingkat' => 'required|string|in:rendah,sedang,tinggi,siaga,darurat,kritis',
            'foto.*' => 'nullable|image|max:10240',
        ]);

        $laporan = SecurityLaporanDarurat::create([
            'kategori' => $validated['kategori'],
            'judul' => $validated['judul'],
            'deskripsi' => $validated['deskripsi'],
            'lokasi_ruangan' => $validated['lokasi_ruangan'],
            'tingkat' => $validated['tingkat'],
            'status' => 'baru',
            'pelapor_id' => $request->user()->id,
        ]);

        if ($request->hasFile('foto')) {
            foreach ($request->file('foto') as $file) {
                $laporan->addMedia($file)->toMediaCollection('foto_darurat');
            }
        }

        return $this->success($laporan, 'Laporan darurat berhasil dikirim.', 201);
    }

    /**
     * GET /api/mobile/security/darurat?status=baru
     * Daftar laporan darurat untuk penanganan (KDA/Ketua Armada/Owner/Security).
     */
    public function daftarDarurat(Request $request)
    {
        if (! $this->bolehTanganiDarurat($request->user())) {
            return $this->error('Anda tidak berhak melihat laporan darurat.', 403);
        }

        $validated = $request->validate([
            'status' => 'nullable|in:baru,ditangani,selesai',
        ]);

        $items = SecurityLaporanDarurat::with('pelapor:id,name')
            ->when($validated['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->latest('created_at')
            ->take(100)
            ->get();

        return $this->success($items, 'Daftar laporan darurat.');
    }

    /**
     * POST /api/mobile/security/darurat/{id}/tangani
     * Tindak lanjut laporan darurat (status + catatan + penanggung jawab).
     */
    public function tanganiDarurat(Request $request, string $id)
    {
        if (! $this->bolehTanganiDarurat($request->user())) {
            return $this->error('Anda tidak berhak menangani laporan darurat.', 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:ditangani,selesai',
            'catatan_penanganan' => 'nullable|string|max:2000',
        ]);

        $laporan = SecurityLaporanDarurat::findOrFail($id);
        $laporan->update([
            'status' => $validated['status'],
            'catatan_penanganan' => $validated['catatan_penanganan'] ?? $laporan->catatan_penanganan,
            'ditangani_oleh' => $request->user()->id,
        ]);

        return $this->success($laporan->fresh('pelapor'), 'Laporan darurat diperbarui.');
    }

    private function bolehTanganiDarurat(?object $user): bool
    {
        return $user !== null && (
            $user->can('manage security darurat')
            || $user->hasAnyRole(['Kepala Divisi Armada', 'Ketua Divisi Armada', 'Ketua Armada', 'Owner'])
        );
    }

    /**
     * Titik aktif karyawan user (via KaryawanTitikAssignment aktif), atau null.
     */
    private function titikAktifKaryawan(?object $user): ?string
    {
        $titikIds = KaryawanTitikScope::activeTitikIds($user);

        return $titikIds[0] ?? null;
    }

    // ── 4. Verifikasi Ritase Security (TD-E10, TD-F5) ────────────────────────

    public function antreanRitase(Request $request)
    {
        $titikIds = KaryawanTitikScope::activeTitikIds($request->user());

        $ritases = Ritase::with(['armada', 'ruteTarif', 'proyek', 'titik', 'muatan', 'verifikasiLogistik', 'verifikasiSecurity', 'timbang'])
            ->when($titikIds, fn ($q, $ids) => $q->whereIn('titik_id', $ids))
            ->where(function ($q) {
                $q->whereHas('verifikasiLogistik', fn ($v) => $v->where('status', 'terverifikasi'))
                    ->orWhere('wajib_jembatan_timbang', true);
            })
            ->whereDoesntHave('verifikasiSecurity')
            ->latest('tanggal')
            ->latest('created_at')
            ->take(50)
            ->get();

        $items = $ritases->map(fn (Ritase $r) => [
            'id' => $r->id,
            'tanggal' => $r->tanggal?->toDateString(),
            'kategori' => $r->kategori,
            'material' => $r->material,
            'jumlah_rit' => $r->jumlah_rit,
            'status' => $r->status,
            'armada_plat' => $r->armada?->plat_nomor,
            'rute' => $r->ruteTarif ? [
                'asal' => $r->ruteTarif->lokasi_asal,
                'tujuan' => $r->ruteTarif->lokasi_tujuan,
            ] : null,
            'wajib_jembatan_timbang' => (bool) $r->wajib_jembatan_timbang,
            'status_verifikasi_logistik' => $r->verifikasiLogistik?->status,
            'status_verifikasi_security' => $r->verifikasiSecurity?->status ?? 'menunggu',
            'jumlah_driver' => $r->muatan?->jumlah_driver ?? (float) ($r->jumlah_volume ?: $r->jumlah_rit),
            'jumlah_verifikasi_logistik' => $r->verifikasiLogistik?->jumlah_verifikasi,
        ]);

        return $this->success(['items' => $items], 'Antrean ritase verifikasi security.');
    }

    public function verifikasiRitase(Request $request, $id)
    {
        $validated = $request->validate([
            'checklist' => 'nullable',
            'catatan' => 'nullable|string|max:1000',
            'foto' => 'nullable|image|max:10240',
        ]);

        $ritase = Ritase::findOrFail($id);
        $user = $request->user();

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('security/ritase/'.now()->format('Y/m'), 'public');
        }

        $checklist = $validated['checklist'] ?? null;
        if (is_string($checklist)) {
            $checklist = json_decode($checklist, true) ?? [];
        }

        $verifikasi = RitaseVerifikasi::updateOrCreate(
            ['ritase_id' => $ritase->id, 'tahap' => 'security'],
            [
                'status' => 'terverifikasi',
                'checklist' => $checklist,
                'catatan' => $validated['catatan'] ?? null,
                'foto' => $fotoPath,
                'diverifikasi_oleh' => $user->id,
                'diverifikasi_pada' => now(),
            ]
        );

        return $this->success($verifikasi, 'Verifikasi ritase security berhasil.');
    }
}
