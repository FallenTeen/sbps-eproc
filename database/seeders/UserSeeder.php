<?php

namespace Database\Seeders;

use App\Domain\Core\Models\UnitBisnis;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * User ESENSIAL untuk production & staging.
     *
     * Akun "jabatan" (owner, koordinator, ketua devisi) yang dibutuhkan untuk
     * mengoperasikan aplikasi. Email memakai domain @real.com (bukan dummy).
     * Identitas pribadi dapat disesuaikan manual saat data asli tersedia.
     */
    private array $essential = [
        'owner' => ['name' => 'Owner Utama', 'nama_lengkap' => 'Bapak Owner Holding', 'jabatan' => 'Owner / Direktur Utama', 'role' => 'Owner', 'unit_bisnis_kode' => null, 'divisi' => 'Manajemen'],
        'adminkeug' => ['name' => 'Admin Keuangan', 'nama_lengkap' => 'Ibu Admin Keuangan Pusat', 'jabatan' => 'Admin Keuangan & RAB', 'role' => 'Admin Keuangan', 'unit_bisnis_kode' => null, 'divisi' => 'Finance'],
        'ketua.finance' => ['name' => 'Ketua Divisi Keuangan', 'nama_lengkap' => 'Bapak Ketua Finance', 'jabatan' => 'Head of Finance Division', 'role' => 'Ketua Divisi Keuangan', 'unit_bisnis_kode' => null, 'divisi' => 'Finance'],
        'ketua.armada' => ['name' => 'Ketua Divisi Armada', 'nama_lengkap' => 'Bapak Ketua Armada', 'jabatan' => 'Head of Fleet & Transport', 'role' => 'Ketua Divisi Armada', 'unit_bisnis_kode' => 'GCS', 'divisi' => 'Armada'],
        'ketua.kontraktor' => ['name' => 'Ketua Divisi Kontraktor', 'nama_lengkap' => 'Bapak Ketua Divisi Kontraktor', 'jabatan' => 'Head of Contractor Relations', 'role' => 'Ketua Divisi Kontraktor', 'unit_bisnis_kode' => null, 'divisi' => 'Kontraktor'],
        'ketua.cbp' => ['name' => 'Ketua Divisi Produksi CBP', 'nama_lengkap' => 'Bapak Ketua Produksi CBP', 'jabatan' => 'Head of CBP Plant', 'role' => 'Ketua Divisi Produksi CBP', 'unit_bisnis_kode' => 'CBP', 'divisi' => 'Produksi'],
        'ketua.amp' => ['name' => 'Ketua Divisi Produksi AMP', 'nama_lengkap' => 'Bapak Ketua Produksi AMP', 'jabatan' => 'Head of AMP Plant', 'role' => 'Ketua Divisi Produksi AMP', 'unit_bisnis_kode' => 'AMP', 'divisi' => 'Produksi'],
        'procurement' => ['name' => 'Koordinator Procurement', 'nama_lengkap' => 'Staf Koordinator Procurement', 'jabatan' => 'Procurement Officer', 'role' => 'Koordinator Procurement', 'unit_bisnis_kode' => null, 'divisi' => 'Procurement'],
        'inventory' => ['name' => 'Staff Inventory', 'nama_lengkap' => 'Staf Gudang Inventory', 'jabatan' => 'Inventory Officer', 'role' => 'Inventory', 'unit_bisnis_kode' => null, 'divisi' => 'Inventory'],
        'gcs' => ['name' => 'Koordinator GCS', 'nama_lengkap' => 'Staf Operasional Armada GCS', 'jabatan' => 'GCS Fleet Officer', 'role' => 'Koordinator GCS', 'unit_bisnis_kode' => 'GCS', 'divisi' => 'Armada'],
        'cbp' => ['name' => 'Koordinator CBP', 'nama_lengkap' => 'Staf Operasional Batching Plant', 'jabatan' => 'CBP Plant Officer', 'role' => 'Koordinator CBP', 'unit_bisnis_kode' => 'CBP', 'divisi' => 'Produksi'],
        'amp' => ['name' => 'Koordinator AMP', 'nama_lengkap' => 'Staf Operasional Hotmix Plant', 'jabatan' => 'AMP Plant Officer', 'role' => 'Koordinator AMP', 'unit_bisnis_kode' => 'AMP', 'divisi' => 'Produksi'],
        'sdm' => ['name' => 'Koordinator SDM', 'nama_lengkap' => 'Staf HRD & General Affairs', 'jabatan' => 'HR Coordinator', 'role' => 'Koordinator SDM', 'unit_bisnis_kode' => null, 'divisi' => 'HR'],
        'mandor' => ['name' => 'Mandor Proyek', 'nama_lengkap' => 'Mandor Lapangan Utama', 'jabatan' => 'Site Supervisor', 'role' => 'Mandor Proyek', 'unit_bisnis_kode' => null, 'divisi' => 'Lapangan'],
        'operator.mesin' => ['name' => 'Operator Mesin', 'nama_lengkap' => 'Operator Batching & Crusher', 'jabatan' => 'Operator Mesin', 'role' => 'Operator Mesin', 'unit_bisnis_kode' => 'CBP', 'divisi' => 'Produksi'],
        'workshop' => ['name' => 'Teknisi Workshop', 'nama_lengkap' => 'Teknisi & Mekanik Workshop', 'jabatan' => 'Workshop Technician', 'role' => 'Workshop', 'unit_bisnis_kode' => 'GCS', 'divisi' => 'Armada'],
    ];

    /**
     * User DUMMY untuk staging (tidak pernah dibuat di production).
     *
     * Nama diberi prefix "d", email memakai domain @dummy.com agar jelas
     * bukan data asli. Driver armada ASLI dibuat oleh FleetDataSeeder.
     */
    private array $demo = [
        'mandor.titik' => ['name' => 'dMandor Titik', 'nama_lengkap' => 'Mandor Per-Titik Lapangan', 'jabatan' => 'Mandor Titik', 'role' => 'Mandor Titik', 'unit_bisnis_kode' => 'GCS', 'divisi' => 'Lapangan'],
        'driver.standby' => ['name' => 'dDriver Standby', 'nama_lengkap' => 'Pengemudi Standby Harian', 'jabatan' => 'Driver Standby', 'role' => 'Driver Standby', 'unit_bisnis_kode' => 'GCS', 'divisi' => 'Armada'],
        'driver.kondisional' => ['name' => 'dDriver Kondisional', 'nama_lengkap' => 'Pengemudi Borongan/Kondisional', 'jabatan' => 'Driver Kondisional', 'role' => 'Driver Kondisional', 'unit_bisnis_kode' => 'GCS', 'divisi' => 'Armada'],
        'sdm.lapangan' => ['name' => 'dSDM Lapangan', 'nama_lengkap' => 'Tenaga Harian Lapangan', 'jabatan' => 'SDM Lapangan Kondisional', 'role' => 'SDM Lapangan Kondisional', 'unit_bisnis_kode' => null, 'divisi' => 'Lapangan'],
        'driver.armada' => ['name' => 'dDriver Armada', 'nama_lengkap' => 'Pengemudi Armada GCS (dummy)', 'jabatan' => 'Driver Armada', 'role' => 'Driver Armada', 'unit_bisnis_kode' => 'GCS', 'divisi' => 'Armada'],
        'kontraktor' => ['name' => 'dMitra Kontraktor', 'nama_lengkap' => 'Perwakilan Kontraktor Klien (dummy)', 'jabatan' => 'External Contractor Lead', 'role' => 'Kontraktor', 'unit_bisnis_kode' => null, 'divisi' => 'Eksternal'],
    ];

    public function run(): void
    {
        $production = app()->environment('production');

        foreach ($this->essential as $email => $data) {
            $this->upsertUser($email.'@real.com', $data);
        }

        if (! $production) {
            foreach ($this->demo as $email => $data) {
                $this->upsertUser($email.'@dummy.com', $data);
            }
        }
    }

    private function upsertUser(string $email, array $data): void
    {
        $unitBisnisId = $data['unit_bisnis_kode']
            ? UnitBisnis::where('kode', $data['unit_bisnis_kode'])->value('id')
            : null;

        $role = $data['role'];
        unset($data['role'], $data['unit_bisnis_kode']);

        $user = User::updateOrCreate(
            ['email' => $email],
            array_merge($data, [
                'unit_bisnis_id' => $unitBisnisId,
                'is_active' => true,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ])
        );

        $user->syncRoles([$role]);
    }
}
