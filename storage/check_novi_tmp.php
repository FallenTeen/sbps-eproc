<?php

use Illuminate\Support\Facades\DB;

$nama = $argv[1] ?? 'NOVI';
$tgl = $argv[2] ?? now()->toDateString();

$p = DB::table('presensis as p')
    ->join('karyawans as k', 'k.id', '=', 'p.karyawan_id')
    ->where('k.nama', $nama)
    ->whereDate('p.check_in', $tgl)
    ->select('p.id', 'k.nama', 'p.check_in', 'p.check_out', 'p.check_in_lat', 'p.check_in_lng', 'p.check_out_lat', 'p.check_out_lng', 'p.titik_id')
    ->first();

if (! $p) {
    echo "presensi tidak ditemukan: {$nama} {$tgl}\n";
    exit;
}

echo "presensi {$p->id} {$p->nama} check_in={$p->check_in} out={$p->check_out}\n";
echo "check_in_gps=({$p->check_in_lat}, {$p->check_in_lng})\n";

if ($p->titik_id) {
    $t = DB::table('titiks')->where('id', $p->titik_id)->first();
    if ($t) {
        echo "titik '{$t->nama}' lat={$t->latitude} lng={$t->longitude} radius={$t->radius_presensi_meter}\n";
    }
}

$locs = DB::table('mobile_tracking_locations')
    ->where('presensi_id', $p->id)
    ->orderBy('recorded_at')
    ->orderBy('created_at')
    ->get(['id', 'recorded_at', 'latitude', 'longitude']);

echo 'total raw rows: '.$locs->count()."\n";
foreach ($locs as $l) {
    echo "loc {$l->id} rec={$l->recorded_at} lat={$l->latitude} lng={$l->longitude}\n";
}
