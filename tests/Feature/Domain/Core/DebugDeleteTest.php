<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->owner = User::factory()->create();
    $this->owner->assignRole('Owner');
});

test('debug delete via http with query log', function () {
    DB::enableQueryLog();
    $unit = UnitBisnis::factory()->create();
    $resp = $this->actingAs($this->owner)
        ->delete(route('core.unit-bisnis.destroy', $unit));
    $log = fopen(sys_get_temp_dir().'/opencode/dbg_queries.txt', 'w');
    foreach (DB::getQueryLog() as $q) {
        fwrite($log, $q['query'].' -- '.json_encode($q['bindings'])."\n");
    }
    fwrite($log, 'target='.$resp->headers->get('Location')."\n");
    fclose($log);
    $this->assertTrue(true);
});
