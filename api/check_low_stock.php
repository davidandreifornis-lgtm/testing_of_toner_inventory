<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/mailer.php';
auth_require_api();

try {
    // Optional: ?force=1 clears cooldown so you can retest immediately
    $force = !empty($_GET['force']);
    if ($force) {
        $cfg = mail_config();
        @file_put_contents($cfg['cooldown_file'] ?? (__DIR__ . '/../storage/low_stock_alerts.json'), '{}');
    }
    $result = notify_low_stock(db(), $force ? ['force' => true] : []);
    ok(['message' => 'Low-stock check complete', 'result' => $result]);
} catch (Throwable $e) {
    fail('Low-stock check failed: ' . $e->getMessage(), 500);
}
