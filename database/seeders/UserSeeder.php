<?php

namespace Database\Seeders;

use App\Domain\Core\Models\UnitBisnis;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $gcs = UnitBisnis::where('kode', 'GCS')->first();
        $cbp = UnitBisnis::where('kode', 'CBP')->first();
        $amp = UnitBisnis::where('kode', 'AMP')->first();

        $users = [
            [
                'email' => 'owner@example.com',
                'name' => 'Owner Utama',
                'nama_lengkap' => 'Bapak Owner Holding',
                'jabatan' => 'Owner / Direktur Utama',
                'role' => 'Owner',
                'unit_bisnis_id' => null,
                'divisi' => 'Manajemen',
                'is_active' => true,
            ],
            [
                'email' => 'adminkeug@example.com',
                'name' => 'Admin Keuangan',
                'nama_lengkap' => 'Ibu Admin Keuangan Pusat',
                'jabatan' => 'Admin Keuangan & RAB',
                'role' => 'Admin Keuangan',
                'unit_bisnis_id' => null,
                'divisi' => 'Finance',
                'is_active' => true,
            ],
            [
                'email' => 'ketua.finance@example.com',
                'name' => 'Ketua Divisi Keuangan',
                'nama_lengkap' => 'Bapak Ketua Finance',
                'jabatan' => 'Head of Finance Division',
                'role' => 'Ketua Divisi Keuangan',
                'unit_bisnis_id' => null,
                'divisi' => 'Finance',
                'is_active' => true,
            ],
            [
                'email' => 'ketua.armada@example.com',
                'name' => 'Ketua Divisi Armada',
                'nama_lengkap' => 'Bapak Ketua Armada GCS',
                'jabatan' => 'Head of Fleet & Transport',
                'role' => 'Ketua Divisi Armada',
                'unit_bisnis_id' => $gcs ? $gcs->id : null,
                'divisi' => 'Armada',
                'is_active' => true,
            ],
            [
                'email' => 'ketua.kontraktor@example.com',
                'name' => 'Ketua Divisi Kontraktor',
                'nama_lengkap' => 'Bapak Ketua Divisi Kontraktor',
                'jabatan' => 'Head of Contractor Relations',
                'role' => 'Ketua Divisi Kontraktor',
                'unit_bisnis_id' => null,
                'divisi' => 'Kontraktor',
                'is_active' => true,
            ],
            [
                'email' => 'ketua.cbp@example.com',
                'name' => 'Ketua Divisi Produksi CBP',
                'nama_lengkap' => 'Bapak Ketua Produksi CBP',
                'jabatan' => 'Head of CBP Plant',
                'role' => 'Ketua Divisi Produksi CBP',
                'unit_bisnis_id' => $cbp ? $cbp->id : null,
                'divisi' => 'Produksi',
                'is_active' => true,
            ],
            [
                'email' => 'ketua.amp@example.com',
                'name' => 'Ketua Divisi Produksi AMP',
                'nama_lengkap' => 'Bapak Ketua Produksi AMP',
                'jabatan' => 'Head of AMP Plant',
                'role' => 'Ketua Divisi Produksi AMP',
                'unit_bisnis_id' => $amp ? $amp->id : null,
                'divisi' => 'Produksi',
                'is_active' => true,
            ],
            [
                'email' => 'procurement@example.com',
                'name' => 'Koordinator Procurement',
                'nama_lengkap' => 'Staf Koordinator Procurement',
                'jabatan' => 'Procurement Officer',
                'role' => 'Koordinator Procurement',
                'unit_bisnis_id' => null,
                'divisi' => 'Procurement',
                'is_active' => true,
            ],
            [
                'email' => 'inventory@example.com',
                'name' => 'Staff Inventory',
                'nama_lengkap' => 'Staf Gudang Inventory',
                'jabatan' => 'Inventory Officer',
                'role' => 'Inventory',
                'unit_bisnis_id' => null,
                'divisi' => 'Inventory',
                'is_active' => true,
            ],
            [
                'email' => 'gcs@example.com',
                'name' => 'Koordinator GCS',
                'nama_lengkap' => 'Staf Operasional Armada GCS',
                'jabatan' => 'GCS Fleet Officer',
                'role' => 'Koordinator GCS',
                'unit_bisnis_id' => $gcs ? $gcs->id : null,
                'divisi' => 'Armada',
                'is_active' => true,
            ],
            [
                'email' => 'cbp@example.com',
                'name' => 'Koordinator CBP',
                'nama_lengkap' => 'Staf Operasional Batching Plant',
                'jabatan' => 'CBP Plant Officer',
                'role' => 'Koordinator CBP',
                'unit_bisnis_id' => $cbp ? $cbp->id : null,
                'divisi' => 'Produksi',
                'is_active' => true,
            ],
            [
                'email' => 'amp@example.com',
                'name' => 'Koordinator AMP',
                'nama_lengkap' => 'Staf Operasional Hotmix Plant',
                'jabatan' => 'AMP Plant Officer',
                'role' => 'Koordinator AMP',
                'unit_bisnis_id' => $amp ? $amp->id : null,
                'divisi' => 'Produksi',
                'is_active' => true,
            ],
            [
                'email' => 'sdm@example.com',
                'name' => 'Koordinator SDM',
                'nama_lengkap' => 'Staf HRD & General Affairs',
                'jabatan' => 'HR Coordinator',
                'role' => 'Koordinator SDM',
                'unit_bisnis_id' => null,
                'divisi' => 'HR',
                'is_active' => true,
            ],
            [
                'email' => 'mandor@example.com',
                'name' => 'Mandor Proyek',
                'nama_lengkap' => 'Mandor Lapangan Utama',
                'jabatan' => 'Site Supervisor',
                'role' => 'Mandor Proyek',
                'unit_bisnis_id' => null,
                'divisi' => 'Lapangan',
                'is_active' => true,
            ],
            [
                'email' => 'mandor.titik@example.com',
                'name' => 'Mandor Titik',
                'nama_lengkap' => 'Mandor Per-Titik Lapangan',
                'jabatan' => 'Mandor Titik',
                'role' => 'Mandor Titik',
                'unit_bisnis_id' => $gcs ? $gcs->id : null,
                'divisi' => 'Lapangan',
                'is_active' => true,
            ],
            [
                'email' => 'driver.standby@example.com',
                'name' => 'Driver Standby',
                'nama_lengkap' => 'Pengemudi Standby Harian',
                'jabatan' => 'Driver Standby',
                'role' => 'Driver Standby',
                'unit_bisnis_id' => $gcs ? $gcs->id : null,
                'divisi' => 'Armada',
                'is_active' => true,
            ],
            [
                'email' => 'driver.kondisional@example.com',
                'name' => 'Driver Kondisional',
                'nama_lengkap' => 'Pengemudi Borongan/Kondisional',
                'jabatan' => 'Driver Kondisional',
                'role' => 'Driver Kondisional',
                'unit_bisnis_id' => $gcs ? $gcs->id : null,
                'divisi' => 'Armada',
                'is_active' => true,
            ],
            [
                'email' => 'sdm.lapangan@example.com',
                'name' => 'SDM Lapangan',
                'nama_lengkap' => 'Tenaga Harian Lapangan',
                'jabatan' => 'SDM Lapangan Kondisional',
                'role' => 'SDM Lapangan Kondisional',
                'unit_bisnis_id' => null,
                'divisi' => 'Lapangan',
                'is_active' => true,
            ],
            [
                'email' => 'driver.armada@example.com',
                'name' => 'Driver Armada',
                'nama_lengkap' => 'Pengemudi Armada GCS',
                'jabatan' => 'Driver Armada',
                'role' => 'Driver Armada',
                'unit_bisnis_id' => $gcs ? $gcs->id : null,
                'divisi' => 'Armada',
                'is_active' => true,
            ],
            [
                'email' => 'operator.mesin@example.com',
                'name' => 'Operator Mesin',
                'nama_lengkap' => 'Operator Batching & Crusher',
                'jabatan' => 'Operator Mesin',
                'role' => 'Operator Mesin',
                'unit_bisnis_id' => $cbp ? $cbp->id : null,
                'divisi' => 'Produksi',
                'is_active' => true,
            ],
            [
                'email' => 'workshop@example.com',
                'name' => 'Teknisi Workshop',
                'nama_lengkap' => 'Teknisi & Mekanik Workshop',
                'jabatan' => 'Workshop Technician',
                'role' => 'Workshop',
                'unit_bisnis_id' => $gcs ? $gcs->id : null,
                'divisi' => 'Armada',
                'is_active' => true,
            ],
            [
                'email' => 'kontraktor@example.com',
                'name' => 'Mitra Kontraktor Klien',
                'nama_lengkap' => 'Perwakilan Kontraktor Klien',
                'jabatan' => 'External Contractor Lead',
                'role' => 'Kontraktor',
                'unit_bisnis_id' => null,
                'divisi' => 'Eksternal',
                'is_active' => true,
            ],
        ];

        foreach ($users as $uData) {
            $roleName = $uData['role'];
            unset($uData['role']);

            $user = User::updateOrCreate(
                ['email' => $uData['email']],
                array_merge($uData, [
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ])
            );

            $user->syncRoles([$roleName]);
        }
    }
}
