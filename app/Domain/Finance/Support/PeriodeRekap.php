<?php

namespace App\Domain\Finance\Support;

use Carbon\Carbon;
use Carbon\CarbonImmutable;

class PeriodeRekap
{
    public const PRESETS = [
        'hari_ini',
        '7_hari',
        'minggu_ini',
        'bulan_ini',
        'bulan_lalu',
        'kuartal',
        'tahun_ini',
        'kustom',
        'semua',
    ];

    /**
     * Resolusi periode fleksibel (TD-D2): preset atau rentang kustom.
     *
     * @return array{periode: string, tanggal_mulai: ?Carbon, tanggal_sampai: ?Carbon, label: string}
     */
    public static function resolve(?string $periode, ?string $tanggalMulai, ?string $tanggalSampai): array
    {
        $periode = in_array($periode, self::PRESETS, true) ? $periode : 'semua';
        $now = CarbonImmutable::now();

        [$mulai, $sampai, $label] = match ($periode) {
            'hari_ini' => [$now->startOfDay(), $now->endOfDay(), 'Hari Ini'],
            '7_hari' => [$now->subDays(6)->startOfDay(), $now->endOfDay(), '7 Hari Terakhir'],
            'minggu_ini' => [$now->startOfWeek(), $now->endOfWeek(), 'Minggu Ini'],
            'bulan_ini' => [$now->startOfMonth(), $now->endOfMonth(), $now->translatedFormat('F Y')],
            'bulan_lalu' => [$now->subMonth()->startOfMonth(), $now->subMonth()->endOfMonth(), $now->subMonth()->translatedFormat('F Y')],
            'kuartal' => [$now->startOfQuarter(), $now->endOfQuarter(), 'Kuartal '.$now->quarter.' '.$now->year],
            'tahun_ini' => [$now->startOfYear(), $now->endOfYear(), 'Tahun '.$now->year],
            'kustom' => self::kustom($tanggalMulai, $tanggalSampai),
            default => [null, null, 'Seluruh Periode'],
        };

        return [
            'periode' => $periode,
            'tanggal_mulai' => $mulai ? Carbon::instance($mulai)->startOfDay() : null,
            'tanggal_sampai' => $sampai ? Carbon::instance($sampai)->endOfDay() : null,
            'label' => $label,
        ];
    }

    protected static function kustom(?string $tanggalMulai, ?string $tanggalSampai): array
    {
        $mulai = $tanggalMulai ? Carbon::parse($tanggalMulai) : null;
        $sampai = $tanggalSampai ? Carbon::parse($tanggalSampai) : null;

        if ($mulai && $sampai && $mulai->gt($sampai)) {
            [$mulai, $sampai] = [$sampai, $mulai];
        }

        $label = 'Seluruh Periode';
        if ($mulai && $sampai) {
            $label = $mulai->translatedFormat('d M Y').' - '.$sampai->translatedFormat('d M Y');
        } elseif ($mulai) {
            $label = 'Sejak '.$mulai->translatedFormat('d M Y');
        } elseif ($sampai) {
            $label = 'Sampai '.$sampai->translatedFormat('d M Y');
        }

        return [$mulai, $sampai, $label];
    }
}
