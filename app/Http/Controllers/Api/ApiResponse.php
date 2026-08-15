<?php

namespace App\Http\Controllers\Api;

use App\Traits\ApiResponseTrait;

/**
 * Trait alias untuk standarisasi response API.
 *
 * Controller pada namespace Api cukup memakai `use ApiResponse;`
 * agar konsisten dengan Trait canonik di app/Traits.
 */
trait ApiResponse
{
    use ApiResponseTrait;
}
