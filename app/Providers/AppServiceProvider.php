<?php

namespace App\Providers;

use App\Domain\Attendance\Models\FormulirLapangan;
use App\Domain\Attendance\Models\Presensi;
use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\Rab;
use App\Domain\Core\Models\Titik;
use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Finance\Models\AkunKasBank;
use App\Domain\Finance\Models\Invoice;
use App\Domain\Finance\Models\MutasiKasBank;
use App\Domain\Finance\Models\PembayaranKlien;
use App\Domain\Finance\Models\TransferAntarKas;
use App\Domain\Fleet\Models\Armada;
use App\Domain\Fleet\Models\ArmadaChecklistHarian;
use App\Domain\Fleet\Models\BbmLog;
use App\Domain\Fleet\Models\DowntimeLog;
use App\Domain\Fleet\Models\Ritase;
use App\Domain\Fleet\Models\RuteTarif;
use App\Domain\Fleet\Models\ServiceHistory;
use App\Domain\Fleet\Models\SewaAlatJam;
use App\Domain\HR\Models\GajiPeriode;
use App\Domain\HR\Models\Karyawan;
use App\Domain\Procurement\Models\BahanBaku;
use App\Domain\Procurement\Models\Pembayaran;
use App\Domain\Procurement\Models\PurchaseOrder;
use App\Domain\Procurement\Models\Supplier;
use App\Domain\Production\Models\MesinProduksi;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Production\Models\Produk;
use App\Domain\Production\Models\QCSample;
use App\Policies\AkunKasBankPolicy;
use App\Policies\ArmadaChecklistHarianPolicy;
use App\Policies\ArmadaPolicy;
use App\Policies\BahanBakuPolicy;
use App\Policies\BbmLogPolicy;
use App\Policies\DowntimeLogPolicy;
use App\Policies\FormulirLapanganPolicy;
use App\Policies\GajiPeriodePolicy;
use App\Policies\InvoicePolicy;
use App\Policies\KaryawanPolicy;
use App\Policies\MesinProduksiPolicy;
use App\Policies\MutasiKasBankPolicy;
use App\Policies\PembayaranKlienPolicy;
use App\Policies\PembayaranPolicy;
use App\Policies\PresensiPolicy;
use App\Policies\ProductionSessionPolicy;
use App\Policies\ProdukPolicy;
use App\Policies\ProyekPolicy;
use App\Policies\PurchaseOrderPolicy;
use App\Policies\QCPolicy;
use App\Policies\RabPolicy;
use App\Policies\RitasePolicy;
use App\Policies\RuteTarifPolicy;
use App\Policies\ServiceHistoryPolicy;
use App\Policies\SewaAlatPolicy;
use App\Policies\SupplierPolicy;
use App\Policies\TitikPolicy;
use App\Policies\TransferKasPolicy;
use App\Policies\UnitBisnisPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

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

        /*
        |----------------------------------------------------------------------
        | Rate limiter khusus API mobile (terpisah dari limiter web/api)
        |----------------------------------------------------------------------
        | Semua batasan mengembalikan envelope JSON standar + header
        | Retry-After agar client Flutter bisa menunggu dengan benar.
        */
        $throttleResponse = fn (Request $request, array $headers) => response()->json([
            'status' => 'error',
            'message' => 'Terlalu banyak permintaan, coba lagi sebentar.',
            'errors' => null,
        ], 429, $headers);

        // Umum: 60 req/menit per user (atau per IP untuk anonim).
        RateLimiter::for('mobile', function (Request $request) use ($throttleResponse) {
            return Limit::perMinute(60)
                ->by($request->user()?->id ?: 'ip:'.$request->ip())
                ->response($throttleResponse);
        });

        // Tracking batch: 20 req/menit per user (anti flood dari client bug).
        RateLimiter::for('mobile-tracking', function (Request $request) use ($throttleResponse) {
            return Limit::perMinute(20)
                ->by($request->user()?->id ?: 'ip:'.$request->ip())
                ->response($throttleResponse);
        });

        // Upload file: 30 req/menit per user.
        RateLimiter::for('mobile-upload', function (Request $request) use ($throttleResponse) {
            return Limit::perMinute(30)
                ->by($request->user()?->id ?: 'ip:'.$request->ip())
                ->response($throttleResponse);
        });

        // Login: 5 percobaan/menit per kombinasi email + IP.
        RateLimiter::for('mobile-login', function (Request $request) use ($throttleResponse) {
            return Limit::perMinute(5)
                ->by(strtolower((string) $request->input('email')).'|'.$request->ip())
                ->response($throttleResponse);
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
