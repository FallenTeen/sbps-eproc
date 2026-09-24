<?php

namespace App\Domain\Fleet\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Sheet ringkasan KPI agregat monitoring armada — ditampilkan sebagai
 * pasangan label/nilai, satu baris per metrik.
 */
class ArmadaMonitoringRingkasanSheet implements FromArray, ShouldAutoSize, WithStyles
{
    private const LABEL = [
        'total_armada' => 'Total Armada',
        'total_hari_unit_operasi' => 'Total Hari Operasi (Unit x Hari)',
        'total_jam_aktif' => 'Total Jam Aktif',
        'total_hm' => 'Total HM',
        'rasio_hm_jam' => 'Rasio HM/Jam',
        'total_odo_km' => 'Total ODO (km)',
        'total_solar_liter' => 'Total Solar (L)',
        'total_ritase' => 'Total Ritase',
        'total_sewa_jam' => 'Total Sewa Jam',
        'unit_bermasalah' => 'Unit Bermasalah',
        'belum_checklist_hari_ini' => 'Belum Checklist Hari Ini',
        'downtime_aktif' => 'Downtime Aktif',
        'servis_menunggu' => 'Servis Menunggu',
        'unit_idle' => 'Unit Idle',
    ];

    public function __construct(private readonly array $ringkasan) {}

    public function array(): array
    {
        $rows = [['Metrik', 'Nilai']];

        foreach (self::LABEL as $key => $label) {
            $rows[] = [$label, $this->ringkasan[$key] ?? '-'];
        }

        return $rows;
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
