<?php
namespace App\Domain\HR\Services;
use App\Domain\HR\Models\Karyawan;
use App\Domain\HR\Actions\CalculateSalaryAction;
class GeneratePayrollPeriodService
{
    public function generate(int $bulan, int $tahun): void
    {
        $karyawan = Karyawan::where('status', 'aktif')->get();
        foreach ($karyawan as $k) {
            (new CalculateSalaryAction())->execute($k, $bulan, $tahun);
        }
    }
}
