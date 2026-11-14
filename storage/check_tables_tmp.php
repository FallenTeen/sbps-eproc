<?php

use Illuminate\Support\Facades\DB;

$tables = DB::select('SHOW TABLES');
foreach ($tables as $t) {
    $name = array_values((array) $t)[0];
    if (str_contains($name, 'presensi') || str_contains($name, 'tracking') || str_contains($name, 'karyawan')) {
        echo $name."\n";
    }
}
