<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\DowntimeLog;
use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\SewaAlatJam;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Bagian 21.11 — Monitoring Armada: metrik utilisasi.
 *
 * Menghitung on-the-fly (prinsip Bagian 0 #1 — tidak ada agregat statis):
 * - total jam aktif (alat berat: jam_selesai_operasi - jam_mulai_operasi;
 *   armada jalan: durasi antar check-in/out — saat ini memakai baris checklist
 *   yang punya jam operasi, sisanya dihitung lewat hari operasi + ODO).
 * - HM/Jam: rasio pemakaian HM (hm_odo) terhadap jam kalender aktif.
 * - rekap durasi per tanggal (mirror "REKAP HARIAN PERALATAN").
 *
 * Dipakai oleh Dashboard Armada web dan endpoint mobile
 * `dashboard/armada-status` / `dashboard/armada-monitoring`.
 */
class CalculateArmadaUtilizationAction
{
    /**
     * @param  string|null  $dari  tanggal awal (Y-m-d, default 30 hari ke belakang)
     * @param  string|null  $sampai  tanggal akhir (Y-m-d, default hari ini)
     * @param  string|null  $unitBisnisId  filter unit bisnis
     */
    public function execute(?string $dari = null, ?string $sampai = null, ?string $unitBisnisId = null): array
    {
        $dari = $dari ? Carbon::parse($dari) : now()->subDays(29)->startOfDay();
        $sampai = ($sampai ? Carbon::parse($sampai) : now())->endOfDay();

        $armadas = Armada::with('unitBisnis')
            ->when($unitBisnisId, fn ($q) => $q->byUnit($unitBisnisId))
            ->orderBy('kode_unit')
            ->get();

        $perUnit = $this->perUnit($armadas, $dari, $sampai);

        return [
            'tanggal_dari' => $dari->toDateString(),
            'tanggal_sampai' => $sampai->toDateString(),
            'ringkasan' => $this->ringkasan($armadas, $perUnit),
            'rekap_per_tanggal' => $this->rekapPerTanggal($armadas, $dari, $sampai),
            'per_unit' => $perUnit,
        ];
    }

    /**
     * Ringkasan KPI seluruh scope.
     */
    private function ringkasan(Collection $armadas, array $perUnit): array
    {
        $sum = fn (string $key) => round(collect($perUnit)->sum($key), 2);

        $totalJamAktif = $sum('total_jam_aktif');
        $totalHm = $sum('total_hm');
        $rasioHmJam = $totalJamAktif > 0 ? round($totalHm / $totalJamAktif, 2) : null;

        return [
            'total_armada' => $armadas->count(),
            'total_hari_unit_operasi' => (int) collect($perUnit)->sum('jumlah_hari_operasi'),
            'total_jam_aktif' => $totalJamAktif,
            'total_hm' => $totalHm,
            'rasio_hm_jam' => $rasioHmJam,
            'total_odo_km' => $sum('total_odo_km'),
            'total_solar_liter' => $sum('total_solar_liter'),
            'total_ritase' => (int) collect($perUnit)->sum('jumlah_rit'),
            'total_sewa_jam' => $sum('total_sewa_jam'),
            'unit_bermasalah' => collect($perUnit)->filter(fn ($u) => $u['kondisi_terakhir'] && ! $u['kondisi_terakhir']['kondisi_baik'])->count(),
            'belum_checklist_hari_ini' => collect($perUnit)->filter(fn ($u) => $u['aktif'] && ! $u['checklist_hari_ini'])->count(),
            'downtime_aktif' => collect($perUnit)->filter(fn ($u) => $u['downtime_aktif'])->count(),
            'servis_menunggu' => collect($perUnit)->filter(fn ($u) => $u['servis_menunggu'])->count(),
        ];
    }

    /**
     * Baris monitoring per unit + metrik utilisasi dalam rentang tanggal.
     */
    private function perUnit(Collection $armadas, Carbon $dari, Carbon $sampai): array
    {
        $ids = $armadas->pluck('id');

        $checklists = ArmadaChecklistHarian::where('checkable_type', Armada::class)
            ->whereIn('checkable_id', $ids)
            ->whereBetween('tanggal', [$dari->toDateString(), $sampai->toDateString()])
            ->get()
            ->groupBy('checkable_id');

        $ritases = Ritase::whereIn('armada_id', $ids)
            ->whereBetween('tanggal', [$dari->toDateString(), $sampai->toDateString()])
            ->get()
            ->groupBy('armada_id');

        $sewas = SewaAlatJam::whereIn('armada_id', $ids)
            ->whereBetween('tanggal', [$dari->toDateString(), $sampai->toDateString()])
            ->get()
            ->groupBy('armada_id');

        $downtimeAktifIds = DowntimeLog::where('serviceable_type', Armada::class)
            ->whereIn('serviceable_id', $ids)
            ->whereNull('selesai')
            ->pluck('serviceable_id');

        $servisMenungguIds = PengajuanServisArmada::whereIn('armada_id', $ids)
            ->whereIn('status', ['diajukan', 'disetujui', 'dikerjakan'])
            ->pluck('armada_id');

        $checklistHariIniIds = ArmadaChecklistHarian::where('checkable_type', Armada::class)
            ->whereIn('checkable_id', $ids)
            ->whereDate('tanggal', now()->toDateString())
            ->pluck('checkable_id');

        return $armadas->map(function (Armada $armada) use (
            $checklists, $ritases, $sewas,
            $downtimeAktifIds, $servisMenungguIds, $checklistHariIniIds,
        ) {
            $rows = $checklists->get($armada->id, collect());
            $ritaseRows = $ritases->get($armada->id, collect());
            $sewaRows = $sewas->get($armada->id, collect());

            $totaljam = 0.0;
            $totalHm = 0.0;
            $totalOdo = 0.0;
            $totalSolar = 0.0;
            $tanggalOperasi = collect();

            foreach ($rows as $row) {
                $jam = $this->durasiJam((string) $row->jam_mulai_operasi, (string) $row->jam_selesai_operasi);
                $totaljam += $jam;
                $totalHm += (float) ($row->hm_odo ?? 0);
                $totalOdo += $this->odoDelta($row->odo_pagi, $row->odo_sore);
                $totalSolar += (float) ($row->solar_liter ?? 0);
                $tanggalOperasi->push($row->tanggal->toDateString());
            }

            foreach ($ritaseRows as $r) {
                $tanggalOperasi->push($r->tanggal->toDateString());
            }
            foreach ($sewaRows as $s) {
                $tanggalOperasi->push($s->tanggal->toDateString());
            }

            $kondisiTerakhir = $rows->last();

            return [
                'id' => $armada->id,
                'kode_unit' => $armada->kode_unit,
                'plat_nomor' => $armada->plat_nomor,
                'jenis' => $armada->jenis,
                'tipe_unit' => $armada->tipe_unit,
                'model_tarif' => $armada->model_tarif,
                'status' => $armada->status,
                'aktif' => $armada->status === 'aktif',
                'unit_bisnis' => $armada->unitBisnis?->nama,
                'unit_bisnis_kode' => $armada->unitBisnis?->kode,
                'jumlah_hari_operasi' => $tanggalOperasi->unique()->count(),
                'total_jam_aktif' => round($totaljam, 2),
                'total_hm' => round($totalHm, 2),
                'rasio_hm_jam' => $totaljam > 0 ? round($totalHm / $totaljam, 2) : null,
                'total_odo_km' => round($totalOdo, 2),
                'total_solar_liter' => round($totalSolar, 2),
                'jumlah_rit' => $ritaseRows->sum('jumlah_rit'),
                'total_sewa_jam' => round($sewaRows->sum('jumlah_jam'), 2),
                'kondisi_terakhir' => $kondisiTerakhir ? [
                    'tanggal' => $kondisiTerakhir->tanggal?->toDateString(),
                    'kondisi_baik' => (bool) $kondisiTerakhir->kondisi_baik,
                    'item_bermasalah' => $kondisiTerakhir->item_bermasalah,
                ] : null,
                'checklist_hari_ini' => $checklistHariIniIds->contains($armada->id),
                'downtime_aktif' => $downtimeAktifIds->contains($armada->id),
                'servis_menunggu' => $servisMenungguIds->contains($armada->id),
            ];
        })->values()->all();
    }

    /**
     * Rekap durasi per tanggal: jumlah unit, jam aktif, HM, ODO, solar, ritase.
     */
    private function rekapPerTanggal(Collection $armadas, Carbon $dari, Carbon $sampai): array
    {
        $ids = $armadas->pluck('id');
        $byDate = [];

        $handle = function (array $value, array &$map) {
            $key = $value['tanggal'];
            if (! isset($map[$key])) {
                $map[$key] = [
                    'tanggal' => $key,
                    'jumlah_unit' => [],
                    'total_jam_aktif' => 0.0,
                    'total_hm' => 0.0,
                    'total_odo_km' => 0.0,
                    'total_solar_liter' => 0.0,
                    'jumlah_rit' => 0,
                    'total_sewa_jam' => 0.0,
                ];
            }
            if (! in_array($value['armada_id'], $map[$key]['jumlah_unit'], true)) {
                $map[$key]['jumlah_unit'][] = $value['armada_id'];
            }
            $map[$key]['total_jam_aktif'] += $value['jam_aktif'];
            $map[$key]['total_hm'] += $value['hm'];
            $map[$key]['total_odo_km'] += $value['odo_km'];
            $map[$key]['total_solar_liter'] += $value['solar_liter'];
            $map[$key]['jumlah_rit'] += $value['jumlah_rit'];
            $map[$key]['total_sewa_jam'] += $value['sewa_jam'];
        };

        ArmadaChecklistHarian::where('checkable_type', Armada::class)
            ->whereIn('checkable_id', $ids)
            ->whereBetween('tanggal', [$dari->toDateString(), $sampai->toDateString()])
            ->orderBy('tanggal')
            ->get()
            ->each(function ($row) use (&$byDate, $handle) {
                $handle([
                    'tanggal' => $row->tanggal->toDateString(),
                    'armada_id' => $row->checkable_id,
                    'jam_aktif' => $this->durasiJam((string) $row->jam_mulai_operasi, (string) $row->jam_selesai_operasi),
                    'hm' => (float) ($row->hm_odo ?? 0),
                    'odo_km' => $this->odoDelta($row->odo_pagi, $row->odo_sore),
                    'solar_liter' => (float) ($row->solar_liter ?? 0),
                    'jumlah_rit' => 0,
                    'sewa_jam' => 0.0,
                ], $byDate);
            });

        Ritase::whereIn('armada_id', $ids)
            ->whereBetween('tanggal', [$dari->toDateString(), $sampai->toDateString()])
            ->orderBy('tanggal')
            ->get()
            ->each(function ($row) use (&$byDate, $handle) {
                $handle([
                    'tanggal' => $row->tanggal->toDateString(),
                    'armada_id' => $row->armada_id,
                    'jam_aktif' => 0.0,
                    'hm' => 0.0,
                    'odo_km' => 0.0,
                    'solar_liter' => 0.0,
                    'jumlah_rit' => (int) $row->jumlah_rit,
                    'sewa_jam' => 0.0,
                ], $byDate);
            });

        SewaAlatJam::whereIn('armada_id', $ids)
            ->whereBetween('tanggal', [$dari->toDateString(), $sampai->toDateString()])
            ->orderBy('tanggal')
            ->get()
            ->each(function ($row) use (&$byDate, $handle) {
                $handle([
                    'tanggal' => $row->tanggal->toDateString(),
                    'armada_id' => $row->armada_id,
                    'jam_aktif' => 0.0,
                    'hm' => 0.0,
                    'odo_km' => 0.0,
                    'solar_liter' => 0.0,
                    'jumlah_rit' => 0,
                    'sewa_jam' => (float) $row->jumlah_jam,
                ], $byDate);
            });

        // Pastikan setiap tanggal dalam rentang muncul (termasuk 0) —
        // mirror "REKAP HARIAN PERALATAN" di manual.
        $zeroRow = fn ($tanggal) => [
            'tanggal' => $tanggal,
            'jumlah_unit' => 0,
            'total_jam_aktif' => 0.0,
            'total_hm' => 0.0,
            'total_odo_km' => 0.0,
            'total_solar_liter' => 0.0,
            'jumlah_rit' => 0,
            'total_sewa_jam' => 0.0,
        ];

        $rows = [];
        for ($d = $dari->copy(); $d->lte($sampai); $d->addDay()) {
            $tanggal = $d->toDateString();
            $rows[$tanggal] = $zeroRow($tanggal);
        }

        foreach ($byDate as $key => $d) {
            $rows[$key]['jumlah_unit'] = count($d['jumlah_unit']);
            $rows[$key]['total_jam_aktif'] = round($d['total_jam_aktif'], 2);
            $rows[$key]['total_hm'] = round($d['total_hm'], 2);
            $rows[$key]['total_odo_km'] = round($d['total_odo_km'], 2);
            $rows[$key]['total_solar_liter'] = round($d['total_solar_liter'], 2);
            $rows[$key]['jumlah_rit'] = $d['jumlah_rit'];
            $rows[$key]['total_sewa_jam'] = round($d['total_sewa_jam'], 2);
        }

        return array_values($rows);
    }

    /**
     * Durasi operasi dari jam mulai/selesai (format HH:MM) → jam desimal.
     * Jendela terbalik / tidak valid dianggap 0 (anomali tidak dihitung).
     */
    private function durasiJam(string $mulai, string $selesai): float
    {
        $mulai = substr(trim($mulai), 0, 5);
        $selesai = substr(trim($selesai), 0, 5);

        if (! preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $mulai)
            || ! preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $selesai)) {
            return 0.0;
        }

        [$mulaiJam, $mulaiMenit] = array_map('intval', explode(':', $mulai));
        [$selesaiJam, $selesaiMenit] = array_map('intval', explode(':', $selesai));

        $menit = ($selesaiJam * 60 + $selesaiMenit) - ($mulaiJam * 60 + $mulaiMenit);

        return $menit <= 0 ? 0.0 : round($menit / 60, 2);
    }

    /**
     * Pemakaian ODO (km) dari selisih odo sore − pagi; anomali → 0.
     */
    private function odoDelta($pagi, $sore): float
    {
        if ($pagi === null || $sore === null) {
            return 0.0;
        }

        $delta = (float) $sore - (float) $pagi;

        return $delta < 0 ? 0.0 : round($delta, 2);
    }
}
