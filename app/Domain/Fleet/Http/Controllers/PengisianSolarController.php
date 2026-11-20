<?php

namespace App\Domain\Fleet\Http\Controllers;

use App\Domain\Shared\Actions\RecordAuditLogAction;
use App\Domain\Fleet\Actions\RecordPengisianSolarAction;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaPengisianSolar;
use App\Http\Controllers\Controller;
use App\Traits\FilterableTable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;

/**
 * TD-A4 (Meeting 5 & 6) - Web "Fleet - Pengisian Solar" (`fleet/pengisian-solar`).
 *
 * Driver mengisi ODO/HM + nominal saja (tanpa liter, foto nota opsional).
 * Halaman ini daftar semua pengisian dengan badge "Liter belum diisi" /
 * "Nota belum lengkap" dan form lengkapi: isi liter, unggah/ganti foto nota,
 * koreksi nominal. Setiap koreksi tercatat di audit log (nilai sebelum/sesudah).
 *
 * Permission `manage pengisian solar` (Ketua Armada, Ketua Divisi Armada,
 * Admin Keuangan, Owner).
 */
class PengisianSolarController extends Controller
{
    use FilterableTable;

    public function __construct(private RecordAuditLogAction $recordAuditLog)
    {
    }

    public function index(Request $request)
    {
        $query = ArmadaPengisianSolar::query()
            ->with(['armada', 'karyawan', 'dicatatOleh', 'diperbaruiOleh', 'bbmLog']);

        if ($request->user()->unit_bisnis_id) {
            $unitId = $request->user()->unit_bisnis_id;
            $query->whereHas('armada', fn ($q) => $q->where('unit_bisnis_id', $unitId));
        }

        // Filter badge (tanpa_liter / tanpa_nota) ditangani manual karena bukan
        // kolom DB tunggal - dikecualikan dari whitelist trait FilterableTable.
        $filters = (array) $request->input('filters', []);
        $badge = Arr::pull($filters, 'badge');
        $request->merge(['filters' => $filters]);

        $columns = [
            'armada' => ['relation' => 'armada', 'column' => 'id', 'type' => 'exact'],
            'tanggal' => ['type' => 'date'],
            'nominal_rp' => ['searchable' => false],
            'liter' => ['searchable' => false],
        ];

        $sort = $this->applyTableQuery($query, $request, $columns, ['tanggal' => 'desc']);

        match ($badge) {
            'tanpa_liter' => $query->whereNull('liter'),
            'tanpa_nota' => $query->where('nota_lengkap', false),
            default => null,
        };

        $pengisians = $query->paginate($this->tablePerPage($request, 20))->withQueryString();

        return Inertia::render('Fleet/PengisianSolar/Index', [
            'pengisians' => $pengisians,
            'options' => [
                'armadas' => Armada::orderBy('kode_unit')
                    ->with('currentDriver.karyawan')
                    ->get()
                    ->map(fn (Armada $a) => [
                        'id' => $a->id,
                        'kode_unit' => $a->kode_unit,
                        'plat_nomor' => $a->plat_nomor,
                        'driver_aktif' => $a->currentDriver?->karyawan?->nama,
                    ]),
                'badges' => [
                    ['value' => 'tanpa_liter', 'label' => 'Liter belum diisi'],
                    ['value' => 'tanpa_nota', 'label' => 'Nota belum lengkap'],
                ],
            ],
            'filters' => (array) $request->input('filters', []) + ($badge ? ['badge' => $badge] : []),
            'sort' => $sort['sort'],
            'direction' => $sort['direction'],
        ]);
    }

    public function update(Request $request, ArmadaPengisianSolar $pengisian): RedirectResponse
    {
        $validated = $request->validate([
            'liter' => 'nullable|numeric|min:0.01',
            'nominal_rp' => 'nullable|numeric|min:0.01',
            'foto_nota' => 'nullable|image|max:5120',
            'catatan' => 'nullable|string|max:1000',
        ]);

        $sebelum = $pengisian->only(['liter', 'nominal_rp', 'foto_nota', 'catatan']);

        $fotoNota = $request->hasFile('foto_nota')
            ? $request->file('foto_nota')->store('armada/solar', 'public')
            : null;

        app(RecordPengisianSolarAction::class)->update($pengisian, [
            'liter' => $validated['liter'] ?? null,
            'nominal_rp' => $validated['nominal_rp'] ?? null,
            'foto_nota' => $fotoNota,
            'foto_nota_metadata' => null,
            'catatan' => $validated['catatan'] ?? null,
            'liter_sumber' => isset($validated['liter']) ? 'manual' : null,
            'diperbarui_oleh_id' => $request->user()->id,
            'diverifikasi_pada' => isset($validated['liter']) ? now() : null,
        ]);

        $pengisian->refresh();
        $sesudah = $pengisian->only(['liter', 'nominal_rp', 'foto_nota', 'catatan']);

        $this->recordAuditLog->execute(
            "Melengkapi pengisian solar {$pengisian->armada?->kode_unit} tanggal {$pengisian->tanggal?->format('d-m-Y')}",
            $pengisian,
            'updated',
            ['sebelum' => $sebelum, 'sesudah' => $sesudah],
            'pengisian-solar'
        );

        return back()->with('success', 'Pengisian solar dilengkapi.');
    }
}
