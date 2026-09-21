<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->owner = User::factory()->create();
    $this->owner->assignRole('Owner');
});

test('resolve mengekstrak koordinat dari link @lat,lng', function () {
    $this->actingAs($this->owner)
        ->getJson(route('core.lokasi.resolve', [
            'link' => 'https://www.google.com/maps/place/Patikraja/@-7.4685527,109.217636,17z',
        ]))
        ->assertOk()
        ->assertJsonPath('latitude', -7.4685527)
        ->assertJsonPath('longitude', 109.217636);
});

test('resolve mengekstrak koordinat dari query ter-encode', function () {
    $this->actingAs($this->owner)
        ->getJson(route('core.lokasi.resolve', [
            'link' => 'https://www.google.com/maps/search/?api=1&query=-7.1%2C110.2',
        ]))
        ->assertOk()
        ->assertJsonPath('latitude', -7.1)
        ->assertJsonPath('longitude', 110.2);
});

test('resolve menolak tautan tanpa koordinat', function () {
    $this->actingAs($this->owner)
        ->getJson(route('core.lokasi.resolve', [
            'link' => 'https://www.google.com/maps/place/Patikraja',
        ]))
        ->assertStatus(422)
        ->assertJsonPath('latitude', null)
        ->assertJsonPath('longitude', null)
        ->assertJsonStructure(['error']);
});

test('resolve membutuhkan autentikasi', function () {
    $this->get(route('core.lokasi.resolve', [
        'link' => 'https://maps.google.com/?q=-7.1,110.2',
    ]))->assertRedirect(route('login'));
});

test('reverse mengembalikan alamat dari Nominatim', function () {
    Http::fake([
        'nominatim.openstreetmap.org/*' => Http::response([
            'display_name' => 'Jalan Raya Patikraja, Banyumas, Jawa Tengah, Indonesia',
        ], 200),
    ]);

    $this->actingAs($this->owner)
        ->getJson(route('core.lokasi.reverse', ['lat' => -7.4685527, 'lng' => 109.217636]))
        ->assertOk()
        ->assertJsonPath('latitude', -7.4685527)
        ->assertJsonPath('longitude', 109.217636)
        ->assertJsonPath('alamat', 'Jalan Raya Patikraja, Banyumas, Jawa Tengah, Indonesia')
        ->assertJsonPath('ditemukan', true);
});

test('reverse tetap sukses walau Nominatim gagal (alamat null)', function () {
    Http::fake([
        'nominatim.openstreetmap.org/*' => Http::response('', 500),
    ]);

    $this->actingAs($this->owner)
        ->getJson(route('core.lokasi.reverse', ['lat' => -6.2, 'lng' => 106.8]))
        ->assertOk()
        ->assertJsonPath('latitude', -6.2)
        ->assertJsonPath('longitude', 106.8)
        ->assertJsonPath('alamat', null)
        ->assertJsonPath('ditemukan', false);
});

test('reverse memvalidasi rentang koordinat', function () {
    // Route web: kegagalan validasi dirender sebagai redirect + session errors.
    $this->actingAs($this->owner)
        ->get(route('core.lokasi.reverse', ['lat' => 200, 'lng' => 500]))
        ->assertSessionHasErrors(['lat']);
});
