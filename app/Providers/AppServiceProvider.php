<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

use Illuminate\Support\Facades\Gate;

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
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\Produk;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\QCSample;
use App\Domain\HR\Models\Karyawan;
use App\Domain\HR\Models\GajiPeriode;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\Invoice;

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
use App\Policies\MesinProduksiPolicy;
use App\Policies\ProdukPolicy;
use App\Policies\ProductionSessionPolicy;
use App\Policies\QCPolicy;
use App\Policies\KaryawanPolicy;
use App\Policies\GajiPeriodePolicy;
use App\Policies\AkunKasBankPolicy;
use App\Policies\InvoicePolicy;

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

        // Production Policies
        Gate::policy(MesinProduksi::class, MesinProduksiPolicy::class);
        Gate::policy(Produk::class, ProdukPolicy::class);
        Gate::policy(ProductionSession::class, ProductionSessionPolicy::class);
        Gate::policy(QCSample::class, QCPolicy::class);

        // HR & Payroll Policies
        Gate::policy(Karyawan::class, KaryawanPolicy::class);
        Gate::policy(GajiPeriode::class, GajiPeriodePolicy::class);

        // Finance Policies
        Gate::policy(AkunKasBank::class, AkunKasBankPolicy::class);
        Gate::policy(Invoice::class, InvoicePolicy::class);
    }
}
