<?php

use App\Http\Controllers\Api\Middleware\CheckActiveRole;
use App\Http\Controllers\Api\Middleware\EnsureMobileToken;
use App\Http\Middleware\CheckDivisiAccess;
use App\Http\Middleware\EnsureIdempotency;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetActiveRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');
        $middleware->web(
            append: [
                SetActiveRole::class,
                HandleInertiaRequests::class,
                AddLinkHeadersForPreloadedAssets::class,

            ],
        );

        $middleware->alias([
            'permission' => PermissionMiddleware::class,
            'role' => RoleMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'divisi.access' => CheckDivisiAccess::class,
            'user.active' => EnsureUserIsActive::class,
            'mobile.auth' => EnsureMobileToken::class,
            'active.role' => CheckActiveRole::class,
            'idempotency' => EnsureIdempotency::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn(Request $request) => $request->is('api/*'),
        );
        $exceptions->respond(
            function (
                Response $response,
                Throwable $exception,
                Request $request
            ) {

                $status = $response->getStatusCode();

                if (
                    $request->is('api/*') ||
                    $request->expectsJson()
                ) {
                    return $response;
                }

                if ($status === 419) {
                    return back()->with([
                        'message' => 'Halaman kadaluarsa, silakan coba lagi.',
                    ]);
                }

                if (
                    app()->environment('staging') &&
                    in_array($status, [403, 404, 500, 503], true)
                ) {

                    try {
                        return Inertia::render('ErrorPage', [
                            'status' => $status,
                        ])
                            ->toResponse($request)
                            ->setStatusCode($status);
                    } catch (Throwable $renderException) {

                        Log::error('Gagal merender halaman ErrorPage', [
                            'status' => $status,
                            'error' => $renderException->getMessage(),
                        ]);

                        return $response;
                    }
                }

                return $response;
            }
        );
    })

    ->create();
