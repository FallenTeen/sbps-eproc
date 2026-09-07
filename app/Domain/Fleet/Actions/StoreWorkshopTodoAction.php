<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\WorkshopTodo;
use App\Models\User;

/**
 * Bagian 21.9 — buat/ubah to-do servis rutin Workshop.
 * `created_by` dipertahankan saat update (milik pembuat pertama).
 */
class StoreWorkshopTodoAction
{
    public function execute(User $user, array $data, ?WorkshopTodo $todo = null): WorkshopTodo
    {
        $todo = $todo ?: new WorkshopTodo;

        $todo->fill($data);
        $todo->created_by = $todo->created_by ?? $user->id;
        $todo->save();

        return $todo->fresh();
    }
}