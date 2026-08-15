<?php

use App\Http\Controllers\Api\Mobile\AuthController;
use App\Http\Controllers\Api\Mobile\DashboardController;
use App\Http\Controllers\Api\Mobile\FormulirController;
use App\Http\Controllers\Api\Mobile\KontraktorController;
use App\Http\Controllers\Api\Mobile\NotificationController;
use App\Http\Controllers\Api\Mobile\PresensiController;
use App\Http\Controllers\Api\Mobile\ProduksiController;
use App\Http\Controllers\Api\Mobile\TrackingController;
use App\Http\Controllers\Api\Mobile\UploadController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Mobile API Routes
|--------------------------------------------------------------------------
| Semua endpoint /api/mobile/* untuk aplikasi mobile
| (Flutter / React Native). Auth pakai Sanctum token.
*/

Route::prefix('mobile')->name('mobile.')->group(function () {

    // ─── Autentikasi (tanpa token) ──────────────────────────────────────────
    Route::post('login', [AuthController::class, 'login'])->name('login');
    Route::post('register', [AuthController::class, 'register'])->name('register');

    // ─── Autentikasi (token Sanctum + mobile-only) ─────────────────────────
    Route::middleware(['auth:sanctum', 'mobile.auth', 'active.role'])->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('user', [AuthController::class, 'user'])->name('user');
        Route::post('update-profile', [AuthController::class, 'updateProfile'])->name('update-profile');

        // Presensi
        Route::get('titik-aktif', [PresensiController::class, 'titikAktif'])->name('titik-aktif');
        Route::post('presensi/check-in', [PresensiController::class, 'checkIn'])->name('presensi.check-in');
        Route::post('presensi/check-out', [PresensiController::class, 'checkOut'])->name('presensi.check-out');
        Route::get('presensi/hari-ini', [PresensiController::class, 'hariIni'])->name('presensi.hari-ini');
        Route::get('presensi/riwayat', [PresensiController::class, 'riwayat'])->name('presensi.riwayat');

        // Formulir Lapangan
        Route::post('formulir/store', [FormulirController::class, 'store'])->name('formulir.store');
        Route::get('formulir/hari-ini', [FormulirController::class, 'hariIni'])->name('formulir.hari-ini');
        Route::get('formulir/riwayat', [FormulirController::class, 'riwayat'])->name('formulir.riwayat');

        // Laporan Produksi Harian
        Route::post('produksi/mulai', [ProduksiController::class, 'mulai'])->name('produksi.mulai');
        Route::post('produksi/selesai/{sessionId}', [ProduksiController::class, 'selesai'])->name('produksi.selesai');
        Route::get('produksi/sesi-aktif', [ProduksiController::class, 'sesiAktif'])->name('produksi.sesi-aktif');
        Route::get('produksi/riwayat', [ProduksiController::class, 'riwayat'])->name('produksi.riwayat');
        Route::get('produksi/titik-progress', [ProduksiController::class, 'titikProgress'])->name('produksi.titik-progress');

        // GPS Tracking
        Route::post('tracking/batch', [TrackingController::class, 'batch'])->name('tracking.batch');
        Route::get('tracking/hari-ini/{userId}', [TrackingController::class, 'hariIni'])->name('tracking.hari-ini');

        // Upload File
        Route::post('upload', [UploadController::class, 'upload'])->name('upload');
        Route::delete('upload/{id}', [UploadController::class, 'destroy'])->name('upload.destroy');

        // Monitoring & Dashboard
        Route::get('dashboard/overview', [DashboardController::class, 'overview'])->name('dashboard.overview');
        Route::get('dashboard/titik/{titikId}', [DashboardController::class, 'titik'])->name('dashboard.titik');

        // Notifikasi
        Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::post('notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');

        // Portal Kontraktor
        Route::get('kontraktor/proyek', [KontraktorController::class, 'proyekList'])->name('kontraktor.proyek');
        Route::get('kontraktor/proyek/{id}', [KontraktorController::class, 'proyekDetail'])->name('kontraktor.proyek-detail');
        Route::get('kontraktor/invoice', [KontraktorController::class, 'invoiceList'])->name('kontraktor.invoice');
        Route::post('kontraktor/komunikasi', [KontraktorController::class, 'sendMessage'])->name('kontraktor.komunikasi');
    });
});
