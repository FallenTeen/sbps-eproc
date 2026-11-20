<?php

namespace Tests\Feature\Domain\HR;

use App\Domain\HR\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class KaryawanAccountCreationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
        Permission::firstOrCreate(['name' => 'manage hr']);

        $this->actingAs(User::factory()->create()->givePermissionTo('manage hr'));
    }

    public function test_create_page_offers_existing_job_titles_and_account_roles(): void
    {
        Karyawan::factory()->create(['jabatan' => 'Operator AMP']);
        Role::firstOrCreate(['name' => 'Driver Armada', 'guard_name' => 'web']);

        $this->get(route('hr.karyawan.create'))
            ->assertInertia(fn ($page) => $page
                ->component('HR/Karyawan/Create')
                ->where('jabatanOptions', fn ($options) => collect($options)->contains('Operator AMP'))
                ->where('roles', fn ($roles) => collect($roles)->contains('user') && collect($roles)->contains('Driver Armada'))
            );
    }

    public function test_create_page_can_create_account_with_selected_role(): void
    {
        Role::firstOrCreate(['name' => 'Driver Armada', 'guard_name' => 'web']);

        $this->post(route('hr.karyawan.store'), [
            'nama' => 'Ayu Pratama',
            'tipe' => 'tetap',
            'jabatan' => 'Operator AMP',
            'status' => 'aktif',
            'create_account' => true,
            'account_email' => 'ayu.pratama@example.com',
            'account_password' => 'password123',
            'account_password_confirmation' => 'password123',
            'account_role' => 'Driver Armada',
        ])->assertRedirect(route('hr.karyawan.index'));

        $user = User::where('email', 'ayu.pratama@example.com')->firstOrFail();
        $karyawan = Karyawan::where('user_id', $user->id)->firstOrFail();

        $this->assertSame('Ayu Pratama', $user->name);
        $this->assertSame('Ayu Pratama', $karyawan->nama);
        $this->assertTrue($user->hasRole('Driver Armada'));
    }
}
