<?php

namespace App\Policies;

use App\Models\AppVersion;
use App\Models\User;

class AppVersionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('manage app version');
    }

    public function update(User $user, AppVersion $appVersion): bool
    {
        return $user->hasPermissionTo('manage app version');
    }
}
