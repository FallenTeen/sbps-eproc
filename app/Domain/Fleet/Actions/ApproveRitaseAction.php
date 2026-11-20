<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\Ritase;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

class ApproveRitaseAction
{
    public function execute(Ritase $ritase, ?User $actor = null): Ritase
    {
        $actor ??= auth()->user();

        if (! $actor || ! $this->canApprove($actor)) {
            throw new AuthorizationException('Role ini tidak dapat menyetujui ritase.');
        }

        if ($ritase->status !== 'disetujui') {
            $ritase->update(['status' => 'disetujui']);

            activity()
                ->performedOn($ritase)
                ->causedBy($actor)
                ->log('ritase.disetujui');
        }

        return $ritase->fresh();
    }

    private function canApprove(User $actor): bool
    {
        return $actor->hasRole(['Ketua Armada', 'Kepala Divisi Armada', 'Owner'])
            || $actor->hasPermissionTo('manage fleet');
    }
}
