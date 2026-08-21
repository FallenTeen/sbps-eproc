<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;

class AuditLogExport implements FromCollection, ShouldAutoSize, WithHeadings
{
    use Exportable;

    protected Collection $logs;

    public function __construct(Collection $logs)
    {
        $this->logs = $logs;
    }

    public function headings(): array
    {
        return [
            'Waktu',
            'User',
            'Model',
            'Subject ID',
            'Aksi',
            'Deskripsi',
            'IP',
        ];
    }

    public function collection(): Collection
    {
        return $this->logs->map(fn ($log) => [
            $log->created_at ? $log->created_at->format('Y-m-d H:i:s') : '-',
            $log->causer?->name ?? 'System',
            $log->subject_type ? class_basename($log->subject_type) : '-',
            $log->subject_id ?? '-',
            $log->event ?? '-',
            $log->description ?? '-',
            $log->properties['ip'] ?? '-',
        ]);
    }
}
