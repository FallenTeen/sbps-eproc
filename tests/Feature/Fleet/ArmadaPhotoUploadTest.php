<?php

use App\Domain\Core\Models\UnitBisnis;
use App\Domain\Fleet\Models\Armada;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;

uses(TestCase::class, RefreshDatabase::class);

function photoFleetUser(): User
{
    $user = User::factory()->create();
    Permission::findOrCreate('manage fleet');
    $user->givePermissionTo('manage fleet');

    return $user;
}

beforeEach(function () {
    $this->user = photoFleetUser();
    $this->actingAs($this->user);

    $this->unit = UnitBisnis::factory()->gcs()->create();

    Storage::fake('public');
});

test('store armada menerima foto png jpg jpeg dan webp', function (string $filename, string $mime) {
    $response = $this->post(route('fleet.armada.store'), [
        'unit_bisnis_id' => $this->unit->id,
        'kode_unit' => 'FOTO-'.strtoupper(pathinfo($filename, PATHINFO_EXTENSION)),
        'jenis' => 'dump_truck',
        'model_tarif' => 'ritase',
        'foto_unit' => UploadedFile::fake()->image($filename, 320, 200)->mimeType($mime),
    ]);

    $response->assertRedirect(route('fleet.armada.index'));

    $armada = Armada::where('kode_unit', 'FOTO-'.strtoupper(pathinfo($filename, PATHINFO_EXTENSION)))->firstOrFail();

    expect($armada->hasMedia('foto_unit'))->toBeTrue()
        ->and($armada->foto_url)->toContain('storage/');
})->with([
    ['foto.png', 'image/png'],
    ['foto.jpg', 'image/jpeg'],
    ['foto.jpeg', 'image/jpeg'],
    ['foto.webp', 'image/webp'],
]);

test('store armada menolak file bukan gambar', function () {
    $this->post(route('fleet.armada.store'), [
        'unit_bisnis_id' => $this->unit->id,
        'kode_unit' => 'FOTO-BAD',
        'jenis' => 'dump_truck',
        'model_tarif' => 'ritase',
        'foto_unit' => UploadedFile::fake()->create('foto.txt', 1, 'text/plain'),
    ])->assertSessionHasErrors('foto_unit');
});

test('store armada menolak format gambar di luar daftar', function () {
    $this->post(route('fleet.armada.store'), [
        'unit_bisnis_id' => $this->unit->id,
        'kode_unit' => 'FOTO-GIF',
        'jenis' => 'dump_truck',
        'model_tarif' => 'ritase',
        'foto_unit' => UploadedFile::fake()->image('foto.gif', 320, 200)->mimeType('image/gif'),
    ])->assertSessionHasErrors('foto_unit');
});

test('update armada mengganti foto lama', function () {
    $armada = Armada::factory()->for($this->unit)->create(['kode_unit' => 'FOTO-UPDATE']);
    $oldFile = UploadedFile::fake()->image('old.png', 320, 200);
    $armada->addMedia($oldFile)->toMediaCollection('foto_unit');

    $this->put(route('fleet.armada.update', $armada), [
        'kode_unit' => 'FOTO-UPDATE',
        'jenis' => 'dump_truck',
        'model_tarif' => 'ritase',
        'foto_unit' => UploadedFile::fake()->image('new.png', 320, 200)->mimeType('image/png'),
    ])->assertRedirect(route('fleet.armada.index'));

    expect($armada->refresh()->getMedia('foto_unit'))->toHaveCount(1)
        ->and($armada->getFirstMedia('foto_unit')->file_name)->toBe('new.png');
});

test('form create dan edit armada memiliki input foto dengan force form data', function () {
    $create = file_get_contents(resource_path('js/Pages/Fleet/Armada/Create.jsx'));
    $edit = file_get_contents(resource_path('js/Pages/Fleet/Armada/Edit.jsx'));

    foreach ([$create, $edit] as $source) {
        expect($source)
            ->toContain('foto_unit: null')
            ->toContain('forceFormData: true')
            ->toContain('accept=".jpg,.jpeg,.png,.webp"')
            ->toContain('URL.createObjectURL')
            ->toContain('errors.foto_unit');
    }
});

test('index armada eager load media dan merender thumbnail ringan', function () {
    $controller = file_get_contents(app_path('Domain/Fleet/Http/Controllers/ArmadaController.php'));
    $index = str_replace("\r\n", "\n", file_get_contents(resource_path('js/Pages/Fleet/Armada/Index.jsx')));

    expect($controller)->toContain("'media'")
        ->and($index)->toContain('foto_thumb_url')
        ->and($index)->toContain('loading="lazy"')
        ->and($index)->toContain('decoding="async"')
        ->and($index)->toContain('h-10 w-10 object-cover')
        ->and($index)->toContain('ImagePreviewModal')
        ->and($index)->toContain('setFotoPreview({
                            src: a.foto_url,')
        ->and($index)->toContain('src={fotoPreview?.src}');
});

test('komponen preview gambar memakai modal', function () {
    $component = file_get_contents(resource_path('js/Components/ImagePreviewModal.jsx'));

    expect($component)
        ->toContain('@headlessui/react')
        ->toContain('DialogPanel')
        ->toContain('object-contain')
        ->toContain('onClose={onClose}');
});

test('detail armada menampilkan foto utama di informasi unit', function () {
    $show = file_get_contents(resource_path('js/Pages/Fleet/Armada/Show.jsx'));

    expect($show)
        ->toContain('Informasi Unit')
        ->toContain('foto_url')
        ->toContain('Foto unit belum tersedia')
        ->toContain("route('fleet.armada.edit', armada.id)")
        ->toContain('ImagePreviewModal')
        ->toContain('setFotoPreview({')
        ->toContain('src={fotoPreview?.src}');
});
