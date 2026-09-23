<?php
/**
 * Write admin activity to dbo.toner_system_logs.
 * Logs the currently signed-in admin (or $actorOverride for login/logout).
 */
function activity_log(string $actionKey, string $actionLabel, array $extra = [], ?string $actorOverride = null): void {
    try {
        if (!function_exists('db')) {
            return;
        }
        $pdo = db();

        $username = $actorOverride;
        if ($username === null || $username === '') {
            $username = function_exists('auth_user') ? auth_user() : '';
        }
        $username = trim((string)$username);
        if ($username === '') {
            $username = 'system';
        }

        $fullName = (string)($extra['actorName'] ?? '');
        if ($fullName === '' && !empty($_SESSION['toner_full_name'])) {
            $fullName = (string)$_SESSION['toner_full_name'];
        }
        if ($fullName === '') {
            $fullName = $username;
        }

        $details = trim((string)($extra['details'] ?? ''));
        $ref = isset($extra['reference']) ? trim((string)$extra['reference']) : null;
        $item = isset($extra['itemCode']) ? strtoupper(trim((string)$extra['itemCode'])) : null;
        if ($item === '') $item = null;
        if ($ref === '') $ref = null;

        $pdo->prepare(
            'INSERT INTO dbo.toner_system_logs
             (action_key, action_label, details, reference_number, item_code, actor_username, actor_name, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, SYSUTCDATETIME())'
        )->execute([
            substr($actionKey, 0, 64),
            substr($actionLabel, 0, 128),
            $details !== '' ? substr($details, 0, 500) : null,
            $ref,
            $item,
            substr($username, 0, 128),
            substr($fullName, 0, 128),
        ]);
    } catch (Throwable $e) {
        if (function_exists('error_log')) {
            error_log('activity_log: ' . $e->getMessage());
        }
    }
}
