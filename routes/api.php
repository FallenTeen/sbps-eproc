<?php

use App\Http\Controllers\Api\Mobile\AppVersionController;
use App\Http\Controllers\Api\Mobile\ArmadaController;
use App\Http\Controllers\Api\Mobile\AuthController;
use App\Http\Controllers\Api\Mobile\DashboardController;
use App\Http\Controllers\Api\Mobile\FormulirController;
use App\Http\Controllers\Api\Mobile\InventoryController;
use App\Http\Controllers\Api\Mobile\KontraktorController;
use App\Http\Controllers\Api\Mobile\MasterDataController;
use App\Http\Controllers\Api\Mobile\MobileQcController;
use App\Http\Controllers\Api\Mobile\NotificationController;
use App\Http\Controllers\Api\Mobile\PendingSummaryController;
use App\Http\Controllers\Api\Mobile\PengajuanServisController;
use App\Http\Controllers\Api\Mobile\PresensiController;
use App\Http\Controllers\Api\Mobile\ProduksiController;
use App\Http\Controllers\Api\Mobile\TitikMapController;
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
    Route::post('login', [AuthController::class, 'login'])
        ->name('login')->middleware('throttle:mobile-login');
    Route::post('register', [AuthController::class, 'register'])
        ->name('register')->middleware('throttle:mobile');
    Route::get('app-version', [AppVersionController::class, 'index'])
        ->name('app-version')->middleware('throttle:mobile');

    // ─── Autentikasi (token Sanctum + mobile-only) ─────────────────────────
    Route::middleware(['auth:sanctum', 'mobile.auth', 'active.role', 'throttle:mobile'])->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
        Route::post('logout-all-devices', [AuthController::class, 'logoutAllDevices'])->name('logout-all-devices');
        Route::get('user', [AuthController::class, 'user'])->name('user');
        Route::post('update-profile', [AuthController::class, 'updateProfile'])->name('update-profile');

        // Penugasan User
        Route::get('assignments', [AuthController::class, 'assignments'])->name('assignments');

        // Presensi & Peta Titik
        Route::get('titik-aktif', [PresensiController::class, 'titikAktif'])->name('titik-aktif');
        Route::get('titik-map', [TitikMapController::class, 'index'])->name('titik-map');
        Route::post('presensi/check-in', [PresensiController::class, 'checkIn'])
            ->name('presensi.check-in')->middleware('idempotency');
        Route::post('presensi/check-out', [PresensiController::class, 'checkOut'])
            ->name('presensi.check-out')->middleware('idempotency');
        Route::get('presensi/hari-ini', [PresensiController::class, 'hariIni'])->name('presensi.hari-ini');
        Route::get('presensi/riwayat', [PresensiController::class, 'riwayat'])->name('presensi.riwayat');

        // Formulir Lapangan
        Route::post('formulir/store', [FormulirController::class, 'store'])
            ->name('formulir.store')->middleware('idempotency');
        Route::get('formulir/hari-ini', [FormulirController::class, 'hariIni'])->name('formulir.hari-ini');
        Route::get('formulir/riwayat', [FormulirController::class, 'riwayat'])->name('formulir.riwayat');

        // Laporan Produksi Harian
        Route::post('produksi/mulai', [ProduksiController::class, 'mulai'])->name('produksi.mulai');
        Route::post('produksi/selesai/{sessionId}', [ProduksiController::class, 'selesai'])->name('produksi.selesai');
        Route::get('produksi/sesi-aktif', [ProduksiController::class, 'sesiAktif'])->name('produksi.sesi-aktif');
        Route::get('produksi/riwayat', [ProduksiController::class, 'riwayat'])->name('produksi.riwayat');
        Route::get('produksi/titik-progress', [ProduksiController::class, 'titikProgress'])->name('produksi.titik-progress');

        // Master Data (mesin, produk, bahan baku, armada)
        Route::get('master/mesin', [MasterDataController::class, 'mesin'])->name('master.mesin');
        Route::get('master/produk', [MasterDataController::class, 'produk'])->name('master.produk');
        Route::get('master/bahan-baku', [MasterDataController::class, 'bahanBaku'])->name('master.bahan-baku');
        Route::get('master/armada', [MasterDataController::class, 'armada'])->name('master.armada');

        // GPS Tracking
        Route::post('tracking/batch', [TrackingController::class, 'batch'])
            ->name('tracking.batch')->middleware('throttle:mobile-tracking');
        Route::get('tracking/hari-ini/{userId}', [TrackingController::class, 'hariIni'])->name('tracking.hari-ini');
        Route::get('tracking/active-users', [TrackingController::class, 'activeUsers'])->name('tracking.active-users');

        // Upload File
        Route::post('upload', [UploadController::class, 'upload'])
            ->name('upload')->middleware('throttle:mobile-upload');
        Route::delete('upload/{id}', [UploadController::class, 'destroy'])->name('upload.destroy');

        // Monitoring & Dashboard
        Route::get('dashboard/overview', [DashboardController::class, 'overview'])->name('dashboard.overview');
        Route::get('dashboard/titik/{titikId}', [DashboardController::class, 'titik'])->name('dashboard.titik');
        Route::get('dashboard/chart/produksi', [DashboardController::class, 'chartProduksi'])->name('dashboard.chart-produksi');
        Route::get('dashboard/chart/keuangan', [DashboardController::class, 'chartKeuangan'])->name('dashboard.chart-keuangan');
        Route::get('dashboard/armada-status', [DashboardController::class, 'armadaStatus'])->name('dashboard.armada-status');
        Route::get('dashboard/armada-monitoring', [DashboardController::class, 'armadaMonitoring'])->name('dashboard.armada-monitoring');
        Route::get('dashboard/kehadiran-divisi', [DashboardController::class, 'kehadiranDivisi'])->name('dashboard.kehadiran-divisi');
        Route::get('dashboard/po-pending', [DashboardController::class, 'poPending'])->name('dashboard.po-pending');
        Route::get('dashboard/invoice-belum-dibayar', [DashboardController::class, 'invoiceBelumDibayar'])->name('dashboard.invoice-belum-dibayar');

        // Quality Control
        Route::post('qc/slump-test', [MobileQcController::class, 'storeSlumpTest'])->name('qc.slump-test');
        Route::post('qc/uji-tekan', [MobileQcController::class, 'storeUjiTekan'])->name('qc.uji-tekan');
        Route::get('qc/riwayat', [MobileQcController::class, 'riwayat'])->name('qc.riwayat');
        Route::get('qc/{id}', [MobileQcController::class, 'show'])->name('qc.show');

        // Armada (driver)
        Route::get('armada/saya', [ArmadaController::class, 'saya'])->name('armada.saya');
        Route::get('armada/ritase', [ArmadaController::class, 'ritase'])->name('armada.ritase');
        Route::post('armada/ritase/input', [ArmadaController::class, 'storeRitase'])
            ->name('armada.ritase.input')->middleware('idempotency');
        Route::get('armada/checklist-hari-ini', [ArmadaController::class, 'checklistHariIni'])->name('armada.checklist-hari-ini');
        Route::post('armada/checklist', [ArmadaController::class, 'submitChecklist'])->name('armada.checklist');
        Route::post('armada/odo-awal-proyek', [ArmadaController::class, 'storeOdoAwalProyek'])
            ->name('armada.odo-awal-proyek')->middleware('idempotency');
        Route::get('armada/odo-awal-proyek', [ArmadaController::class, 'indexOdoAwalProyek'])->name('armada.odo-awal-proyek.index');
        Route::post('armada/checklist-major', [ArmadaController::class, 'submitChecklistMajor'])
            ->name('armada.checklist-major')->middleware('idempotency');

        // v6 (21.6) — helper armada & presensi (dicatat PIC)
        Route::get('armada/helper', [ArmadaController::class, 'indexHelper'])->name('armada.helper.index');
        Route::post('armada/helper/{helper}/presensi', [ArmadaController::class, 'storeHelperPresensi'])
            ->name('armada.helper.presensi')->middleware('idempotency');

        // v6 (21.8) — Sistem Servis Armada (mobile: ajuan, riwayat, detail, approval/reject)
        Route::get('servis-armada', [PengajuanServisController::class, 'index'])->name('servis-armada.index');
        Route::get('servis-armada/saya', [PengajuanServisController::class, 'saya'])->name('servis-armada.saya');
        Route::post('servis-armada', [PengajuanServisController::class, 'store'])
            ->name('servis-armada.store')->middleware('idempotency');
        Route::get('servis-armada/{id}', [PengajuanServisController::class, 'show'])->name('servis-armada.show');
        Route::post('servis-armada/{id}/approve', [PengajuanServisController::class, 'approve'])
            ->name('servis-armada.approve')->middleware('idempotency');
        Route::post('servis-armada/{id}/tolak', [PengajuanServisController::class, 'tolak'])
            ->name('servis-armada.tolak')->middleware('idempotency');

        // v6 (21.8 #3-4) — Pengerjaan workshop (mulai, selesai, request sparepart)
        Route::post('servis-armada/{id}/mulai', [PengajuanServisController::class, 'mulai'])
            ->name('servis-armada.mulai')->middleware('idempotency');
        Route::post('servis-armada/{id}/selesai', [PengajuanServisController::class, 'selesai'])
            ->name('servis-armada.selesai')->middleware('idempotency');
        Route::post('workshop/job/{id}/request-sparepart', [PengajuanServisController::class, 'requestSparepart'])
            ->name('workshop.job.request-sparepart')->middleware('idempotency');
        Route::post('workshop/job/{id}/todo/{todoId}/toggle', [PengajuanServisController::class, 'toggleTodo'])
            ->name('workshop.job.todo.toggle')->middleware('idempotency');
        Route::post('workshop/job/{id}/todo/{todoId}/photo', [PengajuanServisController::class, 'uploadTodoPhoto'])
            ->name('workshop.job.todo.photo')->middleware('idempotency');

        // v6 (21.7 & 14d) — Modul Inventory (stok, request sparepart, opname)
        Route::get('inventory/summary', [InventoryController::class, 'summary'])->name('inventory.summary');
        Route::get('inventory/materials', [InventoryController::class, 'materials'])->name('inventory.materials');
        Route::get('inventory/materials/{id}/mutasi', [InventoryController::class, 'materialMutasi'])->name('inventory.material-mutasi');
        Route::get('inventory/mutasi', [InventoryController::class, 'mutasi'])->name('inventory.mutasi');
        Route::get('inventory/requests', [InventoryController::class, 'requests'])->name('inventory.requests');
        Route::get('inventory/requests/{id}', [InventoryController::class, 'requestDetail'])->name('inventory.request-detail');
        Route::post('inventory/requests/{id}/proses', [InventoryController::class, 'prosesRequest'])
            ->name('inventory.request.proses')->middleware('idempotency');
        Route::get('inventory/opname/materials', [InventoryController::class, 'opnameMaterials'])->name('inventory.opname-materials');
        Route::post('inventory/opname', [InventoryController::class, 'submitOpname'])
            ->name('inventory.opname')->middleware('idempotency');

        // Notifikasi
        Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::post('notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');

        // Portal Kontraktor
        Route::get('kontraktor/proyek', [KontraktorController::class, 'proyekList'])->name('kontraktor.proyek');
        Route::get('kontraktor/proyek/{id}', [KontraktorController::class, 'proyekDetail'])->name('kontraktor.proyek-detail');
        Route::get('kontraktor/invoice', [KontraktorController::class, 'invoiceList'])->name('kontraktor.invoice');
        Route::post('kontraktor/komunikasi', [KontraktorController::class, 'sendMessage'])
            ->name('kontraktor.komunikasi')->middleware('idempotency');

        // Ringkasan pekerjaan server-side untuk Home Kerja (Fase 2 T1)
        Route::get('me/pending-summary', PendingSummaryController::class)->name('me.pending-summary');
    });
});

// Alias kompatibilitas root /api/me/pending-summary
Route::get('me/pending-summary', PendingSummaryController::class)
    ->name('mobile.me.pending-summary')
    ->middleware(['auth:sanctum', 'mobile.auth', 'active.role', 'throttle:mobile']);
