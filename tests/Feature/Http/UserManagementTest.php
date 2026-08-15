<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->owner = User::factory()->create();
    $this->owner->assignRole('Owner');

    $this->adminKeuangan = User::factory()->create();
    $this->adminKeuangan->assignRole('Admin Keuangan');

    $this->user = User::factory()->create();
    $this->user->assignRole('Kontraktor');
});

test('owner can view user management index', function () {
    $this->actingAs($this->owner)
        ->get(route('users.index'))
        ->assertStatus(200);
});

test('admin keuangan can view user management index', function () {
    $this->actingAs($this->adminKeuangan)
        ->get(route('users.index'))
        ->assertStatus(200);
});

test('normal user cannot view user management', function () {
    $this->actingAs($this->user)
        ->get(route('users.index'))
        ->assertStatus(403);
});

test('owner can create user with role', function () {
    $data = [
        'name' => 'New User',
        'email' => 'newuser@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'Koordinator GCS',
        'is_active' => true,
    ];

    $this->actingAs($this->owner)
        ->post(route('users.store'), $data)
        ->assertRedirect();

    $user = User::where('email', 'newuser@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->hasRole('Koordinator GCS'))->toBeTrue();
});

test('owner can update user role', function () {
    $targetUser = User::factory()->create();
    $targetUser->assignRole('Kontraktor');

    $data = [
        'name' => $targetUser->name,
        'email' => $targetUser->email,
        'role' => 'Koordinator GCS',
        'is_active' => true,
    ];

    $this->actingAs($this->owner)
        ->put(route('users.update', $targetUser), $data)
        ->assertRedirect();

    $targetUser->refresh();
    expect($targetUser->hasRole('Koordinator GCS'))->toBeTrue();
});

test('owner cannot delete themselves', function () {
    $this->actingAs($this->owner)
        ->delete(route('users.destroy', $this->owner))
        ->assertRedirect()
        ->assertSessionHas('error');
});

test('owner can delete other user', function () {
    $targetUser = User::factory()->create();

    $this->actingAs($this->owner)
        ->delete(route('users.destroy', $targetUser))
        ->assertRedirect();

    $this->assertDatabaseMissing('users', ['id' => $targetUser->id]);
});

test('admin keuangan can assign role to user', function () {
    $targetUser = User::factory()->create();

    $this->actingAs($this->adminKeuangan)
        ->post(route('users.assign-role', $targetUser), ['role' => 'Koordinator CBP'])
        ->assertRedirect();

    $targetUser->refresh();
    expect($targetUser->hasRole('Koordinator CBP'))->toBeTrue();
});

test('inactive user cannot login', function () {
    $inactiveUser = User::factory()->create(['is_active' => false]);

    $this->post('/login', [
        'email' => $inactiveUser->email,
        'password' => 'password',
    ])->assertRedirect();

    $this->assertGuest();
});
