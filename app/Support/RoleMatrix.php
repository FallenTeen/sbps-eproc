<?php

namespace App\Support;

/**
 * Matriks role & permission KANONIK (single source of truth).
 *
 * Dipakai oleh RolePermissionSeeder, DivisiRoleSeeder, dan
 * app:seed-production. Setiap perubahan privilege role HARUS lewat sini
 * agar staging (migrate:fresh --seed) dan production consumen matriks
 * yang sama.
 *
 * Referensi pemetaan module mobile → permission web:
 *  - mobile `RolePermissions._matrix` (lib/features/proyek/role_permissions.dart).
 *  - policy web (app/Policies/*) sebagai gate aksi (approve, assign, ...).
 */
class RoleMatrix
{
    /**
     * Seluruh katalog permission yang dikenal sistem.
     */
    public const PERMISSIONS = [
        // Core & Proyek
        'manage proyek',
        'view proyek',
        'manage rab',
        'view rab',
        'manage role',
        'view owner dashboard',

        // Procurement
        'manage procurement',
        'view procurement',
        'approve procurement',
        'receive procurement',
        'pay procurement',
        'manage bahan baku',
        'view bahan baku',
        'manage supplier',
        'view supplier',
        'approve procurement fleet',   // approve PO armada max 25jt
        'approve procurement produksi', // approve PO bahan baku max 20jt
        'approve procurement kontrak',  // approve PO kontrak max 30jt
        'approve procurement keuangan', // approve PO keuangan max 50jt

        // Inventory (role gudang, 21.7)
        'manage inventory',
        'view inventory',
        'manage stok opname',
        'view stok opname',

        // Fleet
        'manage fleet',
        'view fleet',
        'record ritase',
        'record sewa',

        // Fleet Service (Sistem Servis Armada, 21.8)
        'view fleet service',
        'manage fleet service',
        'approve fleet service',
        'submit fleet service',
        'manage sparepart',
        'view sparepart',

        // Production
        'manage production',
        'manage production cbp',
        'manage production amp',
        'view production',
        'start session',
        'end session',
        'manage qc',

        // HR & Payroll
        'manage hr',
        'view hr',
        'manage payroll',
        'view payroll',

        // Finance
        'manage finance',
        'view finance',
        'manage kas',
        'manage invoice',
        'view invoice',

        // Lapangan
        'manage presensi',
        'manage formulir lapangan',

        // Portal Kontraktor
        'view kontraktor',
        'manage kontraktor',

        // Approval divisi (procurement per-divisi, threshold)
        'manage procurement division',
        'approve procurement division',
        'approve procurement threshold',
        'manage fleet division',
        'manage production cbp division',
        'manage production amp division',
        'manage hr division',
        'manage finance division',
        'approve expense division',
        'approve payroll division',
    ];

    /**
     * Privilege dasar per role (web + sesuai matriks modul mobile).
     * Role divisi di bawah ini diberi tambahan approval divisi via
     * [DIVISI_AUGMENTS] — keduanya di-union saat disync (tidak menghapus).
     */
    public const ROLES = [
        // ─── Super Admin ───────────────────────────────────────────────
        // Mobile: semua 9 modul (produksi, qc, tracking, dashboard,
        // keuangan, armada, kontraktor, workshop, inventory).
        'Owner' => [
            'manage proyek', 'view proyek', 'manage rab', 'view rab', 'manage role', 'view owner dashboard',
            'manage procurement', 'view procurement', 'approve procurement', 'receive procurement', 'pay procurement',
            'manage bahan baku', 'view bahan baku', 'manage supplier', 'view supplier',
            'approve procurement fleet', 'approve procurement produksi', 'approve procurement kontrak', 'approve procurement keuangan',
            'manage inventory', 'view inventory', 'manage stok opname', 'view stok opname',
            'manage fleet', 'view fleet', 'record ritase', 'record sewa',
            'view fleet service', 'manage fleet service', 'approve fleet service', 'submit fleet service', 'manage sparepart', 'view sparepart',
            'manage production', 'manage production cbp', 'manage production amp', 'view production', 'start session', 'end session', 'manage qc',
            'manage hr', 'view hr', 'manage payroll', 'view payroll',
            'manage finance', 'view finance', 'manage kas', 'manage invoice', 'view invoice',
            'manage presensi', 'manage formulir lapangan',
            'view kontraktor', 'manage kontraktor',
        ],

        // ─── Admin & Koordinator ───────────────────────────────────────
        // Mobile Admin Keuangan: tracking, dashboard, keuangan, armada, kontraktor.
        'Admin Keuangan' => [
            'view owner dashboard',
            'approve procurement', 'pay procurement', 'approve procurement keuangan', 'view procurement',
            'manage finance', 'view finance', 'manage kas', 'manage invoice', 'view invoice',
            'manage rab', 'view rab', 'view proyek', 'view fleet',
            'view production',
            'manage payroll', 'view payroll',
            'view kontraktor',
        ],
        'Koordinator Procurement' => [
            'manage procurement', 'view procurement', 'receive procurement',
            'manage bahan baku', 'view bahan baku', 'manage supplier', 'view supplier',
            'view proyek', 'view rab',
        ],
        'Koordinator GCS' => [
            'manage fleet', 'view fleet', 'record ritase', 'record sewa', 'view proyek',
            'view fleet service', 'submit fleet service',
        ],
        'Inventory' => [
            'manage inventory', 'view inventory',
            'manage stok opname', 'view stok opname',
            'manage procurement', 'view procurement', 'receive procurement',
            'manage bahan baku', 'view bahan baku', 'manage supplier', 'view supplier',
            'view fleet service', 'manage sparepart', 'view sparepart', 'view fleet',
            'view proyek', 'view rab',
        ],
        'Workshop' => [
            'view fleet service', 'manage fleet service', 'submit fleet service',
            'manage sparepart', 'view sparepart', 'view fleet',
        ],
        'Koordinator CBP' => [
            'manage production', 'manage production cbp', 'view production',
            'start session', 'end session', 'manage qc',
            'view proyek', 'manage rab', 'view rab',
        ],
        'Koordinator AMP' => [
            'manage production', 'manage production amp', 'view production',
            'start session', 'end session',
            'view proyek', 'manage rab', 'view rab',
        ],
        'Koordinator SDM' => [
            'manage hr', 'view hr', 'manage payroll', 'view payroll', 'manage presensi', 'view proyek',
        ],
        'Mandor Proyek' => [
            'manage proyek', 'view proyek', 'manage rab', 'view rab',
            'view production', 'start session', 'end session', 'manage qc',
            'manage presensi', 'manage formulir lapangan',
        ],
        'Kontraktor' => [
            'view proyek', 'view kontraktor',
        ],

        // ─── Ketua Divisi ──────────────────────────────────────────────
        'Ketua Divisi Keuangan' => [
            'manage finance', 'view finance', 'manage kas', 'manage invoice', 'view invoice',
            'manage rab', 'view rab', 'view proyek',
            'approve procurement keuangan', 'pay procurement',
        ],
        'Ketua Divisi Finance' => [
            'manage finance', 'view finance', 'manage kas', 'manage invoice', 'view invoice',
            'manage rab', 'view rab', 'view proyek',
            'approve procurement keuangan', 'pay procurement',
        ],
        // Mobile: armada + dashboard (manager armada: dapat approve servis).
        'Ketua Divisi Armada' => [
            'manage fleet', 'view fleet', 'record ritase', 'record sewa', 'view proyek',
            'approve procurement fleet',
            'view fleet service', 'manage fleet service', 'approve fleet service',
        ],
        'Kepala Divisi Armada' => [
            'manage fleet', 'view fleet', 'record ritase', 'record sewa', 'view proyek',
            'approve procurement fleet',
            'view fleet service', 'manage fleet service', 'approve fleet service',
        ],
        'Ketua Armada' => [
            'manage fleet', 'view fleet', 'record ritase', 'record sewa', 'view proyek',
            'approve procurement fleet',
            'view fleet service', 'manage fleet service', 'approve fleet service',
        ],
        'Ketua Divisi Produksi CBP' => [
            'manage production', 'manage production cbp', 'view production',
            'start session', 'end session', 'manage qc',
            'manage rab', 'view rab', 'view proyek',
            'approve procurement produksi',
        ],
        'Ketua Divisi Produksi AMP' => [
            'manage production', 'manage production amp', 'view production',
            'start session', 'end session',
            'manage rab', 'view rab', 'view proyek',
            'approve procurement produksi',
        ],
        'Ketua Divisi Kontraktor' => [
            'manage proyek', 'view proyek', 'manage rab', 'view rab',
            'manage hr', 'view hr', 'view payroll',
            'manage invoice', 'view invoice',
            'manage finance', 'manage presensi',
            'approve procurement kontrak',
            'view kontraktor', 'manage kontraktor',
        ],

        // ─── Role Lapangan ──────────────────────────────────────────────
        // Mobile Mandor Titik: produksi, qc, tracking, dashboard.
        'Mandor Titik' => [
            'view proyek', 'view rab', 'manage presensi', 'manage formulir lapangan',
            'view production', 'start session', 'end session', 'manage qc',
        ],
        // Mobile Operator Mesin: produksi, qc.
        'Operator Mesin' => [
            'view proyek', 'view production', 'start session', 'end session', 'manage qc',
            'manage presensi', 'manage formulir lapangan',
        ],
        'Driver Standby' => [
            'view proyek', 'manage formulir lapangan', 'manage presensi',
            'view fleet service', 'submit fleet service',
        ],
        'Driver Kondisional' => [
            'view proyek', 'manage formulir lapangan', 'manage presensi',
            'view fleet service', 'submit fleet service',
        ],
        // Mobile Driver Armada: armada (ritase, checklist, ODO, servis, helper).
        'Driver Armada' => [
            'view proyek', 'view fleet', 'view fleet service', 'submit fleet service',
            'record ritase', 'manage presensi',
        ],
        'SDM Lapangan Kondisional' => [
            'view proyek', 'manage presensi', 'manage formulir lapangan',
        ],
    ];

    /**
     * Permission khusus approval divisi yang ditambahkan di atas privilege
     * dasar (sebelumnya di DivisiRoleSeeder dengan syncPermissions yang
     * justru MENIMPA — sekarang non-destruktif).
     */
    public const DIVISI_AUGMENTS = [
        'Ketua Divisi Finance' => [
            'manage finance division',
            'approve expense division',
            'approve payroll division',
            'approve procurement division',
            'approve procurement threshold',
        ],
        'Ketua Divisi Keuangan' => [
            'manage finance division',
            'approve expense division',
            'approve payroll division',
            'approve procurement division',
            'approve procurement threshold',
        ],
        'Ketua Divisi Armada' => [
            'manage fleet division',
            'approve procurement division',
        ],
        'Ketua Divisi Kontraktor' => [
            'approve procurement division',
        ],
        'Ketua Divisi Produksi CBP' => [
            'manage production cbp division',
            'approve procurement division',
        ],
        'Ketua Divisi Produksi AMP' => [
            'manage production amp division',
            'approve procurement division',
        ],
    ];

    /**
     * Privilege final sebuah role = base ROLES + DIVISI_AUGMENTS (di-union).
     */
    public static function privilegesFor(string $role): array
    {
        return array_values(array_unique(array_merge(
            self::ROLES[$role] ?? [],
            self::DIVISI_AUGMENTS[$role] ?? []
        )));
    }
}