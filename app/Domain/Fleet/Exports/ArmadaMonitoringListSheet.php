<?php

namespace App\Domain\Fleet\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Sheet generik: mengubah array baris asosiatif menjadi tabel Excel,
 * hanya mengambil $columns yang diminta dengan urutan & $headings yang diberikan.
 */
class ArmadaMonitoringListSheet implements FromArray, ShouldAutoSize, WithHeadings, WithStyles
{
    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @param  array<int, string>  $columns
     * @param  array<int, string>  $headings
     */
    public function __construct(
        private readonly array $rows,
        private readonly array $columns,
        private readonly array $headings,
    ) {}

    public function array(): array
    {
        return array_map(function (array $row) {
            return array_map(function (string $col) use ($row) {
                $value = $row[$col] ?? null;

                if (is_bool($value)) {
                    return $value ? 'Ya' : 'Tidak';
                }

                return $value;
            }, $this->columns);
        }, $this->rows);
    }

    public function headings(): array
    {
        return $this->headings;
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
