<?php

use App\Domain\Core\Models\Proyek;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->owner = User::factory()->create();
    $this->owner->assignRole('Owner');

    $this->user = User::factory()->create();
    $this->user->assignRole('Kontraktor');

    // Pastikan Spatie Activity Log migration sudah dijalankan
    // dan model Proyek sudah pakai trait LogsActivity
});

test('owner can view audit log index', function () {
    // Buat aktivitas log
    $proyek = Proyek::factory()->create();
    $proyek->update(['nama' => 'Updated']);

    $this->actingAs($this->owner)
        ->get(route('audit.logs'))
        ->assertStatus(200)
        ->assertSee('Proyek');
});

test('owner can view audit log detail', function () {
    $proyek = Proyek::factory()->create();
    $proyek->update(['nama' => 'Updated']);

    $log = Activity::where('event', 'updated')->first();

    $this->actingAs($this->owner)
        ->get(route('audit.logs.show', $log->id))
        ->assertStatus(200)
        ->assertSee('Updated');
});

test('normal user cannot view audit log', function () {
    $this->actingAs($this->user)
        ->get(route('audit.logs'))
        ->assertStatus(403);
});

test('audit log can be filtered by model type', function () {
    $proyek = Proyek::factory()->create();

    $this->actingAs($this->owner)
        ->get(route('audit.logs', ['model_type' => 'Proyek']))
        ->assertStatus(200);
});

test('audit log can be exported', function () {
    $this->actingAs($this->owner)
        ->get(route('audit.logs.export'))
        ->assertStatus(200)
        ->assertDownload();
});
