<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RitaseVerifikasi;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ApproveRitaseStepAction
{
    private const STEPS = ['logistik', 'security', 'owner'];

    public function execute(Ritase $ritase, string $step, User $actor, ?string $catatan = null): Ritase
    {
        if (! in_array($step, self::STEPS, true)) {
            throw new InvalidArgumentException("Step ritase tidak dikenal: {$step}");
        }

        if (! $this->canApprove($step, $actor)) {
            throw new AuthorizationException('Role ini tidak dapat menyetujui step tersebut.');
        }

        DB::transaction(function () use ($ritase, $step, $actor, $catatan) {
            if ($step === 'owner') {
                $this->approveOwner($ritase, $actor, $catatan);

                return;
            }

            $this->approveVerification($ritase, $step, $actor, $catatan);
        });

        return $ritase->fresh();
    }

    public function canApprove(string $step, User $actor): bool
    {
        return match ($step) {
            'logistik' => $actor->hasPermissionTo('verify ritase logistik') || $actor->hasPermissionTo('manage timbang'),
            'security' => $actor->hasPermissionTo('verify ritase security'),
            'owner' => $actor->hasRole(['Owner', 'Kepala Divisi Armada', 'Ketua Armada'])
                || $actor->hasPermissionTo('manage fleet'),
            default => false,
        };
    }

    private function approveOwner(Ritase $ritase, User $actor, ?string $catatan): void
    {
        if (in_array($ritase->status, ['disetujui', 'ditagih'], true)) {
            return;
        }

        $ritase->update(['status' => 'disetujui']);

        activity()
            ->performedOn($ritase)
            ->causedBy($actor)
            ->withProperties(['step' => 'owner', 'catatan' => $catatan])
            ->log('ritase.disetujui');
    }

    private function approveVerification(Ritase $ritase, string $step, User $actor, ?string $catatan): void
    {
        $verifikasi = RitaseVerifikasi::firstOrNew([
            'ritase_id' => $ritase->id,
            'tahap' => $step,
        ]);

        if ($verifikasi->exists && $verifikasi->status === 'terverifikasi') {
            return;
        }

        $verifikasi->fill([
            'status' => 'terverifikasi',
            'catatan' => $catatan ?: $verifikasi->catatan,
            'diverifikasi_oleh' => $actor->id,
            'diverifikasi_pada' => now(),
        ])->save();

        activity()
            ->performedOn($ritase)
            ->causedBy($actor)
            ->withProperties(['step' => $step, 'catatan' => $catatan])
            ->log("ritase.{$step}.disetujui");
    }
}
