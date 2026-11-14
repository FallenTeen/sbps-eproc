<?php

use Illuminate\Support\Facades\DB;

echo 'connection: '.DB::connection()->getName()."\n";
echo 'database: '.DB::connection()->getDatabaseName()."\n";
$latest = DB::table('presensis')->orderByDesc('check_in')->limit(5)->get(['id', 'karyawan_id', 'check_in', 'check_out']);
echo "latest presensis:\n";
foreach ($latest as $r) {
    echo "{$r->id} k{$r->karyawan_id} {$r->check_in} -> {$r->check_out}\n";
}
$count = DB::table('mobile_tracking_locations')->count();
echo "tracking locs total: {$count}\n";
$latestLoc = DB::table('mobile_tracking_locations')->orderByDesc('recorded_at')->limit(8)->get(['id', 'presensi_id', 'recorded_at', 'created_at', 'latitude', 'longitude']);
foreach ($latestLoc as $l) {
    echo "loc #{$l->id} p{$l->presensi_id} rec={$l->recorded_at} created={$l->created_at} lat={$l->latitude} lng={$l->longitude}\n";
}
