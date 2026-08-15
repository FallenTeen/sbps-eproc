<?php

namespace App\Providers;

use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

use Illuminate\Support\Facades\Gate;
use Illuminate\Cache\RateLimiting\Limit;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\Rab;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\Supplier;
use App\Domain\Procurement\Models\Pembayaran;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\BbmLog;
use App\Domain\Fleet\Models\DowntimeLog;
use App\Domain\Fleet\Models\RuteTarif;
use App\Domain\Fleet\Models\ServiceHistory;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\Produk;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\QCSample;
use App\Domain\HR\Models\Karyawan;
use App\Domain\HR\Models\GajiPeriode;
use App\Domain\Attendance\Models\Presensi;
use App\Domain\Attendance\Models\FormulirLapangan;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\Finance\Models\Invoice;
use App\Domain\Finance\Models\TransferAntarKas;
use App\Domain\Finance\Models\PembayaranKlien;

use App\Policies\ProyekPolicy;
use App\Policies\TitikPolicy;
use App\Policies\RabPolicy;
use App\Policies\UnitBisnisPolicy;
use App\Policies\PurchaseOrderPolicy;
use App\Policies\BahanBakuPolicy;
use App\Policies\SupplierPolicy;
use App\Policies\PembayaranPolicy;
use App\Policies\ArmadaPolicy;
use App\Policies\RitasePolicy;
use App\Policies\SewaAlatPolicy;
use App\Policies\ArmadaChecklistHarianPolicy;
use App\Policies\BbmLogPolicy;
use App\Policies\DowntimeLogPolicy;
use App\Policies\RuteTarifPolicy;
use App\Policies\ServiceHistoryPolicy;
use App\Policies\MesinProduksiPolicy;
use App\Policies\ProdukPolicy;
use App\Policies\ProductionSessionPolicy;
use App\Policies\QCPolicy;
use App\Policies\KaryawanPolicy;
use App\Policies\GajiPeriodePolicy;
use App\Policies\PresensiPolicy;
use App\Policies\FormulirLapanganPolicy;
use App\Policies\AkunKasBankPolicy;
use App\Policies\MutasiKasBankPolicy;
use App\Policies\InvoicePolicy;
use App\Policies\TransferKasPolicy;
use App\Policies\PembayaranKlienPolicy;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        RateLimiter::for('api', function ($request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Owner Super-Admin Bypass Rule
        Gate::before(function ($user, $ability) {
            return $user->hasRole('Owner') ? true : null;
        });

        // Explicit Policy mappings for models in Domain namespace
        Gate::policy(Proyek::class, ProyekPolicy::class);
        Gate::policy(Titik::class, TitikPolicy::class);
        Gate::policy(Rab::class, RabPolicy::class);
        Gate::policy(UnitBisnis::class, UnitBisnisPolicy::class);

        // Procurement Policies
        Gate::policy(PurchaseOrder::class, PurchaseOrderPolicy::class);
        Gate::policy(BahanBaku::class, BahanBakuPolicy::class);
        Gate::policy(Supplier::class, SupplierPolicy::class);
        Gate::policy(Pembayaran::class, PembayaranPolicy::class);

        // Fleet Policies
        Gate::policy(Armada::class, ArmadaPolicy::class);
        Gate::policy(Ritase::class, RitasePolicy::class);
        Gate::policy(SewaAlatJam::class, SewaAlatPolicy::class);
        Gate::policy(ArmadaChecklistHarian::class, ArmadaChecklistHarianPolicy::class);
        Gate::policy(BbmLog::class, BbmLogPolicy::class);
        Gate::policy(DowntimeLog::class, DowntimeLogPolicy::class);
        Gate::policy(RuteTarif::class, RuteTarifPolicy::class);
        Gate::policy(ServiceHistory::class, ServiceHistoryPolicy::class);

        // Production Policies
        Gate::policy(MesinProduksi::class, MesinProduksiPolicy::class);
        Gate::policy(Produk::class, ProdukPolicy::class);
        Gate::policy(ProductionSession::class, ProductionSessionPolicy::class);
        Gate::policy(QCSample::class, QCPolicy::class);

        // HR & Payroll Policies
        Gate::policy(Karyawan::class, KaryawanPolicy::class);
        Gate::policy(GajiPeriode::class, GajiPeriodePolicy::class);

        // Attendance Policies
        Gate::policy(Presensi::class, PresensiPolicy::class);
        Gate::policy(FormulirLapangan::class, FormulirLapanganPolicy::class);

        // Finance Policies
        Gate::policy(AkunKasBank::class, AkunKasBankPolicy::class);
        Gate::policy(MutasiKasBank::class, MutasiKasBankPolicy::class);
        Gate::policy(Invoice::class, InvoicePolicy::class);
        Gate::policy(TransferAntarKas::class, TransferKasPolicy::class);
        Gate::policy(PembayaranKlien::class, PembayaranKlienPolicy::class);
    }
}
