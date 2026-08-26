<?php

namespace App\Policies;

use App\Domain\Finance\Models\Invoice;
use App\Models\User;

class InvoicePolicy
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
            'Ketua Divisi Kontraktor',
            'Ketua Divisi Finance',
            'Ketua Divisi Keuangan',
        ])
            || $user->hasPermissionTo('manage finance')
            || $user->hasPermissionTo('manage invoice')
            || $user->hasPermissionTo('view invoice')
            || $user->hasPermissionTo('view finance');
    }

    public function view(User $user, Invoice $invoice): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasRole([
            'Admin Keuangan',
            'Ketua Divisi Kontraktor',
            'Ketua Divisi Finance',
            'Ketua Divisi Keuangan',
        ])
            || $user->hasPermissionTo('manage finance')
            || $user->hasPermissionTo('manage invoice');
    }

    public function update(User $user, Invoice $invoice): bool
    {
        if ($user->hasRole(['Admin Keuangan', 'Ketua Divisi Finance', 'Ketua Divisi Keuangan'])
            || $user->hasPermissionTo('manage finance')) {
            return true;
        }

        if ($user->hasRole('Ketua Divisi Kontraktor')) {
            $invoice->loadMissing('proyek');

            // Hanya untuk proyek kontrak klien
            return $invoice->proyek?->tipe_proyek === 'kontrak_klien';
        }

        return false;
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        return $user->hasRole('Admin Keuangan') || $user->hasPermissionTo('manage finance');
    }

    public function send(User $user, Invoice $invoice): bool
    {
        return $this->update($user, $invoice);
    }
}
