<?php

use App\Support\GoogleMapsLink;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

test('ekstrak @lat,lng dari URL place Google Maps', function () {
    $url = 'https://www.google.com/maps/place/Patikraja/@-7.4685527,109.217636,17z/data=!3m1!4b1';

    expect(GoogleMapsLink::extractCoordinates($url))
        ->toBe(['lat' => -7.4685527, 'lng' => 109.217636]);
});

test('ekstrak query=lat,lng dengan koma ter-encode %2C', function () {
    $url = 'https://www.google.com/maps/search/?api=1&query=-7.1%2C110.2';

    expect(GoogleMapsLink::extractCoordinates($url))
        ->toBe(['lat' => -7.1, 'lng' => 110.2]);
});

test('ekstrak q=lat,lng dan ll=lat,lng', function () {
    expect(GoogleMapsLink::extractCoordinates('https://maps.google.com/?q=-6.2,106.8'))
        ->toBe(['lat' => -6.2, 'lng' => 106.8]);

    expect(GoogleMapsLink::extractCoordinates('https://maps.google.com/?ll=-6.9,107.6&z=15'))
        ->toBe(['lat' => -6.9, 'lng' => 107.6]);
});

test('ekstrak teks polos lat,lng', function () {
    expect(GoogleMapsLink::extractCoordinates('-7.4685527, 109.217636'))
        ->toBe(['lat' => -7.4685527, 'lng' => 109.217636]);

    expect(GoogleMapsLink::extractCoordinates('-7.4685527;109.217636'))
        ->toBe(['lat' => -7.4685527, 'lng' => 109.217636]);
});

test('tautan tanpa koordinat mengembalikan null', function () {
    expect(GoogleMapsLink::extractCoordinates('https://www.google.com/maps/place/Patikraja'))
        ->toBeNull();

    expect(GoogleMapsLink::extractCoordinates('bukan link sama sekali'))->toBeNull();
    expect(GoogleMapsLink::extractCoordinates(''))->toBeNull();
});

test('koordinat di luar rentang valid ditolak', function () {
    expect(GoogleMapsLink::extractCoordinates('@200,300'))->toBeNull();
    expect(GoogleMapsLink::extractCoordinates('91,10'))->toBeNull();
});

test('link pendek di-resolve via HTTP sebelum parsing', function () {
    Http::fake([
        'maps.app.goo.gl/*' => Http::response('', 200),
    ]);

    // Fake tidak benar-benar mengikuti redirect, jadi hasil menjadi null —
    // yang penting: request ke host shortlink dikirim.
    GoogleMapsLink::extractCoordinates('https://maps.app.goo.gl/abc123');

    Http::assertSent(fn ($request) => str_contains($request->url(), 'maps.app.goo.gl'));
});

test('link pendek tanpa skema dinormalisasi ke https', function () {
    Http::fake([
        'maps.app.goo.gl/*' => Http::response('', 200),
    ]);

    GoogleMapsLink::extractCoordinates('maps.app.goo.gl/abc123');

    Http::assertSent(fn ($request) => str_starts_with($request->url(), 'https://maps.app.goo.gl'));
});
