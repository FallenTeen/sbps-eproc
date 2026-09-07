<?php

namespace App\Policies;

use App\Domain\Fleet\Models\PengajuanServisArmada;
use App\Models\User;

/**
 * Bagian 21.8 — Policy per-bagian form servis armada.
 *
 * Semua role terkait boleh melihat (read-all), tapi hanya peran tertentu yang
 * boleh mengedit bagian miliknya (edit-scoped), sesuai tabel "Bisa diedit oleh".
 */
class PengajuanServisPolicy
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
        return $user->hasAnyPermission([
            'view fleet service',
            'manage fleet service',
            'approve fleet service',
            'manage sparepart',
            'view fleet',
        ]);
    }

    public function view(User $user, PengajuanServisArmada $pengajuan): bool
    {
        return $this->viewAny($user)
            || $pengajuan->diajukan_oleh === $user->id
            || ($pengajuan->armada && $pengajuan->armada->isActivePicFor($user->karyawan));
    }

    /**
     * Bagian 1 — submit ajuan (mobile/web). PIC armada atau pemegang
     * permission `manage fleet service`/`submit fleet service`.
     */
    public function submit(User $user): bool
    {
        return $user->hasAnyPermission([
            'manage fleet service',
            'submit fleet service',
            'manage fleet',
        ]);
    }

    /**
     * Bagian 1 — edit ajuan. Hanya pembuat, sebelum status pindah dari `diajukan`.
     */
    public function editAjuan(User $user, PengajuanServisArmada $pengajuan): bool
    {
        return $pengajuan->diajukan_oleh === $user->id
            && $pengajuan->status->getValue() === 'diajukan';
    }

    /**
     * Bagian 2 — approval. Hanya Ketua Divisi Armada.
     */
    public function approve(User $user, PengajuanServisArmada $pengajuan): bool
    {
        return $user->hasAnyPermission(['approve fleet service', 'approve procurement fleet'])
            && $pengajuan->status->getValue() === 'diajukan';
    }

    /**
     * Bagian 3 — pengerjaan (Workshop). Hanya role Workshop, setelah status `disetujui`.
     */
    public function assignWorkshop(User $user, PengajuanServisArmada $pengajuan): bool
    {
        return $user->hasPermissionTo('manage fleet service')
            && in_array($pengajuan->status->getValue(), ['disetujui', 'dikerjakan', 'menunggu_sparepart', 'sparepart_tersedia']);
    }

    /**
     * Bagian 3 — ajukan sparepart (Workshop → Inventory).
     */
    public function requestSparepart(User $user, PengajuanServisArmada $pengajuan): bool
    {
        return $user->hasPermissionTo('manage fleet service')
            && in_array($pengajuan->status->getValue(), ['disetujui', 'dikerjakan', 'menunggu_sparepart']);
    }

    /**
     * Bagian 4 — catat pengadaan sparepart. Hanya Inventory, kalau butuh_sparepart.
     */
    public function recordSparepart(User $user, PengajuanServisArmada $pengajuan): bool
    {
        return $user->hasPermissionTo('manage sparepart')
            && $pengajuan->butuh_sparepart === true
            && in_array($pengajuan->status->getValue(), ['menunggu_sparepart', 'sparepart_tersedia']);
    }

    /**
     * Selesai — Workshop (atau approver) menutup servis.
     */
    public function complete(User $user, PengajuanServisArmada $pengajuan): bool
    {
        return $user->hasAnyPermission(['manage fleet service', 'approve fleet service'])
            && in_array($pengajuan->status->getValue(), ['dikerjakan', 'sparepart_tersedia', 'menunggu_sparepart']);
    }

    public function delete(User $user, PengajuanServisArmada $pengajuan): bool
    {
        return $pengajuan->diajukan_oleh === $user->id
            && $pengajuan->status->getValue() === 'diajukan';
    }
}
