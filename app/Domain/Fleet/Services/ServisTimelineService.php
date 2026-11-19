<?php

namespace App\Domain\Fleet\Services;

use App\Domain\Fleet\Models\PengajuanServisArmada;

class ServisTimelineService
{
    private const STEPS = [
        'diajukan',
        'disetujui',
        'dikerjakan',
        'menunggu_sparepart',
        'sparepart_tersedia',
        'selesai',
    ];

    public function for(PengajuanServisArmada $pengajuan): array
    {
        $pengajuan->loadMissing([
            'armada',
            'diajukanOleh',
            'disetujuiOleh',
            'personels',
            'spareparts.bahanBaku',
            'eksternalDetail',
        ]);

        $status = $pengajuan->status->getValue();
        $currentIndex = array_search($status, self::STEPS, true);
        $skipSparepart = ! $pengajuan->butuh_sparepart
            && in_array($status, ['dikerjakan', 'selesai'], true);

        return collect(self::STEPS)->map(function (string $key, int $index) use ($pengajuan, $status, $currentIndex, $skipSparepart) {
            [$state, $badge] = $this->resolveState($key, $index, $status, $currentIndex, $skipSparepart);

            return [
                'step' => $index + 1,
                'key' => $key,
                'label' => $this->label($key),
                'state' => $state,
                'badge' => $badge,
                'at' => $this->at($pengajuan, $key),
                'actor' => $this->actor($pengajuan, $key),
                'details' => $this->details($pengajuan, $key, $status),
                'action' => null,
            ];
        })->values()->all();
    }

    private function resolveState(string $key, int $index, string $status, int|false $currentIndex, bool $skipSparepart): array
    {
        if ($status === 'ditolak' && $key === 'disetujui') {
            return ['skipped', 'Ditolak'];
        }

        if ($skipSparepart && in_array($key, ['menunggu_sparepart', 'sparepart_tersedia'], true)) {
            return ['skipped', 'Tidak perlu'];
        }

        if ($currentIndex === false) {
            return ['pending', 'Menunggu'];
        }

        if ($index < $currentIndex) {
            return ['done', 'Selesai'];
        }

        if ($index === $currentIndex) {
            return ['current', $this->currentBadge($key, $status)];
        }

        return ['pending', 'Menunggu'];
    }

    private function currentBadge(string $key, string $status): string
    {
        if ($status === 'ditolak' && $key === 'diajukan') {
            return 'Diajukan';
        }

        return match ($key) {
            'diajukan' => 'Diajukan',
            'disetujui' => 'Disetujui',
            'dikerjakan' => 'Dikerjakan',
            'menunggu_sparepart' => 'Menunggu Sparepart',
            'sparepart_tersedia' => 'Sparepart Tersedia',
            'selesai' => 'Selesai',
            default => 'Menunggu',
        };
    }

    private function label(string $key): string
    {
        return match ($key) {
            'diajukan' => 'Ajuan Dibuat',
            'disetujui' => 'Persetujuan',
            'dikerjakan' => 'Pengerjaan Dimulai',
            'menunggu_sparepart' => 'Menunggu Sparepart',
            'sparepart_tersedia' => 'Sparepart Tersedia',
            'selesai' => 'Servis Selesai',
            default => $key,
        };
    }

    private function at(PengajuanServisArmada $pengajuan, string $key): ?string
    {
        return match ($key) {
            'diajukan' => $this->date($pengajuan->tanggal_ajuan),
            'disetujui' => $this->date($pengajuan->tanggal_acc),
            'dikerjakan' => $this->date($pengajuan->tanggal_mulai_kerja),
            'selesai' => $this->date($pengajuan->tanggal_selesai_kerja ?? $pengajuan->tanggal_selesai),
            default => null,
        };
    }

    private function actor(PengajuanServisArmada $pengajuan, string $key): string
    {
        return match ($key) {
            'diajukan' => $pengajuan->diajukanOleh?->name ?? '-',
            'disetujui' => $pengajuan->status->getValue() === 'ditolak'
                ? ($pengajuan->disetujuiOleh?->name ?? '-')
                : ($pengajuan->disetujuiOleh?->name ?? '-'),
            'dikerjakan' => $pengajuan->personels->isNotEmpty()
                ? $pengajuan->personels->pluck('nama_personel')->filter()->implode(', ')
                : 'Workshop',
            default => '-',
        };
    }

    private function details(PengajuanServisArmada $pengajuan, string $key, string $status): array
    {
        $details = [];

        if ($key === 'diajukan') {
            $details[] = $this->detail('Kode', $pengajuan->kode_pengajuan);
            $details[] = $this->detail('Armada', $pengajuan->armada?->plat_nomor, $pengajuan->armada_id
                ? route('fleet.armada.show', $pengajuan->armada_id)
                : null);
            $details[] = $this->detail('Catatan', $pengajuan->catatan_ajuan);

            if ($pengajuan->tipe_servis === 'eksternal') {
                $details[] = $this->detail('Bengkel', $pengajuan->eksternalDetail?->nama_bengkel);
                $details[] = $this->detail('Estimasi', $this->rupiah($pengajuan->eksternalDetail?->total_biaya_estimasi));
            }
        }

        if ($key === 'disetujui' && $status === 'ditolak') {
            $details[] = $this->detail('Hasil', 'Ditolak');
            $details[] = $this->detail('Catatan', $pengajuan->catatan_acc);
        } elseif ($key === 'disetujui') {
            $details[] = $this->detail('Disetujui oleh', $pengajuan->disetujuiOleh?->name);
            $details[] = $this->detail('Catatan', $pengajuan->catatan_acc);
        }

        if ($key === 'dikerjakan') {
            $names = $pengajuan->personels->pluck('nama_personel')->filter()->implode(', ');
            $details[] = $this->detail('Personel', $names !== '' ? $names : null);
            $details[] = $this->detail('Catatan', $pengajuan->catatan_pengerjaan);
            $details[] = $this->detail('Butuh sparepart', $pengajuan->butuh_sparepart ? 'Ya' : 'Tidak');
        }

        if (in_array($key, ['menunggu_sparepart', 'sparepart_tersedia'], true)) {
            $details[] = $this->detail('Status pengadaan', $pengajuan->status_pengadaan_sparepart);
            foreach ($pengajuan->spareparts as $sparepart) {
                $details[] = $this->detail(
                    $sparepart->bahanBaku?->nama ?? 'Sparepart',
                    trim(($sparepart->jumlah ? $sparepart->jumlah.' ' : '').($sparepart->satuan ?? '').' '.$this->rupiah($sparepart->nominal))
                );
            }
        }

        if ($key === 'selesai') {
            $details[] = $this->detail('Tanggal selesai', $this->date($pengajuan->tanggal_selesai_kerja ?? $pengajuan->tanggal_selesai));
            $details[] = $this->detail('Total biaya', $this->rupiah($pengajuan->total_biaya));
            $details[] = $this->detail('Catatan', $pengajuan->catatan_pengerjaan);
        }

        return $details;
    }

    private function detail(string $label, mixed $value, ?string $url = null): array
    {
        return [
            'label' => $label,
            'value' => is_scalar($value) && trim((string) $value) !== '' ? (string) $value : null,
            'url' => $url,
        ];
    }

    private function date(mixed $value): ?string
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        return $value ? (string) $value : null;
    }

    private function rupiah(mixed $value): ?string
    {
        return $value === null ? null : 'Rp '.number_format((float) $value, 0, ',', '.');
    }
}
