<?php

namespace App\Domain\Fleet\Services;

use App\Domain\Fleet\Models\Ritase;
use Illuminate\Support\Facades\Route;
use Spatie\Activitylog\Models\Activity;

class RitaseTimelineService
{
    public function for(Ritase $ritase): array
    {
        $ritase->loadMissing([
            'driver',
            'verifikasiLogistik.verifikator',
            'verifikasiSecurity.verifikator',
            'invoiceItems.invoice',
        ]);

        $logistik = $ritase->verifikasiLogistik;
        $security = $ritase->verifikasiSecurity;
        $approval = $this->approvalActivity($ritase);
        $invoiceItem = $ritase->invoiceItems->sortByDesc('created_at')->first();

        $approved = in_array($ritase->status, ['disetujui', 'ditagih'], true);
        $invoiced = $ritase->status === 'ditagih' || $invoiceItem !== null;

        $logistikState = $logistik ? 'done' : ($approved ? 'skipped' : 'current');
        $securityState = $security ? 'done' : ($approved ? 'skipped' : ($logistik ? 'current' : 'pending'));
        $approvalState = $approved ? 'done' : ($logistik && $security ? 'current' : 'pending');

        return [
            $this->event(
                'diajukan',
                'Ritase diajukan',
                $ritase->created_at,
                $ritase->driver?->name,
                'done',
                'Diajukan',
                $this->routeUrl('fleet.ritase.show', $ritase->id),
            ),
            $this->event(
                'diverifikasi_logistik',
                'Verifikasi logistik',
                $logistik?->diverifikasi_pada,
                $logistik?->verifikator?->name,
                $logistikState,
                $logistik ? 'Terverifikasi' : ($logistikState === 'skipped' ? 'Terlewat' : 'Menunggu'),
                $logistik ? $this->routeUrl('logistik.ritase-verifikasi.index') : null,
            ),
            $this->event(
                'diverifikasi_security',
                'Verifikasi security',
                $security?->diverifikasi_pada,
                $security?->verifikator?->name,
                $securityState,
                $security ? 'Terverifikasi' : ($securityState === 'skipped' ? 'Terlewat' : 'Menunggu'),
                null,
            ),
            $this->event(
                'disetujui',
                'Disetujui Ketua Armada',
                $approval?->created_at ?? ($approved ? $ritase->updated_at : null),
                $approval?->causer?->name ?? ($approved ? 'Sistem' : null),
                $approvalState,
                $approved ? 'Disetujui' : 'Menunggu',
                $this->routeUrl('fleet.ritase.show', $ritase->id),
            ),
            $this->event(
                'ditagih',
                'Ditagih',
                $invoiceItem?->created_at,
                $invoiceItem?->invoice?->created_at ? ($invoiceItem->invoice->created_by_name ?? 'Keuangan') : null,
                $invoiced ? 'done' : 'pending',
                $invoiced ? 'Ditagih' : 'Menunggu',
                $invoiceItem ? $this->routeUrl('finance.invoice.show', $invoiceItem->invoice_id) : null,
            ),
        ];
    }

    private function approvalActivity(Ritase $ritase): ?Activity
    {
        $subjectTypes = array_values(array_unique([Ritase::class, $ritase->getMorphClass()]));

        return Activity::query()
            ->whereIn('subject_type', $subjectTypes)
            ->where('subject_id', $ritase->id)
            ->whereIn('description', ['ritase.disetujui', 'Ritase disetujui.'])
            ->latest()
            ->first();
    }

    private function event(
        string $key,
        string $label,
        mixed $at,
        ?string $actor,
        string $state,
        string $badge,
        ?string $detailRoute,
    ): array {
        return [
            'key' => $key,
            'label' => $label,
            'at' => $at?->toISOString(),
            'actor' => $actor,
            'state' => $state,
            'badge' => $badge,
            'detail_route' => $detailRoute,
            'can_open' => $detailRoute !== null,
        ];
    }

    private function routeUrl(string $name, ?string $parameter = null): ?string
    {
        if (! Route::has($name)) {
            return null;
        }

        return $parameter === null ? route($name) : route($name, $parameter);
    }
}
