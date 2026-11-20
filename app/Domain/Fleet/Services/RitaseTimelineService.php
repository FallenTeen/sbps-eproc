<?php

namespace App\Domain\Fleet\Services;

use App\Domain\Fleet\Actions\ApproveRitaseStepAction;
use App\Domain\Fleet\Models\Ritase;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Spatie\Activitylog\Models\Activity;

class RitaseTimelineService
{
    public function __construct(private readonly ApproveRitaseStepAction $approval) {}

    public function for(Ritase $ritase, ?User $actor = null): array
    {
        $ritase->loadMissing([
            'armada',
            'driver',
            'ruteTarif',
            'verifikasiLogistik.verifikator',
            'verifikasiSecurity.verifikator',
            'invoiceItems.invoice',
        ]);

        $logistik = $ritase->verifikasiLogistik;
        $security = $ritase->verifikasiSecurity;
        $approval = $this->approvalActivity($ritase);
        $invoiceItem = $ritase->invoiceItems->sortByDesc('created_at')->first();

        $logistikDone = $logistik?->status === 'terverifikasi';
        $securityDone = $security?->status === 'terverifikasi';
        $approved = in_array($ritase->status, ['disetujui', 'ditagih'], true);
        $invoiced = $ritase->status === 'ditagih' || $invoiceItem !== null;

        return [
            $this->event(
                'diajukan',
                'Ritase diajukan',
                $ritase->created_at,
                $ritase->driver?->nama,
                'done',
                'Diajukan',
                $this->routeUrl('fleet.ritase.show', [$ritase->id]),
                $this->submissionDetails($ritase),
            ),
            $this->event(
                'diverifikasi_logistik',
                'Verifikasi logistik',
                $logistikDone ? $logistik?->diverifikasi_pada : null,
                $logistikDone ? $logistik?->verifikator?->name : null,
                $this->stepState('logistik', $logistikDone, $actor),
                $logistikDone ? 'Terverifikasi' : 'Menunggu',
                $logistikDone ? $this->routeUrl('logistik.ritase-verifikasi.index') : null,
                $this->verificationDetails($logistik, $logistikDone),
                $this->stepAction($ritase, 'logistik', 'Setujui Logistik', $logistikDone, $actor),
            ),
            $this->event(
                'diverifikasi_security',
                'Verifikasi security',
                $securityDone ? $security?->diverifikasi_pada : null,
                $securityDone ? $security?->verifikator?->name : null,
                $this->stepState('security', $securityDone, $actor),
                $securityDone ? 'Terverifikasi' : 'Menunggu',
                null,
                $this->verificationDetails($security, $securityDone),
                $this->stepAction($ritase, 'security', 'Setujui Security', $securityDone, $actor),
            ),
            $this->event(
                'disetujui',
                'Persetujuan owner',
                $approval?->created_at ?? ($approved ? $ritase->updated_at : null),
                $approval?->causer?->name ?? ($approved ? 'Sistem' : null),
                $approved ? 'done' : $this->stepState('owner', false, $actor),
                $approved ? 'Disetujui' : 'Menunggu',
                $this->routeUrl('fleet.ritase.show', [$ritase->id]),
                $this->approvalDetails($ritase, $approval),
                $this->stepAction($ritase, 'owner', 'Setujui Owner', $approved, $actor),
            ),
            $this->event(
                'ditagih',
                'Ditagih',
                $invoiceItem?->created_at,
                $invoiceItem?->invoice?->created_at ? ($invoiceItem->invoice->created_by_name ?? 'Keuangan') : null,
                $invoiced ? 'done' : 'pending',
                $invoiced ? 'Ditagih' : 'Menunggu',
                $invoiceItem ? $this->routeUrl('finance.invoice.show', [$invoiceItem->invoice_id]) : null,
                $this->invoiceDetails($invoiceItem),
            ),
        ];
    }

    private function submissionDetails(Ritase $ritase): array
    {
        $rute = $ritase->ruteTarif
            ? "{$ritase->ruteTarif->lokasi_asal} → {$ritase->ruteTarif->lokasi_tujuan}"
            : '-';

        return [
            $this->detail('Tanggal', optional($ritase->tanggal)->format('d M Y') ?: '-'),
            $this->detail('Driver', $ritase->driver?->nama),
            $this->detail('Armada', $ritase->armada?->plat_nomor ?: $ritase->armada?->kode_unit),
            $this->detail('Rute', $rute),
            $this->detail('Jumlah', trim($ritase->jumlah_rit.' '.($ritase->satuan_volume ?? ''))),
            $this->detail('Sumber angka', $ritase->sumber_angka_resmi),
            $this->detail('Catatan', $ritase->catatan),
        ];
    }

    private function verificationDetails(mixed $verifikasi, bool $done): array
    {
        if (! $done || ! $verifikasi) {
            return [$this->detail('Status', 'Menunggu persetujuan')];
        }

        $checklist = is_array($verifikasi->checklist)
            ? implode(', ', $verifikasi->checklist)
            : null;

        return [
            $this->detail('Status', $verifikasi->status),
            $this->detail('Jumlah verifikasi', $verifikasi->jumlah_verifikasi !== null
                ? number_format((float) $verifikasi->jumlah_verifikasi, 1, ',', '.')
                : null),
            $this->detail('Checklist', $checklist),
            $this->detail('Catatan', $verifikasi->catatan),
            $this->detail('Foto', $verifikasi->foto ? 'Lihat foto' : null, $verifikasi->foto_url),
            $this->detail('Waktu', optional($verifikasi->diverifikasi_pada)->format('d M Y H:i') ?: null),
        ];
    }

    private function approvalDetails(Ritase $ritase, ?Activity $approval): array
    {
        $catatan = $approval?->properties['catatan'] ?? null;

        return [
            $this->detail('Status ritase', $ritase->status),
            $this->detail('Catatan persetujuan', $catatan),
            $this->detail('Waktu', $approval?->created_at
                ? $approval->created_at->format('d M Y H:i')
                : (in_array($ritase->status, ['disetujui', 'ditagih'], true)
                    ? optional($ritase->updated_at)->format('d M Y H:i')
                    : null)),
        ];
    }

    private function invoiceDetails(mixed $invoiceItem): array
    {
        if (! $invoiceItem) {
            return [$this->detail('Status', 'Belum ditagih')];
        }

        return [
            $this->detail('Kode invoice', $invoiceItem->invoice?->kode_invoice),
            $this->detail('Tanggal terbit', optional($invoiceItem->invoice?->tanggal_terbit)->format('d M Y') ?: null),
            $this->detail('Subtotal', $invoiceItem->subtotal !== null
                ? 'Rp '.number_format((float) $invoiceItem->subtotal, 0, ',', '.')
                : null),
        ];
    }

    private function detail(string $label, mixed $value, ?string $url = null): array
    {
        return [
            'label' => $label,
            'value' => $value,
            'url' => $url,
        ];
    }

    private function stepState(string $step, bool $done, ?User $actor): string
    {
        if ($done) {
            return 'done';
        }

        return $actor && $this->approval->canApprove($step, $actor) ? 'current' : 'pending';
    }

    private function stepAction(Ritase $ritase, string $step, string $label, bool $done, ?User $actor): ?array
    {
        if ($done || ! $actor || ! $this->approval->canApprove($step, $actor)) {
            return null;
        }

        $route = $this->routeUrl('fleet.ritase.approve-step', [$ritase->id, $step]);

        if (! $route) {
            return null;
        }

        return [
            'step' => $step,
            'label' => $label,
            'route' => $route,
        ];
    }

    private function approvalActivity(Ritase $ritase): ?Activity
    {
        $subjectTypes = array_values(array_unique([Ritase::class, $ritase->getMorphClass()]));

        return Activity::query()
            ->whereIn('subject_type', $subjectTypes)
            ->where('subject_id', $ritase->id)
            ->where('description', 'ritase.disetujui')
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
        array $details = [],
        ?array $action = null,
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
            'details' => $details,
            'action' => $action,
        ];
    }

    private function routeUrl(string $name, ?array $parameters = null): ?string
    {
        if (! Route::has($name)) {
            return null;
        }

        return $parameters === null ? route($name) : route($name, $parameters);
    }
}
