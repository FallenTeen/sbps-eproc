<?php

use App\Domain\Attendance\Http\Controllers\FormulirLapanganController;
use App\Domain\Attendance\Http\Controllers\PresensiController;
use App\Domain\Core\Http\Controllers\ProyekController;
use App\Domain\Core\Http\Controllers\RabController;
// Core Controllers
use App\Domain\Core\Http\Controllers\TitikController;
use App\Domain\Core\Http\Controllers\UnitBisnisController;
use App\Domain\Finance\Http\Controllers\AkunKasBankController;
use App\Domain\Finance\Http\Controllers\InvoiceController;
// Procurement Controllers
use App\Domain\Finance\Http\Controllers\LaporanKeuanganController;
use App\Domain\Finance\Http\Controllers\MutasiKasBankController;
use App\Domain\Finance\Http\Controllers\PembayaranKlienController;
use App\Domain\Finance\Http\Controllers\TransferKasController;
// Fleet Controllers
use App\Domain\Fleet\Http\Controllers\ArmadaController;
use App\Domain\Fleet\Http\Controllers\ArmadaPenanggungJawabController;
use App\Domain\Fleet\Http\Controllers\HelperArmadaController;
use App\Domain\Fleet\Http\Controllers\PengajuanServisArmadaController;
use App\Domain\Fleet\Http\Controllers\WorkshopController;
use App\Domain\Fleet\Http\Controllers\WorkshopTodoController;
use App\Domain\Fleet\Http\Controllers\BbmLogController;
use App\Domain\Fleet\Http\Controllers\ChecklistHarianController;
use App\Domain\Fleet\Http\Controllers\ChecklistSerahTerimaController;
use App\Domain\Fleet\Http\Controllers\DowntimeLogController;
use App\Domain\Fleet\Http\Controllers\RitaseController;
use App\Domain\Fleet\Http\Controllers\RuteTarifController;
use App\Domain\Fleet\Http\Controllers\ServiceHistoryController;
use App\Domain\Fleet\Http\Controllers\SewaAlatController;
// Production Controllers
use App\Domain\HR\Http\Controllers\CutiController;
use App\Domain\HR\Http\Controllers\KaryawanController;
use App\Domain\HR\Http\Controllers\PayrollController;
use App\Domain\Procurement\Http\Controllers\BahanBakuController;
use App\Domain\Procurement\Http\Controllers\PembayaranController;
use App\Domain\Procurement\Http\Controllers\PurchaseOrderController;
use App\Domain\Procurement\Http\Controllers\SupplierController;
use App\Domain\Inventory\Http\Controllers\DashboardController as InventoryDashboardController;
use App\Domain\Inventory\Http\Controllers\StokOpnameController;
// HR Controllers
use App\Domain\Production\Http\Controllers\MesinProduksiController;
use App\Domain\Production\Http\Controllers\MixDesignController;
use App\Domain\Production\Http\Controllers\PengirimanController;
// Attendance Controllers
use App\Domain\Production\Http\Controllers\ProductionSessionController;
use App\Domain\Production\Http\Controllers\ProdukController;
// Finance Controllers
use App\Domain\Production\Http\Controllers\QcSampleController;
use App\Domain\Production\Http\Controllers\ResepProduksiController;
// Attendance Controllers
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\KontraktorController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PortalController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoleSwitchController;
use App\Http\Controllers\UserManagementController;
// Dashboard & Owner
use Illuminate\Foundation\Application;
// Notifications
use Illuminate\Support\Facades\Route;
// Role Switcher
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'appName' => config('app.name', 'SBPS Multi-Unit Enterprise'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Authenticated & Verified routes
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.mark-read');
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead'])->name('notifications.mark-all-read');

    // Role Switcher
    Route::post('/switch-role', [RoleSwitchController::class, 'switch'])->name('switch-role');

    // ============================================================
    // CORE MODULE - Proyek, Titik, RAB, Unit Bisnis
    // ============================================================
    Route::prefix('core')->name('core.')->group(function () {
        // Unit Bisnis (hanya untuk admin/owner)
        Route::resource('unit-bisnis', UnitBisnisController::class)->except(['show'])->parameters(['unit-bisnis' => 'unitBisnis']);
        Route::get('unit-bisnis/{unitBisnis}', [UnitBisnisController::class, 'show'])->name('unit-bisnis.show');

        // Proyek
        Route::resource('proyek', ProyekController::class);
        Route::post('proyek/{proyek}/status', [ProyekController::class, 'updateStatus'])->name('proyek.status');

        // Titik
        Route::resource('titik', TitikController::class)->except(['index']);
        Route::get('proyek/{proyek}/titik', [TitikController::class, 'index'])->name('titik.index');

        // RAB
        Route::resource('rab', RabController::class)->except(['index']);
        Route::get('proyek/{proyek}/rab', [RabController::class, 'index'])->name('rab.index');
        Route::get('rab/{rab}/realisasi', [RabController::class, 'realisasi'])->name('rab.realisasi');
        Route::get('proyek/{proyek}/rab-vs-realisasi', [RabController::class, 'compare'])->name('rab.compare');
    });

    // ============================================================
    // PROCUREMENT MODULE
    // ============================================================
    Route::prefix('procurement')->name('procurement.')->middleware(['permission:manage procurement|approve procurement|pay procurement|view procurement'])->group(function () {
        // Bahan Baku
        Route::resource('bahan-baku', BahanBakuController::class);
        Route::post('bahan-baku/{bahanBaku}/harga', [BahanBakuController::class, 'setHarga'])->name('bahan-baku.set-harga');
        Route::get('bahan-baku/{bahanBaku}/stok', [BahanBakuController::class, 'stok'])->name('bahan-baku.stok');

        // Supplier
        Route::resource('supplier', SupplierController::class);

        // Purchase Order
        Route::resource('purchase-orders', PurchaseOrderController::class)->except(['destroy']);
        Route::post('purchase-orders/{purchaseOrder}/submit', [PurchaseOrderController::class, 'submit'])->name('purchase-orders.submit');
        Route::post('purchase-orders/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve'])->name('purchase-orders.approve');
        Route::post('purchase-orders/{purchaseOrder}/reject', [PurchaseOrderController::class, 'reject'])->name('purchase-orders.reject');
        Route::post('purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive'])->name('purchase-orders.receive');
        Route::get('purchase-orders/{purchaseOrder}/payment', [PurchaseOrderController::class, 'paymentForm'])->name('purchase-orders.payment');
        Route::post('purchase-orders/{purchaseOrder}/payment', [PurchaseOrderController::class, 'storePayment'])->name('purchase-orders.store-payment');
        Route::get('purchase-orders/approval-queue', [PurchaseOrderController::class, 'approvalQueue'])->name('purchase-orders.approval-queue');

        // Pembayaran (internal)
        Route::resource('pembayaran', PembayaranController::class)->only(['index', 'show']);
        Route::get('pembayaran/{pembayaran}/print', [PembayaranController::class, 'print'])->name('pembayaran.print');
    });

    // ============================================================
    // INVENTORY MODULE (Bagian 21.7) — role baru, reuse Procurement
    // ============================================================
    Route::prefix('inventory')->name('inventory.')->group(function () {
        Route::get('dashboard', [InventoryDashboardController::class, 'index'])
            ->middleware('permission:manage inventory|view inventory|manage procurement|view procurement')
            ->name('dashboard');

        Route::prefix('stok-opname')->name('stok-opname.')->middleware(['permission:manage stok opname|view stok opname'])->group(function () {
            Route::get('/', [StokOpnameController::class, 'index'])->name('index');
            Route::get('create', [StokOpnameController::class, 'create'])->name('create');
            Route::post('/', [StokOpnameController::class, 'store'])->name('store');
            Route::delete('{stokOpname}', [StokOpnameController::class, 'destroy'])->name('destroy');
        });
    });

    // ============================================================
    // FLEET MODULE (Armada & Alat Berat) - khusus GCS
    // ============================================================
    Route::prefix('fleet')->name('fleet.')->middleware(['permission:manage fleet|view fleet'])->group(function () {
        // Armada
        Route::resource('armada', ArmadaController::class);
        Route::post('armada/{armada}/assign-driver', [ArmadaController::class, 'assignDriver'])->name('armada.assign-driver');

        // v6 (21.2) — Penanggung Jawab Armada (utama & cadangan)
        Route::get('armada/{armada}/penanggung-jawab', [ArmadaPenanggungJawabController::class, 'index'])->name('armada.penanggung-jawab.index');
        Route::post('armada/{armada}/penanggung-jawab', [ArmadaPenanggungJawabController::class, 'store'])->name('armada.penanggung-jawab.store');
        Route::post('armada/{armada}/penanggung-jawab/cadangan', [ArmadaPenanggungJawabController::class, 'activateCadangan'])->name('armada.penanggung-jawab.cadangan');

        // v6 (21.6) — Helper Armada (visibility object-level: hanya PIC armada)
        Route::post('armada/{armada}/helper', [HelperArmadaController::class, 'store'])->name('armada.helper.store');
        Route::put('armada/{armada}/helper/{helper}', [HelperArmadaController::class, 'update'])->name('armada.helper.update');
        Route::delete('armada/{armada}/helper/{helper}', [HelperArmadaController::class, 'destroy'])->name('armada.helper.destroy');

        Route::post('armada/{armada}/record-ritase', [ArmadaController::class, 'recordRitase'])->name('armada.record-ritase');
        Route::post('armada/{armada}/record-sewa', [ArmadaController::class, 'recordSewa'])->name('armada.record-sewa');
        Route::post('armada/{armada}/record-service', [ArmadaController::class, 'recordService'])->name('armada.record-service');
        Route::post('armada/{armada}/record-checklist', [ArmadaController::class, 'recordChecklist'])->name('armada.record-checklist');
        Route::post('armada/{armada}/record-bbm', [ArmadaController::class, 'recordBbm'])->name('armada.record-bbm');
        Route::post('armada/{armada}/start-downtime', [ArmadaController::class, 'startDowntime'])->name('armada.start-downtime');
        Route::post('armada/{armada}/downtime/{downtime}/end', [ArmadaController::class, 'endDowntime'])->name('armada.end-downtime');

        // Service History (polymorphic)
        Route::resource('service-history', ServiceHistoryController::class)->except(['index']);
        Route::get('serviceable/{type}/{id}/service-history', [ServiceHistoryController::class, 'index'])->name('service-history.index');

        // Checklist Harian
        // NOTE: rute yang khusus (by-date, bulk, checklistable/*) didaftarkan
        // SEBELUM Route::resource, supaya tidak "ketabrak" oleh wildcard
        // {checklist_harian} milik resource route.
        Route::get('checklist-harian', [ChecklistHarianController::class, 'index'])->name('checklist-harian.index');
        Route::get('checklist-harian/by-date/{date}', [ChecklistHarianController::class, 'byDate'])->name('checklist-harian.by-date');
        Route::post('checklist-harian/bulk', [ChecklistHarianController::class, 'bulkStore'])->name('checklist-harian.bulk');
        Route::get('checklistable/{type}/{id}/checklist/create', [ChecklistHarianController::class, 'create'])->name('checklist-harian.create');
        Route::get('checklistable/{type}/{id}/checklists', [ChecklistHarianController::class, 'byCheckable'])->name('checklist-harian.by-checkable');
        Route::resource('checklist-harian', ChecklistHarianController::class)->only(['store', 'show', 'update']);

        // BBM
        // NOTE: sama seperti checklist-harian, rute custom didaftarkan
        // SEBELUM Route::resource supaya tidak ketabrak wildcard {bbm}.
        Route::get('bbm', [BbmLogController::class, 'index'])->name('bbm.index');
        Route::get('bbm/anomaly', [BbmLogController::class, 'anomaly'])->name('bbm.anomaly');
        Route::get('bbm/create', [BbmLogController::class, 'create'])->name('bbm.create');
        Route::get('serviceable/{type}/{id}/bbm', [BbmLogController::class, 'byServiceable'])->name('bbm.by-serviceable');
        Route::resource('bbm', BbmLogController::class)->only(['store', 'show', 'update', 'destroy']);

        // Downtime
        Route::get('downtime/active', [DowntimeLogController::class, 'active'])->name('downtime.active');
        Route::get('downtime/create', [DowntimeLogController::class, 'create'])->name('downtime.create');
        Route::resource('downtime', DowntimeLogController::class)->only(['store', 'update', 'destroy']);
        Route::post('downtime/{downtime}/end', [DowntimeLogController::class, 'end'])->name('downtime.end');
        Route::get('serviceable/{type}/{id}/downtime', [DowntimeLogController::class, 'index'])->name('downtime.index');

        // Ritase
        Route::resource('ritase', RitaseController::class);
        Route::post('ritase/{ritase}/approve', [RitaseController::class, 'approve'])->name('ritase.approve');
        Route::post('ritase/bulk', [RitaseController::class, 'bulkStore'])->name('ritase.bulk');
        Route::get('ritase/report/harian', [RitaseController::class, 'reportHarian'])->name('ritase.report-harian');
        Route::get('ritase/report/mingguan', [RitaseController::class, 'reportMingguan'])->name('ritase.report-mingguan');

        // Sewa Alat Jam
        Route::resource('sewa-alat', SewaAlatController::class);
        Route::post('sewa-alat/{sewaAlat}/approve', [SewaAlatController::class, 'approve'])->name('sewa-alat.approve');
        Route::post('sewa-alat/bulk', [SewaAlatController::class, 'bulkStore'])->name('sewa-alat.bulk');
        Route::get('sewa-alat/report/mingguan', [SewaAlatController::class, 'reportMingguan'])->name('sewa-alat.report-mingguan');

        // Checklist Serah Terima (21.10)
        Route::get('sewa-alat/{sewaAlat}/serah-terima', [ChecklistSerahTerimaController::class, 'show'])->name('sewa-alat.serah-terima.show');
        Route::post('sewa-alat/{sewaAlat}/serah-terima', [ChecklistSerahTerimaController::class, 'store'])->name('sewa-alat.serah-terima.store');
        Route::get('sewa-alat/{sewaAlat}/serah-terima/pdf', [ChecklistSerahTerimaController::class, 'print'])->name('sewa-alat.serah-terima.print');

        // Rute Tarif
        Route::resource('rute-tarif', RuteTarifController::class);
        Route::post('rute-tarif/{ruteTarif}/set-harga', [RuteTarifController::class, 'setHarga'])->name('rute-tarif.set-harga');
        Route::get('rute-tarif/current/{asal}/{tujuan}', [RuteTarifController::class, 'current'])->name('rute-tarif.current');
    });

    // v6 (21.8) — Sistem Servis Armada (multi-bagian: ajuan → approval →
    // workshop → sparepart Inventory). Group terpisah agar role Workshop &
    // Inventory ikut ter-expose (policy yang memilah akses per bagian).
    Route::prefix('fleet')->name('fleet.')->middleware([
        'permission:view fleet service|manage fleet service|approve fleet service|manage sparepart|view sparepart|view fleet|manage fleet',
    ])->group(function () {
        Route::get('servis-armada', [PengajuanServisArmadaController::class, 'index'])->name('servis-armada.index');
        Route::get('servis-armada/create', [PengajuanServisArmadaController::class, 'create'])->name('servis-armada.create');
        Route::post('servis-armada', [PengajuanServisArmadaController::class, 'store'])->name('servis-armada.store');
        Route::post('servis-armada/{pengajuan}/approve', [PengajuanServisArmadaController::class, 'approve'])->name('servis-armada.approve');
        Route::post('servis-armada/{pengajuan}/reject', [PengajuanServisArmadaController::class, 'reject'])->name('servis-armada.reject');
        Route::post('servis-armada/{pengajuan}/assign-workshop', [PengajuanServisArmadaController::class, 'assignWorkshop'])->name('servis-armada.assign-workshop');
        Route::post('servis-armada/{pengajuan}/request-sparepart', [PengajuanServisArmadaController::class, 'requestSparepart'])->name('servis-armada.request-sparepart');
        Route::post('servis-armada/{pengajuan}/record-sparepart', [PengajuanServisArmadaController::class, 'recordSparepart'])->name('servis-armada.record-sparepart');
        Route::post('servis-armada/{pengajuan}/complete', [PengajuanServisArmadaController::class, 'complete'])->name('servis-armada.complete');
        Route::get('servis-armada/{pengajuan}', [PengajuanServisArmadaController::class, 'show'])->name('servis-armada.show');
    });

    // v6 (21.9) — Role Workshop: to-do servis rutin terjadwal, ajuan sparepart
    // dari to-do, riwayat servis gabungan, monitoring kondisi alat produksi.
    Route::prefix('fleet/workshop')->name('fleet.workshop.')->middleware([
        'permission:view fleet service|manage fleet service|manage sparepart|view sparepart|view fleet|manage fleet',
    ])->group(function () {
        Route::get('todo', [WorkshopTodoController::class, 'index'])->name('todo.index');
        Route::post('todo', [WorkshopTodoController::class, 'store'])->name('todo.store');
        Route::put('todo/{todo}', [WorkshopTodoController::class, 'update'])->name('todo.update');
        Route::delete('todo/{todo}', [WorkshopTodoController::class, 'destroy'])->name('todo.destroy');
        Route::post('todo/{todo}/complete', [WorkshopTodoController::class, 'complete'])->name('todo.complete');
        Route::post('todo/{todo}/request-sparepart', [WorkshopTodoController::class, 'requestSparepart'])->name('todo.request-sparepart');
        Route::get('sparepart', [WorkshopController::class, 'sparepartIndex'])->name('sparepart.index');
        Route::post('sparepart/record', [WorkshopController::class, 'sparepartRecord'])->name('sparepart.record');
        Route::get('riwayat', [WorkshopController::class, 'riwayat'])->name('riwayat.index');
        Route::get('monitoring', [WorkshopController::class, 'monitoring'])->name('monitoring.index');
    });

    // ============================================================
    // PRODUCTION MODULE (CBP/AMP)
    // ============================================================
    Route::prefix('production')->name('production.')->middleware(['role:Owner|Koordinator CBP|Koordinator AMP'])->group(function () {
        // Dashboard Produksi
        Route::get('/dashboard', [App\Domain\Production\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

        // Mesin Produksi
        Route::resource('mesin', MesinProduksiController::class);
        Route::post('mesin/{mesin}/status', [MesinProduksiController::class, 'updateStatus'])->name('mesin.status');
        Route::post('mesin/{mesin}/record-service', [MesinProduksiController::class, 'recordService'])->name('mesin.record-service');
        Route::post('mesin/{mesin}/record-checklist', [MesinProduksiController::class, 'recordChecklist'])->name('mesin.record-checklist');
        Route::post('mesin/{mesin}/record-bbm', [MesinProduksiController::class, 'recordBbm'])->name('mesin.record-bbm');
        Route::post('mesin/{mesin}/start-downtime', [MesinProduksiController::class, 'startDowntime'])->name('mesin.start-downtime');
        Route::post('mesin/{mesin}/downtime/{downtime}/end', [MesinProduksiController::class, 'endDowntime'])->name('mesin.end-downtime');

        // Produk
        Route::resource('produk', ProdukController::class);
        Route::post('produk/{produk}/harga', [ProdukController::class, 'setHarga'])->name('produk.set-harga');

        // Resep Produksi (BOM)
        Route::resource('resep', ResepProduksiController::class)->except(['index']);
        Route::get('produk/{produk}/resep', [ResepProduksiController::class, 'index'])->name('resep.index');
        Route::get('produk/{produk}/resep/create', [ResepProduksiController::class, 'create'])->name('resep.create');
        Route::get('resep/{resep}/edit', [ResepProduksiController::class, 'edit'])->name('resep.edit');
        Route::put('resep/{resep}', [ResepProduksiController::class, 'update'])->name('resep.update');
        Route::delete('resep/{resep}', [ResepProduksiController::class, 'destroy'])->name('resep.destroy');

        // Mix Design (khusus CBP)
        Route::prefix('mix-design')->name('mix-design.')->group(function () {
            Route::get('/', [MixDesignController::class, 'index'])->name('index');
            Route::get('/create', [MixDesignController::class, 'create'])->name('create');
            Route::post('/', [MixDesignController::class, 'store'])->name('store');
            Route::get('/{mixDesign}', [MixDesignController::class, 'show'])->name('show');
            Route::get('/{mixDesign}/edit', [MixDesignController::class, 'edit'])->name('edit');
            Route::put('/{mixDesign}', [MixDesignController::class, 'update'])->name('update');
            Route::delete('/{mixDesign}', [MixDesignController::class, 'destroy'])->name('destroy');
            Route::post('/{mixDesign}/generate-resep/{produk}', [MixDesignController::class, 'generateResep'])->name('generate-resep');
        });

        // Sesi Produksi
        Route::get('sessions/active', [ProductionSessionController::class, 'active'])->name('sessions.active');
        Route::get('sessions/report/harian', [ProductionSessionController::class, 'reportHarian'])->name('sessions.report-harian');
        Route::resource('sessions', ProductionSessionController::class);
        Route::post('sessions/{session}/start', [ProductionSessionController::class, 'start'])->name('sessions.start');
        Route::post('sessions/{session}/end', [ProductionSessionController::class, 'end'])->name('sessions.end');
        Route::post('sessions/{session}/cancel', [ProductionSessionController::class, 'cancel'])->name('sessions.cancel');

        // QC Sample
        Route::resource('qc', QcSampleController::class)->only(['store', 'update', 'destroy']);
        Route::post('qc/{qc}/record-result', [QcSampleController::class, 'recordResult'])->name('qc.record-result');
        Route::get('qc/pending', [QcSampleController::class, 'pending'])->name('qc.pending');
        Route::get('qc', [QcSampleController::class, 'index'])->name('qc.index');
        Route::get('qc/create', [QcSampleController::class, 'create'])->name('qc.create');

        // Pengiriman
        Route::get('pengiriman/today', [PengirimanController::class, 'today'])->name('pengiriman.today');
        Route::resource('pengiriman', PengirimanController::class);
        Route::post('pengiriman/{pengiriman}/start', [PengirimanController::class, 'start'])->name('pengiriman.start');
        Route::post('pengiriman/{pengiriman}/complete', [PengirimanController::class, 'complete'])->name('pengiriman.complete');
        Route::post('pengiriman/{pengiriman}/cancel', [PengirimanController::class, 'cancel'])->name('pengiriman.cancel');
    });

    // ============================================================
    // HR MODULE (SDM & Payroll)
    // ============================================================
    Route::prefix('hr')->name('hr.')->middleware(['permission:manage hr'])->group(function () {
        // Karyawan
        Route::resource('karyawan', KaryawanController::class);
        Route::post('karyawan/{karyawan}/assign-titik', [KaryawanController::class, 'assignTitik'])->name('karyawan.assign-titik');
        Route::post('karyawan/{karyawan}/remove-titik', [KaryawanController::class, 'removeTitik'])->name('karyawan.remove-titik');
        Route::post('karyawan/{karyawan}/status', [KaryawanController::class, 'updateStatus'])->name('karyawan.status');

        // Cuti
        Route::prefix('cuti')->name('cuti.')->group(function () {
            Route::get('/', [CutiController::class, 'index'])->name('index');
            Route::post('/', [CutiController::class, 'store'])->name('store');
            Route::get('/{cuti}/edit', [CutiController::class, 'edit'])->name('edit');
            Route::put('/{cuti}', [CutiController::class, 'update'])->name('update');
            Route::delete('/{cuti}', [CutiController::class, 'destroy'])->name('destroy');
            Route::post('/{cuti}/approve', [CutiController::class, 'approve'])->name('approve');
            Route::post('/{cuti}/reject', [CutiController::class, 'reject'])->name('reject');
        });

        // Payroll
        Route::prefix('payroll')->name('payroll.')->group(function () {
            Route::get('/', [PayrollController::class, 'index'])->name('index');
            Route::post('/generate', [PayrollController::class, 'generate'])->name('generate');
            Route::get('/periode/{bulan}/{tahun}', [PayrollController::class, 'show'])->name('show');
            Route::post('/periode/{bulan}/{tahun}/pay', [PayrollController::class, 'pay'])->name('pay');
            Route::get('/review/{periode}', [PayrollController::class, 'review'])->name('review');
            Route::post('/{periode}/komponen', [PayrollController::class, 'addKomponen'])->name('add-komponen');
            Route::delete('/komponen/{komponen}', [PayrollController::class, 'deleteKomponen'])->name('delete-komponen');
        });
    });

    // ============================================================
    // ATTENDANCE MODULE (Presensi & Formulir Lapangan)
    // ============================================================
    Route::prefix('attendance')->name('attendance.')->middleware(['permission:manage hr|manage presensi|manage formulir lapangan'])->group(function () {
        // Presensi
        Route::prefix('presensi')->name('presensi.')->group(function () {
            Route::get('/', [PresensiController::class, 'index'])->name('index');
            Route::get('/create', [PresensiController::class, 'create'])->name('create');
            Route::post('/', [PresensiController::class, 'store'])->name('store');
            Route::get('/{presensi}', [PresensiController::class, 'show'])->name('show');
            Route::post('/{presensi}/check-out', [PresensiController::class, 'checkOut'])->name('check-out');
            Route::post('/{presensi}/review', [PresensiController::class, 'review'])->name('review');
        });

        // Formulir Lapangan
        Route::prefix('formulir')->name('formulir.')->group(function () {
            Route::get('/', [FormulirLapanganController::class, 'index'])->name('index');
            Route::get('/create', [FormulirLapanganController::class, 'create'])->name('create');
            Route::post('/', [FormulirLapanganController::class, 'store'])->name('store');
            Route::get('/{formulir}', [FormulirLapanganController::class, 'show'])->name('show');
        });
    });

    // ============================================================
    // FINANCE MODULE (Keuangan)
    // ============================================================
    Route::prefix('finance')->name('finance.')->middleware(['permission:manage finance'])->group(function () {
        // Kas & Bank
        Route::resource('akun-kas', AkunKasBankController::class);
        Route::get('akun-kas/{akunKasBank}/mutasi', [AkunKasBankController::class, 'mutasi'])->name('akun-kas.mutasi');
        Route::post('akun-kas/transfer', [AkunKasBankController::class, 'transfer'])->name('akun-kas.transfer');

        // Mutasi Kas (manual)
        Route::resource('mutasi-kas', MutasiKasBankController::class)->only(['index', 'store']);
        Route::get('mutasi-kas/report', [MutasiKasBankController::class, 'report'])->name('mutasi-kas.report');

        // Transfer Antar Kas
        Route::resource('transfer-kas', TransferKasController::class)->only(['create', 'store', 'index']);
        Route::get('transfer-kas/{transfer}', [TransferKasController::class, 'show'])->name('transfer-kas.show');

        // Invoice & Piutang
        Route::prefix('invoice')->name('invoice.')->group(function () {
            Route::get('/', [InvoiceController::class, 'index'])->name('index');
            Route::get('/create', [InvoiceController::class, 'create'])->name('create');
            Route::post('/', [InvoiceController::class, 'store'])->name('store');
            Route::get('/unbilled-items', [InvoiceController::class, 'unbilledItems'])->name('unbilled-items');
            Route::get('/sumber-tagihan', [InvoiceController::class, 'getSumberTagihan'])->name('sumber-tagihan');
            Route::get('/outstanding', [PembayaranKlienController::class, 'outstanding'])->name('outstanding');
            Route::get('/aging', [PembayaranKlienController::class, 'outstanding'])->name('aging');
            Route::get('/generate-from-production/{proyek}', [InvoiceController::class, 'generateFromProduction'])->name('generate-from-production');
            Route::get('/generate-from-ritase/{proyek}', [InvoiceController::class, 'generateFromRitase'])->name('generate-from-ritase');
            Route::get('/generate-from-sewa/{proyek}', [InvoiceController::class, 'generateFromSewa'])->name('generate-from-sewa');
            Route::get('/{invoice}', [InvoiceController::class, 'show'])->name('show');
            Route::get('/{invoice}/edit', [InvoiceController::class, 'edit'])->name('edit');
            Route::put('/{invoice}', [InvoiceController::class, 'update'])->name('update');
            Route::delete('/{invoice}', [InvoiceController::class, 'destroy'])->name('destroy');
            Route::post('/{invoice}/send', [InvoiceController::class, 'send'])->name('send');
            Route::get('/{invoice}/pdf', [InvoiceController::class, 'pdf'])->name('pdf');
        });

        // Pembayaran Klien
        Route::resource('pembayaran-klien', PembayaranKlienController::class)->only(['store', 'update', 'destroy']);
        Route::get('invoice/{invoice}/pembayaran', [PembayaranKlienController::class, 'index'])->name('pembayaran-klien.index');
        Route::post('invoice/{invoice}/pembayaran', [PembayaranKlienController::class, 'store'])->name('pembayaran-klien.store-invoice');

        // Laporan Keuangan Konsolidasi
        Route::prefix('laporan-keuangan')->name('laporan-keuangan.')->group(function () {
            Route::get('/', [LaporanKeuanganController::class, 'index'])->name('index');
            Route::get('/rab-realisasi', [LaporanKeuanganController::class, 'rabRealisasi'])->name('rab-realisasi');
            Route::get('/laba-rugi', [LaporanKeuanganController::class, 'labaRugi'])->name('laba-rugi');
            Route::get('/export-excel', [LaporanKeuanganController::class, 'exportExcel'])->name('export-excel');
        });
        Route::prefix('report')->name('report.')->group(function () {
            Route::get('/rab-vs-realisasi', [LaporanKeuanganController::class, 'rabRealisasi'])->name('rab-realisasi');
            Route::get('/laba-rugi', [LaporanKeuanganController::class, 'labaRugi'])->name('laba-rugi');
        });
    });

    // ============================================================
    // KONTRAKTOR PORTAL (Eksternal)
    // ============================================================
    Route::prefix('kontraktor')->name('kontraktor.')->middleware(['role:Kontraktor'])->group(function () {
        Route::get('/dashboard', [KontraktorController::class, 'dashboard'])->name('dashboard');
        Route::get('/proyek/{proyek}', [KontraktorController::class, 'proyekDetail'])->name('proyek.detail');
        Route::get('/proyek/{proyek}/produksi', [KontraktorController::class, 'produksi'])->name('produksi');
        Route::get('/proyek/{proyek}/invoice', [KontraktorController::class, 'invoice'])->name('invoice');
        Route::post('/proyek/{proyek}/komunikasi', [KontraktorController::class, 'sendMessage'])->name('komunikasi.send');
    });

    // ============================================================
    // AUDIT LOG (Hanya Owner)
    // ============================================================
    Route::prefix('audit')->name('audit.')->middleware(['role:Owner'])->group(function () {
        Route::get('/logs', [AuditLogController::class, 'index'])->name('logs');
        Route::get('/logs/export', [AuditLogController::class, 'export'])->name('logs.export');
        Route::get('/logs/{log}', [AuditLogController::class, 'show'])->name('logs.show');
    });

    // ============================================================
    // PROFILE ROUTES
    // ============================================================
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // ============================================================
    // USER MANAGEMENT (Owner & Admin saja)
    // ============================================================
    Route::prefix('users')->name('users.')->middleware(['role:Owner|Admin Keuangan'])->group(function () {
        Route::get('/', [UserManagementController::class, 'index'])->name('index');
        Route::get('/create', [UserManagementController::class, 'create'])->name('create');
        Route::post('/', [UserManagementController::class, 'store'])->name('store');
        Route::get('/{user}/edit', [UserManagementController::class, 'edit'])->name('edit');
        Route::put('/{user}', [UserManagementController::class, 'update'])->name('update');
        Route::delete('/{user}', [UserManagementController::class, 'destroy'])->name('destroy');
        Route::post('/{user}/assign-role', [UserManagementController::class, 'assignRole'])->name('assign-role');
        Route::post('/{user}/remove-role', [UserManagementController::class, 'removeRole'])->name('remove-role');
    });

});

// ============================================================
// PORTAL ROUTES (guest)
// ============================================================

Route::middleware('guest')->group(function () {
    Route::get('/portal', [PortalController::class, 'index'])->name('portal');
    Route::get('/login/{portal}', [PortalController::class, 'login'])->name('portal.login');
    Route::post('/login/{portal}', [PortalController::class, 'store'])->name('portal.login.store');
});

// Auth routes (disediakan oleh Breeze)
require __DIR__.'/auth.php';
