<?php

/**
 * Konfigurasi modul Presensi (Attendance).
 *
 * Lembur (§24 TODO - TD BK-3..BK-5):
 * - Jam kerja > 8j30m (510 mnt) di atasnya dihitung lembur.
 * - Pembulatan billing per config 'pembulatan_menit', dibulatkan KE ATAS.
 * - Tarif saran: harian   = rate_harian / 7 × faktor
 *               tetap     = gaji_pokok / 173 × faktor
 *   (nilai saran hanya default awal - admin boleh koreksi per record di
 *    menu Payroll; koreksi disimpan sebagai snapshot & flag diedit_manual).
 */
return [
    'lembur' => [
        'threshold_menit' => env('ATTENDANCE_LEMBUR_THRESHOLD_MENIT', 510),
        'pembulatan_menit' => env('ATTENDANCE_LEMBUR_PEMBULATAN_MENIT', 30),
        'tarif_harian_jam' => env('ATTENDANCE_TARIF_HARIAN_JAM', 7),
        'tarif_harian_faktor' => env('ATTENDANCE_TARIF_HARIAN_FAKTOR', 1.5),
        'tarif_tetap_jam' => env('ATTENDANCE_TARIF_TETAP_JAM', 173),
        'tarif_tetap_faktor' => env('ATTENDANCE_TARIF_TETAP_FAKTOR', 1.5),
    ],
];
