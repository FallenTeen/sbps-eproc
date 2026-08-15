<?php

namespace App\Policies;

use App\Models\User;
use App\Domain\Finance\Models\MutasiKasBank;

/**
 * CATATAN DESAIN:
 * MutasiKasBank adalah read-only ledger. Mutasi tercipta OTOMATIS dari transaksi lain
 * (Pembayaran PO, Pembayaran Klien, Transfer Kas, Payroll).
 *
 * Policy ini HANYA untuk ability: viewAny, view, report.
 * Tidak ada create/update/delete karena tidak dibuat manual.
 */
class MutasiKasBankPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('Owner')) {
            return true;
        }
        return null;
    }

    public function viewAny(User $user): bool
    {
        return $user->hasRole([
                    'Admin Keuangan',
                    'Ketua Divisi Finance',
                    'Ketua Divisi Keuangan',
                ])
            || $user->hasPermissionTo('manage finance')
            || $user->hasPermissionTo('view finance')
            || $user->hasPermissionTo('manage kas')
            || $user->hasPermissionTo('view kas');
    }

    public function view(User $user, MutasiKasBank $mutasi): bool
    {
        if (!$this->viewAny($user)) {
            return false;
        }

        return $this->unitBisnisAllowed($user, $mutasi->akun_kas_bank_id);
    }

    /**
     * Laporan mutasi per periode (report) - akses sama dengan viewAny,
     * scoping per unit dilakukan di controller.
     */
    public function report(User $user): bool
    {
        return $this->viewAny($user);
    }

    /**
     * Rekapitulasi saldo per akun (saldo) - akses sama dengan viewAny.
     */
    public function saldo(User $user): bool
    {
        return $this->viewAny($user);
    }

    protected function unitBisnisAllowed(User $user, ?string $akunKasBankId): bool
    {
        if ($user->hasRole(['Admin Keuangan', 'Ketua Divisi Finance', 'Ketua Divisi Keuangan'])) {
            return true;
        }
        if (!$user->unit_bisnis_id || !$akunKasBankId) {
            return true;
        }

        // Cari unit_bisnis_id dari akun kas bank
        $akun = \App\Domain\Finance\Models\AkunKasBank::find($akunKasBankId);
        if (!$akun) {
            return false;
        }
        return $user->unit_bisnis_id === $akun->unit_bisnis_id;
    }
}