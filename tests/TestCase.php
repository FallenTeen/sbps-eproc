<?php

namespace Tests;

use Database\Seeders\TestRoleSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected $seed = true;

    protected $seeder = TestRoleSeeder::class;
}
