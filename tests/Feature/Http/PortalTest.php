<?php

use App\Models\User;
use Database\Seeders\DivisiRoleSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Foundation\Testing\TestCase;

uses(TestCase::class, LazilyRefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->seed(DivisiRoleSeeder::class);
});

function makePortalUser(array $roles): User
{
    $user = User::factory()->create(['is_active' => true]);

    foreach ($roles as $role) {
        $user->assignRole($role);
    }

    return $user;
}

// =========================================================
// Login Portal: Single-Role
// =========================================================

describe('Login Portal Single Role', function () {
    test('Security dapat login via portal admin dan active_role ter-set', function () {
        $user = makePortalUser(['Security']);

        $this->post(route('portal.login.store', 'admin'), [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect(route('dashboard'));

        $this->assertAuthenticatedAs($user);
        expect(session('active_role'))->toBe('Security');
        expect(session('portal'))->toBe('admin');
    });

    test('Ketua Divisi Armada tetap login via portal armada tanpa diarahkan ke pilih portal', function () {
        $user = makePortalUser(['Ketua Divisi Armada']);

        $this->post(route('portal.login.store', 'armada'), [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect(route('dashboard'));

        expect(session('active_role'))->toBe('Ketua Divisi Armada');
        expect(session('portal'))->toBe('armada');
    });

    test('Security tidak bisa login via portal armada', function () {
        $user = makePortalUser(['Security']);

        $this->post(route('portal.login.store', 'armada'), [
            'email' => $user->email,
            'password' => 'password',
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    });
});

// =========================================================
// Login Portal: Multi-Role → Pilih Portal
// =========================================================

describe('Pilih Portal Multi Role', function () {
    test('user multi-portal diarahkan ke halaman pilih portal tanpa session portal', function () {
        $user = makePortalUser(['Security', 'Koordinator SDM']);

        $this->post(route('portal.login.store', 'admin'), [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect(route('portal.pilih.index'));

        $this->assertAuthenticatedAs($user);
        expect(session('portal'))->toBeNull();
        expect(session('active_role'))->toBeNull();
    });

    test('GET portal-pilih menampilkan daftar portal yang cocok beserta matchedRole', function () {
        $user = makePortalUser(['Security', 'Koordinator SDM']);
        $this->actingAs($user);

        $response = $this->get(route('portal.pilih.index'));

        $response->assertOk();
        $response->assertInertia(
            fn ($page) => $page
                ->component('Portal/Select')
                ->has('portals', 2)
                ->where('portals.0.slug', 'admin')
                ->where('portals.0.matchedRole', 'Security')
                ->where('portals.1.slug', 'sdm')
                ->where('portals.1.matchedRole', 'Koordinator SDM')
        );
    });

    test('POST portal-pilih men-set session active_role dan portal', function () {
        $user = makePortalUser(['Security', 'Koordinator SDM']);
        $this->actingAs($user);

        $this->post(route('portal.pilih', 'sdm'))
            ->assertRedirect(route('dashboard'));

        expect(session('active_role'))->toBe('Koordinator SDM');
        expect(session('portal'))->toBe('sdm');
    });

    test('POST portal-pilih dengan portal yang tidak diizinkan ditolak 403', function () {
        $user = makePortalUser(['Security']);
        $this->actingAs($user);

        $this->post(route('portal.pilih', 'armada'))->assertStatus(403);
    });

    test('POST portal-pilih dengan portal tidak dikenal ditolak 404', function () {
        $user = makePortalUser(['Security']);
        $this->actingAs($user);

        $this->post(route('portal.pilih', 'tidak-ada'))->assertStatus(404);
    });

    test('user yang ternyata hanya cocok 1 portal langsung redirect dashboard', function () {
        $user = makePortalUser(['Security']);
        $this->actingAs($user);

        $this->get(route('portal.pilih.index'))
            ->assertRedirect(route('dashboard'));

        expect(session('active_role'))->toBe('Security');
        expect(session('portal'))->toBe('admin');
    });
});
