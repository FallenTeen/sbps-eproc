<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class PushNotificationService
{
    protected $messaging;

    public function __construct()
    {
        $factory = (new Factory);

        $serviceAccount = config('services.firebase.service_account');
        if ($serviceAccount) {
            $factory = $factory->withServiceAccount($serviceAccount);
        }

        $this->messaging = $factory->createMessaging();
    }

    /**
     * Send push notification to a single device token.
     */
    public function sendToDevice(string $token, string $title, string $body, array $data = []): bool
    {
        try {
            $message = CloudMessage::withTarget('token', $token)
                ->withNotification(Notification::create($title, $body))
                ->withData($data);

            $this->messaging->send($message);
            return true;
        } catch (\Exception $e) {
            \Log::error('FCM send failed', ['token' => $token, 'error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Send push notification to multiple device tokens.
     */
    public function sendToMultiple(array $tokens, string $title, string $body, array $data = []): array
    {
        if (empty($tokens)) {
            return ['sent' => 0, 'failed' => 0];
        }

        $message = CloudMessage::new()
            ->withNotification(Notification::create($title, $body))
            ->withData($data);

        try {
            $report = $this->messaging->sendMulticast($message, $tokens);
            return [
                'sent' => $report->successes()->count(),
                'failed' => $report->failures()->count(),
            ];
        } catch (\Exception $e) {
            \Log::error('FCM multicast failed', ['error' => $e->getMessage()]);
            return ['sent' => 0, 'failed' => count($tokens)];
        }
    }
}
