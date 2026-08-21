<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Portal Configuration
    |--------------------------------------------------------------------------
    |
    | Mapping portal slug → metadata. Digunakan oleh PortalController untuk
    | render login page per portal dan validasi role user.
    |
    */

    'portals' => [

        'admin' => [
            'name' => 'Admin',
            'description' => 'Manajemen sistem, user, procurement, audit log, dan pengaturan global.',
            'icon' => 'Shield',
            'color' => 'red',
            'roles' => ['Owner', 'Koordinator Procurement'],
        ],

        'armada' => [
            'name' => 'Armada',
            'description' => 'Manajemen kendaraan, ritase harian, BBM, checklist, dan sewa alat.',
            'icon' => 'Truck',
            'color' => 'blue',
            'roles' => ['Koordinator GCS', 'Ketua Divisi Armada'],
        ],

        'produksi' => [
            'name' => 'Produksi',
            'description' => 'Dashboard produksi CBP/AMP, mesin, sesi, QC, pengiriman, RAB, dan kontraktor.',
            'icon' => 'Factory',
            'color' => 'green',
            'roles' => [
                'Koordinator CBP',
                'Koordinator AMP',
                'Ketua Divisi Produksi CBP',
                'Ketua Divisi Produksi AMP',
                'Ketua Divisi Kontraktor',
                'Mandor Proyek',
            ],
        ],

        'keuangan' => [
            'name' => 'Keuangan',
            'description' => 'Kas & bank, invoice, piutang, laporan keuangan, dan approval procurement.',
            'icon' => 'Wallet',
            'color' => 'amber',
            'roles' => ['Admin Keuangan', 'Ketua Divisi Keuangan', 'Ketua Divisi Finance'],
        ],

        'sdm' => [
            'name' => 'SDM',
            'description' => 'Data karyawan, pengajuan cuti, payroll, presensi, dan formulir lapangan.',
            'icon' => 'Users',
            'color' => 'purple',
            'roles' => ['Koordinator SDM'],
        ],

        'kontraktor' => [
            'name' => 'Kontraktor',
            'description' => 'Portal klien — proyek kontrak, progress produksi, invoice, dan komunikasi.',
            'icon' => 'ClipboardList',
            'color' => 'teal',
            'roles' => ['Kontraktor'],
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Portal Color Map
    |--------------------------------------------------------------------------
    |
    | Mapping nama warna ke Tailwind classes untuk konsistensi branding.
    |
    */

    'colors' => [
        'red' => [
            'bg' => 'bg-red-600',
            'bg-light' => 'bg-red-50',
            'text' => 'text-red-600',
            'border' => 'border-red-600',
            'hover' => 'hover:bg-red-700',
            'ring' => 'ring-red-600',
            'gradient' => 'from-red-600 to-red-700',
        ],
        'blue' => [
            'bg' => 'bg-blue-600',
            'bg-light' => 'bg-blue-50',
            'text' => 'text-blue-600',
            'border' => 'border-blue-600',
            'hover' => 'hover:bg-blue-700',
            'ring' => 'ring-blue-600',
            'gradient' => 'from-blue-600 to-blue-700',
        ],
        'green' => [
            'bg' => 'bg-green-600',
            'bg-light' => 'bg-green-50',
            'text' => 'text-green-600',
            'border' => 'border-green-600',
            'hover' => 'hover:bg-green-700',
            'ring' => 'ring-green-600',
            'gradient' => 'from-green-600 to-green-700',
        ],
        'amber' => [
            'bg' => 'bg-amber-500',
            'bg-light' => 'bg-amber-50',
            'text' => 'text-amber-500',
            'border' => 'border-amber-500',
            'hover' => 'hover:bg-amber-600',
            'ring' => 'ring-amber-500',
            'gradient' => 'from-amber-500 to-amber-600',
        ],
        'purple' => [
            'bg' => 'bg-purple-600',
            'bg-light' => 'bg-purple-50',
            'text' => 'text-purple-600',
            'border' => 'border-purple-600',
            'hover' => 'hover:bg-purple-700',
            'ring' => 'ring-purple-600',
            'gradient' => 'from-purple-600 to-purple-700',
        ],
        'teal' => [
            'bg' => 'bg-teal-600',
            'bg-light' => 'bg-teal-50',
            'text' => 'text-teal-600',
            'border' => 'border-teal-600',
            'hover' => 'hover:bg-teal-700',
            'ring' => 'ring-teal-600',
            'gradient' => 'from-teal-600 to-teal-700',
        ],
    ],

];
