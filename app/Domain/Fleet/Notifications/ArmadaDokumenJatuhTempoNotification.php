<?php

namespace App\Domain\Fleet\Notifications;

use App\Domain\Fleet\Models\ArmadaDokumenBerkala;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ArmadaDokumenJatuhTempoNotification extends Notification
{
    use Queueable;

    public function __construct(
        public ArmadaDokumenBerkala $dokumen,
        public int $sisaHari,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $statusText = $this->sisaHari < 0
            ? 'telah lewat jatuh tempo '.abs($this->sisaHari).' hari'
            : ($this->sisaHari === 0 ? 'jatuh tempo hari ini' : "akan jatuh tempo dalam {$this->sisaHari} hari");

        return [
            'title' => "Peringatan Dokumen {$this->dokumen->jenis_label}",
            'message' => "Dokumen {$this->dokumen->jenis_label} unit {$this->dokumen->armada->plat_nomor} {$statusText} ({$this->dokumen->tanggal_jatuh_tempo->format('d/m/Y')}).",
            'type' => 'armada_dokumen',
            'category' => 'armada',
            'armada_id' => $this->dokumen->armada_id,
            'dokumen_id' => $this->dokumen->id,
            'sisa_hari' => $this->sisaHari,
            'status' => $this->dokumen->status_dokumen,
        ];
    }
}
