<?php

namespace App\Traits;

trait ApiResponseTrait
{
    /**
     * Standarisasi response sukses.
     */
    protected function success($data = null, string $message = 'Success', int $code = 200)
    {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    /**
     * Standarisasi response error.
     */
    protected function error(string $message = 'Error', int $code = 400, $errors = null)
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
            'errors' => $errors,
        ], $code);
    }
}
