<?php

namespace App\Domain\Fleet\Exports;

use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * Export monitoring armada ke Excel, 4 sheet:
 * 1. Ringkasan (KPI agregat)
 * 2. Per Unit Bisnis (breakdown GCS/CBP/AMP/dst.)
 * 3. Per Unit Armada (detail tiap unit)
 * 4. Rekap Harian (mirror "REKAP HARIAN PERALATAN")
 */
class ArmadaMonitoringExport implements WithMultipleSheets
{
    use Exportable;

    public function __construct(
        private readonly array $ringkasan,
        private readonly array $perUnitBisnis,
        private readonly array $perUnit,
        private readonly array $rekapPerTanggal,
    ) {}

    public function sheets(): array
    {
        return [
            'Ringkasan' => new ArmadaMonitoringRingkasanSheet($this->ringkasan),
            'Per Unit Bisnis' => new ArmadaMonitoringListSheet(
                $this->perUnitBisnis,
                ['unit_bisnis_kode', 'unit_bisnis', 'total_armada', 'total_jam_aktif', 'total_hm', 'total_odo_km', 'total_solar_liter', 'total_ritase', 'total_sewa_jam', 'unit_bermasalah', 'unit_idle'],
                ['Kode', 'Unit Bisnis', 'Jml Armada', 'Total Jam Aktif', 'Total HM', 'Total ODO (km)', 'Total Solar (L)', 'Total Ritase', 'Total Sewa Jam', 'Unit Bermasalah', 'Unit Idle']
            ),
            'Per Unit Armada' => new ArmadaMonitoringListSheet(
                $this->perUnit,
                ['kode_unit', 'plat_nomor', 'jenis', 'tipe_unit', 'unit_bisnis', 'status', 'total_jam_aktif', 'total_hm', 'rasio_hm_jam', 'jam_per_rit', 'total_odo_km', 'total_solar_liter', 'jumlah_rit', 'hari_sejak_aktivitas', 'idle'],
                ['Kode Unit', 'Plat Nomor', 'Jenis', 'Tipe Unit', 'Unit Bisnis', 'Status', 'Jam Aktif', 'HM', 'HM/Jam', 'Jam/Rit', 'ODO (km)', 'Solar (L)', 'Ritase', 'Hari Sejak Aktivitas', 'Idle']
            ),
            'Rekap Harian' => new ArmadaMonitoringListSheet(
                $this->rekapPerTanggal,
                ['tanggal', 'jumlah_unit', 'total_jam_aktif', 'total_hm', 'total_odo_km', 'total_solar_liter', 'jumlah_rit', 'total_sewa_jam'],
                ['Tanggal', 'Jml Unit', 'Jam Aktif', 'HM', 'ODO (km)', 'Solar (L)', 'Ritase', 'Sewa Jam']
            ),
        ];
    }
}
