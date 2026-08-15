<?php

use App\Models\User;
use App\Domain\Core\Models\UnitBisnis;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->owner = User::factory()->create();
    $this->owner->assignRole('Owner');
});

test('debug delete via http with query log', function () {
    \Illuminate\Support\Facades\DB::enableQueryLog();
    $unit = UnitBisnis::factory()->create();
    $resp = $this->actingAs($this->owner)
        ->delete(route('core.unit-bisnis.destroy', $unit));
    $log = fopen(sys_get_temp_dir() . '/opencode/dbg_queries.txt', 'w');
    foreach (\Illuminate\Support\Facades\DB::getQueryLog() as $q) {
        fwrite($log, $q['query'] . ' -- ' . json_encode($q['bindings']) . "\n");
    }
    fwrite($log, 'target=' . $resp->headers->get('Location') . "\n");
    fclose($log);
    $this->assertTrue(true);
});