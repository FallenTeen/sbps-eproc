<?php

namespace App\Domain\Fleet\Actions;

use App\Domain\Fleet\Models\WorkshopTodo;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Bagian 21.9 — tandai to-do servis rutin selesai.
 */
class CompleteWorkshopTodoAction
{
    public function execute(WorkshopTodo $todo, User $user): WorkshopTodo
    {
        if ($todo->status === 'selesai') {
            throw ValidationException::withMessages([
                'status' => 'To-do ini sudah ditandai selesai.',
            ]);
        }

        $todo->update(['status' => 'selesai']);

        return $todo->fresh();
    }
}