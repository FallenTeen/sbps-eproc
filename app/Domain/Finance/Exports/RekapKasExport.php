<?php

namespace App\Domain\Finance\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

/**
 * Export Excel (.xlsx) rekap pemasukan & pengeluaran.
 * Layout: judul (merged) → header (bold, warna) → data → baris total.
 */
class RekapKasExport implements FromArray, ShouldAutoSize, WithTitle, WithEvents
{
    /**
     * @param  array<int, string>  $headings
     * @param  array<int, array<int, mixed>>  $rows
     * @param  array<int, array{0: string, 1: float}>  $totals  [label, jumlah]
     */
    public function __construct(
        private readonly array $headings,
        private readonly array $rows,
        private readonly array $totals,
        private readonly string $title = 'Rekapitulasi Pemasukan & Pengeluaran',
        private readonly string $sheetName = 'Rekap',
    ) {}

    public function title(): string
    {
        return $this->sheetName;
    }

    public function array(): array
    {
        return array_merge(
            [[$this->title], []],
            [$this->headings],
            $this->rows,
            $this->totalsRows(),
        );
    }

    protected function totalsRows(): array
    {
        $width = count($this->headings);
        $jumlahIndex = $this->jumlahColumnIndex();

        $out = [[]];

        foreach ($this->totals as [$label, $value]) {
            $row = array_fill(0, $width, '');

            if ($jumlahIndex >= 1) {
                $row[$jumlahIndex - 1] = $label;
                $row[$jumlahIndex] = $value;
            } else {
                $row[0] = $label;
            }

            $out[] = $row;
        }

        return $out;
    }

    protected function jumlahColumnIndex(): int
    {
        foreach ($this->headings as $i => $heading) {
            if (str_contains(strtolower((string) $heading), 'jumlah')) {
                return $i;
            }
        }

        return -1;
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $width = max(1, count($this->headings));

                $lastCol = $sheet->getCell([$width, 1])->getColumn();
                $jumlahCol = $this->jumlahColumnIndex() >= 0
                    ? $sheet->getCell([$this->jumlahColumnIndex() + 1, 1])->getColumn()
                    : null;

                // Judul (baris 1), merged & di-tengah
                $sheet->mergeCells("A1:{$lastCol}1");
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
                $sheet->getStyle('A1')
                    ->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // Header (baris 3): bold + latar biru muda, border
                $sheet->getStyle("A3:{$lastCol}3")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => '4472C4'],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
                ]);

                // Border tipis seluruh tabel data + total
                $lastRow = $sheet->getHighestRow();
                $sheet->getStyle("A3:{$lastCol}{$lastRow}")->applyFromArray([
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
                ]);

                // Format rupiah kolom jumlah (data + total) + header rata tengah
                if ($jumlahCol) {
                    $sheet->getStyle("{$jumlahCol}4:{$jumlahCol}{$lastRow}")
                        ->getNumberFormat()
                        ->setFormatCode('"Rp "#,##0.00');
                    $sheet->getStyle("{$jumlahCol}4:{$jumlahCol}{$lastRow}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                    $sheet->getStyle("{$jumlahCol}3")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_CENTER);
                }

                // Baris total: bold + latar terang
                if (! empty($this->totals)) {
                    $firstTotal = $lastRow - count($this->totals) + 1;
                    $sheet->getStyle("A{$firstTotal}:{$lastCol}{$lastRow}")
                        ->getFont()->setBold(true);
                    $sheet->getStyle("A{$firstTotal}:{$lastCol}{$lastRow}")
                        ->getFill()->applyFromArray([
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => ['rgb' => 'EEF2FB'],
                        ]);
                }

                // Freeze header
                $sheet->freezePane('A4');
            },
        ];
    }
}
