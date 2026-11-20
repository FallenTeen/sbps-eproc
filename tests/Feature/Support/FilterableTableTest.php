<?php

use App\Domain\Core\Models\Proyek;
use App\Domain\Core\Models\UnitBisnis;
use App\Traits\FilterableTable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

class FilterableTableHarness
{
    use FilterableTable;

    public function run(Builder $query, Request $request, array $columns, string|array|null $defaultSort = null): array
    {
        return $this->applyTableQuery($query, $request, $columns, $defaultSort);
    }

    public function perPage(Request $request, int $default = 15): int
    {
        return $this->tablePerPage($request, $default);
    }
}

function filterableTableHarness(): FilterableTableHarness
{
    return new FilterableTableHarness();
}

test('filters by like on a whitelisted column', function () {
    UnitBisnis::factory()->create(['kode' => 'AAA', 'nama' => 'Alpha']);
    UnitBisnis::factory()->create(['kode' => 'BBB', 'nama' => 'Beta']);

    $query = UnitBisnis::query();
    filterableTableHarness()->run(
        $query,
        new Request(['filters' => ['nama' => 'alp']]),
        ['nama' => ['type' => 'like']],
    );

    expect($query->pluck('kode')->all())->toBe(['AAA']);
});

test('ignores columns outside the whitelist', function () {
    UnitBisnis::factory()->create(['kode' => 'AAA']);
    UnitBisnis::factory()->create(['kode' => 'BBB']);

    $query = UnitBisnis::query();
    filterableTableHarness()->run(
        $query,
        new Request(['filters' => ['nama' => 'zzz']]),
        ['kode' => ['type' => 'like']],
    );

    expect($query->count())->toBe(2);
});

test('filters boolean column', function () {
    UnitBisnis::factory()->create(['kode' => 'AAA', 'aktif' => true]);
    UnitBisnis::factory()->create(['kode' => 'BBB', 'aktif' => false]);

    $query = UnitBisnis::query();
    filterableTableHarness()->run(
        $query,
        new Request(['filters' => ['aktif' => '0']]),
        ['aktif' => ['type' => 'boolean']],
    );

    expect($query->pluck('kode')->all())->toBe(['BBB']);
});

test('filters exact column', function () {
    UnitBisnis::factory()->create(['kode' => 'AAA', 'nama' => 'Alpha']);
    UnitBisnis::factory()->create(['kode' => 'AAB', 'nama' => 'Alpha']);

    $query = UnitBisnis::query();
    filterableTableHarness()->run(
        $query,
        new Request(['filters' => ['kode' => 'AAA']]),
        ['kode' => ['type' => 'exact']],
    );

    expect($query->pluck('kode')->all())->toBe(['AAA']);
});

test('filters date range', function () {
    Proyek::factory()->create(['nama' => 'OLD', 'tanggal_mulai' => '2026-01-01']);
    Proyek::factory()->create(['nama' => 'NEW', 'tanggal_mulai' => '2026-06-15']);

    $query = Proyek::query();
    filterableTableHarness()->run(
        $query,
        new Request(['filters' => ['tanggal_mulai' => ['from' => '2026-06-01']]]),
        ['tanggal_mulai' => ['type' => 'date']],
    );

    expect($query->pluck('nama')->all())->toBe(['NEW']);
});

test('filters by relation column', function () {
    $gcs = UnitBisnis::factory()->create(['kode' => 'GCS', 'nama' => 'General Contractor']);
    $cbp = UnitBisnis::factory()->create(['kode' => 'CBP', 'nama' => 'Batching Plant']);

    Proyek::factory()->create(['nama' => 'Proyek GCS', 'unit_bisnis_id' => $gcs->id]);
    Proyek::factory()->create(['nama' => 'Proyek CBP', 'unit_bisnis_id' => $cbp->id]);

    $query = Proyek::query();
    filterableTableHarness()->run(
        $query,
        new Request(['filters' => ['unit' => 'General']]),
        ['unit' => ['type' => 'like', 'relation' => 'unitBisnis', 'column' => 'nama']],
    );

    expect($query->pluck('nama')->all())->toBe(['Proyek GCS']);
});

test('sorts by whitelisted column and ignores invalid sort', function () {
    UnitBisnis::factory()->create(['kode' => 'BBB']);
    UnitBisnis::factory()->create(['kode' => 'AAA']);

    $query = UnitBisnis::query();
    $state = filterableTableHarness()->run(
        $query,
        new Request(['sort' => 'kode', 'direction' => 'asc']),
        ['kode' => ['type' => 'like']],
    );

    expect($state['sort'])->toBe('kode');
    expect($query->pluck('kode')->all())->toBe(['AAA', 'BBB']);

    $query2 = UnitBisnis::query();
    $state2 = filterableTableHarness()->run(
        $query2,
        new Request(['sort' => 'not_allowed']),
        ['kode' => ['type' => 'like']],
        'kode',
    );

    expect($state2['sort'])->toBeNull();
    expect($query2->pluck('kode')->all())->toBe(['AAA', 'BBB']);
});

test('per page is whitelisted', function () {
    expect(filterableTableHarness()->perPage(new Request(['per_page' => 50])))->toBe(50);
    expect(filterableTableHarness()->perPage(new Request(['per_page' => 999])))->toBe(15);
    expect(filterableTableHarness()->perPage(new Request()))->toBe(15);
});
