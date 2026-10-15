<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * Filter & sorting per kolom untuk halaman index (server-side).
 *
 * Kontrak request:
 *  - filters[kolom]=nilai
 *  - filters[kolom][from]=... & filters[kolom][to]=... (untuk tipe date)
 *  - sort=kolom & direction=asc|desc
 *  - per_page=10|15|20|25|50|100
 *
 * Spesifikasi kolom (whitelist):
 *  'kode'        => ['type' => 'like'],
 *  'aktif'       => ['type' => 'boolean'],
 *  'status'      => ['type' => 'exact'],
 *  'tanggal'     => ['type' => 'date'],
 *  'unit_bisnis' => ['type' => 'like', 'relation' => 'unitBisnis', 'column' => 'nama'],
 *
 * Kolom yang tidak ada di whitelist tidak bisa difilter / di-sort.
 */
trait FilterableTable
{
    /**
     * Terapkan filter + sorting ke query. Mengembalikan state sort untuk view.
     *
     * @param  array<string, array{type?: string, relation?: string, column?: string, searchable?: bool, sortable?: bool}>  $columns
     * @param  string|array<string, string>|null  $defaultSort
     * @return array{sort: string|null, direction: string}
     */
    protected function applyTableQuery(Builder $query, Request $request, array $columns, string|array|null $defaultSort = null): array
    {
        $this->applyTableFilters($query, $request, $columns);

        $sort = $request->input('sort');
        $direction = strtolower((string) $request->input('direction', 'asc')) === 'desc' ? 'desc' : 'asc';

        $validSort = is_string($sort)
            && array_key_exists($sort, $columns)
            && ($columns[$sort]['sortable'] ?? true) !== false
            && empty($columns[$sort]['relation']);

        if ($validSort) {
            $this->applyTableSort($query, $sort, $direction, $columns[$sort]);
        } else {
            $sort = null;
            $this->applyDefaultSort($query, $defaultSort);
        }

        return ['sort' => $sort, 'direction' => $direction];
    }

    /**
     * Jumlah baris per halaman ter-whitelist.
     */
    protected function tablePerPage(Request $request, int $default = 15, array $allowed = [10, 15, 20, 25, 50, 100]): int
    {
        $perPage = (int) $request->input('per_page', $default);

        return in_array($perPage, $allowed, true) ? $perPage : $default;
    }

    private function applyTableFilters(Builder $query, Request $request, array $columns): void
    {
        $filters = $request->input('filters', []);

        if (! is_array($filters)) {
            return;
        }

        foreach ($filters as $key => $value) {
            if (! array_key_exists($key, $columns) || ($columns[$key]['searchable'] ?? true) === false) {
                continue;
            }

            if (is_array($value)) {
                $this->applyRangeFilter($query, $value, $columns[$key], $key);
            } else {
                $this->applyValueFilter($query, $value, $columns[$key], $key);
            }
        }
    }

    private function applyValueFilter(Builder $query, mixed $value, array $config, string $key): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $match = fn (Builder $q, string $column) => $this->matchColumn($q, $column, $config['type'] ?? 'like', $value);

        if (! empty($config['relation'])) {
            $query->whereHas($config['relation'], fn (Builder $q) => $match($q, $config['column'] ?? $key));
        } else {
            $match($query, $config['column'] ?? $key);
        }
    }

    private function applyRangeFilter(Builder $query, array $range, array $config, string $key): void
    {
        $from = $range['from'] ?? null;
        $to = $range['to'] ?? null;

        if (($from === null || $from === '') && ($to === null || $to === '')) {
            return;
        }

        $column = $config['column'] ?? $key;

        $apply = function (Builder $q) use ($column, $from, $to) {
            if ($from !== null && $from !== '') {
                $q->whereDate($column, '>=', $from);
            }
            if ($to !== null && $to !== '') {
                $q->whereDate($column, '<=', $to);
            }
        };

        if (! empty($config['relation'])) {
            $query->whereHas($config['relation'], $apply);
        } else {
            $apply($query);
        }
    }

    private function matchColumn(Builder $query, string $column, string $type, mixed $value): void
    {
        match ($type) {
            'exact' => $query->where($column, $value),
            'boolean' => $query->where($column, filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? (bool) $value),
            'date' => $query->whereDate($column, $value),
            default => $query->where($column, 'like', '%'.$value.'%'),
        };
    }

    private function applyTableSort(Builder $query, string $sort, string $direction, array $config): void
    {
        // Sorting kolom relasi belum didukung (butuh join) — cukup filter saja.
        if (! empty($config['relation'])) {
            return;
        }

        $query->orderBy($config['column'] ?? $sort, $direction);
    }

    private function applyDefaultSort(Builder $query, string|array|null $defaultSort): void
    {
        if ($defaultSort === null || $defaultSort === '') {
            return;
        }

        foreach ((array) $defaultSort as $column => $direction) {
            $query->orderBy(is_int($column) ? $direction : $column, is_int($column) ? 'asc' : $direction);
        }
    }
}
