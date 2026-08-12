<?php

namespace App\Http\Controllers;

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\KomunikasiLog;
use App\Domain\Production\Models\ProductionSession;
use App\Domain\Finance\Models\Invoice;
use App\Domain\Core\Actions\GetRABRealisasiAction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class KontraktorController extends Controller
{
    public function dashboard()
    {
        // Hanya proyek dengan tipe kontrak_klien
        $proyekList = Proyek::kontrakKlien()
            ->with(['unitBisnis:id,nama'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Kontraktor/Index', [
            'proyekList' => $proyekList,
        ]);
    }

    public function proyekDetail(Proyek $proyek)
    {
        // Pastikan hanya proyek tipe kontrak_klien
        if ($proyek->tipe_proyek !== 'kontrak_klien') {
            abort(403, 'Akses khusus untuk proyek kontrak klien.');
        }

        // 1. Progres Produksi (Ringkasan Output saja, Tanpa detail biaya)
        $sessions = ProductionSession::where('proyek_id', $proyek->id)
            ->with('produk:id,nama,satuan_output')
            ->get();

        $produksiSummary = [];
        foreach ($sessions as $s) {
            $namaProduk = $s->produk ? $s->produk->nama : 'Produk Lain';
            $satuan = $s->produk ? $s->produk->satuan_output : 'Unit';

            if (!isset($produksiSummary[$namaProduk])) {
                $produksiSummary[$namaProduk] = [
                    'nama' => $namaProduk,
                    'satuan' => $satuan,
                    'total_output' => 0,
                    'sesi_count' => 0,
                ];
            }
            $produksiSummary[$namaProduk]['total_output'] += (float)$s->hasil_output;
            $produksiSummary[$namaProduk]['sesi_count'] += 1;
        }

        // 2. RAB Level Agregat (Rencana vs Realisasi Total, Tanpa breakdown item sensitif)
        $rabItems = $proyek->rab;
        $totalRencanaRab = 0;
        $totalRealisasiRab = 0;
        $getRabAction = new GetRABRealisasiAction();

        foreach ($rabItems as $rab) {
            $totalRencanaRab += (float)$rab->rencana;
            $totalRealisasiRab += (float)$getRabAction->execute($rab);
        }

        // 3. Daftar Invoice (Read-only)
        $invoices = Invoice::where('proyek_id', $proyek->id)
            ->with(['items', 'pembayaranKlien'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($inv) {
                $total = (float)$inv->items->sum('subtotal');
                $paid = (float)$inv->pembayaranKlien->sum('jumlah');
                return [
                    'id' => $inv->id,
                    'kode_invoice' => $inv->kode_invoice,
                    'tanggal_terbit' => $inv->tanggal_terbit ? $inv->tanggal_terbit->format('Y-m-d') : null,
                    'tanggal_jatuh_tempo' => $inv->tanggal_jatuh_tempo ? $inv->tanggal_jatuh_tempo->format('Y-m-d') : null,
                    'status' => $inv->status,
                    'total' => $total,
                    'paid' => $paid,
                    'sisa' => max(0, $total - $paid),
                ];
            });

        // 4. Log Komunikasi (Thread antara kantor dan kontraktor)
        $komunikasiLogs = KomunikasiLog::where('proyek_id', $proyek->id)
            ->with('user:id,name,nama_lengkap')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'pengirim' => $log->user ? ($log->user->nama_lengkap ?? $log->user->name) : 'Sistem',
                    'pengirim_role' => $log->pengirim_role,
                    'pesan' => $log->pesan,
                    'waktu' => $log->created_at ? $log->created_at->format('d/m/Y H:i') : '',
                ];
            });

        return Inertia::render('Kontraktor/Detail', [
            'proyek' => [
                'id' => $proyek->id,
                'kode_proyek' => $proyek->kode_proyek,
                'nama' => $proyek->nama,
                'client' => $proyek->client,
                'lokasi' => $proyek->lokasi,
                'status' => $proyek->status,
                'tanggal_mulai' => $proyek->tanggal_mulai ? $proyek->tanggal_mulai->format('Y-m-d') : null,
            ],
            'produksiSummary' => array_values($produksiSummary),
            'rabAgregat' => [
                'total_rencana' => $totalRencanaRab,
                'total_realisasi' => $totalRealisasiRab,
                'persentase' => $totalRencanaRab > 0 ? round(($totalRealisasiRab / $totalRencanaRab) * 100, 1) : 0,
            ],
            'invoices' => $invoices,
            'komunikasiLogs' => $komunikasiLogs,
        ]);
    }

    public function produksi(Proyek $proyek)
    {
        return redirect()->route('kontraktor.proyek.detail', $proyek->id);
    }

    public function invoice(Proyek $proyek)
    {
        return redirect()->route('kontraktor.proyek.detail', $proyek->id);
    }

    public function sendMessage(Request $request, Proyek $proyek)
    {
        $validated = $request->validate([
            'pesan' => 'required|string|max:1000',
        ]);

        $user = Auth::user();
        $role = ($user && $user->hasRole('Kontraktor')) ? 'kontraktor' : 'kantor';

        KomunikasiLog::create([
            'proyek_id' => $proyek->id,
            'user_id' => $user->id,
            'pengirim_role' => $role,
            'pesan' => $validated['pesan'],
        ]);

        return redirect()->back()->with('success', 'Pesan berhasil terkirim.');
    }
}
