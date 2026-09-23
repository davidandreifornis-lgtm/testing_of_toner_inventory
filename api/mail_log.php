<?php
/**
 * Read / clear storage/mail.log — dynamic mail history for the UI.
 * Timestamps are interpreted as Asia/Manila (written by mail_log()).
 */
require_once __DIR__ . '/../config/bootstrap.php';
auth_require_api();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$logFile = __DIR__ . '/../storage/mail.log';

if ($method === 'DELETE') {
    if (is_file($logFile)) {
        file_put_contents($logFile, '');
    }
    ok(['cleared' => true, 'message' => 'Mail log cleared']);
}

if ($method !== 'GET') {
    fail('Method not allowed', 405);
}

$limit = max(1, min(200, (int)($_GET['limit'] ?? 50)));
$entries = [];

if (is_file($logFile) && is_readable($logFile)) {
    $raw = file_get_contents($logFile);
    if ($raw !== false && trim($raw) !== '') {
        $parts = preg_split('/\n---\s*\n/', $raw);
        foreach ($parts as $part) {
            $part = trim($part);
            if ($part === '') continue;
            $lines = preg_split('/\r\n|\r|\n/', $part);
            $meta = $lines[0] ?? '';
            $body = trim(implode("\n", array_slice($lines, 1)));

            $loggedAt = '';
            // [2026-09-21 08:15:30] ...
            if (preg_match('/^\[(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[+-]\d{2}:?\d{2})?)\]\s*(.*)$/s', $meta, $tm)) {
                $loggedAt = str_replace(' ', 'T', $tm[1]);
                $meta = trim($tm[2]);
            } elseif (preg_match('/\[(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[+-]\d{2}:?\d{2})?)\]/', $part, $tm)) {
                $loggedAt = str_replace(' ', 'T', $tm[1]);
            }

            $driver = '';
            $to = '';
            $subject = '';
            if (preg_match('/driver=(\S+)/', $meta, $m)) $driver = $m[1];
            if (preg_match('/to=(\S+)/', $meta, $m)) $to = $m[1];
            if (preg_match('/subject=(.+)$/m', $meta, $m)) $subject = trim($m[1]);

            $isError = (stripos($meta, 'ERROR') !== false)
                || (stripos($meta, 'FAILED') !== false)
                || (stripos($body, 'ERROR') !== false)
                || (stripos($part, 'FAILED') !== false);

            $entries[] = [
                'meta' => $meta,
                'driver' => $driver,
                'to' => $to,
                'subject' => $subject !== '' ? $subject : (stripos($meta . $body, 'Low-stock') !== false || stripos($meta . $body, 'low stock') !== false ? 'Low-stock alert' : 'System mail'),
                'bodyPreview' => mb_substr($body !== '' ? $body : $part, 0, 280),
                'ok' => !$isError,
                'raw' => $part,
                // Manila local wall-clock from log file (no Z → UI treats with +08:00)
                'loggedAt' => $loggedAt,
                'timezone' => 'Asia/Manila',
            ];
        }
        $entries = array_reverse($entries);
        $entries = array_slice($entries, 0, $limit);
    }
}

ok([
    'entries' => $entries,
    'count' => count($entries),
    'logFile' => 'storage/mail.log',
    'exists' => is_file($logFile),
]);
